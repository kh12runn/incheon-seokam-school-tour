// Approved phone photos reviewed 2026-09-29. Only 1F_3-4 is overridden.
export const CLASS34_ID='1F_3-4';
export const CLASS34_PROFILE={
  roomId:CLASS34_ID,referenceRoom:'4F_6-4',photoStatus:'reviewed',photoCount:6,
  theme:'하늘과 초록 잔디',motif:'잎',accent:'#91b4ba',lowerWall:'#b5c0af',trayColor:'#dfc344',
  boardLayout:0,lockerPattern:1,seatCountIsApproximate:true,
  sourceRevision:'668b0597-988b-422a-8244-86e84a5c2a10',
  sourceImageIds:['815c3ea3-c884-46ca-9f62-0812907516cd','09ae069f-e0bf-4f9d-9d30-56e0a850cb9a','66a5568d-9d04-49e6-9d4c-80c496760fd9','03c80315-6d8c-4e63-8407-6b53475beee6','5267ce1f-9d21-4174-ae3b-064e97938c09','8e55ab75-4ec3-4163-bfc1-e98516aef1eb'],
  observedFeatures:['짙은 초록 양옆 날개와 흰색 중앙 칠판·위쪽 태극기','남색·연두색 의자와 밝은 목재 책상·흰 금속 다리',
    '하늘·잔디 배경 뒤 게시판과 두 줄 작품 전시','목재 사물함의 연두색 중간 줄과 뒤쪽 검정 분리수거함',
    '창가 뒤쪽 서랍장·수도꼭지가 있는 싱크대·기둥의 둥근 시계','복도 쪽 낮은 책장·바구니·색색 파일이 꽂힌 흰 철제 선반',
    '창가 앞쪽 파랑·흰색 기기와 검정·흰색 듀얼 모니터','금속 이동 교탁·천장 보호망 선풍기 4대'],
};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function applyClass34Details(config){
  if(config.roomId!==CLASS34_ID)return config;
  const {frame,room}=config;
  const boxes=config.boxes.filter(b=>!/사물함|노란 정리바구니|공기청정기/.test(b.name)).map(b=>{
    let hex,material=b.material;
    if(/의자 좌판|의자 등받이/.test(b.name)){hex=[1,2,6,7,11,13,17,18,19,23].includes(Number(b.name.match(/\d+$/)?.[0]))?'#9bb64f':'#25394e';material='paint';}
    if(/책상 다리|책상 발|의자 앞다리|의자 뒷다리|책상 서랍/.test(b.name))hex='#c4cdca';
    if(/책상 상판/.test(b.name))hex='#cbbfa5';
    if(/원목 마루/.test(b.name))hex='#bfae92';
    if(/뒤 게시판 테두리/.test(b.name))hex='#9fa69f';
    if(/뒤 게시판$/.test(b.name))hex='#a5cbd2';
    if(/녹색 칠판/.test(b.name))hex='#294b3d';
    if(/상부벽/.test(b.name))hex='#e5e7df';
    if(/벽걸이 화면$/.test(b.name))hex='#1b2328';
    return hex?{...b,color:rgb(hex),material}:b;
  });
  const colliders=config.colliders.filter(b=>!/사물함|공기청정기/.test(b.name)),latches=[];
  const add=(name,b,hex,material='paint',solid=false)=>{
    const a=frame.point(...b.slice(0,3)),c=frame.point(...b.slice(3)),box={name:'3-4 교실 실내 사진 '+name,spaceId:CLASS34_ID,interiorRoom:CLASS34_ID,floor:1,kind:'detail',bounds:[a.x,Math.min(a.y,c.y),a.z,c.x,Math.max(a.y,c.y),c.z],color:rgb(hex),material};
    boxes.push(box);if(solid)colliders.push({...box,name:'3-4 교실 충돌 사진 '+name,kind:'furniture'});return box;
  };
  add('중앙 흰 칠판',[.261,-4.85,.97,.27,-1.88,2.35],'#ebeee6');
  // 27 approximate cubbies; keep the original walkable back aisle at x=8.85.
  add('뒤 사물함 몸체',[9.31,-6.45,.03,9.84,-1.95,1.17],'#9c8769','wood',true);
  for(let row=0;row<3;row++)for(let col=0;col<9;col++){
    const y=-6.425+col*.495,h=.075+row*.355;
    add(`사물함 문 ${row}-${col}`,[9.275,y,h,9.315,y+.465,h+.33],row===1?'#a5bb6c':'#bf9f72','wood');latches.push(frame.point(9.263,y+.345,h+.235));
  }
  for(let i=0;i<3;i++){
    const y=-1.73+i*.44;
    add('검정 분리수거함 '+i,[9.36,y,.03,9.81,y+.38,.54],'#30373b','paint',true);
    add('분리수거함 뚜껑 '+i,[9.34,y-.01,.54,9.83,y+.39,.58],'#424a4d');
    add('분리수거함 분류표 '+i,[9.328,y+.12,.38,9.338,y+.27,.47],['#a9c4bb','#d3aab3','#aeb9c7'][i]);
  }
  // Window-side fixtures stay outside the desk field and circulation paths.
  add('창가 서랍장',[8.63,-6.8,.025,9.20,-6.25,1.70],'#b39b76','wood',true);
  for(let row=0;row<4;row++){
    const h=.055+row*.4;
    add('서랍장 앞판 '+row,[8.65,-6.242,h,9.18,-6.22,h+.38],'#c1aa85','wood');
    add('서랍장 손잡이 '+row,[8.85,-6.208,h+.23,8.99,-6.185,h+.26],'#a6aeaa','metal');
  }
  add('싱크대 하부장',[7.79,-6.80,.025,8.57,-6.22,1.18],'#b49a74','wood',true);
  add('싱크대 상판',[7.76,-6.82,1.18,8.60,-6.19,1.23],'#b5bfba','metal');
  add('싱크볼',[7.94,-6.67,1.232,8.40,-6.31,1.239],'#637b7b','metal');
  for(const x of [8.13,8.22])add('싱크대 손잡이 '+x,[x,-6.205,.68,x+.025,-6.18,.88],'#b9c1bd','metal');
  add('수도꼭지 기둥',[8.12,-6.75,1.23,8.16,-6.71,1.52],'#b9c5c3','metal');
  add('수도꼭지 출수부',[8.12,-6.75,1.49,8.16,-6.52,1.53],'#b9c5c3','metal');
  add('창가 앞 파란 기기',[1.90,-6.78,.035,2.59,-6.15,1.19],'#315770','paint',true);
  add('파란 기기 흰 상판',[1.89,-6.79,1.19,2.60,-6.14,1.29],'#e0e4dc');
  add('파란 기기 어두운 앞창',[2.603,-6.67,.2,2.611,-6.26,.97],'#253b3d');
  add('창가 뒤 흰 공기청정기',[9.28,-6.84,.025,9.77,-6.52,.82],'#e1e4de','paint',true);
  // Reference monitor is black. The photographed second monitor has a white back.
  add('두 번째 검정 모니터',[.94,-5.34,.93,1.08,-4.78,1.34],'#e0e2d9');
  add('추가 모니터 화면',[1.082,-5.30,.97,1.088,-4.82,1.30],'#52696f');
  add('이동 교탁 몸체',[1.82,-3.52,.08,2.13,-2.77,1.22],'#b6b4a4','metal',true);
  add('이동 교탁 상판',[1.75,-3.61,1.22,2.22,-2.68,1.27],'#847d69');
  for(const y of [-3.52,-2.84])add('교탁 받침 '+y,[1.70,y,.045,2.24,y+.075,.10],'#788785','metal');
  // Existing shelves kept; replace uniform yellow trays with photographed mixed baskets.
  for(const [x,color] of [[5.38,'#dfc43e'],[6.05,'#e2e3d6'],[7.40,'#d5e0d5'],[8.05,'#353c42']])add('복도 수납바구니 '+x,[x,-.67,.77,x+.40,-.25,.94],color);
  for(const x of [2.23,2.83])for(const y of [-.69,-.24])add('흰 선반 기둥 '+x+' '+y,[x,y,.035,x+.025,y+.025,1.66],'#d7ded8','metal');
  for(const h of [.08,.54,1.03,1.50])add('흰 철제 선반 '+h,[2.20,-.73,h,2.88,-.20,h+.035],'#cdd7cf','metal');
  add('철제 선반 충돌',[2.20,-.73,.02,2.88,-.20,1.54],'#ccd4c9','metal',true);
  // Hide the simple collider hull from rendering; only the open frame is visible.
  boxes.pop();
  for(let i=0;i<10;i++)add('색색 파일 '+i,[2.27+i*.049,-.59,1.54,2.305+i*.049,-.26,1.87],['#d3b842','#c06764','#729a68','#6096ab','#947baa'][i%5]);
  return {...config,boxes,colliders,profile:CLASS34_PROFILE,photoDetails:{version:1,sourceCount:6,latches,fanCount:4,lockerCount:27}};
}
