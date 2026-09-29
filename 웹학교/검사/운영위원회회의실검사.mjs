import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {MEETING_ID} from '../운영위원회회의실.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),snapshot=JSON.stringify(data),world=buildWorld(data);
const room=world.specialInteriors.find(r=>r.roomId===MEETING_ID);
assert.equal(room.reference.count,6);assert.equal(room.chairs.length,11);
assert.equal(JSON.stringify(data),snapshot,'source data must not be mutated');
assert.deepEqual(room.room.bounds,[37,43,-7,0,3.4,6.55]);
assert.ok(room.boxes.every(b=>b.spaceId===MEETING_ID&&b.bounds.slice(0,3).every((n,i)=>n<b.bounds[i+3])));
assert.equal(world.blocked(40.03,-3.1,3.4),true,'meeting table is solid');
assert.equal(world.blocked(37.4,-2,3.4),true,'cupboard is solid');
assert.equal(world.blocked(38.9,-2,3.4),true,'chairs are solid');
// Corridor doorway and both side aisles remain continuous at the original floor height.
for(const [x,a,b] of [[39.1,1.0,-1.3],[38.15,-1.1,-6.2],[41.76,-1.2,-4.1]]){
  let p={x,y:a,z:3.4};for(let i=0;i<Math.ceil((a-b)/.05);i++)p=world.move(p,0,-.05);
  assert.ok(p.y<=b+.06,`aisle blocked at ${JSON.stringify(p)}`);assert.ok(Math.abs(p.z-3.4)<.001);
}
assert.equal(world.principalOffice.room.id,'2F_PRINCIPAL');
assert.ok(world.boxes.some(b=>b.name.includes('교실창 투명유리 Window_'+MEETING_ID)));
console.log(JSON.stringify({ok:true,photos:6,chairs:11,boxes:room.boxes.length,colliders:room.colliders.length,doorwayAndAisles:'pass'}));
