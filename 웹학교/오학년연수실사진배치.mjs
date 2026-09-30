import {subtractBox} from './창문배치.mjs';
export const GRADE5_RESEARCH_ID='3F_GRADE5_RESEARCH';
export const GRADE5_RESEARCH_REFERENCE={count:7,revision:'2026-09-30-ff757bab',reviewedAt:'2026-09-30',approximateDimensions:true,
  imageIds:['ff757bab-b055-429f-a800-e3578e9312a2','36c7ff07-cdda-4d50-a498-d962978059df','6c65e133-3cd7-4307-9ac1-5c7f31663e7c','ed86e42f-97a9-413b-a66d-8a65b27722ba','96513cc9-a28d-41d7-8216-34fcc0da6a40','7cdf6ea3-237c-456c-875e-8d4c507050a2','04c0e2c8-fe4b-432f-bffb-b8872e13758c'],
  features:['회색 정사각 타일','긴 유리문 교구 수납장','타원 끝 목재 회의탁자와 검정 의자','재단기·코팅기·문서 바구니','냉장고·전자레인지·분리수거함','싱크대·온수기·정수기','창가 듀얼 모니터와 옷걸이']};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function grade5ResearchInterior(data,worldBoxes,worldColliders){
  const room=data.rooms.find(r=>r.id===GRADE5_RESEARCH_ID);if(!room)return null;
  const [west,,south,,floorZ]=room.bounds,boxes=[],colliders=[],chairs=[];
  const bounds=([x,y,z,X,Y,Z])=>[west+x,south+y,floorZ+z,west+X,south+Y,floorZ+Z];
  const add=(name,b,color,material='paint',solid=false)=>{
    const item={name:'5학년 연수실 '+name,spaceId:room.id,interiorRoom:room.id,floor:3,kind:'detail',bounds:bounds(b),color:rgb(color),material};
    boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});return item;
  };
  // Keep the existing project door. Only cut the room's own walls.
  // Furniture dimensions are photo estimates fitted to the existing envelope.
  const cuts=[bounds([.20,6.8,.99,5.78,7.2,2.43]),bounds([2.95,-.2,1.12,5.6,.2,2.4])];
  for(const list of [worldBoxes,worldColliders]){
    const next=list.flatMap(b=>{
      if(b.spaceId===room.id)return cuts.reduce((parts,cut)=>parts.flatMap(p=>subtractBox(p,cut)),[b]);
      // sealEnvelope adds an unowned backing just outside the photographed window.
      if(b.floor===3&&b.name.includes('외피 보강'))return subtractBox(b,cuts[0]);
      return [b];
    });
    list.splice(0,list.length,...next);
  }
  add('회색 타일 바닥',[.1,.1,.001,5.9,6.9,.009],'#c4c8c3','control_tile');
  add('천장',[.1,.1,3.09,5.9,6.9,3.12],'#ecece5','staff_ceiling').kind='ceiling';
  for(let x=.15;x<5.9;x+=.45)add('바닥 세로 줄눈 '+x,[x,.1,.011,x+.005,6.9,.013],'#aeb6b1');
  for(let y=.15;y<6.9;y+=.45)add('바닥 가로 줄눈 '+y,[.1,y,.011,5.9,y+.005,.013],'#aeb6b1');
  for(const x of [.10,5.87]){
    add('연회녹색 하부벽 '+x,[x,.1,.13,x+.027,6.9,1.07],'#bec7bb','staff_wall');
    add('흰 상부벽 '+x,[x,.1,1.07,x+.027,6.9,3.08],'#e5e7de','staff_wall');
    add('걸레받이 '+x,[x-.004,.1,.02,x+.035,6.9,.13],'#737d73');
  }
  for(const [y,a,b] of [[6.875,.12,5.87],[.10,.12,1.43],[.10,2.77,5.87]])add('앞뒤 하부벽 '+y+' '+a,[a,y,.14,b,y+.018,.97],'#bec7bb','staff_wall');
  for(const y of [.11,6.86]){
    const lo=y<1?2.95:.2,hi=y<1?5.60:5.78,z0=y<1?1.12:.99,z1=y<1?2.4:2.43;
    add(y<1?'복도창 반투명 유리':'창가 유리',[lo,y,z0,hi,y+.022,z1],y<1?'#c2d0c5':'#dae4df',y<1?'glass':'clear_glass');
    colliders.push({name:'연수실 창문 충돌 '+y,kind:'window_collision',bounds:bounds([lo,y,z0,hi,y+.025,z1])});
    for(const z of [z0-.035,z1])add('창 가로틀 '+y+' '+z,[lo-.03,y-.04,z,hi+.03,y+.05,z+.035],y<1?'#b1956d':'#d9ded6',y<1?'wood':'metal');
    for(let i=0;i<=4;i++){const x=lo+(hi-lo)*i/4;add('창 세로틀 '+y+' '+i,[x-.017,y-.04,z0,x+.017,y+.05,z1],y<1?'#b1956d':'#d9ded6',y<1?'wood':'metal');}
    if(y>1)for(const z of [1.14,1.32])add('창 안전봉 '+z,[lo,6.77,z,hi,6.792,z+.022],'#9eaca6','metal');
  }
  // Right-hand wall: wood top/bottom doors, glazed middle and visible supplies.
  for(let bank=0;bank<5;bank++){
    const y=.38+bank*1.13;
    add('교구장 뒷판 '+bank,[5.79,y,.03,5.88,y+1.10,2.73],'#a68b65','wood');
    colliders.push({name:'연수실 교구장 충돌 '+bank,kind:'furniture',bounds:bounds([5.20,y,0,5.88,y+1.10,2.73])});
    for(const v of [y,y+1.065])add('교구장 측판 '+bank+' '+v,[5.21,v,.03,5.81,v+.035,2.73],'#b39970','wood');
    for(const z of [.05,.68,1.16,1.62,2.09,2.70])add('교구장 선반 '+bank+' '+z,[5.21,y,z,5.81,y+1.10,z+.03],'#b6a17b','wood');
    for(let door=0;door<2;door++){
      const v=y+.025+door*.535;
      for(const [a,b] of [[.09,.66],[2.12,2.67]])add('교구장 목재문 '+bank+' '+door+' '+a,[5.19,v,a,5.22,v+.51,b],'#b6a078','wood');
      add('교구장 유리문 '+bank+' '+door,[5.184,v,.73,5.195,v+.51,2.07],'#d6e4df','clear_glass');
      for(const q of [v,v+.493])add('교구장 은색 문틀 '+bank+' '+door+' '+q,[5.17,q,.7,5.207,q+.017,2.09],'#b9c4be','metal');
      for(const z of [.7,2.07])add('교구장 문 가로틀 '+bank+' '+door+' '+z,[5.17,v,z,5.207,v+.51,z+.02],'#b9c4be','metal');
      for(const z of [.32,1.26,2.30])add('교구장 은색 손잡이 '+bank+' '+door+' '+z,[5.139,v+(door?.055:.435),z,5.173,v+(door?.075:.455),z+.14],'#b2c0ba','metal');
    }
    for(let row=0;row<3;row++)for(let col=0;col<2;col++){
      const v=y+.1+col*.5,z=.72+row*.466;
      add('교구 바구니 '+bank+' '+row+' '+col,[5.27,v,z,5.70,v+.4,z+.25],['#d0ba4d','#7598ac','#9caf6c','#d9d8c8','#a295b8'][(bank+row+col)%5]);
      for(let j=0;j<4;j++)add('바구니 망 '+bank+' '+row+' '+col+' '+j,[5.263,v+.04+j*.087,z+.07,5.27,v+.079+j*.087,z+.16],'#87968b');
      for(let j=0;j<3;j++)add('교구 물품 '+bank+' '+row+' '+col+' '+j,[5.35,v+.05+j*.105,z+.24,5.48,v+.12+j*.105,z+.33+(j%2)*.06],['#e3ddd0','#9cb5b9','#d6c978'][j]);
    }
    add('교구장 위 운반 가방 '+bank,[5.3,y+.14,2.73,5.74,y+.82,2.95],bank%2?'#444b48':'#818a84',bank%2?'fabric':'metal');
    if(bank%2===0)for(const v of [y+.18,y+.75])add('운반함 은색 모서리 '+bank+' '+v,[5.29,v,2.74,5.75,v+.022,2.96],'#b2bdb7','metal');
  }
  // Left-hand storage, kitchenette and water appliances in photo order.
  add('입구 낮은 문서장',[.14,.35,.02,.73,1.28,1.43],'#b5a383','wood',true);
  for(let row=0;row<4;row++){
    add('문서장 서랍 '+row,[.735,.38,.07+row*.22,.752,.80,.265+row*.22],'#b9a687','wood');
    add('서랍 손잡이 '+row,[.754,.54,.16+row*.22,.78,.66,.18+row*.22],'#a8b5ac','metal');
  }
  for(let i=0;i<10;i++)add('문서장 책 '+i,[.28,.85+i*.036,.30,.74,.877+i*.036,.58+(i%3)*.03],['#507e8f','#d3bc76','#a1686a'][i%3]);
  add('왼쪽 키큰 목재장',[.14,1.40,.02,.76,2.32,2.08],'#b5a07e','wood',true);
  add('목재장 문 틈',[.764,1.852,.08,.771,1.865,2.04],'#887959');
  for(const y of [1.79,1.92])add('목재장 손잡이 '+y,[.78,y,.98,.80,y+.018,1.13],'#bbc4ba','metal');
  for(let i=0;i<2;i++)add('수납장 위 플라스틱 상자 '+i,[.19,1.48+i*.42,2.08,.70,1.86+i*.42,2.34],i?'#ab5147':'#488b53');
  add('흰 냉장고',[.14,2.42,.02,.82,3.18,1.69],'#e0e4db','paint',true);
  add('냉장고 문 경계',[.823,2.45,1.16,.831,3.15,1.18],'#8a9790');
  for(const z of [1.07,1.23])add('냉장고 손잡이 '+z,[.834,3.05,z,.858,3.095,z+.08],'#c1c9c1');
  add('제빙기 파란 받침',[.23,2.56,1.7,.69,3.04,1.79],'#7192aa');
  add('제빙기 흰 본체',[.28,2.61,1.79,.66,3.0,2.06],'#e4e7df');
  add('제빙기 파란 뚜껑',[.30,2.64,2.06,.65,2.98,2.13],'#85a4b5');
  add('간이 주방 상판',[.14,3.30,.80,.86,4.50,.84],'#e1e4dd','paint',true);
  for(const y of [3.32,4.43])for(const x of [.2,.79])add('간이 주방 다리 '+x+' '+y,[x,y,.03,x+.035,y+.035,.8],'#aab9b0','metal',true);
  add('전자레인지',[.22,3.38,.84,.80,4.01,1.21],'#c3cac4');
  add('전자레인지 검정 문',[.803,3.42,.90,.82,3.86,1.15],'#253230','glass');
  add('전자레인지 조작부',[.81,3.92,.95,.825,3.97,1.13],'#e1e4db');
  add('금속 전기주전자',[.39,4.17,.84,.68,4.43,1.12],'#aab7b0','metal');
  for(let i=0;i<3;i++)add('색색 분리수거통 '+i,[.24,3.34+i*.36,.03,.75,3.65+i*.36,.66],['#759d4b','#c7ae46','#af5b52'][i],'paint',true);
  add('싱크대 하부장',[.14,4.64,.03,.84,5.64,.85],'#baa785','wood',true);
  add('싱크대 금속 상판',[.13,4.62,.85,.87,5.66,.89],'#a6b5ad','metal');
  add('싱크대 물받이',[.27,4.79,.893,.74,5.31,.90],'#657d76','metal');
  for(const y of [4.76,5.15,5.54])add('싱크대 문 경계 '+y,[.845,y,.09,.854,y+.01,.81],'#8e8068');
  add('싱크대 수도꼭지',[.29,5.38,.9,.32,5.41,1.14],'#acbab5','metal');
  add('수도꼭지 끝',[.29,5.21,1.115,.32,5.41,1.145],'#acbab5','metal');
  add('벽걸이 온수기',[.16,5.0,1.49,.48,5.47,1.89],'#e3e5dc');
  for(let i=0;i<2;i++)add('온수기 배관 '+i,[.24+i*.08,5.40,.92,.26+i*.08,5.42,1.5],i?'#82a7b4':'#c9b553');
  add('벽 종이 디스펜서',[.16,4.64,1.25,.34,4.90,1.56],'#e4e6de');
  add('바닥 정수기',[.17,5.81,.02,.73,6.39,1.21],'#dee3db','paint',true);
  add('정수기 음용부',[.737,5.90,.79,.75,6.28,1.08],'#647773');
  for(let i=0;i<2;i++)add('정수기 버튼 '+i,[.755,6.0+i*.16,.99,.77,6.065+i*.16,1.04],i?'#789dad':'#b46d61');
  // Table collision is rectangular but rounded visual corners are rendered separately.
  add('긴 회의탁자',[2.34,1.45,.72,3.82,5.35,.79],'#b28c54','staff_table',true).renderInDetails=true;
  for(const y of [2.07,4.65])add('탁자 목재 받침',[2.74,y,.02,3.42,y+.43,.72],'#8f7552','wood',true);
  for(let i=0;i<4;i++)for(const [x,angle] of [[1.95,-Math.PI/2],[4.23,Math.PI/2]]){
    const y=1.97+i*.99;chairs.push({x:west+x,y:south+y,z:floorZ,angle});
    colliders.push({name:'연수실 회의 의자 '+x+' '+i,kind:'furniture',bounds:bounds([x-.25,y-.25,0,x+.25,y+.25,.93])});
  }
  add('흰 코팅기',[2.56,1.66,.80,3.41,2.02,.94],'#dadfd7');
  add('코팅기 투입구',[2.63,1.655,.825,3.34,1.665,.856],'#424f49');
  for(let i=0;i<2;i++){
    const y=2.38+i*.62;
    add('목재 재단기 받침 '+i,[2.63,y,.80,3.30,y+.48,.87],'#b18f61','wood');
    add('재단기 회색 눈금판 '+i,[2.67,y+.03,.87,3.26,y+.44,.879],'#b3bdb0');
    for(let j=0;j<6;j++)add('재단기 눈금 '+i+' '+j,[2.68+j*.09,y+.035,.881,2.685+j*.09,y+.43,.884],'#859582');
    add('재단기 긴 손잡이 '+i,[3.28,y-.05,.89,3.33,y+.51,.925],'#34473a');
  }
  for(let i=0;i<3;i++){
    const y=3.74+i*.46;
    add('회의탁자 문서더미 '+i,[2.57+(i%2)*.44,y,.802,2.94+(i%2)*.44,y+.30,.83+i*.025],'#e3e5dc');
    for(let j=0;j<4;j++)add('문서 낱장 '+i+' '+j,[2.575+(i%2)*.44,y-.002,.807+j*.005,2.946+(i%2)*.44,y+.302,.809+j*.005],'#bdc8bd');
  }
  add('회색 문서 바구니',[3.13,4.85,.80,3.61,5.30,1.0],'#aeb6aa');
  for(let j=0;j<7;j++)add('바구니 옆 구멍 '+j,[3.618,4.89+j*.054,.85,3.623,4.913+j*.054,.93],'#798d7d');
  add('창가 책상',[3.40,6.08,.73,5.18,6.80,.79],'#b7a179','wood',true);
  for(const x of [3.5,5.02])add('창가 책상 다리 '+x,[x,6.18,.03,x+.05,6.71,.73],'#abb7ad','metal',true);
  for(const x of [3.7,4.38]){
    add('창가 모니터 받침 '+x,[x+.12,6.42,.79,x+.45,6.65,.82],'#343e39');
    add('창가 모니터 기둥 '+x,[x+.26,6.57,.81,x+.30,6.61,1.0],'#39473f');
    add('창가 모니터 '+x,[x,6.58,.97,x+.6,6.64,1.35],'#29332e');
    add('창가 모니터 화면 '+x,[x+.022,6.574,1.0,x+.577,6.579,1.323],'#52676b');
  }
  add('창가 키보드',[4.02,6.17,.796,4.53,6.37,.819],'#39443e');
  add('창가 전화기',[4.85,6.23,.796,5.12,6.45,.87],'#444e47');
  add('창가 흰 공기청정기',[2.51,6.31,.02,3.13,6.82,1.08],'#e0e4dc','paint',true);
  add('복사기 본체',[3.43,.24,.03,4.26,.95,.97],'#d4dcd3','paint',true);
  add('복사기 검정 상단',[3.39,.20,.97,4.28,.91,1.15],'#46524b');
  add('복사기 급지대',[3.46,.34,1.15,4.16,.88,1.25],'#dbe0d6');
  for(let i=0;i<3;i++)add('복사기 용지함 '+i,[3.48,.954,.16+i*.22,4.20,.973,.34+i*.22],'#b4c1b5');
  for(const list of [boxes,colliders])for(const item of list)if(item.name.includes('복사기')){
    item.bounds=[...item.bounds];item.bounds[1]-=.15;item.bounds[4]-=.15;
  }
  add('목재 옷걸이 기둥',[5.50,6.46,.02,5.55,6.51,1.85],'#947a53','wood',true);
  add('옷걸이 십자 받침',[5.27,6.38,.025,5.78,6.60,.08],'#8d7452','wood');
  add('옷걸이 가로봉',[5.23,6.46,1.66,5.82,6.51,1.7],'#9c815a','wood');
  add('걸린 짙은 외투',[5.35,6.37,.65,5.65,6.61,1.68],'#384440','fabric');
  for(const x of [1.63,4.13])for(const y of [1.6,4.9])add('천장 조명 '+x+' '+y,[x-.5,y-.16,3.035,x+.5,y+.16,3.075],'#eff0e7','lamp');
  add('천장 에어컨',[2.45,3.02,2.95,3.50,4.07,3.08],'#e0e4db');
  add('에어컨 흡입구',[2.64,3.21,2.935,3.31,3.88,2.95],'#7d8d81');
  for(let i=0;i<9;i++)add('에어컨 격자 '+i,[2.65+i*.074,3.23,2.926,2.664+i*.074,3.86,2.936],'#bac7b9');
  return {roomId:room.id,room,boxes,colliders,chairs,spawn:{x:west+2.1,y:south+.62,z:floorZ},entryYaw:0,reference:GRADE5_RESEARCH_REFERENCE};
}
