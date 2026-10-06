import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Vec3} from '../외부도구/cannon-es.mjs';
import {buildWorld} from '../이동물리.mjs';
import {createFootballPhysics} from '../축구공물리.mjs';
import {createDriving,boardingPose,DRIVING_TUNING} from '../운전물리.mjs';
const school=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url)))),physics=createFootballPhysics(school,{count:0}),drive=createDriving(school,physics);
const car=drive.cars.find(c=>c.id==='rear-lamborghini'),saved=car.body.position.clone(),checks=[];
for(const phase of ['entering','exiting']){
 assert.equal(boardingPose(phase,.1).travel,0,'Door opens before body moves');
 assert.equal(boardingPose(phase,.9).travel,1,'Body clears doorway before door closes');
 for(let i=22;i<=78;i++)assert.equal(boardingPose(phase,i/100).door,1,'Open door throughout crossing');
 let last=boardingPose(phase,0).seatBlend;
 for(let i=1;i<=135;i++){const next=boardingPose(phase,i/135).seatBlend;assert(Math.abs(next-last)<.025,'No pose snap');last=next;}
}
for(const fps of [10,20,30,60,144]){
 car.body.position.copy(saved);car.body.quaternion.setFromAxisAngle(new Vec3(0,0,1),car.source.yaw);car.body.aabbNeedsUpdate=true;drive.sync();
 let p=drive.point(car,-car.d.width/2-.62,.35);assert(drive.enter(p));
 function tick(input={},frames=1){for(let i=0;i<frames;i++){const prev=p;p=drive.update(1/fps,p,input);physics.update(1/fps,p,prev,{canKick:false});drive.sync(1/fps);if(drive.phase==='driving')p=drive.seat();}}
 tick({},fps*2);assert.equal(drive.phase,'driving');
 // Real heightfield + all school obstacles, not the empty-plane speed unit test.
 car.body.position.set(20,-50,.27);car.body.quaternion.setFromAxisAngle(new Vec3(0,0,1),0);car.body.velocity.setZero();car.body.angularVelocity.setZero();car.body.aabbNeedsUpdate=true;car.body.wakeUp();
 tick({},fps*2);const start=car.body.position.clone(),time=physics.world.time;
 tick({forward:1},fps);const forward=car.body.position.y-start.y;
 assert(Math.abs(physics.world.time-time-1)<.009,'No discarded simulated time');
 assert(Math.abs(forward-DRIVING_TUNING.forwardSpeed)<.2,JSON.stringify({fps,forward,want:DRIVING_TUNING.forwardSpeed}));
 const reverseStart=car.body.position.y;tick({forward:-1},fps);const reverse=reverseStart-car.body.position.y;
 assert(Math.abs(reverse-DRIVING_TUNING.reverseSpeed)<.2,JSON.stringify({fps,reverse}));
 tick({},fps);assert(Math.abs(drive.getState().speed)<.01);drive.cancel();
 checks.push({fps,forwardMetersPerSecond:forward,reverseMetersPerSecond:reverse});
 console.log(checks.at(-1));
}
console.log({ok:true,realSchoolTerrain:true,smoothBoarding:true,checks});
