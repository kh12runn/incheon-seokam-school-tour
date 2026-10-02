import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {AUDIO_ID} from '../시청각실사진배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),snapshot=JSON.stringify(data);
const original=buildWorld(data,{audioPhotos:false,centralStairPhotos:false}),world=buildWorld(data),audio=world.specialInteriors.find(r=>r.roomId===AUDIO_ID);
assert.equal(snapshot,JSON.stringify(data));assert.equal(audio.reference.count,6);assert.equal(audio.seats.length,90);
assert.deepEqual(world.data.rooms,original.data.rooms,'Room footprints/names unchanged');
assert.ok(JSON.stringify(world.classroomInteriors)===JSON.stringify(original.classroomInteriors),'Other classrooms unchanged');
assert.deepEqual(world.principalOffice,original.principalOffice,'Principal room and patrol unchanged');
for(const s of audio.seats)assert.equal(world.blocked(s.x,s.y,s.z),true,'Seat collision');
const go=(a,b)=>{
  let p={...a};const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.035);
  for(let i=0;i<n;i++)p=world.move(p,(b.x-a.x)/n,(b.y-a.y)/n);
  assert.ok(Math.hypot(p.x-b.x,p.y-b.y)<.04,`Walkway blocked: ${JSON.stringify({a,b,p})}`);return p;
};
let p={...audio.spawn};
// Check the whole route to the actual main corridor, not only the first door.
const exitRoute=[{x:-8.5,y:1.5,z:3.4},audio.spawn,{x:5,y:1.5,z:3.4}];
for(const route of [exitRoute,[...exitRoute].reverse()]){
  let q=route[0];for(const target of route.slice(1))q=go(q,target);
  assert.equal(q.z,3.4,'Exit stays on the second floor without jumping');
}
assert.equal(world.blocked(0,.3,3.4),true,'Wall outside the corridor doorway remains solid');
assert.equal(world.blocked(0,2.7,3.4),true,'Opposite door jamb remains solid');
assert.equal(world.roomAt(audio.spawn).room.id,AUDIO_ID,'Immediately inside the stair-side door is the auditorium');
assert.equal(audio.entryYaw,Math.PI/2,'Enter facing west; stage to the right (+Y)');
const stage=audio.boxes.find(b=>b.name==='시청각실 사진참고 목재 무대');
assert.ok(stage.bounds[1]>audio.spawn.y,'Stage on the right of the entry heading');
for(const y of [1.1,1.5,1.9])go({x:2,y,z:3.4},{x:-8.5,y});
p=go(p,{x:-8.5,y:1.5});p=go(p,{x:-8.5,y:6.15});p=go(p,{x:-8.5,y:7.65});
assert.ok(Math.abs(p.z-3.76)<.001,'Stage reached without jumping');
p=go(p,{x:-8.5,y:-6.05});assert.ok(Math.abs(p.z-3.4)<.001);
for(const x of [-13.4,-3.6])go({x,y:-6.05,z:3.4},{x,y:5.8});
const before=original.surfaces.filter(s=>s.name.startsWith('MAIN_STAIR_')),after=world.surfaces.filter(s=>s.name.startsWith('MAIN_STAIR_'));
assert.equal(before.length,after.length);
for(let i=0;i<before.length;i++){
  assert.equal(before[i].name,after[i].name);assert.deepEqual(before[i].bounds,after[i].bounds);
  const b=before[i].bounds;assert.equal(before[i].height((b[0]+b[3])/2,(b[1]+b[4])/2),after[i].height((b[0]+b[3])/2,(b[1]+b[4])/2));
}
for(const prefix of ['MAIN_STAIR_A','ANNEX_STAIR_D','ANNEX_STAIR_E'])assert.deepEqual(world.boxes.filter(b=>b.name.startsWith(prefix)),original.boxes.filter(b=>b.name.startsWith(prefix)),prefix+' untouched');
assert.equal(world.centralStairFinish.reference.target,'MAIN_STAIR_B');assert.equal(world.centralStairFinish.reference.photoCount,47);assert.equal(world.centralStairFinish.reference.imageIds.length,47);assert.equal(world.centralStairFinish.artworks.length,2);
assert.equal(world.centralStairFinish.signs.length,4);assert.equal(world.colliders.filter(b=>b.kind==='window_collision'&&b.centralStairFinish).length,3);
assert.equal(world.blocked(52.5,9.99,3),true,'Landing window remains solid');
assert.ok(world.colliders.some(b=>b.name==='MAIN_STAIR_B 중앙벽'),'Stair separator safety retained');
assert.ok(world.boxes.every(b=>b.bounds.length===6&&b.bounds.every(Number.isFinite)&&b.bounds.slice(0,3).every((v,i)=>v<b.bounds[i+3])),'Finite, positive geometry');
console.log(JSON.stringify({ok:true,photos:53,seats:90,seatCollision:true,stageAndAisles:true,auditoriumCorridorRoundTrip:true,originalStairSurfacesUnchanged:true,otherRoomsUnchanged:true,centralStairFloors:4,landingWindows:3}));
