// Race-only circuit: a large playground loop and rear-parking loop joined by
// separate outbound/return lanes through the main central entrance. Coordinates
// are Three.js world X/Z. This module never changes the school's source model.
import {WORLD_COURSES,COURSE_VERSION} from './레이싱입체코스.mjs';
export {COURSE_VERSION} from './레이싱입체코스.mjs';
const TAU=Math.PI*2;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const mod=(value,divisor)=>(value%divisor+divisor)%divisor;
const smooth=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
function buildSegments(layout='outer'){
 const segments=[];let length=0;
function line(x0,z0,x1,z1,width=10,zone='운동장'){
 const dx=x1-x0,dz=z1-z0,size=Math.hypot(dx,dz);
 segments.push({kind:'line',x0,z0,dx,dz,size,start:length,width,zone});length+=size;
}
function arc(cx,cz,radius,angle,sweep,width=10,zone='운동장'){
 const size=Math.abs(radius*sweep);
 segments.push({kind:'arc',cx,cz,radius,angle,sweep,size,start:length,width,zone});length+=size;
}
const transition=(from,to)=>(t)=>from+(to-from)*smooth(t);
function wave(x0,z0,x1,z1,amplitude,zone){
 const dx=x1-x0,dz=z1-z0,chord=Math.hypot(dx,dz),segment={kind:'wave',x0,z0,dx,dz,nx:-dz/chord,nz:dx/chord,amplitude,zone,width:t=>10-2*Math.sin(Math.PI*t)**2,start:length,distances:[0]};
 let previous=waveRaw(segment,0),size=0;
 for(let i=1;i<=256;i++){const p=waveRaw(segment,i/256);size+=Math.hypot(p.x-previous.x,p.z-previous.z);segment.distances.push(size);previous=p;}
 segment.size=size;segments.push(segment);length+=size;
}
// A long, unobstructed southern straight holds the entire starting grid.
const east=layout==='inner'?70:79,bend=east-8;
if(layout==='slalom')wave(36,63.5,71,63.5,-5.5,'운동장 남쪽 S 코너');else line(36,63.5,bend,63.5);
arc(bend,55.5,8,Math.PI/2,-Math.PI/2);
if(layout==='slalom')wave(east,55.5,east,35,-2.3,'운동장 동쪽 S 코너');else line(east,55.5,east,35);
arc(bend,35,8,0,-Math.PI/2);
line(bend,27,56,27);
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
return {segments,length};
}

