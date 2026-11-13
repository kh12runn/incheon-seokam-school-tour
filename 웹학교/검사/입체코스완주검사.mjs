import assert from 'node:assert/strict';
import {getRaceCourse} from '../레이싱코스.mjs';
import {createRace,raceOpponents} from '../레이싱물리.mjs';
import {driverInput} from './레이싱테스트조작.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {createSchoolProgress,PROGRESS_KEY} from '../스쿨런저장.mjs';
const reports=[];
for(let round=1;round<=5;round++){
 const course=getRaceCourse(round);let maxCurve=0,maxSlope=0;
 for(let s=0;s<course.length;s+=.7){
  const p=course.trackPoint(s,1.8),q=course.nearestTrack(p.x,p.z,s);
  assert.ok(Math.abs(q.lane-1.8)<.05);assert.ok(Math.abs(q.height-p.height)<.06);assert.ok(Number.isFinite(p.height));
  maxCurve=Math.max(maxCurve,Math.abs(p.curve));maxSlope=Math.max(maxSlope,Math.abs(p.slope??0));
 }
 assert.ok(maxSlope<.4,'Car-safe slope');if(round>1)assert.ok(maxCurve<.15,'No impossible hairpins');
 let seed=41;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const race=createRace({round,car:PARKED_CARS.find(c=>c.id==='field-champion'),opponents:raceOpponents(round,random),random});
 for(let frame=0;frame<30*1200&&race.view().phase!=='finished';frame++)race.update(1/30,driverInput(race,{skill:'expert'}));
 assert.equal(race.view().phase,'finished',`Round ${round} must be drivable`);assert.ok(race.player.checkpoint>=race.view().checkpointsPerLap*3);
 assert.ok(Math.abs(race.player.height-course.trackPoint(race.player.s).height)<.05);
 reports.push({round,meters:Math.round(course.length),time:+race.view().time.toFixed(1),rank:race.view().rank,hits:race.view().hits,maxCurve:+maxCurve.toFixed(3),maxSlope:+maxSlope.toFixed(3)});
 console.log(JSON.stringify(reports.at(-1)));
}
const storage=new Map([[PROGRESS_KEY,JSON.stringify({version:1,stamps:24,bestRound:2,wins:2,awards:[]})]]),adapter={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
const p=createSchoolProgress(adapter);assert.equal(p.view().bestRound,2);p.win(3);p.record(3,250);p.record(3,300);assert.equal(p.view().bestTimes[3],250);assert.equal(createSchoolProgress(adapter).view().bestRound,3);assert.equal(p.view().stamps,24);
assert.equal(createSchoolProgress(adapter).view().bestTimes[3],250,'Personal best must survive reload');
console.log('All five 3-lap courses and persistent unlock/PB migration passed');
