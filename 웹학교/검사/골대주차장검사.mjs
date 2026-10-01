import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {PARKED_CARS,REAR_PARKING} from '../주차장.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const original=JSON.stringify(data),world=buildWorld(data),boxes=world.boxes;
const goals=boxes.filter(b=>b.name.startsWith('운동장 골대 가로대'));
assert.equal(goals.length,2);
assert.deepEqual(goals.map(b=>(b.bounds[1]+b.bounds[4])/2).sort((a,b)=>a-b),[-64,-16]);
for(const g of goals){assert.equal((g.bounds[0]+g.bounds[3])/2,38);assert(g.bounds[3]-g.bounds[0]>7);}
assert.equal(boxes.filter(b=>b.name.startsWith('운동장 골대 기둥')).length,4);
assert.equal(JSON.stringify(data),original);
const site=data.boxes.find(b=>b.name==='SiteGround').bounds,parking=boxes.filter(b=>b.name.startsWith('주차장'));
for(const p of parking){
  const [x,y,,xx,yy]=p.bounds;
  assert(x>=site[0]&&xx<=-9&&y>=site[1]&&yy<=-42,p.name+' must stay west of field and south of gate');
  for(const r of data.rooms){const [a,b,c,d]=r.bounds;assert(xx<=a||x>=b||yy<=c||y>=d,p.name+' overlaps room '+r.id);}
}
assert(!boxes.some(b=>b.name.startsWith('주차장 주차선')),'Unmarked field-side parking stays unmarked');
assert.equal(boxes.filter(b=>b.name.startsWith('주차장 자동차 차체')).length,5);
assert.equal(boxes.filter(b=>b.name.startsWith('후문 주차장 자동차 차체')).length,4);
assert.equal(boxes.filter(b=>b.name.startsWith('후문 주차선 ')).length,REAR_PARKING.spaces+2);
assert.equal(boxes.filter(b=>b.name.startsWith('후문 바퀴 멈춤턱 ')).length,16);
for(const car of PARKED_CARS){
  assert(!world.candidate(car.x,car.y,-.6),'Missing car collider '+car.id);
  const proxy=boxes.find(b=>b.vehicleId===car.id);
  assert(proxy?.renderInDetails,'Box proxy must not obscure detailed vehicle '+car.id);
}
assert(world.candidate(30,15,-.6));
const q=world.move({x:-20,y:15,z:-.6},79,0);
assert(Math.abs(q.x-59)<.07&&Math.abs(q.y-15)<.07,'Entry aisle blocked');
assert(!world.candidate(-18,-66.125,-.6),'Car does not block walking');
for(let y=-74;y<=-43;y+=.5)assert(world.candidate(-11.5,y,-.6),'Field-side parking aisle blocked at '+y);
assert(!world.candidate(19.875,21,-.6),'Rear vehicles restored');
for(let x=11;x<=60;x+=.5)assert(world.candidate(x,16,-.6),'Rear drive aisle blocked at '+x);
assert(world.candidate(20,-40,-.3),'Courtyard blocked');
const report={ok:true,goalEnds:'상하',goalCenters:goals.map(g=>[38,(g.bounds[1]+g.bounds[4])/2]),markedParkingSpaces:16,parkedCars:9,fieldCars:5,rearCars:4,rearPlacementEstimated:true,parkingLeftFacingMain:true,gateSlopeClear:true,entranceAisleClear:true,carCollision:true,sourceUnchanged:true};
fs.mkdirSync(new URL('../../output/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../../output/골대주차장검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(report);
