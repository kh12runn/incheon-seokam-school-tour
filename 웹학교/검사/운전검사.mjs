import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {createFootballPhysics} from '../축구공물리.mjs';
import {createDriving} from '../운전물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),before=JSON.stringify(data),school=buildWorld(data),physics=createFootballPhysics(school,{count:0}),driving=createDriving(school,physics);
assert.equal(JSON.stringify(data),before);assert.equal(driving.cars.length,11);
let p={...school.spawn};assert.equal(driving.nearby(p),null);assert.equal(driving.enter(p),false);
for(const c of driving.cars){const q=driving.point(c,-c.d.width/2-.62,.35),p=school.candidate(q.x,q.y,q.z);assert(p,c.id+' door accessible');assert(driving.enter(p),c.id+' can board');driving.cancel();}
const car=driving.cars.find(c=>c.id==='field-sedan-black'),door=driving.point(car,-car.d.width/2-.62,.35);p=school.candidate(door.x,door.y,door.z);assert(p);
assert.equal(driving.nearby(p)?.id,car.id);assert(driving.enter(p));
const tick=(input={},frames=1)=>{for(let i=0;i<frames;i++){const prev=p;p=driving.update(1/60,p,input);physics.update(1/60,p,prev,{canKick:false});driving.sync(1/60);if(driving.phase==='driving')p=driving.seat();}};
tick({},100);assert.equal(driving.phase,'driving');assert(driving.seated);
const start={...car.body.position};
// Turn within the parking aisle, before the playground's raised edge.
for(let i=0;i<180&&car.body.position.x<start.x+1.6;i++)tick({forward:1});
assert(car.body.position.x>start.x+1.5,'Forward movement follows vehicle heading');assert(car.body.velocity.length()>1,'Vehicle moves');
assert.equal(driving.exit(),false,'Cannot exit moving car');
assert(!school.candidate(car.body.position.x,car.body.position.y,car.body.position.z-.52),'Collider follows car');
const heading=driving.getState().yaw;
for(let i=0;i<80&&Math.abs(driving.getState().yaw-heading)<.08;i++)tick({forward:.5,right:.8});
assert(Math.abs(driving.getState().yaw-heading)>.05,'Steering changes heading');
tick({brake:true},180);assert(car.body.velocity.length()<1,'Brake stops car');
const exited=driving.exit();assert(exited,driving.error+' '+JSON.stringify({position:car.body.position,rotation:car.body.quaternion,door:driving.point(car,-car.d.width/2-.65,.35)}));tick({},100);assert.equal(driving.phase,'walking');assert(!driving.seated);assert(school.candidate(p.x,p.y,p.z),'Safe dismount');
assert(driving.enter(p));tick({},100);assert.equal(driving.phase,'driving','Can re-enter moved car');
// Fixed-speed reverse would hit the parking boundary in 90 frames. Check
// displacement in the free aisle; wall stopping is covered by 자동차속도검사.
const reverseStart=car.body.position.clone();
for(let i=0;i<90&&car.body.position.distanceTo(reverseStart)<1;i++)tick({forward:-1});
assert(car.body.position.distanceTo(reverseStart)>.8,'Reverse covers the clear aisle');
assert(driving.getState().speed<-.5,'Reverse gear moves backward');tick({brake:true},100);
const saved={...car.body.position};for(let i=0;i<30;i++)driving.update(1/60,p,{forward:1},{playing:false});assert.deepEqual({...car.body.position},saved,'Paused vehicle stays still');
const safe=driving.cancel();assert.equal(driving.phase,'walking');assert(school.candidate(safe.x,safe.y,safe.z));
console.log({ok:true,vehicles:11,boarding:true,driving:true,steering:true,braking:true,exit:true,reentry:true,dynamicCollision:true,paused:true});
