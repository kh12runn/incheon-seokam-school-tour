import {photoRoom} from './사진실내도구.mjs';
import {PHOTO_REFERENCES} from './추가사진근거.mjs';
export const MAGPIE_ID='4F_KINDERGARTEN';
// Photo-guided approximate layout in metres, not the generic 10x7 room scaled
// down. Unseen chair undersides and desktop supports use ordinary furniture.
export function magpieRoomInterior(room,worldBoxes){
 const p=photoRoom(room,worldBoxes,{...PHOTO_REFERENCES[MAGPIE_ID],kind:'kindergarten',reviewedAt:'2026-10-06',peopleExcluded:true,approximateDimensions:true,
  features:['연두색 반원 끝 조합탁자','금속 다리 연두 의자','흰 상하 교구장·중앙 유리문','창가 연두 업무 파티션','검정 벽걸이 TV와 분리된 게시판','싱크대·다트판·시계·수조'],
  inferred:['가려진 탁자 다리와 의자 하부 구조','가려진 업무 책상 위 소품'],layoutVersion:2});
 const {config:c,add,table,monitor,chair}=p,[x,X,y,Y,z]=room.bounds;
 c.additionalRoom=true;c.magpieRoom=true;c.panels=[];c.props=[];
 c.point=(a,b,h=0)=>({x:x+a,y:y+b,z:z+h});
 c.entry={x:X+.7,y:y+(Y-y)*.35,z};c.spawn={...c.entry,x:X-.75};c.entryYaw=-Math.PI/2;
 p.finish('staff_floor','#bdbba9');
 for(const item of worldBoxes)if(item.spaceId===room.id&&/^(Wall_|Lintel_)/.test(item.name)){item.color=[.86,.79,.76];item.material='staff_wall';}
 const panel=(name,a,b,h,w,height,axis,style,color)=>c.panels.push({name,...c.point(a,b,h),width:w,height,axis,style,color});
 // Storage faces into the room (+Y). Doors do not obstruct the east entry.
 for(let n=0;n<5;n++){
  const a=1.70+n*.91,glass=n===2||n===3;
  add('흰 교구장 본체 '+n,[a,.16,.03,a+.88,.72,2.78],'#e6e9e4','paint',true);
  for(let door=0;door<2;door++){
   const xx=a+.035+door*.425;
   add('교구장 하부 문',[xx,.73,.10,xx+.40,.75,1.15],'#e5e8e3');
   add('교구장 상부 문틀',[xx,.729,1.20,xx+.40,.755,2.71],'#d7dfd9');
   if(glass){
    add('교구장 유리 뒤 선반',[xx+.03,.757,1.29,xx+.37,.770,2.63],'#6b7976');
    for(let level=0;level<3;level++){
     add('유리장 선반선',[xx+.035,.777,1.35+level*.41,xx+.365,.79,1.375+level*.41],'#c3d0c8','metal');
     for(let k=0;k<3;k++)add('유리장 자료 정리함',[xx+.06+k*.09,.791,1.39+level*.41,xx+.12+k*.09,.801,1.63+level*.41],['#b4a589','#9caaa6','#b7b29d'][k]);
    }
    add('상부 유리문',[xx+.025,.803,1.26,xx+.375,.815,2.65],'#d2e0dc','clear_glass');
   }else add('교구장 상부 문',[xx+.025,.756,1.24,xx+.375,.778,2.67],'#e6e9e5');
   for(const h of [.63,1.85])add('교구장 은색 손잡이',[xx+(door?.035:.345),.82,h,xx+(door?.052:.362),.86,h+.17],'#919d98','metal');
   add('교구장 무명 라벨',[xx+.09,.823,1.00,xx+.31,.827,1.08],'#c1d1d3');
  }
 }
 // Six joined leaves: four rectangular centre desks and two semicircle ends.
 c.table={...c.point(4.2,3.8,.74),radius:.80,halfBody:.60,height:.74,color:'#a4c94e'};
 const t=c.table,bounds=[t.x-t.radius,t.y-t.radius-t.halfBody,z+.03,t.x+t.radius,t.y+t.radius+t.halfBody,z+.79];
 c.colliders.push({name:'까치방 조합탁자 충돌',kind:'furniture',bounds,containsXY:(u,v,r)=>Math.hypot(u-t.x,Math.max(0,Math.abs(v-t.y)-t.halfBody))<t.radius+r});
 function greenChair(a,b){
  const angle=Math.atan2(a-4.2,-(b-3.8));chair('연두 금속 다리 의자',a,b,angle,'#83ad38',false);c.chairs.at(-1).magpieStudent=true;
 }
 for(const b of [2.65,3.8,4.95]){greenChair(2.90,b);greenChair(5.5,b);}
 greenChair(4.2,2.0);greenChair(4.2,5.6);
 // Window-side workstations; gap at the south end connects both desk seats.
 for(const b of [3.55,5.15]){
  table('창가 업무 책상',.22,b,1.25,1.15,.73,'#deded6');
  chair('업무용 회전 의자',1.35,b+.56,Math.PI/2,'#354744',true);
  const first=c.boxes.length;monitor('창가 업무 모니터',.32,b+.60,.79);
  // Rotate monitor toward the seated colleague (+X), not sideways along the wall.
  for(const item of c.boxes.slice(first)){
   const a=item.bounds,oldX=x+.605,oldY=y+b+.625,newX=x+.73,newY=y+b+.60;
   item.bounds=[newX-(a[4]-oldY),newY+(a[0]-oldX),a[2],newX-(a[1]-oldY),newY+(a[3]-oldX),a[5]];
  }
  add('업무 키보드',[.89,b+.35,.79,1.28,b+.62,.82],'#3b4643');
 }
 add('연두 업무 파티션',[2.30,3.45,.05,2.37,6.45,1.17],'#93ab58','staff_fabric',true);
 for(const b of [3.48,4.9,6.40])add('파티션 금속 기둥',[2.27,b,.03,2.40,b+.035,1.23],'#a4afa8','metal');
 for(const b of [3.63,4.13,4.63,5.13,5.63])add('파티션 안내 종이',[2.375,b,.78,2.381,b+.34,1.08],'#e1e5d6');
 // Pale green roller blinds follow the real exterior window wall.
 for(const b of [.95,2.75,4.55]){
  add('연녹색 롤 블라인드',[.14,b,1.77,.17,b+1.60,2.83],'#b8caba','staff_fabric');
  add('블라인드 하단봉',[.16,b,1.75,.185,b+1.60,1.79],'#e0e3d9','metal');
 }
 // Opposite TV/noticeboard wall, with no overlapping screen or artwork.
 add('꺼진 벽걸이 TV',[4.72,6.57,1.54,5.82,6.65,2.19],'#242c2b','paint');
 add('TV 화면',[4.76,6.558,1.58,5.78,6.569,2.15],'#121b1e','glass');
 panel('작은 활동 게시판',3.33,6.55,1.82,1.35,.82,'y','papers','#c7d3ca');
 panel('큰 활동 게시판',6.85,6.55,1.82,1.50,.82,'y','flowers','#c6d49d');
 add('TV 배선',[5.21,6.555,.16,5.23,6.563,1.55],'#46504a');
 // Sink, wood accent, clock and dartboard on the far corner side wall.
 add('싱크 하부장',[7.17,5.04,.02,7.80,6.10,.83],'#e1e5de','paint',true);
 add('싱크 상판',[7.14,5.00,.83,7.84,6.14,.88],'#acb7b1','metal');
 add('싱크볼',[7.24,5.32,.881,7.66,5.90,.887],'#677f79','metal');
 add('수도꼭지',[7.71,5.58,.88,7.75,5.62,1.13],'#bdc9c0','metal');
 add('수도꼭지 목',[7.49,5.58,1.10,7.75,5.62,1.14],'#bdc9c0','metal');
 add('목재 포인트 벽',[7.82,4.15,.08,7.87,6.30,2.93],'#c4a076','wood');
 c.props.push({type:'magpieClock',...c.point(7.79,4.55,2.65)},{type:'magpieDart',...c.point(7.79,5.54,1.92)});
 table('낮은 수조 받침',.30,1.65,1.05,.66,.43,'#bfb9a6');
 add('작은 수조 유리',[.37,1.73,.48,1.27,2.25,.93],'#afc9c0','clear_glass');
 add('수조 바닥',[.38,1.74,.47,1.26,2.24,.51],'#778d81');
 add('공기청정기',[2.3,5.94,.03,2.71,6.37,.77],'#e5e7df','paint',true);
 for(let i=0;i<7;i++)add('공기청정기 흡입구',[2.31,5.93,.14+i*.065,2.70,5.939,.157+i*.065],'#abb8ad');
 for(const a of [2.2,5.7]){add('천장 냉난방기',[a,2.0,2.97,a+.57,2.57,3.035],'#cdd1c8');add('냉난방기 그릴',[a+.09,2.09,2.963,a+.48,2.48,2.975],'#a7b2aa');}
 return c;
}
