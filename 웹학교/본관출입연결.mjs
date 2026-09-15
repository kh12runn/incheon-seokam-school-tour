import {subtractBox} from './창문배치.mjs';
export const REAR_EXIT={left:34,right:36,y:3,height:2.65};
export const STAIR_REAR_EXIT={left:52.85,right:54.65,y:10,bottom:-.6,top:1.45};
export const ROOF_STAIR='MAIN_STAIR_B';

export function openRearExit(boxes,colliders,surfaces,addBox){
  // Exposed north corridor facade west of the storage/night-duty rooms.
  // Cut glazing, backing, frames and their collision together; leave every room intact.
  const cut=[34,2.7,-.05,36,3.4,2.65];
  for(const list of [boxes,colliders]){
    const next=list.flatMap(b=>b.bounds[5]<=.04?[b]:subtractBox(b,cut));list.splice(0,list.length,...next);
  }
  surfaces.push({name:'뒤 주차장 출입 경사로',bounds:[34,2.85,-.61,36,5.4,.01],height:(x,y)=>-.6*Math.max(0,Math.min(1,(y-3.2)/2.2))});
  for(let i=0;i<24;i++){
    const y=3+i*.1,z=-.6*Math.max(0,Math.min(1,(y-3.2)/2.2));
    addBox('뒤 현관 경사면 '+i,[34,y,z-.18,36,y+.1,z],[.65,.68,.65],'step',1);
  }
  for(const x of [33.88,36]){
    addBox('뒤 현관 문틀',[x,2.83,0,x+.12,3.2,2.78],[.62,.66,.65],'wall',1);
    addBox('뒤 현관 경사로 난간',[x,3.2,-.6,x+.10,5.4,.9],[.42,.49,.48],'wall',1);
  }
  addBox('뒤 현관 상부',[33.88,2.83,2.65,36.12,3.2,2.78],[.62,.66,.65],'wall',1);
}

export function addMainRooftop(data,boxes,surfaces,addBox){
  const z=4*data.floorHeight+.11;
  // Only existing main-building roofs become walkable. No new annex access.
  const roofs=boxes.filter(b=>b.kind==='roof'&&Math.abs(b.bounds[5]-z)<.02&&b.bounds[1]>=-7&&b.bounds[0]>=0);
  for(const b of roofs)surfaces.push({name:'본관 옥상 '+b.name,bounds:b.bounds,height:()=>b.bounds[5]});
  const footprints=roofs.map(b=>[b.bounds[0],b.bounds[3],b.bounds[1],b.bounds[4]]);
  footprints.push([50,55,3,10]); // Enclosed roof stair headhouse, not a solid roof over the opening.
  const xs=[...new Set(footprints.flatMap(b=>b.slice(0,2)))].sort((a,b)=>a-b);
  const ys=[...new Set(footprints.flatMap(b=>b.slice(2,4)))].sort((a,b)=>a-b);
  const inside=(x,y)=>footprints.some(b=>x>b[0]&&x<b[1]&&y>b[2]&&y<b[3]);
  const rail=(x0,y0,x1,y1)=>{
    // Continuous high guard prevents jumping off the map while retaining a view.
    addBox('본관 옥상 안전 유리',[x0-.035,y0-.035,z,x1+.035,y1+.035,z+2.4],[.66,.78,.79],'wall',5);
    addBox('본관 옥상 난간 상부',[x0-.05,y0-.05,z+2.38,x1+.05,y1+.05,z+2.44],[.42,.48,.48],'wall',5);
  };
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
    const x0=xs[i],x1=xs[i+1],y0=ys[j],y1=ys[j+1],x=(x0+x1)/2,y=(y0+y1)/2;
    if(!inside(x,y))continue;
    if(!inside(x0-.001,y))rail(x0,y0,x0,y1);
    if(!inside(x1+.001,y))rail(x1,y0,x1,y1);
    if(!inside(x,y0-.001))rail(x0,y0,x1,y0);
    if(!inside(x,y1+.001))rail(x0,y1,x1,y1);
  }
}

export function openStairRearExit(boxes,colliders,surfaces,addBox){
  const {left,right,y,bottom,top}=STAIR_REAR_EXIT;
  const cut=[left,y-.2,bottom-.05,right,y+.3,top];
  // Remove only the central stair's rear wall and exterior backing below its
  // half-landing. The landing and every upper flight remain structurally intact.
  for(const list of [boxes,colliders]){
    const next=list.flatMap(b=>b.kind==='wall'?subtractBox(b,cut):[b]);
    list.splice(0,list.length,...next);
  }
  const height=(x,y)=>bottom*Math.max(0,Math.min(1,(y-4.2)/2.2));
  surfaces.push({name:'행정실 맞은편 계단 아래 주차장 통로',bounds:[52.65,4.2,bottom,54.9,10.4,0],height});
  for(let i=0;i<22;i++){
    const start=4.2+i*.1,end=start+.1,z=height(53.75,start);
    addBox('중앙계단 뒤 출입 경사면 '+i,[52.65,start,z-.14,54.9,end,z],[.65,.68,.65],'step',1);
  }
  addBox('중앙계단 아래 통로 바닥',[52.65,6.4,bottom-.12,54.9,10.4,bottom],[.65,.68,.65],'slab',1);
  addBox('중앙계단 아래 통로 옆벽',[52.6,4.2,bottom-.12,52.67,10,.85],[.76,.79,.8],'wall',1);
  // First-floor return flight is overhead on this route. Give its existing
  // treads underside collision as well, without impeding normal stair ascent.
  for(const step of boxes.filter(b=>b.name.startsWith('MAIN_STAIR_B 디딤판 0 1 ')))
    colliders.push({...step,name:step.name+' 하부 충돌',stepSurface:true});
  for(const x of [left-.10,right])
    addBox('중앙계단 뒤 출입구 문틀',[x,y-.13,bottom,x+.10,y+.17,top+.09],[.62,.66,.65],'wall',1);
  addBox('중앙계단 뒤 출입구 상부',[left-.10,y-.13,top,right+.10,y+.17,top+.09],[.62,.66,.65],'wall',1);
  addBox('중앙계단 주차장 통로 조명',[53.3,9.1,1.48,54.2,9.5,1.52],[1,.98,.88],'finish',1).material='lamp';
}
