// Race-only circuit: a large playground loop and rear-parking loop joined by
// separate outbound/return lanes through the main central entrance. Coordinates
// are Three.js world X/Z. This module never changes the school's source model.
const TAU=Math.PI*2;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const mod=(value,divisor)=>(value%divisor+divisor)%divisor;
const smooth=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
const segments=[];
let length=0;
function line(x0,z0,x1,z1,width=10,zone='운동장'){
 const dx=x1-x0,dz=z1-z0,size=Math.hypot(dx,dz);
 segments.push({kind:'line',x0,z0,dx,dz,size,start:length,width,zone});length+=size;
}
function arc(cx,cz,radius,angle,sweep,width=10,zone='운동장'){
 const size=Math.abs(radius*sweep);
 segments.push({kind:'arc',cx,cz,radius,angle,sweep,size,start:length,width,zone});length+=size;
}
const transition=(from,to)=>(t)=>from+(to-from)*smooth(t);
// A long, unobstructed southern straight holds the entire starting grid.
line(36,63.5,71,63.5);
arc(71,55.5,8,Math.PI/2,-Math.PI/2);
line(79,55.5,79,35);
arc(71,35,8,0,-Math.PI/2);
line(71,27,56,27);
arc(56,19,8,Math.PI/2,Math.PI/2,transition(10,5),'중앙현관 진입');
line(48,19,48,-12,5,'중앙현관 나가는 길');
arc(56,-12,8,Math.PI,Math.PI/2,transition(5,8),'후문 주차장 진입');
line(56,-20,64,-20,8,'후문 주차장');
arc(64,-28,8,Math.PI/2,-Math.PI/2,8,'후문 주차장');
line(72,-28,72,-30,8,'후문 주차장');
arc(64,-30,8,0,-Math.PI/2,8,'후문 주차장');
line(64,-38,20,-38,8,'후문 주차장 긴 직선');
arc(20,-30,8,-Math.PI/2,-Math.PI/2,8,'후문 주차장');
line(12,-30,12,-28,8,'후문 주차장');
arc(20,-28,8,Math.PI,-Math.PI/2,8,'후문 주차장');
line(20,-20,32,-20,8,'후문 주차장');
arc(32,-12,8,-Math.PI/2,Math.PI/2,transition(8,5),'중앙현관 복귀');
line(40,-12,40,39.5,t=>5+5*smooth(((-12+51.5*t)-15)/16.5),'중앙현관 돌아오는 길');
arc(32,39.5,8,0,Math.PI/2,10,'운동장 서쪽');
line(32,47.5,6,47.5);
arc(6,55.5,8,-Math.PI/2,-Math.PI);
line(6,63.5,36,63.5);

