import {photoRoom} from './사진실내도구.mjs';
import {PHOTO_REFERENCES} from './추가사진근거.mjs';
import {subtractBox} from './창문배치.mjs';
import {magpieRoomInterior,MAGPIE_ID} from './까치방사진배치.mjs';
import {octoberRoomInterior} from './현관상담사진배치.mjs';
import {OCT6_REFERENCES} from './현관상담사진근거.mjs';
import {OCT8_SPACE_REFERENCES,OCT8_BUILDERS} from './십월팔일특별실배치.mjs';
import {research6PhotoLayout,computerPhotoLayout} from './연수실컴퓨터실수정.mjs';
// Geometry is fitted to the existing room bounds; photos do not resurvey walls.
export const EXTRA_PHOTO_ROOMS={
 ...OCT8_SPACE_REFERENCES,
 '1F_MAIN_LOBBY':{count:15,kind:'lobby',features:['양쪽 유리 출입문','반투명 하부 필름','벽걸이 TV와 안내 게시판','집 모양 독서 벤치','점자블록과 현관 매트']},
 '3F_COUNSELING':{count:27,kind:'counseling',features:['살구·민트 벽','주황 벤치와 흰 상담탁자','모래놀이 상자','미니어처 흰 수납장','민트 원형 상담탁자','풍경 블라인드']},
 '2F_GRADE3_RESEARCH':{count:9,kind:'research3',features:['긴 목재 회의탁자','검정 회의의자','유리 자료장','창가 연두 업무의자','복합기와 자료 분류장']},
 '2F_SCIENCE':{count:6,kind:'science',features:['흰 대리석 무늬 실험대','청록·검정·목재 의자','창가 긴 싱크대','흰 전면 보드','높은 유리 실험기구장','뒤쪽 화면과 장비장']},
 '2F_INTELLIGENT_SCIENCE':{count:6,kind:'intelligentScience',features:['색색 모둠 실습탁자','남색 학생 의자','창가 스탠드 모니터','큰 전자칠판과 흰 보드','흰 상하 수납장','충전 보관장과 창의교육 블라인드']},
 '4F_KINDERGARTEN':{count:22,kind:'kindergarten',features:['연두색 둥근 모둠탁자','연두 학생 의자','흰 높은 유리 수납장','연두 창가 업무 파티션','벽걸이 화면과 활동 게시판','싱크대와 낮은 수조 받침']},
 '2F_CARE_DREAM_WISH':{count:8,kind:'careWish',features:['연두색 전면 수납벽','원목 낮은 좌식탁자','둥근 낮은 탁자','흰 사물함과 개방칸','흰 싱크대','초록 풍경 벽화']},
 '2F_CARE_DREAM_LOVE':{count:8,kind:'careLove',features:['초록 하부장과 흰 보드','노란 틀 TV','두 쌍의 낮은 모둠탁자','원형 아동 탁자','벽쪽 긴 탁자와 작은 의자','흰 사물함과 목재 책장']},
 '1F_PRINTING':{count:7,kind:'printing',features:['큰 복사기','목재 종이 분류칸','금속 캐비닛','작업 책상과 공구 작은 서랍','녹색 운반대','공기청정기와 회색 바닥']},
 '1F_MEAL_CART_STORAGE':{count:6,kind:'mealCart',features:['빈 배식차 보관 바닥','흰 타일 벽','금속 벽 보호띠','긴 바닥 배수로','벽면 호스','세면대와 벽장']},
 '3F_GRADE1_RESEARCH':{count:8,kind:'research1',features:['긴 타원 목재 회의탁자','벽면 유리 교구장','검정 회의의자와 연두 회전의자','컴퓨터 업무탁자','복사기','빨간 창틀과 회색 타일']},
 '3F_INDIVIDUAL_3':{count:8,kind:'individual3',features:['긴 연결형 개별 탁자','목재 의자','흰 수납장과 냉장고','노랑·연두 벽띠','청록 겨울 풍경 블라인드','교사용 모니터 책상']},
 '2F_INDIVIDUAL_1':{count:8,kind:'individual1',features:['ㄷ자 목재 모둠탁자','파란 하부 수납벽과 연두 상부','전면 화면','교사용 모니터 책상 여러 개','독서 책장과 정리함','빨간 창틀과 밝은 그림 블라인드']},
 '4F_GRADE6_RESEARCH':{count:6,kind:'research6',reviewedAt:'2026-10-08',features:['입구 왼쪽 천장 높이 은색 유리문 교구장','길쭉한 타원 회의탁자와 노란 매트·유리 덮개','양쪽 검정 회의 의자','투명 교구통·정리 바구니·트레이','오른쪽 PC 책상 두 개와 복합기','창가 냉장고와 싱크대']},
 '4F_COMPUTER':{count:6,kind:'computer',reviewedAt:'2026-10-08',features:['학생 모니터와 의자 방향 반전','전면 가운데 흰 롤형 빔 스크린과 천장 프로젝터','스크린을 바라볼 때 우측 구석 교사용 책상','목재 컴퓨터 책상 열과 갈색 의자','빨간 창틀','천장 색색 가랜드·풍선과 컴퓨터부 안내판']},
 '2F_CARE_DREAM_HOPE':{count:8,kind:'careHope',features:['원목 사각·반원 활동탁자','원목 어린이 의자','흰 벽면 붙박이장','초록 칠판','검정 냉장고와 전자레인지','창가 낮은 책장']},
};
const colors=['#dcbd63','#78a1ac','#a7bd70','#b588a0','#dc936e'];

