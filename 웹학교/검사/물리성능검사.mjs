import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {World,Body,Box,Vec3,AABB,NaiveBroadphase,SAPBroadphase,ArrayCollisionMatrix} from '../외부도구/cannon-es.mjs';
import {ActiveBodyBroadphase} from '../활성물체충돌.mjs';
import {buildWorld} from '../이동물리.mjs';
import {createFootballPhysics} from '../축구공물리.mjs';
import {createDriving} from '../운전물리.mjs';
const world=new World(),fast=new ActiveBodyBroadphase(world),reference=new NaiveBroadphase();reference.useBoundingBoxes=true;
let seed=43;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<180;i++){
 const b=new Body({mass:i%9===0?1:0,shape:new Box(new Vec3(.2+random()*2,.2+random()*2,.2+random())),position:new Vec3(random()*15,random()*15,random()*4)});
 if(i%18===0)b.sleep();if(i%11===0)b.type=Body.KINEMATIC;if(i%13===0)b.collisionFilterMask=0;world.addBody(b);
}
const pairs=bp=>{const a=[],b=[];bp.collisionPairs(world,a,b);return a.map((v,i)=>[v.id,b[i].id].sort((x,y)=>x-y).join(':')).sort();};
for(let frame=0;frame<20;frame++){
 for(const b of world.bodies)if(b.mass){b.position.x+=.13;b.aabbNeedsUpdate=true;if(frame===8)b.wakeUp();}
 if(frame===10){const b=world.bodies[4];world.removeBody(b);world.addBody(b);}
 fast.dirty=true;assert.deepEqual(pairs(fast),pairs(reference),'Identical conservative contact pairs');
 const query=new AABB({lowerBound:new Vec3(3,4,-1),upperBound:new Vec3(9,10,3)});
 assert.deepEqual(fast.aabbQuery(world,query).map(b=>b.id).sort(),world.bodies.filter(b=>b.aabb.overlaps(query)).map(b=>b.id).sort(),'Wheel ray broadphase query');
}
const school=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'))),stats={};
for(const mode of ['baseline','optimized']){
 seed=43;const physics=createFootballPhysics(school,{random});createDriving(school,physics);
 if(mode==='baseline'){
  physics.world.broadphase=new SAPBroadphase(physics.world);
  physics.world.collisionMatrix=new ArrayCollisionMatrix();physics.world.collisionMatrixPrevious=new ArrayCollisionMatrix();
  physics.world.collisionMatrix.setNumObjects(physics.world.bodies.length);physics.world.collisionMatrixPrevious.setNumObjects(physics.world.bodies.length);
 }
 const samples=[];for(let i=0;i<100;i++){const t=performance.now();physics.update(1/60,school.spawn,school.spawn);if(i>=10)samples.push(performance.now()-t);}
 samples.sort((a,b)=>a-b);stats[mode]={bodies:physics.world.bodies.length,medianMs:samples[Math.floor(samples.length/2)],p95Ms:samples[Math.floor(samples.length*.95)],contactStorage:Object.keys(physics.world.collisionMatrix.matrix).length};
}
assert(stats.optimized.contactStorage<100,'Sparse contact memory, no multi-million entry reset');
console.log(JSON.stringify({ok:true,pairEquivalenceFrames:20,stats,medianReductionPercent:100*(1-stats.optimized.medianMs/stats.baseline.medianMs)}));
