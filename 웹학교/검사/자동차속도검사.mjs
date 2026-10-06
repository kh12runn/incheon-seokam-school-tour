import assert from 'node:assert/strict';
import {World,Body,Plane,Box,Vec3,Material} from '../외부도구/cannon-es.mjs';
import {createDriving,DRIVING_TUNING} from '../운전물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {RUN_SPEED} from '../달리기모션.mjs';
assert.equal(DRIVING_TUNING.forwardSpeed,RUN_SPEED*3);assert.equal(DRIVING_TUNING.reverseSpeed,RUN_SPEED*2);
const checks=[];
for(const source of PARKED_CARS)for(const fps of [20,30,60,144]){
 const world=new World({gravity:new Vec3(0,0,-9.81)}),groundMaterial=new Material('ground');
 world.addBody(new Body({mass:0,material:groundMaterial,shape:new Plane(),position:new Vec3(0,0,-.6)}));
 const school={colliders:[],spawn:{x:0,y:0,z:-.6},candidate:(x,y)=>({x,y,z:-.6}),move:(p,dx,dy)=>({x:p.x+dx,y:p.y+dy,z:-.6})};
 const driving=createDriving(school,{world,groundMaterial,enableDrivingTerrain(){}}),car=driving.cars.find(c=>c.id===source.id);
 for(const other of driving.cars)if(other!==car)world.removeBody(other.body);
 let p=driving.point(car,-car.d.width/2-.62,.35),accumulator=0;
 assert(driving.enter(p));
 const step=(input,frames=1)=>{for(let i=0;i<frames;i++){p=driving.update(1/fps,p,input);accumulator+=1/fps;while(accumulator>=1/120-1e-9){world.step(1/120);accumulator-=1/120;}driving.sync(1/fps);if(driving.phase==='driving')p=driving.seat();}};
 step({},fps*3);assert.equal(driving.phase,'driving');
 const sample=(input,want)=>{
   step(input);assert(Math.abs(driving.getState().speed-want)<.35,`${source.id} ${fps}fps immediate speed: ${driving.getState().speed}, wanted ${want}`);
   step(input,fps);assert(Math.abs(driving.getState().speed-want)<.35,'No acceleration ramp');
   assert(car.vehicle.wheelInfos.every(w=>w.engineForce===0),'No engine acceleration');
 };
 sample({forward:1},RUN_SPEED*3);assert.equal(driving.exit(),false,'No exit while moving');
 sample({forward:-1},-RUN_SPEED*2);sample({forward:.2},RUN_SPEED*3);sample({forward:-.2},-RUN_SPEED*2);
 sample({forward:1,brake:true},0);sample({forward:0},0);sample({forward:.02},0);
 step({forward:1});const saved=car.body.velocity.clone();driving.update(1/fps,p,{forward:-1},{playing:false});assert.deepEqual(car.body.velocity,saved,'Paused input ignored');
 const heading=driving.getState().yaw;step({forward:1,right:.7},fps*2);assert(Math.abs(driving.getState().yaw-heading)>.08,'Steering retained');
 assert(car.body.vectorToWorldFrame(new Vec3(0,0,1)).z>.8,'Car stays upright');
 step({brake:true},fps);assert(driving.exit(),driving.error);step({},fps*2);assert.equal(driving.phase,'walking');
 assert(driving.enter(p));step({},fps*2);assert.equal(driving.phase,'driving');assert(Math.abs(driving.getState().speed)<.1,'Re-entry stays stopped');
 // A fixed input speed must not bypass collision response after the step.
 car.body.position.set(0,-8,car.body.position.z);car.body.quaternion.setFromAxisAngle(new Vec3(0,0,1),0);car.body.velocity.setZero();car.body.angularVelocity.setZero();car.body.aabbNeedsUpdate=true;
 world.addBody(new Body({mass:0,material:groundMaterial,shape:new Box(new Vec3(20,.25,3)),position:new Vec3(0,4,2)}));
 step({forward:1},fps*2);assert(car.body.position.y<4-car.d.length*.4,'Solid wall still blocks driving');
 checks.push({car:source.id,fps,instantForward:true,instantReverse:true,noAcceleration:true,collision:true});
}
console.log({ok:true,cases:checks.length,cars:PARKED_CARS.length,avatarMps:RUN_SPEED,forwardMps:DRIVING_TUNING.forwardSpeed,reverseMps:DRIVING_TUNING.reverseSpeed});
