import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld,localPoint} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const world=buildWorld(data),checks=[];
const close=(a,b,epsilon=.07)=>assert(Math.abs(a-b)<epsilon,`${a} != ${b}`);
const go=(p,target)=>{const q=world.move(p,target.x-p.x,target.y-p.y);close(q.x,target.x);close(q.y,target.y);return q;};
assert(world.candidate(20,1.5,0));
for(let floor=1;floor<=4;floor++){
  const z=(floor-1)*3.4;
  let p={x:20,y:1.5,z};
  p=go(p,{x:101.5,y:1.5});p=go(p,{x:101.5,y:-71});close(p.z,z);
  // Large deltas must still stop at wall/window; no frame-rate tunneling.
  p=world.move({x:20,y:1.5,z},0,-40);assert(p.y>.2);
  p=world.move({x:101.5,y:-30,z},20,0);assert(p.x<102.8);
  p=go({x:23.5,y:1.5,z},{x:23.5,y:-5});close(p.z,z);
  p=go(p,{x:23.5,y:1.5});checks.push({floor,corridor:true,door:true,wall:true,window:true});
}
for(const stair of world.stairs){
  const f=stair.frame,W=f.width,D=f.depth;
  let p=localPoint(f,W/4,-.6,0);
  assert(world.candidate(p.x,p.y,p.z));
  for(let level=0;level<3;level++){
    for(const [u,v] of [[W/4,.6],[W/4,D-.6],[3*W/4,D-.6],[3*W/4,.6],[3*W/4,-.6]])p=go(p,localPoint(f,u,v));
    close(p.z,(level+1)*3.4);
    p=go(p,localPoint(f,W/4,-.6));
  }
  for(let level=3;level>0;level--){
    p=go(p,localPoint(f,3*W/4,-.6));
    for(const [u,v] of [[3*W/4,.6],[3*W/4,D-.6],[W/4,D-.6],[W/4,.6],[W/4,-.6]])p=go(p,localPoint(f,u,v));
    close(p.z,(level-1)*3.4);
  }
  checks.push({stair:stair.id,upFloors:3,downFloors:3});
}
for(const room of data.rooms.filter(r=>r.type==='classroom')){
  const [x0,x1,y0,y1,z]=room.bounds;
  const isAnnex=room.building==='ANNEX';
  const turned=world.classroomsMain.rooms.find(r=>r.roomId===room.id&&r.layoutRotation);
  const door=isAnnex?{x:101.5,y:y0+(y1-y0)*.35,z}:{x:x0+(x1-x0)*.35,y:1.5,z};
  let p={x:20,y:1.5,z};
  if(isAnnex){p=go(p,{x:101.5,y:1.5});p=go(p,door);const interior=world.classroomInteriors.find(r=>r.roomId===room.id);if(interior?.aisleRoute){for(const q of [...interior.aisleRoute,...[...interior.aisleRoute].reverse()])p=go(p,q);}else p=go(p,{x:96,y:door.y});}
  else {p=go(p,door);if(turned){for(const q of [...turned.entryWaypoints,turned.spawn])p=go(p,q);}else p=go(p,{x:door.x,y:(y0+y1)/2});}
  assert.equal(world.roomAt(p).room?.id,room.id);
  if(turned)for(const q of [...turned.entryWaypoints].reverse())p=go(p,q);
  p=go(p,door);
}
checks.push({all41ClassroomDoorsReachable:true});
let entrance={x:43.5,y:1.5,z:0};
for(const target of [{x:43.5,y:-3},{x:45,y:-3},{x:45,y:-9},{x:52,y:-9},{x:52,y:-14}])entrance=go(entrance,target);
assert(entrance.z<0);
for(const target of [{x:52,y:-9},{x:45,y:-9},{x:45,y:-3},{x:43.5,y:-3},{x:43.5,y:1.5}])entrance=go(entrance,target);
close(entrance.z,0);
checks.push({courtyardRoundTrip:true});
const report={ok:true,checks};
fs.writeFileSync(new URL('../../공간자료/웹이동검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
