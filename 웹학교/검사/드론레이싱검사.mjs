import assert from 'node:assert/strict';
import {createRace,raceOpponents} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {driverInput} from './레이싱테스트조작.mjs';
const drone=PARKED_CARS.find(c=>c.type==='drone'),report=[];
for(let round=1;round<=5;round++){
 let seed=100+round;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const race=createRace({car:drone,round,opponents:raceOpponents(round,random),random});
 for(let i=0;i<45000&&race.view().phase!=='finished';i++){
  race.update(1/60,driverInput(race,{skill:'expert'}));
  assert(Math.abs(race.player.height-race.course.trackPoint(race.player.s).height)<.1,'Drone follows the track elevation, no shortcuts');
 }
 assert.equal(race.view().phase,'finished','Finish round '+round);assert.equal(race.player.lap,3);
 report.push({round,time:race.view().time,rank:race.view().rank,laps:race.player.lap});
}
// Deterministic equal-speed guardrail contact: the drone loses more momentum.
function impact(source){
 const race=createRace({car:source,round:1,random:()=>.4});for(let i=0;i<13;i++)race.update(.25);race.obstacles.splice(0);
 const c=race.player,course=race.course;let s=10,curve=Infinity;for(let t=10;t<course.length;t++){const p=course.trackPoint(t);if(p.width>=9&&Math.abs(p.curve)<curve){curve=Math.abs(p.curve);s=t;}}
 const p=course.trackPoint(s),yaw=p.yaw-.4,scale=.7,halfW=(c.dimensions.width/2+.12)*scale,halfL=(c.dimensions.length/2-.18)*scale;
 let lo=0,hi=p.width/2;for(let i=0;i<30;i++){const m=(lo+hi)/2,q=course.trackPoint(s,m),out=Math.max(...[-halfL,0,halfL].map(d=>{const n=course.nearestTrack(q.x-Math.sin(yaw)*d,q.z-Math.cos(yaw)*d,s);return n.distance+halfW-n.width/2;}));if(out>-.002)hi=m;else lo=m;}
 const at=course.trackPoint(s,lo);Object.assign(c,{x:at.x,z:at.z,height:at.height,s,lane:lo,yaw,speed:20});race.update(1/120,{throttle:1});assert(c.wall>0);return c.speed;
}
const championImpact=impact(PARKED_CARS.find(c=>c.variant==='champion')),droneImpact=impact(drone);assert(droneImpact<championImpact*.8);
console.log(JSON.stringify({ok:true,report,championImpact,droneImpact}));
