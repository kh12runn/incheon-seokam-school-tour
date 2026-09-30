import {UPLOADED_CLASSROOM_PROFILES} from './업로드교실관찰.mjs';
import {class21Interior} from './이학년일반.mjs';
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function applyUploadedClassroom(config){
  const observed=UPLOADED_CLASSROOM_PROFILES[config.roomId];if(!observed)return config;
  const profile={...observed,...config.profile},room=config.room,frame=config.frame,floor=parseInt(room.floor),annex=room.building==='ANNEX';
  const replace=/사물함|뒤 게시판|공기청정기|중앙 화이트보드|높은 청소함|낮은 청소함|청소도구|책장| 사진 책 |정리바구니|교구 바구니| 실내 책가방| 충돌 책가방/;
  const boxes=config.boxes.filter(b=>!replace.test(b.name)).map(b=>{
    let hex,material=b.material;
    if(/의자 좌판|의자 등받이/.test(b.name)){
      const id=Number(b.name.match(/\d+$/)?.[0]??0),colors=profile.chairs;
      hex=colors.length===1?colors[0]:id%(profile.chairEvery??3)===0?colors[1+(Math.floor(id/3)%(colors.length-1))]:colors[0];material='paint';
    }
    if(/책상 다리|책상 발|의자 앞다리|의자 뒷다리|의자 다리|책상 서랍/.test(b.name))hex='#bbc5c3';
    if(/책상 상판/.test(b.name))hex=profile.desktopColor??'#c9b89a';
    if(/원목 마루/.test(b.name))hex='#bba98c';
    if(/하부벽|하부 /.test(b.name))hex=profile.lowerWall;
    if(/상부벽|흰 상부/.test(b.name))hex='#e4e7df';
    if(/녹색 칠판| 사진 칠판$/.test(b.name))hex='#2a5146';
    if(/벽걸이 화면$|모니터 화면$/.test(b.name))hex='#17282d';
    if(profile.desktopColor&&/흰 흡음 천장/.test(b.name)){hex='#e8eae2';material='staff_ceiling';}
    return hex?{...b,color:rgb(hex),material}:b;
  });
  const colliders=config.colliders.filter(b=>!replace.test(b.name));
  // 5-3 has separated places; 5-6 keeps the reference's three pairs.
  if(config.roomId==='3F_5-3'){
    const ys=[-5.90,-5.02,-3.72,-2.98,-1.65,-.85];
    const shifts=new Map(config.desks.map((d,i)=>[d.id,frame.point(0,ys[i%6]).y-d.y]));
    for(const list of [boxes,colliders])for(let i=0;i<list.length;i++){
      const b=list[i],m=b.name.match(/(?:책상|의자|공책).*?(\d+)$/);if(!m)continue;
      const dy=shifts.get(Number(m[1]));if(dy===undefined)continue;
      const bounds=[...b.bounds];bounds[1]+=dy;bounds[4]+=dy;list[i]={...b,bounds};
    }
    config={...config,desks:config.desks.map(d=>({...d,y:d.y+shifts.get(d.id)})),chairs:config.chairs.map(d=>({...d,y:d.y+shifts.get(d.id)}))};
  }
  const p=(...args)=>frame.point(...args);
  const localBounds=b=>{const a=p(...b.slice(0,3)),c=p(...b.slice(3));return [Math.min(a.x,c.x),Math.min(a.y,c.y),a.z,Math.max(a.x,c.x),Math.max(a.y,c.y),c.z];};
  const add=(name,b,hex,material='paint',solid=false)=>{
    const item={name:room.name+' 업로드사진 '+name,spaceId:room.id,interiorRoom:room.id,floor,kind:'detail',bounds:localBounds(b),color:rgb(hex),material};
    boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});return item;
  };
  // Keep original door/window geometry and seating aisles. Reconstruction counts
  // are approximate because some furniture is occluded in the phone photos.
  const rows=profile.locker==='green-double'?4:3,cols=9,top=rows===4?1.22:1.14;
  const split=profile.locker.startsWith('split');
  for(const [a,b] of split?[[-6.38,-4.47],[-2.55,-.70]]:[[-6.38,-.70]])add('뒤 수납 몸체 '+a,[9.33,a,.03,9.83,b,top],'#938673','wood',true);
  const handles=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    if(split&&col>=3&&col<6)continue;
    const width=5.63/cols,y=-6.35+col*width,h=.07+row*(top-.10)/rows;
    let color='#bfa174';
    if(['green-row','split'].includes(profile.locker)&&row===1||profile.locker==='green-double'&&(row===1||row===2))color='#a9bf6d';
    if(['checker','split-checker'].includes(profile.locker)&&(row+col)%2===0)color='#e2e1d3';
    if(profile.locker==='ivory')color=row%2?'#e4e2d5':'#cbb89b';
    if(profile.locker==='ivory-row'&&row===1)color='#e5e3d5';
    add('사물함 문 '+row+' '+col,[9.30,y,h,9.33,y+width-.027,h+(top-.10)/rows-.022],color,'wood');
    handles.push(p(9.285,y+width*.73,h+.16));
  }
  add('뒤 게시판 프레임',[9.75,-6.44,1.32,9.86,-.61,2.67],'#b3b6a5','metal');
  add('뒤 게시판 배경',[9.725,-6.38,1.38,9.75,-.67,2.62],profile.back==='black-grid'?'#d6ccae':'#b9d7d2');
  if(profile.board.startsWith('white'))add('칠판 중앙 흰 보드',[.265,profile.board==='white-wide'?-5.0:profile.board==='white-narrow'?-3.6:-4.2,1.0,.279,-2.15,2.36],'#eff0e7');
  // Two independent low bookcases; for the annex, flank its existing door.
  const shelfStarts=annex?[.45,7.35]:[5.1,7.15];
  for(const [bank,x] of shelfStarts.entries()){
    const width=annex?1.75:1.6,depth=annex?.51:.68,tall=profile.shelf==='orange-books'&&bank===1,height=tall?1.43:1.04,wood=tall?'#b88f50':'#b89d77';
    add('복도 책장 등판 '+bank,[x,-.22,.03,x+width,-.17,height-.01],wood,'wood');
    for(const h of tall?[.05,.36,.70,1.00,1.39]:[.05,.36,.70,1.00])add('책장 선반 '+bank+' '+h,[x,-depth,h,x+width,-.17,h+.032],wood,'wood');
    for(const a of [0,width/2,width-.035])add('책장 측판 '+bank+' '+a,[x+a,-depth,.04,x+a+.035,-.17,height],wood,'wood');
    colliders.push({name:room.name+' 업로드사진 낮은 책장 충돌 '+bank,spaceId:room.id,interiorRoom:room.id,floor,kind:'furniture',bounds:localBounds([x,-depth,0,x+width,-.17,height])});
    if(tall)for(let j=0;j<14;j++)add('윗줄 독서 책 '+j,[x+.06+j*.115,-depth+.06,1.04,x+.11+j*.115,-.29,1.3+(j%3)*.02],['#6995a3','#afc1a5','#d5bf8d'][j%3]);
    for(let j=0;j<12;j++)add('색색 책 '+bank+' '+j,[x+.07+j*(width-.16)/12,-depth+.06,.39,x+.12+j*(width-.16)/12,-.30,.62+(j%3)*.025],['#809a9e','#b4bda0','#c4a5a0','#d4c593'][j%4]);
    if(['yellow','orange-books','blue'].includes(profile.shelf))for(let j=0;j<3;j++)add('정리 바구니 '+bank+' '+j,[x+.06+j*.48,-depth+.05,.74,x+.45+j*.48,-.27,.96],profile.shelf==='blue'?'#9ebdc9':'#d8b942');
    else for(let j=0;j<4;j++)add('쌓인 활동지 '+bank+' '+j,[x+.10+j*.34,-depth+.06,.74,x+.39+j*.34,-.3,.79+j*.025],'#dbdfd5');
  }
  if(profile.shelf==='purple')add('보라색 별빛 가림천',[5.12,-.705,.14,6.68,-.69,1.12],'#674789','fabric');
  const extras=profile.extras??[];
  if(profile.desktopColor){
    for(let i=0;i<4;i++){
      const x=.4+i*2.37,low=[1.95,2.08,1.91,2.13][i];
      add('흰 롤블라인드 '+i,[x,-6.80,low,x+2.12,-6.78,2.34],'#e7e8df','staff_fabric');
      add('블라인드 아래 봉 '+i,[x,-6.815,low-.024,x+2.12,-6.773,low],'#c5cec4','metal');
      for(const z of [1.17,1.33])add('외창 안전봉 '+i+' '+z,[x,-6.71,z,x+2.12,-6.688,z+.02],'#bac7c2','metal');
    }
    for(let i=0;i<10;i++)add('천장 에어컨 흡입망 '+i,[4.61+i*.072,-3.93,2.908,4.63+i*.072,-3.22,2.918],'#c1cabe','metal');
    for(let i=0;i<5;i++)add('교탁 문서 더미 '+i,[.94,-5.26+i*.11,.856,1.34,-5.03+i*.11,.86+i*.012],'#e1e3d7');
  }
  if(extras.some(e=>e.startsWith('back-window-'))){
    const cream=extras.includes('back-window-cream');
    add('뒤 창가 키큰 수납장',[9.24,-6.82,.03,9.83,-6.4,2.19],cream?'#deddd0':'#b79d76',cream?'paint':'wood',true);
    for(const y of [-6.75,-6.57])add('키큰 수납장 손잡이 '+y,[9.205,y,.99,9.235,y+.023,1.16],'#85928d','metal');
    add('뒤 창가 낮은 목재 수납장',[8.42,-6.82,.03,9.18,-6.42,1.17],'#baa17b','wood',true);
    add('낮은 수납장 문 경계',[8.79,-6.423,.08,8.801,-6.414,1.13],'#87795f');
  }
  if(extras.includes('window-low-white'))add('창 아래 흰 수납장',[7.2,-6.81,.03,8.32,-6.38,.82],'#e4e5dc','paint',true);
  if(extras.includes('rear-color-bins'))for(let i=0;i<3;i++)add('뒤 분리수거함 '+i,[9.35,-.58,.03+i*.22,9.8,-.14,.24+i*.22],['#b3584c','#d0b74d','#8caa45'][i],'paint',true);
  if(profile.shelf==='games')for(const x of [5.22,7.28]){
    for(let i=0;i<7;i++)add('보드게임 상자 '+x+' '+i,[x,-.64,1.04+i*.047,x+.65-(i%3)*.04,-.22,1.082+i*.047],['#caa553','#729582','#b15f56','#4f778b','#dfd9bf'][i%5]);
    for(let i=0;i<3;i++)add('아래 정리 바구니 '+x+' '+i,[x+i*.46,-.62,.09,x+.4+i*.46,-.24,.3],['#b5c5bb','#dece73','#9dada5'][i]);
  }
  if(extras.includes('rear-cupboard')||extras.includes('rear-tall-cabinet')){
    const tall=extras.includes('rear-tall-cabinet');
    add('뒤 끝 목재 수납장',[9.30,-.65,.02,9.84,-.15,tall?2.2:1.38],profile.cabinetColor??'#b5a080','wood',true);
  }
  if(extras.includes('tall-front-cabinet'))add('앞 창가 회색 키큰 수납장',[.35,-6.80,.02,1.12,-6.24,2.35],'#7e898c','paint',true);
  if(extras.includes('sink')){
    add('뒤 창가 싱크대',[7.50,-6.79,.02,8.5,-6.28,.84],'#b8afa0','wood',true);
    add('싱크대 상판',[7.48,-6.82,.84,8.52,-6.24,.89],'#a5b6b5','metal');
    add('싱크대 물받이',[7.72,-6.69,.895,8.24,-6.4,.902],'#536969','metal');
    add('수도꼭지 기둥',[7.95,-6.75,.9,8,-6.70,1.14],'#b9c7c3','metal');
    add('수도꼭지',[7.95,-6.74,1.1,8,-6.55,1.145],'#b9c7c3','metal');
  }
  if(extras.includes('color-bins'))for(let i=0;i<3;i++)add('분리수거함 '+i,[.42,-.92,.02+i*.22,.92,-.45,.22+i*.22],['#88b849','#252c2c','#b85e51'][i],'paint',true);
  if(extras.includes('paper-rack'))for(let i=0;i<3;i++)add('흰 종이 정리대 '+i,[8.98,-.9,.06+i*.23,9.26,-.3,.22+i*.23],'#e1e4da','paint',true);
  if(extras.includes('window-whiteboard'))add('창가 이동 보드',[3.75,-6.80,.85,5.85,-6.75,1.94],'#e4e9e0','paint');
  if(extras.includes('slim-cabinet'))add('창가 좁은 키큰 수납장',[6.12,-6.78,.02,6.73,-6.37,2.15],'#b49b77','wood',true);
  if(extras.includes('window-bookcase')){
    add('창가 낮은 책장',[4.80,-6.79,.02,6.05,-6.50,.78],'#a78f6a','wood',true);
    for(let i=0;i<10;i++)add('창가 전시 작품 받침 '+i,[4.84+i*.115,-6.58,.79,4.94+i*.115,-6.56,1.10],'#e1e4d9');
  }
  if(extras.includes('clothes-rack')){
    for(const x of [3.85,5.38]){
      add('창가 옷걸이 기둥 '+x,[x,-6.70,.05,x+.035,-6.665,1.66],'#acbab9','metal',true);
      add('옷걸이 받침 '+x,[x-.13,-6.83,.025,x+.17,-6.50,.06],'#7b8d8d','metal');
    }
    add('창가 옷걸이 가로봉',[3.85,-6.70,1.62,5.415,-6.665,1.66],'#b7c4c1','metal');
  }
  if(extras.includes('presentation-stand')){
    add('복도쪽 발표 보드',[1.24,-.59,1.13,2.36,-.52,2.01],'#24343a','paint');
    for(const x of [1.40,2.15])add('발표 보드 받침 '+x,[x,-.55,.03,x+.04,-.50,1.15],'#717b75','metal',true);
  }
  if(extras.includes('lectern')&&!annex){
    add('이동 강연대 받침',[1.72,-3.18,.04,2.2,-2.61,.11],'#8c9899','metal',true);
    add('이동 강연대 기둥',[1.91,-2.98,.10,1.98,-2.81,1.1],'#b8c0b8','metal',true);
    add('이동 강연대 상판',[1.69,-3.23,1.1,2.24,-2.57,1.145],'#aa9677','wood');
  }
  const rear=profile.purifier.startsWith('rear'),[u,v]=profile.purifierPosition??[rear?8.56:.45,rear?-6.36:-1.78];
  add('공기청정기',[u,v,.02,u+.50,v+.48,.96],'#d8dfd6','paint',true);
  add('공기청정기 전면',[u+.502,v+.04,.14,u+.518,v+.44,.81],profile.purifier.includes('blue')?'#213e56':'#a3afac');
  for(let i=0;i<8;i++)add('공기청정기 흡입구 '+i,[u+.520,v+.055,.23+i*.055,u+.527,v+.42,.24+i*.055],'#627773');
  // Detail meshes use this frame to orient correctly in both building wings.
  const photoDetails={handles,uploaded:true,frame,profile};
  return {...config,profile,boxes,colliders,photoDetails,photoCount:profile.photoCount,seatCountIsApproximate:true};
}