// Smooth analytic waves use a small arc-length table, not one mesh or object
// per sample. Projection uses bounded Newton iteration to keep physics cheap.
function waveRaw(segment,u,out={}){
 const angle=TAU*u,offset=segment.amplitude*(1-Math.cos(angle))/2,velocity=segment.amplitude*Math.PI*Math.sin(angle),acceleration=segment.amplitude*2*Math.PI*Math.PI*Math.cos(angle);
 out.x=segment.x0+segment.dx*u+segment.nx*offset;out.z=segment.z0+segment.dz*u+segment.nz*offset;out.dx=segment.dx+segment.nx*velocity;out.dz=segment.dz+segment.nz*velocity;out.ddx=segment.nx*acceleration;out.ddz=segment.nz*acceleration;return out;
}
function waveU(segment,t){
 const target=t*segment.size,table=segment.distances;let lo=0,hi=256;
 while(lo+1<hi){const mid=(lo+hi)>>1;if(table[mid]<target)lo=mid;else hi=mid;}
 return (lo+(target-table[lo])/Math.max(.00001,table[hi]-table[lo]))/256;
}
function waveT(segment,u){const position=clamp(u,0,1)*256,index=Math.min(255,Math.floor(position)),a=segment.distances[index],b=segment.distances[index+1];return (a+(b-a)*(position-index))/segment.size;}

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
const waveGeometryScratch={};
function geometry(segment,t,out={}){
 let x,z,tx,tz,curve=0;
 if(segment.kind==='line'){
  x=segment.x0+segment.dx*t;z=segment.z0+segment.dz*t;
  tx=segment.dx/segment.size;tz=segment.dz/segment.size;
 }else if(segment.kind==='wave'){
  const p=waveRaw(segment,waveU(segment,t),waveGeometryScratch),speed=Math.hypot(p.dx,p.dz);
  x=p.x;z=p.z;tx=p.dx/speed;tz=p.dz/speed;curve=-(p.dx*p.ddz-p.dz*p.ddx)/(speed**3);
 }else{
  const angle=segment.angle+segment.sweep*t,direction=Math.sign(segment.sweep);
  x=segment.cx+Math.cos(angle)*segment.radius;z=segment.cz+Math.sin(angle)*segment.radius;
  tx=-Math.sin(angle)*direction;tz=Math.cos(angle)*direction;curve=-direction/segment.radius;
 }
 out.x=x;out.z=z;out.tx=tx;out.tz=tz;out.nx=-tz;out.nz=tx;out.curve=curve;out.width=typeof segment.width==='function'?segment.width(t):segment.width;out.zone=segment.zone;return out;
}
function makeCourse({id,name,description,layout}){
 const {segments,length}=buildSegments(layout);
 for(const segment of segments){segment.first=geometry(segment,0);segment.last=geometry(segment,1);}
function segmentAt(s){
 let lo=0,hi=segments.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(s>=segments[mid].start+segments[mid].size)lo=mid+1;else hi=mid;}
 return segments[lo];
}
function trackPoint(distance,lane=0){
 const s=mod(distance,length),segment=segmentAt(s),p=geometry(segment,(s-segment.start)/segment.size);
 p.x+=p.nx*lane;p.z+=p.nz*lane;
 p.s=s;p.lane=lane;p.height=groundHeight(p.x,p.z);p.yaw=Math.atan2(-p.tx,-p.tz);return p;
}
// Exact broad phase: a bin contains every segment which could overlap any
// +/-42 m window in that bin. The original lower/upper limits and iteration
// order still decide the result, including ties at section boundaries.
const projectionWindow=42,binSize=8;
const globalCandidates=segments.map(segment=>({segment,start:segment.start}));
const localCandidates=Array.from({length:Math.ceil(length/binSize)},(_,index)=>{
 const minimum=index*binSize-projectionWindow,maximum=Math.min(length,(index+1)*binSize)+projectionWindow,candidates=[];
 for(const segment of segments)for(const shift of [-length,0,length]){
  const start=segment.start+shift;if(start+segment.size>=minimum&&start<=maximum)candidates.push({segment,start});
 }return candidates;
});
// All scratch values are private to this synchronous query. Returned results
// remain separate objects so a caller can safely retain previous projections.
const pointScratch={},lowerScratch={},upperScratch={},newtonScratch={};
// Project onto a short arc-length window when progress is supplied. Two nearby
// central lanes run in opposite directions: a global-nearest projection would
// otherwise jump to the return branch and award progress before the rear loop.
function nearestTrack(x,z,hint){
 const local=Number.isFinite(hint),center=local?mod(hint,length):0,window=projectionWindow;
 let best=null,bestDistance=Infinity;
 const candidates=local?localCandidates[Math.floor(center/binSize)]:globalCandidates;
 for(const candidate of candidates){
   const {segment,start}=candidate;
   const lower=local?Math.max(0,(center-window-start)/segment.size):0;
   const upper=local?Math.min(1,(center+window-start)/segment.size):1;
   if(lower>upper)continue;
   let t;
   if(segment.kind==='line')t=clamp(((x-segment.x0)*segment.dx+(z-segment.z0)*segment.dz)/(segment.size*segment.size),lower,upper);
   else if(segment.kind==='wave'){
    const minU=waveU(segment,lower),maxU=waveU(segment,upper),square=segment.dx**2+segment.dz**2;
    let u=clamp(((x-segment.x0)*segment.dx+(z-segment.z0)*segment.dz)/square,minU,maxU);
    for(let i=0;i<6;i++){const p=waveRaw(segment,u,newtonScratch),numerator=(p.x-x)*p.dx+(p.z-z)*p.dz,denominator=p.dx*p.dx+p.dz*p.dz+(p.x-x)*p.ddx+(p.z-z)*p.ddz;if(Math.abs(denominator)<.001)break;u=clamp(u-numerator/denominator,minU,maxU);}
    t=clamp(waveT(segment,u),lower,upper);
   }else{
    const angle=Math.atan2(z-segment.cz,x-segment.cx),sweep=Math.abs(segment.sweep);
    const travelled=mod((angle-segment.angle)*Math.sign(segment.sweep),TAU);
    if(travelled<=sweep)t=clamp(travelled/sweep,lower,upper);
    else{
     const a=lower===0?segment.first:geometry(segment,lower,lowerScratch),b=upper===1?segment.last:geometry(segment,upper,upperScratch);
     t=(x-a.x)**2+(z-a.z)**2<=(x-b.x)**2+(z-b.z)**2?lower:upper;
    }
   }
   const p=t===0?segment.first:t===1?segment.last:geometry(segment,t,pointScratch),dx=x-p.x,dz=z-p.z,distance=dx*dx+dz*dz;
   if(distance>=bestDistance)continue;
   bestDistance=distance;
   best??={};best.x=p.x;best.z=p.z;best.tx=p.tx;best.tz=p.tz;best.nx=p.nx;best.nz=p.nz;best.curve=p.curve;best.width=p.width;best.zone=p.zone;best.s=mod(segment.start+t*segment.size,length);best.lane=dx*p.nx+dz*p.nz;
 }
 if(best){best.distance=Math.sqrt(bestDistance);best.height=groundHeight(x,z);best.yaw=Math.atan2(-best.tx,-best.tz);}
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
 const sections=Object.freeze(segments.map(s=>Object.freeze({start:s.start,length:s.size,zone:s.zone})));
 return Object.freeze({id,name,description,width:10,length,bounds:Object.freeze(bounds),height:-.30,trackPoint,nearestTrack,sections,direction:1,layout});
}
const outer=makeCourse({id:'playground-outer',name:'운동장 외곽 순환',description:'넓은 운동장을 돌아 중앙현관과 후문 주차장까지 달려요.',layout:'outer'});
export const RACE_COURSES=Object.freeze([Object.freeze({...outer,version:COURSE_VERSION,theme:'school',tag:'운동장 · 학교 · 후문',color:'#8ae8c0',highlights:[{at:.35,label:'학교 중앙현관을 통과하는 레이스'}]}),...WORLD_COURSES]);
export function getRaceCourse(round=1){return RACE_COURSES[clamp(Math.floor(Number(round)||1),1,RACE_COURSES.length)-1];}
// Compatibility exports retain round one for existing school diagnostics.
export const TRACK=outer;
export const trackPoint=(distance,lane=0)=>outer.trackPoint(distance,lane);
export const nearestTrack=(x,z,hint)=>outer.nearestTrack(x,z,hint);
export const COURSE_SECTIONS=outer.sections;
