import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')));
const intersects=(a,b)=>[0,1,2].every(i=>a[i]<b[i+3]&&a[i+3]>b[i]);
for(const id of ['2F_SCIENCE','2F_INTELLIGENT_SCIENCE']){
 const c=world.specialInteriors.find(c=>c.roomId===id),edge=id==='2F_SCIENCE'?0:3,z=c.entry.z;
 // Check decorative render geometry as well as solid colliders. A walk-only
 // test misses double-sided noticeboard planes and non-solid chalkboards.
 const opening=[c.entry.x-.5,edge-.35,z+.15,c.entry.x+.5,edge+.35,z+2.15];
 for(const b of world.boxes)assert(!intersects(b.bounds,opening),`${id}: doorway obscured by ${b.name}`);
 for(const p of c.panels){
  const bounds=p.axis==='x'?[p.x-.005,p.y-p.width/2,p.z-p.height/2,p.x+.005,p.y+p.width/2,p.z+p.height/2]:[p.x-p.width/2,p.y-.005,p.z-p.height/2,p.x+p.width/2,p.y+.005,p.z+p.height/2];
  assert(!intersects(bounds,opening),`${id}: doorway obscured by ${p.name}`);
 }
 for(let i=0;i<=20;i++)assert(world.candidate(c.entry.x,c.entry.y+(c.spawn.y-c.entry.y)*i/20,z),`${id}: entrance blocked`);
}
console.log(JSON.stringify({ok:true,rooms:2,renderBoxesAndPanelsChecked:true,entrySamples:42}));
