// Six phone photographs, reviewed 2026-09-14. Geometry stays on the frozen
// class 6-4 reference; only class 6-6 receives these observed-detail overrides.
export const CLASS66_ID='4F_6-6';
export const CLASS66_PROFILE={
  roomId:CLASS66_ID,referenceRoom:'4F_6-4',photoStatus:'reviewed',photoCount:6,
  theme:'즐거운 교실',motif:'곰',accent:'#8b9b88',lowerWall:'#b8c2b2',trayColor:'#dac348',
  boardLayout:0,lockerPattern:1,seatCountIsApproximate:true,
  observedFeatures:['뒤 게시판의 두 줄 곰 그림·파스텔 액자·윗부분 종이 가랜드','뒤 사물함의 분리된 배치와 돌출 수납장·밝은 매트',
    '복도 쪽 파스텔 꽃 게시판과 두 낮은 책장·접힌 매트','창가 키 큰 목재 수납장·옷걸이·세로 거울·흰 시계·부분 롤블라인드',
    '앞쪽 금속 이동 교탁·검정 모니터들·노란 수납함·흰 공기청정기','나무색 의자와 일부 연두색 의자·천장 선풍기 4대'],
};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function applyClass66Details(config){
  if(config.roomId!==CLASS66_ID)return config;
  const {frame,room}=config,boxes=config.boxes.filter(b=>!/사물함|노란 정리바구니/.test(b.name)).map(b=>{
    let hex;
    if(/의자 좌판|의자 등받이/.test(b.name))hex=[4,6,15,20].includes(Number(b.name.match(/\d+$/)?.[0]))?'#a5b936':'#ad854c';
    if(/원목 마루/.test(b.name))hex='#c4ac8b';
    if(/뒤 게시판 테두리/.test(b.name))hex='#9b9f91';
    if(/앞 안내게시판/.test(b.name))hex='#d4c96f';
    return hex?{...b,color:rgb(hex)}:b;
  }),colliders=config.colliders.filter(b=>!b.name.includes('사물함'));
  const latches=[];
  const bounds=b=>{const a=frame.point(...b.slice(0,3)),c=frame.point(...b.slice(3));return [a.x,Math.min(a.y,c.y),a.z,c.x,Math.max(a.y,c.y),c.z];};
  const add=(name,b,hex,material='paint',solid=false)=>{
    const item={name:'6-6 교실 실내 사진 '+name,spaceId:CLASS66_ID,interiorRoom:CLASS66_ID,floor:4,kind:'detail',bounds:bounds(b),color:rgb(hex),material};boxes.push(item);
    if(solid)colliders.push({...item,name:'6-6 교실 충돌 사진 '+name,kind:'furniture'});return item;
  };
  function lockerBank(name,y,count){
    const width=count*.61;
    add(name+' 몸체',[9.3,y,.03,9.84,y+width,1.12],'#928a77','wood',true);
    for(let row=0;row<3;row++)for(let col=0;col<count;col++){
      const yy=y+.02+col*.61,h=.07+row*.345;
      add(name+' 문 '+row+' '+col,[9.265,yy,h,9.302,yy+.575,h+.318],row===1?'#e1dfd5':'#c6b394','wood');
      latches.push(frame.point(9.255,yy+.12,h+.23));
    }
  }
  lockerBank('출입문 쪽 사물함',-1.94,2);lockerBank('창가 쪽 사물함',-6.42,4);
  for(const y of [-2.65,-4.13]){
    add('돌출 수납장 '+y,[9.2,y,.04,9.84,y+.43,1.13],'#c6b394','wood',true);
    add('돌출 수납장 상단 '+y,[9.18,y-.015,1.13,9.86,y+.445,1.16],'#777d75');
  }
  add('뒤쪽 밝은 매트',[9.18,-3.7,.017,9.84,-2.67,.035],'#dcded4');
  // Preserve the central aisle and all 24 reference desk/chair positions.
  add('창가 키 큰 수납장',[5.35,-6.78,.02,6.0,-6.30,1.95],'#b9a17c','wood',true);
  add('수납장 문',[5.38,-6.285,.06,5.98,-6.27,1.91],'#c6ae88','wood');
  add('수납장 손잡이',[5.88,-6.26,.85,5.91,-6.23,1.06],'#b7bdb9','metal');
  for(const x of [6.35,7.45]){
    add('옷걸이 기둥 '+x,[x-.025,-6.66,.04,x+.025,-6.61,1.6],'#a4adaa','metal');
    add('옷걸이 발 '+x,[x-.14,-6.8,.035,x+.14,-6.37,.07],'#8c9694','metal');
  }
  add('옷걸이 상단',[6.325,-6.66,1.56,7.475,-6.61,1.61],'#a4adaa','metal');
  add('옷걸이 회색 겉옷',[6.84,-6.60,.64,7.11,-6.53,1.39],'#686d5d');
  add('옷걸이 겉옷 왼 소매',[6.75,-6.61,.90,6.85,-6.51,1.36],'#737767');
  add('옷걸이 겉옷 오른 소매',[7.10,-6.61,.90,7.20,-6.51,1.36],'#737767');
  add('옷걸이 충돌 범위',[6.3,-6.81,.02,7.5,-6.36,.04],'#9c9e90','paint',true);
  // Use a full-height invisible collision box, not the feet only.
  colliders.at(-1).bounds[5]=room.bounds[4]+1.62;
  add('창가 공기 관리기',[8.0,-6.8,.02,8.65,-6.28,.92],'#d6d8d0','paint',true);
  add('창가 공기 관리기 앞면',[8.04,-6.27,.11,8.61,-6.25,.79],'#303f42');
  for(const x of [2.8,7.65]){
    add('롤블라인드 통 '+x,[x,-6.79,2.73,x+1.65,-6.66,2.8],'#d5d3c6');
    add('내린 롤블라인드 '+x,[x,-6.68,2.15,x+1.65,-6.65,2.73],'#d6d1be');
  }
  add('거울 테두리',[4.77,-6.78,1.04,5.13,-6.70,1.91],'#494c43');
  add('거울 면',[4.80,-6.69,1.08,5.10,-6.68,1.87],'#aab9b6','metal');
  add('금속 이동 교탁',[1.8,-3.57,.04,2.12,-2.7,1.10],'#9c9e8b','metal',true);
  add('이동 교탁 상판',[1.73,-3.65,1.10,2.18,-2.62,1.15],'#c9c3a8');
  for(const y of [-3.55,-2.76])add('이동 교탁 바퀴 '+y,[1.75,y,.02,2.15,y+.08,.1],'#3e4240');
  add('두 번째 검정 모니터',[.94,-5.34,.93,1.08,-4.78,1.34],'#252d30');
  add('추가 모니터 화면',[1.082,-5.30,.97,1.088,-4.82,1.30],'#52696f');
  for(let i=0;i<4;i++)add('접힌 체육 매트 '+i,[5.28,-.69,.43+i*.055,5.95,-.25,.477+i*.055],['#2c6760','#b9913b','#903f51','#376787'][i]);
  for(const x of [6.12,7.45,8.02])add('노란 수납바구니 '+x,[x,-.69,.76,x+.34,-.24,.96],'#dac348');
  for(const [i,color] of ['#bc5264','#82a14b','#d6be46'].entries())add('뒤 정리함 '+i,[9.35,-.55,.06+i*.24,9.80,-.20,.27+i*.24],color);
  return {...config,boxes,colliders,photoDetails:{version:1,sourceCount:6,latches,fanCount:4}};
}
