import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld,localPoint} from '../이동물리.mjs';
import {createCameraCollision,thirdPersonDesired,segmentBox} from '../삼인칭카메라.mjs';
import {createStudent,gaitFoot,RUN_SPEED} from '../학생캐릭터.mjs';
import {STRIDE,phaseAdvance} from '../달리기모션.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),world=buildWorld(data);
const obstacles=[...world.colliders,...world.boxes.filter(b=>b.kind==='step')],resolve=createCameraCollision(obstacles);
const wall={bounds:[-10,-2,0,10,-1.8,4]},simple=createCameraCollision([wall]);
const near=simple({x:0,y:0,z:1.1},{x:0,y:-3,z:1.8});assert(near.blocked&&near.y>-1.64);
assert(!simple({x:0,y:0,z:1},{x:0,y:3,z:1.8}).blocked);
assert.equal(segmentBox({x:0,y:0,z:1},{x:3,y:0,z:1},wall.bounds),Infinity);
const positions=[];
for(let f=0;f<4;f++)for(const [x,y] of [[20,1.5],[52.5,1.5],[78.5,1.5],[101.5,-30],[23.5,-3]])positions.push({x,y,z:f*data.floorHeight});
positions.push({x:45,y:-4,z:0},{x:25,y:-40,z:-.3});
for(const stair of world.stairs){const p=localPoint(stair.frame,stair.frame.width/4,3,0),q=world.candidate(p.x,p.y,.7);if(q)positions.push(q);}
let checked=0,retracted=0;
for(const p of positions){
  assert(world.candidate(p.x,p.y,p.z));
  for(let a=0;a<16;a++)for(const pitch of [-.75,0,.6]){
    const target={...p,z:p.z+1.12},desired=thirdPersonDesired(target,a*Math.PI/8,pitch,3.6),safe=resolve(target,desired);
    assert(Object.values(safe).every(v=>typeof v==='boolean'||Number.isFinite(v)));
    assert(safe.distance<=Math.hypot(desired.x-target.x,desired.y-target.y,desired.z-target.z)+1e-6);
    for(const b of obstacles)assert(!Number.isFinite(segmentBox(target,safe,b.bounds,.12)),'Camera crossed '+b.name+' at '+JSON.stringify(p));
    checked++;if(safe.blocked)retracted++;
  }
}
const variants=[];
// Stance velocity matches world travel, and both feet leave the floor briefly.
const stride=STRIDE,phaseDelta=phaseAdvance(RUN_SPEED*.01);
assert(Math.abs(gaitFoot(.4+phaseDelta,stride,1).forward-gaitFoot(.4,stride,1).forward+RUN_SPEED*.01)<1e-8);
let flight=false;
for(let i=0;i<100;i++){const p=i*Math.PI*2/100;if(!gaitFoot(p,stride,1).planted&&!gaitFoot(p+Math.PI,stride,1).planted)flight=true;}
assert(flight,'Running needs a flight phase');
for(const variant of ['boy','girl']){
  const student=createStudent(variant);
  const swings=[];
  for(let i=0;i<120;i++){
    student.update(1/60,{distance:RUN_SPEED/60,dx:RUN_SPEED/60,dy:0,time:i/60});
    const state=student.getState();
    for(const arm of state.arms)assert(arm.spread*arm.side>=.17,'Arms must spread away from torso');
    if(i>60){swings.push(state.arms[0].swing);assert(state.arms.every(a=>a.elbow<-.80),'Running elbows must bend');}
    student.root.updateMatrixWorld(true);student.root.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));
  }
  const running=student.getState();assert(running.blend>.95&&running.speed>3.1&&running.phase>1);assert(Math.abs(running.heading-Math.PI/2)<.02);
  assert(Math.max(...swings)-Math.min(...swings)>1,'Arms need a full alternating swing');
  for(let i=0;i<120;i++)student.update(1/60,{distance:RUN_SPEED/60,dx:0,dy:RUN_SPEED/60,time:2+i/60,groundHeight:()=>.08});
  assert.equal(student.getState().motion,'달리기');const phase=student.getState().phase;
  for(let i=0;i<120;i++)student.update(1/60,{time:4+i/60});
  const idle=student.getState();assert.equal(idle.phase,phase);assert(idle.blend<.001);assert.equal(idle.motion,'대기');
  student.wave();const wrists=[];
  for(let i=0;i<75;i++){student.update(1/60,{time:6+i/60});const s=student.getState();assert(s.waving);if(i>30){assert(s.arms[1].spread>1.9);wrists.push(s.arms[1].wrist);}}
  assert(Math.max(...wrists)-Math.min(...wrists)>.5);
  for(let i=0;i<120;i++)student.update(1/60,{time:8+i/60});assert(!student.getState().waving);
  student.update(1/60,{airborne:true,verticalSpeed:4});assert.equal(student.getState().motion,'점프');
  student.update(1/60,{airborne:true,verticalSpeed:-2});assert.equal(student.getState().motion,'낙하');
  student.root.updateMatrixWorld(true);student.root.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));
  assert.equal(gaitFoot(.5,.25,0).lift,0);variants.push({variant,runOnly:true,running:true,armsOutward:true,elbowsBent:true,alternatingSwing:true,idle:true,finiteRig:true});student.dispose();
}
const report={ok:true,cameraSamples:checked,retractedSamples:retracted,wallAndWindowClipping:false,variants};
fs.writeFileSync(new URL('../../공간자료/삼인칭검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(report);
