import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {GROUND_PLAN,applyGroundFloorPlan,LOBBY_OPEN} from '../일층배치.mjs';
import {ELEVATOR,elevatorDestination,nearElevator} from '../엘리베이터.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),before=JSON.stringify(source);
const world=buildWorld(source),data=world.data,changed=new Set([...GROUND_PLAN.map(r=>r.id),'1F_NUTRITION','1F_MAIN_LOBBY']);
for(const room of source.rooms.filter(r=>!changed.has(r.id)))assert.deepEqual(data.rooms.find(r=>r.id===room.id),room,'Unrelated room changed '+room.id);
assert.equal(data.rooms.filter(r=>r.type==='classroom').length,41);
assert.equal(JSON.stringify(source),before,'Exported baseline mutated');
assert.equal(applyGroundFloorPlan(data),data,'Correction not idempotent');
assert(!data.rooms.some(r=>r.id==='1F_NUTRITION'));
assert(!data.labels.some(l=>/영양교사실|영양사실|비품창고|교원휴게실/.test(l.text)&&l.floor===1));
const go=(p,x,y)=>{const q=world.move(p,x-p.x,y-p.y);assert(Math.hypot(q.x-x,q.y-y)<.07,'Blocked '+JSON.stringify({p,x,y,q}));return q;};
for(const item of GROUND_PLAN){
  const r=data.rooms.find(r=>r.id===item.id);assert.deepEqual(r.bounds,item.bounds);assert.equal(r.name,item.name);
  const [a,b,c,d]=r.bounds,x=a+(b-a)*.35,y=(c+d)/2;
  let p={x,y:1.5,z:0};assert(world.candidate(p.x,p.y,p.z));p=go(p,x,y);assert.equal(world.roomAt(p).room.id,r.id);go(p,x,1.5);
}
go({x:69,y:-3,z:0},81,-3); // No old printing/cart partition inside the merged cart room.
go({x:81.5,y:6,z:0},98.5,6); // No old nutrition/kitchen partition.
const lobbySamples=[];
for(const x of [41.5,43,45,47,48.5]){
  let p=go({x,y:1.5,z:0},x,-6);p=go(p,x,-8.8);assert(p.z<-.4);p=go(p,x,1.5);assert(Math.abs(p.z)<.01);lobbySamples.push(x);
}
assert.equal(LOBBY_OPEN.right-LOBBY_OPEN.left,8);
assert(world.blocked(50,-3,0),'Administrative office side wall removed');
assert(world.blocked(40,-3,0),'Classroom side wall removed');
const elevators=[];
for(const f of [1,2,3,4]){
  const p=elevatorDestination(f,data.floorHeight);assert.equal(p.x,78.5);assert(world.candidate(p.x,p.y,p.z));assert(nearElevator(p,data.floorHeight));
  assert(!nearElevator({x:101.5,y:1.5,z:p.z},data.floorHeight));
  assert(world.blocked(ELEVATOR.x,2.92,p.z));go({x:70,y:1.5,z:p.z},ELEVATOR.x,1.5);
  const parts=world.boxes.filter(b=>b.floor===f&&b.name.includes('엘리베이터'));
  assert(parts.length>10);assert(parts.every(b=>b.bounds[0]>76&&b.bounds[3]<81),'Old shaft remains');elevators.push({floor:f,landing:p});
}
for(const b of world.boxes)assert(b.bounds[3]>b.bounds[0]&&b.bounds[4]>b.bounds[1]&&b.bounds[5]>b.bounds[2],'Invalid geometry '+b.name);
const report={ok:true,unchangedClassrooms:41,otherRoomsUnchanged:true,originalExportUnchanged:true,rooms:GROUND_PLAN,lobbyWidth:8,lobbyWalkSamples:lobbySamples,elevators};
fs.writeFileSync(new URL('../../공간자료/일층배치검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(report);
