import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {createFootballPhysics} from '../축구공물리.mjs';
import {createDriving} from '../운전물리.mjs';
import {DELIVERY_COURSES} from '../미션배송.mjs';
const school=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),{interactiveDoors:true}),physics=createFootballPhysics(school,{count:0}),drive=createDriving(school,physics);
const results=[];
for(const course of DELIVERY_COURSES){
 drive.prepareMissionCar(course.carId,course.launch);const car=drive.cars.find(c=>c.id===course.carId);
 let p=drive.point(car,-car.d.width/2-.62,.35);assert(school.candidate(p.x,p.y,p.z));assert(drive.enter(p));
 const dt=1/30;
 function tick(input={}){const previous=p;p=drive.update(dt,p,input);physics.update(dt,p,previous,{canKick:false});drive.sync(dt);if(drive.phase==='driving')p=drive.seat();}
 for(let i=0;i<120;i++)tick();assert.equal(drive.phase,'driving');
 for(const target of [...course.checkpoints,course.park]){
  let reached=false;
  for(let i=0;i<900;i++){
   const cp=drive.point(car,0,0),delta=course.id==='rear'?target.x-cp.x:target.y-cp.y;
   if(Math.hypot(cp.x-target.x,cp.y-target.y)<.8){reached=true;break;}
   tick({forward:Math.sign(delta)});
  }
  assert(reached,'real vehicle cannot reach '+JSON.stringify({course:course.id,target,actual:drive.point(car,0,0)}));
 }
 for(let i=0;i<45;i++)tick();assert(Math.abs(drive.getState().speed)<.01);assert(drive.exit());for(let i=0;i<60;i++)tick();assert.equal(drive.phase,'walking');
 // Walk clear of the car nose before delivering at the side of the course.
 const park=drive.point(car,0,0),detour=course.id==='rear'?{x:park.x+3,y:p.y,z:p.z}:{x:p.x,y:park.y+3,z:p.z};
 for(const target of [detour,course.drop]){
  for(let i=0;i<1500;i++){const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);if(d<.05)break;p=school.move(p,dx/d*Math.min(d,.08),dy/d*Math.min(d,.08));if(i===1499)assert.fail('Unloading blocked '+JSON.stringify({p,target}));}
 }
 assert(Math.hypot(p.x-course.drop.x,p.y-course.drop.y)<.1);results.push({course:course.label,boarded:true,checkpoints:course.checkpoints.length,parked:true,unloaded:true});
}
console.log({ok:true,realSchoolPhysics:true,results});
