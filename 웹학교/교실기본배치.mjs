// Frozen 2026-09-10 layout reference. Per-room photo changes belong in room adapters,
// not here: updating 6-4 must not silently restyle all other classrooms.
const CLASS64_ID='4F_6-4';
export function classroomReferenceInterior(data){
  const room=data.rooms.find(r=>r.id===CLASS64_ID);if(!room)return {boxes:[],colliders:[],desks:[],chairs:[]};
  const z=room.bounds[4],boxes=[],colliders=[],desks=[],chairs=[];
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const add=(name,b,color,material='paint')=>{const box={name:'6-4 실내 '+name,spaceId:CLASS64_ID,floor:4,kind:'detail',bounds:[b[0],b[1],z+b[2],b[3],b[4],z+b[5]],color:rgb(color),material};boxes.push(box);return box;};
  const solid=(name,b)=>colliders.push({name:'6-4 충돌 '+name,spaceId:CLASS64_ID,floor:4,kind:'furniture',bounds:[b[0],b[1],z+b[2],b[3],b[4],z+b[5]]});
  const cream='#e6e4db',sage='#b4c6ba',wood='#c7ab8a',steel='#889799';
  add('원목 마루',[30.11,-6.89,.003,39.89,-.11,.015],'#c8a888','room_floor');
  add('흰 흡음 천장',[30.11,-6.89,3.125,39.89,-.11,3.14],'#e8e6df','paint').kind='ceiling';
  for(const [x0,x1] of [[30.105,30.145],[39.855,39.895]]){
    add('앞뒤 하부벽',[x0,-6.89,.015,x1,-.11,1.05],sage);
    add('앞뒤 상부벽',[x0,-6.89,1.05,x1,-.11,3.13],cream);
    add('앞뒤 걸레받이',[x0,-6.89,.015,x1+.016,-.11,.13],wood,'wood');
  }
  add('창 아래 하부벽',[30.15,-6.885,.015,39.85,-6.85,.93],sage);
  add('창 위 상부벽',[30.15,-6.885,2.36,39.85,-6.85,3.13],cream);
  for(const [a,b] of [[30.15,32.84],[34.16,39.85]]){
    add('복도쪽 하부벽',[a,-.15,.015,b,-.105,1.04],sage);
    add('복도쪽 상부벽',[a,-.15,1.04,b,-.105,3.13],cream);
    add('복도쪽 걸레받이',[a,-.18,.015,b,-.105,.13],wood,'wood');
  }
  // Interior-facing frosted corridor panels do not cut or alter the corridor shell.
  for(const [a,b] of [[30.55,32.65],[34.45,36.45],[36.7,38.8]]){
    add('나무창틀',[a,-.215,1.04,b,-.16,2.73],wood,'wood');
    add('반투명 복도창',[a+.06,-.226,1.12,b-.06,-.217,2.3],'#c1cdcd');
    add('윗창',[a+.06,-.226,2.39,b-.06,-.217,2.66],'#c5d0cc');
    add('창 세로틀',[(a+b)/2-.035,-.24,1.05,(a+b)/2+.035,-.225,2.72],wood,'wood');
  }
  // Front = x30; exterior windows on the pupils' left, corridor doors on their right.
  add('칠판 알루미늄 테두리',[30.15,-5.75,.89,30.245,-1.02,2.43],'#b2b9b4','metal');
  add('녹색 칠판',[30.247,-5.68,.96,30.259,-1.09,2.36],'#315e52');
  add('분필 받침',[30.25,-5.78,.87,30.43,-1.0,.93],'#bec7c3','metal');
  for(let i=0;i<3;i++)add('분필 '+i,[30.29,-3.5+i*.13,.936,30.35,-3.43+i*.13,.954],'#f4eee1');
  add('앞 안내게시판',[30.15,-.94,1.08,30.25,-.27,2.37],'#d1bd69','wood');
  add('뒤 게시판 테두리',[39.73,-6.43,1.29,39.86,-.64,2.66],'#cdbb75','wood');
  add('뒤 게시판',[39.713,-6.35,1.37,39.73,-.72,2.58],'#e5e6da');
  // Beige / ivory checkerboard lockers, round latches added by the detail renderer.
  add('사물함 몸체',[39.30,-6.40,.04,39.85,-.70,1.15],'#888d88');solid('사물함',[39.30,-6.40,0,39.85,-.70,1.16]);
  for(let row=0;row<3;row++)for(let col=0;col<8;col++){
    const y=-6.36+col*.705,h=.08+row*.35;
    add(`사물함 문 ${row}-${col}`,[39.275,y,h,39.30,y+.675,h+.325],(col+row)%2?'#dedcd2':'#ceb69a','wood');
  }
  // Low open shelves with yellow trays along the corridor side.
  for(const x of [35.2,37.2]){
    add('책장 뒤판',[x,-.57,.02,x+1.65,-.17,1.02],wood,'wood');
    add('책장 내부',[x+.05,-.595,.1,x+1.6,-.575,.94],'#766e59');
    for(const h of [.07,.40,.72,.99])add('책장 선반',[x,-.72,h,x+1.65,-.16,h+.04],wood,'wood');
    for(const a of [0,.80,1.60])add('책장 세로판',[x+a,-.72,.05,x+a+.05,-.16,1.04],wood,'wood');
    for(let i=0;i<4;i++)add('노란 정리바구니',[x+.1+i*.38,-.70,.77,x+.42+i*.38,-.22,.96],'#e1c13a');
    for(let i=0;i<10;i++)add('책장 책 '+i,[x+.1+i*.13,-.705,.45,x+.17+i*.13,-.40,.65+(i%3)*.025],['#93b4ac','#e5d0b5','#b7c0d1'][i%3]);
    solid('낮은 책장',[x,-.72,0,x+1.65,-.16,1.04]);
  }
  // 24 places, reconstructed as 4 rows of 3 pairs; exact count is not measurable from occluded photos.
  const ys=[-5.75,-5.03,-3.72,-3.0,-1.69,-.97];
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){
    const x=34.15+row*1.15,y=ys[col],id=row*6+col+1;
    desks.push({id,x,y});chairs.push({id,x:x+.52,y});
    add(`책상 테두리 ${id}`,[x-.30,y-.345,.715,x+.30,y+.345,.76],'#383e3e');
    add(`책상 상판 ${id}`,[x-.284,y-.33,.762,x+.284,y+.33,.79],'#d2ba96','wood');
    add(`책상 서랍 ${id}`,[x-.23,y-.27,.59,x+.23,y+.27,.68],'#616f70','metal');
    for(const side of [-1,1]){
      add(`책상 다리 ${id}`,[x-.035,y+side*.285-.025,.045,x+.035,y+side*.285+.025,.72],steel,'metal');
      add(`책상 발 ${id}`,[x-.28,y+side*.285-.033,.025,x+.28,y+side*.285+.033,.065],steel,'metal');
    }
    solid(`책상 ${id}`,[x-.30,y-.345,0,x+.30,y+.345,.79]);
    const cx=x+.52,seat=(id===6||id===15||id===20)?'#a3b536':'#b88f50';
    add(`의자 좌판 ${id}`,[cx-.21,y-.245,.405,cx+.21,y+.245,.45],seat,'wood');
    add(`의자 등받이 ${id}`,[cx+.20,y-.24,.60,cx+.24,y+.24,.85],seat,'wood');
    for(const side of [-1,1]){
      add(`의자 앞다리 ${id}`,[cx-.17,y+side*.20-.018,.025,cx-.135,y+side*.20+.018,.43],steel,'metal');
      add(`의자 뒷다리 ${id}`,[cx+.17,y+side*.20-.018,.025,cx+.205,y+side*.20+.018,.82],steel,'metal');
    }
    solid(`의자 ${id}`,[cx-.21,y-.245,0,cx+.24,y+.245,.85]);
    if(id%4!==0)add(`공책 ${id}`,[x-.13,y-.12,.793,x+.11,y+.1,.81],['#f0d679','#dc9caf','#9bc9c0'][id%3]);
    if(id%3===1){add(`책가방 ${id}`,[cx+.245,y-.14,.13,cx+.37,y+.14,.52],['#555a60','#753d49','#d9d7cc'][id%3]);solid(`책가방 ${id}`,[cx+.245,y-.14,0,cx+.37,y+.14,.52]);}
  }
  add('교탁 상판',[30.75,-5.55,.78,31.70,-3.70,.85],'#bf9d73','wood');
  add('교탁 본체',[30.82,-5.49,.05,31.62,-3.76,.78],'#b79a77','wood');solid('교탁',[30.75,-5.55,0,31.70,-3.70,.85]);
  add('컴퓨터 모니터',[30.94,-4.57,.93,31.08,-3.99,1.34],'#30393b');
  add('모니터 화면',[31.082,-4.53,.97,31.087,-4.03,1.30],'#95b4c1');
  add('교사용 검정의자',[30.40,-4.90,.35,30.73,-4.36,.90],'#353c3c');solid('교사용 의자',[30.4,-4.9,0,30.73,-4.36,.9]);
  add('벽걸이 화면 테두리',[31.0,-6.72,1.86,32.33,-6.55,2.65],'#333c42');
  add('벽걸이 화면',[31.055,-6.54,1.91,32.275,-6.535,2.59],'#b8c9d5');
  add('공기청정기',[30.45,-2.25,0,30.92,-1.68,.90],'#dedfd9');
  add('공기청정기 상단',[30.46,-2.24,.90,30.91,-1.69,.94],'#343b3a');solid('공기청정기',[30.45,-2.25,0,30.92,-1.68,.94]);
  for(const x of [32.0,35.2,38.0])for(const y of [-5.15,-2.0]){
    add('천장 조명틀',[x-.57,y-.20,3.05,x+.57,y+.20,3.12],'#d6dcd8');
    add('천장 LED',[x-.52,y-.15,3.04,x+.52,y+.15,3.055],'#f4f5e9','lamp');
  }
  add('천장 냉난방기',[34.4,-4.15,2.94,35.55,-3.0,3.12],'#d6ccb9');
  add('천장 냉난방기 흡입구',[34.6,-3.95,2.92,35.35,-3.2,2.94],'#6d7470');
  return {boxes,colliders,desks,chairs,roomId:CLASS64_ID,seatCount:24,seatCountIsApproximate:true};
}
