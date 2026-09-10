import fs from 'node:fs';
import assert from 'node:assert/strict';
import {addLowerMainFloorFinish} from '../사진참고마감.mjs';
import {buildWorld} from '../이동물리.mjs';
import {applyGroundFloorPlan} from '../일층배치.mjs';
const data=applyGroundFloorPlan(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')));
const before=JSON.stringify(data),added=[];
addLowerMainFloorFinish(data,(name,bounds,color,kind,floor)=>added.push({name,bounds,color,kind,floor}));
assert.equal(JSON.stringify(data),before,'Original model data must remain unchanged');
for(const b of added){
  assert([1,2,3].includes(b.floor));
  const a=b.bounds;
  assert(a[0]>=0&&a[3]<=103&&a[1]>=0&&a[4]<=3,'Finish must stay inside MAIN corridor: '+b.name);
  assert(a[3]>a[0]&&a[4]>a[1]&&a[5]>a[2],b.name);
  for(const r of data.rooms.filter(r=>r.building==='ANNEX'&&parseInt(r.floor)===b.floor)){
    const c=r.bounds;
    assert(!(a[0]<c[1]&&a[3]>c[0]&&a[1]<c[3]&&a[4]>c[2]),'ANNEX overlap: '+b.name);
  }
}
const world=buildWorld(data);
let paths=0;
for(const floor of [1,2,3]){
  const z=(floor-1)*data.floorHeight;
  for(let x=.5;x<102.5;x+=.5)assert(world.candidate(x,1.5,z),'Corridor blocked '+floor+' '+x);
  for(const room of data.rooms.filter(r=>r.building==='MAIN'&&r.floor===floor+'F'&&r.bounds[3]===0&&r.bounds[0]>=0)){
    const door=room.bounds[0]+(room.bounds[1]-room.bounds[0])*.35;
    for(let y=-.5;y<=1.5;y+=.1)assert(world.candidate(door,y,z),'Door blocked '+room.name);
    paths++;
  }
  for(const r of data.rooms.filter(r=>r.building==='MAIN'&&r.floor===floor+'F'&&r.bounds[2]===3)){
    // Existing northern entrances/stairs must not acquire shoe cabinets.
    assert(!added.some(b=>b.floor===floor&&b.name.includes('신발장')&&b.bounds[1]>2&&b.bounds[0]<r.bounds[1]&&b.bounds[3]>r.bounds[0]),r.name);
  }
}
const report={ok:true,mainFloors:[1,2,3],addedBoxes:added.length,doorPaths:paths,annexOverlap:0,originalModelDataUnchanged:true};
fs.writeFileSync(new URL('../../공간자료/본관마감검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(report);
