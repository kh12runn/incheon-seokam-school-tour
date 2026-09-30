import {openClassroomWindows} from './창문배치.mjs';
export const STAFF_ID='2F_STAFF';
export const STAFF_REFERENCE={revision:'5aa608bf-88e5-4431-bc72-2062c2719ed2',count:7,approximateDimensions:true,features:['회색·베이지 파티션 업무석','검정 모니터와 사무용 의자','긴 밝은 목재 회의탁자와 붉은 의자','벽면 흰 수납장과 냉장고','전자레인지·커피머신·정수기','녹색 콤비 블라인드','흰 화분과 문서 정리용품']};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function staffRoomInterior(data,worldBoxes,worldColliders,addBox){
  const room=data.rooms.find(r=>r.id===STAFF_ID);if(!room)return null;
  openClassroomWindows({...data,rooms:[{...room,type:'classroom'}],boxes:data.boxes.filter(b=>b.spaceId===STAFF_ID)},worldBoxes,worldColliders,addBox);
  const boxes=[],colliders=[],chairs=[];
  const add=(name,b,color,material='paint',solid=false,shape)=>{
    const [x,v,h,X,V,H]=b,item={name:'교무실 '+name,spaceId:STAFF_ID,interiorRoom:STAFF_ID,floor:2,kind:'detail',bounds:[43+x,-V,3.4+h,43+X,-v,3.4+H],color:rgb(color),material,...(shape?{shape}:{})};
    boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});return item;
  };
  add('밝은 타일 바닥',[.11,.11,.001,12.89,6.89,.009],'#d0d2c9','terrazzo');
  add('흰 천장',[.11,.11,3.10,12.89,6.89,3.12],'#e8e8e2').kind='ceiling';
  for(let i=1;i<20;i++)add('바닥 줄눈 세로 '+i,[i*.64,.12,.011,i*.64+.008,6.88,.014],'#bfc2b7');
  for(let i=1;i<11;i++)add('바닥 줄눈 가로 '+i,[.12,i*.63,.011,12.88,i*.63+.008,.014],'#bfc2b7');
  for(const x of [.11,12.86])add('옆벽 걸레받이 '+x,[x,.11,.015,x+.025,6.89,.11],'#8e958b');
  function chair(x,v,angle,red,index){
    chairs.push({x:43+x,y:-v,z:3.4,angle,red});
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
    add('검정 업무 모니터 '+row+' '+i,[x+.26,mv,.95,x+1.02,mv+.055,1.47],'#202a2b','paint');
    add('모니터 지지대 '+row+' '+i,[x+.60,mv,.79,x+.65,mv+.045,1.03],'#354041','metal');
    add('키보드 '+row+' '+i,[x+.30,v+.28,.79,x+.91,v+.45,.813],'#4d5755');
    add('책상 서랍장 '+row+' '+i,[x+1.02,v+.12,.025,x+1.41,v+.69,.71],'#c5c7bc','paint',true);
    chair(x+.72,row?6.60:.48,row?0:Math.PI,false,'업무'+row+i);
  }
  // Entering from the corridor, left is the east end (+X). Two end desks
  // face back into the room, as clarified by the owner and photos 6–7.
  for(let i=0;i<2;i++){
    const v=1.45+i*2.57;
    add('왼쪽 끝 업무 책상 '+i,[11.15,v,.73,11.88,v+1.5,.78],'#c4b79d','wood',true);
    add('왼쪽 끝 파티션 하부 '+i,[11.02,v,.03,11.10,v+1.5,1.10],'#a8b2b3','fabric',true);
    add('왼쪽 끝 파티션 상부 '+i,[11.02,v,1.10,11.10,v+1.5,1.49],'#b6ad97','fabric',true);
    add('왼쪽 끝 파티션 윗틀 '+i,[11.01,v,1.47,11.11,v+1.5,1.50],'#74827e','metal');
    add('왼쪽 끝 검정 업무 모니터 '+i,[11.24,v+.30,.95,11.30,v+1.06,1.47],'#202a2b');
    add('왼쪽 끝 모니터 지지대 '+i,[11.24,v+.64,.79,11.30,v+.69,1.02],'#354041','metal');
    add('왼쪽 끝 키보드 '+i,[11.48,v+.31,.79,11.65,v+.92,.813],'#4d5755');
    add('왼쪽 끝 책상 서랍장 '+i,[11.18,v+1.04,.02,11.84,v+1.45,.71],'#c5c7bc','paint',true);
    for(const dv of [.08,1.38])add('왼쪽 끝 책상 다리 '+i+dv,[11.20,v+dv,.02,11.25,v+dv+.05,.73],'#788481','metal');
    chair(12.40,v+.75,Math.PI/2,false,'왼쪽끝'+i);
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
    add('긴 회의탁자 '+i,[x,2.95,.73,x+1.88,4.10,.78],'#c9a481','meeting_table',true);
    for(const dx of [.10,1.70])for(const v of [3.06,3.94])add('회의탁자 철제다리 '+i+dx+v,[x+dx,v,.02,x+dx+.055,v+.055,.73],'#697774','metal');
    for(let j=0;j<4;j++){add('회의자료 묶음 '+i+j,[x+.18+j*.34,3.22,.783,x+.46+j*.34,3.65,.823+j*.005],['#c2d6d3','#ddc3ce','#efe9dc','#819398'][j]);}
  }
  for(let i=0;i<4;i++){chair(6.42+i*.96,2.70,Math.PI,true,'회의북'+i);chair(6.42+i*.96,4.36,0,true,'회의남'+i);}
  add('노란 문서 바구니',[9.15,3.62,.81,9.74,4.00,1.01],'#d5b457');
  for(let i=0;i<5;i++)add('문서 정리판 '+i,[9.25+i*.09,3.69,1.01,9.285+i*.09,3.97,1.42],'#c8d1cf');
  for(const [x,v] of [[10.78,3.35],[10.78,5.98]]){
    add('흰 원형 화분 '+v,[x-.22,v-.22,.01,x+.22,v+.22,.70],'#d7dfd7','ceramic',true,'sphere');
    add('화분 줄기 '+v,[x-.025,v-.025,.55,x+.025,v+.025,1.60],'#7d7055','wood');
    for(let i=0;i<6;i++)add('화분 잎 '+v+i,[x-.42+(i%2)*.18,v-.28,1.10+i*.11,x+.23+(i%2)*.18,v+.28,1.30+i*.11],'#5f7d58','foliage',false,'sphere');
  }
  for(let i=0;i<5;i++)for(let j=0;j<9;j++)add('녹색 콤비 블라인드 '+i+j,[.25+i*2.55,6.83,1.50+j*.125,2.53+i*2.55,6.855,1.58+j*.125],j%2?'#bdc2a4':'#929e70','fabric');
  // Corridor-side white frames, cut around the original entrance.
  for(const x of [1.2,2.6,6.1,8.3,10.5]){
    add('복도 반투명 창 '+x,[x,.115,1.14,x+1.25,.14,2.65],'#b4c5bd','glass');
    for(const dx of [0,1.24])add('복도 흰 창틀 '+x+dx,[x+dx,.14,1.10,x+dx+.035,.19,2.69],'#eceee5');
    for(const h of [1.1,2.12,2.65])add('복도 흰 창 가로틀 '+x+h,[x,.14,h,x+1.28,.19,h+.035],'#eceee5');
  }
  add('벽걸이 TV',[12.78,5.72,2.10,12.83,6.55,2.68],'#293635');
  for(const x of [2.7,6.5,10.4])for(const v of [1.95,5.03])add('직사각 천장 조명 '+x+v,[x-.59,v-.21,3.025,x+.59,v+.21,3.07],'#f0f3ea','lamp');
  for(const x of [4.0,9.2]){add('천장 에어컨 '+x,[x-.5,3.0,2.96,x+.5,4.0,3.08],'#dedfd5');add('에어컨 흡입구 '+x,[x-.32,3.18,2.94,x+.32,3.82,2.958],'#78877a');}
  return {roomId:STAFF_ID,room,boxes,colliders,chairs,workstations:{corridor:3,window:2,endWall:2},spawn:{x:47.55,y:-1,z:3.4},entryYaw:0,reference:STAFF_REFERENCE};
}
