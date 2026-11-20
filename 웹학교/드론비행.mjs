import {RUN_SPEED} from './달리기모션.mjs';

export const FLIGHT=Object.freeze({speed:RUN_SPEED*2,verticalSpeed:4,maxHeight:38,radius:1.53,height:2.55,bounds:[-23,-85,111,32]});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Flight uses its own spatial query, swept in <=12cm steps. It never asks the
// walking solver to snap an airborne rider to a different school floor.
export function createDroneFlight(school,id){
 const grid=new Map(),moving=school.colliders.filter(b=>b.vehicleId),cell=8;
 for(const item of school.colliders){if(item.vehicleId)continue;const b=item.spatialBounds??item.bounds;
  for(let x=Math.floor((b[0]-FLIGHT.radius)/cell);x<=Math.floor((b[3]+FLIGHT.radius)/cell);x++)for(let y=Math.floor((b[1]-FLIGHT.radius)/cell);y<=Math.floor((b[4]+FLIGHT.radius)/cell);y++){const key=x+','+y;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(item);}
 }
 const near=p=>[...(grid.get(Math.floor(p.x/cell)+','+Math.floor(p.y/cell))??[]),...moving];
 function blocked(p){
  if(p.x<FLIGHT.bounds[0]||p.y<FLIGHT.bounds[1]||p.x>FLIGHT.bounds[2]||p.y>FLIGHT.bounds[3]||p.z>FLIGHT.maxHeight)return true;
  return near(p).some(o=>{if(o.vehicleId===id)return false;const b=o.bounds;if(b[5]<=p.z+.035||b[2]>=p.z+FLIGHT.height)return false;
   // Rotor clearance is low; the standing rider uses a narrow upper volume.
   const radius=b[2]<p.z+.90?FLIGHT.radius:.34;
   return Math.hypot(Math.max(b[0]-p.x,0,p.x-b[3]),Math.max(b[1]-p.y,0,p.y-b[4]))<radius;
  });
 }
 function support(p){
  // All four skids must stay above roofs, steps, trees and the sloping terrain.
  let ground=-Infinity;for(const [x,y] of [[0,0],[-.59,-.65],[.59,-.65],[-.59,.65],[.59,.65]]){const z=school.floorBelow(p.x+x,p.y+y,p.z+.08,{ignoreVehicles:true,ignoreDoors:true});if(Number.isFinite(z))ground=Math.max(ground,z);}
  return ground;
 }
 let vx=0,vy=0,vz=0,landing=false,lastGround=-.58;
 function reset(){vx=vy=vz=0;landing=false;}
 function step(dt,p,input={}){
  dt=clamp(dt,0,.1);let next={...p};const yaw=input.yaw??0,forward=clamp(input.forward||0,-1,1),right=clamp(input.right||0,-1,1),length=Math.max(1,Math.hypot(forward,right));
  if(Math.abs(input.up||0)>.1||Math.hypot(forward,right)>.1)landing=false;
  const speed=input.brake||landing?0:FLIGHT.speed;
  const tx=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)/length*speed,ty=(Math.cos(yaw)*forward+Math.sin(yaw)*right)/length*speed;
  // Releasing a control holds position/height, with no drift or gravity fall.
  const a=1-Math.exp(-dt*9);vx=tx===0?0:vx+(tx-vx)*a;vy=ty===0?0:vy+(ty-vy)*a;vz=landing?-2.5:clamp(input.up||0,-1,1)*FLIGHT.verticalSpeed;
  if(next.z>=FLIGHT.maxHeight&&vz>0)vz=0;
  const n=Math.max(1,Math.ceil(Math.hypot(vx,vy,vz)*dt/.12));let contact=false;
  for(let i=0;i<n;i++){
   for(const [axis,velocity] of [['z',vz],['x',vx],['y',vy]]){
    const q={...next,[axis]:next[axis]+velocity*dt/n};const ground=support(q);
    if(Number.isFinite(ground))lastGround=ground;
    if(q.z<(Number.isFinite(ground)?ground:lastGround)+.04)q.z=(Number.isFinite(ground)?ground:lastGround)+.04;
    if(!blocked(q))next=q;else{contact=true;if(axis==='x')vx=0;if(axis==='y')vy=0;if(axis==='z')vz=0;}
   }
  }
  const ground=support(next),landed=Number.isFinite(ground)&&next.z-ground<=.10;
  if(landed&&landing){landing=false;vz=0;}
  return {position:next,speed:Math.hypot(vx,vy),verticalSpeed:vz,altitude:Math.max(0,next.z-(Number.isFinite(ground)?ground:lastGround)),landed,landing,contact};
 }
 return {step,blocked,support,reset,land(){landing=true;vx=vy=0;},get landing(){return landing;}};
}
