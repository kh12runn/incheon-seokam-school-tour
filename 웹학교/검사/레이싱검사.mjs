import assert from 'node:assert/strict';
import {createRace,trackPoint,nearestTrack,TRACK,makeObstacles,roundRules,raceOpponents,RACE_ASSIST_CONFIG} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {canUseCar,stampsFor,VEHICLE_PROFILES} from '../차량성능.mjs';
import {createSchoolProgress,PROGRESS_KEY} from '../스쿨런저장.mjs';
import {driverInput} from './레이싱테스트조작.mjs';
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
let p=createSchoolProgress(storage);for(let i=0;i<48;i++)assert.equal(p.stamp('task-'+i),true);assert.equal(p.stamp('task-47'),false);p=createSchoolProgress(storage);assert.equal(p.view().stamps,48);assert.ok(PARKED_CARS.every(c=>canUseCar(c,48)));assert.ok(!canUseCar(PARKED_CARS.find(c=>c.type==='sports'),23));p.win(3);assert.equal(createSchoolProgress(storage).view().bestRound,3);
memory.set(PROGRESS_KEY,'broken');assert.equal(createSchoolProgress(storage).view().stamps,0);assert.equal(createSchoolProgress({getItem(){throw Error();},setItem(){throw Error();}}).view().saved,false);
for(const normal of Object.values(VEHICLE_PROFILES).slice(0,7))for(const metric of ['speed','accel','launch','handling','grip','brake','resilience','boost'])assert.ok(VEHICLE_PROFILES.sports[metric]>normal[metric],metric);
 assert.ok(TRACK.length>280,'Course must extend through the playground and rear lot');
