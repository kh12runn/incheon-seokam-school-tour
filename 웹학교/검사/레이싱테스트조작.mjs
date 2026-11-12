// Test-only driver: reads the world pose and supplies normal control inputs.
// Production racing code must never import this module or call this driver.
import {TRACK,trackPoint} from '../레이싱물리.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const controls=new WeakMap();
export function driverInput(race,{digital=false}={}){
 const c=race.player,p=c.profile,L=TRACK.length,lanes=[-2.6,0,2.6];
 let memory=controls.get(race);if(!memory){memory={lane:c.lane,reverse:0,nextReverse:0};controls.set(race,memory);}
 const time=race.view().time;
 if(c.wall>0&&Math.abs(c.speed)<.3&&time>memory.nextReverse){memory.reverse=time+.85;memory.nextReverse=time+3;memory.recovery=time+5;}
 if(time<memory.reverse)return {throttle:-1,steer:0,brake:false,boost:false};
 const scores=lanes.map(l=>{let score=Math.abs(l-memory.lane)*.45+Math.abs(l)*.01;
  for(const o of race.obstacles){const gap=((o.s-c.s)%L+L)%L;if(gap<32&&Math.abs(l-o.lane)<1.9)score+=38-gap;}
  for(const other of race.cars.slice(1))if(other.finish===null){const gap=((other.s-c.s)%L+L)%L;if(gap<12&&Math.abs(l-other.lane)<2.2)score+=18-gap;}
  return score;
 });memory.lane=time<memory.recovery?0:lanes[scores.indexOf(Math.min(...scores))];
 let narrow=trackPoint(c.s).width<=7;
 for(let d=3;d<=22;d+=3)if(trackPoint(c.s+d).width<=7)narrow=true;
 const ahead=clamp(3.5+Math.abs(c.speed)*.24,4,10),section=trackPoint(c.s+ahead),limit=narrow?0:Math.min(Math.abs(section.curve)>.08?.65:3,Math.max(0,(section.width??TRACK.width)/2-2)),target=trackPoint(c.s+ahead,clamp(memory.lane,-limit,limit)),dx=target.x-c.x,dz=target.z-c.z,error=angle(Math.atan2(-dx,-dz)-c.yaw),distance=Math.max(2,Math.hypot(dx,dz));
 const rack=Math.atan2(2*c.dimensions.wheelbase*Math.sin(error),distance),rackLimit=.46+Math.min(p.handling,11)*.018;
 let steer=clamp(-rack/rackLimit,-1,1),curve=Math.abs(trackPoint(c.s).curve||0);
 for(let d=3;d<=Math.max(13,c.speed*1.25);d+=3)curve=Math.max(curve,Math.abs(trackPoint(c.s+d).curve||0));
 let desired=Math.min(p.speed,curve>.002?Math.sqrt(p.grip*.50/curve):p.speed)*clamp(1-Math.abs(error)*.4,.35,1);
 for(const other of race.cars.slice(1))if(other.finish===null){const gap=((other.s-c.s)%L+L)%L;if(gap<7&&Math.abs(other.lane-c.lane)<1.7)desired=Math.min(desired,Math.max(0,other.speed)+Math.max(0,gap-4.8)*1.6);}
 let throttle=desired/p.speed,brake=c.speed>desired+.75;
 if(digital){
  // Pulse the same left/right keys a player uses, tracking the desired rack
  // angle without moving the car or altering the game's physics state.
  const errorRack=rack-c.steering;steer=Math.abs(errorRack)<.025?0:-Math.sign(errorRack);
  throttle=1;brake=c.speed>desired;
 }
 const boost=!brake&&curve<.005&&Math.abs(error)<.10&&c.speed>12;
 return {throttle,steer,brake,boost};
}
