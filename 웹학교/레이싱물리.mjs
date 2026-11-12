import {profileFor,carName} from './차량성능.mjs';
import {pickRaceDrivers} from './레이싱선수.mjs';
import {createRaceAI} from './레이싱AI.mjs';
import {PARKED_CARS,CAR_DIMENSIONS} from './주차장.mjs';
import {getRaceCourse,groundHeight} from './레이싱코스.mjs';
export {TRACK,trackPoint,nearestTrack,getRaceCourse} from './레이싱코스.mjs';

export const ROUND_COUNT=5;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const mod=(x,m)=>(x%m+m)%m;
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const maxSteering=profile=>.46+Math.min(profile.handling,11)*.018;
export const RACE_ASSIST_CONFIG=Object.freeze({speedRatio:.50,maxStrength:.55,rampRate:3.3,minSteerInput:.08});
const SIDE_OVERLAP=.40;

export function roundRules(round){const r=clamp(Math.floor(round),1,5);return {round:r,laps:3,opponents:Math.min(5,r+2),pace:[.70,.78,.86,.91,.94][r-1],hazards:5+r*2};}
export function raceOpponents(round,random=Math.random){
 const tiers=[['sedan','compact'],['sedan','morning','suv'],['morning','tucson','electric','rally'],['rally','sports','touring'],['sports','touring','hyper']][clamp(Math.floor(round),1,5)-1];
 const pool=PARKED_CARS.filter(c=>tiers.includes(c.variant??c.type));
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return Array.from({length:roundRules(round).opponents},(_,i)=>pool[i%pool.length]);
}
export function makeObstacles(round,random=Math.random,cars=[],course=getRaceCourse(round)){
 const TRACK=course,trackPoint=course.trackPoint,laneLimit=Math.min(2.7,course.width/2-2);
 const count=roundRules(round).hazards,items=[],L=TRACK.length;
 for(let i=0;i<count;i++){
  const s=mod(24+(i+.35+random()*.3)*(L-42)/count,L);
  if(cars.some(c=>Math.abs(mod(s-c.s+L/2,L)-L/2)<15))continue;
  const at=trackPoint(s);if((at.width??TRACK.width)<=7)continue;
  const limit=Math.min(laneLimit,(at.width??TRACK.width)/2-1.7),lane=[-limit,0,limit][Math.floor(random()*3)],p=trackPoint(s,lane);
  items.push({id:i,s,lane,x:p.x,z:p.z,kind:random()<.5?'books':'chair',angle:(random()-.5)*.6});
 }return items;
}

