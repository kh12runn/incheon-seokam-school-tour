import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {buildWorld} from '../이동물리.mjs';
import {mainClassroomsInterior} from '../본관교실.mjs';
import {CLASS66_ID,applyClass66Details} from '../육학년육반.mjs';
import {CLASSROOM_PROFILES} from '../교실별특징.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),before=JSON.stringify(source);
const world=buildWorld(source),base=mainClassroomsInterior(world.data,{photoOverrides:false}),after=world.classroomsMain;
assert.equal(JSON.stringify(source),before);
assert.ok(JSON.stringify(after.rooms.filter(r=>r.roomId!==CLASS66_ID))===JSON.stringify(base.rooms.filter(r=>r.roomId!==CLASS66_ID)),'Other 23 main classrooms unchanged');
for(const config of base.rooms.filter(r=>r.roomId!==CLASS66_ID))assert.equal(applyClass66Details(config),config);
const room=after.rooms.find(r=>r.roomId===CLASS66_ID),original=base.rooms.find(r=>r.roomId===CLASS66_ID);
assert.deepEqual(room.desks,original.desks);assert.deepEqual(room.chairs,original.chairs);assert.deepEqual(room.spawn,original.spawn);assert.deepEqual(room.room,original.room);
assert.notDeepEqual(room.boxes,original.boxes);assert.equal(room.photoDetails.sourceCount,6);assert.equal(room.photoDetails.fanCount,4);
assert.equal(room.photoDetails.latches.length,18,'Approximate split locker banks, not an asserted surveyed count');
assert(!room.boxes.some(b=>/사물함 몸체$/.test(b.name)&&!b.name.includes('사진')),'Old continuous locker bank removed');
for(const label of ['돌출 수납장','밝은 매트','키 큰 수납장','거울','이동 교탁','접힌 체육 매트','롤블라인드','옷걸이'])assert(room.boxes.some(b=>b.name.includes(label)),label);
assert.equal(Object.values(CLASSROOM_PROFILES).filter(p=>p.photoStatus==='reviewed').length,1);
assert(world.candidate(room.spawn.x,room.spawn.y,room.spawn.z));
for(const b of room.colliders.filter(b=>b.name.includes('충돌 사진'))){
  const a=b.bounds;assert(world.blocked((a[0]+a[3])/2,(a[1]+a[4])/2,room.spawn.z),'New furniture blocks walking: '+b.name);
}
// Shared source and class 6-4 are untouched, including its real photo assets.
const root=new URL('../../',import.meta.url);
for(const file of ['웹학교/교실기본배치.mjs','웹학교/육학년사반.mjs','웹학교/육학년사반표현.mjs','웹학교/육학년사반사진마감.mjs','웹학교/학교구조.json']){
  const saved=execFileSync('git',['show','HEAD:'+file],{cwd:root,encoding:'utf8'});
  assert.equal(fs.readFileSync(new URL(file,root),'utf8').replace(/\r\n/g,'\n'),saved.replace(/\r\n/g,'\n'),file+' preserved');
}
console.log({ok:true,room:CLASS66_ID,photosReviewed:6,otherRoomsPreserved:23,class64Preserved:true,desks:room.desks.length,chairs:room.chairs.length,seatCountApproximate:true,splitLockerLatches:18,newFurnitureCollision:true,originalDataPreserved:true});
