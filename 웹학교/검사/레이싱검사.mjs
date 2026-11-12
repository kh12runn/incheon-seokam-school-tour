import assert from 'node:assert/strict';
import {createRace,trackPoint,TRACK,makeObstacles,roundRules,raceOpponents} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {profileFor,canUseCar,stampsFor,VEHICLE_PROFILES} from '../차량성능.mjs';
import {createSchoolProgress,PROGRESS_KEY} from '../스쿨런저장.mjs';
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
let p=createSchoolProgress(storage);for(let i=0;i<48;i++)assert.equal(p.stamp('task-'+i),true);assert.equal(p.stamp('task-47'),false);p=createSchoolProgress(storage);assert.equal(p.view().stamps,48);assert.ok(PARKED_CARS.every(c=>canUseCar(c,48)));assert.ok(!canUseCar(PARKED_CARS.find(c=>c.type==='sports'),23));p.win(3);assert.equal(createSchoolProgress(storage).view().bestRound,3);
memory.set(PROGRESS_KEY,'broken');assert.equal(createSchoolProgress(storage).view().stamps,0);assert.equal(createSchoolProgress({getItem(){throw Error();},setItem(){throw Error();}}).view().saved,false);
for(const normal of Object.values(VEHICLE_PROFILES).slice(0,7))for(const metric of ['speed','accel','launch','handling','grip','brake','resilience','boost'])assert.ok(VEHICLE_PROFILES.sports[metric]>normal[metric],metric);
for(let s=-20;s<TRACK.length*3;s+=.21){const a=trackPoint(s),b=trackPoint(s+.01),inner=trackPoint(s,-4.38),outer=trackPoint(s,4.38);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.011);assert.ok(Math.abs(Math.hypot(inner.x-a.x,inner.z-a.z)-4.38)<1e-8);assert.ok(Math.abs(Math.hypot(outer.x-a.x,outer.z-a.z)-4.38)<1e-8);}
// Rendered course edges must stay on the existing dirt, not the gate slope or
// the southern paved shelter strip. Values are from the campus field bounds.
for(let s=0;s<TRACK.length;s+=.2)for(const lane of [-5.75,5.75]){const p=trackPoint(s,lane);assert.ok(p.x>=-9.5&&p.x<=85.5&&p.z>=42&&p.z<=69,'Course leaves the dirt playground');}
let seed=83;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const source=PARKED_CARS[0],opponents=PARKED_CARS.filter(c=>c.type!=='sports').slice(1,6);
const r=createRace({car:source,opponents,random});const start=r.view();r.pause(true);r.update(.2,{throttle:1});assert.deepEqual(r.view().cars,start.cars);r.pause(false);
for(let i=0;i<600;i++)r.update(1/60,{throttle:1,steer:1});assert.ok(r.player.lane<=4.38);assert.ok(r.player.hits>0);
for(let i=0;i<100;i++){const obs=makeObstacles(5,random,r.cars);for(const o of obs){assert.ok([-3.2,0,3.2].includes(o.lane));assert.ok(r.cars.every(c=>Math.abs(((o.s-c.s+TRACK.length*1.5)%TRACK.length)-TRACK.length/2)>=13));}assert.ok(obs.length<=15);}
function drive(round,fps=60,car=source){seed=87;const race=createRace({car,opponents:raceOpponents(round,random),round,random});let count=0,maxGeneration=0;while(race.view().phase!=='finished'&&count++<fps*160){const c=race.player,lanes=[-3.2,0,3.2];const scores=lanes.map(l=>{let score=Math.abs(l-c.lane);for(const o of race.obstacles){const gap=(o.s-c.s+TRACK.length*100)%TRACK.length;if(gap<25&&Math.abs(l-o.lane)<2)score+=50-gap;}for(const other of race.cars.slice(1)){const gap=(other.s-c.s+TRACK.length*100)%TRACK.length;if(gap<10&&Math.abs(l-other.lane)<2)score+=20-gap;}return score;});const lane=lanes[scores.indexOf(Math.min(...scores))];race.update(1/fps,{throttle:1,steer:Math.max(-1,Math.min(1,(lane-c.lane)*2)),boost:!trackPoint(c.s).curve});maxGeneration=Math.max(maxGeneration,race.view().generation);}
 assert.equal(race.view().phase,'finished');assert.equal(race.player.lap,roundRules(round).laps);assert.equal(maxGeneration,roundRules(round).laps);return race.view();}
const results=[1,2,3,4,5].map(r=>drive(r));assert.ok(results[0].won,'beginner race must be winnable with normal car');
assert.ok(!results[4].won,'starter car should struggle against final-round rivals');
const champion=drive(5,60,PARKED_CARS.find(c=>c.variant==='champion'));assert.ok(champion.won,'top car should reward the same skilled driving with victory');assert.ok(champion.time<results[4].time*.85);
// Fixed simulation steps give identical movement at differing render rates.
const positions=[];for(const fps of [30,60,144]){seed=15;const race=createRace({car:source,opponents,random});for(let i=0;i<fps*10;i++)race.update(1/fps,{throttle:1});positions.push(race.player.s);}assert.ok(Math.max(...positions)-Math.min(...positions)<.25);
console.log(JSON.stringify({cars:PARKED_CARS.length,unlockSteps:[...new Set(PARKED_CARS.map(stampsFor))].sort((a,b)=>a-b),positions,championFinal:{rank:champion.rank,time:champion.time},rounds:results.map(r=>({round:r.round,rank:r.rank,laps:r.laps,time:r.time.toFixed(1),hits:r.hits}))},null,2));
