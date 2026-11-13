// Closed, arc-length sampled circuits. No renderer dependency: the server uses
// the very same versioned geometry when validating shared records.
const mod=(x,n)=>(x%n+n)%n;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const COURSE_VERSION='2026-11-campus-crossings-2';
const definitions=[
 {id:'skyway',name:'캠퍼스 S자 러시',theme:'highway',tag:'운동장 S자 · 본관 관통 · 주차장',color:'#77ddff',width:10,
  description:'운동장을 구불구불 가로질러 본관 안으로! 두 개의 건물 통로와 후문 주차장을 연결하는 캠퍼스 레이스예요.',
  nodes:[[34,67,.2],[65,67,.2],[79,53,.2],[65,39,.2],[48,41,.2],[32,30,.2],[27,13,.2],[27,-8,.2],[31,-27,.2],[51,-35,.2],[72,-31,.2],[78,-14,.2],[69,4,.2],[86,20,.2],[100,45,.2],[94,70,.2],[72,89,.2],[39,92,.2],[5,81,.2],[-12,61,.2],[-7,36,.2],[10,30,.2],[20,44,.2],[14,58,.2],[20,67,.2]],
  highlights:[{node:7,label:'본관을 뚫고 주차장으로!'},{node:4,label:'운동장 한가운데 S 코너'},{node:10,label:'후문 주차장 추월 구간'}]},
 {id:'tunnel-run',name:'운동장 지하 탐험',theme:'tunnel',tag:'지하 굴곡 터널 · 별관 통과',color:'#be9bff',width:10,
  description:'운동장 밑으로 내려가 지하 S 터널을 달려요. 다시 올라오면 후문 주차장과 별관을 통과해 운동장으로 돌아옵니다.',
  nodes:[[30,75,.2],[60,75,-.5],[80,60,-5],[82,40,-9],[64,25,-10],[40,25,-10],[15,36,-9],[5,17,-7],[10,-7,-3],[25,-28,.2],[60,-35,.2],[88,-22,.2],[103,0,.2],[102,29,.2],[84,45,.2],[60,44,.2],[44,51,.2],[29,50,.2],[18,63,.2]],
  highlights:[{node:5,label:'운동장 아래 지하 S 터널'},{node:14,label:'별관을 통과해 햇빛 속으로'},{node:8,label:'본관 아래를 지나는 오르막'}]},
 {id:'rooftop',name:'옥상 크로스오버',theme:'bridge',tag:'학교 옥상 횡단 · 운동장 공중 S자',color:'#ffbc78',width:10,
  description:'학교 옆 경사로를 올라 본관 옥상을 가로질러요! 운동장 위 S자 다리에서 아까 지나온 길을 내려다보며 달려보세요.',
  nodes:[[30,80,.2],[69,80,1],[103,68,7],[115,43,14],[110,14,20],[88,-4,20],[54,-4,20],[20,-4,20],[-10,3,17],[-20,28,12],[-5,45,8],[22,38,8],[51,19,8],[69,31,7],[67,53,5],[43,55,2],[13,59,.2],[10,74,.2]],
  highlights:[{node:6,label:'본관 옥상을 가로지르는 직선'},{node:11,label:'운동장 위 공중 S자 다리'},{node:3,label:'옥상으로 올라가는 경사로'}]},
 {id:'champion-world',name:'석암 입체 대모험',theme:'final',tag:'옥상 → 운동장 지하 → 건물 관통',color:'#ff839c',width:10,
  description:'학교 위와 아래를 모두 달리는 최종 코스! 옥상에서 운동장 지하로 내려간 뒤 별관과 본관을 관통해 결승선으로 돌아와요.',
  nodes:[[30,76,.2],[67,76,.2],[99,61,5],[113,29,16],[94,8,20],[62,-3,20],[28,-3,20],[-4,12,18],[-8,40,13],[20,50,8],[48,36,2],[68,22,-6],[63,0,-10],[37,-12,-10],[13,4,-10],[24,26,-10],[51,47,-10],[76,44,-8],[93,27,-3],[96,0,.2],[83,-28,.2],[53,-38,.2],[22,-31,.2],[10,-8,.2],[10,22,.2],[-8,50,.2],[2,70,.2]],
  highlights:[{node:5,label:'학교 옥상 횡단'},{node:13,label:'본관과 운동장 아래 지하 터널'},{node:18,label:'별관 안으로 솟아오르는 출구'},{node:23,label:'본관을 관통하는 마지막 구간'}]}
];
const inBuilding=(x,z)=>x>-23&&x<104&&z>-16&&z<10||x>82&&x<104&&z>=10&&z<85;
function hermite(a,b,c,d,t,k){
 const t2=t*t,t3=t2*t,m=(c[k]-a[k])*.5,n=(d[k]-b[k])*.5;
 return (2*t3-3*t2+1)*b[k]+(t3-2*t2+t)*m+(-2*t3+3*t2)*c[k]+(t3-t2)*n;
}
function make(def){
 const samples=[],nodes=def.nodes,starts=[],segments=[];let length=0,previous;
 for(let i=0;i<nodes.length;i++){
  const a=nodes[mod(i-1,nodes.length)],b=nodes[i],c=nodes[(i+1)%nodes.length],d=nodes[(i+2)%nodes.length];
  const count=Math.max(32,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])*1.5));
  const segment=[];
  for(let j=0;j<count;j++){
   const t=j/count,p={x:hermite(a,b,c,d,t,0),z:hermite(a,b,c,d,t,1),height:hermite(a,b,c,d,t,2)};
   if(previous)length+=Math.hypot(p.x-previous.x,p.z-previous.z);p.s=length;if(j===0)starts.push(length);samples.push(p);segment.push(p);previous=p;
  }
  segments.push(segment);
 }
 length+=Math.hypot(previous.x-samples[0].x,previous.z-samples[0].z);
 samples.push({...samples[0],s:length});
 // Race-only oriented cut volumes follow curves through the building and ramp
 // mouths. Deep tunnels keep the original playground surface above their roof.
 const cutVolumes=[],volumePlans=[];
 function volume(points){
  const a=points[0],b=points.at(-1),distance=Math.hypot(b.x-a.x,b.z-a.z),tx=(b.x-a.x)/distance,tz=(b.z-a.z)/distance,cx=(a.x+b.x)/2,cz=(a.z+b.z)/2,heightCenter=(a.height+b.height)/2,heightSlope=(b.height-a.height)/distance;
  let halfL=distance/2,halfW=0,minY=Infinity,maxY=-Infinity,lower=Infinity,upper=-Infinity;
  let bend=0;
  for(let i=0;i<points.length;i++){
   const p=points[i],before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],ds=Math.hypot(after.x-before.x,after.z-before.z),nx=-(after.z-before.z)/ds,nz=(after.x-before.x)/ds;
   bend=Math.max(bend,Math.abs(-(p.x-cx)*tz+(p.z-cz)*tx));
   // Include both shoulders, not just the centreline. On a bend the outside
   // shoulder extends beyond a segment end; otherwise earth wedges remain in
   // the tunnel at those joins. Fit the sloping ceiling to the same cross-section.
   for(const lane of [-def.width/2-1.2,def.width/2+1.2]){
    const dx=p.x+nx*lane-cx,dz=p.z+nz*lane-cz,along=dx*tx+dz*tz,residual=p.height-(heightCenter+along*heightSlope);
    halfL=Math.max(halfL,Math.abs(along));halfW=Math.max(halfW,Math.abs(-dx*tz+dz*tx));lower=Math.min(lower,residual);upper=Math.max(upper,residual);
   }
   minY=Math.min(minY,p.height);maxY=Math.max(maxY,p.height);
  }
  return {cx,cz,tx,tz,halfL:halfL+.65,halfW:halfW+.25,minY:minY-1.2,maxY:maxY+5.6,heightCenter,heightSlope,lower:lower-1.2,upper:upper+5.6,bend};
 }
 for(let i=0;i<segments.length;i++){
  const b=nodes[(i+1)%nodes.length],points=[...segments[i],{x:b[0],z:b[1],height:b[2]}];
  if(!points.some(p=>p.height<1||p.height<16&&(inBuilding(p.x,p.z)||p.z<-14)))continue;
  volumePlans.push({points,whole:volume(points)});
 }
 const splits=new Set(volumePlans.filter(p=>p.whole.bend>1.2).sort((a,b)=>b.whole.bend-a.whole.bend).slice(0,32-volumePlans.length));
 for(const plan of volumePlans){if(splits.has(plan)){const mid=Math.floor(plan.points.length/2);cutVolumes.push(volume(plan.points.slice(0,mid+1)),volume(plan.points.slice(mid)));}else cutVolumes.push(plan.whole);}
 if(cutVolumes.length>32)throw Error('Too many school tunnel cuts');
 const tunnelAt=p=>p.height<-.6||p.height<15&&inBuilding(p.x,p.z);
 const tunnels=[];let tunnelStart=null;
 for(const p of samples){if(tunnelAt(p)&&tunnelStart===null)tunnelStart=p.s/length;if(!tunnelAt(p)&&tunnelStart!==null){tunnels.push([tunnelStart,p.s/length]);tunnelStart=null;}}
 if(tunnelStart!==null)tunnels.push([tunnelStart,1]);
 function at(s){let lo=0,hi=samples.length-2;while(lo<hi){const m=(lo+hi+1)>>1;if(samples[m].s<=s)lo=m;else hi=m-1;}return lo;}
 function trackPoint(distance,lane=0){
  const s=mod(distance,length),i=at(s),a=samples[i],b=samples[i+1],ds=b.s-a.s,t=(s-a.s)/ds;
  const tx=(b.x-a.x)/ds,tz=(b.z-a.z)/ds,nx=-tz,nz=tx;
  const before=samples[mod(i-2,samples.length-1)],after=samples[(i+2)%(samples.length-1)];
  const da=Math.atan2(a.z-before.z,a.x-before.x),db=Math.atan2(after.z-b.z,after.x-b.x);
  const curve=-Math.atan2(Math.sin(db-da),Math.cos(db-da))/Math.max(.1,Math.hypot(a.x-before.x,a.z-before.z)+ds+Math.hypot(after.x-b.x,after.z-b.z));
  const tunnel=tunnels.some(([a,b])=>s/length>=a&&s/length<=b);
  return {x:a.x+(b.x-a.x)*t+nx*lane,z:a.z+(b.z-a.z)*t+nz*lane,height:a.height+(b.height-a.height)*t,
   slope:(b.height-a.height)/ds,tx,tz,nx,nz,yaw:Math.atan2(-tx,-tz),curve,width:def.width,s,lane,tunnel,
   zone:a.height< -2?'운동장 지하 터널':tunnel?'학교 건물 관통':a.height>17?'학교 옥상 브리지':a.height>5?'운동장 공중 S자':a.z<-14?'후문 주차장':'운동장 굴곡 코스'};
 }
 function nearestTrack(x,z,hint){
  const local=Number.isFinite(hint),center=local?mod(hint,length):0;
  let best=Infinity,bestS=0;
  const begin=local?at(mod(center-20,length)):0,end=local?at(mod(center+20,length)):samples.length-2;
  const count=local?mod(end-begin,samples.length-1)+1:samples.length-1;
  for(let j=0;j<count;j++){
   const i=(begin+j)%(samples.length-1),a=samples[i],b=samples[i+1],dx=b.x-a.x,dz=b.z-a.z;
   const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),d=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;
   if(d<best){best=d;bestS=a.s+(b.s-a.s)*t;}
  }
  const p=trackPoint(bestS);p.distance=Math.sqrt(best);p.lane=(x-p.x)*p.nx+(z-p.z)*p.nz;return p;
 }
 const bounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity,minY:Infinity,maxY:-Infinity};
 for(const p of samples){bounds.minX=Math.min(bounds.minX,p.x-def.width);bounds.maxX=Math.max(bounds.maxX,p.x+def.width);bounds.minZ=Math.min(bounds.minZ,p.z-def.width);bounds.maxZ=Math.max(bounds.maxZ,p.z+def.width);bounds.minY=Math.min(bounds.minY,p.height);bounds.maxY=Math.max(bounds.maxY,p.height);}
 return Object.freeze({...def,nodes:undefined,version:COURSE_VERSION,length,bounds:Object.freeze(bounds),height:2,direction:1,layout:def.theme,tunnels,cutVolumes,
  highlights:def.highlights.map(h=>({...h,at:starts[h.node]/length})),underground:bounds.minY< -2,
  trackPoint,nearestTrack,sections:Object.freeze(samples.filter((_,i)=>i%50===0).map(p=>({start:p.s,zone:trackPoint(p.s).zone}))),elevated:true});
}
export const WORLD_COURSES=Object.freeze(definitions.map(make));
