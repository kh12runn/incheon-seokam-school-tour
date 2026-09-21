// Clear Pano zeqFg5bi, reviewed 2026-09-16. Local u = east, v = away from corridor.
// Dimensions are adapted to the existing 7 x 7 m room, not measured from one panorama.
import {openClassroomWindows} from './창문배치.mjs';
export const PRINCIPAL_ID='2F_PRINCIPAL';
export const OFFICE_ORIGIN={x:30,y:0,z:3.4};
export const officePoint=(u,v,h=0)=>({x:30+u,y:-v,z:3.4+h});
export const OFFICE_FURNITURE=[
  {id:'회의테이블',type:'table',u:4.48,v:3.03,w:1.45,d:2.95,h:.76},
  ...[1.96,3.03,4.10].flatMap((v,i)=>[
    {id:`회의의자 왼쪽 ${i+1}`,type:'chair',u:3.28,v,w:.51,d:.56,h:.91,angle:Math.PI/2},
    {id:`회의의자 오른쪽 ${i+1}`,type:'chair',u:5.68,v,w:.51,d:.56,h:.91,angle:-Math.PI/2}]),
  {id:'회의의자 입구',type:'chair',u:4.48,v:1.13,w:.52,d:.56,h:.91,angle:0},
  {id:'회의의자 창가',type:'chair',u:4.48,v:4.95,w:.52,d:.56,h:.91,angle:Math.PI},
  {id:'흰색 트로피 진열장',type:'display',u:6.59,v:1.83,w:.60,d:2.80,h:2.30},
  {id:'낮은 흰색 수납장',type:'cabinet',u:6.59,v:4.02,w:.60,d:1.55,h:.91},
  {id:'집무책상',type:'desk',u:.94,v:5.78,w:1.10,d:1.94,h:.76},
  {id:'교장 의자',type:'executive',u:2.18,v:5.85,w:.68,d:.73,h:1.23,angle:-Math.PI/2},
  {id:'공기청정기',type:'purifier',u:5.58,v:6.51,w:.65,d:.40,h:.79},
  {id:'창가 큰 화분',type:'plant',u:6.38,v:6.39,w:.46,d:.46,h:.45},
  {id:'책상 아래 서랍장',type:'drawer',u:.89,v:4.47,w:1.02,d:.48,h:.69},
];
export const OFFICE_ROUTE=[[2.45,1.00],[2.18,2.85],[2.26,4.35],[3.23,5.65],[4.35,5.87],[5.42,5.59],[5.92,5.05],[5.42,5.59],[4.35,5.87],[3.23,5.65],[2.26,4.35],[2.18,2.85]];
export function openPrincipalWindows(data,boxes,colliders,addBox){
  const room=data.rooms.find(r=>r.id===PRINCIPAL_ID);if(!room)return;
  return openClassroomWindows({...data,rooms:[{...room,type:'classroom'}],boxes:data.boxes.filter(b=>b.spaceId===PRINCIPAL_ID)},boxes,colliders,addBox);
}
export function principalOfficeLayout(data){
  const room=data.rooms.find(r=>r.id===PRINCIPAL_ID);if(!room)return null;
  const colliders=OFFICE_FURNITURE.map(f=>{
    const p=officePoint(f.u,f.v),w=f.type==='chair'?.56:f.w,d=f.type==='chair'?.56:f.d;
    return {name:'교장실 '+f.id,spaceId:PRINCIPAL_ID,officeRoom:PRINCIPAL_ID,floor:2,kind:'furniture',collision:true,
      bounds:[p.x-w/2,p.y-d/2,p.z,p.x+w/2,p.y+d/2,p.z+(f.type==='plant'?1.45:f.h)]};
  });
  colliders.push({name:'교장실 열린 문짝',spaceId:PRINCIPAL_ID,officeRoom:PRINCIPAL_ID,floor:2,kind:'furniture',collision:true,bounds:[31.82,-1.28,3.4,32.10,-.14,5.50]});
  return {room,colliders,spawn:officePoint(2.45,2.6),route:OFFICE_ROUTE.map(([u,v])=>officePoint(u,v))};
}

// Deterministic room-bound controller shared by browser and Node regression tests.
export function createPrincipalPatrol(world){
  const layout=world.principalOffice;let position={...layout.route[3]},index=4,wait=.8,phase=0,heading=0,moving=false;
  let pauses=0,yielding=false,distance=0;
  function update(dt,player=null,paused=false){
    if(paused||!Number.isFinite(dt)||dt<=0){moving=false;return state();}
    dt=Math.min(dt,.05);yielding=!!player&&Math.abs(player.z-position.z)<1.8&&Math.hypot(player.x-position.x,player.y-position.y)<1.05;
    if(yielding){moving=false;return state();}
    if(wait>0){wait-=dt;moving=false;return state();}
    const target=layout.route[index],dx=target.x-position.x,dy=target.y-position.y,len=Math.hypot(dx,dy);
    if(len<.055){index=(index+1)%layout.route.length;wait=[1.4,2.5,1.1,2.0][pauses++%4];moving=false;return state();}
    const step=Math.min(.68*dt,len),next=world.move(position,dx/len*step,dy/len*step);
    // Never leave the office even if the public corridor doorway is open.
    if(next.x<30.5||next.x>36.5||next.y>-.55||next.y< -6.45){wait=.5;moving=false;return state();}
    const traveled=Math.hypot(next.x-position.x,next.y-position.y);
    if(traveled<step*.25){index=(index+1)%layout.route.length;wait=.6;moving=false;return state();}
    const desired=Math.atan2(dx,-dy),delta=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading));
    heading+=delta*(1-Math.exp(-dt*5));position=next;distance+=traveled;phase+=traveled*Math.PI*2/1.12;moving=true;
    return state();
  }
  function state(){return {position:{...position},heading,phase,moving,waiting:wait>0,yielding,distance,waypoint:index,pauses};}
  return {update,getState:state};
}
