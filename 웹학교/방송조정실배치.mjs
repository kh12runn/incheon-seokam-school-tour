// The upload folder was mislabeled. The owner confirmed these six photos are
// the control room beside the broadcast studio, NOT 2F_KOREAN_CLASS.
export const CONTROL_REFERENCE={count:6,sourceRoomId:'2F_KOREAN_CLASS',targetRoomId:'2F_BROADCAST',
  revision:'a9a4aed4-8ea4-4ca7-8709-03288d112128',ownerConfirmed:true,reviewedAt:'2026-09-30',
  imageIds:['0334f433-3eab-4ad7-a65f-76f801f66ea3','ace62807-bcd2-487b-bc08-051a80d73853','92bc111c-98a1-4583-9599-fa8b787182b9','38e060d4-e139-4c67-bd48-1cc52434b2f9','3e8c4796-5e8c-4b83-a483-00b69d5609ca','b949b5f3-9a48-4137-901d-e7ee822554c3'],
  approximateDimensions:true,orientationInferred:true,
  features:['회색 흡음벽과 흰 줄눈','긴 갈색 회의탁자','붉은 패브릭 의자','모니터 3대','음향 믹서','유리문 장비함','스튜디오 연결 관찰창','화이트보드','목재 책장']};
export const studioX=x=>60.30+(x-56)*.45;
export function addBroadcastControl(config){
  if(!config)return config;
  const {roomId}=config;
  const transform=b=>({...b,bounds:[studioX(b.bounds[0]),b.bounds[1],b.bounds[2],studioX(b.bounds[3]),b.bounds[4],b.bounds[5]]});
  // Keep the original room envelope/doors. Only furniture and decorative lining
  // move into the east half; no neighbouring classroom or Korean room is moved.
  const remove=b=>['목재 흡음벽 0.105','벽 중간 몰딩 0.105','걸레받이 0.105','벽 세로 이음 0.105','연두색 벽 블라인드','블라인드 아래 봉','벤치','원탁 충돌','의자 충돌'].some(s=>b.name.includes(s));
  config.boxes=config.boxes.filter(b=>!remove(b)).map(transform);
  config.colliders=config.colliders.filter(b=>!remove(b)).map(transform);
  config.studioTransform={scaleX:.45,originX:60.30};
  config.table={x:62.10,y:-4.70,z:3.4,radius:.62};
  config.chairs=Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return {x:62.10+Math.sin(a)*.94,y:-4.70-Math.cos(a)*.94,z:3.4,angle:a,color:i%3===0?'#41464a':'#9e5264'};});
  const boxes=config.boxes,colliders=config.colliders;
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
  // Bounds use local x from 56, v toward the courtyard, height from floor 2.
  const bounds=b=>[56+b[0],-b[4],3.4+b[2],56+b[3],-b[1],3.4+b[5]];
  const solid=(name,b)=>colliders.push({name:'방송 조정실 '+name,spaceId:roomId,kind:'furniture',floor:2,bounds:bounds(b)});
  const add=(name,b,color,material='paint',collision=false)=>{const item={name:'방송 조정실 '+name,spaceId:roomId,interiorRoom:roomId,floor:2,kind:'detail',bounds:bounds(b),color:rgb(color),material};boxes.push(item);if(collision)solid(name,b);return item;};
  for(let i=0;i<12;i++){
    const lo=-.62+i*1.24/12,hi=lo+1.24/12,half=Math.sqrt(.62**2-Math.min(Math.abs(lo),Math.abs(hi))**2);
    solid('스튜디오 원탁 '+i,[6.10-half,4.7+lo,0,6.10+half,4.7+hi,.8]);
  }
  for(const [i,c] of config.chairs.entries())solid('스튜디오 의자 '+i,[c.x-56-.29,-c.y-.29,0,c.x-56+.29,-c.y+.29,.94]);
  add('회색 타일 바닥',[.10,.10,.001,4.27,6.90,.008],'#a1a5a4','control_tile');
  add('흰 흡음 천장',[.10,.10,3.10,4.27,6.90,3.12],'#dddeda').kind='ceiling';
  add('바깥쪽 회색 흡음벽',[.105,.12,.02,.14,6.88,3.08],'#979d9d','fabric');
  for(const [a,b] of [[.12,2.17],[3.43,4.28]])add('입구 회색 흡음벽',[a,.105,.03,b,.14,3.08],'#979d9d','fabric');
  add('입구 문 위 흡음벽',[2.17,.105,2.27,3.43,.14,3.08],'#979d9d','fabric');
  add('창 밑 회색 흡음벽',[.12,6.86,.03,4.28,6.89,.95],'#979d9d','fabric');
  add('창 위 회색 흡음벽',[.12,6.86,2.37,4.28,6.89,3.08],'#979d9d','fabric');
  for(const z of [.12,1.05,2.12,3.03])add('흡음벽 가로 줄눈 '+z,[.143,.12,z,.157,6.88,z+.018],'#d6dbd6');
  for(let v=.65;v<6.8;v+=1.1)add('흡음벽 세로 줄눈 '+v,[.143,v,.12,.157,v+.018,3.03],'#d6dbd6');
  add('검정 걸레받이',[.14,.12,.02,.17,6.88,.09],'#3b4546');
  // A real transparent observation window, with a separate open doorway at
  // the corridor end. Glass blocks people, but reveals the rendered studio.
  for(const [a,b] of [[.10,.40],[1.65,2.10],[5.65,6.9]])add('공유 흡음벽',[4.26,a,0,4.36,b,3.10],'#969d9b','fabric',true);
  add('연결문 상인방',[4.26,.40,2.35,4.36,1.65,3.10],'#b8c0b8','paint',true);
  add('관찰창 아래 벽',[4.26,2.10,0,4.36,5.65,.97],'#979d9d','fabric',true);
  add('관찰창 위 벽',[4.26,2.10,2.45,4.36,5.65,3.1],'#979d9d','fabric',true);
  add('스튜디오 투명 관찰 유리',[4.305,2.10,.97,4.32,5.65,2.45],'#d7e8df','clear_glass',true);
  for(const z of [.97,2.42])add('관찰창 가로 프레임 '+z,[4.22,2.08,z,4.40,5.67,z+.035],'#bdc6bd','metal');
  for(const v of [2.08,3.86,5.64])add('관찰창 세로 프레임 '+v,[4.22,v,.97,4.40,v+.035,2.45],'#bdc6bd','metal');
  add('관찰창 걷어 올린 연두 블라인드',[4.23,2.14,2.18,4.25,5.62,2.42],'#c0cdb4');
  for(const v of [.39,1.64])add('연결문 목재 문틀 '+v,[4.22,v,0,4.40,v+.055,2.36],'#bba591','wood');
  add('연결문 윗 문틀',[4.22,.39,2.32,4.40,1.695,2.38],'#bba591','wood');
  // Equipment faces the tables; screens face west, not into the studio glass.
  add('긴 음향 조정 책상',[3.45,2.2,.75,4.20,5.46,.81],'#929fa1','paint',true);
  for(const v of [2.26,3.78,5.31])add('조정 책상 받침 '+v,[3.54,v,.02,4.10,v+.10,.75],'#b4bcbb','metal');
  for(const v of [2.42,3.35,4.54]){
    add('검정 본체 '+v,[3.72,v,.07,4.08,v+.37,.66],'#242d30','paint',true);
    add('본체 전면 '+v,[3.709,v+.03,.10,3.72,v+.34,.61],'#333e42');
    add('모니터 '+v,[3.86,v,.98,3.94,v+.63,1.39],'#242c2e');
    add('모니터 화면 '+v,[3.849,v+.023,1.004,3.859,v+.607,1.364],'#13212a','glass');
    add('모니터 받침 '+v,[3.66,v+.20,.817,4.05,v+.43,.845],'#252f33');
    add('모니터 기둥 '+v,[3.88,v+.28,.84,3.93,v+.35,1.03],'#252f33');
  }
  add('키보드',[3.48,2.44,.815,3.69,3.09,.84],'#2f393d');
  add('대형 음향 믹서',[3.42,3.46,.81,3.85,4.48,.91],'#303a3c');
  add('보조 제어기',[3.46,4.77,.81,3.77,5.34,.90],'#414f54');
  for(let v=0;v<14;v++){
    add('믹서 채널 홈 '+v,[3.48,3.5+v*.064,.912,3.65,3.51+v*.064,.917],'#9ba5a0');
    add('믹서 페이더 '+v,[3.50+(v%3)*.025,3.485+v*.064,.919,3.525+(v%3)*.025,3.519+v*.064,.936],'#d0cec0');
    for(let k=0;k<4;k++)add('믹서 노브 '+v+' '+k,[3.70+k*.029,3.494+v*.064,.918,3.721+k*.029,3.516+v*.064,.94],['#62696b','#98a091','#65858f','#9c7972'][k]);
  }
  // Long joined brown tables with eight burgundy chairs, leaving a continuous
  // equipment-side aisle and clear cross-aisles at both ends.
  for(const [i,a] of [2.35,4.08].entries()){
    add('긴 회의탁자 상판 '+i,[.90,a,.73,2.08,a+1.69,.79],'#795539','control_wood',true);
    add('회의탁자 중앙 가림판 '+i,[1.43,a+.14,.15,1.49,a+1.55,.72],'#917353','wood');
    for(const x of [.99,1.96])for(const v of [a+.10,a+1.57])add('탁자 다리 '+i+' '+x+' '+v,[x,v,.02,x+.065,v+.065,.73],'#756451','wood');
  }
  const chairs=[];
  for(const [i,v] of [2.60,3.52,4.44,5.36].entries())for(const x of [.53,2.45]){
    chairs.push({x:56+x,y:-v,z:3.4,angle:x<1?-Math.PI/2:Math.PI/2,color:'#984a5d'});
    solid('회의 의자 '+i+' '+x,[x-.25,v-.26,0,x+.25,v+.26,.95]);
  }
  solid('유리 장비함',[3.48,5.78,.02,4.13,6.75,2.03]);
  add('유리 장비함 등판',[4.08,5.79,.02,4.13,6.72,2.02],'#7f9197','paint');
  for(const v of [5.79,6.69])add('장비함 측판 '+v,[3.51,v,.02,4.13,v+.03,2.02],'#7f9197','paint');
  for(const z of [.02,2])add('장비함 수평판 '+z,[3.51,5.79,z,4.13,6.72,z+.025],'#7f9197','metal');
  // Front is inset so individual rack units are visible behind actual glass.
  add('장비함 전면 유리',[3.493,5.81,.12,3.505,6.70,1.96],'#bbd0cf','clear_glass');
  for(let i=0;i<12;i++){
    add('랙 패널 '+i,[3.52,5.84,.17+i*.138,3.55,6.67,.27+i*.138],'#293840','metal');
    for(let j=0;j<6;j++)add('랙 표시등 '+i+' '+j,[3.511,5.95+j*.09,.21+i*.138,3.519,5.98+j*.09,.222+i*.138],j%3===0?'#c9c35c':'#96b79b');
  }
  for(const v of [5.78,6.25,6.70])add('장비함 금속 테두리 '+v,[3.48,v,.06,3.53,v+.035,2.03],'#a7b7b8','metal');
  add('목재 수납장',[3.69,.21,.02,4.18,.85,2.19],'#b09c7b','wood',true);
  add('열린 목재 책장 등판',[4.10,.88,.02,4.17,1.88,2.19],'#aa9675','wood',true);
  for(const v of [.88,1.85])add('책장 측판 '+v,[3.68,v,.02,4.17,v+.035,2.19],'#aa9675','wood',true);
  for(let i=0;i<5;i++){
    add('책장 선반 '+i,[3.68,.88,.06+i*.50,4.17,1.88,.09+i*.50],'#b7a27e','wood');
    for(let j=0;j<9;j++)add('책 '+i+' '+j,[3.75,1.0+j*.079,.10+i*.5,4.08,1.047+j*.079,.37+i*.5+(j%3)*.04],['#a7b6a0','#788f9c','#b29e88','#cdcbb9'][j%4]);
  }
  add('화이트보드 은색 테두리',[.17,2.14,1.07,.21,5.28,2.30],'#c1cccb','metal');
  add('화이트보드',[.212,2.19,1.12,.226,5.23,2.25],'#e8eddf');
  add('입구 보드 틀',[.26,.15,1.12,1.81,.20,2.21],'#b8c5c3','metal');
  add('입구 화이트보드',[.30,.202,1.16,1.77,.215,2.17],'#e5ebdd');
  add('입구 보조 책상',[.30,.27,.73,1.76,.76,.78],'#8c9ea3','metal',true);
  for(const x of [.36,1.64])for(const v of [.32,.65])add('보조 책상 다리 '+x+' '+v,[x,v,.02,x+.055,v+.055,.73],'#96a3a3','metal');
  add('노란 필기구 바구니',[.47,.41,.79,.78,.62,.90],'#c6b24e');
  for(const x of [.20,2.23])add('흰 롤블라인드 '+x,[x,6.78,1.78,x+1.85,6.82,2.39],'#d2d6c7');
  for(const v of [1.4,3.5,5.8])add('조정실 천장등 '+v,[1.03,v,3.04,3.25,v+.16,3.08],'#f0efe0','lamp');
  add('조정실 에어컨',[1.61,3.34,2.91,2.64,4.35,3.07],'#d8dcd4');
  add('조정실 에어컨 흡입부',[1.81,3.54,2.90,2.44,4.15,2.913],'#677774');
  for(let i=0;i<8;i++)add('에어컨 격자 '+i,[1.82+i*.075,3.54,2.891,1.836+i*.075,4.15,2.902],'#c0cbc3');
  // In the approximate 8m envelope, keep storage away from the shared door.
  for(const list of [boxes,colliders])for(const item of list){
    const dx=item.name.includes('방송 조정실 목재 수납장')?-1.90:
      /^방송 조정실 (열린 목재 책장|책장 |책 )/.test(item.name)?-3.45:0;
    if(dx){item.bounds[0]+=dx;item.bounds[3]+=dx;}
  }
  config.control={reference:CONTROL_REFERENCE,chairs,window:{x:60.31,y:-3.86,z:5.0},spawn:config.spawn};
  return config;
}
