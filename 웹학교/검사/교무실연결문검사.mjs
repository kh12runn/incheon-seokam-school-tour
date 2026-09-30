import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {exteriorClassSigns} from '../교사자리와창팻말.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),snapshot=JSON.stringify(data),w=buildWorld(data),staff=w.specialInteriors.find(r=>r.roomId==='2F_STAFF');
assert.equal(JSON.stringify(data),snapshot);assert.equal(staff.reference.count,12);assert.equal(staff.chairs.filter(c=>c.red).length,8);
assert.deepEqual(staff.workstations,{corridor:3,window:2,endWall:2});
assert.equal(staff.boxes.filter(b=>/검정 업무 모니터 0 /.test(b.name)).length,3);
assert.equal(staff.boxes.filter(b=>/검정 업무 모니터 1 /.test(b.name)).length,2);
assert.equal(staff.boxes.filter(b=>/왼쪽 끝 사무용 책상/.test(b.name)).length,2);
assert.equal(staff.boxes.filter(b=>/왼쪽 끝 듀얼 모니터/.test(b.name)).length,4);
assert.equal(staff.chairs.filter(c=>c.office).length,7);
for(const material of ['staff_floor','staff_ceiling','staff_fabric'])assert(staff.boxes.some(b=>b.material===material),material);
assert(w.boxes.filter(b=>b.spaceId==='2F_STAFF'&&/^(Wall_|Lintel_)/.test(b.name)).every(b=>b.material==='staff_wall'));
for(const word of ['흡입 격자','키캡','책장 파일','바구니 세로살','하부장 은색 손잡이'])assert(staff.boxes.some(b=>b.name.includes(word)),word);
assert.equal(staff.boxes.filter(b=>b.renderInDetails).length,4);
for(const b of staff.boxes)assert(b.bounds.slice(0,3).every((v,i)=>Number.isFinite(v)&&b.bounds[i+3]>v),b.name);
assert.equal(staff.chairs.filter(c=>!c.red).length,7);
assert.equal(staff.chairs.filter(c=>!c.red&&c.angle===Math.PI/2).length,2);
for(const word of ['흰 냉장고','전자레인지','커피머신','녹색 콤비','업무 파티션','긴 회의탁자'])assert(staff.boxes.some(b=>b.name.includes(word)),word);
for(const c of staff.colliders){const b=c.bounds;assert(w.blocked((b[0]+b[3])/2,(b[1]+b[4])/2,3.4),c.name);}
const route=[{x:47.55,y:1,z:3.4},staff.spawn,{x:47.55,y:-2.04,z:3.4},{x:53.22,y:-2.04,z:3.4},{x:53.22,y:-4.96,z:3.4},{x:47.55,y:-4.96,z:3.4},staff.spawn];
for(const fps of [30,60,144]){
  let p={...route[0]};for(const q of route.slice(1)){const from={...p},n=Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)/(4/fps));for(let i=0;i<n;i++)p=w.move(p,(q.x-from.x)/n,(q.y-from.y)/n);assert(Math.hypot(p.x-q.x,p.y-q.y)<.03,'Staff aisle '+JSON.stringify({p,q}));}
}
assert(w.blocked(37,-5.72,3.4),'Closed connecting door blocks');
for(let i=0;i<90;i++)w.officeDoor.update(1/60,{x:38.1,y:-5.72,z:3.4});
assert(w.officeDoor.angle>1.56);assert(!w.blocked(37,-5.72,3.4),'Open portal');
for(const pair of [[38.15,36.05],[36.05,38.15]]){let p={x:pair[0],y:-5.72,z:3.4};for(let i=0;i<60;i++){w.officeDoor.update(1/60,p);p=w.move(p,(pair[1]-pair[0])/60,0);}assert(Math.abs(p.x-pair[1])<.025,'Connecting doorway round trip '+JSON.stringify(p));}
for(let i=0;i<240;i++)w.officeDoor.update(1/60,{x:47,y:1,z:3.4});assert.equal(w.officeDoor.angle,0);assert(w.blocked(37,-5.72,3.4));
const meeting=w.specialInteriors.find(r=>r.roomId==='2F_OPERATIONS_MEETING');assert.equal(meeting.boxes.filter(b=>/서쪽 수납장 \d+$/.test(b.name)).length,5);
assert.equal(w.teacherChairs.length,41);assert.equal(exteriorClassSigns(w.data).length,41);
for(const c of w.teacherChairs){assert(w.blocked(c.x,c.y,c.z),c.roomId+' teacher chair solid');assert(w.data.rooms.some(r=>r.id===c.roomId&&r.type==='classroom'));}
for(const p of exteriorClassSigns(w.data)){assert(/^\d-\d+$/.test(p.text));assert.equal(p.width,1.02);assert.equal(p.height,.36);}
console.log({ok:true,staffPhotos:12,redConferenceChairs:8,photoFinishes:true,staffAisles:true,connectingDoorRoundTrip:true,cupboardsReducedFrom6To5:true,teacherChairs:41,windowSigns:41});
