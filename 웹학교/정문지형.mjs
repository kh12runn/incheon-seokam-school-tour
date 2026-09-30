import {subtractBox} from './창문배치.mjs';
import {HALL_EXIT,BASEMENT_FOOTPRINT} from './지하층배치.mjs';
import {addGatePhotoDetails} from './야외사진세부.mjs';
// Lower gate side is level with B1; the yard rises continuously toward the rostrum.
// Approximate grading, not surveyed dimensions. No external flight of stairs.
export function gateGroundHeight(x,y,base=-3.4,cap=-.3){
  return Math.min(cap,base+Math.max(0,x+2)*(cap-base)/34+Math.max(0,-y-14)*(cap-base)/26);
}
export function addGateTerrain(boxes,colliders,surfaces,floorHeight){
  const base=-floorHeight,cut=[-23.5,-42,-10,34,-7,.05];
  for(const list of [boxes,colliders,surfaces]){
    const next=list.flatMap(b=>b.name.startsWith('SiteGround')||b.name==='SPACE_EXT_PLAYGROUND'?subtractBox(b,cut):[b]);list.splice(0,list.length,...next);
  }
  const xs=[-23.5,-18,-14,-12,-9.5,-8,-4,-2,0,2,6,10,14,18,22,26,30,32,34],ys=[-42,-40,-36,-32,-28,-24,-20,-16,-14,-12,-11,-9,-7];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
    const x0=xs[i],x1=xs[i+1],y0=ys[j],y1=ys[j+1],cap=x0>=-9.5&&y1<=-11?-.3:-.6;
    const heights=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>gateGroundHeight(x,y,base,cap));
    const bounds=[x0,y0,base-.2,x1,y1,Math.max(...heights)],path=y0>=-16&&y1<=-7&&(x1>HALL_EXIT.left-1||y1<=-11);
    boxes.push({name:`정문 경사지 ${i} ${j}`,bounds,heights,shape:'terrain',kind:'finish',floor:0,color:path?[.025,.43,.83]:[.61,.52,.41],material:path?'paint':'soil'});
    surfaces.push({name:`정문 경사지 ${i} ${j}`,bounds,height:(x,y)=>{
      const u=(x-x0)/(x1-x0),v=(y-y0)/(y1-y0),[a,b,c,d]=heights;
      return u>=v?a+u*(b-a)+v*(c-b):a+u*(c-d)+v*(d-a);
    }});
  }
  const add=(name,bounds,color=[.63,.63,.59],solid=true)=>{const b={name:'정문 연결 '+name,bounds,color,kind:'finish',floor:0,material:'paint'};boxes.push(b);if(solid)colliders.push(b);return b;};
  const threshold=[HALL_EXIT.left,-7.25,base-.16,HALL_EXIT.right,-6.9,base];add('문턱 없는 바닥',threshold,[.025,.43,.83],false);surfaces.push({name:'정문 연결 문턱',bounds:threshold,height:()=>base});
  // Photo ac3f6a9e: white ramp edge. Dimensions follow the existing estimated
  // slope; the hall doorway and the uphill walking lane remain open.
  for(let x=-2;x<26;x+=2){
    const low=gateGroundHeight(x,-16,base,-.3),high=gateGroundHeight(x+2,-16,base,-.3);
    const wall=add('사진 흰 경사로 옹벽 '+x,[x,-16.22,low-.15,x+2,-16.02,high+.85],[.9,.91,.88]);
    wall.shape='terrain';wall.heights=[low+.85,high+.85,high+.85,low+.85];
  }
  // Exposed foundation seals the higher classroom block along the uphill path.
  add('본관 하부 기초',[HALL_EXIT.right+4.9,-7.19,base-.2,34,-7.09,0],[.69,.7,.67]);
  add('서쪽 대지 옹벽',[-23.5,-7.1,base-.2,BASEMENT_FOOTPRINT[0]-.08,-6.95,-.6],[.69,.7,.67]);
  // Existing terraced seating and tree trunks must meet the newly lowered grade.
  for(const b of [...boxes]){
    if(!b.name.startsWith('사진야외 ')||!b.collision)continue;
    const a=b.bounds,x=(a[0]+a[3])/2,y=(a[1]+a[4])/2;
    if(x<cut[0]||x>cut[3]||y<cut[1]||y>cut[4])continue;
    const low=Math.min(...[[a[0],a[1]],[a[3],a[1]],[a[0],a[4]],[a[3],a[4]]].map(([x,y])=>gateGroundHeight(x,y,base,-.6)));
    if(low<a[2]-.05)add('기존 시설 기초 '+b.name,[a[0],a[1],low-.1,a[3],a[4],a[2]],b.color);
  }
  addGatePhotoDetails(boxes,colliders,surfaces,base);
}
