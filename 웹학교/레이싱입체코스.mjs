// Closed, arc-length sampled circuits. No renderer dependency: the server uses
// the very same versioned geometry when validating shared records.
const mod=(x,n)=>(x%n+n)%n;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const COURSE_VERSION='2026-11-worlds-1';
const definitions=[
 {id:'skyway',name:'스카이웨이 고속도로',theme:'highway',tag:'긴 직선 · 시원한 추월',color:'#77ddff',width:15,
  description:'학교 바깥으로 펼쳐진 고속도로! 긴 직선에서 부스트를 모으고 큰 곡선에서 추월하세요.',
  nodes:[[40,108,5],[115,108,5],[155,65,8],[155,-35,10],[110,-72,8],[10,-72,6],[-52,-35,5],[-52,65,5],[-5,108,5]],
  highlights:[{at:.14,label:'부스트로 질주하는 고속 직선'},{at:.43,label:'학교를 내려다보는 전망 커브'}]},
 {id:'tunnel-run',name:'오로라 터널 러시',theme:'tunnel',tag:'빛의 터널 · 연속 코너',color:'#be9bff',width:13,
  description:'보랏빛 터널을 빠져나와 햇빛 속으로! 연속 코너를 깔끔하게 돌면 기록이 달라져요.',
  nodes:[[30,125,2],[110,125,2],[158,100,3],[172,45,5],[142,5,7],[162,-55,5],[105,-92,3],[20,-92,3],[-65,-65,3],[-85,0,4],[-48,58,3],[-58,112,2]],
  tunnels:[[.06,.26],[.45,.65]],highlights:[{at:.16,label:'빛의 아치를 통과하는 터널'},{at:.40,label:'터널 밖 연속 코너'}]},
 {id:'rooftop',name:'석암 루프탑 브리지',theme:'bridge',tag:'옥상 질주 · 오르막과 내리막',color:'#ffbc78',width:12,
  description:'긴 경사로를 올라 학교 옥상 위로! 하늘 가까이에서 달리는 특별한 레이스예요.',
  nodes:[[40,110,1],[110,110,2],[148,65,8],[145,0,16],[110,-27,19],[55,-4,19],[3,-4,19],[-38,-30,17],[-70,10,11],[-70,72,4],[-25,110,1]],
  highlights:[{at:.46,label:'학교 옥상 위 루프탑 직선'},{at:.24,label:'하늘로 올라가는 고가교'}]},
 {id:'champion-world',name:'Rock On 그랜드 피날레',theme:'final',tag:'고속도로 × 터널 × 고가교',color:'#ff839c',width:12,
  description:'모든 실력을 펼칠 결승 무대! 고속 질주, 빛의 터널, 옥상 브리지를 한 번에 정복하세요.',
  nodes:[[40,145,2],[125,145,2],[183,100,4],[180,25,11],[150,-45,19],[90,-28,20],[38,-5,19],[-5,-5,19],[-60,-65,13],[-110,-20,7],[-105,65,4],[-65,100,5],[-15,125,5]],
  tunnels:[[.03,.14],[.55,.68]],highlights:[{at:.39,label:'결승 코스의 옥상 브리지'},{at:.61,label:'추월을 노리는 마지막 터널'},{at:.84,label:'다시 솟아오르는 입체 커브'}]}
];
function hermite(a,b,c,d,t,k){
 const t2=t*t,t3=t2*t,m=(c[k]-a[k])*.5,n=(d[k]-b[k])*.5;
 return (2*t3-3*t2+1)*b[k]+(t3-2*t2+t)*m+(-2*t3+3*t2)*c[k]+(t3-t2)*n;
}
function make(def){
 const samples=[],nodes=def.nodes;let length=0,previous;
 for(let i=0;i<nodes.length;i++){
  const a=nodes[mod(i-1,nodes.length)],b=nodes[i],c=nodes[(i+1)%nodes.length],d=nodes[(i+2)%nodes.length];
  const count=Math.max(32,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])*1.5));
  for(let j=0;j<count;j++){
   const t=j/count,p={x:hermite(a,b,c,d,t,0),z:hermite(a,b,c,d,t,1),height:hermite(a,b,c,d,t,2)};
   if(previous)length+=Math.hypot(p.x-previous.x,p.z-previous.z);p.s=length;samples.push(p);previous=p;
  }
 }
 length+=Math.hypot(previous.x-samples[0].x,previous.z-samples[0].z);
 samples.push({...samples[0],s:length});
 function at(s){let lo=0,hi=samples.length-2;while(lo<hi){const m=(lo+hi+1)>>1;if(samples[m].s<=s)lo=m;else hi=m-1;}return lo;}
 function trackPoint(distance,lane=0){
  const s=mod(distance,length),i=at(s),a=samples[i],b=samples[i+1],ds=b.s-a.s,t=(s-a.s)/ds;
  const tx=(b.x-a.x)/ds,tz=(b.z-a.z)/ds,nx=-tz,nz=tx;
  const before=samples[mod(i-2,samples.length-1)],after=samples[(i+2)%(samples.length-1)];
  const da=Math.atan2(a.z-before.z,a.x-before.x),db=Math.atan2(after.z-b.z,after.x-b.x);
  const curve=-Math.atan2(Math.sin(db-da),Math.cos(db-da))/Math.max(.1,Math.hypot(a.x-before.x,a.z-before.z)+ds+Math.hypot(after.x-b.x,after.z-b.z));
  const tunnel=(def.tunnels??[]).some(([a,b])=>s/length>=a&&s/length<=b);
  return {x:a.x+(b.x-a.x)*t+nx*lane,z:a.z+(b.z-a.z)*t+nz*lane,height:a.height+(b.height-a.height)*t,
   slope:(b.height-a.height)/ds,tx,tz,nx,nz,yaw:Math.atan2(-tx,-tz),curve,width:def.width,s,lane,tunnel,
   zone:tunnel?'빛의 터널':a.height>17?'학교 옥상 브리지':a.height>7?'고가교':def.name};
 }
 function nearestTrack(x,z,hint){
  const local=Number.isFinite(hint),center=local?mod(hint,length):0;
  let best=Infinity,bestS=0;
  const begin=local?at(mod(center-42,length)):0,end=local?at(mod(center+42,length)):samples.length-2;
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
 return Object.freeze({...def,nodes:undefined,version:COURSE_VERSION,length,bounds:Object.freeze(bounds),height:2,direction:1,layout:def.theme,
  trackPoint,nearestTrack,sections:Object.freeze(samples.filter((_,i)=>i%50===0).map(p=>({start:p.s,zone:trackPoint(p.s).zone}))),elevated:true});
}
export const WORLD_COURSES=Object.freeze(definitions.map(make));
