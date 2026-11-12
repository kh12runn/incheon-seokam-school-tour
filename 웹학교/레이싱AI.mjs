import {TRACK,trackPoint as originalTrackPoint} from './레이싱코스.mjs';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const mod=(v,m)=>(v%m+m)%m;
const rackLimit=p=>.46+Math.min(p.handling,11)*.018;

// Only normal throttle/steering/brake controls are returned. No position, speed,
// lap, progress or checkpoint is written, and no player's rank changes AI pace.
// Strategic perception is 4.5–5.5 Hz; steering follows the body every physics step.
export function createRaceAI({cars,obstacles,rules,course,random=Math.random,time=()=>0}){
 const trackPoint=course?.trackPoint??originalTrackPoint,L=course?.length??TRACK.length;
 const signedGap=(a,b)=>mod(a-b+L/2,L)-L/2;
 const level=clamp((rules.round-1)/4,0,1),cornerUse=.57+level*.13;
 const memories=new WeakMap();
 const memoryFor=c=>{
  let memory=memories.get(c);
  if(!memory){memory={next:0,lane:c.lane??0,lockUntil:0,targetId:null,decisions:0,paceOffset:(random()-.5)*.018,look:[],obstacleGap:Infinity};memories.set(c,memory);}
  return memory;
 };
 function perceive(c,m,now){
  m.next=now+.18+random()*.04;m.decisions++;m.originS=c.s;
  const p=c.profile,speed=Math.max(0,c.speed),horizon=clamp(17+speed*1.1,23,48),at=trackPoint(c.s);
  const look=[];for(let d=0;d<=horizon;d+=2.5){const point=trackPoint(c.s+d);look.push({d,width:point.width,curve:point.curve});}
  m.look=look;
  const nearby=cars.filter(other=>other!==c&&other.finish===null).map(other=>({car:other,gap:signedGap(other.s,c.s)})).filter(o=>o.gap>-12&&o.gap<horizon+8);
  const threats=obstacles().map(o=>({...o,gap:mod(o.s-c.s,L)})).filter(o=>o.gap<horizon+5);
  const ahead=trackPoint(c.s+clamp(4+speed*.25,5,10)),halfW=c.dimensions.width/2;
  const narrow=Math.min(at.width,ahead.width)<=7;
  let target=m.targetId===null?null:nearby.find(o=>o.car.id===m.targetId);
  if(target&&(target.gap<-7||target.gap>34||target.car.speed>p.speed*.98||(narrow&&target.car.speed>=p.speed*.37-.5))){target=null;m.targetId=null;}
  if(!target&&now>1.6){
   target=nearby.filter(o=>o.gap>-1&&o.gap<26&&Math.abs(o.car.lane-c.lane)<2.5&&(
    o.car.speed<2||(!narrow&&o.gap>3&&p.speed*(rules.pace+.025)>o.car.speed+1.2)
   )).sort((a,b)=>a.gap-b.gap)[0]??null;
   if(target){m.targetId=target.car.id;m.lockUntil=now+1.35;}
  }
  const legalLimit=Math.max(0,Math.min(at.width,ahead.width)/2-halfW-(target&&narrow?.14:.25)),wideLimit=Math.min(2.6,legalLimit);
  const urgent=threats.some(o=>o.gap<15&&Math.abs(o.lane-c.lane)<halfW+.65);
  const limit=narrow&&!target&&!urgent?0:wideLimit;
  const candidates=[-limit,-limit*.52,0,limit*.52,limit];
  const costs=candidates.map(lane=>{
   let cost=Math.abs(lane-m.lane)*.65+Math.abs(lane)*.10;
   if(now<m.lockUntil)cost+=Math.abs(lane-m.lane)*2.4;
   for(const o of threats){
    const clearance=Math.abs(lane-o.lane),safe=halfW+.65;
    if(clearance<safe)cost+=(safe-clearance)*Math.max(0,44-o.gap)*2.5;
   }
   for(const o of nearby){
    const relative=Math.max(.3,speed-o.car.speed),catchTime=clamp(o.gap/relative,0,2);
    const predicted=o.gap+(o.car.speed-speed)*catchTime;
    const safe=(c.dimensions.width+o.car.dimensions.width)/2+(narrow?-.42:.28),clearance=Math.abs(lane-o.car.lane);
    if(o.gap>-5&&o.gap<30&&clearance<safe)cost+=(safe-clearance)*Math.max(0,23-Math.abs(predicted))*1.5;
    // Don't merge into a car alongside or approaching quickly from behind.
    if(o.gap>-9&&o.gap<4&&clearance<safe)cost+=45*(safe-clearance);
    if(o===target&&clearance<safe)cost+=60*(safe-clearance);
    const intended=o.car.aiPlan?.lane;
    if(Number.isFinite(intended)&&o.gap>-4&&o.gap<18&&Math.abs(lane-intended)<safe&&Math.abs(intended-o.car.lane)>.3)
     cost+=(safe-Math.abs(lane-intended))*12;
   }
   // A late lane change on an inner bend reduces the usable turning radius.
   // Prefer the clear outer line, but let obstacle/traffic clearance take priority.
   for(const point of look)if(point.d<Math.max(10,speed*.65)&&point.curve*lane<0)
    cost+=Math.abs(point.curve*lane)*3.2;
   // Keep a narrow merge lane early, unless overtaking a genuinely stopped car.
   const entrance=look.find(q=>q.width<=7);
   if(entrance&&entrance.d<15&&!target)cost+=Math.abs(lane)*(15-entrance.d)*.25;
   return cost;
  });
  const chosen=candidates[costs.indexOf(Math.min(...costs))];
  if(Math.abs(chosen-m.lane)>.4){m.lane=chosen;m.lockUntil=Math.max(m.lockUntil,now+.7);}
  else m.lane=chosen;
  if(target&&Math.abs(m.lane-target.car.lane)<.6){
   // If all passing lanes are occupied, follow first; don't zigzag into traffic.
   m.targetId=null;target=null;
  }
  m.obstacleGap=Infinity;
  for(const o of threats)if(Math.abs(o.lane-c.lane)<halfW+.6)m.obstacleGap=Math.min(m.obstacleGap,o.gap);
  c.aiLane=m.lane;c.passingId=m.targetId;c.passingLane=m.lane;
  c.aiPlan={intent:target?'pass':urgent?'avoid':narrow?'merge':'cruise',targetId:m.targetId,lane:m.lane,decisions:m.decisions};
 }
 return function input(c,dt=1/120){
  const m=memoryFor(c),now=time(),p=c.profile,at=trackPoint(c.s);
  if(now>=m.next||m.lastReset!==c.resetSerial){m.lastReset=c.resetSerial;perceive(c,m,now);}
  const lookAhead=clamp(3.5+Math.abs(c.speed)*.24,4,10),ahead=trackPoint(c.s+lookAhead);
  const margin=m.targetId!==null&&Math.min(at.width,ahead.width)<=7?.14:.25;
  const limit=Math.max(0,Math.min(at.width,ahead.width)/2-c.dimensions.width/2-margin),lane=clamp(m.lane,-limit,limit);
  // The centreline sample already contains the exact lateral normal. Reuse it
  // instead of evaluating the same analytic segment a second time per step.
  const dx=ahead.x+ahead.nx*lane-c.x,dz=ahead.z+ahead.nz*lane-c.z,distance=Math.max(2,Math.hypot(dx,dz)),error=angle(Math.atan2(-dx,-dz)-c.yaw);
  let steer=clamp(-Math.atan(2*c.dimensions.wheelbase*Math.sin(error)/distance)/rackLimit(p),-1,1);
  const pace=Math.min(1,rules.pace+.025+m.paceOffset),base=p.speed*pace;
  const advanced=signedGap(c.s,m.originS),obstacleGap=m.obstacleGap-advanced;
  let desired=base;
  const currentCurve=Math.abs(at.curve/(1+at.curve*lane));
  if(currentCurve>.002)desired=Math.min(desired,Math.sqrt(p.grip*cornerUse/currentCurve)*pace);
  for(const sample of m.look){
   const remaining=sample.d-advanced;if(remaining<-3)continue;
   const curve=Math.abs(sample.curve/(1+sample.curve*lane));
   if(curve<.002)continue;
   const corner=Math.sqrt(p.grip*cornerUse/curve)*pace;
   // Brake for the corner at its actual distance, rather than crawling through
   // a long straight just because a bend is visible 20 m ahead.
   desired=Math.min(desired,Math.sqrt(corner*corner+2*p.brake*(.48+level*.10)*Math.max(0,remaining-3.8)));
  }
  desired*=clamp(1-Math.abs(error)*(.36-level*.08),.36,1);
  if(obstacleGap<11&&Math.abs(lane-c.lane)>.5)desired=Math.min(desired,Math.max(3.5,(obstacleGap-2)*1.5));
  const passing=m.targetId===null?null:cars.find(other=>other.id===m.targetId&&other.finish===null);
  if(passing&&at.width<=7)desired=Math.min(desired,p.speed*.37);
  for(const other of cars){
   if(other===c||other.finish!==null)continue;
   const gap=signedGap(other.s,c.s),side=Math.abs(other.lane-c.lane),targetSide=Math.abs(other.lane-lane),safe=(c.dimensions.width+other.dimensions.width)/2+.12;
   if(gap<-.5||gap>16)continue;
   const overtaking=other===passing&&targetSide>Math.min(safe,at.width<=7?1.25:1.85);
   if(overtaking){
    if(gap<5.1&&side<1.15)desired=Math.min(desired,Math.max(2.5,other.speed+1.2));
    continue;
   }
   const converging=targetSide<safe&&side<safe+.5;
   if(converging&&(gap>.4||c.id>other.id))desired=Math.min(desired,Math.max(0,other.speed+Math.max(-6,(gap-5.1)*1.65)));
  }
  desired=Math.max(0,desired);
  if(c.wall>0&&Math.abs(c.speed)<.4){c.aiLane=0;m.lane=0;return {throttle:.5,steer:Math.abs(steer)>.15?steer:c.lane>0?-1:1,brake:false,boost:false};}
  if(passing&&c.contact>0&&Math.abs(c.speed)<2&&Math.abs(lane-c.lane)>.15)steer=Math.sign(lane-c.lane)*Math.max(.45,Math.abs(steer));
  const straight=m.look.every(q=>q.d-advanced>Math.max(16,c.speed*.9)||q.d-advanced<-3||Math.abs(q.curve)<.005),clear=cars.every(o=>o===c||o.finish!==null||signedGap(o.s,c.s)<0||signedGap(o.s,c.s)>12||Math.abs(o.lane-c.lane)>2.3);
  c.aiPlan.desiredSpeed=desired;
  return {throttle:clamp(desired/p.speed,0,1),steer,brake:c.speed>desired+.9,boost:rules.round>=3&&straight&&clear&&c.boost>.45&&Math.abs(error)<.10&&obstacleGap>20};
 };
}
