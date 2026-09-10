import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {LOBBY_OPEN} from '../일층배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const world=buildWorld(data);
function hit(p,d,b){
  let lo=0,hi=Infinity;
  for(let k=0;k<3;k++){
    if(Math.abs(d[k])<1e-9){if(p[k]<b[k]||p[k]>b[k+3])return false;continue;}
    let a=(b[k]-p[k])/d[k],c=(b[k+3]-p[k])/d[k];
    if(a>c)[a,c]=[c,a];lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return false;
  }return hi>1e-5;
}
let rays=0,points=0;const leaks=[];
for(const room of world.data.rooms.filter(r=>r.type!=='stair')){
  const [x0,x1,y0,y1,z]=room.bounds;
  const samples=[[(x0+x1)/2,(y0+y1)/2]];
  if(room.type==='corridor'){
    const n=Math.ceil(Math.max(x1-x0,y1-y0)/2);
    for(let i=1;i<n;i++)samples.push([x1-x0>y1-y0?x0+(x1-x0)*i/n:(x0+x1)/2,x1-x0>y1-y0?(y0+y1)/2:y0+(y1-y0)*i/n]);
  }
  for(const [x,y] of samples){
    if(!world.candidate(x,y,z))continue;points++;
    for(const height of [1.58,3.08])for(const rise of [0,.15,.6,2])for(let a=0;a<36;a++){
      const p=[x,y,z+height],d=[Math.cos(a*Math.PI/18),Math.sin(a*Math.PI/18),rise];
      // Only deliberate opening is the ground-floor courtyard entrance.
      const t=(-7-y)/d[1],exitX=x+t*d[0],exitZ=p[2]+t*d[2];
      if(z===0&&t>0&&exitX>=LOBBY_OPEN.left-.15&&exitX<=LOBBY_OPEN.right+.15&&exitZ<LOBBY_OPEN.height)continue;
      rays++;
      if(!world.boxes.some(b=>hit(p,d,b.bounds)))leaks.push({room:room.id,p,d});
    }
  }
}
const report={ok:leaks.length===0,points,rays,leaks,scope:'Sampled rays at eye level and upper wall junction; intentional courtyard door excluded. Not an exhaustive mesh proof.'};
fs.writeFileSync(new URL('../../공간자료/웹틈새검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));assert.equal(leaks.length,0);