function makeRoom(room,worldBoxes,recipe){
 const [x,X,y,Y,z]=room.bounds,sx=(X-x)/10,sy=(Y-y)/7;
 // Author in a ten-by-seven reference frame, keeping original architectural doors.
 const virtual={...room,bounds:[x,x+10,y,y+7,z,z+3.15]};
 const p=photoRoom(virtual,worldBoxes,{...recipe,...PHOTO_REFERENCES[room.id],reviewedAt:recipe.reviewedAt??'2026-10-02',approximateDimensions:true,peopleExcluded:true});
 const {config:c,add,table,monitor}=p;c.additionalRoom=true;c.photoSupport=true;c.room=room;
 function cabinet(name,a,b,w,d,h,color,open=false,facing='south'){
  const start=c.boxes.length,startC=c.colliders.length;p.cabinet(name,a,b,w,d,h,color,open,facing);
  // Face the cupboard doors into the room, never into an exterior wall.
  const axis=facing==='west'?0:1,flip=axis===0?a<5:b<3.5,origin=axis===0?x:y,centre=origin+(axis===0?a+w/2:b+d/2);
  if(flip)for(const item of [...c.boxes.slice(start),...c.colliders.slice(startC)]){const bounds=[...item.bounds];[bounds[axis],bounds[axis+3]]=[2*centre-bounds[axis+3],2*centre-bounds[axis]];item.bounds=bounds;}
 }
 c.props=[];c.panels=[];c.reference.sourceRoomId=recipe.sourceRoomId??PHOTO_REFERENCES[room.id]?.sourceRoomId??room.id;
 function panel(name,a,b,h,w,height,axis='y',style='papers',color='#a6c3b4'){
  c.panels.push({name,x:a,y:b,z:h,width:w,height,axis,style,color});
 }
 function seat(name,a,b,angle=0,color='#bfa779',office=false){p.chair(name,a,b,angle,color,office);}
 function cubbies(name,a,b,w,h,color='#c0a982',bins=false){
  cabinet(name,a,b,w,.43,h,color,true);const cols=Math.max(2,Math.floor(w/.55));
  for(let i=1;i<cols;i++)add(name+' 세로칸 '+i,[a+i*w/cols,b,.05,a+i*w/cols+.025,b+.43,h],color,'wood');
  for(let j=0;j<cols;j++)for(let k=0;k<3;k++){
   const xx=a+.06+j*w/cols,zz=.09+k*h/4;
   if(bins)add(name+' 정리함 '+j+k,[xx,b+.04,zz,xx+w/cols-.12,b+.36,zz+h/4-.07],colors[(j+k)%5]);
   else for(let n=0;n<3;n++)add(name+' 책 '+j+k+n,[xx+n*.065,b+.10,zz,xx+n*.065+.04,b+.32,zz+h/4-.06],colors[(j+n)%5]);
  }
 }
 function fridge(a,b,color='#e0e3dd'){add('냉장고',[a,b,.02,a+.66,b+.67,1.9],color,'paint',true);add('냉장고 문 이음',[a+.02,b-.01,1.28,a+.64,b,1.30],'#77837c');}
 function copier(a,b){add('복합기 본체',[a,b,.03,a+.88,b+.70,.94],'#d5d9d3','paint',true);add('복합기 검정 윗판',[a-.02,b,.94,a+.90,b+.69,1.04],'#293934');add('복합기 급지대',[a+.13,b+.09,1.04,a+.70,b+.57,1.13],'#e3e3d9');for(let i=0;i<3;i++)add('복합기 서랍',[a+.04,b-.012,.17+i*.22,a+.82,b,.34+i*.22],'#b8c3bb');}
 function sink(a,b,w=1.2){cabinet('싱크 수납장',a,b,w,.60,.84,'#c3ac88');add('싱크대 금속 상판',[a,b,.84,a+w,b+.6,.89],'#b9c6bf','metal');add('싱크볼',[a+.18,b+.12,.891,a+w-.18,b+.47,.90],'#566b66','metal');add('수전',[a+w*.5,b+.51,.89,a+w*.5+.035,b+.55,1.15],'#cad4cb','metal');add('수전 꼭지',[a+w*.5,b+.33,1.12,a+w*.5+.04,b+.55,1.16],'#cad4cb','metal');}
 function screen(a,b,w=2.5,h=1.25){add('학습 화면 검정틀',[a,b,1.03,a+w,b+.07,1.03+h],'#263431');panel('학습 화면',a+w/2,b-.008,1.03+h/2,w-.08,h-.08,'y','screen');}
 function toys(a,b,z0=0,w=1.4){for(let i=0;i<8;i++)add('알록달록 교구 '+i,[a+(i%4)*w/4,b+Math.floor(i/4)*.17,z0,a+(i%4)*w/4+.15,b+.13+Math.floor(i/4)*.17,z0+.11+(i%3)*.04],colors[i%5]);}
 function workDesk(a,b){table('교사용 책상',a,b,1.7,.7,.73,'#c6af8d');monitor('업무 모니터',a+.15,b+.40,.79);seat('업무 의자',a+.85,b-.5,Math.PI,'#303f3d',true);}
 p.finish(/research|printing|mealCart/.test(recipe.kind)?'staff_floor':'wood',/research|printing|mealCart/.test(recipe.kind)?'#b9c0ba':'#cabda4');
 const h={p,c,add,table,cabinet,monitor,panel,seat,cubbies,fridge,copier,sink,screen,toys,workDesk};
 BUILDERS[recipe.kind](h);
 if(/research/.test(recipe.kind)){
  for(const b of c.boxes)if(/회의탁자 상판$/.test(b.name))b.renderInDetails=true;
  for(const q of c.props)if(q.type==='roundedTable')q.noLegs=true;
 }
 // Painted white cabinetry should not acquire the wood-grain shader.
 for(const b of c.boxes)if(b.material==='wood'&&Math.min(...b.color)>.73)b.material='paint';
 // Convert authored geometry once; renderer and collision use the same transform.
 const point=(a,b,h=0)=>({x:x+a*sx,y:y+b*sy,z:z+h});
 for(const item of [...c.boxes,...c.colliders]){const b=item.bounds;item.bounds=[x+(b[0]-x)*sx,y+(b[1]-y)*sy,b[2],x+(b[3]-x)*sx,y+(b[4]-y)*sy,b[5]];}
 for(const q of c.chairs){q.x=x+(q.x-x)*sx;q.y=y+(q.y-y)*sy;q.scale=recipe.kind==='research6'?.95:Math.min(1,sx,sy);}
 if(recipe.kind==='research6')for(const b of c.colliders.filter(b=>/의자/.test(b.name))){const a=b.bounds,cx=(a[0]+a[3])/2,cy=(a[1]+a[4])/2;b.bounds=[cx-.2375,cy-.2375,a[2],cx+.2375,cy+.2375,a[5]];}
 c.panels=c.panels.map(q=>({...q,...point(q.x,q.y,q.z),width:q.width*(q.axis==='y'?sx:sy)}));
 c.props=c.props.map(q=>({...q,...point(q.x,q.y,q.z),sx,sy}));
 c.point=point;
 const annex=room.building==='ANNEX',north=y>=3;
 c.entry=annex?{x:X+.7,y:y+(Y-y)*.35,z}:{x:x+(X-x)*.35,y:north?y-.7:Y+.7,z};
 c.spawn=annex?{...c.entry,x:X-.75}:{...c.entry,y:north?y+.75:Y-.75};
 c.entryYaw=annex?-Math.PI/2:north?0:Math.PI;
 return c;
}

