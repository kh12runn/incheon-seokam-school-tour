import {photoRoom} from './사진실내도구.mjs';

// Photo-observed contents fitted to the existing plan, not measured reconstruction.
export const ADMIN_REFERENCE={count:8,reviewedAt:'2026-10-01',approximateDimensions:true,imageIds:[
  'd8703b74-d46a-428c-91ae-22b6ebcf69e2','83cacdc1-83be-420a-b3a5-e5a62046072e',
  '874ec3de-bf74-4c6b-baae-a585701c8b8d','82322b93-5190-4198-8f66-af73e1c76e21',
  'f3e3fcf4-3fee-4db1-afed-8e6e44cf5710','0c83468f-9fa4-41fb-9597-656f57854080',
  'e5231c9b-4d65-45ab-8cd4-3a69e9a922ca','0c94a05f-2a3d-499c-868d-c5bb6f84362b'
]};
export const STORAGE_REFERENCE={count:7,reviewedAt:'2026-10-01',approximateDimensions:true,imageIds:[
  '115513d3-09cb-4021-aaa2-ddecf4713e77','e647c342-a91f-4c9d-a2a8-c83a0b51d224',
  '018e5e76-e208-4c51-864f-9e266942b8ac','9e52b14a-4679-4755-aa96-0d3e83e6efac',
  '718bd8b1-8536-4547-960f-c3d332cdebe0','2d99c6c4-6301-48af-b18a-43d554aec9c9',
  '9efaaf2c-fb3d-4563-a58a-49e6f6413700'
]};

function carton(p,name,x,y,z,w=.48,d=.38,h=.32){
  p.add(name,[x,y,z,x+w,y+d,z+h],'#b3996b','paint');
  p.add(name+' 포장 테이프',[x+w*.44,y-.002,z,x+w*.56,y+d+.002,z+h+.002],'#c7b48c');
  p.add(name+' 무기명 라벨',[x+.06,y-.004,z+h*.4,x+w*.6,y-.002,z+h*.7],'#eeeae1');
}

