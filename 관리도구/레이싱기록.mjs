import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {getRaceCourse,COURSE_VERSION} from '../웹학교/레이싱코스.mjs';
import {PARKED_CARS} from '../웹학교/주차장.mjs';
import {profileFor,carName} from '../웹학교/차량성능.mjs';

const fail=(status,message)=>Object.assign(new Error(message),{status});
const digest=s=>createHash('sha256').update(s).digest('hex');
// Permanent storage namespace, deliberately equal to the first production
// namespace. Never derive this from COURSE_VERSION or reset it on deployment.
// Existing records must remain visible until the owner explicitly asks to reset.
export const RECORDS_NAMESPACE='2026-11-worlds-1';
export function createRaceRecords({filename,now=Date.now,production=false,origin,courseVersion=COURSE_VERSION}={}){
 if(!filename)return async(req,res)=>{if(!req.url.startsWith('/api/racing/'))return false;send(res,503,{error:'공용 기록 저장소를 준비 중입니다. 개인 기록은 기기에 저장돼요.'});return true;};
 if(filename!==':memory:')fs.mkdirSync(path.dirname(filename),{recursive:true});
 const db=new DatabaseSync(filename);db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;
 CREATE TABLE IF NOT EXISTS records(version TEXT, round INTEGER, participant TEXT, grade INTEGER, class INTEGER, nickname TEXT, car TEXT, milliseconds INTEGER, created INTEGER, PRIMARY KEY(version,round,participant));
 CREATE INDEX IF NOT EXISTS records_rank ON records(version,round,milliseconds,created);
 CREATE TABLE IF NOT EXISTS runs(token TEXT PRIMARY KEY, participant TEXT, round INTEGER, car TEXT, started INTEGER, expires INTEGER, result INTEGER, submitted INTEGER DEFAULT 0);
 `);
 const rates=new Map();
 function limit(key,max,period){const time=now();let row=rates.get(key);if(!row||row.until<time){row={count:0,until:time+period};rates.set(key,row);}if(++row.count>max)throw fail(429,'잠시 후 다시 시도해주세요.');if(rates.size>4000)for(const [k,v] of rates){if(v.until<time)rates.delete(k);}if(rates.size>8000)rates.delete(rates.keys().next().value);}
 function top(round){return db.prepare('SELECT grade,class,nickname,car,milliseconds,created FROM records WHERE version=? AND round=? ORDER BY milliseconds,created LIMIT 10').all(RECORDS_NAMESPACE,round).map((row,i)=>({...row,rank:i+1,carName:carName(PARKED_CARS.find(c=>c.id===row.car)??PARKED_CARS[0])}));}
 function roundValue(value){const r=Number(value);if(!Number.isInteger(r)||r<1||r>5)throw fail(400,'올바른 라운드를 선택해주세요.');return r;}
 function identify(req,res){
  const name=production?'__Host-race_player':'race_player',match=(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'=')),value=match?.slice(name.length+1);
  if(/^[a-f0-9]{48}$/.test(value??''))return digest(value);
  const id=randomBytes(24).toString('hex');res.setHeader('Set-Cookie',`${name}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${production?'; Secure':''}`);return digest(id);
 }
 async function body(req){if(req.headers['content-type']?.split(';')[0]!=='application/json')throw fail(415,'JSON 요청만 가능합니다.');let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>230000)throw fail(413,'기록 데이터가 너무 큽니다.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw fail(400,'잘못된 기록 요청입니다.');}}
 function validate(run,data){
  const course=getRaceCourse(run.round),car=PARKED_CARS.find(c=>c.id===run.car),p=profileFor(car),time=data.time,proof=data.proof;
  if(!Number.isFinite(time)||time<course.length*3/(p.speed*p.boost)*.92||time>3600||time*1000>now()-run.started+2500)throw fail(400,'완주 시간을 확인할 수 없습니다.');
  if(!Array.isArray(proof)||proof.length<12||proof.length>1900)throw fail(400,'완주 구간 기록이 부족합니다.');
  let last=null;
  for(const point of proof){
   if(!Array.isArray(point)||point.length!==4||point.some(n=>!Number.isFinite(n)))throw fail(400,'올바르지 않은 구간 기록입니다.');
   const [t,s,x,z]=point;if(t<0||t>time+.1)throw fail(400,'구간 시간이 올바르지 않습니다.');
   const at=course.nearestTrack(x,z,s);if(at.distance>at.width/2+3)throw fail(400,'코스를 벗어난 기록입니다.');
   if(last){const dt=t-last[0],advance=s-last[1];if(dt<=0||dt>6||advance>p.speed*p.boost*dt+5||advance< -p.speed*dt-8)throw fail(400,'구간 이동을 확인할 수 없습니다.');}
   else if(t>3||s>p.speed*3)throw fail(400,'출발 기록이 없습니다.');
   last=point;
  }
  if(time-last[0]>3||Math.abs(last[1]-course.length*3)>4)throw fail(400,'3바퀴 완주 기록이 없습니다.');
  return Math.round(time*1000);
 }
 const api=async(req,res)=>{
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/racing/'))return false;
  try{
   const ip=production?(req.headers['x-forwarded-for']??req.socket.remoteAddress??'').split(',').pop().trim():req.socket.remoteAddress??'local';limit('ip:'+ip,2400,60000);
   if(req.method==='GET'&&url.pathname==='/api/racing/records'){const round=roundValue(url.searchParams.get('round'));send(res,200,{round,version:courseVersion,records:top(round)});return true;}
   if(req.method!=='POST')throw fail(405,'지원하지 않는 요청입니다.');
   const expected=origin??`${production?'https':'http'}://${req.headers.host}`;
   if(req.headers.origin!==expected)throw fail(403,'학교 사이트에서 요청해주세요.');
   const participant=identify(req,res);limit('write:'+participant,90,60000);const data=await body(req);
   db.prepare('DELETE FROM runs WHERE expires<?').run(now());
   if(url.pathname==='/api/racing/start'){
    limit('start:'+participant,40,3600000);const round=roundValue(data.round),car=PARKED_CARS.find(c=>c.id===data.carId);if(!car||data.version!==courseVersion)throw fail(409,'새로고침 후 다시 출발해주세요.');
    const token=randomBytes(24).toString('hex');db.prepare('INSERT INTO runs(token,participant,round,car,started,expires) VALUES(?,?,?,?,?,?)').run(token,participant,round,car.id,now(),now()+7200000);send(res,200,{token,version:courseVersion});return true;
   }
   const run=typeof data.token==='string'?db.prepare('SELECT * FROM runs WHERE token=? AND participant=?').get(data.token,participant):null;
   if(!run)throw fail(400,'출발 기록이 만료되었습니다. 다시 도전해주세요.');
   if(url.pathname==='/api/racing/finish'){
    const milliseconds=run.result??validate(run,data);db.prepare('UPDATE runs SET result=? WHERE token=?').run(milliseconds,run.token);
    const records=top(run.round),qualifies=records.length<10||milliseconds<records[records.length-1].milliseconds;
    send(res,200,{milliseconds,qualifies,records});return true;
   }
   if(url.pathname==='/api/racing/submit'){
    if(!run.result)throw fail(400,'완주를 먼저 확인해주세요.');
    if(run.submitted){send(res,200,{records:top(run.round),alreadySubmitted:true});return true;}
    const {grade,classNumber}=data,nickname=typeof data.nickname==='string'?data.nickname.normalize('NFC').trim():'';
    if(!Number.isInteger(grade)||grade<1||grade>6||!Number.isInteger(classNumber)||classNumber<1||classNumber>20||!/^[-가-힣a-zA-Z0-9_ ]{2,12}$/.test(nickname))throw fail(400,'학년·반과 별명(한글·영문·숫자 2~12자)을 확인해주세요.');
    const recordParticipant=digest(participant+':'+grade+':'+classNumber+':'+nickname);
    db.exec('BEGIN IMMEDIATE');try{
     db.prepare(`INSERT INTO records VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(version,round,participant) DO UPDATE SET grade=excluded.grade,class=excluded.class,nickname=excluded.nickname,car=excluded.car,milliseconds=excluded.milliseconds,created=excluded.created WHERE excluded.milliseconds<records.milliseconds`).run(RECORDS_NAMESPACE,run.round,recordParticipant,grade,classNumber,nickname,run.car,run.result,now());
     db.prepare('DELETE FROM records WHERE version=? AND round=? AND participant NOT IN (SELECT participant FROM records WHERE version=? AND round=? ORDER BY milliseconds,created LIMIT 10)').run(RECORDS_NAMESPACE,run.round,RECORDS_NAMESPACE,run.round);
     db.prepare('UPDATE runs SET submitted=1 WHERE token=?').run(run.token);db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
    const rows=top(run.round),ordered=db.prepare('SELECT participant FROM records WHERE version=? AND round=? ORDER BY milliseconds,created LIMIT 10').all(RECORDS_NAMESPACE,run.round),index=ordered.findIndex(r=>r.participant===recordParticipant);
    send(res,200,{records:rows,rank:index<0?null:index+1});return true;
   }
   throw fail(404,'없는 기록 요청입니다.');
  }catch(error){send(res,error.status??500,{error:error.status?error.message:'기록 저장을 잠시 사용할 수 없습니다. 다시 시도해주세요.'});}return true;
 };
 api.close=()=>db.close();return api;
}
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