const BUILDERS={
 ...OCT8_BUILDERS,
 science({add,table,cabinet,seat,sink,screen,panel}){
  for(let i=0;i<6;i++)sink(.3+i*1.25,.2,1.2);
  for(let row=0;row<2;row++)for(let col=0;col<3;col++){
   const a=1.65+col*2.85,b=1.9+row*2.0;
   table('흰 실험대',a,b,1.3,1.0,.77,'#d6d9d1');
   cabinet('실험대 하부장',a+.17,b+.25,.96,.57,.75,'#d0d5ca');
   for(let j=0;j<2;j++)seat('실험 의자',a+.33+j*.64,b-.43,Math.PI,['#3e938c','#303c38','#aa8d61'][(row+col+j)%3]);
   for(let i=0;i<4;i++)add('실험대 회색 결',[a+.06,b+.1+i*.22,.823,a+1.24,b+.103+i*.22,.826],'#c1cbc4');
  }
  for(let i=0;i<3;i++){cabinet('흰 실험기구장',8.9,1.25+i*1.48,.75,1.28,2.9,'#e3e4da',i===1);}
  // The corridor door is at authored x=3.5; keep the board beside its opening.
  add('전면 흰 칠판',[4.1,6.77,1.12,7.7,6.82,2.6],'#e8e8e0');table('교사용 실험대',4.1,5.85,2,.6,.84,'#d6ddd5');
  screen(6.8,.19,1.8,1.0);panel('과학 안전 안내',8.3,6.81,1.8,.8,1.1,'y','papers');
 },
 intelligentScience({c,add,table,cabinet,seat,monitor,panel,workDesk}){
  for(let row=0;row<3;row++)for(let col=0;col<2;col++){
   const a=1.0+col*4.75,b=1.6+row*1.55,color=['#93bdb0','#b9a587','#b3a158','#7e9ebc','#b7919e','#dddac7'][row*2+col];
   table('색색 모둠 실습대',a,b,2.2,.85,.72,color);
   for(let j=0;j<2;j++)seat('남색 학생 의자',a+.5+j*1.15,b-.48,Math.PI,'#344958');
   // Paired tops keep a fine centre seam like the photographed modular desks.
   add('모둠탁자 중앙선',[a+1.09,b,.771,a+1.11,b+.85,.777],'#667d81');
  }
  for(let i=0;i<4;i++){
   const b=1.15+i*1.23;add('창가 모니터 스탠드',[.43,b,.02,.52,b+.045,1.14],'#3b4d4a','metal');monitor('창가 대형 모니터',.23,b,1.07);
   cabinet('흰 상부 교구장',2.0+i*1.7,6.28,1.64,.42,2.95,'#e1e4dc');
  }
  add('큰 흰 전면 보드',[2.12,6.21,1.11,8.65,6.27,2.43],'#e5e8e2');add('전자칠판',[2.2,6.12,1.16,4.8,6.20,2.39],'#253639');
  panel('창의 탐구 게시판',6,.17,1.87,3.8,1.15,'y','papers','#97b4c3');
  for(let i=0;i<2;i++){add('충전 보관장',[8.7,4.7+i*.87,.02,9.65,5.5+i*.87,1.28],i?'#e1e5dc':'#303d3b','paint',true);for(let j=0;j<6;j++)add('충전장 표시등',[8.74+j*.14,4.69+i*.87,1.15,8.81+j*.14,4.70+i*.87,1.18],'#83c784');}
  workDesk(7.6,.95);
 },
 careWish(h){careGreen(h,false);},
 careLove(h){careGreen(h,true);},
 printing({add,cabinet,cubbies,copier,table,seat,panel}){
  // Narrow three-metre room: keep a full-height centre aisle, not scaled chairs.
  for(let i=0;i<3;i++)cabinet('회색 금속 캐비닛 '+i,7.8,.3+i*1.3,1.55,1.1,2.20,'#b6bcb1');
  cubbies('목재 종이 분류칸',.3,.25,2.0,2.0);
  for(let i=0;i<5;i++)add('보관 상자 '+i,[.4,.3,2.03+i*.14,2.15,.76,2.15+i*.14],'#c5b295');
  table('작업 책상',.3,3.1,1.9,2.0,.73);seat('녹색 작업 의자',2.35,4.2,-Math.PI/2,'#5c7750',true);
  copier(6.2,4.85);copier(6.2,3.25);
  for(let row=0;row<5;row++)for(let col=0;col<4;col++)add('작은 공구서랍',[.3+col*.4,3.2,.8+row*.13,.67+col*.4,3.55,.91+row*.13],row%2?'#a7b5ad':'#6e857f');
  add('공기청정기',[.4,5.5,0,1.9,6.10,.90],'#dce1d9','paint',true);
  add('녹색 운반대',[7.0,6.1,.10,9.5,6.70,.17],'#67927a','metal',true);
  panel('작업 안내판',.2,2.2,1.8,1.8,.7,'x','papers');
 },
 mealCart({c,add,cabinet,panel}){
  for(const x of [.12,9.82]){
   add('흰 타일 옆벽',[x,.15,.02,x+.035,6.85,3.03],'#e7e8df','ceramic');
   add('스테인리스 벽 보호띠',[x-.002,.15,.86,x+.045,6.85,1.17],'#a8b3ad','metal');
   for(let i=1;i<12;i++)add('타일 세로 줄눈',[x-.003,.15+i*.55,.03,x+.045,.158+i*.55,3.0],'#bdc5bc');
   for(let i=1;i<7;i++)add('타일 가로 줄눈',[x-.003,.15,i*.43,x+.045,6.85,i*.43+.008],'#bdc5bc');
  }
  add('바닥 배수로',[1.7,.5,.011,1.99,6.25,.017],'#6c7a75','metal');
  for(let i=0;i<70;i++)add('배수로 슬롯',[1.73,.52+i*.08,.018,1.96,.55+i*.08,.020],'#354b46');
  add('벽걸이 컵장',[8.8,5,1.6,9.55,6.1,2.45],'#a49170','wood');
  add('세면대 받침',[8.78,1.14,.01,9.03,1.38,.77],'#dddeda','ceramic',true);
  add('세면대',[8.48,1.03,.77,9.37,1.58,.90],'#e4e5df','ceramic',true);
  add('세면대 물받이',[8.58,1.12,.90,9.25,1.50,.92],'#a4c0b6');
  c.props.push({type:'hose',x:8.95,y:3.4,z:1.6,color:'#417760'});
  panel('타일 벽 안전표시',5,.17,2.05,1,.5,'y','papers');
 },
 research1({c,add,table,cabinet,seat,monitor,copier,fridge,panel}){
  for(let i=0;i<7;i++){
   cabinet('목재 교구장 '+i,.15,.18+i*.93,.72,.87,2.94,'#bba078',true,'west');
   add('교구장 유리문 '+i,[.9,.21+i*.93,.85,.92,.99+i*.93,2.43],'#a4bfb3','clear_glass');
   for(const y of [.18+i*.93,1.01+i*.93])add('은색 유리문틀',[.9,y,.82,.95,y+.027,2.47],'#c1ccc4','metal');
  }
  table('긴 회의탁자',3.1,1.2,2.8,4.5,.74,'#c9b68d');c.props.push({type:'roundedTable',x:4.5,y:3.45,z:.80,w:2.8,d:4.5,color:'#cdb98e'});
  for(let i=0;i<4;i++){seat('검정 회의 의자',2.5,1.7+i*1.12,-Math.PI/2,'#283d37');seat('검정 회의 의자',6.5,1.7+i*1.12,Math.PI/2,'#283d37');}
  table('창가 업무탁자',1.6,6.12,5.9,.63);monitor('창가 컴퓨터',2.4,6.45,.79);monitor('업무 컴퓨터',4.1,6.45,.79);
  for(const x of [2.7,4.7])seat('연두 회전의자',x,5.5,Math.PI,'#91b548',true);
  copier(8.1,4.5);fridge(8.3,5.75);panel('보라 업무 게시판',9.78,5.4,1.88,1.55,.7,'x','papers','#b5a1b7');
  for(let i=0;i<5;i++)add('빨간 창틀',[.13,.18+i*1.35,1.07,.18,.23+i*1.35,2.5],'#a8584a');
 },
 individual3({add,table,cabinet,seat,fridge,sink,screen,workDesk,panel}){
  for(const [a,b] of [[3.0,1.3],[3.0,3.15],[5.2,4.9]]){table('긴 개별학습 탁자',a,b,3.2,.62,.71);for(let i=0;i<2;i++)seat('목재 학생 의자',a+.75+i*1.45,b-.5,Math.PI,'#ac8d60');}
  workDesk(7.6,3.95);cabinet('주황 교구장',8.6,5.6,.70,.86,2.28,'#ba875a');
  fridge(.3,5.9);sink(1.2,6.2,1.45);cabinet('흰 하부장',.2,.2,2.25,.55,.90,'#e7e5db');
  for(const [z,col] of [[1.65,'#d2bf4a'],[2.04,'#b8c340']])add('노랑 연두 벽띠',[.12,1.2,z,.15,5.7,z+.31],col);
  screen(3.9,6.75,2.2,1.1);panel('겨울 풍경 블라인드',.19,3.4,2.1,4.1,.67,'x','landscape');panel('학생 작품',1.5,.18,1.73,2.1,1.15,'y','flowers');
 },
 individual1({add,table,cabinet,cubbies,seat,screen,workDesk,panel,toys}){
  // Joined desks form a U with its open side facing the original corridor entry.
  for(const b of [1.3,3.0]){table('ㄷ자 측면 탁자',3.05,b,1.45,.66,.71,'#bfa07b');table('ㄷ자 측면 탁자',6.05,b,1.45,.66,.71,'#bfa07b');}
  table('ㄷ자 연결 탁자',3.05,4.7,4.45,.66,.71,'#bfa07b');
  for(const [a,b] of [[3.6,.78],[6.7,.78],[3.6,2.48],[6.7,2.48],[4.2,4.18],[6.4,4.18]])seat('학생 목재 의자',a,b,Math.PI,'#b8996b');
  for(let i=0;i<6;i++)cabinet('파란 하부 수납장',2.8+i*1.08,6.30,1.04,.5,.87,'#4b82ba');
  add('연두 상부 벽띠',[2.7,6.79,2.45,9.5,6.84,2.92],'#a2bc3e');screen(4.8,6.70,2.2,1.2);
  cubbies('독서 교구 책장',.2,.2,2.4,1.7,'#c0a982',true);workDesk(.2,2);workDesk(.2,4.15);
  cabinet('흰 붙박이장',7.5,.18,2.1,.55,2.75,'#e4e6dc');
  panel('그림 블라인드',.18,3.2,2.1,4.9,.68,'x','landscape');toys(3.25,4.81,.77,3.5);
 },
 research6:research6PhotoLayout,
 computer:computerPhotoLayout,
 careHope({c,add,table,cabinet,seat,cubbies,fridge,sink,panel,toys,workDesk}){
  for(let i=0;i<4;i++)cabinet('흰 붙박이장 '+i,.18+i*1.17,.16,1.12,.54,2.98,'#e8e7df');
  fridge(5.2,.17,'#2c3a3c');sink(6.05,.17,1.5);cabinet('전자레인지장',7.85,.16,1.6,.60,1.15,'#e4e3d9');
  add('전자레인지',[8.05,.21,1.17,8.89,.70,1.58],'#ecece3');add('전자레인지 검정문',[8.1,.20,1.23,8.74,.208,1.51],'#273b3b');
  for(const a of [.7,5.4,7.6])for(const b of [2.05,4.35]){table('원목 활동탁자',a,b,1.55,.86,.60,'#c5b18b');seat('원목 아동 의자',a+.35,b-.43,Math.PI);seat('원목 아동 의자',a+1.18,b+1.23,0);toys(a+.15,b+.12,.66,1.1);}
  cubbies('창가 낮은 책장',.2,6.25,2.6,.88);cubbies('목재 독서 책장',4.5,6.2,3.2,1.05);
  panel('핑크 작품판',8.5,6.82,1.8,1.3,1.1,'y','flowers','#dfb6c2');
  add('초록 칠판',[.13,2.25,1.1,.19,5.85,2.4],'#28564b');
  workDesk(.2,5.1);
 },
};
function careGreen({c,add,table,cabinet,cubbies,seat,sink,fridge,panel,toys,screen},love){
 const green=love?'#94bd3b':'#a7c842';
 add('초록 수납벽',[.12,.2,.85,.17,6.2,2.88],green);
 for(let i=0;i<5;i++)cabinet('초록 하부장',.18,.2+i*1.13,.72,1.06,.86,green,false,'west');
 panel('큰 흰 보드',.2,3.55,1.85,3.4,1.30,'x','papers','#eceade');
 add('노란 화면틀',[.18,.48,1.14,.26,1.80,2.21],'#d6bd58');add('검정 학습 화면',[.265,.57,1.22,.28,1.72,2.12],'#233632');
 for(let i=0;i<4;i++)cabinet('흰 사물함',5.3+i*.99,6.32,.94,.46,1.45,'#e7e8df',!love&&i%2===0);
 cubbies('목재 독서 책장',.5,6.25,2.3,1.45);sink(1.2,.18,2.2);fridge(4.1,.2);
 for(const a of love?[4.35,6.65]:[4.5,6.8])for(const b of love?[2.5,4.3]:[2.15,3.75,5.25]){table('원목 좌식탁자',a,b,1.8,.75,.32,'#c9b489');toys(a+.2,b+.12,.38,1.4);}
 table('벽쪽 아동 탁자',6.8,.2,2.4,.66,.58);for(const x of [7.3,8.6])seat('아동 원목 의자',x,1.28,0);
 const v=love?4.0:4.7;c.props.push({type:'roundedTable',x:2.05,y:v,z:love?.60:.34,w:1.65,d:1.4,color:'#cbb891'});
 // Conservative cylinder footprint avoids invisible pass-through table tops.
 add('둥근 활동탁자 충돌',[1.3,v-.61,.02,2.8,v+.61,love?.62:.36],'#cbb891','wood',true).renderInDetails=true;
 panel('초록 풍경 벽화',6.0,.18,1.98,2.1,1.6,'y','landscape');
 if(love){seat('둥근 탁자 의자',2.05,v-1,Math.PI);seat('둥근 탁자 의자',2.05,v+1,0);}
}
export function additionalPhotoInteriors(data,boxes,colliders=[]){
 const configs=Object.entries(EXTRA_PHOTO_ROOMS).map(([id,recipe])=>{const r=data.rooms.find(r=>r.id===id);return r?(OCT6_REFERENCES[id]?octoberRoomInterior(r,boxes,colliders):id===MAGPIE_ID?magpieRoomInterior(r,boxes):makeRoom(r,boxes,recipe)):null;}).filter(Boolean);
 // Open only the already-drawn exterior window panes, including the rear/north
 // science room. Keep glazing collision and do not invent new architectural bays.
 for(const c of configs){
  if(c.skipPhotoWindows)continue;
  const r=c.room,annex=r.building==='ANNEX',axis=c.photoWindowAxis??(annex?0:1),span=1-axis,edge=axis===0?r.bounds[0]:r.bounds[2]>=3?r.bounds[3]:r.bounds[2];
  const panes=data.boxes.filter(b=>b.spaceId===r.id&&b.name.startsWith('Window_')&&Math.abs((b.bounds[axis]+b.bounds[axis+3])/2-edge)<.3);
  for(const pane of panes){
   const cut=[...pane.bounds];cut[axis]=edge-.24;cut[axis+3]=edge+.24;cut[span]+=.04;cut[span+3]-=.04;cut[2]+=.03;cut[5]-=.03;
   for(const list of [boxes,colliders]){const next=list.flatMap(b=>b.spaceId&&b.spaceId!==r.id?[b]:subtractBox(b,cut));list.splice(0,list.length,...next);}
   const glass=[...cut];glass[axis]=edge-.018;glass[axis+3]=edge+.018;
   const item={name:'사진실 외창 '+pane.name,spaceId:r.id,interiorRoom:r.id,floor:parseInt(r.floor),kind:'finish',bounds:glass,color:[.85,.93,.91],material:'clear_glass'};
   c.boxes.push(item);c.colliders.push({...item,kind:'window_collision'});
   for(const h of [cut[2]-.03,cut[5]]){const b=[...glass];b[2]=h;b[5]=h+.03;c.boxes.push({...item,name:item.name+' 가로틀',bounds:b,material:'metal',color:[.78,.80,.76]});}
   for(const u of [cut[span]-.03,cut[span+3]]){const b=[...glass];b[span]=u;b[span+3]=u+.03;c.boxes.push({...item,name:item.name+' 세로틀',bounds:b,material:'metal',color:[.78,.80,.76]});}
  }
 }
 return configs;
}
