import {profileFor} from './차량성능.mjs';
import {PARKED_CARS} from './주차장.mjs';
// The full course stays on the flat dirt strip (world z 42..69), clear of
// the entrance slope at the west and the shelters along the south pavement.
export const TRACK=Object.freeze({cx:41,cz:55.3,half:26.5,radius:7.3,width:11,length:106+14.6*Math.PI});
export const ROUND_COUNT=5;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const mod=(x,m)=>(x%m+m)%m;
export function trackPoint(distance,lane=0){
 // Leave the entire starting grid on the straight, including the last AI row.
 const t=TRACK,L=2*t.half,A=Math.PI*t.radius,s=mod(distance+24,t.length);let x,z,tx,tz,curve=0;
 if(s<L){x=t.cx-t.half+s;z=t.cz+t.radius;tx=1;tz=0;}
 else if(s<L+A){const a=Math.PI/2-(s-L)/t.radius;x=t.cx+t.half+Math.cos(a)*t.radius;z=t.cz+Math.sin(a)*t.radius;tx=Math.sin(a);tz=-Math.cos(a);curve=1/t.radius;}
 else if(s<2*L+A){x=t.cx+t.half-(s-L-A);z=t.cz-t.radius;tx=-1;tz=0;}
 else{const a=-Math.PI/2-(s-2*L-A)/t.radius;x=t.cx-t.half+Math.cos(a)*t.radius;z=t.cz+Math.sin(a)*t.radius;tx=Math.sin(a);tz=-Math.cos(a);curve=1/t.radius;}
 return {x:x-tz*lane,z:z+tx*lane,tx,tz,curve,yaw:Math.atan2(-tx,-tz)};
}
export function roundRules(round){const r=clamp(Math.floor(round),1,5);return {round:r,laps:[2,3,3,4,5][r-1],opponents:Math.min(5,r+2),pace:[.77,.86,.94,.98,1][r-1],hazards:5+r*2};}
export function raceOpponents(round,random=Math.random){
 const tiers=[['sedan','compact'],['sedan','morning','suv'],['morning','tucson','electric','rally'],['rally','sports','touring'],['sports','touring','hyper']][clamp(Math.floor(round),1,5)-1];
 const pool=PARKED_CARS.filter(c=>tiers.includes(c.variant??c.type));
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return Array.from({length:roundRules(round).opponents},(_,i)=>pool[i%pool.length]);
}
export function makeObstacles(round,random=Math.random,cars=[]){
 const count=roundRules(round).hazards,items=[],L=TRACK.length;
 for(let i=0;i<count;i++){
  const s=mod(18+(i+.35+random()*.3)*(L-30)/count,L);
  if(cars.some(c=>Math.abs(mod(s-c.s+L/2,L)-L/2)<13))continue;
  // One obstacle per cross section always leaves at least two passing lanes.
  items.push({id:i,s,lane:[-3.2,0,3.2][Math.floor(random()*3)],kind:random()<.5?'books':'chair',angle:(random()-.5)*.6});
 }return items;
}
export function createRace({car,opponents,round=1,random=Math.random}){
 const rules=roundRules(round),L=TRACK.length;
 const cars=[car,...opponents.slice(0,rules.opponents)].map((source,i)=>({source,id:i,name:i?'AI '+i:'나',profile:profileFor(source),s:-8-Math.floor(i/2)*6,lane:i%2?2:-2,speed:0,sideSpeed:0,lap:0,spin:0,hit:0,hits:0,boost:1,boosting:false,finish:null,wall:0,aiLane:i%2?2:-2,decision:0}));
 let phase='countdown',countdown=3,time=0,paused=false,obstacles=makeObstacles(round,random,cars),generation=1,finishCount=0,accumulator=0;
 const player=cars[0],target=rules.laps*L;
 function damage(c,resistance,amount=.45){if(c.hit>0)return;c.speed*=resistance;c.hit=amount;c.hits++;}
 function step(dt,input){
  if(phase==='countdown'){countdown-=dt;if(countdown<=0){countdown=0;phase='racing';}return;}
  if(phase!=='racing')return;
  time+=dt;
  for(const c of cars){
   if(c.finish!==null)continue;
   const p=c.profile,at=trackPoint(c.s),ai=c.id>0;c.hit=Math.max(0,c.hit-dt);c.wall=Math.max(0,c.wall-dt);
   let throttle=clamp(input.throttle||0,0,1),brake=!!input.brake,steer=clamp(input.steer||0,-1,1),boost=!!input.boost;
   if(ai){
    throttle=1;brake=false;c.decision-=dt;
    if(c.decision<=0){
     c.decision=.22+random()*.16;
     const lanes=[-3.2,0,3.2],scores=lanes.map(l=>{
      let score=-Math.abs(l-c.lane)*.3;
      for(const o of obstacles){const gap=mod(o.s-c.s,L);if(gap<22&&Math.abs(o.lane-l)<2)score-=35-gap;}
      for(const o of cars)if(o!==c){const gap=mod(o.s-c.s,L);if(gap<10&&Math.abs(o.lane-l)<2.2)score-=15-gap;}
      return score+random()*.8;
     });c.aiLane=lanes[scores.indexOf(Math.max(...scores))];
    }
    steer=clamp((c.aiLane-c.lane)*1.5,-1,1);boost=rules.round>=3&&c.boost>.55&&!at.curve&&mod(c.s,L)>10;
   }
   c.boosting=boost&&c.boost>.01&&throttle>0&&!brake&&c.speed>3;
   c.boost=clamp(c.boost+dt*(c.boosting?-.32:.085),0,1);
   const pace=ai?rules.pace*(.97+(c.id%3)*.015):1;
   const corner=at.curve?p.grip+(Math.max(0,c.lane)*.24):p.speed;
   const max=Math.min(p.speed,corner)*pace*(c.boosting?p.boost:1);
   const before=c.speed,desired=brake?0:throttle*max;
   const acceleration=brake?p.brake:desired<c.speed?5:c.speed<6?p.launch:p.accel;
   c.speed+=clamp(desired-c.speed,-acceleration*dt,acceleration*dt);
   const lateral=steer*p.handling*clamp(c.speed/6,0,1);
   c.sideSpeed+=(lateral-c.sideSpeed)*(1-Math.exp(-dt*10));c.lane+=c.sideSpeed*dt;
   const bound=TRACK.width/2-1.5;
   if(Math.abs(c.lane)>bound){c.lane=clamp(c.lane,-bound,bound);c.sideSpeed=0;if(c.wall<=0){damage(c,.77,.28);c.wall=.6;}}
   const travel=(before+c.speed)*.5*dt/(1+at.curve*c.lane),oldS=c.s;c.s+=travel;c.spin+=travel/.325;
   for(const o of obstacles){const gap=mod(o.s-oldS,L);if(gap<=travel+1.75&&Math.abs(c.lane-o.lane)<1.45)damage(c,p.resilience);}
   c.lap=Math.max(c.lap,Math.floor(Math.max(0,c.s)/L));
   if(c.s>=target){c.finish=time-dt+dt*clamp((target-oldS)/Math.max(.001,travel),0,1);c.s=target;c.speed=0;finishCount++;}
  }
  // Contact changes both cars' pace, never teleports them through a barrier.
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
   const a=cars[i],b=cars[j];if(a.finish!==null||b.finish!==null)continue;
   if(Math.abs(mod(a.s-b.s+L/2,L)-L/2)<3.8&&Math.abs(a.lane-b.lane)<1.8){
    damage(a,.80,.7);damage(b,.80,.7);const side=a.lane<=b.lane?-1:1;a.lane=clamp(a.lane+side*.04,-4,4);b.lane=clamp(b.lane-side*.04,-4,4);
   }
  }
  if(player.lap>=generation&&player.finish===null){obstacles=makeObstacles(round,random,cars);generation=player.lap+1;}
  if(player.finish!==null)phase='finished';
 }
 function standings(){return [...cars].sort((a,b)=>a.finish!==null&&b.finish!==null?a.finish-b.finish:a.finish!==null?-1:b.finish!==null?1:b.s-a.s);}
 function view(){const order=standings();return {phase,paused,countdown,round:rules.round,laps:rules.laps,lap:Math.min(rules.laps,player.lap+1),rank:order.indexOf(player)+1,total:cars.length,time,won:phase==='finished'&&order[0]===player,speed:player.speed,boost:player.boost,hits:player.hits,generation,standings:order.map(c=>({id:c.id,name:c.name,finished:c.finish!==null,time:c.finish,progress:c.s})),cars:cars.map(c=>({id:c.id,s:c.s,lane:c.lane,speed:c.speed,lap:c.lap,finish:c.finish}))};}
 return {cars,player,rules,get obstacles(){return obstacles;},view,
  pause(value=true){paused=value;accumulator=0;},
  update(seconds,input={}){if(paused)return view();accumulator+=clamp(seconds,0,.25);while(accumulator>=1/120){step(1/120,input);accumulator-=1/120;}return view();}};
}
