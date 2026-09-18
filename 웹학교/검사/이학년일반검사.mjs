import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),before=JSON.stringify(source);
const world=buildWorld(source),base=buildWorld(source,{class21:false}),room=world.classroom21;
assert.equal(JSON.stringify(source),before);
assert.equal(room.roomId,'4F_2-1');assert.equal(room.photoCount,9);
assert.equal(room.desks.length,20);assert.equal(room.chairs.length,20);assert(room.seatCountIsApproximate);
assert(JSON.stringify(world.classroomsMain)===JSON.stringify(base.classroomsMain),'Main building classrooms unchanged');
assert(JSON.stringify(world.classroom64)===JSON.stringify(base.classroom64),'6-4 unchanged');
assert(JSON.stringify(world.boxes.filter(b=>b.interiorRoom!==room.roomId))===JSON.stringify(base.boxes),'No other room changed');
for(const box of room.boxes){
  assert.equal(box.interiorRoom,room.roomId);assert.equal(box.floor,4);
  assert(box.bounds.every(Number.isFinite));for(let i=0;i<3;i++)assert(box.bounds[i+3]>box.bounds[i],box.name);
}
assert.equal(room.boxes.filter(b=>/^2-1 사진 사물함 \d+-\d+$/.test(b.name)).length,30);
assert.equal(room.boxes.filter(b=>b.name.includes('듀얼 화면 외함')).length,2);
for(const furniture of [...room.desks,...room.chairs]){
  const b=furniture.bounds;assert(world.blocked((b[0]+b[3])/2,(b[1]+b[4])/2,room.spawn.z));
}
assert(world.candidate(room.spawn.x,room.spawn.y,room.spawn.z));
let p={x:101.5,y:room.spawn.y,z:room.spawn.z};
for(const target of [...room.aisleRoute,...[...room.aisleRoute].reverse(),{x:101.5,y:p.y},{x:101.5,y:-70.6375},{x:97,y:-70.6375},{x:101.5,y:-70.6375}]){
  p=world.move(p,target.x-p.x,target.y-p.y);assert(Math.hypot(p.x-target.x,p.y-target.y)<.07,'Classroom/computer entry remains open');
}
const entrance=world.boxes.filter(b=>b.name.startsWith('컴퓨터실 입구 사진'));
assert(entrance.length>0);assert(entrance.every(b=>b.floor===4));
console.log({ok:true,photosReviewed:10,class21SeatsApproximate:20,lockers:30,dualMonitors:true,furnitureSolid:true,otherClassroomsUnchanged:true,entrancesAccessible:true});
