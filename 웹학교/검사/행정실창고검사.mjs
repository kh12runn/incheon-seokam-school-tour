import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {adminInterior,storageInterior} from '../행정실창고사진배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),before=JSON.stringify(data);
const w=buildWorld(data),report=[];
const fixtures=[
  {id:'1F_ADMIN',count:8,parts:['파란 파티션','흰 붙박이장','듀얼 모니터','석재 선반','검은 대기석 방석','올리브 블라인드','제어반','냉난방기'],blocked:[[54.16,-4],[58.5,-3],[50.5,-2]],route:[[53.15,1],[53.15,-5.7],[53.15,-.45],[57.6,-.45],[57.6,-5.4]]},
  {id:'1F_STORAGE_1',count:7,parts:['철제 적재 선반','높은 목재 보관대','보라색 출입문','매달린 LED','노출 배선','파란 적재 보드','물통','빗자루','분홍 천막'],blocked:[[38.7,5],[42.36,6.14],[44.3,7]],route:[[40.45,2],[40.45,4.2],[40.85,4.7],[40.85,8.5],[41.15,8.5]]}
];
for(const f of fixtures){
  const c=w.specialInteriors.find(r=>r.roomId===f.id);
  assert(c?.photoSupport);assert.equal(c.reference.count,f.count);assert.equal(new Set(c.reference.imageIds).size,f.count);
  assert(c.reference.approximateDimensions);assert(w.candidate(c.spawn.x,c.spawn.y,0),'Safe menu spawn: '+f.id);
  for(const text of f.parts)assert(c.boxes.some(b=>b.name.includes(text)),text);
  for(const [x,y] of f.blocked)assert(!w.candidate(x,y,0),'Furniture collision: '+[f.id,x,y]);
  let position={x:f.route[0][0],y:f.route[0][1],z:0};
  for(const [x,y] of f.route.slice(1)){
    position=w.move(position,x-position.x,y-position.y);
    assert(Math.hypot(position.x-x,position.y-y)<.02,'Door and aisle route: '+JSON.stringify({id:f.id,target:[x,y],position}));
  }
  for(const [x,y] of [...f.route].reverse().slice(1)){
    position=w.move(position,x-position.x,y-position.y);assert(Math.hypot(position.x-x,position.y-y)<.02,'Return to corridor');
  }
  for(const b of [...c.boxes,...c.colliders]){
    assert(b.bounds.every(Number.isFinite),b.name);
    for(let axis=0;axis<3;axis++)assert(b.bounds[axis+3]>b.bounds[axis],b.name+' positive size');
  }
  report.push({id:f.id,photos:f.count,boxes:c.boxes.length,colliders:c.colliders.length,roundTrip:true});
}
const storage=w.specialInteriors.find(c=>c.roomId==='1F_STORAGE_1');
for(const [type,count] of [['ladder',3],['wheelbarrow',1],['bucket',4],['caution',1]])assert.equal(storage.utilityProps.filter(p=>p.type===type).length,count);
assert.equal(storage.boxes.filter(b=>b.name.includes('매달린 LED')).length,4);
assert(!storage.boxes.some(b=>b.name.includes('형광등')),'Replace flush lamps, do not stack both lighting systems');
const untouched={name:'Wall_other',spaceId:'UNRELATED',bounds:[0,0,0,1,1,1],color:[1,0,0]};
const boxes=[untouched,...data.boxes],originals=JSON.stringify(data.boxes);
adminInterior(data,boxes);storageInterior(data,boxes);assert.equal(boxes[0],untouched);assert.equal(JSON.stringify(data.boxes),originals);
assert.equal(JSON.stringify(data),before,'Original plan unchanged');
const again=buildWorld(data);for(const f of fixtures)assert.deepEqual(again.specialInteriors.find(c=>c.roomId===f.id),w.specialInteriors.find(c=>c.roomId===f.id),'Deterministic, repeatable geometry');
console.log(JSON.stringify({ok:true,rooms:report,photos:15,sourceUnchanged:true,unrelatedRoomsUntouched:true}));
