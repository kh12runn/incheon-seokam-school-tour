// Re-reviewed six photos per room, 2026-10-08. No private photo textures.
export function research6PhotoLayout({c,add,table,seat,monitor,copier,fridge,sink}){
 add('오른쪽 연녹색 하부벽',[9.79,.15,.08,9.82,6.84,1.06],'#b0b9a5');
 add('창가 연녹색 하부벽',[.18,6.79,.08,9.80,6.82,.94],'#b0b9a5');
 // Door is south, windows north: cupboards LEFT, workstations RIGHT.
 for(let i=0;i<7;i++){
  const y=.85+i*.83,Y=y+.81;
  add('왼쪽 교구장 뒷판 '+i,[.15,y,.03,.20,Y,2.96],'#bba27f','wood');
  add('왼쪽 교구장 충돌 '+i,[.15,y,.03,1.25,Y,2.96],'#bba27f','wood',true).renderInDetails=true;
  for(const v of [y,Y-.035])add('교구장 측판',[.18,v,.03,1.25,v+.035,2.96],'#bba27f','wood');
  for(const h of [.05,.73,1.18,1.66,2.12,2.49,2.93])add('교구장 선반',[.18,y,h,1.25,Y,h+.035],'#bba27f','wood');
  for(const [lo,hi]of [[.08,.72],[2.50,2.94]]){
   add('교구장 목재 닫힌 문',[1.25,y+.015,lo,1.285,Y-.015,hi],'#c6aa82','wood');
   for(const v of [y+.34,y+.46])add('교구장 은색 손잡이',[1.29,v,(lo+hi)/2-.08,1.32,v+.025,(lo+hi)/2+.09],'#bfc8c6','metal');
  }
  add('교구장 투명 유리',[1.25,y+.035,.78,1.264,Y-.035,2.46],'#bfcbc8','clear_glass');
  for(const v of [y+.012,y+.39,Y-.04])add('유리문 세로 은색틀',[1.265,v,.74,1.31,v+.025,2.49],'#c3ccca','metal');
  for(const h of [.74,2.46])add('유리문 가로 은색틀',[1.265,y+.015,h,1.31,Y-.015,h+.03],'#c3ccca','metal');
  for(let row=0;row<3;row++)for(let j=0;j<3;j++){
   const z=.80+row*.48,v=y+.08+j*.22;
   add('장 안 자료와 교구 '+i+' '+row+' '+j,[.55,v,z,1.14,v+.15,z+.25],['#809a97','#dfd9c5','#b9907b','#abb971'][(i+row+j)%4]);
  }
 }
 // Long table with a single rounded top; rectangular tabletop is collision only.
 table('긴 회의탁자',3.75,1.85,2.85,3.85,.75,'#c8ad84');
 c.props.push({type:'roundedTable',x:5.175,y:3.775,z:.785,w:3.15,d:4.25,color:'#c8ad84'});
 add('탁자 노란 중앙 매트',[4.15,2.23,.814,6.2,5.32,.818],'#dfd96d');
 c.props.push({type:'roundedTable',x:5.175,y:3.775,z:.825,w:3.12,d:4.22,color:'#d7e4df',glass:true,thickness:.009,noLegs:true});
 for(let i=0;i<3;i++){
  seat('검정 회의 의자 왼쪽 '+i,3.02,2.45+i*1.22,-Math.PI/2,'#303a38');
  seat('검정 회의 의자 오른쪽 '+i,7.25,2.45+i*1.22,Math.PI/2,'#303a38');
 }
 seat('입구 쪽 회의 의자',5.15,1.24,Math.PI,'#303a38');
 seat('창가 회전 의자',5.15,6.2,0,'#555b59',true);
 // Opposite wall: copier, two adjoining desks, paper stacks, refrigerator.
 copier(8.62,1.25);
 for(let i=0;i<2;i++){
  const y=2.45+i*1.15;
  table('오른쪽 업무 책상 '+i,8.5,y,1.18,1.05,.74,'#bf9f75');
  add('업무 책상 회색 가림판',[9.60,y,.12,9.66,y+1.05,.74],'#959c95','metal',true);
  // Rotate monitors to face west, toward their chairs.
  const start=c.boxes.length;monitor('업무 컴퓨터 '+i,8.65,y+.25,.80);
  for(const b of c.boxes.slice(start)){const a=b.bounds,ox=c.room.bounds[0]+8.95,oy=c.room.bounds[2]+y+.5;const pts=[[a[0],a[1]],[a[3],a[4]]].map(([x,v])=>[ox+(v-oy),oy-(x-ox)]);b.bounds=[Math.min(pts[0][0],pts[1][0]),Math.min(pts[0][1],pts[1][1]),a[2],Math.max(pts[0][0],pts[1][0]),Math.max(pts[0][1],pts[1][1]),a[5]];}
  seat('검정 업무 의자 '+i,7.9,y+.65,-Math.PI/2,'#303936',true);
 }
 fridge(8.8,5.02);sink(7.7,6.18,1.8);
 for(let i=0;i<3;i++)add('업무 책상 복사용지 상자 '+i,[8.5,2.49,.8+i*.21,9.33,3.07,1.0+i*.21],'#b9a080','wood');
 // Photo-observed tabletop storage boxes, baskets and trays, without labels.
 for(let i=0;i<3;i++){
  const y=2.75+i*.59;
  add('투명 교구통 '+i,[4.42,y,.84,5.07,y+.45,1.07],'#c8d7ca','glass');
  add('교구통 파란 뚜껑 '+i,[4.39,y-.015,1.07,5.10,y+.47,1.10],'#82b6c8');
  for(let n=0;n<5;n++)add('교구통 색색 블록',[4.46+(n%2)*.23,y+.05+Math.floor(n/2)*.10,.86,4.65+(n%2)*.23,y+.14+Math.floor(n/2)*.10,1.01],['#ca5d48','#d6bb4d','#6aa0b6'][n%3]);
 }
 for(const [x,y,color]of [[5.35,3.0,'#b45e50'],[5.32,4.52,'#76aac5']]){
  add('탁자 정리 바구니 밑판',[x,y,.84,x+.67,y+.49,.88],color);
  for(const v of [y,y+.46])add('바구니 테두리',[x,v,.88,x+.67,v+.025,1.02],color);
  for(const u of [x,x+.64])add('바구니 테두리',[u,y,.88,u+.025,y+.49,1.02],color);
 }
 add('탁자 종이 트레이',[5.22,3.67,.84,5.98,4.21,.89],'#c4bca9');
 for(let i=0;i<12;i++)c.props.push({type:'smallEgg',x:5.32+(i%4)*.16,y:3.77+Math.floor(i/4)*.16,z:.96,color:'#bb9473'});
}