for(let s=-20;s<TRACK.length*2;s+=.37){const a=trackPoint(s),b=trackPoint(s+.01);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.011);const near=nearestTrack(a.x,a.z,s);assert.ok(near.distance<.025);for(const lane of [-3,3]){const side=trackPoint(s,lane);assert.ok(Math.abs(Math.hypot(side.x-a.x,side.z-a.z)-3)<.01);}}
for(let i=1;i<=5;i++)assert.equal(roundRules(i).laps,3,'Every challenge round requires three full laps');
let seed=83;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const source=PARKED_CARS[0],opponents=PARKED_CARS.filter(c=>c.type!=='sports').slice(1,6);
const ready=r=>{for(let i=0;i<181;i++)r.update(1/60);};
const r=createRace({car:source,opponents:[],random});const start=r.view();r.pause(true);r.update(.2,{throttle:1});assert.deepEqual(r.view().cars,start.cars);r.pause(false);ready(r);
// Open-lane driving stays manual. Only an actual contact may turn W-only input
// into an escape; this is not a route-following autopilot for ordinary driving.
const startYaw=r.player.yaw;for(let i=0;i<60;i++){r.update(1/60,{throttle:1});assert.equal(r.player.assistActive,false);assert.ok(Math.abs(r.player.yaw-startYaw)<1e-9);}
let contacted=false;for(let i=0;i<1200;i++){r.update(1/60,{throttle:1});if(r.player.assistActive){contacted=true;break;}assert.ok(Math.abs(r.player.yaw-startYaw)<1e-9);}
assert.ok(contacted,'Forward-only wall contact must activate escape assistance');const contactStart={x:r.player.x,z:r.player.z,s:r.player.s};let maxEscape=0;
for(let i=0;i<360;i++){r.update(1/60,{throttle:1});maxEscape=Math.max(maxEscape,Math.hypot(r.player.x-contactStart.x,r.player.z-contactStart.z));if(r.player.assistActive){assert.ok(r.player.assistStrength<=RACE_ASSIST_CONFIG.maxStrength+.000001);assert.ok(r.player.speed<=r.player.profile.speed*RACE_ASSIST_CONFIG.speedRatio+.05);}}
assert.ok(maxEscape>4);assert.equal(r.player.resetSerial,0);assert.equal(r.player.lap,0);assert.notEqual(r.view().phase,'finished');
Object.assign(r.player,{x:79.17186903211827,z:61.5,yaw:-Math.PI/2,s:42.4997,lane:2.138,speed:0,steering:0,wall:.6,hit:0,started:true,checkpoint:3,nextCheckpoint:4,contact:0,obstacleContact:0,assistActive:false,assistStrength:0});
const blocked={x:r.player.x,z:r.player.z};for(let i=0;i<60;i++){r.update(1/60,{throttle:-1});assert.equal(r.player.assistActive,false);}assert.ok(Math.hypot(r.player.x-blocked.x,r.player.z-blocked.z)>1,'Reverse must escape a wall without automatic heading correction');assert.ok(Math.abs(r.player.yaw-startYaw)<1e-9);
const checkpoint=r.player.checkpoint;assert.equal(r.resetCar(),true);assert.equal(r.player.checkpoint,checkpoint);assert.equal(r.player.resetSerial,1);assert.equal(r.player.speed,0);
// Pressing right actually rotates the heading. No snapping when releasing keys.
const manualStartYaw=r.player.yaw;for(let i=0;i<45;i++)r.update(1/60,{throttle:1,steer:1});assert.ok(Math.atan2(Math.sin(r.player.yaw-manualStartYaw),Math.cos(r.player.yaw-manualStartYaw))<-.02);const manualYaw=r.player.yaw;assert.notEqual(manualYaw,trackPoint(r.player.s).yaw);
const reverse=createRace({car:source,opponents:[],random});ready(reverse);for(let i=0;i<600;i++)reverse.update(1/60,{throttle:-1});assert.equal(reverse.player.lap,0);assert.equal(reverse.player.started,false);
// Starting immediately before the finish without intermediate gates is not a lap.
const cheat=createRace({car:source,opponents:[],random});ready(cheat);cheat.player.started=true;cheat.player.nextCheckpoint=1;const pose=trackPoint(TRACK.length-.6);Object.assign(cheat.player,{x:pose.x,z:pose.z,yaw:pose.yaw,s:TRACK.length-.6,lane:0,speed:3});for(let i=0;i<45;i++)cheat.update(1/60,{throttle:1});assert.equal(cheat.player.lap,0);assert.equal(cheat.player.checkpoint,0);
const obstacleRace=createRace({round:5,car:source,opponents,random}),obstacleLength=obstacleRace.course.length;
for(let i=0;i<50;i++){const obs=makeObstacles(5,random,obstacleRace.cars);for(const o of obs){assert.ok(obstacleRace.cars.every(c=>Math.abs(((o.s-c.s+obstacleLength*1.5)%obstacleLength)-obstacleLength/2)>=15));assert.ok(Number.isFinite(o.x)&&Number.isFinite(o.z));const p=obstacleRace.course.trackPoint(o.s,o.lane);assert.ok(Math.hypot(p.x-o.x,p.z-o.z)<1e-8);}assert.ok(obs.length<=15);}
function drive(round,{fps=60,car=source,digital=false,randomSeed=87,skill='normal'}={}){
 seed=randomSeed;const race=createRace({car,opponents:raceOpponents(round,random),round,random});let count=0,maxGeneration=0;
 while(race.view().phase!=='finished'&&count++<fps*220){
  const previous=race.cars.map(c=>({recoveries:c.recoveries,s:c.s,checkpoint:c.checkpoint}));
  race.update(1/fps,driverInput(race,{digital,skill}));maxGeneration=Math.max(maxGeneration,race.view().generation);
  for(const c of race.cars)if(c.recoveries!==previous[c.id].recoveries){
   assert.notEqual(c.id,0,'The player must never be recovered automatically');assert.equal(c.checkpoint,previous[c.id].checkpoint,'AI recovery cannot award checkpoints');assert.ok(c.s<previous[c.id].s,'AI recovery must rewind');assert.ok(race.cars.every(other=>other===c||Math.hypot(c.x-other.x,c.z-other.z)>5.5),'AI recovery must not overlap other cars');
  }
 }
 const state=race.view();assert.equal(state.phase,'finished','Driver cannot finish: '+JSON.stringify({round,digital,time:state.time,cars:state.cars.map(c=>({id:c.id,s:c.s,speed:c.speed,lap:c.lap,checkpoint:c.checkpoint}))}));assert.equal(race.player.lap,3);assert.equal(maxGeneration,3);assert.ok(race.player.checkpoint>=state.checkpointsPerLap*3);assert.ok(race.cars.slice(1).every(c=>c.checkpoint>=state.checkpointsPerLap),'Every opponent must drive at least one complete lap, not remain stuck');return state;
}
const results=[1,2,3,4,5].map(round=>drive(round));assert.ok(results[0].won,'Beginner round must be winnable with a basic car and manual steering');assert.ok(!results[4].won,'Starter car should struggle against final-round rivals');
const champion=drive(5,{car:PARKED_CARS.find(c=>c.variant==='champion'),skill:'expert'});assert.ok(champion.won,'Top car and practiced manual cornering must make the final beatable');assert.ok(champion.time<results[4].time*.85);
const keyboard=drive(1,{digital:true});assert.ok(keyboard.won,'Normal keyboard inputs must complete the beginner round');
const traffic=drive(5,{car:PARKED_CARS.find(c=>c.variant==='champion'),randomSeed:42,skill:'expert'});assert.ok(traffic.won,'A different obstacle seed must not permanently jam the central merge');
const positions=[];for(const fps of [30,60,144]){const race=createRace({car:source,opponents:[],random});for(let i=0;i<fps*6;i++)race.update(1/fps,{throttle:1,steer:.2});positions.push({x:race.player.x,z:race.player.z,yaw:race.player.yaw});}for(const v of positions.slice(1))assert.ok(Math.hypot(v.x-positions[0].x,v.z-positions[0].z)<.15);
console.log(JSON.stringify({ok:true,manualSteering:true,manualOpenLane:true,contactEscapeAssist:true,reverse:true,orderedCheckpoints:true,courseMeters:TRACK.length,cars:PARKED_CARS.length,unlockSteps:[...new Set(PARKED_CARS.map(stampsFor))].sort((a,b)=>a-b),positions,keyboard:{rank:keyboard.rank,time:keyboard.time},championFinal:{rank:champion.rank,time:champion.time},rounds:results.map(r=>({round:r.round,rank:r.rank,laps:r.laps,time:r.time.toFixed(1),hits:r.hits}))},null,2));
