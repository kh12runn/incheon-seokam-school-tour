import {subtractBox} from './창문배치.mjs';
export const BASEMENT_STAIR='MAIN_STAIR_A';
export const BASEMENT_FOOTPRINT=[-17,-7,5,11.2]; // x0, y0, x1, y1; not the whole L-shaped school.
export const HALL_MIRROR={x:-11,y:9.80,width:11.6,bottom:.12,height:2.84};
export const HALL_EXIT={left:-12.2,right:-9.8,doorY:-7};
export const isBasementPosition=p=>p.z<-.85&&p.x>=-17.3&&p.x<=5.3&&p.y>=-7.1&&p.y<=11.5;
export function applyBasementPlan(source){
  if(source.basementPlanVersion===1)return source;
  const z=-source.floorHeight,rooms=[...source.rooms],boxes=[...source.boxes],labels=[...source.labels];
  const room=(id,name,bounds,type='special_room')=>rooms.push({id,name,building:'MAIN',floor:'0F',type,bounds:[...bounds,z,z+3.15],provisional:true,basement:true});
  room('B1_MAIN_HALL','지하 실내 강당',[-17,-5,-7,10]);
  room('B1_MAIN_FOYER','지하 강당 앞 복도',[-5,5,0,3],'corridor');
  room('B1_MAIN_STAIR_A','3-4 교실 옆 지하 연결 계단',[0,5,3,10],'stair');
  const box=(id,name,b,color=[.82,.84,.80],kind='wall',material='paint')=>{
    const item={name:'지하 '+name,spaceId:id,floor:0,basement:true,kind,material,color,bounds:[b[0],b[1],z+b[2],b[3],b[4],z+b[5]],collision:kind==='wall'};boxes.push(item);return item;
  };
  const hall='B1_MAIN_HALL',foyer='B1_MAIN_FOYER';
  box(hall,'강당 목재 바닥',[-17,-7,-.20,-5,10,0],[.68,.52,.34],'floor','room_floor');
  box(foyer,'복도 바닥',[-5,0,-.20,5,3,0],[.69,.73,.70],'floor','terrazzo');
  box(hall,'강당 천장',[-17,-7,3.13,-5,10,3.20],[.90,.91,.87],'ceiling');
  box(foyer,'복도 천장',[-5,0,3.13,5,3,3.20],[.90,.91,.87],'ceiling');
  for(const b of [[-17.08,-7,0,-16.92,10,3.15],[-17,-7.08,0,HALL_EXIT.left,-6.92,3.15],[HALL_EXIT.right,-7.08,0,-5,-6.92,3.15],[HALL_EXIT.left,-7.08,2.6,HALL_EXIT.right,-6.92,3.15],[-17,9.92,0,-5,10.08,3.15]])box(hall,'강당 외벽',b);
  // Wide opening from the basement foyer into the hall; no room-door blocker.
  for(const b of [[-5.08,-7,0,-4.92,.35,3.15],[-5.08,2.65,0,-4.92,10,3.15],[-5.08,.35,2.65,-4.92,2.65,3.15]])box(hall,'강당 출입 벽',b);
  box(foyer,'복도 앞벽',[-5,-.08,0,5,.08,3.15]);box(foyer,'복도 동쪽 막음',[4.92,0,0,5.08,3,3.15]);
  // Entering westward: north/right is the mirror; south/left is the outdoor exit.
  // Leave the opposite west wall bare until actual interior photographs arrive.
  box(hall,'전면 거울 뒷판',[-16.82,9.81,.10,-5.18,9.91,2.98],[.71,.75,.75],'wall','metal');
  for(const h of [.08,2.97])box(hall,'거울 가로 프레임',[-16.87,9.75,h,-5.13,9.85,h+.04],[.58,.63,.64],'finish','metal');
  for(const x of [-16.87,-5.17])box(hall,'거울 세로 프레임',[x,9.75,.08,x+.04,9.85,3.01],[.58,.63,.64],'finish','metal');
  for(const x of [-14,-10.5,-7])for(const y of [-4,1.5,7]){
    box(hall,'강당 조명틀',[x-.60,y-.20,3.03,x+.60,y+.20,3.10],[.7,.74,.71],'finish');
    box(hall,'강당 천장등',[x-.55,y-.16,3.01,x+.55,y+.16,3.035],[1,.98,.88],'finish','lamp');
  }
  for(const x of [-2.5,2.5])box(foyer,'복도 천장등',[x-.5,1,3.01,x+.5,1.5,3.04],[1,.98,.9],'finish','lamp');
  // Facing south off the last flight, right is west: toilets first, then the hall.
  // Translate only the basement copy, preserving all aboveground restrooms.
  // Left=female, right=male when looking north into the toilets from the foyer.
  const toilets=source.rooms.filter(r=>r.parentToiletId==='1F_MAIN_TOILET_A'),ids=new Set(toilets.map(r=>r.id));
  for(const r of toilets){
    const id=r.id.replace(/^1F_/,'B1_'),lower=p=>({...p,x:p.x-10,z:p.z+z});
    rooms.push({...r,id,name:'지하 '+(r.sex==='female'?'여자화장실':'남자화장실'),floor:'0F',basement:true,parentToiletId:'B1_MAIN_TOILET_A',bounds:r.bounds.map((v,i)=>i>=4?v+z:i<2?v-10:v),entry:lower(r.entry),interiorRoute:r.interiorRoute.map(lower),stallTargets:r.stallTargets.map(lower)});
    for(const original of source.boxes.filter(b=>b.spaceId===r.id))boxes.push({...original,name:'지하 '+original.name,spaceId:id,floor:0,basement:true,bounds:original.bounds.map((v,i)=>i===2||i===5?v+z:i===0||i===3?v-10:v)});
    box(id,'화장실 천장',[r.bounds[0]-10,r.bounds[2],3.13,r.bounds[1]-10,r.bounds[3],3.20],[.9,.91,.88],'ceiling');
  }
  for(const original of source.labels.filter(l=>ids.has(l.spaceId)))labels.push({...original,name:'지하 '+original.name,spaceId:original.spaceId.replace(/^1F_/,'B1_'),floor:0,basement:true,position:original.position.map((v,i)=>i===2?v+z:i===0?v-10:v)});
  labels.push({name:'Sign_B1_HALL',spaceId:hall,text:'다목적실 · 실내 강당',floor:0,basement:true,position:[-4.895,1.5,z+2.87],quaternion:[.5,.5,.5,.5],width:1.8,height:.26});
  labels.push({name:'Sign_B1_EXIT',spaceId:hall,text:'외부 출구 · 정문 방향 ↑',floor:0,basement:true,position:[-11,-6.89,z+2.86],quaternion:[Math.SQRT1_2,0,0,Math.SQRT1_2],width:2.25,height:.28});
  return {...source,rooms,boxes,labels,basementPlanVersion:1};
}

export function openBasementGround(boxes,colliders,surfaces){
  const [x0,y0,x1,y1]=BASEMENT_FOOTPRINT,cut=[x0-.16,y0-.16,-10,x1+.16,y1+.16,.05];
  // SiteGround used to fill the stairwell at z=-0.6. Cut its visual AND footing,
  // but never cut the first-floor slabs or the outdoor playground surface.
  for(const list of [boxes,colliders,surfaces]){
    const next=list.flatMap(b=>b.name==='SiteGround'?subtractBox(b,cut):[b]);list.splice(0,list.length,...next);
  }
}
