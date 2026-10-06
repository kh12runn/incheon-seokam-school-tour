import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {OUTDOOR_PHOTO_IDS} from '../야외사진세부.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')));
const details=world.boxes.filter(b=>b.name.startsWith('정문 사진 '));
assert.equal(OUTDOOR_PHOTO_IDS.length,62);
for(const name of ['초록 초소','파란 현관 차양','반사경 은색 면','게시판 흰 면','붉은 보행 구역','노란 유도 블록','안전콘','열린 파란 철문'])assert(details.some(b=>b.name.includes(name)),name);
for(const b of details){
  assert(b.bounds.every(Number.isFinite),b.name);
  for(let axis=0;axis<3;axis++)assert(b.bounds[axis+3]>b.bounds[axis],b.name);
  if(b.shape==='terrain')assert.equal(b.heights.length,4,b.name);
}
let p={x:-23,y:-13.5,z:-3.4};
for(let i=0;i<600;i++)p=world.move(p,.1,0);
assert(p.x>36.9,'Gate approach and uphill lane must remain open');
assert(Math.abs(p.z+.3)<.02,'Ramp reaches the field');
assert(!world.candidate(-20,-9,-3.4),'Guard booth must be solid');
assert(!world.candidate(-17.9,-16.35,-3.4),'Gate pillar must be solid');
assert(world.candidate(-11,-8,-3.4),'Existing hall entrance must remain open');
assert(!world.boxes.some(b=>b.name.startsWith('사진야외 본관 왼쪽')&&b.bounds[0]<27.9),'No seating across the ramp');
for(const name of ['쉼터','운동기구','흰 창고','울타리','흰 경기장'])assert(world.boxes.some(b=>b.name.startsWith('사진야외 보완 '+name)),name);
console.log({ok:true,reviewedPhotos:OUTDOOR_PHOTO_IDS.length,gateDetails:details.length,solidGateDetails:details.filter(b=>world.colliders.includes(b)).length,westGateToField:true,hallEntryOpen:true});
