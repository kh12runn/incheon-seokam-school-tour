import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld,localPoint} from '../이동물리.mjs';
import {createJumpMotion} from '../점프물리.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')));
let traversals=0;
for(const stair of world.stairs)for(const fps of [30,60,144])for(const offset of [-.25,0,.25]){
  const f=stair.frame,W=f.width,D=f.depth,motion=createJumpMotion(world);
  let p=localPoint(f,W/4+offset,-.6,0);
  function walk(u,v){
    const target=localPoint(f,u,v),dt=1/fps;
    for(let i=0;i<fps*8;i++){
      const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);
      if(d<.002)return;
      const step=Math.min(d,5.8*dt);
      p=motion.step(p,dx/d*step,dy/d*step,dt);
      assert(!motion.getState().airborne,`${stair.id}: unexpected fall`);
    }
    assert.fail(`${stair.id} ${fps}fps stuck at ${JSON.stringify(p)} toward ${JSON.stringify(target)}`);
  }
  const top=stair.roofAccess?4:3;
  for(let level=0;level<top;level++){
    for(const [u,v] of [[W/4+offset,.6],[W/4+offset,D-.6],[3*W/4+offset,D-.6],[3*W/4+offset,.6],[3*W/4+offset,-.6]])walk(u,v);
    assert(Math.abs(p.z-((level+1)*stair.height+(level===3?.11:0)))<.02);
    walk(W/4+offset,-.6);traversals++;
  }
  for(let level=top;level>0;level--){
    for(const [u,v] of [[3*W/4+offset,-.6],[3*W/4+offset,.6],[3*W/4+offset,D-.6],[W/4+offset,D-.6],[W/4+offset,.6],[W/4+offset,-.6]])walk(u,v);
    assert(Math.abs(p.z-(level-1)*stair.height)<.02);traversals++;
  }
  // Stair enclosure and upper slabs must still block bodies underneath them.
  const wall=localPoint(f,.02,2,0);assert(world.blocked(wall.x,wall.y,wall.z));
  const underneath=localPoint(f,W/4,.6,.5);assert(world.blocked(underneath.x,underneath.y,underneath.z+1.5));
}
console.log({ok:true,traversals,noJump:true,frameRates:[30,60,144]});
