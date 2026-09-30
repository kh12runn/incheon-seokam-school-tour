import {openClassroomWindows} from './창문배치.mjs';
export const STAFF_ID='2F_STAFF';
export const STAFF_REFERENCE={revision:'5aa608bf-88e5-4431-bc72-2062c2719ed2',count:12,additionalApprovedPhotoIds:['5db7f84c-3566-4d23-8d40-ac3254450fab','858c67e6-3afc-40cd-8c0c-abcf029ac3ce','d763d6d6-2979-4ccc-8c2f-297362f813ab','77933324-b06c-4d07-8ae2-e020dde2af34','95823877-1380-42be-bc2a-3e53e3cfbcac'],approximateDimensions:true,features:['회색·베이지 파티션 업무석','입구 기준 왼쪽 벽 업무석 2개와 듀얼 모니터','회전형 사무의자','긴 밝은 목재 회의탁자와 붉은 의자','벽면 흰 수납장과 냉장고','전자레인지·커피머신·정수기','녹색 콤비 블라인드','흰 화분과 문서 정리용품']};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function staffRoomInterior(data,worldBoxes,worldColliders,addBox){
  const room=data.rooms.find(r=>r.id===STAFF_ID);if(!room)return null;
  openClassroomWindows({...data,rooms:[{...room,type:'classroom'}],boxes:data.boxes.filter(b=>b.spaceId===STAFF_ID)},worldBoxes,worldColliders,addBox);
  const boxes=[],colliders=[],chairs=[];
  const add=(name,b,color,material='paint',solid=false,shape)=>{
    const [x,v,h,X,V,H]=b,item={name:'교무실 '+name,spaceId:STAFF_ID,interiorRoom:STAFF_ID,floor:2,kind:'detail',bounds:[43+x,-V,3.4+h,43+X,-v,3.4+H],color:rgb(color),material,...(shape?{shape}:{})};
    boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});return item;
  };
  // Refinish the existing cut walls, retaining every doorway and window opening.
  for(let i=0;i<worldBoxes.length;i++){
    const b=worldBoxes[i];
    if(b.spaceId===STAFF_ID&&/^(Wall_|Lintel_)/.test(b.name))worldBoxes[i]={...b,color:rgb('#e3e5e2'),material:'staff_wall'};
  }
  add('밝은 타일 바닥',[.11,.11,.001,12.89,6.89,.009],'#e5e3da','staff_floor');
  add('흰 천장',[.11,.11,3.10,12.89,6.89,3.12],'#eeeee9','staff_ceiling').kind='ceiling';
  for(const x of [.11,12.86])add('옆벽 걸레받이 '+x,[x,.11,.015,x+.025,6.89,.11],'#8e958b');
  function chair(x,v,angle,red,index,office=false){
    chairs.push({x:43+x,y:-v,z:3.4,angle,red,office});
    colliders.push({name:'교무실 의자 충돌 '+index,spaceId:STAFF_ID,floor:2,kind:'furniture',bounds:[43+x-.29,-v-.29,3.4,43+x+.29,-v+.29,4.42]});
  }
  // Existing door at u=4.55 has a full-depth access lane; perimeter work areas
  // are entered from either end, not through the partitions.
  for(const row of [0,1])for(let i=0;i<(row?2:3);i++){
    const x=5.35+i*(row?3:1.95),v=row?5.70:.95,pv=row?5.26:1.68;
    add('업무 책상 '+row+' '+i,[x,v,.73,x+1.45,v+.73,.78],'#c4b79d','wood',true);
    for(const dx of [.07,1.30])add('책상 다리 '+row+' '+i+' '+dx,[x+dx,v+.08,.02,x+dx+.055,v+.63,.73],'#788481','metal');
    add('업무 파티션 하부 '+row+' '+i,[x,pv,.03,x+1.52,pv+.075,1.10],'#a8b2b3','fabric',true);
    add('업무 파티션 베이지 띠 '+row+' '+i,[x,pv,1.10,x+1.52,pv+.075,1.47],'#b6ad97','fabric');
    add('파티션 은색 기둥 '+row+' '+i,[x,pv-.009,.02,x+.033,pv+.084,1.49],'#788280','metal');
    add('파티션 윗틀 '+row+' '+i,[x,pv-.009,1.47,x+1.52,pv+.084,1.495],'#74827e','metal');
    colliders.push({name:'교무실 파티션 전체 충돌 '+row+' '+i,spaceId:STAFF_ID,floor:2,bounds:[43+x,-pv-.075,3.4,43+x+1.52,-pv,4.895]});
    const mv=row?v+.11:v+.52;
    add('검정 업무 모니터 '+row+' '+i,[x+.08,mv,1.04,x+.70,mv+.055,1.46],'#202a2b','paint');
    add('짝 업무 모니터 '+row+' '+i,[x+.73,mv,1.04,x+1.35,mv+.055,1.46],'#202a2b','paint');
    for(const dx of [.08,.73]){
      add('모니터 자산 스티커 '+row+i+dx,[x+dx+.06,mv-.002,1.421,x+dx+.18,mv+.057,1.443],'#d8dddb');
      add('모니터 발판 '+row+i+dx,[x+dx+.18,mv-.055,.785,x+dx+.44,mv+.105,.809],'#363b39');
      add('모니터 세로 지지대 '+row+i+dx,[x+dx+.28,mv,.80,x+dx+.32,mv+.04,1.09],'#363b39');
    }
    add('모니터 지지대 '+row+' '+i,[x+.60,mv,.79,x+.65,mv+.045,1.03],'#354041','metal');
    add('키보드 '+row+' '+i,[x+.30,v+.28,.79,x+.91,v+.45,.813],'#4d5755');
    add('책상 서랍장 '+row+' '+i,[x+1.02,v+.12,.025,x+1.41,v+.69,.71],'#c5c7bc','paint',true);
    chair(x+.72,row?6.60:.48,row?0:Math.PI,false,'업무'+row+i,true);
  }
  // Entering from the corridor, left is the east end (+X). Two end desks
  // face back into the room, as clarified by the owner and photos 6–7.
  for(let i=0;i<2;i++){
    const v=1.45+i*2.57;
    add('왼쪽 끝 사무용 책상 '+i,[11.03,v,.73,12.03,v+1.6,.79],'#c4b79d','wood',true);
    add('왼쪽 끝 파티션 하부 '+i,[11.02,v,.03,11.10,v+1.5,1.10],'#a8b2b3','fabric',true);
    add('왼쪽 끝 파티션 상부 '+i,[11.02,v,1.10,11.10,v+1.5,1.49],'#b6ad97','fabric',true);
    add('왼쪽 끝 파티션 윗틀 '+i,[11.01,v,1.47,11.11,v+1.5,1.50],'#74827e','metal');
    for(let monitor=0;monitor<2;monitor++){
      const mv=v+.10+monitor*.76;
      add('왼쪽 끝 듀얼 모니터 '+i+' '+monitor,[11.17,mv,.98,11.23,mv+.68,1.48],'#202a2b');
      add('왼쪽 끝 모니터 지지대 '+i+' '+monitor,[11.23,mv+.28,.79,11.28,mv+.48,.98],'#354041','metal');
      add('왼쪽 끝 모니터 받침 '+i+' '+monitor,[11.17,mv+.20,.79,11.39,mv+.56,.82],'#354041','metal');
    }
    add('왼쪽 끝 키보드 '+i,[11.65,v+.50,.79,11.83,v+1.08,.816],'#4d5755');
    add('왼쪽 끝 마우스 '+i,[11.58,v+1.22,.79,11.73,v+1.42,.82],'#394342');
    add('왼쪽 끝 책상 서랍장 '+i,[11.76,v+.08,.03,11.98,v+.63,.72],'#c5c7bc','paint',true);
    for(const dx of [11.06,11.99])for(const dv of [v+.08,v+1.45])add('왼쪽 끝 책상 다리 '+i+dx+dv,[dx,dv,.02,dx+.05,dv+.06,.73],'#788481','metal');
    chair(12.40,v+.80,Math.PI/2,false,'왼쪽끝'+i,true);
  }
  // Pantry spans the west end, visible behind the conference table in the photos.
  for(let i=0;i<5;i++){
    const v=.45+i*1.22;
    if(i===2){
      add('흰 냉장고',[.14,v,.02,.87,v+1.02,2.18],'#eceee6','paint',true);
      add('냉장고 냉동칸 경계',[.875,v+.01,1.52,.89,v+1.01,1.545],'#929c94');
      for(const h of [1.33,1.67])add('냉장고 손잡이 '+h,[.89,v+.06,h,.925,v+.28,h+.025],'#9ba7a2','metal');
      continue;
    }
    add('흰 하부 수납장 '+i,[.14,v,.02,.85,v+1.19,.87],'#dee3d9','paint',true);
    add('흰 상부 수납장 '+i,[.14,v,1.76,.66,v+1.19,2.76],'#e6e9df','paint',true);
    for(let j=0;j<2;j++){
      add('수납장 문 경계 '+i+j,[.854,v+.58,.05,.864,v+.592,.83],'#aab5ac');
      add('상부장 손잡이 '+i+j,[.668,v+.51+j*.14,1.86,.697,v+.532+j*.14,2.05],'#a9b5b0','metal');
    }
    if(i===1){add('전자레인지',[.15,v+.13,.90,.71,v+.84,1.33],'#dce2d7');add('전자레인지 유리',[.714,v+.18,.96,.73,v+.64,1.25],'#28342f');}
    if(i===3){add('커피머신',[.20,v+.18,.90,.73,v+.66,1.49],'#323b36');add('커피머신 빨간 표시',[.735,v+.23,1.29,.75,v+.60,1.43],'#ab606b');}
    if(i===4){add('정수기',[.18,v+.13,.89,.74,v+.54,1.60],'#ebede6');add('정수기 출수구',[.75,v+.21,1.08,.78,v+.45,1.45],'#32423e');}
  }
  // Joining tables, generic stationery only (no staff names/documents copied).
  for(let i=0;i<2;i++){
    const x=6.1+i*1.9;
    const table=add('긴 회의탁자 '+i,[x,2.95,.73,x+1.88,4.10,.78],'#cfb291','staff_table',true);
    table.renderInDetails=true;
    for(const dx of [.10,1.70])for(const v of [3.06,3.94])add('회의탁자 철제다리 '+i+dx+v,[x+dx,v,.02,x+dx+.055,v+.055,.73],'#697774','metal');
    for(let j=0;j<4;j++){add('회의자료 묶음 '+i+j,[x+.18+j*.34,3.22,.783,x+.46+j*.34,3.65,.823+j*.005],['#c2d6d3','#ddc3ce','#efe9dc','#819398'][j]);}
  }
  for(let i=0;i<4;i++){chair(6.42+i*.96,2.70,Math.PI,true,'회의북'+i);chair(6.42+i*.96,4.36,0,true,'회의남'+i);}
  add('노란 문서 바구니 바닥',[9.15,3.62,.81,9.74,4.00,.835],'#ddbd41');
  for(const h of [.85,.92,.99]){
    for(const v of [3.62,3.98])add('문서 바구니 가로살 '+h+v,[9.15,v,h,9.74,v+.02,h+.017],'#ddbd41');
    for(const x of [9.15,9.72])add('문서 바구니 옆살 '+h+x,[x,3.62,h,x+.02,4,h+.017],'#ddbd41');
  }
  for(let i=0;i<12;i++)for(const v of [3.62,3.98])add('문서 바구니 세로살 '+i+v,[9.16+i*.05,v,.835,9.174+i*.05,v+.02,1.01],'#ddbd41');
  for(let i=0;i<5;i++)add('문서 정리판 '+i,[9.25+i*.09,3.69,1.01,9.285+i*.09,3.97,1.42],'#c8d1cf');
  for(const [x,v] of [[10.78,3.35],[10.78,5.98]]){
    const pot=add('흰 원형 화분 '+v,[x-.22,v-.22,.01,x+.22,v+.22,.70],'#e7e9e2','ceramic',true,'sphere');
    pot.renderInDetails=true;
  }
  for(let i=0;i<5;i++){
    const x=.165+i*2.6,bottom=1.68+(i%2)*.18;
    add('블라인드 상단 레일 '+i,[x,6.79,2.77,x+2.27,6.89,2.82],'#747669','metal');
    add('블라인드 하단 바 '+i,[x,6.80,bottom-.025,x+2.27,6.85,bottom],'#808969');
    for(let j=0;bottom+j*.13<2.77;j++)add('녹색 콤비 블라인드 '+i+' '+j,[x,6.83,bottom+j*.13,x+2.27,6.855,Math.min(2.77,bottom+j*.13+.084)],'#9aa279','staff_fabric');
    add('창 중앙 여닫이 프레임 '+i,[x+1.12,6.86,1.015,x+1.15,6.92,2.30],'#d3d9d4','metal');
    add('창가 안전 봉 '+i,[x,6.72,1.20,x+2.27,6.755,1.235],'#aeb7b4','metal');
    add('창틀 손잡이 '+i,[x+1.15,6.80,1.36,x+1.17,6.86,1.51],'#67716e','metal');
  }
  // Corridor-side white frames, cut around the original entrance.
  for(const x of [1.2,2.6,6.1,8.3,10.5]){
    add('복도 반투명 창 '+x,[x,.115,1.14,x+1.25,.14,2.65],'#b4c5bd','glass');
    for(const dx of [0,1.24])add('복도 흰 창틀 '+x+dx,[x+dx,.14,1.10,x+dx+.035,.19,2.69],'#eceee5');
    for(const h of [1.1,2.12,2.65])add('복도 흰 창 가로틀 '+x+h,[x,.14,h,x+1.28,.19,h+.035],'#eceee5');
  }
  add('벽걸이 TV',[12.78,5.72,2.10,12.83,6.55,2.68],'#293635');
  for(const x of [2.7,6.5,10.4])for(const v of [1.95,5.03])add('직사각 천장 조명 '+x+v,[x-.59,v-.21,3.025,x+.59,v+.21,3.07],'#f0f3ea','lamp');
  for(const x of [4.0,9.2]){
    add('천장 에어컨 '+x,[x-.5,3.0,2.96,x+.5,4.0,3.08],'#e5e6df');add('에어컨 흡입구 '+x,[x-.32,3.18,2.94,x+.32,3.82,2.958],'#888f86');
    for(let i=0;i<14;i++){
      add('에어컨 흡입 격자 세로 '+x+i,[x-.32+i*.047,3.18,2.925,x-.312+i*.047,3.82,2.94],'#d0d3ca');
      add('에어컨 흡입 격자 가로 '+x+i,[x-.32,3.18+i*.047,2.925,x+.32,3.188+i*.047,2.94],'#d0d3ca');
    }
    for(const v of [3.03,3.92])add('에어컨 토출 루버 '+x+v,[x-.43,v,2.937,x+.43,v+.045,2.951],'#73796f');
  }
  // Photo-specific joinery and small objects; dimensions remain estimates.
  for(const b of boxes){
    if(b.material==='fabric')b.material='staff_fabric';
    if(b.name.includes('파티션 하부'))b.color=rgb('#a9b7be');
    if(/파티션 (상부|베이지)/.test(b.name))b.color=rgb('#c4beab');
  }
  for(const b of [...boxes].filter(b=>/파티션 하부/.test(b.name))){
    const a=b.bounds,x=a[0]-43,X=a[3]-43,v=-a[4],V=-a[1];
    add('파티션 하단 알루미늄 '+b.name,[x-.003,v-.006,.02,X+.003,V+.006,.15],'#818783','metal');
    if(X-x>1)for(const dx of [x+(X-x)/2,X-.027])add('파티션 세로 이음 '+b.name+dx,[dx,v-.012,.15,dx+.018,V+.012,1.475],'#707672','metal');
    else for(const dv of [v+(V-v)/2,V-.027])add('파티션 세로 이음 '+b.name+dv,[x-.01,dv,.15,X+.01,dv+.018,1.475],'#707672','metal');
  }
  for(const b of [...boxes].filter(b=>b.name.startsWith('교무실 키보드')||b.name.startsWith('교무실 왼쪽 끝 키보드'))){
    const a=b.bounds,x=a[0]-43,X=a[3]-43,v=-a[4],V=-a[1],side=X-x<V-v;
    for(let row=0;row<4;row++)for(let col=0;col<12;col++){
      const dx=side?row:col,dv=side?col:row,nx=side?4:12,nv=side?12:4;
      add('키보드 키캡 '+b.name+row+','+col,[x+(dx+.12)*(X-x)/nx,v+(dv+.12)*(V-v)/nv,.818,x+(dx+.87)*(X-x)/nx,v+(dv+.87)*(V-v)/nv,.827],'#abb0aa');
    }
  }
  for(let i=0;i<5;i++){
    const v=.45+i*1.22;
    if(i===2){
      add('냉장고 위 수납장',[.14,v,2.30,.66,v+1.02,2.88],'#eceee7');
      add('냉장고 상부 빈틈',[.16,v+.025,2.20,.62,v+.995,2.29],'#5c635c');
      continue;
    }
    add('수납장 상판 '+i,[.14,v,.87,.88,v+1.19,.905],'#f1f0e8','ceramic');
    add('수납장 걸레받이 '+i,[.855,v+.02,.02,.865,v+1.17,.09],'#abb1aa');
    add('상부장 문 이음 '+i,[.663,v+.588,1.77,.669,v+.598,2.75],'#949c95');
    for(const dv of [.52,.66])add('하부장 은색 손잡이 '+i+dv,[.861,v+dv,.58,.90,v+dv+.021,.77],'#9da6a4','metal');
    for(const dv of [0,1.17])add('수납장 옆판 '+i+dv,[.14,v+dv,.90,.69,v+dv+.025,2.88],'#e8eae3');
    add('수납장 상부 몰딩 '+i,[.14,v,2.76,.69,v+1.19,2.88],'#e8eae3');
    add('수납장 뒷판 '+i,[.145,v,.91,.17,v+1.19,1.76],'#d2dbd5','glass');
  }
  // Open bookcases behind the left-end workstations, below the clock and TV.
  for(const v of [.42,5.83]){
    add('흰 책장 뒷판 '+v,[12.82,v,.05,12.87,v+.85,2.05],'#e9ebe5');
    for(const dv of [0,.82])add('흰 책장 옆판 '+v+dv,[12.55,v+dv,.05,12.84,v+dv+.03,2.05],'#e9ebe5');
    for(const h of [.08,.65,1.22,1.79,2.03])add('흰 책장 선반 '+v+h,[12.55,v,h,12.84,v+.85,h+.026],'#e9ebe5');
    if(v>5)for(let row=0;row<3;row++)for(let i=0;i<9;i++)add('책장 파일 '+row+i,[12.57,v+.08+i*.075,.10+row*.57,12.80,v+.135+i*.075,.49+row*.57+(i%3)*.04],['#d4dfdf','#eee6d0','#71898c','#8c5f67'][i%4]);
  }
  for(const x of [.105,12.87])add('벽 천장 테두리 '+x,[x,.10,3.055,x+.025,6.90,3.10],'#afb6ae');
  for(const v of [.10,6.87])add('벽 천장 가로 테두리 '+v,[.11,v,3.055,12.89,v+.025,3.10],'#afb6ae');
  for(const [x,X] of [[.11,3.94],[5.16,12.89]])add('복도벽 걸레받이 '+x,[x,.10,.01,X,.125,.105],'#969d96');
  add('탕비 싱크 테두리',[.26,.62,.906,.76,1.35,.928],'#b9c1bd','metal');
  add('탕비 싱크 안쪽',[.30,.66,.929,.72,1.31,.933],'#7b8987','metal');
  add('싱크 수전 기둥',[.23,.98,.91,.265,1.015,1.16],'#b3bcb9','metal');
  add('싱크 수전 목',[.23,.98,1.13,.43,1.015,1.16],'#b3bcb9','metal');
  add('싱크 수전 끝',[.40,.98,1.075,.433,1.015,1.16],'#b3bcb9','metal');
  for(const v of [1.77,4.21,5.60]){
    add('탕비 콘센트 '+v,[.18,v,1.54,.195,v+.23,1.64],'#e4e7df');
    for(let i=0;i<4;i++)add('콘센트 구멍 '+v+i,[.196,v+.025+i*.048,1.58,.20,v+.042+i*.048,1.60],'#5b6461');
  }
  for(const h of [1.02,1.20])add('전자레인지 다이얼 '+h,[.731,2.37,h,.754,2.42,h+.055],'#8a9590','metal',false,'sphere');
  add('커피머신 받침',[.64,4.35,.915,.82,4.72,.944],'#a4aaa4','metal');
  add('커피머신 추출구',[.73,4.44,1.19,.78,4.52,1.25],'#858c85','metal');
  add('커피 컵',[.72,4.43,.95,.80,4.51,1.08],'#e9e8db');
  for(const row of [0,1])for(let i=0;i<(row?2:3);i++){
    const x=5.35+i*(row?3:1.95),v=row?5.70:.95;
    add('업무 전화기 '+row+i,[x+1.05,v+.21,.792,x+1.32,v+.45,.837],'#343b38');
    add('전화기 수화기 '+row+i,[x+1.07,v+.20,.839,x+1.31,v+.255,.88],'#292f2d');
    add('전화기 표시창 '+row+i,[x+1.10,v+.29,.839,x+1.27,v+.35,.841],'#8da8a6');
    for(let j=0;j<3;j++)add('서랍 손잡이 '+row+i+j,[x+1.10,v+.10,.16+j*.17,x+1.33,v+.12,.18+j*.17],'#78827e','metal');
    add('업무 문서 트레이 '+row+i,[x+.04,v+.13,.787,x+.27,v+.43,.807],'#65767c');
    add('업무 메모지 '+row+i,[x+.06,v+.15,.809,x+.25,v+.40,.823],'#e7e7d8');
  }
  // The reference partitions form continuous runs, not isolated cubicles.
  const infill=(name,x,v,X,V)=>{
    add('파티션 연결 하부 '+name,[x,v,.15,X,V,1.10],'#a9b7be','staff_fabric',true);
    add('파티션 연결 베이지 '+name,[x,v,1.10,X,V,1.47],'#c4beab','staff_fabric');
    add('파티션 연결 걸레받이 '+name,[x,v-.003,.02,X,V+.003,.15],'#818783','metal');
    add('파티션 연결 상단 '+name,[x,v-.008,1.47,X,V+.008,1.495],'#78817b','metal');
  };
  for(const [a,b] of [[6.87,7.30],[8.82,9.25]])infill('복도 '+a,a,1.68,b,1.755);
  for(const [a,b] of [[6.87,8.35],[9.87,11.02]])infill('창가 '+a,a,5.26,b,5.335);
  infill('끝벽',11.02,2.95,11.10,4.02);
  // Keep the monitor tops visible over the low photo-reference partitions.
  for(const b of [...boxes,...colliders])if(b.name.includes('파티션')){
    b.bounds=[...b.bounds];b.bounds[2]=3.4+(b.bounds[2]-3.4)*.82;b.bounds[5]=3.4+(b.bounds[5]-3.4)*.82;
  }
  return {roomId:STAFF_ID,room,boxes,colliders,chairs,workstations:{corridor:3,window:2,endWall:2},spawn:{x:47.55,y:-1,z:3.4},entryYaw:0,reference:STAFF_REFERENCE};
}