// Building ceiling height is separate from the outside approach. Consumers can
// hide intersecting first-floor render pieces only while a race is active.
export const RACE_PASSAGES=Object.freeze([
 Object.freeze({name:'본관 중앙현관 왕복 통로',minX:35,maxX:53,minZ:-12,maxZ:25,minY:-1,maxY:3.18,ceiling:3.18,roofMinZ:-10,roofMaxZ:7}),
]);
export const ROSTRUM_CLEARANCE=Object.freeze({minX:36,maxX:54,minZ:11,maxZ:25,minY:-1,maxY:5});
// The parking race apron is temporary. Its northern extension gives a real
// turning radius; free exploration retains the existing lot, gate and fence.
export const REAR_PAD=Object.freeze({minX:7,maxX:77,minZ:-43,maxZ:-15,height:-.58});
export const RACE_CUT_ZONES=Object.freeze([
 Object.freeze({minX:35,maxX:53,minZ:-15,maxZ:25,minY:-1,maxY:3.18}),
 ROSTRUM_CLEARANCE,
 Object.freeze({minX:7,maxX:77,minZ:-43,maxZ:-12,minY:-1,maxY:5}),
]);
export const RACE_SURFACES=Object.freeze([
 Object.freeze({minX:7,maxX:77,minZ:-43,maxZ:-12,material:'concrete'}),
 Object.freeze({minX:35,maxX:53,minZ:-12,maxZ:9,material:'concrete'}),
 Object.freeze({minX:35,maxX:54,minZ:9,maxZ:25,material:'soil'}),
 // Blend the inside of the returning bend with the L-shaped dirt field.
 Object.freeze({minX:32,maxX:35,minZ:39,maxZ:43,material:'soil'}),
]);
export function groundHeight(x,z){
 if(z<=-15)return -.58;
 if(z<-10)return -.58+.60*smooth((z+15)/5);
 if(z<=7)return .02;
 if(z<12)return .02-.32*smooth((z-7)/5);
 return -.30;
}
function geometry(segment,t){
 let x,z,tx,tz,curve=0;
 if(segment.kind==='line'){
  x=segment.x0+segment.dx*t;z=segment.z0+segment.dz*t;
  tx=segment.dx/segment.size;tz=segment.dz/segment.size;
 }else{
  const angle=segment.angle+segment.sweep*t,direction=Math.sign(segment.sweep);
  x=segment.cx+Math.cos(angle)*segment.radius;z=segment.cz+Math.sin(angle)*segment.radius;
  tx=-Math.sin(angle)*direction;tz=Math.cos(angle)*direction;curve=-direction/segment.radius;
 }
 return {x,z,tx,tz,nx:-tz,nz:tx,curve,width:typeof segment.width==='function'?segment.width(t):segment.width,zone:segment.zone};
}
function segmentAt(distance){
 const s=mod(distance,length);let lo=0,hi=segments.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(s>=segments[mid].start+segments[mid].size)lo=mid+1;else hi=mid;}
 return {segment:segments[lo],s};
}
export function trackPoint(distance,lane=0){
 const {segment,s}=segmentAt(distance),p=geometry(segment,(s-segment.start)/segment.size);
 p.x+=p.nx*lane;p.z+=p.nz*lane;
 return {...p,s,lane,height:groundHeight(p.x,p.z),yaw:Math.atan2(-p.tx,-p.tz)};
}
// Project onto a short arc-length window when progress is supplied. Two nearby
// central lanes run in opposite directions: a global-nearest projection would
// otherwise jump to the return branch and award progress before the rear loop.
export function nearestTrack(x,z,hint){
 const local=Number.isFinite(hint),center=local?mod(hint,length):0,window=42;
 let best=null,bestDistance=Infinity;
 for(const segment of segments){
  for(const shift of local?[-length,0,length]:[0]){
   const start=segment.start+shift;
   const lower=local?Math.max(0,(center-window-start)/segment.size):0;
   const upper=local?Math.min(1,(center+window-start)/segment.size):1;
   if(lower>upper)continue;
   let t;
   if(segment.kind==='line')t=clamp(((x-segment.x0)*segment.dx+(z-segment.z0)*segment.dz)/(segment.size*segment.size),lower,upper);
   else{
    const angle=Math.atan2(z-segment.cz,x-segment.cx),sweep=Math.abs(segment.sweep);
    const travelled=mod((angle-segment.angle)*Math.sign(segment.sweep),TAU);
    if(travelled<=sweep)t=clamp(travelled/sweep,lower,upper);
    else{
     const a=geometry(segment,lower),b=geometry(segment,upper);
     t=(x-a.x)**2+(z-a.z)**2<=(x-b.x)**2+(z-b.z)**2?lower:upper;
    }
   }
   const p=geometry(segment,t),dx=x-p.x,dz=z-p.z,distance=dx*dx+dz*dz;
   if(distance>=bestDistance)continue;
   bestDistance=distance;
   best={...p,s:mod(segment.start+t*segment.size,length),lane:dx*p.nx+dz*p.nz,distance:Math.sqrt(distance),height:groundHeight(x,z),yaw:Math.atan2(-p.tx,-p.tz)};
  }
 }
 return best;
}
const bounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
for(const segment of segments)for(let i=0;i<=64;i++){
 const p=geometry(segment,i/64);
 for(const lane of [-p.width/2,p.width/2]){
  const x=p.x+p.nx*lane,z=p.z+p.nz*lane;
  bounds.minX=Math.min(bounds.minX,x);bounds.maxX=Math.max(bounds.maxX,x);bounds.minZ=Math.min(bounds.minZ,z);bounds.maxZ=Math.max(bounds.maxZ,z);
 }
}
export const TRACK=Object.freeze({name:'운동장 · 중앙현관 · 후문 주차장',width:10,length,bounds:Object.freeze(bounds),height:-.30});
export const COURSE_SECTIONS=Object.freeze(segments.map(s=>Object.freeze({start:s.start,length:s.size,zone:s.zone})));
