import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld,localPoint} from '../이동물리.mjs';
import {createJumpMotion} from '../점프물리.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),before=JSON.stringify(source),world=buildWorld(source),baseline=buildWorld(source,{basement:false});
assert.equal(JSON.stringify(source),before,'Blender baseline unchanged');
assert.deepEqual(world.data.rooms.filter(r=>r.floor!=='0F'),baseline.data.rooms,'All aboveground rooms unchanged');
assert(JSON.stringify(world.classroomsMain)===JSON.stringify(baseline.classroomsMain),'Aboveground classroom geometry unchanged');
const stairs=world.stairs.filter(s=>s.basementAccess);assert.equal(stairs.length,1);assert.equal(stairs[0].id,'MAIN_STAIR_A');
assert(!world.surfaces.some(s=>s.name.startsWith('MAIN_STAIR_B 경사 -1')),'No central basement stair');
const stair=stairs[0],f=stair.frame,W=f.width,D=f.depth,FH=source.floorHeight;
const toilets=world.data.rooms.filter(r=>r.floor==='0F'&&r.type==='toilet'),hall=world.data.rooms.find(r=>r.id==='B1_MAIN_HALL');
assert.equal(toilets.length,2);
for(const r of toilets){
  assert(r.bounds[1]<=f.origin[0],'Toilets immediately right (west) of the south-facing stair exit');
  assert(hall.bounds[1]<=r.bounds[0],'Hall next to, beyond the toilets');
}
assert.equal(Math.max(...toilets.map(r=>r.bounds[1])),f.origin[0],'Toilets directly adjoin stairs');
assert.equal(Math.min(...toilets.map(r=>r.bounds[0])),hall.bounds[1],'Hall directly adjoins toilets');
let traversals=0;
for(const fps of [30,60,144]){
  const motion=createJumpMotion(world);let p=localPoint(f,3*W/4,-.6,0);
  function walkTo(q){
    for(let i=0;i<fps*15;i++){const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);if(d<.002)return;const step=Math.min(d,5.8/fps);p=motion.step(p,dx/d*step,dy/d*step,1/fps);assert(!motion.getState().airborne,'No jumping/falling needed');}
    assert.fail('Blocked '+JSON.stringify({p,target:q,fps}));
  }
  for(const [u,v] of [[3*W/4,.6],[3*W/4,D-.6],[W/4,D-.6],[W/4,.6],[W/4,-.6]])walkTo(localPoint(f,u,v));
  assert(Math.abs(p.z+FH)<.02);assert.equal(world.roomAt(p).floor,0);
  // Turn right off the stair, visit both toilets, then enter the adjacent hall.
  walkTo({x:1.25,y:1.5});
  for(const r of [...toilets].sort((a,b)=>b.entry.x-a.entry.x)){
    walkTo(r.entry);for(const q of r.interiorRoute)walkTo(q);
    for(const q of [...r.interiorRoute].reverse())walkTo(q);walkTo(r.entry);walkTo({x:r.entry.x,y:1.5});
  }
  for(const q of [{x:1.25,y:1.5},{x:-2,y:1.5},{x:-8.7,y:1.5},{x:-10.5,y:1.5}])walkTo(q);
  assert(Math.abs(p.z+FH)<.02,'Opposite wall area has no stage');assert.equal(world.roomAt(p).room.id,'B1_MAIN_HALL');
  walkTo({x:-11,y:1.5});walkTo({x:-11,y:-8});walkTo({x:-11,y:-13.5});
  assert(Math.abs(p.z+FH)<.02,'Gate exit is level with hall, no external stairs');
  let previousZ=p.z;
  for(let x=-10;x<=37;x+=1){walkTo({x,y:-13.5});assert(p.z>=previousZ-.005,'Uphill from gate toward rostrum');previousZ=p.z;}
  assert(Math.abs(p.z+.3)<.02,'Connects to existing yard near rostrum');
  for(const q of [{x:-11,y:-13.5},{x:-11,y:-8},{x:-11,y:1.5}])walkTo(q);
  walkTo({x:-8,y:1.5});walkTo({x:1.25,y:1.5});
  for(const r of world.data.rooms.filter(r=>r.floor==='0F'&&r.type==='toilet')){
    walkTo(r.entry);for(const q of r.interiorRoute)walkTo(q);for(const q of [...r.interiorRoute].reverse())walkTo(q);walkTo(r.entry);
    assert.equal(world.roomAt(r.interiorRoute[1]).room.id,r.id);
  }
  walkTo({x:1.25,y:1.5});
  for(const [u,v] of [[W/4,.6],[W/4,D-.6],[3*W/4,D-.6],[3*W/4,.6],[3*W/4,-.6]])walkTo(localPoint(f,u,v));
  assert(Math.abs(p.z)<.02,'Returned to first floor');traversals++;
}
assert.equal(world.roomAt({x:53.75,y:9,z:-.6}).floor,1,'Existing central rear parking passage stays aboveground');
assert.equal(world.roomAt({x:20,y:-20,z:-.6}).floor,1,'Playground is not basement');
for(const p of [{x:-16.99,y:1,z:-FH},{x:5,y:1,z:-FH},{x:-8,y:-7,z:-FH}])assert(world.blocked(p.x,p.y,p.z),'Basement exterior walls solid');
assert(!world.boxes.some(b=>b.name.includes('무대')&&b.spaceId==='B1_MAIN_HALL'),'No provisional stage or curtain');
assert(!world.boxes.some(b=>b.name.startsWith('다목적실 외부 디딤판')),'No external stair');
assert(world.blocked(-6,9.82,-FH),'Mirror wall remains solid');
console.log({ok:true,rightOfStairsToiletsThenHall:true,onlyWestStair:true,centralStairUnchanged:true,roundTripsWithoutJump:traversals,levelGateExit:true,uphillToRostrum:true,mirrorWallSolid:true,twoRestrooms:true,abovegroundRoomsUnchanged:true});
