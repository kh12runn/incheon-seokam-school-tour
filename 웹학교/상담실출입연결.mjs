import {subtractBox} from './창문배치.mjs';
export const COUNSELING_ID='3F_COUNSELING';
// Owner: like the audiovisual room, enter directly through the corridor-end
// wall. The entrance bay is part of reception, not a passage through 5-7.
export const COUNSELING_ENTRY={bounds:[-3.35,0,6.8,.18,3.12,9.95],cut:[-.25,.74,6.8,.25,2.26,9.10]};
export function connectCounselingEntry(c,worldBoxes,worldColliders){
 const z=6.8,cut=COUNSELING_ENTRY.cut,join=[-3.25,-.24,z,-.16,.24,9.85];
 // Only this floor's end wall, the consultation-room wall and a protruding
 // roof edge. No neighbouring classroom, stair flight or 2F ceiling is removed.
 for(const list of [worldBoxes,worldColliders]){
  const next=list.flatMap(b=>{
   if(b.spaceId===COUNSELING_ID&&b.name.startsWith('Doorframe_'))return [];
   if(b.name.startsWith('Auditorium_roof'))return subtractBox(b,[-3.4,-.1,z,.18,3.12,z+.2]);
   if(b.spaceId===COUNSELING_ID&&b.kind==='wall')return subtractBox(b,join);
   if(b.name.startsWith('3층 외피 보강'))return subtractBox(b,cut).flatMap(p=>subtractBox(p,join));
   return [b];
  });list.splice(0,list.length,...next);
 }
 // Extend the existing reception to the corridor alignment, retaining its
 // photo-observed bench/noticeboard and all play/consultation-room furnishings.
 for(const list of [c.boxes,c.colliders]){
  const next=list.flatMap(b=>b.name==='상담실 민트 북측 벽'?subtractBox(b,join):[b]);list.splice(0,list.length,...next);
  for(const b of list)if(b.name.includes('주황 벤치')){b.bounds=[...b.bounds];b.bounds[1]+=3.08;b.bounds[4]+=3.08;}
 }
 for(const p of c.panels)if(p.name==='접수 회색 게시판')p.y+=3.08;
 for(const p of c.props)if(p.type==='flag')p.y+=3.08;
 const rgb=h=>h.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255);
 const add=(name,b,color,material='paint',solid=false,kind='detail')=>{
  const item={name:'상담실 출입 '+name,spaceId:COUNSELING_ID,interiorRoom:COUNSELING_ID,floor:3,kind,bounds:b,color:rgb(color),material,entryDetail:true};
  c.boxes.push(item);if(solid)c.colliders.push(item);return item;
 };
 const floor=add('접수부 바닥',[-3.35,-.10,z-.16,.18,3.12,z],'#cdb896','wood',true,'floor');floor.stepSurface=true;
 c.walkSurfaces=[{name:floor.name,spaceId:COUNSELING_ID,bounds:floor.bounds,height:()=>z}];
 add('접수부 천장',[-3.35,-.12,9.92,.18,3.12,9.95],'#dbddd0','paint',true,'ceiling');
 add('접수부 서벽',[-3.35,0,z,-3.25,3.12,9.95],'#bad0c4','paint',true,'wall');
 add('접수부 북벽',[-3.35,3.02,z,.02,3.12,9.95],'#bad0c4','paint',true,'wall');
 add('이전 막힌 문 정리',[-.125,-5.2,z,-.095,-3.9,9.07],'#e3e3da','paint',true,'wall');
 // A visibly open hinged leaf, as with the existing always-accessible school
 // doors. No second button/modal or automatic teleport is introduced.
 for(const y of [.68,2.26])add('세로 문틀 '+y,[-.20,y,z,.18,y+.06,9.15],'#c3ae8d','wood',true);
 add('윗 문틀',[-.20,.68,9.10,.18,2.32,9.16],'#c3ae8d','wood',true);
 add('열린 여닫이문',[-1.52,2.32,z+.04,-.18,2.38,9.08],'#d1bf9f','wood',true);
 add('문 유리창',[-1.35,2.307,z+1.24,-.35,2.32,z+1.96],'#8eaaa7','glass');
 add('문 손잡이',[-1.37,2.25,z+.99,-1.19,2.32,z+1.04],'#a3aca6','metal');
 for(const h of [.28,1.03,1.88])add('문 경첩 '+h,[-.25,2.30,z+h,-.18,2.4,z+h+.10],'#a3aca6','metal');
 add('접수 천장등',[-2.5,.75,9.89,-.7,1.35,9.92],'#f2efde','lamp');
 c.panels.push({name:'상담실 입구 안내',x:.19,y:1.5,z:9.42,width:1.30,height:.35,axis:'x',style:'room-sign',text:'상담실',color:'#608e78'});
 c.room={...c.room,bounds:[-10,0,-7,3.12,z,9.95]};
 c.entryBounds=[...COUNSELING_ENTRY.bounds];
 c.entry={x:.65,y:1.5,z};c.spawn={x:-.85,y:1.5,z};c.entryYaw=Math.PI/2;
 delete c.entryNeedsConfirmation;
 c.entryConfirmedByOwner=true;
}
