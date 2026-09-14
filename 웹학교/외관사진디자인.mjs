// Photo-guided exterior finish, not a measured survey or a photographic texture.
// Original rooms, openings and Blender geometry remain authoritative.
export const EXTERIOR_PALETTE={wall:[.76,.65,.52],trim:[.48,.235,.16],roof:[.47,.5,.45],soil:[.61,.52,.41],mint:[.36,.65,.48],cream:[.81,.8,.59]};

export function exteriorRenderBox(box){
  if(box.name==='SPACE_EXT_PLAYGROUND'||box.name==='SPACE_EXT_PLAY_AREA')return {...box,color:EXTERIOR_PALETTE.soil,material:'soil'};
  if(box.name==='SiteGround')return {...box,color:[.48,.48,.41],material:'ground'};
  if(box.kind==='roof')return {...box,color:EXTERIOR_PALETTE.roof,material:'paint'};
  if(box.name.includes('SouthBand'))return {...box,color:EXTERIOR_PALETTE.trim,material:'paint'};
  if(box.name==='SPACE_EXT_ROSTRUM')return {...box,color:[.51,.63,.54],material:'paint'};
  // The new references show a mostly unmarked field. Preserve the goal locations.
  if(box.name.startsWith('운동장 임시 '))return null;
  return box;
}

export function exteriorSkins(boxes,data){
  const result=[];
  const add=(name,bounds,color,material,floor,extra={})=>result.push({name:'사진외관 '+name,bounds,color,material,floor,kind:'finish',...extra});
  // Skin only the OUTWARD face of existing cut backing panels. This follows
  // classroom windows and lobby openings rather than covering them with a sheet.
  for(const box of boxes){
    const match=box.name.match(/^([1-4])층 외피 보강 ([xy]),(-?[\d.]+),(-?1) /);
    if(!match)continue;
    const axis=match[2]==='x'?0:1,n=Number(match[4]),b=[...box.bounds];
    const outer=b[axis+(n>0?3:0)];
    b[axis]=outer+(n>0?.004:-.018);b[axis+3]=outer+(n>0?.018:-.004);
    add(box.name,b,EXTERIOR_PALETTE.wall,'facade',box.floor,{skinSource:box.name,skinAxis:axis,skinNormal:n});
  }
  // Window trim stays outside the envelope. Do not tint classroom interiors.
  const rooms=new Map(data.rooms.map(r=>[r.id,r]));
  for(const pane of data.boxes.filter(b=>b.name.startsWith('Window_'))){
    const room=rooms.get(pane.spaceId);if(!room)continue;
    const a=pane.bounds,axis=a[3]-a[0]<a[4]-a[1]?0:1,span=1-axis;
    const center=(a[axis]+a[axis+3])/2,lo=room.bounds[axis===0?0:2],hi=room.bounds[axis===0?1:3];
    const n=Math.abs(center-lo)<Math.abs(center-hi)?-1:1,c=(n<0?lo:hi)+n*.17;
    // The central entrance must remain entirely open.
    if(room.id==='1F_MAIN_LOBBY')continue;
    const base=[...a];base[axis]=c-.025;base[axis+3]=c+.025;
    for(const z of [a[2]-.08,a[5]]){const b=[...base];b[2]=z;b[5]=z+.08;add('창 적갈색 테두리 '+pane.name+z,b,EXTERIOR_PALETTE.trim,'paint',pane.floor);}
    for(const u of [a[span]-.04,a[span+3]]){const b=[...base];b[span]=u;b[span+3]=u+.04;add('창 세로틀 '+pane.name+u,b,EXTERIOR_PALETTE.trim,'paint',pane.floor);}
    const b=[...base],mid=(a[span]+a[span+3])/2;b[span]=mid-.018;b[span+3]=mid+.018;
    add('창 중앙 샷시 '+pane.name,b,[.66,.63,.55],'metal',pane.floor);
    // Existing special-room backing remains solid; an exterior-only glass face
    // depicts its source window. Real classroom openings remain transparent.
    if(room.type!=='classroom')add('특별실 외부 창면 '+pane.name,base,[.29,.37,.36],'glass',pane.floor);
  }
  return result;
}

export function courtyardDecor(){
  const result=[];
  const add=(name,bounds,color,material='paint',solid=false,extra={})=>result.push({name:'사진야외 '+name,bounds,color,material,kind:'finish',floor:0,collision:solid,...extra});
  const green=EXTERIOR_PALETTE.mint,steel=[.24,.36,.32];
  // Approximate green terraced seating / arched shade seen in the reference.
  // Keep the central entrance, rostrum and both existing football goals clear.
  function canopy(name,start,end,back,axis='x'){
    const map=(u0,v0,z0,u1,v1,z1)=>axis==='x'?[u0,v0,z0,u1,v1,z1]:[v0,u0,z0,v1,u1,z1];
    for(let step=0;step<3;step++){
      const front=back-3.1+step*.72;
      add(name+' 관람석 '+step,map(start,front,-.6,end,back,.04+step*.23),green,'paint',true);
    }
    const count=Math.ceil((end-start)/4.5),width=(end-start)/count;
    for(let i=0;i<=count;i++){
      const u=start+i*width;
      add(name+' 차양 기둥 '+i,map(u-.045,back-.1,-.6,u+.045,back,2.85),steel,'metal',true);
    }
    for(let i=0;i<count;i++)for(let j=0;j<12;j++){
      const v=back-3.5+(j+.5)*3.5/12,t=(j+.5)/12;
      const height=2.72+.48*Math.sin(Math.PI*t),slope=.48*Math.PI/3.5*Math.cos(Math.PI*t);
      add(name+' 곡면 차양 '+i+' '+j,map(start+i*width,v-.153,height-.025,start+(i+1)*width,v+.153,height+.025),
        i%3===1?EXTERIOR_PALETTE.cream:green,'paint',false,{rotation:axis==='x'?[Math.atan(slope),0,0]:[0,-Math.atan(slope),0]});
    }
    add(name+' 차양 앞 테두리',map(start,back-3.57,2.67,end,back-3.48,2.78),steel,'metal');
  }
  canopy('본관 왼쪽',0,36,-9.4);canopy('본관 오른쪽',54,84,-9.4);
  canopy('운동장 서쪽',-66,-25,-15,'y');
  // Repeated foliage is instanced; trunks and planter edges are solid.
  const trees=[];
  for(let x=2;x<=82;x+=8)if(x<38||x>52)trees.push([x,-9,1.1]);
  for(let x=-9;x<=85;x+=7)trees.push([x,-80,1.8]);
  for(let y=-71;y<=-17;y+=8)trees.push([-21,y,1.6]);
  for(const [i,[x,y,r]] of trees.entries()){
    add('수목 줄기 '+i,[x-.13,y-.13,-.6,x+.13,y+.13,2.5],[.32,.28,.2],'wood',true);
    for(let j=0;j<5;j++){
      const dx=Math.sin(i*2.3+j*2.1)*r*.55,dy=Math.cos(i*1.7+j*2.1)*r*.55,z=2.6+j*.26,rr=r*(.68+.07*(j%3));
      add('수관 '+i+' '+j,[x+dx-rr,y+dy-rr,z-rr*.5,x+dx+rr,y+dy+rr,z+rr*1.2],j%2?[.25,.34,.17]:[.29,.39,.21],'foliage',false,{shape:'sphere'});
    }
  }
  return result;
}
