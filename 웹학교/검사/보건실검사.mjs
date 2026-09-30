import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),snapshot=JSON.stringify(data),w=buildWorld(data),n=w.specialInteriors.find(r=>r.roomId==='1F_NURSE');
assert.equal(JSON.stringify(data),snapshot);assert.equal(n.reference.count,16);assert.equal(n.beds.length,3);assert.equal(n.arches.length,2);assert.equal(n.stools.length,4);
assert.equal(n.boxes.filter(b=>/안정실 침대 하부/.test(b.name)).length,3);
for(const word of ['흰 냉장고','정수기','공기청정기','상담 컴퓨터','나무 약품 수납장','흰 유리 약품장','접은 이불','걷어둔 커튼','창가 처치대'])assert(n.boxes.some(b=>b.name.includes(word)),word);
assert(n.boxes.every(b=>b.floor===1&&b.interiorRoom==='1F_NURSE'));
for(const c of n.colliders){const b=c.bounds;if(b[2]<1.5)assert(w.blocked((b[0]+b[3])/2,(b[1]+b[4])/2,0),c.name);}
assert.equal(n.recoverySide,'right-from-entry');assert(n.beds.every(b=>59+b.x<62),'All beds are in the right-hand half (-X) when entering toward -Y');
const route=[{x:61.1,y:1,z:0},n.spawn,{x:62.9,y:-1.1,z:0},{x:62.9,y:-3.18,z:0},{x:62.9,y:-5.68,z:0},{x:62.9,y:-3.18,z:0},{x:60.45,y:-3.18,z:0},{x:60.45,y:-4.58,z:0},{x:59.55,y:-4.58,z:0},{x:60.45,y:-4.58,z:0},{x:60.45,y:-3.18,z:0},{x:62.9,y:-3.18,z:0},{x:62.9,y:-1.1,z:0},n.spawn,{x:61.1,y:1,z:0}];
for(const fps of [30,60,144]){
 let p={...route[0]};for(const q of route.slice(1)){const from={...p},steps=Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)/(4/fps));for(let i=0;i<steps;i++)p=w.move(p,(q.x-from.x)/steps,(q.y-from.y)/steps);assert(Math.hypot(p.x-q.x,p.y-q.y)<.03,'Nurse aisle '+JSON.stringify({p,q}));}
}
console.log({ok:true,photos:16,beds:3,arches:2,waitingStools:4,entranceTreatmentRecoveryRoundTrip:true,fps:[30,60,144]});
