import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
const w=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))));
const c=w.specialInteriors.find(c=>c.roomId==='3F_BOOK_LIBRARY');
const desk=c.boxes.find(b=>b.name.endsWith('대출 데스크 상판')).bounds;
assert(Math.abs(desk[3]-desk[0]-.8)<1e-6);
assert(Math.abs(desk[4]-desk[1]-2.2)<1e-6,'Long axis follows entrance direction, not the corridor wall');
const screens=c.boxes.filter(b=>b.name.endsWith('대출 업무 PC 화면'));
assert.equal(screens.length,2);
assert(screens.every(b=>b.bounds[3]-b.bounds[0]<.02&&b.bounds[4]-b.bounds[1]>.5),'PC screens rotate with desk');
assert.equal(c.chairs.find(q=>q.name==='대출 업무 의자').angle,-Math.PI/2);
assert(w.blocked((desk[0]+desk[3])/2,(desk[1]+desk[4])/2,6.8),'Desk remains solid');
const route=[c.entry,c.spawn,{x:87,y:5.5,z:6.8},{x:87,y:8.8,z:6.8}];
for(const fps of [30,60,144])for(const points of [route,[...route].reverse()]){
 let p={...points[0]};
 for(const end of points.slice(1)){
  const start={...p},steps=Math.ceil(Math.hypot(end.x-start.x,end.y-start.y)/(5/fps));
  for(let i=0;i<steps;i++)p=w.move(p,(end.x-start.x)/steps,(end.y-start.y)/steps);
  assert(Math.hypot(p.x-end.x,p.y-end.y)<.03,'Door and main library aisle open');
 }
}
console.log({ok:true,deskSideFacesEntrance:true,monitorsRotated:true,staffChairRotated:true,entryAndAisleRoundTrip:true});
