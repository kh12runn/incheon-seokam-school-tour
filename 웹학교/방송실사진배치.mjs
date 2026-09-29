import {openClassroomWindows} from './창문배치.mjs';
export const BROADCAST_ID='2F_BROADCAST';
export const BROADCAST_REFERENCE={count:6,approvedAt:'2026-09-29T04:02:29.803Z',reviewedAt:'2026-09-29',
  imageIds:['db3634be-c4f9-4b8e-86ec-d8c08b4e7c0a','9a0c35ce-5207-4453-82a5-49ef8879c426','6db06b1b-d37f-401d-8d0b-07edf68e5179','cedab417-c796-4f69-8df8-636f05eab372','2ed0d443-8907-40ce-87a3-aa07ff645109','21e2bcca-2b4b-4c9d-9413-99876ac73faa'],
  approximateDimensions:true,orientationInferred:true,features:['밝은 목재 타공 흡음벽','회색 카펫','원형 탁자와 적색·검정 의자','회색 방송 책상과 마이크','하늘색 방송 배경','천장 TV','연두색 블라인드','긴 쿠션 벤치','수납장·방송 장비']};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function broadcastRoomInterior(data,worldBoxes,worldColliders,addBox){
  const room=data.rooms.find(r=>r.id===BROADCAST_ID);if(!room)return null;
  openClassroomWindows({...data,rooms:[{...room,type:'classroom'}],boxes:data.boxes.filter(b=>b.spaceId===BROADCAST_ID)},worldBoxes,worldColliders,addBox);
  const boxes=[],colliders=[],chairs=[];
  // Local x=0..8 from west; v=0..7 from corridor toward the courtyard window.
  const bounds=b=>[56+b[0],-b[4],3.4+b[2],56+b[3],-b[1],3.4+b[5]];
  const solid=(name,b)=>colliders.push({name:'방송실 '+name,spaceId:BROADCAST_ID,kind:'furniture',floor:2,bounds:bounds(b)});
  const add=(name,b,color,material='paint',collision=false)=>{
    const item={name:'방송실 사진참고 '+name,spaceId:BROADCAST_ID,interiorRoom:BROADCAST_ID,floor:2,kind:'detail',bounds:bounds(b),color:rgb(color),material};
    boxes.push(item);if(collision)solid(name,b);return item;
  };
  add('회색 카펫',[.10,.10,.001,7.90,6.90,.007],'#858488','carpet');
  add('흰 흡음 천장',[.10,.10,3.10,7.90,6.90,3.12],'#deded7').kind='ceiling';
  for(const x of [.105,7.865]){
    add('목재 흡음벽 '+x,[x,.12,.03,x+.03,6.88,3.08],'#bdab8d','acoustic_wood');
    add('벽 중간 몰딩 '+x,[x-.01,.12,.87,x+.04,6.88,.91],'#cbbda1','wood');
    add('걸레받이 '+x,[x-.012,.12,.02,x+.045,6.88,.10],'#827b6d','wood');
    for(let v=.2;v<6.8;v+=1.12)add('벽 세로 이음 '+x+' '+v,[x-.003,v,.10,x+.034,v+.012,3.07],'#a2957d');
  }
  // Preserve the actual 1.2m corridor door x=58.2..59.4; no furniture in its lane.
  for(const [a,b] of [[.12,2.17],[3.43,7.88]])add('입구 벽',[a,.105,.03,b,.14,3.08],'#b6a58b','acoustic_wood');
  add('입구 상부 벽',[2.17,.105,2.27,3.43,.14,3.08],'#b6a58b','acoustic_wood');
  add('창 아래 벽',[.12,6.86,.03,7.88,6.89,.95],'#b6a58b','acoustic_wood');
  add('창 위 벽',[.12,6.86,2.37,7.88,6.89,3.08],'#b6a58b','acoustic_wood');
  for(const x of [.20,2.82,5.43]){
    add('창 롤블라인드 '+x,[x,6.78,2.03,x+2.33,6.82,2.39],'#d6d5be');
    add('블라인드 상단 '+x,[x,6.76,2.36,x+2.33,6.84,2.42],'#c8c6b3');
  }
  // Pale green interior blinds and upholstered bench along the studio side wall.
  for(let i=0;i<2;i++){
    const v=2.32+i*1.48;
    add('연두색 벽 블라인드 '+i,[.151,v,1.07,.182,v+1.45,2.46],'#c5d2be');
    add('블라인드 아래 봉 '+i,[.16,v,1.055,.195,v+1.45,1.08],'#acb6a6','metal');
  }
  add('벤치 쿠션',[.30,2.53,.44,.83,4.48,.53],'#c2c5be','fabric',true);
  add('벤치 목재 받침',[.33,2.57,.38,.80,4.44,.44],'#b1a181','wood');
  for(const x of [.37,.73])for(const v of [2.67,4.31])add('벤치 다리 '+x+' '+v,[x,v,.02,x+.045,v+.06,.4],'#a99575','wood');
  add('회색 수납장',[.24,5.82,.02,.91,6.46,1.12],'#afb1a3','paint',true);
  add('수납장 문 틈',[.915,6.13,.08,.922,6.145,1.08],'#7e857a');
  for(const v of [6.07,6.20])add('수납장 손잡이 '+v,[.93,v,.68,.97,v+.023,.85],'#c5ccbf','metal');
  add('흰 서랍장',[.24,5.08,.02,.82,5.70,.89],'#d5d9d0','paint',true);
  for(let i=0;i<3;i++){
    add('서랍 앞판 '+i,[.825,5.11,.07+i*.27,.848,5.67,.31+i*.27],'#e0e1d8');
    add('서랍 손잡이 '+i,[.852,5.30,.22+i*.27,.89,5.49,.24+i*.27],'#a8b1a6');
  }
  for(let i=0;i<8;i++)add('쌓인 책 '+i,[.27,5.88,1.13+i*.022,.80,6.31,1.147+i*.022],['#809f93','#c6af7a','#b8958d','#c9caba'][i%4]);
  add('노란 정리함',[.30,5.15,.90,.74,5.59,1.04],'#c4b64e');
  add('이동 방송 장비',[.35,4.59,.02,.91,4.96,.65],'#292f30','paint',true);
  for(let i=0;i<4;i++)add('장비 전면 패널 '+i,[.918,4.62,.09+i*.12,.927,4.93,.18+i*.12],'#3a4242','metal');
  for(const v of [4.64,4.91])add('장비 손잡이 '+v,[.64,v,.64,.67,v+.026,1.02],'#31393a','metal');
  add('장비 손잡이 가로',[.64,4.64,1.0,.67,4.94,1.03],'#31393a','metal');
  // Broadcasting desk faces into the room from the corridor-side end.
  add('방송 책상 몸체',[4.14,.71,.04,6.32,1.44,.80],'#788b94','paint',true);
  add('방송 책상 상판',[4.10,.67,.80,6.36,1.49,.86],'#454e50','paint',true);
  add('방송 책상 앞 흰 패널',[4.44,1.445,.24,6.03,1.465,.71],'#dad8bf');
  add('방송 책상 뒤 가림막',[4.16,.67,.86,6.30,.72,.97],'#bebdb2');
  add('방송 배경 목재 틀',[3.77,.17,.94,6.74,.23,2.65],'#9f947c','wood');
  // Round table: conservative circle slices, not a large invisible square.
  const table={x:60.35,y:-4.70,z:3.4,radius:1.10};
  for(let i=0;i<12;i++){
    const lo=-1.1+i*2.2/12,hi=lo+2.2/12,near=Math.min(Math.abs(lo),Math.abs(hi)),half=Math.sqrt(1.21-near*near);
    solid('원탁 충돌 '+i,[4.35-half,4.70+lo,0,4.35+half,4.70+hi,.80]);
  }
  for(let i=0;i<6;i++){
    const angle=i*Math.PI/3,x=4.35+Math.sin(angle)*1.50,v=4.70+Math.cos(angle)*1.50;
    chairs.push({x:56+x,y:-v,z:3.4,angle,color:i===0||i===3?'#41464a':'#9e5264'});
    solid('의자 충돌 '+i,[x-.32,v-.32,0,x+.32,v+.32,.94]);
  }
  // Transparent lectern and two flag stands are fixed solids below waist height.
  solid('투명 연단',[7.10,.51,0,7.65,1.08,1.23]);
  for(const x of [3.73,6.84])solid('깃대 받침 '+x,[x-.18,.34,0,x+.18,.70,.12]);
  add('천장 TV 봉',[1.57,5.75,2.49,1.61,5.79,3.09],'#262e30','metal');
  add('천장 TV',[.95,5.72,1.88,2.24,5.82,2.61],'#232c2e');
  add('TV 검정 화면',[.98,5.709,1.91,2.21,5.719,2.58],'#172125','glass');
  for(const x of [2.20,6.10])for(const v of [1.5,3.6,5.8])add('긴 천장등 '+x+' '+v,[x-.54,v-.14,3.04,x+.54,v+.14,3.07],'#f2f0e2','lamp');
  add('천장 에어컨',[3.70,3.01,2.91,4.75,4.06,3.08],'#dadcd4');
  add('에어컨 흡입부',[3.91,3.22,2.896,4.54,3.85,2.914],'#687673');
  for(let i=0;i<9;i++){
    add('에어컨 격자 '+i,[3.92+i*.067,3.22,2.888,3.933+i*.067,3.85,2.897],'#cbd0c3');
    add('에어컨 가로격자 '+i,[3.92,3.22+i*.067,2.888,4.54,3.232+i*.067,2.897],'#cbd0c3');
  }
  add('방송 조명 레일',[3.60,1.88,3.01,6.95,1.91,3.055],'#b5bab1','metal');
  for(const x of [3.95,5.25,6.55]){
    add('방송 조명 '+x,[x-.12,1.78,2.84,x+.12,2.01,2.96],'#dedfd4');
    add('방송 조명 렌즈 '+x,[x-.10,1.779,2.86,x+.10,1.784,2.94],'#f2eedb','lamp');
  }
  return {roomId:BROADCAST_ID,room,boxes,colliders,chairs,table,spawn:{x:58.8,y:-.70,z:3.4},entryYaw:Math.PI,reference:BROADCAST_REFERENCE};
}
