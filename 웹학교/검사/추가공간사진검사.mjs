import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {EXTRA_PHOTO_ROOMS} from '../추가공간사진배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),snapshot=JSON.stringify(data);
const w=buildWorld(data),before=buildWorld(data,{additionalPhotos:false}),ids=new Set(Object.keys(EXTRA_PHOTO_ROOMS));
assert.equal(JSON.stringify(data),snapshot);assert.deepEqual(w.data,before.data);assert.equal(ids.size,16);
for(const key of ['classroomInteriors','principalOffice','stairs','centralStairFinish'])assert(JSON.stringify(w[key])===JSON.stringify(before[key]),key+' unchanged');
assert.equal(JSON.stringify(w.surfaces.filter(s=>s.spaceId!=='3F_COUNSELING')),JSON.stringify(before.surfaces),'Only approved counseling entry floor added');
const keep=list=>list.filter(b=>b.spaceId&&!ids.has(b.spaceId)&&!ids.has(b.interiorRoom));assert(JSON.stringify(keep(w.boxes))===JSON.stringify(keep(before.boxes)),'Unrelated spaces unchanged');
const reports=[];
for(const id of ids){
 const c=w.specialInteriors.find(c=>c.roomId===id),b=c.room.bounds;
 assert(c.additionalRoom);assert.equal(c.reference.count,EXTRA_PHOTO_ROOMS[id].count);assert.equal(new Set(c.reference.imageIds).size,c.reference.count);assert(c.reference.peopleExcluded);
 for(const item of [...c.boxes,...c.colliders]){
  const a=item.bounds;assert(a.every(Number.isFinite)&&a.slice(0,3).every((n,i)=>a[i+3]>n),id+' valid '+item.name);
  const margin=item.entryDetail?.20:item.name.startsWith('사진실 외창')?.05:.00001;
  assert(a[0]>=b[0]-margin&&a[3]<=b[1]+margin&&a[1]>=b[2]-margin&&a[4]<=b[3]+margin&&a[2]>=b[4]-(item.entryDetail?.16:.00001)&&a[5]<=b[5]+.00001,id+' contained '+item.name);
 }
 assert(w.candidate(c.spawn.x,c.spawn.y,c.spawn.z),id+' spawn');
 if(c.entryNeedsConfirmation){assert.equal(before.candidate(c.entry.x,c.entry.y,c.entry.z),null,'Pre-existing blocked entry, not a new furniture regression');}
 for(const fps of (c.entryNeedsConfirmation?[]:[30,60,144]))for(const [start,end] of [[c.entry,c.spawn],[c.spawn,c.entry]]){
  let p={...start},n=Math.ceil(Math.hypot(end.x-start.x,end.y-start.y)/(5/fps));
  for(let i=0;i<n;i++)p=w.move(p,(end.x-start.x)/n,(end.y-start.y)/n);
  assert(Math.hypot(p.x-end.x,p.y-end.y)<.03,id+' doorway '+JSON.stringify({p,end}));
 }
 // Flood the walkable interior at 25 cm intervals from the real doorway. This
 // finds furniture rings which trap a player just inside an otherwise open door.
 const step=.25,queue=[c.spawn],seen=new Set(),reachable=[];
 const key=p=>Math.round((p.x-c.spawn.x)/step)+','+Math.round((p.y-c.spawn.y)/step);
 seen.add(key(c.spawn));
 for(let i=0;i<queue.length;i++){
  const p=queue[i];reachable.push(p);
  for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const q={x:p.x+dx,y:p.y+dy,z:p.z},k=key(q);if(seen.has(k))continue;seen.add(k);
   if(q.x<b[0]+.28||q.x>b[1]-.28||q.y<b[2]+.28||q.y>b[3]-.28||!w.candidate(q.x,q.y,q.z))continue;
   const moved=w.move(p,dx,dy);if(Math.hypot(moved.x-q.x,moved.y-q.y)<.02)queue.push(q);
  }
 }
 const spanX=Math.max(...reachable.map(p=>p.x))-Math.min(...reachable.map(p=>p.x)),spanY=Math.max(...reachable.map(p=>p.y))-Math.min(...reachable.map(p=>p.y));
 assert(spanX>(b[1]-b[0])*.35&&spanY>(b[3]-b[2])*.45,id+' interior accessible '+JSON.stringify({spanX,spanY}));
 for(const item of c.colliders){const a=item.bounds;if(a[2]<b[4]+1.4&&!item.stepSurface)assert(w.blocked((a[0]+a[3])/2,(a[1]+a[4])/2,b[4]),id+' furniture collision '+item.name);}
 reports.push({id,photos:c.reference.count,walkableCells:reachable.length,spanX,spanY,...(c.entryNeedsConfirmation?{existingEntryNeedsOwnerConfirmation:true}:{})});
}
const science=w.specialInteriors.find(c=>c.roomId==='2F_SCIENCE'),smart=w.specialInteriors.find(c=>c.roomId==='2F_INTELLIGENT_SCIENCE');
assert(science.room.bounds[3]<=0);assert(smart.room.bounds[2]>=3);
assert.equal(science.reference.sourceRoomId,'custom_2e406f7fc9c04811a92910bac20efbb8');assert.equal(smart.reference.sourceRoomId,'custom_852e6a5c10904a9ca5e29816f603f6be');
console.log(JSON.stringify({ok:true,rooms:reports,originalPlanAndOtherRoomsPreserved:true}));
