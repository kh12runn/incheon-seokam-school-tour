import {openClassroomWindows} from './창문배치.mjs';
export const NURSE_ID='1F_NURSE';
export const NURSE_REFERENCE={revision:'f10e7cbc-e609-4bab-89f7-c1f7c7197e73',count:16,approximateDimensions:true,features:['밝은 목재 바닥','나무 아치형 출입구','대기용 원형 의자와 건강 게시판','회색 파티션 상담석','나무 약품 수납장과 흰 유리장','냉장고·정수기·공기청정기','안정실 침대 3개와 접은 이불·커튼'],privacy:'사람·개인 문서·환자 기록 제외'};
// Keep the existing 6 x 7 metre room and corridor entrance. Photographs describe
// the interior, not surveyed dimensions: furniture is fitted to traversable zones.
export function nurseRoomInterior(data,worldBoxes,worldColliders,addBox){
  const room=data.rooms.find(r=>r.id===NURSE_ID);if(!room)return null;
  openClassroomWindows({...data,rooms:[{...room,type:'classroom'}],boxes:data.boxes.filter(b=>b.spaceId===NURSE_ID)},worldBoxes,worldColliders,addBox);
  const boxes=[],colliders=[],arches=[{left:1.45,right:2.85,v:2.55},{left:4.2,right:5.6,v:3.80}],stools=[],beds=[];
  const add=(name,b,color,material='paint',solid=false,shape)=>{
    const [x,v,h,X,V,H]=b,item={name:'보건실 '+name,spaceId:NURSE_ID,interiorRoom:NURSE_ID,floor:1,kind:'detail',bounds:[59+x,-V,h,59+X,-v,H],color:[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255),material,...(shape?{shape}:{})};
    boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});return item;
  };
  add('밝은 나무 바닥',[.10,.10,.001,5.90,6.90,.009],'#c5b498','room_floor');
  add('천장',[.10,.10,3.10,5.90,6.90,3.12],'#e4e5dc').kind='ceiling';
  for(const x of [.10,5.865]){
    add('옆벽 목재 허리띠 '+x,[x,.10,.85,x+.035,6.90,.97],'#885432','wood');
    add('옆벽 천장 몰딩 '+x,[x,.10,2.99,x+.035,6.90,3.07],'#5a3929','wood');
  }
  // Wide waiting-room arch and open stable-room arch; no invisible doorway wall.
  add('대기실 아치 왼쪽 벽',[.10,2.51,0,1.45,2.65,3.10],'#e2dfd1','paint',true);
  add('대기실 아치 오른쪽 벽',[2.85,2.51,0,5.90,2.65,3.10],'#e2dfd1','paint',true);
  add('대기실 상부 벽',[1.45,2.51,2.65,2.85,2.65,3.10],'#e2dfd1','paint',true);
  add('안정실 측면 벽',[3.03,3.70,0,3.13,6.90,3.10],'#d1e3df','paint',true);
  for(const a of arches){
    for(const x of [a.left-.095,a.right])add('아치 기둥 '+a.v+x,[x,a.v-.07,0,x+.095,a.v+.10,2.65],'#97603d','wood',true);
    add('아치 상부 충돌 '+a.v,[a.left,a.v-.06,2.65,a.right,a.v+.09,2.76],'#97603d','wood',true);
  }
  add('안정실 유리칸막이 하부',[3.13,3.74,0,4.105,3.89,.96],'#97603d','wood',true);
  add('안정실 유리칸막이 창',[3.17,3.78,.98,4.07,3.82,2.47],'#bfd8d2','clear_glass',true);
  add('안정실 유리칸막이 상부',[3.13,3.74,2.47,4.2,3.89,2.70],'#97603d','wood');
  for(const x of [3.13,3.62,4.105])add('안정실 창 기둥 '+x,[x,3.74,.95,x+.055,3.89,2.49],'#97603d','wood',true);
  add('안정실 오른쪽 문설주',[5.695,3.74,0,5.90,3.89,2.70],'#97603d','wood',true);
  // Three white beds under the exterior windows, with drawers and folded quilts.
  for(let i=0;i<3;i++){
    const x=3.24+i*.865; beds.push({x:x+.345,v:5.99});
    add('안정실 침대 하부 '+i,[x,5.15,.07,x+.69,6.78,.47],'#e1e7e2','paint',true);
    add('안정실 매트리스 '+i,[x,5.14,.47,x+.70,6.77,.61],'#e9eee6','fabric');
    add('침대 머리판 '+i,[x,6.75,.42,x+.70,6.81,1.12],'#dce6df');
    add('침대 서랍 '+i,[x+.06,5.13,.13,x+.63,5.148,.36],'#d5dfd7');
    add('침대 서랍 손잡이 '+i,[x+.27,5.112,.28,x+.41,5.13,.31],'#8aafb7','metal');
    add('흰 베개 '+i,[x+.05,6.28,.61,x+.65,6.69,.77],'#eef0e7','fabric',false,'sphere');
    for(let j=0;j<3;j++)add('접은 이불 '+i+j,[x-.012,5.22,.61+j*.075,x+.712,5.93,.68+j*.075],j%2?'#b7c4c0':'#e5e5da','fabric');
  }
  // A gathered curtain leaves the entrance and the front-of-bed aisle open.
  add('안정실 커튼 봉',[3.22,4.02,2.54,5.78,4.055,2.57],'#c2ccca','metal');
  for(let i=0;i<8;i++)add('걷어둔 커튼 '+i,[3.24+i*.045,3.97,.94,3.271+i*.045,4.085,2.53],i%2?'#c8d9d7':'#e8eee6','fabric');
  // Reception/counselling desk and high partition, separate from patient aisle.
  add('상담 책상',[.18,3.15,.70,1.27,4.55,.76],'#b89d78','wood',true);
  add('상담 책상 서랍',[.18,3.22,.03,.60,3.72,.70],'#c7bfab','paint',true);
  add('상담 회색 파티션',[1.27,3.14,.02,1.34,4.59,1.18],'#b7b9ac','fabric',true);
  add('상담 파티션 유리',[1.285,3.14,1.18,1.33,4.59,1.47],'#b4ccca','glass',true);
  for(let i=0;i<7;i++)add('상담 파티션 줄무늬 '+i,[1.336,3.14,1.20+i*.036,1.342,4.59,1.209+i*.036],'#d1dad4');
  add('상담 컴퓨터',[.98,3.57,.93,1.04,4.22,1.36],'#283637');
  add('상담 모니터 받침',[.91,3.82,.76,1.10,3.96,.94],'#495754','metal');
  add('상담 키보드',[.72,3.63,.765,.89,4.15,.79],'#606c65');
  add('상담 의자',[.34,4.60,.12,.91,5.08,.90],'#4f5b52','fabric',true);
  // Warm wooden medical storage, white glazed supply cabinets and treatment trolley.
  for(let i=0;i<2;i++){
    const v=5.24+i*.73;
    add('나무 약품 수납장 '+i,[.13,v,.02,.75,v+.69,2.74],'#99663f','wood',true);
    add('약품장 유리문 '+i,[.756,v+.06,1.13,.772,v+.62,2.48],'#92b0a2','glass');
    for(let j=0;j<3;j++){
      add('약품장 선반 '+i+j,[.77,v+.05,1.20+j*.4,.79,v+.63,1.225+j*.4],'#d6d9c6');
      for(let k=0;k<3;k++)add('약품 보관통 '+i+j+k,[.775,v+.10+k*.16,1.23+j*.4,.793,v+.20+k*.16,1.45+j*.4],['#c2d2c4','#ebebe3','#adbebd'][k]);
    }
    add('약품장 손잡이 '+i,[.79,v+.56,.64,.815,v+.58,.89],'#abb3ad','metal');
  }
  add('창가 처치대 수납',[1.03,6.24,.03,2.86,6.87,.62],'#e1e7dc','paint',true);
  add('창가 처치대 쿠션',[1.03,6.24,.62,2.86,6.86,.73],'#807761','fabric');
  for(let i=0;i<4;i++)add('처치대 서랍 손잡이 '+i,[1.20+i*.42,6.221,.35,1.225+i*.42,6.242,.48],'#959f97','metal');
  add('흰 유리 약품장',[.14,1.69,.02,1.18,2.39,2.30],'#e4e9e0','paint',true);
  add('흰 약품장 유리',[.16,1.673,.76,1.16,1.688,2.24],'#91b2a7','glass');
  for(let i=0;i<3;i++)for(let j=0;j<4;j++)add('흰 약품장 보관함 '+i+j,[.22+j*.23,1.66,.92+i*.39,.38+j*.23,1.672,1.16+i*.39],j%2?'#dee5d8':'#acc8bd');
  add('흰 냉장고',[3.05,1.70,.01,3.67,2.37,2.00],'#e6e9e3','paint',true);
  add('냉장고 냉동칸 경계',[3.04,1.685,1.32,3.68,1.704,1.35],'#556763');
  add('처치용 이동 서랍장',[4.98,2.76,.08,5.56,3.31,.82],'#dce4df','metal',true);
  for(let i=0;i<4;i++)add('처치 서랍 빨간 손잡이 '+i,[5.02,2.75,.23+i*.14,5.51,2.77,.255+i*.14],'#a85152');
  for(let i=0;i<3;i++)add('처치대 소독용기 '+i,[5.06+i*.13,2.84,.83,5.15+i*.13,2.95,1.05],'#dae7df');
  add('공기청정기',[3.94,1.8,.02,4.36,2.2,.78],'#e6ebe5','paint',true);
  for(let i=0;i<11;i++)add('공기청정기 흡입구 '+i,[3.965+i*.033,1.79,.10,3.977+i*.033,1.809,.57],'#7c8b87');
  // Waiting area: small round glass table, coloured round stools, notice boards.
  add('유리 원탁 받침',[.65,.67,.02,.91,.93,.63],'#697e78','metal',true);
  add('유리 원탁',[.25,.28,.63,1.30,1.31,.67],'#82aaa0','glass',true,'sphere');
  for(let i=0;i<4;i++){
    const v=.40+i*.53;stools.push({x:5.53,v,color:i<2?'#b7bf46':'#b15c85'});
    colliders.push({name:'보건실 대기 원형 의자 '+i,spaceId:NURSE_ID,floor:1,bounds:[64.28,-v-.22,0,64.78,-v+.22,.45]});
  }
  add('정수기',[3.13,.18,.01,3.61,.62,1.15],'#e5eae2','paint',true);
  add('정수기 출수구',[3.23,.625,.60,3.53,.643,.91],'#394d49');
  add('입구 매트',[1.54,.12,.012,2.73,1.0,.02],'#ae795a','rubber_mat');
  add('복도 청록 유리창',[3.92,.12,1.16,5.18,.15,2.23],'#93c9c0','glass');
  for(const x of [3.89,4.54,5.17])add('복도 흰 창틀 '+x,[x,.15,1.13,x+.035,.20,2.27],'#e7eae1');
  for(const h of [1.13,2.24])add('복도 흰 창 가로틀 '+h,[3.89,.15,h,5.20,.20,h+.035],'#e7eae1');
  for(const start of [.14,3.14]){
    for(let i=0;i<5;i++)add('창가 흰 세로 창틀 '+start+i,[start+i*.655,6.84,.97,start+i*.655+.035,6.92,2.34],'#dfe6df','metal');
    for(const h of [.97,1.97,2.30])add('창가 흰 가로 창틀 '+start+h,[start,6.84,h,start+2.66,6.92,h+.035],'#dfe6df','metal');
  }
  for(const x of [1.5,4.5])for(const v of [1.2,4.4,6.2])add('천장 면조명 '+x+v,[x-.43,v-.2,3.02,x+.43,v+.2,3.07],'#f0f4e8','lamp');
  return {roomId:NURSE_ID,room,boxes,colliders,arches,stools,beds,spawn:{x:61.1,y:-1.3,z:0},entryYaw:0,reference:NURSE_REFERENCE};
}
