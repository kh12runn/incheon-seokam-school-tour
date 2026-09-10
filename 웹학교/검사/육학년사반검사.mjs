import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {CLASS64_ID,CLASS64_SPAWN} from '../육학년사반.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const original=JSON.stringify(source),before=buildWorld(source,{class64:false}),after=buildWorld(source);
assert.equal(JSON.stringify(source),original,'Original model must remain immutable');
assert.deepEqual(after.data,before.data,'All room names and boundaries must remain unchanged');
assert.deepEqual(after.boxes.filter(b=>!b.name.startsWith('6-4 실내 ')),before.boxes,'No other room/corridor design changes');
assert.deepEqual(after.colliders.filter(b=>!b.name.startsWith('6-4 충돌 ')),before.colliders);
for(const b of after.classroom64.boxes){const a=b.bounds;assert.equal(b.spaceId,CLASS64_ID);assert(a[0]>=30&&a[3]<=40&&a[1]>=-7&&a[4]<=0&&a[2]>=10.2&&a[5]<=13.35,b.name+' out of room');}
assert(after.candidate(CLASS64_SPAWN.x,CLASS64_SPAWN.y,CLASS64_SPAWN.z));
for(const d of after.classroom64.desks)assert(after.blocked(d.x,d.y,10.2),'Desk collision '+d.id);
for(const c of after.classroom64.chairs)assert(after.blocked(c.x,c.y,10.2),'Chair collision '+c.id);
let p={x:33.5,y:1.5,z:10.2};
const paths=[[33.5,-3.5],[33.5,-4.37],[38.85,-4.37],[38.85,-2.34],[33.5,-2.34],[33.5,1.5]];
for(const [x,y] of paths){p=after.move(p,x-p.x,y-p.y);assert(Math.hypot(p.x-x,p.y-y)<.02,'Blocked aisle '+JSON.stringify({target:[x,y],p}));}
const report={ok:true,room:CLASS64_ID,otherRoomsAndCorridorsUnchanged:true,originalExportUnchanged:true,desks:after.classroom64.desks.length,chairs:after.classroom64.chairs.length,seatCountApproximate:true,deskChairCollision:true,entranceAndAisles:true,addedBoxes:after.classroom64.boxes.length};
fs.writeFileSync(new URL('../../공간자료/육학년사반검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(report);
