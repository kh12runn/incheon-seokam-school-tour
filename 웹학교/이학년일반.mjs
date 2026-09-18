// Photo-guided 2-1 only. Local u = board → rear, v = corridor → playground.
export const CLASS21_ID='4F_2-1';
export const COMPUTER_GATE={y:-67.5,left:100.27,right:102.73,base:10.2,height:2.32};
export function class21Interior(data){
  const room=data.rooms.find(r=>r.id===CLASS21_ID);if(!room)return null;
  const [x0,x1,y0,y1,z]=room.bounds,boxes=[],colliders=[],desks=[],chairs=[];
  const point=(u,v,h=0)=>({x:x1-v,y:y1-u,z:z+h});
  const color=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  function box(name,u0,u1,v0,v1,h0,h1,hex,material='paint',solid=false){
    const a=point(u1,v1,h0),b=point(u0,v0,h1);
    const item={name:'2-1 사진 '+name,bounds:[a.x,a.y,a.z,b.x,b.y,b.z],color:color(hex),material,floor:4,kind:'detail',spaceId:room.id,interiorRoom:room.id};
    boxes.push(item);if(solid)colliders.push({...item,kind:'wall'});return item;
  }
  const door=(y1-y0)*.65;
  // Do not change the existing door/wall topology or adjoining classrooms.
  box('밝은 타일 바닥',.1,6.65,.1,7.9,.003,.008,'#c9c7b9','restroom_floor');
  box('흰 천장',.1,6.65,.1,7.9,3.115,3.13,'#e4e3da').kind='ceiling';
  for(const [a,b] of [[.1,.14],[6.61,6.65]]){
    box('앞뒤 연녹색 하부 '+a,a,b,.1,7.9,.08,1.06,'#b8c1b4');
    box('앞뒤 흰 상부 '+a,a,b,.1,7.9,1.06,3.1,'#e8e7df');
    box('검정 걸레받이 '+a,a,b,.1,7.9,.01,.10,'#242925');
  }
  for(const [a,b] of [[.12,door-.63],[door+.63,6.63]]){
    box('복도 하부 '+a,a,b,.11,.15,.1,1.07,'#b8c1b4');
    box('복도 창틀 '+a,a+.12,b-.12,.15,.18,1.12,2.86,'#e7e7df');
    box('복도 반투명 창 '+a,a+.18,b-.18,.181,.187,1.18,2.8,'#c4d1cf','glass');
    for(let u=a+.12;u<b-.12;u+=.75)box('복도 세로틀 '+u,u,u+.04,.19,.22,1.12,2.86,'#f1eee5');
    box('복도 가로틀 '+a,a+.12,b-.12,.19,.22,2.25,2.30,'#f1eee5');
  }
  for(const u of [door-.63,door+.59])box('살구색 문틀 '+u,u,u+.045,.1,.2,0,2.35,'#dba58a');
  box('살구색 문 상부',door-.63,door+.63,.1,.2,2.28,2.35,'#dba58a');
  // Match existing exterior openings with red metal frames, blinds and rails.
  for(const center of [1.125,3.375,5.625]){
    const a=center-1,b=center+1;
    for(const u of [a,center,b-.045])box('붉은 창 세로틀 '+u,u,u+.045,7.78,7.9,.975,2.325,'#a44432','metal');
    for(const h of [.975,1.56,2.28])box('붉은 창 가로틀 '+center+' '+h,a,b,7.78,7.9,h,h+.06,'#a44432','metal');
    box('흰 롤블라인드 '+center,a+.05,b-.05,7.755,7.77,1.72,2.78,'#e5e4d8');
    box('창 안전봉 '+center,a,b,7.67,7.70,1.24,1.28,'#b2b8b5','metal');
  }
  box('칠판 틀',.15,.21,1.22,7.25,.98,2.45,'#b8b9a9','metal');
  box('칠판',.211,.226,1.27,7.20,1.03,2.40,'#253c39');
  box('중앙 화이트보드',.23,.245,2.50,5.70,1.05,2.38,'#f2f1eb');
  box('칠판 받침',.22,.35,1.22,7.25,.94,.98,'#b2b5ad','metal');
  box('뒤 게시판 틀',6.54,6.61,.52,7.48,1.33,2.78,'#b4b29a','metal');
  for(let col=0;col<10;col++)for(let row=0;row<3;row++){
    const v=.55+col*.688,h=.10+row*.38;
    box(`사물함 ${col}-${row}`,6.14,6.59,v,v+.67,h,h+.36,row===1?'#9cbd60':'#c6a577',row===1?'paint':'wood');
    box(`사물함 손잡이 ${col}-${row}`,6.12,6.14,v+.055,v+.11,h+.19,h+.25,'#9ba4a4','metal');
  }
  box('사물함 충돌',6.14,6.59,.55,7.42,0,1.24,'#c6a577','wood',true);
  // Solid backing above is hidden inside the individual door bank.
  boxes.pop();
  for(const u of [.95,5.17]){
    box('낮은 책장 뒤 '+u,u,u+1.0,.16,.19,.05,.98,'#b49368','wood');
    for(const h of [.06,.35,.66,.97])box('책장 선반 '+u+' '+h,u,u+1,.16,.58,h,h+.025,'#c1a378','wood');
    for(let c=0;c<4;c++)box('책장 칸 '+u+' '+c,u+c*.33,u+c*.33+.025,.16,.58,.06,.99,'#c1a378','wood');
    for(let n=0;n<12;n++)box('책 '+u+' '+n,u+.04+n*.075,u+.08+n*.075,.25,.52,.37,.57+n%3*.025,['#e3d5a5','#7096a7','#81986f','#d69887'][n%4]);
    for(const h of [.12,.71])box('노란 교구 바구니 '+u+' '+h,u+.1,u+.5,.28,.55,h,h+.15,'#ddc33b');
    colliders.push({name:'2-1 책장 충돌 '+u,bounds:boxBounds(u,u+1,.16,.58,0,1),kind:'wall',floor:4});
  }
  function boxBounds(a,b,c,d,e,f){const p=point(b,d,e),q=point(a,c,f);return[p.x,p.y,p.z,q.x,q.y,q.z];}
  box('높은 청소함',2.13,2.71,.18,.67,0,1.92,'#bc996e','wood',true);
  box('낮은 청소함',2.75,3.28,.18,.63,0,1.08,'#bc996e','wood',true);
  for(let i=0;i<3;i++)box('청소도구 '+i,2.8+i*.12,2.83+i*.12,.35,.38,.2,1.72,'#959fa0','metal');
  // Equal centre spacing: 1.10 m front/back and 1.32 m across, 4 x 5 seats.
  // The entrance connects to the corridor-side aisle, then the front aisle.
  const seatRows=Array.from({length:4},(_,i)=>1.9+i*1.10);
  const seatColumns=Array.from({length:5},(_,i)=>1.65+i*1.32);
  for(const u of seatRows)for(const v of seatColumns){
    const id=desks.length;
    box('책상 테두리 '+id,u-.25,u+.25,v-.36,v+.36,.65,.70,'#242c31');
    box('책상 상판 '+id,u-.235,u+.235,v-.345,v+.345,.701,.72,'#cdbb98','wood');
    for(const a of [-.19,.19])for(const b of [-.28,.28])box('책상 다리 '+id+a+b,u+a-.015,u+a+.015,v+b-.018,v+b+.018,.03,.66,'#c6cdcb','metal');
    const chair=u+.43;
    box('남색 의자 좌판 '+id,chair-.16,chair+.17,v-.23,v+.23,.36,.405,'#26394c');
    box('남색 의자 등받이 '+id,chair+.12,chair+.16,v-.23,v+.23,.46,.76,'#26394c');
    for(const b of [-.18,.18])box('의자 다리 '+id+b,chair-.12,chair+.16,v+b-.018,v+b+.018,.02,.36,'#bec8c7','metal');
    const deskBounds=boxBounds(u-.25,u+.25,v-.36,v+.36,0,.72),chairBounds=boxBounds(chair-.16,chair+.17,v-.23,v+.23,0,.76);
    colliders.push({name:'2-1 책상 충돌 '+id,bounds:deskBounds},{name:'2-1 의자 충돌 '+id,bounds:chairBounds});
    desks.push({bounds:deskBounds});chairs.push({bounds:chairBounds});
  }
  box('교탁 수납장',.47,1.21,5.15,6.92,0,.83,'#b5976d','wood',true);
  box('교탁 검정 상판',.45,1.23,5.12,6.95,.83,.87,'#30332f');
  for(const v of [5.56,6.32]){
    box('듀얼 화면 외함 '+v,.88,.96,v-.32,v+.32,1.02,1.42,v<6?'#d2d2c5':'#272c2c');
    box('듀얼 화면 칠판방향 '+v,.87,.88,v-.28,v+.28,1.06,1.38,'#172126');
    box('화면 받침 '+v,.85,1.0,v-.08,v+.08,.87,1.06,'#6d7778','metal');
  }
  box('이동식 강연대',.64,.91,3.85,4.46,.18,1.10,'#b9bcb1','metal',true);
  box('강연대 검정 상판',.6,.96,3.78,4.52,1.1,1.14,'#333939');
  for(const v of [3.8,4.46])for(const u of [.64,.91])box('강연대 바퀴 '+u+v,u-.045,u+.045,v-.04,v+.04,.03,.13,'#303638');
  for(const u of [1.4,3.4,5.4])for(const v of [2.4,5.6])box('천장 LED '+u+v,u-.36,u+.36,v-.19,v+.19,3.04,3.08,'#f1f4eb','lamp');
  box('천장 냉난방기',3,3.8,3.5,4.5,2.99,3.1,'#d3d5cb');
  for(const collider of colliders)Object.assign(collider,{spaceId:room.id,interiorRoom:room.id,floor:4,kind:'furniture'});
  const spawn=point(door,1.0),entryWaypoints=[point(door,1.0)];
  const aisleRoute=[spawn,point(1.32,1.0),point(1.32,2.31),point(door,2.31)];
  return {roomId:room.id,room,boxes,colliders,desks,chairs,point,spawn,entryWaypoints,aisleRoute,seatRows,seatColumns,yaw:Math.PI/2,
    photoCount:9,seatCount:desks.length,seatCountIsApproximate:true,door};
}

