import {photoRoom} from './사진실내도구.mjs';
import {OCT6_REFERENCES} from './현관상담사진근거.mjs';
import {subtractBox} from './창문배치.mjs';
import {connectCounselingEntry} from './상담실출입연결.mjs';
// Measurements are approximate. Keep original outer walls, doorways and floors.
export function octoberRoomInterior(room,worldBoxes,worldColliders=[]){
 const p=photoRoom(room,worldBoxes,OCT6_REFERENCES[room.id]),{config:c,add,table,chair,monitor}=p;
 const [x,X,y,Y,z]=room.bounds;c.additionalRoom=true;c.props=[];c.panels=[];
 const panel=(name,a,b,h,w,height,axis='y',style='papers',color='#dce4dc')=>c.panels.push({name,x:x+a,y:y+b,z:z+h,width:w,height,axis,style,color});
 function cabinet(name,a,b,w,d,h,color='#cbb383',open=false,face='south'){
  const i=c.boxes.length,j=c.colliders.length,side=face==='east'||face==='west';p.cabinet(name,a,b,side?d:w,side?w:d,h,color,open,side?'west':'south');
  if(face==='north'||face==='east'){
   const axis=face==='east'?0:1,centre=(axis===0?x+a+d/2:y+b+d/2);
   for(const item of [...c.boxes.slice(i),...c.colliders.slice(j)]){const q=[...item.bounds];[q[axis],q[axis+3]]=[2*centre-q[axis+3],2*centre-q[axis]];item.bounds=q;}
  }
 }
 const rounded=(name,a,b,w,d,h,color)=>{
  c.props.push({type:'roundedTable',x:x+a,y:y+b,z:z+h,w,d,sx:1,sy:1,color});
  const item=add(name+' 충돌',[a-w/2,b-d/2,0,a+w/2,b+d/2,h+.035],color,'wood',true);item.renderInDetails=true;
  c.colliders.at(-1).containsXY=(u,v,r)=>((u-x-a)/(w/2+r))**2+((v-y-b)/(d/2+r))**2<1;
 };
 const purifier=(a,b)=>{add('공기청정기',[a,b,.02,a+.43,b+.38,.9],'#e6e8e0','paint',true);add('공기청정기 윗면',[a+.02,b+.02,.9,a+.41,b+.36,.94],'#30403c');};
 const books=(a,b,h,count=10)=>{for(let n=0;n<count;n++)add('자료 책 '+n,[a+n*.065,b,h,a+n*.065+.043,b+.23,h+.22+(n%3)*.025],['#79a497','#d5b870','#af8c89'][n%3],'paint');};
 const facing=(a,b,tx,ty)=>Math.atan2(a-tx,ty-b);
 function research(){
  p.finish('staff_floor','#a9b0b5');
  // Photo: long honey-coloured glass cupboard wall; mixed storage opposite.
  for(let i=0;i<5;i++){
   const b=.35+i*1.23;cabinet('유리 자료장 '+i,5.24,b,1.18,.53,2.82,'#c5aa74',false,'west');
   for(const item of c.boxes.filter(q=>q.name===room.name+' 유리 자료장 '+i+' 문'))item.bounds[5]=z+.93;
   add('자료장 상부 목재문 '+i,[5.215,b+.035,2.39,5.255,b+1.145,2.76],'#c5aa74','wood');
   add('유리장 진열 배경 '+i,[5.225,b+.07,1.0,5.24,b+1.11,2.31],'#4c574e');
   for(const h of [1.04,1.49,1.94])for(let n=0;n<5;n++)add('진열 교구 '+i+h+n,[5.19,b+.13+n*.18,h,5.222,b+.25+n*.18,h+.28],['#cfb451','#7eaa95','#d6c0b6'][n%3]);
   add('유리장 유리 '+i,[5.18,b+.06,1.01,5.187,b+1.12,2.34],'#bac9c5','clear_glass');
   for(const u of [b+.035,b+.58,b+1.125])add('유리장 샷시',[5.16,u,.96,5.205,u+.035,2.39],'#d9dcd4','metal');
  }
  cabinet('서쪽 높은 자료장',.18,.35,1.25,.60,2.8,'#c8b184',false,'east');
  cabinet('서쪽 서류 분류장',.18,1.72,1.70,.57,1.98,'#c8b184',true,'east');
  for(let i=0;i<7;i++)add('서류철 묶음 '+i,[.77,1.83,.19+i*.23,.94,3.20,.30+i*.23],i%2?'#b5c8a5':'#ddd2b4');
  for(let i=0;i<3;i++)add('복사용지 상자 '+i,[.98,.5,.02+i*.33,1.55,1.06,.34+i*.33],'#b5a788','paper',true);
  add('접힌 비품',[.25,1.76,2.0,.77,3.3,2.23],'#293d40');
  rounded('긴 목재 회의탁자',3.16,3.30,1.62,3.28,.76,'#d2b57e');
  for(const a of [2.01,4.31])for(const b of [2.23,3.30,4.37])chair('검정 회의 의자',a,b,facing(a,b,3.16,3.3),'#303934',true);
  chair('회의 끝 의자',3.16,5.40,Math.PI,'#303934',true);
  add('노란 문구 바구니',[2.96,3.0,.8,3.36,3.56,.93],'#e0c13f');
  table('창가 업무 책상',.45,5.93,2.15,.7,.74,'#c6b083');monitor('업무 화면',.60,6.29,.80);chair('연두색 업무 의자',1.4,5.34,0,'#a2be49',true);
  cabinet('창가 업무 서랍',.25,5.82,.5,.61,.69,'#bfc0af');
  add('복합기',[.27,3.68,.02,1.0,4.4,1.05],'#dcdfd9','paint',true);add('복합기 검정 급지대',[.30,3.71,1.05,.96,4.36,1.19],'#263732');
  purifier(4.85,.42);panel('창가 민트 블라인드',2.9,6.83,2.56,5.25,.6,'y','plain','#b5d6c7');
  c.entry={x:46.1,y:2.55,z};c.spawn={x:46.1,y:4.25,z};c.entryYaw=0;
 }
 function counseling(){
  // The old auditorium roof protruded 11 cm above this room's floor and
  // blocked most of its interior. Trim only that overlapping top lip.
  for(const list of [worldBoxes,worldColliders]){const next=list.flatMap(b=>b.name==='Auditorium_roof'?subtractBox(b,[x,y,z,X,Y,z+.2]):[b]);list.splice(0,list.length,...next);}
  p.finish('wood','#ceb997');c.photoWindowAxis=0;
  // Three connected zones: reception, sand-play room and small consultation.
  for(const b of c.boxes.filter(b=>b.name.endsWith('사진 천장')))b.color=[.86,.87,.82];
  add('민트 남측 벽',[.12,.11,.02,9.88,.15,3.02],'#b9d0c3');
  add('민트 북측 벽',[.12,6.84,.02,9.88,6.88,3.02],'#b9d0c3');
  // Partition separates reception at the east; broad open sliding doorways.
  for(const [a,b] of [[.12,1.4],[2.8,4.75],[6.1,6.87]])add('살구색 접수실 칸막이',[6.48,a,0,6.62,b,3.05],'#d69987','paint',true);
  for(const [a,b] of [[1.4,2.8],[4.75,6.1]]){
   add('내부문 인방',[6.48,a,2.3,6.62,b,3.05],'#d69987','paint',true);
   for(const v of [a-.055,b])add('내부문 목재 틀',[6.44,v,0,6.68,v+.055,2.31],'#c8bea6');
  }
  add('상담 구역 경계',[.12,3.84,0,6.48,3.97,3.05],'#b5cabb','paint',true);
  // Reception orange built-in bench and white rounded table.
  add('주황 벤치 받침',[6.93,6.13,.05,9.65,6.7,.42],'#c1a786','wood',true);
  add('주황 벤치 방석',[6.93,6.12,.42,9.65,6.72,.54],'#d48739','fabric',true);
  add('주황 벤치 등',[6.93,6.66,.53,9.65,6.83,1.20],'#dd8735','fabric',true);
  table('하얀 상담탁자',7.35,4.88,1.8,.83,.72,'#e4e6df');
  for(const a of [7.65,8.8])chair('접수 상담 의자',a,4.35,0,'#404c49',false);
  panel('접수 회색 게시판',8.25,6.825,1.99,2.55,1.03,'y','plain','#aab1a4');
  for(let i=0;i<7;i++)c.props.push({type:'flag',x:x+7.25+i*.3,y:y+6.80,z:z+2.44,color:['#bf9d83','#789c99','#aaa67e'][i%3]});
  purifier(9.3,3.15);cabinet('접수 업무 수납',7.0,.2,2.60,.6,1.0,'#c1c1b1',false,'north');
  table('접수 보조 책상',7.0,.92,1.3,.65,.73,'#7fbbb4');
  // Southern long play room: salmon writing wall, mint desks, sand trays.
  add('놀이실 살구 패널',[.15,.155,.05,6.42,.19,1.08],'#da9d88');
  panel('긴 흰 그림판',3.45,.198,1.95,5.40,1.45,'y','whiteboard','#e1e5dc');
  for(const a of [.4,2.15,4.45]){
   table('민트 놀이 책상',a,1.16,1.3,.75,.69,'#8dcac2');
   chair('놀이 의자',a+.65,2.37,Math.PI,'#3d4b43',false);
  }
  for(const a of [.49,2.24]){
   add('모래놀이 상자 바닥',[a,1.22,.76,a+1.10,1.85,.81],'#d1ba87');
   for(const v of [1.20,1.83])add('모래상자 파란 테두리',[a,v,.78,a+1.10,v+.035,.9],'#336f91');
   for(const u of [a,a+1.065])add('모래상자 목재 테두리',[u,1.2,.77,u+.035,1.86,.9],'#a98b5b');
  }
  for(let i=0;i<4;i++){
   const a=.3+i*1.48;cabinet('놀이 흰 수납장',a,3.19,1.43,.53,.90,'#e5e5dc');
   for(let n=0;n<5;n++){
    add('상담용 미니어처 '+i+n,[a+.1+n*.23,3.24,.94,a+.21+n*.23,3.42,1.04+(n%3)*.06],['#9a764f','#789b73','#c4a363'][n%3]);
   }
  }
  cabinet('보드게임 책장',.3,3.15,1.43,.57,2.55,'#e0e4db',true);books(.39,3.12,1.97,16);
  for(const a of [2.1,3.6,5.05])add('미니어처 벽 선반',[a,3.53,1.87,a+1.08,3.81,1.92],'#e3e6df','wood');
  // Northern intimate meeting room with mint round table and kitchenette.
  rounded('민트 원형 상담탁자',3.12,5.43,1.7,1.46,.73,'#8fc9ba');
  for(const [a,b] of [[1.86,5.43],[4.38,5.43],[3.12,4.35],[3.12,6.48]])chair('개별 상담 의자',a,b,facing(a,b,3.12,5.43),'#35463f',false);
  cabinet('상담 흰 하부장',.6,6.26,1.45,.48,.85,'#e0e3d9');
  add('전자레인지',[.73,6.32,.88,1.39,6.72,1.24],'#d9ddd2');add('전자레인지 유리',[.78,6.3,.94,1.28,6.31,1.17],'#253833');
  add('은색 냉장고',[.25,4.14,.02,.91,4.88,1.95],'#9ba99f','metal',true);
  for(const b of [1.8,5.5])panel('풍경 블라인드',.17,b,2.5,2.8,.76,'x','landscape','#a8cda2');
  // The owner-confirmed corridor-end entrance is connected after furnishing.
 }
 function lobby(){
  // This is a vestibule, not a classroom window bay. Do not restore the old
  // facade panes across the open entrance after installing the folding leaves.
  c.skipPhotoWindows=true;
  for(const list of [worldBoxes,worldColliders]){
   const next=list.flatMap(b=>b.spaceId===room.id&&b.name.startsWith('Window_')?subtractBox(b,[41,-7.3,0,49,-6.7,2.65]):[b]);list.splice(0,list.length,...next);
  }
  p.finish('staff_floor','#bbbbb0');
  // Two glazed vestibule lines with an always-open broad central route.
  for(const v of [.20,3.05]){
   for(const [a,b] of [[.18,1.80],[8.20,9.82]]){
    add('현관 고정 유리',[a,v,.10,b,v+.045,2.50],'#d8e3dc','clear_glass',true);
    add('현관 반투명 하부',[a,v-.01,.10,b,v,1.04],'#c0cfcc','paint');
    for(const u of [a,b-.035])add('현관 알루미늄 세로틀',[u,v-.03,.02,u+.04,v+.075,2.86],'#b0b7b1','metal',true);
   }
   add('현관 유리 상부',[.18,v,2.53,9.82,v+.045,2.84],'#d7e2dc','clear_glass');
   for(const h of [1.04,2.50,2.84]){
    if(h===1.04)for(const [a,b] of [[.18,1.8],[8.2,9.82]])add('하부 샷시',[a,v-.02,h,b,v+.06,h+.035],'#a2aea9','metal');
    else add('상부 샷시',[.18,v-.02,h,9.82,v+.06,h+.04],'#a2aea9','metal');
   }
   // Door leaves folded perpendicular to facade, outside the six-metre path.
   for(const a of [1.82,8.13]){
    add('열린 유리문',[a,v,.10,a+.05,v+1.10,2.48],'#cbdcd6','clear_glass',true);
    add('열린 문 하부 불투명 필름',[a-.008,v+.02,.10,a,v+1.07,1.04],'#bfcdca');
    for(const h of [.08,1.04,2.47])add('열린 문 가로틀',[a-.015,v,h,a+.065,v+1.10,h+.035],'#acb8b0','metal');
    add('문 손잡이',[a-.04,v+.88,.90,a+.09,v+.92,1.32],'#929e98','metal');
   }
   add('점자 유도 블록',[3.5,v-.02,.011,6.5,v+.31,.022],'#d5b24f','tactile_mat');
  }
  add('현관 먼지 매트',[2.5,.58,.012,7.5,1.2,.019],'#747e79','rubber_mat');
  // TV feature wall, not an obstruction across the open hall.
  add('행복하세요 벽',[.11,3.8,.04,.17,6.48,2.79],'#e2d8b3');
  add('벽걸이 TV',[.175,4.43,1.06,.26,5.93,1.94],'#243230');
  for(let i=0;i<3;i++)add('둥근 초록 노랑 벽 장식 '+i,[.18,3.92+i*.82,.03,.25,4.65+i*.82,.66],i%2?'#8aab46':'#c6ab4e','paint');
  add('안내 게시판 나무벽',[9.81,3.75,.10,9.88,6.56,2.78],'#c5aa78','wood');
  panel('학교 안내 게시판',9.795,5.18,1.64,2.46,1.88,'x','papers','#b4c68f');
  // Photo-observed pair of small house-shaped reading benches in vestibule.
  for(const [i,b] of [0.35,1.6].entries()){
   add('독서 집 벤치 '+i,[.22,b,.04,.88,b+1.08,.48],'#c5aa78','wood',true);
   add('독서 집 벽 '+i,[.16,b,.48,.22,b+1.08,1.56],'#cad4aa');
   for(const v of [b,b+1.03])add('독서 집 세로틀',[.15,v,.48,.28,v+.05,1.64],i?'#d1be93':'#88a35a','wood');
   // Stepped silhouette keeps this light-weight and clear at game distance.
   for(let n=0;n<10;n++){const half=.54*(1-n/10);add('독서 집 지붕 '+i+n,[.15,b+.54-half,1.56+n*.055,.28,b+.54+half,1.61+n*.055],i?'#d1be93':'#88a35a','wood');}
  }
  add('우산 보관함',[9.25,.8,.04,9.75,1.55,.42],'#b9ad90','wood',true);
  for(let n=0;n<4;n++)add('우산 손잡이 '+n,[9.33+n*.09,1.02,.35,9.35+n*.09,1.06,.82],'#546a77','metal');
  c.entry={x:45,y:.6,z};c.spawn={x:45,y:-2,z};c.entryYaw=Math.PI;
 }
 if(room.id==='2F_GRADE3_RESEARCH')research();else if(room.id==='3F_COUNSELING')counseling();else lobby();
 if(room.id==='3F_COUNSELING')connectCounselingEntry(c,worldBoxes,worldColliders);
 for(const item of c.boxes)if(item.material==='wood'&&Math.min(...item.color)>.73)item.material='paint';
 return c;
}
