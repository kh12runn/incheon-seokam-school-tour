import assert from 'node:assert/strict';
import {World,Body,Plane,Vec3,Material} from '../외부도구/cannon-es.mjs';
import {createDriving,DRIVING_TUNING} from '../운전물리.mjs';
const checks=[];
for(const fps of [30,60,144]){
 const world=new World({gravity:new Vec3(0,0,-9.81)}),groundMaterial=new Material('ground');
 world.addBody(new Body({mass:0,material:groundMaterial,shape:new Plane(),position:new Vec3(0,0,-.6)}));
 const school={colliders:[],spawn:{x:0,y:0,z:-.6},candidate:(x,y)=>({x,y,z:-.6}),move:(p,dx,dy)=>({x:p.x+dx,y:p.y+dy,z:-.6})};
 const driving=createDriving(school,{world,groundMaterial,enableDrivingTerrain(){}}),car=driving.cars[0];
 let p=driving.point(car,-car.d.width/2-.62,.35);
 assert(driving.enter(p));
 const step=(input,seconds)=>{for(let i=0;i<Math.round(seconds*fps);i++){p=driving.update(1/fps,p,input);world.step(1/120,1/fps,12);driving.sync(1/fps);if(driving.phase==='driving')p=driving.seat();}};
 step({},2);assert.equal(driving.phase,'driving');car.body.position.set(0,0,car.body.position.z);car.body.aabbNeedsUpdate=true;
 step({forward:1},4);const acceleration=driving.getState().speed;assert(acceleration>11,'Exceeds previous top speed in four seconds');
 step({forward:1},4);const top=driving.getState().speed;assert(top>17&&top<DRIVING_TUNING.forwardSpeed+.2,'Higher governed speed');
 assert.equal(driving.exit(),false,'Cannot exit at speed');const before=car.body.position.clone();
 step({brake:true},2);assert(car.body.velocity.length()<.2,'Brakes stop fast vehicle');const stopDistance=before.distanceTo(car.body.position);assert(stopDistance<20,'Controlled stopping distance');
 step({forward:-1},4);assert(driving.getState().speed< -5&&driving.getState().speed> -DRIVING_TUNING.reverseSpeed-.2,'Reverse limit');
 step({brake:true},2);step({forward:1,right:.7},3);assert(Math.abs(driving.getState().yaw+Math.PI/2)>.1,'Steering still works');
 assert(car.body.vectorToWorldFrame(new Vec3(0,0,1)).z>.8,'Car remains upright');
 checks.push({fps,fourSecondKmh:+(acceleration*3.6).toFixed(1),topKmh:+(top*3.6).toFixed(1),stopDistance:+stopDistance.toFixed(2)});
}
console.log({ok:true,checks});
