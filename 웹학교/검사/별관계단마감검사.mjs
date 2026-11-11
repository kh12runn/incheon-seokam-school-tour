import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld,localPoint} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),world=buildWorld(data),base=buildWorld(data,{annexStairStyle:false});
const finish=world.annexStairFinish;assert.equal(finish.reference.target,'ANNEX_STAIR_D');assert.equal(finish.signs.length,4);
const steps=world.boxes.filter(b=>b.name.startsWith('ANNEX_STAIR_D 디딤판'));
assert.equal(steps.length,72);assert(steps.every(b=>b.material==='terrazzo'));
assert(finish.panels.some(p=>p.color==='#aebed0'));assert(finish.panels.some(p=>p.color==='#292e2c'));
assert(JSON.stringify(world.boxes.filter(b=>b.name.startsWith('ANNEX_STAIR_E ')))===JSON.stringify(base.boxes.filter(b=>b.name.startsWith('ANNEX_STAIR_E '))),'Other annex stair unchanged');
assert(JSON.stringify(world.classroomInteriors)===JSON.stringify(base.classroomInteriors));
assert(JSON.stringify(world.colliders.map(b=>b.bounds))===JSON.stringify(base.colliders.map(b=>b.bounds)),'No collision changes');
const stair=world.stairs.find(s=>s.id==='ANNEX_STAIR_D'),f=stair.frame,W=f.width,D=f.depth;let p=localPoint(f,W/4,-.6,0);
function go(u,v){const t=localPoint(f,u,v);p=world.move(p,t.x-p.x,t.y-p.y);assert(Math.hypot(p.x-t.x,p.y-t.y)<.07);}
for(let level=0;level<3;level++){for(const [u,v] of [[W/4,.6],[W/4,D-.6],[3*W/4,D-.6],[3*W/4,.6],[3*W/4,-.6],[W/4,-.6]])go(u,v);assert(Math.abs(p.z-(level+1)*3.4)<.07);}
for(let level=3;level>0;level--){for(const [u,v] of [[3*W/4,-.6],[3*W/4,.6],[3*W/4,D-.6],[W/4,D-.6],[W/4,.6],[W/4,-.6]])go(u,v);assert(Math.abs(p.z-(level-1)*3.4)<.07);}
console.log({ok:true,floors:4,terrazzoTreads:72,walkedFlights:6,collisionsAndClassroomsUnchanged:true});
