import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {shoeCabinets} from '../사진참고마감.mjs';
import {windowBays,classroomWindows} from '../창문배치.mjs';
// This tests the architectural glazing, not furniture: its old standing points
// now lie inside desks added by the separate classroom-layout feature.
// Furniture/aisle collision is covered by the class64/main-classroom suites.
// New photo-guided trees may naturally stand in a sightline; isolate the
// architectural opening here. Exterior skin openings have their own test.
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),before=JSON.stringify(data),world=buildWorld(data,{class64:false,mainClassrooms:false,exterior:false});
const field=world.boxes.filter(b=>b.name==='SPACE_EXT_PLAYGROUND');assert.equal(field.length,1);
assert.deepEqual(field[0].bounds,data.boxes.find(b=>b.name==='SPACE_EXT_PLAYGROUND').bounds);
assert.equal(field[0].bounds[1],-69);assert.equal(field[0].bounds[4],-11);
assert.deepEqual(world.boxes.find(b=>b.name==='SiteGround').bounds,data.boxes.find(b=>b.name==='SiteGround').bounds);
function rayHit(p,d,b){
  let lo=0,hi=Infinity;
  for(let k=0;k<3;k++){
    if(Math.abs(d[k])<1e-9){if(p[k]<b[k]||p[k]>b[k+3])return Infinity;continue;}
    let a=(b[k]-p[k])/d[k],c=(b[k+3]-p[k])/d[k];if(a>c)[a,c]=[c,a];
    lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return Infinity;
  }
  return hi>1e-6?lo:Infinity;
}
const views=[];
for(const floor of [1,2,3,4]){
  const z=(floor-1)*data.floorHeight,bays=windowBays(data,floor),cabinets=shoeCabinets(data,floor);
  for(const c of cabinets){
    assert(c.north&&c.y===2.38,'Classroom-side cabinet remains');
    assert(bays.some(([a,b])=>c.x>=a&&c.x+c.width<=b),'Cabinet not at a real window');
    for(const other of cabinets)if(c!==other)assert(c.x+c.width<=other.x||other.x+other.width<=c.x,'Cabinets overlap');
  }
  const moved=world.move({x:20,y:1.5,z},0,5);assert(moved.y<3,'Walked through glass');
  for(const building of ['MAIN','ANNEX']){
    const w=classroomWindows(data).find(w=>w.pane.floor===floor&&w.room.building===building&&
      (w.south?(w.cut[0]+w.cut[3])/2<80:(w.cut[1]+w.cut[4])/2>-65&&(w.cut[1]+w.cut[4])/2<-18));
    assert(w,'Missing courtyard classroom window');
    const p=w.south?[(w.cut[0]+w.cut[3])/2,w.room.bounds[2]+1.5,z+1.58]
      :[w.room.bounds[0]+1.5,(w.cut[1]+w.cut[4])/2,z+1.58];
    const target=w.south?[p[0],-50,-.3]:[35,p[1],-.3],d=target.map((v,i)=>v-p[i]);
    const hits=world.boxes.filter(b=>!b.name.includes('창가 유리')&&!b.name.startsWith('교실창 투명유리')).map(b=>({name:b.name,t:rayHit(p,d,b.bounds)})).filter(h=>Number.isFinite(h.t)).sort((a,b)=>a.t-b.t);
    assert.equal(hits[0]?.name,'SPACE_EXT_PLAYGROUND','Classroom view obstructed '+w.room.id+': '+JSON.stringify(hits.slice(0,3)));
    const start={x:p[0],y:p[1],z};assert(world.candidate(start.x,start.y,start.z));
    const q=world.move(start,w.south?0:-5,w.south?-5:0);
    assert(w.south?q.y>w.room.bounds[2]:q.x>w.room.bounds[0],'Walked through classroom window');
    views.push({floor,building,room:w.room.id,visibleField:true,windowBlocksWalking:true});
  }
}
assert(world.candidate(20,-40,-.3),'Field not walkable');
assert.equal(JSON.stringify(data),before);
const report={ok:true,views,fields:1,courtyardFieldBounds:field[0].bounds,corridorFieldRequestCancelled:true,originalDataUnchanged:true};
fs.writeFileSync(new URL('../../공간자료/창밖운동장검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(report);
