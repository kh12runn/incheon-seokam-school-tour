import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Vec3} from '../외부도구/cannon-es.mjs';
import {buildWorld} from '../이동물리.mjs';
import {REAR_GATE,rearGatePoint} from '../후문배치.mjs';
import {createFootballPhysics} from '../축구공물리.mjs';
import {createDriving} from '../운전물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),source=JSON.stringify(data),world=buildWorld(data);
assert(REAR_GATE.x>36&&REAR_GATE.y>18,'Behind-left when looking south at main building');
assert.equal(REAR_GATE.entryYaw,Math.PI,'Enter facing main building');
const barrier=world.boxes.find(b=>b.name==='정후문 사진 후문 차단기');assert(barrier.bounds[0]>66&&barrier.bounds[1]>20);
assert(!world.candidate(-21,15,-.6),'Old west gate closed by perimeter');
const booth=rearGatePoint(-19.5,20,-.6);assert(!world.candidate(booth.x,booth.y,booth.z));
for(const fps of [30,60,144])for(const x of [62.5,64,65.5]){
 let p={x,y:31,z:-.58};for(let i=0;i<fps*4;i++)p=world.move(p,0,-4/fps);assert(Math.abs(p.y-15)<.06,'South-facing entry');
 for(let i=0;i<fps*4;i++)p=world.move(p,0,4/fps);assert(Math.abs(p.y-31)<.06,'Exit via same gate');
}
const physics=createFootballPhysics(world,{count:0}),drive=createDriving(world,physics),car=drive.cars.find(c=>c.id==='rear-lamborghini');
let p=drive.point(car,-car.d.width/2-.62,.35);assert(drive.enter(p));
function tick(input={},frames=1){for(let i=0;i<frames;i++){const prev=p;p=drive.update(1/60,p,input);physics.update(1/60,p,prev,{canKick:false});drive.sync(1/60);if(drive.phase==='driving')p=drive.seat();}}
tick({},120);assert.equal(drive.phase,'driving');
car.body.position.set(REAR_GATE.x,30,-.06);car.body.quaternion.setFromAxisAngle(new Vec3(0,0,1),REAR_GATE.entryYaw);car.body.velocity.setZero();car.body.angularVelocity.setZero();car.body.aabbNeedsUpdate=true;car.body.wakeUp();
tick({},120);assert(Math.abs(car.body.position.y-30)<.2,'Outside approach supports entire car');
tick({forward:1},60);assert(car.body.position.y<18&&car.body.position.y>13,'Car crosses gate into rear parking');assert(Math.abs(car.body.position.x-REAR_GATE.x)<.25,'South-facing straight entry');
assert.equal(JSON.stringify(data),source,'No classroom changes');
console.log(JSON.stringify({ok:true,gate:REAR_GATE,walkFrameRates:[30,60,144],oldGateClosed:true,carEntry:{x:car.body.position.x,y:car.body.position.y,z:car.body.position.z},originalModelUnchanged:true}));