export function computerPhotoLayout({c,add,table,monitor,seat,panel}){
 // Front is south. Screens face north, reversed from the former layout.
 add('중앙 빔스크린 흰 천',[3.05,.22,1.28,6.95,.245,2.66],'#ecede7');
 add('중앙 빔스크린 상부 롤',[2.94,.18,2.68,7.06,.32,2.78],'#d2d5ce','metal');
 add('중앙 빔스크린 아래 봉',[3.02,.20,1.24,6.98,.29,1.28],'#798783','metal');
 panel('중앙 빔 투사 화면',5,.254,1.98,3.72,1.23,'y','screen');
 add('천장 프로젝터',[4.63,3.18,2.73,5.37,3.68,2.92],'#daddd5');
 add('프로젝터 렌즈',[4.75,3.12,2.76,4.99,3.18,2.86],'#4f6b78','glass');
 panel('컴퓨터부 작품 게시판',5,6.81,1.95,8.2,1.30,'y','computer-posters','#c9bda5');
 for(let row=0;row<4;row++)for(const [col,a]of [.55,2.35,5.15,6.95].entries()){
  const b=1.72+row*1.18;
  table('컴퓨터 책상 '+row+col,a,b,1.6,.6,.73,'#baa07a');
  add('컴퓨터 책상 가림판',[a+.03,b+.035,.07,a+1.57,b+.09,.74],'#c4aa83','wood',true);
  const start=c.boxes.length;monitor('학생 컴퓨터 '+row+col,a+.47,b+.37,.79);
  const cx=c.room.bounds[0]+a+.80,cy=c.room.bounds[2]+b+.30;
  for(const item of c.boxes.slice(start)){const v=item.bounds;item.bounds=[2*cx-v[3],2*cy-v[4],v[2],2*cx-v[0],2*cy-v[1],v[5]];}
  seat('갈색 학생 의자 '+row+col,a+.8,b+.96,0,'#754c3f');
  add('키보드 '+row+col,[a+.4,b+.37,.79,a+1.10,b+.56,.82],'#303c39');
  panel('학습 모니터 '+row+col,a+.845,b+.239,1.134,.52,.30,'y','screen');
 }
 // Right corner when looking at the front screen (west in the world).
 table('우측 구석 교사용 책상',.32,.30,2.08,.72,.74,'#bda17e');
 const teacherStart=c.boxes.length;monitor('교사용 컴퓨터',.83,.51,.80);
 for(const item of c.boxes.slice(teacherStart)){const a=item.bounds,cy=c.room.bounds[2]+.54;item.bounds=[a[0],2*cy-a[4],a[2],a[3],2*cy-a[1],a[5]];}
 add('교사용 키보드',[.78,.86,.80,1.51,1.00,.83],'#303c39');
 seat('교사용 회전 의자',1.39,1.36,0,'#34433e',true);
 for(let i=0;i<12;i++)c.props.push({type:'flag',x:.8+i*.7,y:3.6,z:2.79-Math.sin(i/11*Math.PI)*.28,color:['#dbbd54','#91b9bd','#d797ac'][i%3]});
 for(let i=0;i<5;i++)c.props.push({type:'balloon',x:.6+i*2,y:5.9,z:2.65,color:['#dab35c','#7babbc','#d397ae'][i%3]});
 for(let i=0;i<4;i++){add('빨간 외창 세로틀',[.14,.35+i*1.55,.95,.18,.40+i*1.55,2.48],'#a9544c');add('외창 흰 블라인드',[.16,.42+i*1.55,1.92,.18,1.74+i*1.55,2.48],'#dbded3','fabric');}
}
