import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';

const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
// Permanent, independent database. Never namespace by release/course version.
// Only a hash of a random browser cookie is stored; no IP, name or fingerprint.
export function createVisitorRecords({filename,production=false,origin,now=Date.now}={}){
 let db;
 if(filename){
  if(filename!==':memory:')fs.mkdirSync(path.dirname(filename),{recursive:true});
  db=new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;
   CREATE TABLE IF NOT EXISTS visitors(id TEXT PRIMARY KEY, first_day TEXT NOT NULL, last_day TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS visitor_days(day TEXT PRIMARY KEY, count INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS visitor_totals(id INTEGER PRIMARY KEY CHECK(id=1), count INTEGER NOT NULL, started_at TEXT NOT NULL);`);
  db.prepare('INSERT OR IGNORE INTO visitor_totals VALUES(1,0,?)').run(new Date(now()).toISOString());
 }
 const rates=new Map(),cookieName=production?'__Host-school_visitor':'school_visitor';
 const fail=(status,message)=>Object.assign(new Error(message),{status});
 const stats=()=>{const date=dayFormat.format(now()),all=db.prepare('SELECT count,started_at FROM visitor_totals WHERE id=1').get();return {today:db.prepare('SELECT count FROM visitor_days WHERE day=?').get(date)?.count??0,total:all.count,date,timeZone:'Asia/Seoul',counting:'unique-browser',startedAt:all.started_at};};
 const api=async(req,res)=>{
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/visitors'))return false;
  try{
   if(!db)throw fail(503,'접속 기록 저장소를 준비 중입니다.');
   const ip=production?(req.headers['x-forwarded-for']??req.socket.remoteAddress??'').split(',').pop().trim():req.socket.remoteAddress??'local';
   const time=now();let rate=rates.get(ip);if(!rate||rate.until<=time){rate={count:0,until:time+60000};rates.set(ip,rate);}
   if(++rate.count>600)throw fail(429,'잠시 후 다시 확인해주세요.');
   if(rates.size>4000)for(const [key,value] of rates)if(value.until<=time)rates.delete(key);
   if(rates.size>8000)rates.delete(rates.keys().next().value);
   if(req.method==='GET'&&url.pathname==='/api/visitors'){send(res,200,stats());return true;}
   if(url.pathname!=='/api/visitors/visit')throw fail(404,'없는 접속 기록 요청입니다.');
   if(req.method!=='POST')throw fail(405,'지원하지 않는 요청입니다.');
   const expected=origin??`${production?'https':'http'}://${req.headers.host}`;
   if(req.headers.origin!==expected||req.headers['sec-fetch-site']==='cross-site')throw fail(403,'학교 사이트에서 요청해주세요.');
   if(Number(req.headers['content-length']??0)!==0||req.headers['transfer-encoding'])throw fail(413,'요청 본문은 필요하지 않습니다.');
   let cookie=(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
   if(!/^[a-f0-9]{48}$/.test(cookie??''))cookie=randomBytes(24).toString('hex');
   const id=createHash('sha256').update(cookie).digest('hex'),day=dayFormat.format(time);
   db.exec('BEGIN IMMEDIATE');
   try{
    const visitor=db.prepare('SELECT last_day FROM visitors WHERE id=?').get(id);
    if(!visitor){db.prepare('INSERT INTO visitors VALUES(?,?,?)').run(id,day,day);db.prepare('UPDATE visitor_totals SET count=count+1 WHERE id=1').run();}
    if(!visitor||visitor.last_day<day){
     db.prepare('INSERT INTO visitor_days VALUES(?,1) ON CONFLICT(day) DO UPDATE SET count=count+1').run(day);
     if(visitor)db.prepare('UPDATE visitors SET last_day=? WHERE id=?').run(day,id);
    }
    db.exec('COMMIT');
   }catch(error){db.exec('ROLLBACK');throw error;}
   res.setHeader('Set-Cookie',`${cookieName}=${cookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${production?'; Secure':''}`);
   send(res,200,stats());
  }catch(error){send(res,error.status??500,{error:error.status?error.message:'접속 수를 잠시 확인할 수 없습니다.'});}
  return true;
 };
 api.close=()=>db?.close();return api;
}
