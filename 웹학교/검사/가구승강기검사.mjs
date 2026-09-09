import fs from 'node:fs';
import assert from 'node:assert/strict';
import {shoeCabinets} from '../사진참고마감.mjs';
import {elevatorDestination,nearElevator} from '../엘리베이터.mjs';
import {buildWorld} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),world=buildWorld(data),checks=[];
for(const floor of [1,2,3,4]){
  const cabinets=shoeCabinets(data,floor);
  const expected=floor<=2?0:data.rooms.filter(r=>r.floor===floor+'F'&&r.building==='MAIN'&&r.type==='classroom').length;
  assert.equal(cabinets.length,expected);assert.equal(new Set(cabinets.map(c=>c.roomId)).size,expected);
  for(const c of cabinets){
    assert.equal(c.rows*c.columns,21);
    assert(c.north&&c.y>2,'All cabinets must be on the window side');
    const parts=world.boxes.filter(b=>b.floor===floor&&b.name.includes(c.name+' 신발장'));
    assert.equal(parts.filter(b=>b.name.includes('칸막이')).length,8);
    assert.equal(parts.filter(b=>b.name.includes('선반')).length,4);
    const z=(floor-1)*data.floorHeight;
    assert(world.blocked(c.x+c.width/2,c.y+c.depth/2,z),'Cabinet collision');
  }
  if(floor<=2)assert(!world.boxes.some(b=>b.floor===floor&&b.name.includes('신발장')));
  const p=elevatorDestination(floor,data.floorHeight);
  assert(world.candidate(p.x,p.y,p.z));assert(nearElevator(p,data.floorHeight));
  assert(!nearElevator({x:50,y:1.5,z:p.z},data.floorHeight));
  assert(world.blocked(101.5,2.92,p.z),'Elevator closed doors must be solid');
  const q=world.move(p,0,-1);assert(q.y<.6,'Elevator landing exit');
  checks.push({floor,cabinets:expected,cellsPerCabinet:21,elevatorLanding:true});
}
assert.equal(elevatorDestination(5,data.floorHeight),null);
const report={ok:true,checks,annexCabinetsAdded:0};
fs.writeFileSync(new URL('../../공간자료/가구승강기검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(report);