export function uploadedAnnexClassrooms(data){
  return data.rooms.filter(r=>r.building==='ANNEX'&&UPLOADED_CLASSROOM_PROFILES[r.id]).map(room=>{
    const base=class21Interior({rooms:[{...room,id:'4F_2-1'}]});
    const [x0,x1,y0,y1,z]=room.bounds;
    // 2-1's photographed envelope is 6.75m long; these two rooms are 7m.
    // Extend only its rear lining/floor, never shift the actual corridor door.
    const convert=b=>{
      const bounds=[...b.bounds],extra=y1-y0-6.75;
      if(/밝은 타일 바닥|흰 천장/.test(b.name))bounds[1]-=extra;
      if(/앞뒤|걸레받이/.test(b.name)&&bounds[4]<y1-6.5){bounds[1]-=extra;bounds[4]-=extra;}
      return {...b,bounds,name:b.name.replace(/^2-1/,room.name),spaceId:room.id,interiorRoom:room.id};
    };
    const frame={width:y1-y0,depth:x1-x0,z,point:(x,y,h=0)=>base.point(x*(y1-y0)/10,-y*(x1-x0)/7,h)};
    const config={...base,roomId:room.id,room,frame,profile:UPLOADED_CLASSROOM_PROFILES[room.id],boxes:base.boxes.map(convert),colliders:base.colliders.map(convert),entry:{x:x1+1.5,y:base.spawn.y,z},yaw:0};
    return applyUploadedClassroom(config);
  });
}
