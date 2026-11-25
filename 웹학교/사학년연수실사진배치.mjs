// Ten approved photos uploaded 2026-11-25. Coordinates use makeRoom's 10×7 frame.
// The custom upload folder maps to the existing room; no new room or walls inferred.
export const GRADE4_RESEARCH_ID='4F_GRADE4_RESEARCH';
export const GRADE4_REFERENCE={kind:'research4',count:10,reviewedAt:'2026-11-25',
 sourceRoomId:'custom_e4810ef9e89f46aebcb100f0a10e84b3',revision:'e90567b2-79e0-4a3f-9f27-e18e49014caa',
 imageIds:['5fe28962-cb29-411a-b436-2ff9554be372','550a0192-7714-40d5-99a8-58c11f23d2d8','b413ae61-0bcc-4555-93b4-c4a824693f95','5059a86c-d5ee-43c9-9381-dde99989ef3a','b1909252-e85c-44d3-b9e4-0fa61ac0c58d','82a664bf-c3bb-45a3-ad59-33f951da8392','e4962d91-f9e3-4a8d-986a-25cb77c54532','53fed445-2213-4e43-b519-3e66aa879809','7931b952-937e-42b1-aeb7-3cfc2e0fdebe','daaca24b-5d2f-4024-9769-8bfa48b07e86'],
 features:['오른쪽 목재 상하장·은색 유리문 교구장','긴 둥근 사각 유리 회의탁자와 검정 의자','왼쪽 복합기·정수기·흰 싱크대·연두 수납장·냉장고','출입문 옆 듀얼 모니터 업무 책상','창가 크림색 접이식 가림막·키 큰 수납장','회색 바닥과 연녹색 하부 벽·천장 에어컨']};