export function adminInterior(data,worldBoxes){
  const room=data.rooms.find(r=>r.id==='1F_ADMIN');if(!room)return null;
  const p=photoRoom(room,worldBoxes,ADMIN_REFERENCE),{add,table,cabinet,chair,config:c}=p;
  c.photoUtility='admin';c.spawn={x:53.15,y:-.85,z:0};c.entryYaw=Math.PI;
  p.finish('staff_floor','#deddd2');
  for(const x of [.12,8.82])add('검은 걸레받이',[x,.12,.01,x+.05,6.87,.13],'#292c2a');
  for(const [x,X] of [[.12,2.51],[3.79,8.87]])add('출입벽 검은 걸레받이',[x,6.83,.01,X,6.88,.13],'#292c2a');
  add('창가 걸레받이',[.12,.12,.01,8.87,.17,.13],'#292c2a');
  for(let i=0;i<5;i++){
    const y=.55+i*1.14;
    const first=c.boxes.length;
    cabinet('흰 붙박이장 '+i,8.22,y,.56,1.12,2.88,'#e4e5df',false,'west');
    for(const b of c.boxes.slice(first))if(b.material==='wood')b.material='paint';
    add('붙박이장 위아래 문 이음',[8.193,y+.02,2.12,8.218,y+1.10,2.133],'#a7adaa');
    for(const v of [y+.46,y+.64])add('상부장 손잡이',[8.17,v,2.35,8.195,v+.022,2.48],'#8c9593','metal');
  }
  // Visitor aisle and three workstations follow the longitudinal photo views.
  for(let i=0;i<3;i++){
    const y=1.1+i*1.68;
    add('파란 파티션 '+i,[4.12,y,.08,4.20,y+1.65,1.21],'#507eaf','staff_fabric',true);
    add('파티션 흰 가로띠',[4.10,y,.85,4.22,y+1.65,1.02],'#dfe2dc');
    for(const v of [y,y+1.61])add('파티션 흰 세로틀',[4.09,v,.03,4.23,v+.04,1.25],'#e2e4dd');
    for(const h of [.05,1.21])add('파티션 흰 테두리',[4.09,y,h,4.23,y+1.65,h+.04],'#e2e4dd');
    table('직원 책상 '+i,4.36,y+.11,1.88,1.28,.73,'#e1e2de');
    chair('직원 회전의자 '+i,6.78,y+.70,Math.PI/2,'#333f3b');
    for(let j=0;j<2;j++){
      const v=y+.19+j*.61;
      add('듀얼 모니터 받침',[4.85,v+.09,.79,5.13,v+.43,.82],'#303533');
      add('듀얼 모니터 기둥',[4.86,v+.23,.80,4.91,v+.27,1.05],'#323936');
      add('듀얼 모니터 검은 외장',[4.77,v,.97,4.84,v+.56,1.34],'#242a29');
      add('듀얼 모니터 화면',[4.841,v+.025,.995,4.845,v+.535,1.315],'#465967','glass');
      add('키보드',[5.27,v+.04,.788,5.43,v+.5,.812],'#424b49');
      for(let k=0;k<7;k++)add('키보드 키열',[5.28,v+.055+k*.06,.813,5.42,v+.064+k*.06,.816],'#a0aaa3');
    }
    add('컴퓨터 본체',[5.76,y+.13,.02,6.02,y+.65,.55],'#3f4642','metal',true);
    add('민원 보조 상판',[3.84,y+.37,1.25,4.39,y+1.31,1.29],'#e9eae3','staff_table');
    for(let j=0;j<3;j++)add('파란 서류 트레이',[3.96,y+.5,1.30+j*.047,4.28,y+.91,1.315+j*.047],'#59b2c4');
    add('트레이 무기명 서류',[4.0,y+.54,1.32,4.24,y+.88,1.36],'#efeee9');
    add('책상 필기구 꽂이',[3.99,y+1.04,1.29,4.15,y+1.18,1.45],'#e3dfcd');
    for(let j=0;j<5;j++)add('필기구',[4.0+j*.027,y+1.08,1.38,4.012+j*.027,y+1.092,1.54+j%2*.025],['#d7ad31','#4c7798','#984d4b'][j%3]);
  }
  add('창가 가로 파티션',[4.12,.97,.08,7.8,1.05,1.21],'#507eaf','staff_fabric',true);
  for(const h of [.05,.87,1.21])add('창가 파티션 흰 띠',[4.10,.95,h,7.83,1.07,h+(h===.87?.17:.04)],'#e2e4dd');
  // The public service hatch is represented against the existing wall, without
  // inventing a traversable opening into the neighbouring central lobby.
  add('민원창구 흰 창틀',[.12,1.86,1.13,.23,3.74,2.32],'#e3e6e1');
  for(let i=0;i<2;i++)add('민원창구 불투명 미닫이 유리',[.232,1.94+i*.88,1.21,.247,2.74+i*.88,2.24],'#9a9b8a','glass');
  add('민원창구 석재 선반',[.12,1.77,1.05,.69,3.84,1.13],'#aaada8','terrazzo',true);
  add('민원창구 서류철',[.30,2.14,1.13,.53,2.64,1.16],'#33404e');
  add('민원창구 서식 거치대',[.27,3.10,1.13,.49,3.55,1.52],'#e0e2dc');
  for(let i=0;i<3;i++)add('민원창구 무기명 서식',[.494,3.15+i*.12,1.17,.502,3.26+i*.12,1.49],['#d9e3e8','#567bb3','#b74c4e'][i]);
  table('목재 대기 의자',.26,4.36,.55,1.44,.40,'#694c3c');
  add('검은 대기석 방석',[.25,4.35,.45,.82,5.81,.53],'#252e2d','staff_fabric',true);
  for(const y of [4.39,5.70])add('대기석 목재 등받이 지지대',[.26,y,.44,.32,y+.06,1.01],'#62493b','wood');
  add('대기석 목재 등받이',[.27,4.37,.87,.35,5.79,1.02],'#664b39','wood');
  cabinet('흰 이동서랍',.28,3.91,.65,.43,.7,'#e7e8e2',false,'west');
  for(const h of [.25,.45])add('서랍 구분선',[.27,3.92,h,.94,3.94,h+.009],'#a5aeaa');
  add('공기청정기',[.30,.64,.02,.68,1.2,.97],'#e7e8e1','paint',true);
  add('공기청정기 검은 상부',[.30,.64,.90,.68,1.20,.97],'#252e2d');
  for(let i=0;i<15;i++)add('청정기 세로 통풍살',[.684,.68+i*.032,.12,.688,.69+i*.032,.83],'#a9b1ae');
  for(let i=0;i<3;i++)carton(p,'민원창구 옆 택배 상자',.35,1.30,.02+i*.22,.47,.39,.22);
  add('벽면 스테인리스 제어반',[.12,.25,1.14,.23,1.34,2.38],'#979f9b','metal');
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const y=.38+col*.19,z=1.35+row*.17;
    add('제어반 버튼',[.235,y,z,.26,y+.04,z+.04],row%2?'#346558':'#343c3b','metal');
    add('제어반 무기명 버튼 라벨',[.235,y-.015,z-.034,.239,y+.055,z-.016],'#dddcd0');
  }
  add('상부 전기함',[.12,.48,2.55,.38,1.17,3.0],'#cccfc4','metal');
  for(const y of [3.95,4.65,5.31]){
    add('공지판 달력 무기명',[.135,y,1.34,.155,y+.51,2.19],'#eeeee6');
    for(let r=0;r<6;r++)for(let k=0;k<7;k++)add('달력 격자',[.156,y+.04+k*.061,1.47+r*.085,.16,y+.056+k*.061,1.49+r*.085],k===0?'#ad5551':'#566466');
  }
  for(let i=0;i<3;i++){
    const x=.65+i*2.55;
    add('창가 알루미늄 프레임',[x,.13,1.10,x+2.42,.24,2.68],'#d8e0dc','metal');
    for(let j=0;j<2;j++)add('창가 하부 유리',[x+.05+j*1.2,.245,1.15,x+1.17+j*1.2,.251,2.60],'#88aca3','glass');
    for(let j=0;j<13;j++)add('올리브 블라인드',[x,.27,1.76+j*.071,x+2.42,.32,1.824+j*.071],j%2?'#969d70':'#a3a67b','staff_fabric');
    add('블라인드 당김줄',[x+2.35,.34,1.30,x+2.36,.35,2.69],'#dadbd0');
  }
  add('천장 냉난방기',[4.65,3.0,2.92,5.65,4.0,3.08],'#d6d4c7');
  add('천장 냉난방기 중앙 흡입구',[4.82,3.17,2.91,5.48,3.83,2.922],'#646f6a');
  for(let i=0;i<12;i++)add('냉난방기 그릴',[4.82,3.18+i*.053,2.903,5.48,3.196+i*.053,2.913],'#b5bbb2');
  return c;
}

