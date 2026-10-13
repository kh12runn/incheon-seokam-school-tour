import {OCT13_REFERENCES as refs} from './십월십삼일사진근거.mjs';
export const OCT13_SPACE_REFERENCES={
 '1F_CAFETERIA':{...refs.custom_62bd284c95074790a9a33fe8ac6321c3,kind:'cafeteria',features:['주황색 의자와 흰 긴 식탁','연보라 하부 벽과 회색 점무늬 바닥','흰 원기둥과 금속 보호링','스테인리스 배식대와 식판 반납대','금속 소독장·정수기','양쪽 식사 공간 사이 넓은 통로']},
 '3F_BOOK_LIBRARY':{...refs.OTHER_MISC,kind:'library',locationConfirmedAt:'2026-10-13',locationConfirmation:'사용자가 4-6 앞 사진은 도서관 내부라고 확인',features:['입구 목재 대출 데스크와 PC','흰색 양면 서가와 목재 벽면 책장','연두 의자와 원형·사각 열람탁자','창가 낮은 책장과 초록 스툴','책갈피형 파랑 서가 안내판','겨자색 기둥·짙은 천장 보·회색 타일']},
};
const books=['#d9d7be','#a2b6b4','#7c98a0','#b7af9b','#cfb380','#926971','#709286'];
export const OCT13_BUILDERS={
 cafeteria({c,add,table,seat,cabinet,panel}){
  const tint='#b0b8d2';
  for(const [name,b] of [['창가',[.12,.13,.09,9.88,.17,1.12]],['왼벽',[.13,.15,.09,.17,6.83,1.12]],['오른벽',[9.83,.15,.09,9.87,6.83,1.12]],['복도 왼벽',[.14,6.81,.09,3.1,6.85,1.12]],['복도 오른벽',[3.9,6.81,.09,9.85,6.85,1.12]]])add('급식실 연보라 '+name,b,tint);
  for(const a of [.55,4.0,7.2])for(const b of [1.25,3.75]){
   table('흰 급식 식탁',a,b,2.05,.72,.72,'#e2e0d4');
   for(const q of c.boxes.slice(-5))if(q.name.includes('상판'))q.material='paint';
   for(let j=0;j<4;j++)for(const side of [-1,1]){
    seat('주황 급식 의자',a+.22+j*.53,b+(side<0?-.43:1.15),side<0?Math.PI:0,'#dfa12f');
   }
  }
  for(const a of [3.12,6.48]){
   const b=2.87;
   add('원기둥 충돌',[a-.15,b-.27,0,a+.15,b+.27,3.09],'#e4e3db','paint',true).renderInDetails=true;
   c.props.push({type:'cafeteriaColumn',x:a,y:b,z:0,radius:.27,color:'#e4e3db',baseColor:tint});
  }
  // The original corridor entrance at x=3.5 stays unobstructed.
  for(const [a,w,label] of [[.3,2.15,'식판 반납대'],[5.0,3.9,'배식대']]){
   add(label+' 금속 본체',[a,6.13,.10,a+w,6.76,.86],'#acb6b3','metal',true);
   add(label+' 상판',[a-.03,6.08,.86,a+w+.03,6.80,.91],'#d1d7d3','metal');
   for(let i=0;i<4;i++)add(label+' 사각 용기',[a+.09+i*(w-.16)/4,6.25,.914,a+.09+i*(w-.16)/4+(w-.32)/4,6.62,.929],'#65746f','metal');
   add(label+' 앞 받침',[a,5.99,.78,a+w,6.08,.83],'#c7cfca','metal');
  }
  cabinet('금속 식기 소독장',9.05,5.9,.6,.76,2.1,'#afb9b7');
  for(const h of [.2,1.13])add('소독장 유리',[9.09,5.866,h,9.61,5.881,h+.77],'#637c79','glass');
  add('흰 정수기',[.17,5.0,.03,.56,5.58,1.2],'#e4e6df','paint',true);
  add('정수기 출수부',[.18,4.99,.71,.52,5.001,1.05],'#475754');
  panel('급식 영양 안내',6.6,6.78,1.9,2.6,.95,'y','nutrition','#eee7ce');
 },
 library({c,add,table,seat,monitor,panel,cabinet}){
  // Book stacks are instanced boxes in the existing renderer, not source images.
  function shelf(a,b,w,d,h,along=false,white=false){
   const color=white?'#e0e3dc':'#bba27b';
   add('도서관 서가 충돌',[a,b,.02,a+w,b+d,h],color,'wood',true).renderInDetails=true;
   for(const z of [.06,.40,.76,1.12,1.48,h-.04])add('서가 선반',[a,b,z,a+w,b+d,z+.035],color,'wood');
   if(along){for(const y of [b,b+d-.04])add('서가 끝판',[a,y,.04,a+w,y+.04,h],color,'wood');}
   else for(const x of [a,a+w-.03])add('책장 측판',[x,b,.04,x+.03,b+d,h],color,'wood');
   const n=Math.floor((along?d:w)/.09);
   for(let row=0;row<4;row++)for(let i=0;i<n;i++){
    const z=.10+row*.355,offset=.05+i*.09;
    if(along){for(const edge of [a+.035,a+w-.14])add('양면 서가 책',[edge,b+offset,z,edge+.105,b+offset+.058,z+.24+(i%3)*.022],books[(row*3+i)%books.length],'paint');}
    else add('벽 책장 책',[a+offset,b+.03,z,a+offset+.06,b+d-.02,z+.25+(i%3)*.02],books[(i+row)%books.length],'paint');
   }
  }
  // Clear main entry corridor at x=3.5 from the existing south door.
  for(const a of [4.45,6.15,7.85]){
   shelf(a,1.8,.44,3.92,1.84,true,true);
   panel('서가 분류 안내',a+.22,1.77,1.4,.40,.62,'y','library-index','#b2d7db');
  }
  for(let i=0;i<5;i++)shelf(.32+i*1.88,6.28,1.78,.40,1.65);
  shelf(.20,2.7,.30,2.8,1.78,true);shelf(9.48,1.3,.29,4.7,1.78,true);
  // Entrance photograph 80892cb2: the desk's short end faces the doorway.
  // Room authoring scales x by 2: .4 x 2.2 becomes an .8 x 2.2 metre desk.
  // Keep the south doorway, shelving and reading furniture unchanged.
  table('대출 데스크',2.15,.70,.40,2.20,.75,'#ba9164');
  add('대출 데스크 목재 앞판',[2.54,.70,.05,2.56,2.90,.74],'#b38c63','wood');
  add('대출 데스크 입구쪽 옆판',[2.15,.70,.05,2.55,.74,.74],'#b38c63','wood');
  for(const cy of [1.50,2.35]){
   const start=c.boxes.length;monitor('대출 업무 PC',0,0,.81);
   const [ox,,oy]=c.room.bounds;
   for(const q of c.boxes.slice(start)){
    const b=q.bounds;
    q.bounds=[ox+2.30+(b[1]-oy)/2,oy+cy-(b[3]-ox),b[2],ox+2.30+(b[4]-oy)/2,oy+cy-(b[0]-ox),b[5]];
   }
  }
  seat('대출 업무 의자',1.68,1.90,-Math.PI/2,'#82a24e',true);
  c.reference.deskCorrection='입구 옆면이 보이도록 데스크·PC·의자 90도 재배치 (2026-10-13)';
  cabinet('업무 자료장',.25,.15,2.0,.48,.99,'#b8a37f',true);
  panel('도서관 활동 게시판',2.05,.18,1.95,2.1,1.0,'y','papers','#c4b498');
  for(const b of [3.52,5.25]){
   c.props.push({type:'roundedTable',x:1.94,y:b,z:.75,w:1.22,d:1.12,color:'#c4ad82'});
   add('원형 열람탁자 충돌',[1.33,b-.56,.02,2.55,b+.56,.78],'#c4ad82','wood',true).renderInDetails=true;
   for(const dx of [-.83,.83])seat('연두 열람 의자',1.94+dx,b,dx<0?-Math.PI/2:Math.PI/2,'#acba5e');
  }
  table('사각 열람탁자',6.0,.22,2.3,.65,.74,'#ded9c8');
  for(const a of [6.45,7.85])seat('목재 열람 의자',a,1.35,0,'#bfa47b');
  for(const a of [4.2,5.4])add('창가 연두 스툴',[a,5.98,.04,a+.46,6.48,.44],'#83b73e','fabric',true);
  for(const a of [.18,4.0,9.65])add('겨자색 벽 기둥',[a,6.82,0,a+.16,6.87,3.0],'#bf972e');
  for(const a of [2.7,6.0]){add('짙은 천장 장식보',[a,.18,2.90,a+.18,6.82,3.04],'#695c49','wood');}
 }
};
