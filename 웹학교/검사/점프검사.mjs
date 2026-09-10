import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {createJumpMotion,JUMP_VELOCITY,GRAVITY} from '../점프물리.mjs';
import {RUN_SPEED} from '../달리기모션.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')));
const checks=[];
for(const dt of [1/120,1/60,1/20,.2])for(let floor=0;floor<4;floor++){
  const jump=createJumpMotion(world);let p={x:20,y:1.5,z:floor*3.4},peak=p.z;
  assert(jump.start(p));assert(!jump.start(p),'No double jump');
  for(let i=0;i<Math.ceil(1.2/dt);i++){p=jump.step(p,RUN_SPEED*dt,0,dt);peak=Math.max(peak,p.z);assert(!world.blocked(p.x,p.y,p.z),'Jump collided with room shell');}
  assert(!jump.getState().airborne);assert(Math.abs(p.z-floor*3.4)<.01);assert(peak-floor*3.4>.65&&peak-floor*3.4<.9);
  checks.push({floor:floor+1,dt,peak:peak-floor*3.4,landed:true});
}
const wallJump=createJumpMotion(world);let w={x:20,y:1.5,z:0};wallJump.start(w);
for(let i=0;i<120;i++){w=wallJump.step(w,0,-RUN_SPEED/60,1/60);assert(w.y>.3);assert(!world.blocked(w.x,w.y,w.z));}
const ceilingWorld={spawn:{x:0,y:0,z:0},blocked:(x,y,z)=>z>.42,move:(p,dx,dy)=>({...p,x:p.x+dx,y:p.y+dy}),moveAir:(p,dx,dy)=>({...p,x:p.x+dx,y:p.y+dy}),floorBelow:()=>0};
const low=createJumpMotion(ceilingWorld);let p={...ceilingWorld.spawn},peak=0;low.start(p);
for(let i=0;i<90;i++){p=low.step(p,0,0,1/60);peak=Math.max(peak,p.z);assert(p.z<=.420001);}
assert(!low.getState().airborne&&p.z===0);assert(peak>.4);
const report={ok:true,runSpeed:RUN_SPEED,previousRunSpeed:3.2,nominalJumpHeight:JUMP_VELOCITY**2/(2*GRAVITY),wallBlocked:true,ceilingBlocked:true,noDoubleJump:true,checks};
fs.writeFileSync(new URL('../../공간자료/점프검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(report);