// Photo shows a corridor-end computer entrance. Keep the map's existing room
// positions: decorate its actual side entrance plus the adjacent end wall.
export function computerEntranceFinish(addBox){
  const z=10.2,door=-73+6.75*.35;
  function add(name,b,hex,solid=false){const o=addBox('컴퓨터실 입구 사진 '+name,b,[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),solid?'wall':'detail',4);o.material='paint';}
  for(const y of [door-.73,door+.63])add('노란 문틀 '+y,[100.21,y,z,100.27,y+.10,z+2.48],'#c9c131');
  add('노란 문 상부',[100.21,door-.73,z+2.34,100.27,door+.73,z+2.57],'#c9c131');
  for(const x of [100.23,102.74])add('끝벽 청록 테두리 '+x,[x,-72.79,z+.95,x+.055,-72.73,z+2.92],'#348b9a');
  add('끝벽 청록 상단',[100.23,-72.79,z+2.86,102.79,-72.73,z+2.92],'#348b9a');
  // Board stands against the end wall, clear of both doorway and corridor aisle.
  add('안내 입간판',[102.18,-72.38,z+.04,102.76,-72.28,z+1.84],'#c9ba87',true);
  // Fully open glass double doors: a real solid frame with a clear central path.
  const g=COMPUTER_GATE;
  for(const x of [g.left,g.right-.055])add('유리문 문기둥 '+x,[x,g.y-.055,z,x+.055,g.y+.055,z+g.height],'#b0b8b6',true);
  add('유리문 상부 프레임',[g.left,g.y-.055,z+g.height,g.right,g.y+.055,z+g.height+.075],'#b0b8b6',true);
  for(const [side,x] of [['왼쪽',g.left+.07],['오른쪽',g.right-.07]]){
    const leafY=g.y+1.07;
    for(const h of [.08,g.height-.1])add('열린 유리문 '+side+' 가로틀 '+h,[x-.025,g.y,z+h,x+.025,leafY,z+h+.04],'#afb7b5',true);
    for(const y of [g.y,leafY-.04])add('열린 유리문 '+side+' 세로틀 '+y,[x-.025,y,z+.08,x+.025,y+.04,z+g.height-.06],'#afb7b5',true);
    const glass=addBox('컴퓨터실 입구 사진 열린 유리문 '+side+' 투명 유리',[x-.012,g.y+.04,z+.12,x+.012,leafY-.04,z+g.height-.1],[.85,.94,.94],'wall',4);glass.material='clear_glass';
    add('유리문 '+side+' 나무 손잡이',[x-.06,leafY-.19,z+.85,x+.06,leafY-.14,z+1.34],'#ad7640',true);
  }
}
