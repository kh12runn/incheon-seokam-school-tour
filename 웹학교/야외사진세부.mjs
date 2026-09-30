// Approved OTHER_MISC photographs, 2026-09-30. Placement follows the owner's
// directions; all dimensions are photo-guided estimates, not survey geometry.
export const OUTDOOR_PHOTO_IDS=['414b2f87-7aae-42a9-ba04-e661de00f03f','700af775-b3a6-4c79-9c43-129093467f19','ac3f6a9e-c7cc-4e0e-bcaf-9c9799f9b71d'];
const white=[.89,.9,.87],blue=[.04,.36,.75],steel=[.36,.42,.43],yellow=[.96,.72,.08];

export function addGatePhotoDetails(boxes,colliders,surfaces,base){
  const terrain=surfaces.filter(s=>s.name.startsWith('정문 경사지'));
  const height=(x,y)=>terrain.find(s=>x>=s.bounds[0]&&x<=s.bounds[3]&&y>=s.bounds[1]&&y<=s.bounds[4])?.height(x,y)??base;
  const add=(name,bounds,color,material='paint',solid=false,extra={})=>{
    const b={name:'정문 사진 '+name,bounds,color,material,kind:'finish',floor:0,...extra};boxes.push(b);if(solid)colliders.push(b);return b;
  };
  // Split thin surface finishes at the original terrain grid, matching its slope.
  function patch(name,rect,color,material='paint'){
    for(const [i,s] of terrain.entries()){
      const a=s.bounds,x0=Math.max(rect[0],a[0]),y0=Math.max(rect[1],a[1]),x1=Math.min(rect[2],a[3]),y1=Math.min(rect[3],a[4]);
      if(x1<=x0||y1<=y0)continue;
      const hs=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>s.height(x,y)+.018);
      add(name+' '+i,[x0,y0,Math.min(...hs)-.012,x1,y1,Math.max(...hs)],color,material,false,{shape:'terrain',heights:hs});
    }
  }
  patch('붉은 보행 구역',[-15,-23,-2.4,-16.5],[.60,.23,.26],'rubber_mat');
  patch('노란 유도 블록',[-23.5,-11.6,29,-11.22],yellow,'tactile_mat');
  patch('현관 유도 블록',[-11.25,-11.6,-10.85,-7.3],yellow,'tactile_mat');
  patch('보행 구역 흰 경계',[-15,-16.65,-2.4,-16.5],white);
  patch('경사로 하부 배수로',[-2.35,-16,-2.02,-10.6],[.20,.24,.24],'metal');
  for(let y=-15.95;y<-10.6;y+=.18)patch('배수로 격자 '+y,[-2.34,y,-2.03,y+.035],[.53,.57,.55],'metal');

  // Gate opens toward +X: MAIN is on the left (+Y), ANNEX straight ahead.
  for(const y of [-16.7,-11.0]){
    add('화강석 문주 '+y,[-18.25,y,base,-17.55,y+.7,base+2.35],[.55,.57,.56],'facade',true);
    add('문주 덮개 '+y,[-18.36,y-.1,base+2.35,-17.44,y+.8,base+2.48],[.70,.72,.69],'facade');
    for(let z=.4;z<2.3;z+=.4)add('문주 줄눈 '+y+z,[-18.26,y-.006,base+z,-17.54,y+.706,base+z+.017],[.42,.44,.42]);
    // Leaves are folded along the approach, never across the walking opening.
    const v=y+.35;
    add('열린 파란 철문 아래틀 '+y,[-21.1,v-.06,base+.15,-18.3,v+.06,base+.24],blue,'metal',true);
    add('열린 파란 철문 위틀 '+y,[-21.1,v-.06,base+1.75,-18.3,v+.06,base+1.84],blue,'metal');
    for(let x=-21.05;x<-18.3;x+=.22)add('철문 세로살 '+y+x,[x,v-.035,base+.24,x+.055,v+.035,base+1.75],blue,'metal',true);
  }
  const booth=[-22.5,-10.45,base,-19,-7.4,base+2.45];
  const mirrorZ=height(-18.8,-17.7);
  add('반사경 주황 기둥',[-18.85,-17.75,mirrorZ,-18.75,-17.65,mirrorZ+2.3],[.89,.31,.08],'metal',true);
  add('반사경 주황 테두리',[-18.94,-18.10,mirrorZ+1.9,-18.70,-17.30,mirrorZ+2.7],[.94,.36,.08],'paint',false,{shape:'sphere'});
  add('반사경 은색 면',[-18.70,-18.02,mirrorZ+1.98,-18.66,-17.38,mirrorZ+2.62],[.68,.78,.79],'metal',false,{shape:'sphere'});
  add('차단기 노란 함',[-16.9,-11.0,base,-16.45,-10.55,base+1.1],yellow,'metal',true);
  add('올린 차단봉',[-16.67,-10.80,base+1.1,-16.59,-10.72,base+3.3],white,'metal');
  for(let z=1.4;z<3.3;z+=.45)add('차단봉 빨간 띠 '+z,[-16.68,-10.81,base+z,-16.58,-10.71,base+z+.17],[.81,.16,.12]);
  add('초록 초소',booth,[.39,.67,.13],'paint',true);
  add('초소 지붕',[-22.7,-10.65,base+2.45,-18.8,-7.2,base+2.62],[.16,.32,.25],'metal');
  add('초소 노란 간판 띠',[-22.65,-10.67,base+2.23,-18.85,-10.58,base+2.48],yellow);
  add('초소 정면 창틀',[-22.15,-10.50,base+1.02,-19.35,-10.46,base+2.12],white,'metal');
  add('초소 정면 유리',[-22.07,-10.515,base+1.10,-19.43,-10.50,base+2.04],[.20,.32,.34],'glass');
  for(const x of [-21.2,-20.3])add('초소 창 샷시 '+x,[x,-10.53,base+1.04,x+.055,-10.515,base+2.1],white,'metal');
  add('초소 옆 창틀',[-18.99,-9.95,base+.95,-18.96,-8.0,base+2.10],white,'metal');
  add('초소 옆 유리',[-18.95,-9.86,base+1.04,-18.93,-8.09,base+2.01],[.20,.32,.34],'glass');
  add('초소 안내판',[-21.9,-10.54,base+.35,-19.8,-10.51,base+.85],white);
  for(let i=0;i<4;i++)add('초소 안내판 인쇄 '+i,[-21.72,-10.55,base+.43+i*.08,-20.0,-10.54,base+.46+i*.08],[.18,.41,.52]);

  // Cladding remains outside the hall opening, preserving its existing access.
  for(const [left,right] of [[-17,-12.3],[-9.7,-5]])for(let x=left;x<right;x+=1.05)for(let z=0;z<2.8;z+=.56)
    add('현관 석재 '+x+' '+z,[x+.014,-7.22,base+z+.014,Math.min(x+1.03,right),-7.12,base+z+.54],[.71,.73,.72],'facade');
  for(const x of [-12.28,-9.80])add('현관 금속 문틀 '+x,[x,-7.31,base,x+.08,-7.19,base+2.58],[.28,.32,.33],'metal');
  add('현관 문틀 상부',[-12.28,-7.31,base+2.5,-9.72,-7.19,base+2.60],[.28,.32,.33],'metal');
  const awning=add('파란 현관 차양',[-14.25,-9.3,base+2.56,-7.8,-7.20,base+3.08],blue,'metal');
  awning.shape='terrain';awning.heights=[base+2.67,base+2.67,base+3.08,base+3.08];
  for(let x=-14.2;x<-7.8;x+=1.05)add('차양 세로 이음 '+x,[x,-9.31,base+2.64,x+.035,-9.27,base+2.7],[.57,.67,.73],'metal');
  add('현관 노란 안내판',[-8.95,-7.25,base+1.05,-7.8,-7.23,base+1.55],yellow);
  add('현관 안내 녹색 표시',[-8.87,-7.27,base+1.12,-8.55,-7.25,base+1.4],[.04,.43,.28]);

  for(let x=-2;x<26;x+=2){
    const a=height(x,-10.2),b=height(x+2,-10.2);
    const wall=add('경사로 북측 흰 벽 '+x,[x,-10.35,Math.min(a,b)-.12,x+2,-10.15,Math.max(a,b)+.78],white,'paint',true);
    wall.shape='terrain';wall.heights=[a+.78,b+.78,b+.78,a+.78];
  }
  for(let x=1;x<26;x+=3){
    const z=height(x,-8.6);
    add('본관 화단 '+x,[x-.9,-9.9,z,x+.9,-7.6,z+.45],[.63,.66,.58],'facade',true);
    for(const dx of [-.5,.4])add('본관 둥근 관목 '+x+dx,[x+dx-.55,-9.8,z+.35,x+dx+.55,-8.1,z+1.2],[.24,.39,.10],'foliage',false,{shape:'sphere'});
  }
  // Right-hand red patio: brick wall, planting rocks, noticeboard and cones.
  for(let x=-14;x<-3;x+=1){
    const z=height(x,-23);
    add('붉은 담장 '+x,[x,-23.25,z-.08,x+1,-23.02,z+2.4],[.52,.23,.18],'facade',true);
    add('담장 모자돌 '+x,[x-.03,-23.32,z+2.4,x+1.03,-22.96,z+2.5],[.38,.24,.22]);
    for(let row=0;row<9;row++)add('담장 가로 줄눈 '+x+row,[x,-23.01,z+.18+row*.25,x+1,-22.99,z+.195+row*.25],[.68,.51,.44]);
    add('화단 자연석 '+x,[x,-22.8,z,x+.85,-21.8,z+.7],[.49,.51,.47],'facade',false,{shape:'sphere'});
    add('담장 관목 '+x,[x-.1,-22.9,z+.4,x+1,-21.8,z+1.25],[.22,.36,.10],'foliage',false,{shape:'sphere'});
  }
  const nz=height(-6,-20.9);
  for(const x of [-7,-5])add('게시판 다리 '+x,[x,-21.1,nz,x+.09,-21,nz+1.9],steel,'metal',true);
  add('게시판 테두리',[-7.1,-21.22,nz+.65,-4.9,-20.98,nz+1.9],steel,'metal',true);
  add('게시판 흰 면',[-6.99,-20.96,nz+.77,-5.01,-20.93,nz+1.79],white);
  add('게시판 지붕',[-7.25,-21.42,nz+1.91,-4.75,-20.75,nz+2.02],[.32,.45,.47],'metal');
  for(const x of [-6.85,-5.92])add('게시판 공지 '+x,[x,-20.92,nz+.90,x+.78,-20.9,nz+1.61],[.40,.65,.77]);
  for(const [i,[x,y]] of [[-3.2,-17.6],[-4.4,-17.7],[-9,-18.5]].entries()){
    const z=height(x,y);add('안전콘 받침 '+i,[x-.23,y-.23,z,x+.23,y+.23,z+.07],[.21,.23,.23]);
    for(let n=0;n<8;n++){const r=.19-n*.02;add('안전콘 '+i+' '+n,[x-r,y-r,z+.07+n*.10,x+r,y+r,z+.17+n*.10],n===4||n===6?white:[.96,.24,.04]);}
  }
  const uz=height(-3.1,-19.2);
  add('접힌 파라솔 받침',[-3.5,-19.6,uz,-2.7,-18.8,uz+.1],[.16,.19,.19],'metal',true);
  add('접힌 파라솔 봉',[-3.14,-19.24,uz,-3.06,-19.16,uz+3.1],steel,'metal');
  add('접힌 파라솔 천',[-3.32,-19.42,uz+1,-2.88,-18.98,uz+3.3],[.08,.22,.20],'paint');
}

