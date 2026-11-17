import assert from 'node:assert/strict';
import {createRace,BOUNDARY_IMPACT_SPEED_RATIO} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
const dt=1/120,report=[];
assert.equal(BOUNDARY_IMPACT_SPEED_RATIO,.5);
for(let round=1;round<=5;round++)for(const side of [-1,1])for(const outward of [.3,1])for(const boost of [false,true]){
 const race=createRace({round,car:PARKED_CARS[0],random:()=>.4});for(let i=0;i<13;i++)race.update(.25);race.obstacles.splice(0);
 const c=race.player,course=race.course;let s=8,bend=Infinity;
 for(let at=8;at<course.length;at+=.5){const points=[-3,0,3].map(d=>course.trackPoint(at+d));if(points.some(p=>p.width<8))continue;const score=Math.max(...points.map(p=>Math.abs(p.curve)));if(score<bend){s=at;bend=score;}}
 assert(Number.isFinite(bend),'Find a gentle guardrail segment');
 const p=course.trackPoint(s),along=Math.sqrt(1-outward*outward),vx=p.tx*along+p.nx*side*outward,vz=p.tz*along+p.nz*side*outward,yaw=Math.atan2(-vx,-vz),scale=course.elevated?1:.7;
 const halfW=(c.dimensions.width/2+.12)*scale,halfL=(c.dimensions.length/2-.18)*scale;
 let lo=0,hi=p.width/2;
 for(let i=0;i<30;i++){const m=(lo+hi)/2,spot=course.trackPoint(s,side*m),outside=Math.max(...[-halfL,0,halfL].map(along=>{const near=course.nearestTrack(spot.x-Math.sin(yaw)*along,spot.z-Math.cos(yaw)*along,s);return near.distance+halfW-near.width/2;}));if(outside>-.002)hi=m;else lo=m;}
 const lane=side*lo,at=course.trackPoint(s,lane),speed=c.profile.speed*(boost?1.5:1);c.itemBoostTime=boost?3:0;
 Object.assign(c,{x:at.x,z:at.z,height:at.height,s,lane,yaw,speed,steering:0});const start={x:c.x,z:c.z};
 race.update(dt,{throttle:1});
 const ratio=c.speed/speed,distance=Math.hypot(c.x-start.x,c.z-start.z);
 assert(c.wall>0,'Fixture must really touch the boundary');assert(ratio>=.45&&ratio<=.51,`round ${round}/${side}: keep half of impact speed, got ${ratio}`);
 assert(distance>=speed*.4*dt,'Speed must correspond to real movement, not only HUD');
 let minimum=c.speed,maxOutside=0;
 for(let i=0;i<30;i++){
  race.update(dt,{throttle:1});minimum=Math.min(minimum,c.speed);
  for(const along of [-halfL,0,halfL]){const near=course.nearestTrack(c.x-Math.sin(c.yaw)*along,c.z-Math.cos(c.yaw)*along,c.s);maxOutside=Math.max(maxOutside,near.distance+halfW-near.width/2);}
 }
 assert(minimum>speed*.4,'Sustained rail contact must not repeatedly drop toward zero');assert(maxOutside<.026,'Keep the collision body inside the guardrail');assert.equal(c.hits,1,'One continuous scrape is one impact');
 for(let i=0;i<120;i++)race.update(dt,{brake:true});assert(Math.abs(c.speed)<.01,'Brakes still stop the car');assert.equal(c.lap,0);
 report.push({round,side,outward,boost,impactRatio:+ratio.toFixed(3),minimumSpeed:+minimum.toFixed(2),maxOutside:+maxOutside.toFixed(4)});
}
console.log(JSON.stringify({ok:true,report}));
