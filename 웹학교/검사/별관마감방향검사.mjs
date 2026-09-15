import fs from 'node:fs';
import assert from 'node:assert/strict';
import {mainClassroomsInterior} from '../본관교실.mjs';
import {buildWorld} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),source=JSON.stringify(data);
const original=mainClassroomsInterior(data,{orientationOverrides:false}),updated=mainClassroomsInterior(data);
assert.equal(JSON.stringify(original.rooms.filter(r=>r.roomId!=='4F_4-3')),JSON.stringify(updated.rooms.filter(r=>r.roomId!=='4F_4-3')));
const before=original.rooms.find(r=>r.roomId==='4F_4-3'),after=updated.rooms.find(r=>r.roomId==='4F_4-3');
assert.deepEqual(after.entry,before.entry);assert.equal(after.desks.length,24);assert.equal(after.chairs.length,24);
for(const type of ['desks','chairs'])for(let i=0;i<24;i++){
  assert(Math.abs(after[type][i].x+before[type][i].x-188)<1e-6);
  assert(Math.abs(after[type][i].y+before[type][i].y-13)<1e-6);
}
for(const box of before.boxes.filter(b=>/복도쪽|창 아래|나무창틀|원목 마루|천장/.test(b.name)))assert(after.boxes.some(b=>JSON.stringify(b)===JSON.stringify(box)),box.name);
assert(after.boxes.find(b=>b.name.endsWith('녹색 칠판')).bounds[0]>99);
const world=buildWorld(data),base=buildWorld(data,{annexFinish:false});
assert.equal(JSON.stringify(data),source);
assert.deepEqual(world.data.rooms,base.data.rooms);
assert.equal(JSON.stringify(world.classroomsMain),JSON.stringify(base.classroomsMain));
assert.equal(JSON.stringify(world.boxes.filter(b=>b.name.includes('층 사진참고'))),JSON.stringify(base.boxes.filter(b=>b.name.includes('층 사진참고'))),'본관 복도 마감 유지');
const details=world.boxes.filter(b=>b.name.includes('층 별관 사진마감'));
assert(details.length>0);assert.deepEqual([...new Set(details.map(b=>b.floor))],[1,2,3,4]);
for(const box of details){const b=box.bounds;assert(b[0]>=100&&b[3]<=103.1&&b[1]>=-73.1&&b[4]<=0,box.name);}
for(let floor=1;floor<=4;floor++){
  const z=(floor-1)*3.4;
  let p=world.move({x:101.5,y:-.5,z},0,-71);assert(Math.abs(p.y+71.5)<.01);
  p=world.move(p,0,71);assert(Math.abs(p.y+.5)<.01);
  assert(world.blocked(103,-30,z+1),'별관 창문 충돌 유지');
  const prefix=floor+'층 별관 사진마감 ';
  for(const feature of ['갈색 미끄럼방지 매트','창가 하부 파란 벽','붉은 창 세로틀','파란 보행 표시','수납장 선반'])
    assert(details.some(b=>b.name.startsWith(prefix)&&b.name.includes(feature)),feature);
}
console.log({ok:true,rotatedRoom:'4F_4-3',degrees:180,otherClassroomsPreserved:23,photoReferences:5,annexFloors:[1,2,3,4],mainCorridorPreserved:true,annexRoundTrips:true});