export function playgroundPhotoDetails(){
  const boxes=[];
  const add=(name,bounds,color,material='paint',collision=false,extra={})=>boxes.push({name:'사진야외 보완 '+name,bounds,color,material,kind:'finish',floor:0,collision,...extra});
  // Fence behind the visible perimeter planting, outside the playing area.
  for(const axis of ['south','west']){
    const map=(u,v,z,uu,vv,zz)=>axis==='south'?[u,v,z,uu,vv,zz]:[v,u,z,vv,uu,zz];
    const start=axis==='south'?-21:-79,end=axis==='south'?88:-42,back=axis==='south'?-83:-22.8;
    for(let u=start;u<end;u+=2.8)add('울타리 기둥 '+axis+u,map(u,back,-.6,u+.075,back+.075,1.8),[.43,.65,.36],'metal',true);
    for(const z of [.05,1.65])add('울타리 가로대 '+axis+z,map(start,back,z,end,back+.055,z+.07),[.43,.65,.36],'metal');
    for(let u=start;u<end;u+=.32)add('울타리 세로살 '+axis+u,map(u,back,.1,u+.035,back+.04,1.65),[.43,.65,.36],'metal');
  }
  for(const x of [24,28])for(const y of [-78,-74])add('쉼터 기둥 '+x+y,[x-.08,y-.08,-.6,x+.08,y+.08,2.3],[.37,.25,.15],'wood',true);
  add('쉼터 지붕',[23.6,-78.4,2.3,28.4,-73.6,2.5],[.30,.37,.27]);
  add('쉼터 뒤 벤치',[24.15,-77.8,-.1,27.85,-77.3,.36],[.45,.32,.20],'wood',true);
  add('쉼터 옆 벤치',[24.1,-77.2,-.1,24.6,-74.2,.36],[.45,.32,.20],'wood',true);
  for(let i=0;i<5;i++){
    const x=3+i*3.6,y=-76;
    add('운동기구 기둥 '+i,[x-.055,y-.055,-.6,x+.055,y+.055,1.2],[.67,.72,.72],'metal',true);
    for(const dx of [-.6,.6]){
      add('운동기구 손잡이 '+i+dx,[x+dx-.04,y-.055,.85,x+dx+.04,y+.055,1.6],[.35,.49,.65],'metal');
      add('운동기구 손잡이 연결 '+i+dx,[Math.min(x,x+dx),y-.05,1.05,Math.max(x,x+dx),y+.05,1.12],[.67,.72,.72],'metal');
      add('운동기구 발판 '+i+dx,[x+dx-.22,y-.35,-.2,x+dx+.22,y+.35,-.1],[.20,.29,.36],'metal',true);
    }
  }
  add('흰 창고',[65,-78,-.6,72,-73,2.15],[.82,.83,.77],'paint',true);
  add('창고 지붕',[64.8,-78.2,2.15,72.2,-72.8,2.28],[.36,.39,.34],'metal');
  add('창고 회색 문',[67.8,-72.99,-.59,69.3,-72.94,1.5],[.51,.56,.55],'metal');
  add('창고 문 손잡이',[69.08,-72.92,.2,69.14,-72.84,.45],[.25,.28,.28],'metal');
  // Visible white field marks; keep them on the flat field, away from gate grade.
  for(const y of [-64,-45])add('흰 경기장 가로선 '+y,[16,y,-.29,60,y+.10,-.282],[.88,.89,.83],'chalk');
  for(const x of [16,60])add('흰 경기장 세로선 '+x,[x,-64,-.29,x+.10,-45,-.282],[.88,.89,.83],'chalk');
  return boxes;
}