export function storageInterior(data,worldBoxes){
  const room=data.rooms.find(r=>r.id==='1F_STORAGE_1');if(!room)return null;
  const p=photoRoom(room,worldBoxes,STORAGE_REFERENCE),{add,table,config:c,bounds}=p;
  c.photoUtility='storage';c.spawn={x:40.45,y:3.85,z:0};c.entryYaw=0;c.utilityProps=[];
  p.finish('storage_concrete','#bdbdb1');
  // Keep the exposed concrete ceiling, suspended strip lights and open aisle.
  for(const b of c.boxes)if(b.kind==='ceiling'){b.material='storage_concrete';b.color=[.78,.78,.73];}
  const prop=(type,x,y,options={})=>c.utilityProps.push({type,x:room.bounds[0]+x,y:room.bounds[2]+y,z:0,...options});
  const solid=(name,b)=>c.colliders.push({name:room.name+' '+name,kind:'furniture',bounds:bounds(b)});
  for(let i=1;i<6;i++)add('노출 천장 판 이음',[.12,i,3.075,6.88,i+.016,3.085],'#969b95');
  for(const y of [1.6,5.0])for(const x of [1.6,5.4]){
    for(const u of [x-.46,x+.46])add('조명 행거',[u,y,2.67,u+.014,y+.014,3.10],'#7b8580','metal');
    add('매달린 LED 조명',[x-.58,y-.04,2.62,x+.58,y+.04,2.68],'#f4f5ec','lamp');
    add('조명 전선',[x-.008,y,2.67,x+.006,y+.014,3.09],'#6f7771');
  }
  add('천장 노출 배선',[1.13,.25,3.05,1.145,6.75,3.064],'#71776e');
  add('천장 배선 가지',[1.13,5.0,3.05,5.87,5.012,3.064],'#71776e');
  for(const b of worldBoxes)if(b.spaceId===room.id&&b.name.startsWith('Doorframe_')){
    const i=worldBoxes.indexOf(b);worldBoxes[i]={...b,color:[.49,.43,.62],material:'paint'};
  }
  add('열어 둔 보라색 출입문',[.80,.13,.02,1.80,.20,2.2],'#9184a6','paint',true);
  add('보라색 출입문 상부 띠',[.78,.125,1.92,1.83,.21,2.21],'#a093b5');
  add('보라색 출입문 손잡이',[1.53,.22,.94,1.70,.26,.97],'#aeb7b0','metal');
  function rack(name,x,y,w,d,h,wood=false){
    const color=wood?'#a8946f':'#8d9994',material=wood?'wood':'metal';
    for(const a of [x,x+w-.045])for(const b of [y,y+d-.045])add(name+' 기둥',[a,b,0,a+.045,b+.045,h],color,material);
    for(let l=0;l<4;l++){
      const z=.16+l*.52;
      add(name+' 선반',[x,y,z,x+w,y+d,z+.04],color,material);
      for(let j=0;j<3;j++){
        const lengthwise=d>w,u=x+.08+(lengthwise?0:(w-.25)*j/3),v=y+.07+(lengthwise?(d-.20)*j/3:0);
        carton(p,name+' 적재 상자 '+l+'-'+j,u,v,z+.04,lengthwise?.58:Math.min(.75,w/3-.06),lengthwise?.48:Math.min(d-.12,.53),.23+((l+j)%3)*.075);
      }
    }
    solid(name,[x,y,0,x+w,y+d,h]);
  }
  for(const y of [1.50,3.78]){
    rack('왼쪽 철제 적재 선반',.20,y,1.02,2.0,2.17);
    rack('오른쪽 철제 적재 선반',5.80,y,1.0,2.0,2.17);
    for(let i=0;i<4;i++)add('선반 위 긴 판재',[.14,y+.18+i*.16,2.20+i*.035,1.38,y+.25+i*.16,2.23+i*.035],i%2?'#d3d6cd':'#9d9580','wood');
  }
  rack('뒤쪽 높은 목재 보관대',1.65,5.94,3.50,.79,2.93,true);
  for(let i=0;i<5;i++)add('목재 보관대 긴 자재',[1.57,6.06+i*.11,2.19,5.27,6.10+i*.11,2.23],'#b4aaa0','wood');
  for(let i=0;i<3;i++)add('접은 분홍 천막',[4.45,4.77,.34+i*.065,5.44,5.40,.40+i*.065],'#c2848f','staff_fabric');
  for(let i=0;i<4;i++)add('천막 밑 접은 목재 발판',[4.45,4.77,.02+i*.08,5.44,5.40,.085+i*.08],'#a18d68','wood');
  table('작업대',4.98,1.90,.7,2.46,.73,'#c3ae80');
  for(let i=0;i<3;i++)carton(p,'작업대 위 상자',5.01,2.0+i*.70,.78,.50,.52,.34+i*.12);
  prop('sprayer',5.35,4.02,{z:.78});
  prop('hose',3.36,6.03,{z:1.30});
  for(let i=0;i<3;i++)prop('roll',1.46,4.95+i*.14,{z:.02,height:1.10+i*.15});
  prop('wheelbarrow',4.36,3.14);solid('초록 외바퀴 수레',[3.89,2.10,0,4.88,4.39,.93]);
  prop('ladder',4.1,.65,{height:2.15});solid('접이식 알루미늄 사다리',[3.72,.24,0,4.48,1.08,2.15]);
  prop('ladder',5.2,.58,{height:2.69});solid('긴 알루미늄 사다리',[4.85,.20,0,5.55,1.0,2.69]);
  prop('ladder',6.1,.61,{height:1.72});solid('짧은 알루미늄 사다리',[5.78,.23,0,6.42,1.05,1.72]);
  prop('caution',3.46,.80);solid('노란 주의 표지',[3.24,.56,0,3.68,1.04,.70]);
  for(const [x,y,color] of [[1.46,2.0,'#375ea1'],[1.45,2.63,'#ab5142'],[5.49,5.43,'#d4ac39'],[1.50,4.30,'#436396']]){
    prop('bucket',x,y,{color});solid('청소 양동이',[x-.19,y-.19,0,x+.19,y+.19,.43]);
  }
  for(const [x,y] of [[1.43,3.20],[1.43,3.63],[5.37,4.75]]){
    add('흰 물통',[x-.17,y-.17,.02,x+.17,y+.17,.54],'#e0e2d8','paint',true);
    add('물통 뚜껑',[x-.06,y-.06,.55,x+.06,y+.06,.60],'#d1d5c9');
    add('물통 손잡이',[x-.12,y-.035,.54,x-.06,y+.035,.64],'#c4cbbf');
  }
  for(let i=0;i<2;i++){
    add('파란 적재 보드',[1.60,3.68+i*.075,.04,1.66,4.70+i*.075,1.09],'#285fc7','paint',true);
    for(let j=0;j<5;j++)add('보드 보강살',[1.66,3.70+j*.2+i*.075,.09,1.677,3.715+j*.2+i*.075,1.04],'#3e79d1');
  }
  for(let i=0;i<4;i++){
    const x=5.59+i*.14;
    add('긴 청소도구 자루',[x,5.54,.10,x+.022,5.57,1.56+i*.13],'#ada58a','wood');
    add('빗자루 솔',[x-.075,5.48,.02,x+.10,5.62,.23],'#95836b','staff_fabric');
  }
  for(const [x,y] of [[1.36,5.25],[5.30,5.72]]){
    add('비닐 포장 보관물',[x-.26,y-.3,.03,x+.26,y+.3,1.44],'#d4d8d2','staff_fabric',true);
    for(const h of [.45,1.08])add('보관물 빨간 묶음끈',[x-.265,y-.306,h,x+.265,y+.306,h+.018],'#a96660');
  }
  for(let i=0;i<3;i++){
    const x=.45+i*2.24;
    add('높은 창 알루미늄 틀',[x,6.78,2.10,x+1.10,6.87,2.82],'#c5ceca','metal');
    add('높은 창 유리',[x+.045,6.764,2.15,x+1.055,6.78,2.77],'#9bbdbe','glass');
    add('높은 창 중간틀',[x+.51,6.75,2.13,x+.55,6.78,2.81],'#bac6c1','metal');
  }
  c.boxes=c.boxes.filter(b=>!b.name.includes('형광등'));
  return c;
}
