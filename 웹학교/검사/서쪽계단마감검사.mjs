import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld,localPoint} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const before=buildWorld(data,{westStairStyle:false}),world=buildWorld(data),finish=world.westStairFinish;
assert.equal(finish.reference.target,'MAIN_STAIR_A');assert.equal(finish.reference.inferred,true);
assert.deepEqual(world.centralStairFinish,before.centralStairFinish,'Existing central stair remains unchanged');
assert(JSON.stringify(world.classroomInteriors)===JSON.stringify(before.classroomInteriors),'Classroom furnishings remain unchanged');
assert(JSON.stringify(world.specialInteriors)===JSON.stringify(before.specialInteriors),'Special rooms remain unchanged');
const surfaces=w=>w.surfaces.map(s=>({name:s.name,bounds:s.bounds,height:s.height((s.bounds[0]+s.bounds[3])/2,(s.bounds[1]+s.bounds[4])/2)}));
assert.deepEqual(surfaces(world),surfaces(before),'No new lips or slabs in walking routes');
assert.equal(finish.signs.length,4);assert.equal(world.boxes.filter(b=>b.westStairFinish&&b.material==='clear_glass').length,3);
const steps=world.boxes.filter(b=>/^MAIN_STAIR_A 디딤판 [0-2] /.test(b.name));assert.equal(steps.length,72);assert(steps.every(b=>b.material==='rubber_mat'));
assert.deepEqual(world.boxes.filter(b=>/^MAIN_STAIR_A (?:디딤판|입구|중간참) -1(?: |$)/.test(b.name)),before.boxes.filter(b=>/^MAIN_STAIR_A (?:디딤판|입구|중간참) -1(?: |$)/.test(b.name)),'Basement flights keep their own finishes');
assert(world.colliders.some(b=>b.name==='MAIN_STAIR_A 중앙벽'),'Separator collision retained');
assert(world.colliders.some(b=>b.name==='MAIN_STAIR_A 최상층 막음'),'Top landing guard collision retained');
for(const z of [0,1.7,3.4,5.1,6.8,8.5,10.2])for(let x=.3;x<4.9;x+=.4)for(let y=3.2;y<10.2;y+=.4)assert.deepEqual(world.candidate(x,y,z),before.candidate(x,y,z),'Same collision at '+[x,y,z]);
const stair=world.stairs.find(s=>s.id==='MAIN_STAIR_A'),f=stair.frame;let p=localPoint(f,1.25,-.6,0),legs=0;
function go(u,v){const t=localPoint(f,u,v);p=world.move(p,t.x-p.x,t.y-p.y);assert(Math.hypot(p.x-t.x,p.y-t.y)<.07);}
for(let floor=0;floor<3;floor++){for(const [u,v] of [[1.25,.6],[1.25,6.4],[3.75,6.4],[3.75,.6],[3.75,-.6],[1.25,-.6]])go(u,v);assert(Math.abs(p.z-(floor+1)*3.4)<.07);legs++;}
for(let floor=3;floor>0;floor--){for(const [u,v] of [[3.75,-.6],[3.75,.6],[3.75,6.4],[1.25,6.4],[1.25,.6],[1.25,-.6]])go(u,v);assert(Math.abs(p.z-(floor-1)*3.4)<.07);legs++;}
console.log({ok:true,floors:4,navyTreads:steps.length,landingWindows:3,walkedFlights:legs,centralAndRoomsUnchanged:true,basementPreserved:true});
