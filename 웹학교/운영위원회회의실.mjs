// Six approved phone photographs, reviewed 2026-09-29. Dimensions fit the existing room.
import {openClassroomWindows} from './창문배치.mjs';
export const MEETING_ID='2F_OPERATIONS_MEETING';
export const MEETING_REFERENCE={revision:'90c969de-9bb9-45cc-8b00-ae1632d45da8',count:6,
  imageIds:['fa67617e-fbf3-412a-bef4-5318e6fc1c5b','c5e52513-7056-42f8-82f8-e6d28f7a2de5','80a39fb8-2488-477b-b0f1-4d555a306879','2a79561d-95c8-4dff-92b2-a436f75de16d','a087fc02-3eaf-4808-9739-b4f5236a935a','bdfc4352-ed07-463b-9dca-28d801908b59'],
  approximateDimensions:true,features:['긴 갈색 회의탁자와 흰 러너','연두색 의자','양쪽 목재 수납장과 문서 선반','이동식 TV','창가 회색 가림막과 흰 수납장','창가 화분과 블라인드']};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function meetingRoomInterior(data,worldBoxes,worldColliders,addBox){
  const room=data.rooms.find(r=>r.id===MEETING_ID);if(!room)return null;
  openClassroomWindows({...data,rooms:[{...room,type:'classroom'}],boxes:data.boxes.filter(b=>b.spaceId===MEETING_ID)},worldBoxes,worldColliders,addBox);
  const boxes=[],colliders=[],chairs=[];
  const add=(name,b,color,material='paint',solid=false,shape)=>{
    const [x0,v0,z0,x1,v1,z1]=b,item={name:'운영위원회 회의실 '+name,spaceId:MEETING_ID,interiorRoom:MEETING_ID,floor:2,kind:'detail',bounds:[37+x0,-v1,3.4+z0,37+x1,-v0,3.4+z1],color:rgb(color),material,...(shape?{shape}:{})};
    boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});return item;
  };
  // Thin finishes leave the existing floor height, entrance, walls and neighbouring office intact.
  add('밝은 타일 바닥',[.1,.1,.001,5.9,6.9,.006],'#cbd0c5','terrazzo');
  add('흰 천장',[.1,.1,3.10,5.9,6.9,3.12],'#e5e6df').kind='ceiling';
  for(let i=1;i<10;i++)add('바닥 줄눈 '+i,[.1,i*.68,.007,5.9,i*.68+.008,.009],'#b8beb6');
  for(let i=1;i<9;i++)add('바닥 세로 줄눈 '+i,[i*.68,.1,.007,i*.68+.008,6.9,.009],'#b8beb6');
  for(const x of [.105,5.87])add('벽 하부 걸레받이 '+x,[x,.12,.02,x+.025,6.88,.12],'#767b73');
  // Two adjoining tables; the passage from x=39.1 remains clear.
  for(let i=0;i<2;i++){
    const v=1.75+i*1.92;
    add('갈색 회의탁자 상판 '+i,[2.28,v,.745,3.78,v+1.90,.79],'#57483e','meeting_table',true);
    add('회의탁자 받침 '+i,[2.52,v+.25,.02,3.54,v+1.66,.74],'#443d35','wood',true);
    add('흰 레이스 러너 '+i,[2.88,v+.1,.792,3.18,v+1.79,.797],'#e3e4d4');
    for(let n=0;n<11;n++)for(const x of [2.84,3.13])add('러너 물결 '+i+' '+n+' '+x,[x,v+.11+n*.151,.792,x+.09,v+.24+n*.151,.798],'#e3e4d4','paint',false,'sphere');
  }
  const chair=(x,v,angle,index)=>{
    const w=.56,d=.54;
    chairs.push({x:37+x,y:-v,z:3.4,angle});
    colliders.push({name:'운영위원회 회의실 의자 충돌 '+index,spaceId:MEETING_ID,kind:'furniture',floor:2,bounds:[37+x-w/2,-v-d/2,3.4,37+x+w/2,-v+d/2,4.28]});
    // Rounded shell details are rendered by the companion Three.js module.
  };
  for(let i=0;i<5;i++){chair(1.9,1.98+i*.77,-Math.PI/2,i*2);chair(4.16,1.98+i*.77,Math.PI/2,i*2+1);}
  chair(3.03,5.96,0,10);
  // West wall: pale wood full-height cupboards with paired doors and silver pulls.
  for(let i=0;i<6;i++){
    const v=1.18+i*.78;
    add('서쪽 수납장 '+i,[.14,v,.03,.68,v+.75,2.14],'#b9a17f','wood',true);
    for(let j=0;j<2;j++){
      add('수납장 문 '+i+' '+j,[.685,v+.015+j*.365,.07,.705,v+.365+j*.365,2.10],'#c2ac8b','wood');
      const q=v+.31+j*.10;add('은색 손잡이 '+i+' '+j,[.711,q,.95,.739,q+.022,1.12],'#afb7b4','metal');
    }
    if(i<2)add('수납장 위 종이 상자 '+i,[.18,v+.10,2.14,.64,v+.64,2.47],'#a89e86','paint');
  }
  // East wall: open upper shelves, lower cupboards, assorted baskets and files.
  add('동쪽 선반 뒷판',[5.78,1.55,.03,5.86,4.57,2.20],'#897a62','wood');
  colliders.push({name:'운영위원회 회의실 문서선반 충돌',spaceId:MEETING_ID,kind:'furniture',bounds:[42.3,-4.57,3.4,42.87,-1.55,5.61]});
  for(let i=0;i<5;i++)add('선반 세로판 '+i,[5.3,1.55+i*.75,.03,5.84,1.58+i*.75,2.2],'#b5a384','wood');
  for(const z of [.06,.86,1.28,1.70,2.18])add('선반 가로판 '+z,[5.3,1.55,z,5.84,4.58,z+.035],'#c0ad8d','wood');
  for(let i=0;i<4;i++){
    const v=1.59+i*.75;
    add('선반 하부 문 '+i,[5.28,v,.1,5.31,v+.70,.84],'#b8a080','wood');
    add('선반 하부 손잡이 '+i,[5.25,v+.32,.51,5.28,v+.35,.70],'#c4ccca','metal');
    for(let j=0;j<3;j++){
      const z=.90+j*.425;
      add('정리 바구니 '+i+' '+j,[5.34,v+.07,z,5.71,v+.57,z+.23],['#d9dcd2','#d7bd59','#b5c6b6','#d5a8ab'][(i+j)%4]);
      for(let k=0;k<4;k++)add('바구니 구멍 '+i+' '+j+' '+k,[5.331,v+.11+k*.10,z+.06,5.338,v+.16+k*.10,z+.10],'#8c968b');
    }
  }
  add('창가 흰 수납장',[5.27,5.08,.02,5.86,6.73,2.52],'#e3e4dc','paint',true);
  for(const v of [5.5,5.9,6.3])add('흰 수납장 문 경계 '+v,[5.255,v,.07,5.274,v+.014,2.48],'#afb7ae');
  add('창가 회색 가림막',[4.80,4.92,.02,4.88,6.53,1.84],'#b7bcb7','paint',true);
  add('가림막 상부 유리',[4.80,4.95,1.44,4.88,6.5,1.80],'#718987','glass');
  add('가림막 짧은 면',[4.87,4.92,.02,5.82,5.0,1.84],'#c1c7bf','paint',true);
  add('접이 의자 보관',[4.99,4.48,.05,5.18,4.81,.96],'#384d43','paint',true);
  add('접이 의자 노란 테두리',[4.965,4.47,.08,4.99,4.82,.92],'#b8a53d');
  // TV on its own wheeled stand, facing the table, not a classroom corner TV.
  add('이동식 TV 테두리',[3.73,.50,1.07,5.06,.60,1.89],'#b2bab4','metal');
  add('이동식 TV 화면',[3.77,.606,1.11,5.02,.612,1.85],'#182123','glass');
  add('이동식 TV 기둥',[4.35,.51,.16,4.43,.59,1.11],'#313637','metal',true);
  add('이동식 TV 받침',[3.95,.32,.1,4.83,.88,.16],'#343a38','metal',true);
  for(const x of [3.99,4.71])for(const v of [.38,.78])add('TV 바퀴 '+x+' '+v,[x,v,.015,x+.09,v+.08,.105],'#242b2a','rubber_mat',false,'sphere');
  // Window roller blinds, upper halves only; lower glass still looks outdoors.
  for(const x of [.23,3.15])for(let i=0;i<6;i++)add('창 블라인드 '+x+' '+i,[x,6.82,1.62+i*.11,x+2.55,6.85,1.68+i*.11],'#d0cfb6');
  for(const [x,v] of [[.48,6.53],[2.02,6.52],[4.23,6.55]]){
    add('창가 화분 '+x,[x-.13,v-.13,.01,x+.13,v+.13,.34],'#d8d6c2','ceramic',true);
    add('화분 줄기 '+x,[x-.017,v-.017,.29,x+.017,v+.017,.95],'#6c7550','wood');
    for(let i=0;i<4;i++)add('초록 잎 '+x+' '+i,[x-.25+(i%2)*.16,v-.20,.54+i*.12,x+.13+(i%2)*.16,v+.20,.74+i*.12],'#64835a','foliage',false,'sphere');
  }
  for(const x of [1.65,4.25])for(const v of [2.0,4.7])add('천장 조명 '+x+' '+v,[x-.55,v-.18,3.035,x+.55,v+.18,3.07],'#eef1e6','lamp');
  add('천장 에어컨',[2.48,3.0,2.93,3.48,4.0,3.08],'#dddeda');
  add('에어컨 흡입구',[2.66,3.18,2.912,3.30,3.82,2.929],'#6c7470');
  for(let i=0;i<9;i++)add('흡입구 격자 '+i,[2.67+i*.071,3.18,2.906,2.687+i*.071,3.82,2.912],'#bac2b8');
  return {roomId:MEETING_ID,room,boxes,colliders,chairs,spawn:{x:39.1,y:-.75,z:3.4},reference:MEETING_REFERENCE};
}
