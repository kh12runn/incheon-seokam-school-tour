import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {BROADCAST_ID} from '../방송실사진배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),snapshot=JSON.stringify(data);
const before=buildWorld(data,{broadcastPhotos:false}),world=buildWorld(data,{broadcastControl:false}),room=world.specialInteriors.find(r=>r.roomId===BROADCAST_ID);
assert.equal(JSON.stringify(data),snapshot);assert.deepEqual(world.data.rooms,before.data.rooms);
assert.equal(room.reference.count,6);assert.equal(room.chairs.length,6);assert.equal(new Set(room.reference.imageIds).size,6);
assert.deepEqual(room.room.bounds,[56,64,-7,0,3.4,6.55]);
for(const key of ['classroomInteriors','principalOffice','centralStairFinish'])assert.equal(JSON.stringify(world[key]),JSON.stringify(before[key]),key+' unchanged');
for(const r of before.specialInteriors)assert(JSON.stringify(world.specialInteriors.find(s=>s.roomId===r.roomId))===JSON.stringify(r),'Other special room unchanged');
for(const id of ['2F_STAFF','2F_3-5','2F_OPERATIONS_MEETING','2F_AUDIO_VISUAL'])assert.deepEqual(world.boxes.filter(b=>b.spaceId===id),before.boxes.filter(b=>b.spaceId===id),id+' unchanged');
assert.equal(world.blocked(room.table.x,room.table.y,3.4),true,'Table collision');
for(const c of room.chairs)assert.equal(world.blocked(c.x,c.y,c.z),true,'Chair collision');
for(const [x,y] of [[61.2,-1.1],[56.6,-5.4],[56.6,-3.5],[63.4,-.8]])assert.equal(world.blocked(x,y,3.4),true,'Furniture collision');
const route=[{x:58.8,y:1,z:3.4},room.spawn,{x:58.8,y:-2.4,z:3.4},{x:57.6,y:-2.4,z:3.4},{x:57.6,y:-6.4,z:3.4},{x:57.6,y:-2.4,z:3.4},{x:62.6,y:-2.4,z:3.4},{x:62.6,y:-6.4,z:3.4}];
for(const fps of [30,60,144])for(const points of [route,[...route].reverse()]){
  let p={...points[0]};for(const target of points.slice(1)){
    const start={...p},n=Math.ceil(Math.hypot(target.x-p.x,target.y-p.y)/(5/fps));
    for(let i=0;i<n;i++)p=world.move(p,(target.x-start.x)/n,(target.y-start.y)/n);
    assert.ok(Math.hypot(p.x-target.x,p.y-target.y)<.025,'Door/aisle blocked '+JSON.stringify({fps,p,target}));assert.equal(p.z,3.4);
  }
}
assert.ok(world.boxes.some(b=>b.name.includes('교실창 투명유리 Window_'+BROADCAST_ID)));
assert.ok(room.boxes.every(b=>b.bounds.every(Number.isFinite)&&b.bounds.slice(0,3).every((n,i)=>n<b.bounds[i+3])));
assert.equal(world.roomAt(room.spawn).room.id,BROADCAST_ID);
console.log(JSON.stringify({ok:true,photos:6,chairs:6,roundTableCollision:true,furnitureCollision:true,doorAndAisles:true,frameRates:[30,60,144],otherRoomsUnchanged:true}));