export function research4PhotoLayout({c,add,table,seat,monitor,panel}){
 const wood='#c6ab7f',silver='#bec8c6',dark='#303735';
 c.grade4Room=true;
 const prop=(type,x,y,z,options={})=>c.props.push({type,x,y,z,...options});
 // Preserve the door at x=3.5. Its approach continues along the left-hand aisle.
 for(const x of [.13,9.83])add('연녹색 하부 벽',[x,.15,.05,x+.025,6.84,1.08],'#b1bba4');
 for(const x of [.13,9.83])add('검정 걸레받이',[x,.15,.015,x+.03,6.84,.11],'#3d443f');
 add('창가 하부 벽',[.15,6.82,.05,9.84,6.85,.94],'#b1bba4');
 // Five paired glass cabinets, each with wood upper and lower doors.
 for(let i=0;i<5;i++){
  const y=1.12+i*1.12,Y=y+1.09,face=9.06;
  add('오른쪽 자료장 뒷판 '+i,[9.74,y,.04,9.8,Y,2.83],wood,'wood');
  const solid=add('자료장 충돌 '+i,[face,y,.03,9.8,Y,2.83],wood,'wood',true);solid.renderInDetails=true;
  for(const v of [y,Y-.035])add('자료장 측판',[face,v,.04,9.78,v+.035,2.83],wood,'wood');
  for(const z of [.05,.72,1.2,1.68,2.2,2.8])add('자료장 선반',[face,y,z,9.77,Y,z+.035],wood,'wood');
  for(let door=0;door<2;door++){
   const v=y+.015+door*.545,V=v+.515;
   for(const [lo,hi]of [[.08,.71],[2.24,2.79]]){
    add('자료장 목재 문',[face-.025,v,lo,face,V,hi],wood,'wood');
    const handle=v+(door?.06:.43);add('자료장 목재문 손잡이',[face-.06,handle,(lo+hi)/2-.08,face-.03,handle+.024,(lo+hi)/2+.08],silver,'metal');
   }
   add('자료장 유리문 '+i+'-'+door,[face-.012,v+.03,.77,face,V-.03,2.19],'#c5d3cf','clear_glass');
   for(const a of [v,V-.028])add('자료장 은색 세로틀',[face-.035,a,.73,face+.008,a+.028,2.23],silver,'metal');
   for(const z of [.73,2.20])add('자료장 은색 가로틀',[face-.035,v,z,face+.008,V,z+.03],silver,'metal');
   add('자료장 유리문 손잡이',[face-.08,v+(door?.07:.41),1.10,face-.04,v+(door?.10:.44),1.29],silver,'metal');
  }
  for(let shelf=0;shelf<3;shelf++)for(let j=0;j<5;j++){
   const v=y+.08+j*.18,z=.78+shelf*.48,color=['#95b874','#78a9b6','#cabd96','#9f8aab','#e0dac8'][(i+j+shelf)%5];
   if((i+shelf)%3===0)add('자료장 가로 자료집',[9.16,v,z,9.63,v+.15,z+.12],color);
   else add('자료장 책과 바인더',[9.16,v,z,9.58,v+.07,z+.31+(j%2)*.035],color);
  }
  if(i<3)add('자료장 위 보관 상자',[9.13,y+.04,2.85,9.72,Y-.04,3.02],'#d7cfaf');
 }
 for(const [y,text] of [[6.22,'기타자료'],[5.1,'미술용품'],[2.86,'보드게임'],[1.74,'수학교과']]){
  panel('자료장 '+text,9.015,y,.44,.62,.20,'x','grade4-label','#f3f0e5');c.panels.at(-1).text=text;
 }
 // Rounded rectangle, rather than an ellipse. Collider and four legs match the top.
 table('긴 회의탁자',4.45,1.70,3.1,3.70,.75,wood);
 c.boxes.find(b=>b.name.endsWith('긴 회의탁자 상판')).renderInDetails=true;
 prop('grade4-table',6,3.55,.78,{w:3.1,d:3.7});
 for(let i=0;i<3;i++){
  seat('왼쪽 검정 회의 의자 '+i,3.88,2.18+i*1.14,-Math.PI/2,dark,false);
  seat('오른쪽 검정 회의 의자 '+i,8.12,2.18+i*1.14,Math.PI/2,dark,false);
 }
 seat('창가 쪽 검정 회의 의자',6,5.94,Math.PI,dark,false);
 seat('출입구 쪽 검정 회의 의자',6,1.13,0,dark,true);
 for(const q of c.chairs)q.grade4Chair=true;
 c.chairs.at(-1).blanket=true;
 // Left wall: copier → water purifier → sink → lime drawers → refrigerator.
 add('복합기 흰 본체',[.20,1.1,.04,1.33,1.94,1.03],'#dde0dc','paint',true);
 add('복합기 검정 상부',[.2,1.1,1.03,1.34,1.94,1.30],'#252d31');
 add('복합기 급지대',[.28,1.18,1.30,1.20,1.85,1.37],'#e1e3dc');
 for(let i=0;i<3;i++)add('복합기 서랍',[1.335,1.17,.19+i*.23,1.35,1.87,.36+i*.23],'#c3c9c4');
 add('정수기 받침장',[.20,2.05,.03,1.19,2.68,.77],'#e3e5df','paint',true);
 add('흰 정수기',[.32,2.14,.78,1.01,2.64,1.37],'#e8e9e1');
 add('정수기 물받이',[1.02,2.22,.80,1.17,2.57,.85],'#bac6bf','metal');
 add('정수기 취수부',[1.02,2.27,1.03,1.05,2.57,1.18],'#333c3e');
 add('흰 싱크 수납장',[.2,2.78,.03,1.2,4.04,.81],'#e1e3dd','paint',true);
 for(const y of [2.80,3.42]){
  add('싱크 흰 문',[1.20,y,.08,1.225,y+.59,.78],'#e7e8e2');
  add('싱크 손잡이',[1.23,y+.48,.34,1.255,y+.51,.58],silver,'metal');
 }
 add('싱크 금속 상판',[.18,2.76,.82,1.24,4.06,.87],'#bfcac6','metal');
 add('싱크볼',[.38,3.15,.873,1.04,3.85,.880],'#566568','metal');
 add('싱크볼 안쪽',[.43,3.20,.881,.99,3.80,.884],'#879591','metal');
 prop('grade4-tap',.45,3.89,.88);
 add('종이타월함',[.19,3.17,1.46,.46,3.58,1.93],'#e1e5df');
 add('종이타월 검정 출구',[.46,3.18,1.52,.48,3.57,1.60],'#303c3a');
 add('연두 서랍장 몸체',[.2,4.18,.03,1.22,5.40,1.12],wood,'wood',true);
 for(let col=0;col<2;col++)for(let row=0;row<3;row++){
  const y=4.20+col*.59,z=.08+row*.34;
  add('연두 서랍장 문',[1.22,y,z,1.25,y+.56,z+.31],row===1?'#9bbf45':wood);
  add('서랍장 둥근 손잡이',[1.26,y+.25,z+.13,1.30,y+.30,z+.18],silver,'metal');
 }
 add('흰 냉장고',[.2,5.55,.02,1.31,6.38,2.12],'#e3e5df','paint',true);
 add('냉장고 문 이음',[1.312,5.57,.82,1.33,6.36,.85],'#636e6b');
 add('냉장고 손잡이',[1.335,5.59,.86,1.36,6.34,.90],silver,'metal');
 // Tall cream cupboard and a folded screen partly cover the photographed rear window.
 add('창가 키 큰 크림 수납장',[.18,6.43,.03,2.35,6.83,3.02],'#d9d9c6','paint',true);
 for(const x of [1.20,1.29])add('키 큰 수납장 손잡이',[x,6.38,1.18,x+.028,6.43,1.36],silver,'metal');
 for(let i=0;i<3;i++){
  const x=4.2+i*1.04,y=6.46+(i%2)*.14;
  add('창가 접이식 가림막 '+i,[x,y,.08,x+1.02,y+.06,2.28],'#dedfca','paint',true);
  for(const xx of [x,x+.99])add('가림막 세로 프레임',[xx,y-.012,.05,xx+.03,y+.08,2.32],'#bcc4b6','metal');
  add('가림막 받침',[x+.10,y-.16,.03,x+.9,y+.23,.075],'#a3ada3','metal');
 }
 // PC desk on the corridor wall, to the right after entering (left when looking out).
 table('출입문 옆 업무 책상',5.35,.18,4.15,.65,.74,wood);
 for(let i=0;i<2;i++){
  const first=c.boxes.length,y=.41;
  monitor('듀얼 업무 모니터 '+i,6.45+i*.75,y,.80);
  for(const item of c.boxes.slice(first)){const b=item.bounds,axis=c.room.bounds[2]+y+.0275;item.bounds=[b[0],2*axis-b[4],b[2],b[3],2*axis-b[1],b[5]];}
 }
 add('업무 키보드',[6.38,.60,.80,7.60,.76,.83],'#343b3a');
 add('업무 PC 본체',[8.2,.24,.8,8.60,.65,1.36],'#2c3335');
 add('코팅기',[5.45,.27,.80,6.17,.65,.99],'#dedfd7');
 add('코팅기 급지선',[5.50,.66,.91,6.12,.68,.94],'#36454a');
 add('전자레인지',[8.78,.27,.80,9.40,.68,1.18],'#303837');
 add('전자레인지 문',[8.82,.69,.86,9.30,.71,1.11],'#1f2c30','glass');
 // Work chair kept clear of the near end of the meeting table.
 seat('흰 등커버 업무 의자',7.8,1.34,Math.PI,'#d9dad2',true);c.chairs.at(-1).grade4Chair=true;
 panel('왼쪽 업무 화이트보드',.18,1.75,2.02,1.54,.93,'x','grade4-board','#eceee6');
 prop('grade4-clock',4.7,.17,2.40);
 prop('grade4-fan',.2,6.1,2.62);
 prop('grade4-aircon',3.4,3.6,2.97);
 prop('grade4-kettle',.70,4.53,1.14);
 for(const [x,y,color]of [[5.4,3.25,'#339ca6'],[6.80,2.85,'#327654']])prop('grade4-cup',x,y,.825,{color,tall:true});
 for(const [x,y]of [[5.2,4.2],[6.8,4.0],[.9,4.98]])prop('grade4-cup',x,y,x<1?1.14:.825,{color:'#e4e4d7'});
 add('탁자 남색 정리 바구니',[5.25,3.55,.83,6.2,4.04,.99],'#384956');
 for(let i=0;i<6;i++)add('바구니 흰 격자',[5.27+i*.16,3.54,.84,5.285+i*.16,3.55,.99],'#d7dcd1');
 for(let i=0;i<5;i++)add('탁자 활동지 묶음',[6.4+i*.02,3.4+i*.02,.83+i*.018,7.1+i*.02,3.92+i*.02,.845+i*.018],i%2?'#dfdfd3':'#eeeee2');
 add('탁자 달걀 트레이',[5.27,4.30,.83,6.28,4.92,.88],'#b7b5a4');
 for(let i=0;i<15;i++)prop('smallEgg',5.39+(i%5)*.18,4.4+Math.floor(i/5)*.18,.94,{color:'#ba8d62'});
 add('탁자 물티슈',[6.7,2.30,.83,7.13,2.57,.89],'#dce0c2');
 // Match subtle pale grey tiles instead of wood and keep geometry inside the room.
 c.boxes.find(b=>b.name.endsWith('사진 바닥')).color=[.76,.78,.74];
}
