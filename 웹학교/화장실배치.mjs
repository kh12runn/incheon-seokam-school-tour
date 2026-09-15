// Provisional restrooms: left/right are measured while facing in from the corridor.
// This web-only adapter leaves the exported Blender baseline and adjacent rooms intact.
export const RESTROOM_EXTENSION=1.2;
export function toiletFrame(room){
  const [x0,x1,y0,y1]=room.bounds;
  return room.building==='ANNEX'
    ? {origin:[x1,y0],right:[0,1],inward:[-1,0],width:room.usableWidth??y1-y0,depth:x1-x0}
    : {origin:[x0,y0],right:[1,0],inward:[0,1],width:x1-x0,depth:y1-y0};
}
export function toiletPoint(frame,u,v,z=0){return {x:frame.origin[0]+frame.right[0]*u+frame.inward[0]*v,y:frame.origin[1]+frame.right[1]*u+frame.inward[1]*v,z};}
function boundsAt(frame,u0,v0,z0,u1,v1,z1){
  const a=toiletPoint(frame,u0,v0),b=toiletPoint(frame,u1,v1);
  return [Math.min(a.x,b.x),Math.min(a.y,b.y),z0,Math.max(a.x,b.x),Math.max(a.y,b.y),z1];
}
export function applyRestroomPlan(source){
  if(source.restroomPlanVersion===1)return source;
  const originals=source.rooms.filter(r=>r.type==='toilet'),ids=new Set(originals.map(r=>r.id));
  const rooms=source.rooms.filter(r=>!ids.has(r.id));
  const boxes=source.boxes.filter(b=>!ids.has(b.spaceId)&&!originals.some(r=>b.name==='Roof_'+r.id));
  const labels=source.labels.filter(l=>!ids.has(l.spaceId));
  for(const original of originals){
    const expanded=[...original.bounds];
    if(original.building==='ANNEX')expanded[0]-=RESTROOM_EXTENSION;else expanded[3]+=RESTROOM_EXTENSION;
    const full={...original,bounds:expanded},frame=toiletFrame(full),half=frame.width/2;
    for(const [index,sex,title,accent] of [[0,'female','여자화장실',[.66,.40,.44]],[1,'male','남자화장실',[.31,.49,.65]]]){
      const f={...frame,origin:Object.values(toiletPoint(frame,index*half,0)).slice(0,2),width:half};
      // A service lining masks the adjacent classroom's projecting window frames.
      const W=half-(original.building==='ANNEX'&&sex==='male'?.4:0),D=frame.depth,z=original.bounds[4],floor=parseInt(original.floor),id=original.id+'_'+sex;
      const b=boundsAt(f,0,0,z,half,D,z+3.15),door=W/2,aisle=(W+1.5)/2;
      const room={...original,id,name:original.name.replace(/화장실(?: A| B)?$/,title),bounds:[b[0],b[3],b[1],b[4],b[2],b[5]],sex,parentToiletId:original.id,usableWidth:W,provisional:true};
      room.entry=toiletPoint(f,door,-.7,z);
      room.interiorRoute=[toiletPoint(f,door,1,z),toiletPoint(f,door,3.6,z),toiletPoint(f,aisle,3.6,z),toiletPoint(f,aisle,D-.5,z)];
      room.stallTargets=[3.9,5.25,6.6].map(v=>toiletPoint(f,1.17,v+.75,z));
      rooms.push(room);
      const box=(name,u0,v0,h0,u1,v1,h1,color=[.88,.89,.85],kind='wall',material='paint',shape)=>{
        const item={name:name+'_'+id,spaceId:id,floor,kind,bounds:boundsAt(f,u0,v0,z+h0,u1,v1,z+h1),color,material,collision:kind==='wall',...(shape?{shape}:{})};boxes.push(item);return item;
      };
      const front=(u0,u1,lo,hi)=>box('Wall_front',u0,-.09,lo,u1,.09,hi);
      box('Floor',0,0,-.2,half,D,0,[.68,.71,.69],'floor','restroom_floor');
      front(0,door-.55,0,3.15);front(door+.55,half,0,3.15);
      box('Lintel',door-.55,-.09,2.35,door+.55,.09,3.15);
      box('Wall_left',-.09,0,0,.09,D,3.15);
      box('Wall_right',W-.09,0,0,half+.09,D,3.15);
      box('Wall_back',0,D-.09,0,W,D+.09,3.15);
      // Inner tile skins, a full-height gender divider and two permanently open entries.
      for(const [u0,u1] of [[.092,.105],[W-.105,W-.092]]){
        box('화장실 벽 타일',u0,.1,.12,u1,D-.1,2.18,[.85,.89,.86],'finish','restroom_wall');
        box('화장실 색 띠',u0-.002,.1,1.18,u1+.002,D-.1,1.28,accent,'finish');
      }
      box('화장실 뒤 타일',.1,D-.107,.12,W-.1,D-.093,2.18,[.85,.89,.86],'finish','restroom_wall');
      for(const u of [door-.58,door+.53])box('화장실 출입문틀',u,-.18,0,u+.05,.18,2.36,accent);
      box('화장실 표지판',door-.66,-.19,2.46,door+.66,-.14,2.94,[.96,.95,.89],'finish');
      labels.push({name:'Sign_'+id,spaceId:id,floor,text:title,position:Object.values(toiletPoint(f,door,-.195,z+2.7)),quaternion:original.building==='ANNEX'?[.5,.5,.5,.5]:[Math.SQRT1_2,0,0,Math.SQRT1_2],width:1.22,height:.26});
      labels.push({name:'Label_'+id,spaceId:id,floor,text:title,position:Object.values(toiletPoint(f,W/2,3.2,z+.025)),quaternion:[0,0,0,1],width:W-.3,height:.45});
      for(const v of [2,5.9]){
        box('화장실 조명틀',.6,v-.4,3.04,W-.6,v+.4,3.12,[.76,.78,.75],'finish');
        box('화장실 천장등',.65,v-.34,3.025,W-.65,v+.34,3.04,[1,.98,.9],'finish','lamp');
      }
      // Both genders: washbasins on the viewer's left when facing into the room.
      box('세면대 하부장',.12,1.35,.1,.62,2.85,.69,[.72,.76,.72]);
      box('세면대 상판',.1,1.3,.69,.68,2.9,.77,[.89,.90,.86],'wall','ceramic');
      box('세면대 거울틀',.105,1.28,1.05,.15,2.92,2.03,[.46,.51,.51],'finish','metal');
      box('세면대 거울',.15,1.34,1.1,.16,2.86,1.98,[.70,.83,.85],'finish','metal');
      for(const v of [1.7,2.5]){
        box('세면대 도기',.16,v-.28,.72,.67,v+.28,.87,[.97,.96,.92],'wall','ceramic','sphere');
        box('세면대 안쪽',.25,v-.21,.851,.6,v+.21,.866,[.58,.72,.73],'finish','ceramic','sphere');
        box('세면대 수도꼭지',.26,v-.025,.86,.3,v+.025,1.05,[.7,.74,.73],'wall','metal');
        box('세면대 수도관',.26,v-.025,1.01,.42,v+.025,1.06,[.7,.74,.73],'wall','metal');
      }
      box('손세정제',.13,3.02,1.1,.34,3.2,1.35,[.90,.92,.85],'wall');
      // Three stalls: doors are folded open against partitions, never across the aisle.
      for(const [i,v] of [3.9,5.25,6.6].entries()){
        const c=v+.75;
        box('화장실 칸막이 '+i,.1,v,.12,1.5,v+.065,2.12,accent);
        box('화장실 칸막이 문옆 '+i,1.45,v,.12,1.5,v+.30,2.12,accent);
        box('화장실 칸막이 문옆뒤 '+i,1.45,v+1.20,.12,1.5,v+1.35,2.12,accent);
        box('화장실 열린 칸문 '+i,.56,v+.08,.18,1.45,v+.12,2.02,[.72,.79,.76]);
        box('화장실 칸문 손잡이 '+i,.60,v+.12,1,.69,v+.16,1.06,[.7,.73,.72],'wall','metal');
        box('변기 받침 '+i,.29,c-.18,.04,.70,c+.18,.4,[.94,.94,.90],'wall','ceramic','sphere');
        box('변기 도기 '+i,.25,c-.255,.27,.84,c+.255,.47,[.97,.97,.93],'wall','ceramic','sphere');
        box('변기 좌석 '+i,.27,c-.23,.44,.85,c+.23,.49,[.99,.99,.96],'wall','ceramic','sphere');
        box('변기 안쪽 '+i,.37,c-.15,.482,.76,c+.15,.496,[.53,.67,.67],'finish','ceramic','sphere');
        box('변기 물탱크 '+i,.12,c-.24,.40,.30,c+.24,.92,[.95,.95,.91],'wall','ceramic');
        box('변기 버튼 '+i,.18,c-.05,.92,.25,c+.05,.935,[.66,.70,.69],'finish','metal');
        box('화장지 걸이 '+i,.97,v+.08,.65,1.17,v+.20,.87,[.94,.93,.87],'wall','ceramic');
      }
      box('화장실 마지막 칸막이',.1,7.95,.12,1.5,8.015,2.12,accent);
      // Four urinals on the right; the last screen ends before the stall approach.
      if(sex==='male')for(const v of [.85,1.55,2.25,2.95]){
        box('소변기 등판',W-.25,v-.23,.50,W-.11,v+.23,1.33,[.94,.95,.92],'wall','ceramic');
        box('소변기 도기',W-.53,v-.24,.34,W-.11,v+.24,.84,[.97,.97,.94],'wall','ceramic','sphere');
        box('소변기 안쪽',W-.47,v-.16,.79,W-.22,v+.16,.83,[.58,.7,.7],'finish','ceramic','sphere');
        box('소변기 가림판',W-.75,v+.29,.18,W-.11,v+.34,1.50,[.72,.79,.76]);
      }
      // Match the increased footprint through all four floors, including the roof.
      if(floor===4)box('Roof',0,0,3.29,half,D,3.51,[.44,.51,.54],'roof','paint');
    }
  }
  return {...source,restroomPlanVersion:1,rooms,boxes,labels};
}
