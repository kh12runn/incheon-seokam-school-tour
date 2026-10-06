import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {MAGPIE_ID} from '../까치방사진배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),saved=JSON.stringify(data),world=buildWorld(data),c=world.specialInteriors.find(r=>r.roomId===MAGPIE_ID),[x,X,y,Y,z]=c.room.bounds;
assert.equal(JSON.stringify(data),saved);assert.equal(c.reference.count,22);assert.equal(c.reference.layoutVersion,2);
assert.equal(c.chairs.filter(q=>q.magpieStudent).length,8);assert.equal(c.chairs.filter(q=>q.office).length,2);
for(const q of c.chairs.filter(q=>q.magpieStudent)){
 assert.equal(q.scale,undefined,'No squashed child-size chair scaling');
 const back={x:Math.sin(q.angle),y:-Math.cos(q.angle)},away={x:q.x-c.table.x,y:q.y-c.table.y};
 assert(back.x*away.x+back.y*away.y>1,'Chair faces table, not the outside wall');
}
assert(!c.props.some(q=>q.type==='roundedTable'),'Old oval table removed');
const collider=c.colliders.find(b=>b.name==='까치방 조합탁자 충돌');assert(collider);
assert(collider.containsXY(c.table.x,c.table.y,.28));
assert(!collider.containsXY(c.table.x+.79,c.table.y+1.39,0),'No invisible rectangular corner around rounded end');
assert(c.boxes.some(b=>b.name.endsWith('TV 화면')));assert.equal(c.panels.length,2);
const tv=c.boxes.find(b=>b.name.endsWith('TV 화면')).bounds;
for(const p of c.panels)assert(p.x+p.width/2<tv[0]||p.x-p.width/2>tv[3],'TV and bulletin boards do not overlap');
for(const q of c.chairs)assert(world.blocked(q.x,q.y,z),'Chair collision '+q.name);
const route=[c.point(7,2.36),c.point(7,1.36),c.point(1.94,1.36),c.point(1.94,3.15),c.point(1.94,4.9),c.point(1.94,6.10)];
for(const fps of [30,60,144]){
 let p={...c.entry};
 for(const goal of [c.spawn,...route,...route.slice().reverse(),c.spawn,c.entry]){
  for(let i=0;i<fps*12;i++){
   const dx=goal.x-p.x,dy=goal.y-p.y,d=Math.hypot(dx,dy);if(d<.01)break;
   const step=Math.min(4.8/fps,d);p=world.move(p,dx/d*step,dy/d*step);
  }
  assert(Math.hypot(p.x-goal.x,p.y-goal.y)<.02,'Clear route to window workstations '+JSON.stringify({fps,p,goal}));
 }
}
console.log({ok:true,photos:22,studentChairs:8,officeChairs:2,chairsFaceTable:true,tableRoundedCollision:true,workstationRoundTrips:3,otherPlanPreserved:true});
