import assert from 'node:assert/strict';
import {WORLD_COURSES} from '../레이싱입체코스.mjs';
import {createRace} from '../레이싱물리.mjs';
import {starterPose} from '../레이싱출발심판.mjs';
import {PARKED_CARS} from '../주차장.mjs';

const cutContains=(v,p,y)=>{
 const dx=p.x-v.cx,dz=p.z-v.cz,along=dx*v.tx+dz*v.tz,across=-dx*v.tz+dz*v.tx,floor=v.heightCenter+along*v.heightSlope;
 return Math.abs(along)<v.halfL&&Math.abs(across)<v.halfW&&y>floor+v.lower&&y<floor+v.upper;
};
let crossing=null,protectedGround=0;
for(const [index,course] of WORLD_COURSES.entries()){
 const samples=[];
 assert(course.cutVolumes.length<=32,'Fixed mobile shader budget');
 for(let s=0;s<course.length;s+=2){
  const p=course.trackPoint(s);samples.push(p);
  if(p.tunnel)for(let lane=-5.7;lane<=5.7;lane+=.7){
   const edge=course.trackPoint(s,lane);
   for(const above of [0,1.5,3,4.9])assert(course.cutVolumes.some(v=>cutContains(v,edge,p.height+above)),`${course.name}: tunnel shoulder/ceiling must clear at ${s}, lane ${lane}`);
  }
  if(p.height< -9&&!course.cutVolumes.some(v=>cutContains(v,p,0)))protectedGround++;
 }
 for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){
  const a=samples[i],b=samples[j],arc=Math.min(b.s-a.s,course.length-(b.s-a.s)),distance=Math.hypot(a.x-b.x,a.z-b.z);
  if(arc<34||distance>=10)continue;
  assert(Math.abs(a.height-b.height)>=6.5,`${course.name}: remote road branches must have vertical clearance`);
  if(distance<2.5&&index===1&&(!crossing||distance<crossing.distance))crossing={round:index+2,a,b,distance};
 }
 if(index===1||index===3)assert(course.bounds.minY< -9,'Real underground route');
 if(index===2||index===3)assert(course.bounds.maxY>=20,'Real rooftop route');
}
assert(protectedGround>20,'Deep tunnels retain playground above the tunnel roof');
assert(crossing,'Test needs a genuine upper/lower crossing');
function encounter({other=false,sameLevel=false,obstacle=false}={}){
 const r=createRace({round:crossing.round,car:PARKED_CARS[0],opponents:other?[PARKED_CARS[0]]:[],random:()=>.5});
 for(let i=0;i<13;i++)r.update(.25);r.obstacles.length=0;
 const place=(car,p)=>Object.assign(car,{x:p.x,z:p.z,height:p.height,s:p.s,lane:0,yaw:p.yaw,speed:6,hit:0,hits:0});
 place(r.player,crossing.a);
 if(other)place(r.cars[1],sameLevel?crossing.a:crossing.b);
 if(obstacle)r.obstacles.push({x:crossing.a.x,z:crossing.a.z,height:crossing.a.height+(sameLevel?0:10)});
 r.update(1/120,{throttle:1});return r.player;
}
assert.equal(encounter({other:true}).hits,0,'Cars on another level must not collide');
assert(encounter({other:true,sameLevel:true}).hits>0,'Same-level bumpers remain solid');
assert.equal(encounter({obstacle:true}).hits,0,'Obstacle on another floor must not collide');
assert(encounter({obstacle:true,sameLevel:true}).hits>0,'Same-level obstacles still work');
const joints=['shoulderZ','shoulderX','elbowX','bodyYaw','bodyLean','poleAngle'];
for(let t=0;t<9;t+=1/120){const a=starterPose(t),b=starterPose(t+1/120);for(const joint of joints){assert(Number.isFinite(a[joint]));assert(Math.abs(a[joint]-b[joint])<.05,'Flag/body animation must remain continuous');}}
assert.notEqual(starterPose(3.1).poleAngle,starterPose(3.4).poleAngle,'Flag waves at GO');
assert.equal(starterPose(8).shoulderZ,0,'Arm settles after start');
console.log({ok:true,courses:4,cutShoulders:true,gradeSeparatedTraffic:true,protectedGround,continuousFlagMotion:true});
