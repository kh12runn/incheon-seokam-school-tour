import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createRaceRecords} from '../../관리도구/레이싱기록.mjs';
import {COURSE_VERSION} from '../레이싱코스.mjs';
import {createRace} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {driverInput} from './레이싱테스트조작.mjs';
const dir=fs.mkdtempSync(path.resolve('output','record-test-')),filename=path.join(dir,'records.sqlite');let clock=1000000;
let api=createRaceRecords({filename,now:()=>clock,origin:'http://school.test'});
const server=http.createServer(async(req,res)=>{if(!await api(req,res)){res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
async function call(route,data,cookie='',origin='http://school.test'){
 const r=await fetch(base+'/api/racing/'+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]??cookie};
}
const car=PARKED_CARS.find(c=>c.id==='field-champion');
const fixtures=[];
for(let round=1;round<=5;round++){
 const race=createRace({round,car}),proof=[];let sample=-2;
 for(let i=0;i<30*600&&race.view().phase!=='finished';i++){
  const state=race.update(1/30,driverInput(race,{skill:'expert'}));
  if((state.phase==='racing'||state.phase==='finished')&&(state.time-sample>1.5||state.phase==='finished')){sample=state.time;proof.push([state.time,race.player.finish!==null?race.course.length*3:race.player.s,race.player.x,race.player.z]);}
 }
 assert.equal(race.view().phase,'finished');fixtures.push({time:race.view().time,proof});
}
try{
 assert.equal((await call('start',{round:1,carId:car.id,version:COURSE_VERSION},'','http://evil.test')).status,403);
 assert.equal((await call('records?round=99')).status,400);
 for(let round=1;round<=5;round++){
  const start=await call('start',{round,carId:car.id,version:COURSE_VERSION});assert.equal(start.status,200);assert.ok(start.cookie.startsWith('race_player='));clock+=fixtures[round-1].time*1000+5000;
  assert.equal((await call('finish',{token:start.body.token,time:1,proof:[]},start.cookie)).status,400);
  const finish=await call('finish',{token:start.body.token,...fixtures[round-1]},start.cookie);assert.equal(finish.status,200,JSON.stringify(finish.body));
  assert.equal((await call('submit',{token:start.body.token,grade:6,classNumber:1,nickname:'<script>'},start.cookie)).status,400);
  const submit=await call('submit',{token:start.body.token,grade:6,classNumber:1,nickname:'검사선수'},start.cookie);assert.equal(submit.body.rank,1);
  assert.equal((await call('submit',{token:start.body.token,grade:6,classNumber:1,nickname:'검사선수'},start.cookie)).body.alreadySubmitted,true);
 }
 const results=await Promise.all(Array.from({length:14},async(_,i)=>{
  const start=await call('start',{round:2,carId:car.id,version:COURSE_VERSION});const scale=1+(14-i)/80,fixture=fixtures[1],time=fixture.time*scale,proof=fixture.proof.map(p=>[p[0]*scale,...p.slice(1)]);clock+=time*1000+5000;
  assert.equal((await call('finish',{token:start.body.token,time,proof},start.cookie)).status,200);
  return call('submit',{token:start.body.token,grade:5,classNumber:2,nickname:'기록'+i},start.cookie);
 }));
 assert.ok(results.every(r=>r.status===200));const before=(await call('records?round=2')).body.records;assert.equal(before.length,10);assert.ok(before.every((v,i)=>i===0||v.milliseconds>=before[i-1].milliseconds));
 api.close();api=createRaceRecords({filename,now:()=>clock,origin:'http://school.test'});assert.deepEqual((await call('records?round=2')).body.records,before,'Must persist after restart');
 const nextVersion=COURSE_VERSION+'-next-deployment';api.close();api=createRaceRecords({filename,now:()=>clock,origin:'http://school.test',courseVersion:nextVersion});
 const afterUpgrade=(await call('records?round=2')).body;assert.equal(afterUpgrade.version,nextVersion);assert.deepEqual(afterUpgrade.records,before,'A newer course/application version must retain the same leaderboard');
 const expired=await call('start',{round:1,carId:car.id,version:nextVersion});clock+=7300000;assert.equal((await call('finish',{token:expired.body.token,...fixtures[0]},expired.cookie)).status,400);
 console.log(JSON.stringify({ok:true,realPhysicsProofs:5,concurrentSubmissions:14,topTen:true,restartPersistence:true,upgradePersistence:true,duplicateAndInvalidBlocked:true,database:filename}));
}finally{await new Promise(r=>server.close(r));api.close();}