// Normal driving is manual. Forward input during an actual obstruction enables
// a short, smooth escape arc; steering input always chooses the escape side.
export function createRace({car,opponents=[],round=1,random=Math.random}){
 const course=getRaceCourse(round),TRACK=course,{trackPoint,nearestTrack}=course;
 const gateCount=Math.max(20,Math.ceil(course.length/12)),gateLength=course.length/gateCount;
 const gates=Array.from({length:gateCount},(_,i)=>trackPoint(i*gateLength));
 const laneLimit=Math.min(2.7,course.width/2-2),lanes=[-laneLimit,0,laneLimit];
 const rules=roundRules(round),L=course.length,drivers=pickRaceDrivers(Math.min(opponents.length,rules.opponents),random);
 const cars=[car,...opponents.slice(0,rules.opponents)].map((source,i)=>{
  const s=-8-Math.floor(i/2)*6,lane=i%2?2:-2,p=trackPoint(s,lane);
  const driver=i?drivers[i-1]:{id:'player',name:'나'};
  return {source,id:i,name:driver.name,driverId:driver.id,driverName:driver.name,profile:profileFor(source),dimensions:CAR_DIMENSIONS[source.type],x:p.x,z:p.z,height:p.height??-.3,yaw:p.yaw,steering:0,s,lane,speed:0,sideSpeed:0,lap:0,spin:0,hit:0,hits:0,boost:1,boosting:false,finish:null,wall:0,aiLane:lane,decision:0,started:false,checkpoint:0,nextCheckpoint:0,progress:s,offTrack:false,wrongWay:false,resetSerial:0,reverseTime:0,recoveryCooldown:0,stuckTime:0,lastAdvance:s,recoveries:0,contact:0,obstacleContact:0,assistActive:false,assistReason:null,assistStrength:0,assistSpeedLimit:profileFor(source).speed*RACE_ASSIST_CONFIG.speedRatio,passingId:null,passingLane:0};
 });
 let phase='countdown',countdown=3,time=0,paused=false,obstacles=makeObstacles(round,random,cars,course),generation=1,accumulator=0;
 const player=cars[0];
 function damage(c,resistance,duration=.45){if(c.hit>0)return;c.speed*=resistance;c.hit=duration;c.hits++;}
 function project(c){
  const p=nearestTrack(c.x,c.z,c.s),delta=mod(p.s-mod(c.s,L)+L/2,L)-L/2;
  c.s+=delta;c.lane=p.lane;c.height=groundHeight(c.x,c.z);
  const fx=-Math.sin(c.yaw),fz=-Math.cos(c.yaw),axle=c.dimensions.wheelbase/2;
  c.pitch=Math.atan2(groundHeight(c.x+fx*axle,c.z+fz*axle)-groundHeight(c.x-fx*axle,c.z-fz*axle),axle*2);
  const heading=-Math.sin(c.yaw)*p.tx-Math.cos(c.yaw)*p.tz;
  c.wrongWay=Math.abs(c.speed)>.3?c.speed*heading<-.3:heading<-.25;
  c.offTrack=Math.abs(p.lane)>(p.width??TRACK.width)/2-1.25;
  // Only the sector after the last verified gate contributes to ranking.
  if(c.started){const last=mod((c.nextCheckpoint-1)*gateLength,L),section=mod(p.s-last+L/2,L)-L/2;c.progress=c.checkpoint*gateLength+clamp(section,-gateLength,gateLength);}
  else c.progress=-Math.min(30,mod(-p.s,L));
  return p;
 }
 function penetration(c,x,z,yaw){
  const halfW=c.dimensions.width/2+.12,halfL=c.dimensions.length/2-.18,fx=-Math.sin(yaw),fz=-Math.cos(yaw);
  let overlap=-Infinity;
  for(let index=-1;index<=1;index++){
   const along=index===0?0:index*halfL;
   const p=nearestTrack(x+fx*along,z+fz*along,c.s);
   overlap=Math.max(overlap,p.distance-((p.width??TRACK.width)/2-halfW));
  }return overlap;
 }
 const inside=(c,x,z,yaw)=>penetration(c,x,z,yaw)<=0;
 function boundaryContact(c,x,z,yaw){
  const halfW=c.dimensions.width/2+.12,halfL=c.dimensions.length/2-.18,fx=-Math.sin(yaw),fz=-Math.cos(yaw);let worst={overlap:-Infinity,nx:0,nz:0};
  for(let index=-1;index<=1;index++){const along=index===0?0:index*halfL,sx=x+fx*along,sz=z+fz*along,p=nearestTrack(sx,sz,c.s),overlap=p.distance-p.width/2+halfW;if(overlap>worst.overlap)worst={overlap,nx:(sx-p.x)/Math.max(.001,p.distance),nz:(sz-p.z)/Math.max(.001,p.distance)};}
  return worst;
 }
 function gateCrossing(c,oldX,oldZ,dt){
  const g=gates[c.nextCheckpoint],a=(oldX-g.x)*g.tx+(oldZ-g.z)*g.tz,b=(c.x-g.x)*g.tx+(c.z-g.z)*g.tz;
  if(a>0||b<=0||b<=a)return;
  const t=clamp(-a/(b-a),0,1),x=oldX+(c.x-oldX)*t-g.x,z=oldZ+(c.z-oldZ)*t-g.z;
  if(Math.abs(x*(-g.tz)+z*g.tx)>(g.width??TRACK.width)/2)return;
  if(!c.started){c.started=true;c.checkpoint=0;}else c.checkpoint++;
  c.nextCheckpoint=(c.nextCheckpoint+1)%gateCount;c.lap=Math.floor(c.checkpoint/gateCount);
  if(c.lap>=rules.laps){c.finish=time-dt+dt*t;c.speed=0;c.progress=rules.laps*L;}
 }
 const aiInput=createRaceAI({course,cars,obstacles:()=>obstacles,rules,random,time:()=>time});
 function moveCar(c,dt,input){
  const p=c.profile,throttle=clamp(Number(input.throttle)||0,-1,1),brake=!!input.brake,steer=clamp(Number(input.steer)||0,-1,1),oldX=c.x,oldZ=c.z,oldYaw=c.yaw;
  c.assistReason=c.wall>0?'boundary':c.obstacleContact>0?'obstacle':c.contact>0?'traffic':null;
  c.assistActive=!!c.assistReason&&throttle>0&&!brake;
  c.assistSpeedLimit=p.speed*RACE_ASSIST_CONFIG.speedRatio;
  c.assistStrength=c.assistActive?Math.min(RACE_ASSIST_CONFIG.maxStrength,c.assistStrength+dt*RACE_ASSIST_CONFIG.rampRate):0;
  if(!c.assistActive)c.assistReason=null;
  c.boosting=!c.assistActive&&!!input.boost&&c.boost>.01&&throttle>0&&!brake&&c.speed>3;c.boost=clamp(c.boost+dt*(c.boosting?-.32:.085),0,1);
  const desired=brake?0:c.assistActive?c.assistSpeedLimit:throttle*(throttle<0?p.speed*.38:p.speed*(c.boosting?p.boost:1)),before=c.speed,opposed=c.speed*desired<0;
  const accel=brake||opposed?p.brake:Math.abs(desired)<Math.abs(c.speed)?(throttle===0?3.2:8):Math.abs(c.speed)<6?p.launch:p.accel;
  c.speed+=clamp(desired-c.speed,-accel*dt,accel*dt);
  if(c.assistActive)c.speed=clamp(c.speed,0,c.assistSpeedLimit);
  let assistedSteer=steer;
  if(c.assistActive){
   const manual=Math.abs(steer)>RACE_ASSIST_CONFIG.minSteerInput,at=trackPoint(c.s),wall=boundaryContact(c,c.x,c.z,c.yaw);let correction=steer;
   if(c.assistReason==='boundary'&&wall.overlap>-.3){
    // With no steering key, choose the tangent which points along the course.
    // A steering key instead picks its own side, including a deliberate U-turn.
    const tangent=[{x:-wall.nz,z:wall.nx},{x:wall.nz,z:-wall.nx}];
    const choice=tangent.map(t=>({...t,error:angle(Math.atan2(-t.x,-t.z)-c.yaw)})).sort((a,b)=>manual?((Math.sign(a.error)===-Math.sign(steer)?0:4)+Math.abs(a.error))-((Math.sign(b.error)===-Math.sign(steer)?0:4)+Math.abs(b.error)):(b.x*at.tx+b.z*at.tz)-(a.x*at.tx+a.z*at.tz))[0];
    correction=clamp(-choice.error*2.0,-1,1);
   }else if(!manual){
    let target=trackPoint(c.s+5);
    if(c.assistReason==='traffic'||c.assistReason==='obstacle'){
     const blockers=c.assistReason==='traffic'?cars.filter(other=>other!==c&&other.finish===null):obstacles;
     const nearest=blockers.map(other=>({other,d:Math.hypot(other.x-c.x,other.z-c.z)})).sort((a,b)=>a.d-b.d)[0]?.other;
     const otherLane=nearest?nearestTrack(nearest.x,nearest.z,c.s).lane:0,limit=Math.max(0,Math.min(at.width,target.width)/2-c.dimensions.width/2-.16),side=otherLane>.15?-1:otherLane<-.15?1:c.lane>=0?1:-1;
     target=trackPoint(c.s+5,side*limit);
    }
    correction=clamp(-angle(Math.atan2(c.x-target.x,c.z-target.z)-c.yaw)*2,-1,1);
   }
   // The automatic contribution cannot reverse an explicit steering command.
   if(manual&&Math.sign(correction)!==Math.sign(steer))correction=0;
   assistedSteer=steer*(1-c.assistStrength)+correction*c.assistStrength;
  }
  // A stopped bumper still gets a low-speed steering arc during deliberate
  // escape input; normal, brake and no-input states retain manual dynamics.
  const targetSteering=-assistedSteer*maxSteering(p);c.steering+=clamp(targetSteering-c.steering,-2.8*dt,2.8*dt);
  const average=c.assistActive?Math.min(c.assistSpeedLimit,Math.max((before+c.speed)*.5,c.assistSpeedLimit*c.assistStrength/RACE_ASSIST_CONFIG.maxStrength)):(before+c.speed)*.5,yawRate=average/c.dimensions.wheelbase*Math.tan(c.steering),gripRate=p.grip/Math.max(2,Math.abs(average));
  c.yaw=angle(c.yaw+clamp(yawRate,-gripRate,gripRate)*dt);
  const travel=average*dt,dx=-Math.sin(c.yaw)*travel,dz=-Math.cos(c.yaw)*travel;let fraction=1,slide=null;
  const nextOverlap=penetration(c,oldX+dx,oldZ+dz,c.yaw);
  if(nextOverlap>0){
   const oldOverlap=penetration(c,oldX,oldZ,oldYaw),allowed=Math.max(0,oldOverlap-.00001),valid=(x,z,yaw)=>penetration(c,x,z,yaw)<=allowed;
   if(nextOverlap>allowed){
    if(c.assistActive){
     let x=oldX+dx,z=oldZ+dz;
     for(let i=0;i<4;i++){const hit=boundaryContact(c,x,z,c.yaw);if(hit.overlap<=0)break;x-=hit.nx*(hit.overlap+.0001);z-=hit.nz*(hit.overlap+.0001);}
     const distance=Math.hypot(x-oldX,z-oldZ),limit=c.assistSpeedLimit*dt;if(distance>limit){x=oldX+(x-oldX)*limit/distance;z=oldZ+(z-oldZ)*limit/distance;}
     if(penetration(c,x,z,c.yaw)<=Math.max(.025,oldOverlap+.0001))slide={x,z};
    }
    if(!slide){let lo=0,hi=1;for(let i=0;i<7;i++){const mid=(lo+hi)/2;if(valid(oldX+dx*mid,oldZ+dz*mid,c.yaw))lo=mid;else hi=mid;}fraction=lo;if(fraction===0&&!valid(oldX,oldZ,c.yaw))c.yaw=oldYaw;}
    if(c.wall<=0)damage(c,.10,.28);c.wall=.6;c.speed=slide?Math.min(c.assistSpeedLimit,Math.hypot(slide.x-oldX,slide.z-oldZ)/dt):0;
   }
  }
  c.x=slide?.x??oldX+dx*fraction;c.z=slide?.z??oldZ+dz*fraction;c.spin+=Math.hypot(c.x-oldX,c.z-oldZ)*Math.sign(travel)/.325;
  for(const o of obstacles){const ox=o.x-c.x,oz=o.z-c.z,forward=ox*(-Math.sin(c.yaw))+oz*(-Math.cos(c.yaw)),side=ox*Math.cos(c.yaw)-oz*Math.sin(c.yaw);if(Math.abs(forward)<c.dimensions.length/2+.4&&Math.abs(side)<c.dimensions.width/2+.4){const blocking=forward>-.5&&Math.abs(side)<c.dimensions.width*.45;damage(c,blocking?p.resilience:.97);if(blocking)c.obstacleContact=.4;}}
  project(c);gateCrossing(c,oldX,oldZ,dt);
 }
 function carContact(a,b){
  const dx=b.x-a.x,dz=b.z-a.z;if(dx*dx+dz*dz>36)return null;
  const segment=c=>{const d=(c.dimensions.length-c.dimensions.width)/2,fx=-Math.sin(c.yaw)*d,fz=-Math.cos(c.yaw)*d;return [[c.x-fx,c.z-fz],[c.x+fx,c.z+fz]];},A=segment(a),B=segment(b);
  let best={d:Infinity,nx:0,nz:0};
  function consider(point,line,sign){const vx=line[1][0]-line[0][0],vz=line[1][1]-line[0][1],t=clamp(((point[0]-line[0][0])*vx+(point[1]-line[0][1])*vz)/(vx*vx+vz*vz),0,1),x=(line[0][0]+vx*t-point[0])*sign,z=(line[0][1]+vz*t-point[1])*sign,d=Math.hypot(x,z);if(d<best.d)best={d,nx:x/Math.max(d,.001),nz:z/Math.max(d,.001)};}
  for(const point of A)consider(point,B,1);for(const point of B)consider(point,A,-1);
  const ax=A[1][0]-A[0][0],az=A[1][1]-A[0][1],bx=B[1][0]-B[0][0],bz=B[1][1]-B[0][1],cross=ax*bz-az*bx;
  if(Math.abs(cross)>.0001){const qx=B[0][0]-A[0][0],qz=B[0][1]-A[0][1],t=(qx*bz-qz*bx)/cross,u=(qx*az-qz*ax)/cross;if(t>=0&&t<=1&&u>=0&&u<=1){const length=Math.max(.001,Math.hypot(dx,dz));best={d:0,nx:dx/length,nz:dz/length};}}
  // Mirrors are excluded from the collision hull. Parallel side brushes may
  // overlap a little; bumper-to-bumper and head-on impacts keep a firm limit.
  const minimum=(a.dimensions.width+b.dimensions.width)/2-.06,depth=minimum-best.d;
  if(depth<=0)return null;
  const aligned=Math.cos(a.yaw-b.yaw)>.6,sideA=Math.abs(best.nx*(-Math.sin(a.yaw))+best.nz*(-Math.cos(a.yaw))),sideB=Math.abs(best.nx*(-Math.sin(b.yaw))+best.nz*(-Math.cos(b.yaw))),side=aligned&&sideA<.55&&sideB<.55,allowed=side?SIDE_OVERLAP:.08;
  return {...best,depth,allowed,soft:depth<=allowed,push:Math.min(.30,Math.max(0,depth-allowed)*.55)};
 }
 function recoverOpponent(c){
  // AI-only recovery from a six-second traffic jam. Keep every verified gate
  // and all elapsed time, rewind behind the blockage, and never overlap cars.
  if(c.id===0)return false;
  const base=c.started?Math.min(c.s-4,c.checkpoint*gateLength+.7):-8-Math.floor(c.id/2)*6;
  for(const back of [0,4,8,12]){
   const s=base-back,p=trackPoint(s),limit=Math.min(2,p.width/2-c.dimensions.width/2-.5);
   for(const lane of [0,-limit,limit]){
    const spot=trackPoint(s,lane);
    if(!inside(c,spot.x,spot.z,spot.yaw)||cars.some(other=>other!==c&&Math.hypot(other.x-spot.x,other.z-spot.z)<6))continue;
    Object.assign(c,{x:spot.x,z:spot.z,height:spot.height,yaw:spot.yaw,s,lane,speed:0,steering:0,wall:0,hit:1,reverseTime:0,recoveryCooldown:3,stuckTime:0,lastAdvance:s,aiLane:0,decision:2,contact:0,obstacleContact:0,assistActive:false,assistReason:null,assistStrength:0,passingId:null,resetSerial:c.resetSerial+1,recoveries:c.recoveries+1});project(c);return true;
   }
  }
  return false;
 }
 function step(dt,input){
  if(phase==='countdown'){countdown-=dt;if(countdown<=0){countdown=0;phase='racing';}return;}
  if(phase!=='racing')return;time+=dt;
  for(const c of cars){if(c.finish!==null)continue;c.hit=Math.max(0,c.hit-dt);c.wall=Math.max(0,c.wall-dt);c.contact=Math.max(0,c.contact-dt);c.obstacleContact=Math.max(0,c.obstacleContact-dt);moveCar(c,dt,c.id?aiInput(c):input);}
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
   const a=cars[i],b=cars[j];if(a.finish!==null||b.finish!==null)continue;
   const contact=carContact(a,b);
   if(contact){
    if(contact.soft){a.speed*=Math.exp(-dt*.7);b.speed*=Math.exp(-dt*.7);continue;}
    a.contact=b.contact=.35;
    damage(a,.72,.6);damage(b,.72,.6);
    const canA=inside(a,a.x-contact.nx*contact.push,a.z-contact.nz*contact.push,a.yaw),canB=inside(b,b.x+contact.nx*contact.push,b.z+contact.nz*contact.push,b.yaw);
    for(const [c,sign] of [[a,-1],[b,1]]){
     const toward=(c.speed*(-Math.sin(c.yaw))*contact.nx+c.speed*(-Math.cos(c.yaw))*contact.nz)*-sign;if(toward>0)c.speed=0;
     const push=contact.push*((c===a&&!canB)||(c===b&&!canA)?2:1),oldX=c.x,oldZ=c.z,x=c.x+contact.nx*push*sign,z=c.z+contact.nz*push*sign;if(inside(c,x,z,c.yaw)){c.x=x;c.z=z;project(c);gateCrossing(c,oldX,oldZ,dt);}
    }
   }
  }
  for(let index=1;index<cars.length;index++){const c=cars[index];if(c.finish!==null)continue;
   if(c.s>c.lastAdvance+.7){c.lastAdvance=c.s;c.stuckTime=0;}else c.stuckTime+=dt;
   if(c.stuckTime>6&&(Math.abs(c.speed)<1||c.wall>0||c.wrongWay))recoverOpponent(c);
  }
  if(player.lap>=generation&&player.finish===null){obstacles=makeObstacles(round,random,cars,course);generation=player.lap+1;}
  if(player.finish!==null)phase='finished';
 }
 function standings(){return [...cars].sort((a,b)=>a.finish!==null&&b.finish!==null?a.finish-b.finish:a.finish!==null?-1:b.finish!==null?1:b.progress-a.progress);}
 function view(){const order=standings();return {course:{id:course.id,name:course.name,length:course.length,direction:course.direction},phase,paused,countdown,round:rules.round,laps:rules.laps,lap:Math.min(rules.laps,player.lap+1),rank:order.indexOf(player)+1,total:cars.length,time,won:phase==='finished'&&order[0]===player,speed:player.speed,boost:player.boost,assistActive:player.assistActive,assistReason:player.assistReason,assistStrength:player.assistStrength,assistSpeedLimit:player.assistSpeedLimit,hits:player.hits,generation,offTrack:player.offTrack,wrongWay:player.wrongWay,checkpoint:player.checkpoint,nextCheckpoint:player.nextCheckpoint,checkpointsPerLap:gateCount,standings:order.map(c=>({id:c.id,name:c.name,driverId:c.driverId,driverName:c.driverName,carName:carName(c.source),carId:c.source.id,finished:c.finish!==null,time:c.finish,progress:c.progress})),cars:cars.map(c=>({id:c.id,x:c.x,z:c.z,height:c.height,yaw:c.yaw,steering:c.steering,s:c.s,lane:c.lane,speed:c.speed,lap:c.lap,finish:c.finish,progress:c.progress,checkpoint:c.checkpoint,nextCheckpoint:c.nextCheckpoint}))};}
 function resetCar(){
  if(paused||phase!=='racing'||player.finish!==null)return false;
  const s=player.started?(player.checkpoint*gateLength+1):-8;
  // Recovery is an explicit driver action; it cannot advance the next gate.
  const candidates=lanes.map(l=>({lane:l,p:trackPoint(s,l)})).filter(({p})=>inside(player,p.x,p.z,p.yaw)&&cars.slice(1).every(c=>Math.hypot(c.x-p.x,c.z-p.z)>5));
  const choice=candidates.sort((a,b)=>Math.abs(a.lane)-Math.abs(b.lane))[0];if(!choice)return false;
  Object.assign(player,{x:choice.p.x,z:choice.p.z,height:choice.p.height??-.3,yaw:choice.p.yaw,s,lane:choice.lane,speed:0,steering:0,sideSpeed:0,wall:0,hit:.8,boosting:false,offTrack:false,wrongWay:false,contact:0,obstacleContact:0,assistActive:false,assistReason:null,assistStrength:0,resetSerial:player.resetSerial+1});project(player);return true;
 }
 return {course,cars,player,rules,get obstacles(){return obstacles;},view,resetCar,
  pause(value=true){paused=value;accumulator=0;},
  update(seconds,input={}){if(paused)return view();accumulator+=clamp(seconds,0,.25);while(accumulator>=1/120){step(1/120,input);accumulator-=1/120;}return view();}};
}
