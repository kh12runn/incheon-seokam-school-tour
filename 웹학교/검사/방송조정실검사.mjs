import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),snapshot=JSON.stringify(data);
const before=buildWorld(data,{broadcastControl:false}),world=buildWorld(data),room=world.specialInteriors.find(r=>r.roomId==='2F_BROADCAST');
assert.equal(JSON.stringify(data),snapshot,'No baseline mutation');
assert.deepEqual(world.data.rooms,before.data.rooms,'No rooms moved, including Korean class');
assert.equal(room.control.reference.count,6);assert.equal(room.control.reference.ownerConfirmed,true);
assert.equal(room.control.reference.sourceRoomId,'2F_KOREAN_CLASS');assert.equal(room.control.reference.targetRoomId,'2F_BROADCAST');
assert.equal(room.control.chairs.length,8);assert.equal(room.chairs.length,6);
assert.equal(room.boxes.filter(b=>/^방송 조정실 모니터 화면/.test(b.name)).length,3);
for(const key of ['classroomInteriors','principalOffice','centralStairFinish','stairs','surfaces'])assert.ok(JSON.stringify(world[key])===JSON.stringify(before[key]),key+' unchanged');
for(const r of before.specialInteriors.filter(r=>r.roomId!=='2F_BROADCAST'))assert(JSON.stringify(world.specialInteriors.find(s=>s.roomId===r.roomId))===JSON.stringify(r),'Other special room unchanged');
const unrelated=list=>list.filter(b=>b.spaceId!=='2F_BROADCAST'&&!b.name.includes('2F_BROADCAST'));
assert.deepEqual(unrelated(world.boxes),unrelated(before.boxes));
assert.deepEqual(unrelated(world.colliders),unrelated(before.colliders));
for(const [x,y] of [[57.4,-3],[59.75,-3.8],[59.8,-6.1],[62.1,-4.7],[60.31,-3.8]])assert.equal(world.blocked(x,y,3.4),true,'Solid furniture/glass '+[x,y]);
for(const c of [...room.chairs,...room.control.chairs])assert.equal(world.blocked(c.x,c.y,c.z),true,'Chair collision');
const route=[{x:58.8,y:1,z:3.4},room.spawn,{x:59.08,y:-1.65,z:3.4},{x:59.08,y:-6.3,z:3.4},{x:59.08,y:-1.04,z:3.4},{x:61.1,y:-1.04,z:3.4},{x:61.1,y:-2.6,z:3.4},{x:63.5,y:-2.6,z:3.4},{x:63.5,y:-6.3,z:3.4}];
for(const fps of [30,60,144])for(const points of [route,[...route].reverse()]){
  let p={...points[0]};for(const target of points.slice(1)){
    const start={...p},n=Math.ceil(Math.hypot(target.x-p.x,target.y-p.y)/(5/fps));
    for(let i=0;i<n;i++)p=world.move(p,(target.x-start.x)/n,(target.y-start.y)/n);
    assert.ok(Math.hypot(p.x-target.x,p.y-target.y)<.025,'Aisle/connection blocked '+JSON.stringify({fps,p,target}));assert.equal(p.z,3.4);
  }
}
const glass=room.boxes.find(b=>b.name.includes('스튜디오 투명 관찰 유리'));
assert.equal(glass.material,'clear_glass');
// Eye-level sightline through the observation pane must not hit opaque walls.
for(const x of [59.4,59.8,60.0,60.3,60.5,61,61.4,62]){
  const opaque=world.boxes.filter(b=>b.material!=='clear_glass'&&b.bounds[0]<x&&b.bounds[3]>x&&b.bounds[1]<-3.5&&b.bounds[4]>-3.5&&b.bounds[2]<5.02&&b.bounds[5]>5.02);
  assert.deepEqual(opaque.map(b=>b.name),[],'Observation line blocked at '+x);
}
assert.ok(room.boxes.every(b=>b.bounds.every(Number.isFinite)&&b.bounds.slice(0,3).every((n,i)=>n<b.bounds[i+3])));
assert.equal(world.roomAt(room.spawn).room.id,'2F_BROADCAST');
console.log(JSON.stringify({ok:true,sourcePhotos:6,correctedLocation:true,controlChairs:8,studioChairs:6,monitors:3,glassVisibleAndSolid:true,connectedWalkableRooms:true,frameRates:[30,60,144],otherRoomsUnchanged:true}));
