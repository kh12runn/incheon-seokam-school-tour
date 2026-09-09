// Window/cabinet spans shared by rendering and collision tests.
export function windowBays(data,floor){
  const panes=data.boxes.filter(b=>b.floor===floor&&b.name.includes('_NorthGlass')).sort((a,b)=>a.bounds[0]-b.bounds[0]);
  const bays=[];
  for(const pane of panes){
    const [x0,,,x1]=pane.bounds,last=bays.at(-1);
    if(last&&x0-last[1]<.16)last[1]=x1;else bays.push([x0,x1]);
  }
  const occupied=data.rooms.filter(r=>r.floor===floor+'F'&&r.bounds[2]===3);
  let result=bays;
  for(const room of occupied){
    const lo=room.bounds[0]-.12,hi=room.bounds[1]+.12;
    result=result.flatMap(([a,b])=>b<=lo||a>=hi?[[a,b]]:[[a,Math.min(b,lo)],[Math.max(a,hi),b]].filter(([x,y])=>y-x>.3));
  }
  return result;
}
export function windowOpenings(data,floor){
  const z=(floor-1)*data.floorHeight;
  return windowBays(data,floor).map(([a,b])=>[a,2.80,z+.97,b,3.22,z+2.67]);
}

export function subtractBox(box,cut){
  const a=box.bounds,lo=[0,1,2].map(i=>Math.max(a[i],cut[i])),hi=[0,1,2].map(i=>Math.min(a[i+3],cut[i+3]));
  if(lo.some((v,i)=>hi[i]<=v))return [box];
  const parts=[
    [a[0],a[1],a[2],lo[0],a[4],a[5]],[hi[0],a[1],a[2],a[3],a[4],a[5]],
    [lo[0],a[1],a[2],hi[0],lo[1],a[5]],[lo[0],hi[1],a[2],hi[0],a[4],a[5]],
    [lo[0],lo[1],a[2],hi[0],hi[1],lo[2]],[lo[0],lo[1],hi[2],hi[0],hi[1],a[5]]
  ];
  return parts.filter(b=>b[3]-b[0]>.00001&&b[4]-b[1]>.00001&&b[5]-b[2]>.00001).map((bounds,i)=>({...box,name:box.name+' 창 개구부 '+i,bounds}));
}
export function openMainWindows(data,boxes,colliders){
  const openings=[1,2,3,4].flatMap(floor=>windowOpenings(data,floor));
  const replacements=new Map();
  for(const box of boxes){
    if(box.name.includes('사진참고')||box.name.includes('엘리베이터'))continue;
    if(box.bounds[1]>3.22||box.bounds[4]<2.8||box.bounds[2]>13.1)continue;
    let parts=[box];
    for(const cut of openings)parts=parts.flatMap(p=>subtractBox(p,cut));
    if(parts.length!==1||parts[0]!==box)replacements.set(box,parts);
  }
  const replace=list=>{const next=list.flatMap(b=>replacements.get(b)??[b]);list.splice(0,list.length,...next);};
  replace(boxes);replace(colliders);
  for(const [i,bounds] of openings.entries()){
    // Invisible glazing collision remains even though the outside is visible.
    colliders.push({name:'창문 충돌막 '+i,bounds:[bounds[0],2.99,bounds[2],bounds[3],3.06,bounds[5]],kind:'window_collision'});
  }
  return openings;
}

export function classroomWindows(data){
  const rooms=new Map(data.rooms.filter(r=>r.type==='classroom').map(r=>[r.id,r]));
  return data.boxes.filter(b=>b.name.startsWith('Window_')&&rooms.has(b.spaceId)).flatMap(pane=>{
    const room=rooms.get(pane.spaceId),b=pane.bounds;
    const south=room.building==='MAIN'&&room.bounds[3]===0&&Math.abs((b[1]+b[4])/2-room.bounds[2])<.3;
    const west=room.building==='ANNEX'&&Math.abs((b[0]+b[3])/2-room.bounds[0])<.3;
    if(!south&&!west)return [];
    const cut=south?[b[0]+.04,room.bounds[2]-.23,b[2]+.03,b[3]-.04,room.bounds[2]+.2,b[5]-.03]
      :[room.bounds[0]-.23,b[1]+.04,b[2]+.03,room.bounds[0]+.2,b[4]-.04,b[5]-.03];
    return [{pane,room,cut,south}];
  });
}
export function openClassroomWindows(data,boxes,colliders,addBox){
  const windows=classroomWindows(data),replacements=new Map();
  for(const box of boxes){
    // Split only existing exterior walls/glazing where source classroom panes are.
    if(box.name.includes('사진참고')||box.name.includes('엘리베이터'))continue;
    let parts=[box];
    for(const {cut} of windows)parts=parts.flatMap(p=>subtractBox(p,cut));
    if(parts.length!==1||parts[0]!==box)replacements.set(box,parts);
  }
  for(const list of [boxes,colliders]){const next=list.flatMap(b=>replacements.get(b)??[b]);list.splice(0,list.length,...next);}
  for(const {pane,room,cut,south} of windows){
    const b=[...cut],c=south?room.bounds[2]:room.bounds[0],axis=south?1:0;
    b[axis]=c-.018;b[axis+3]=c+.018;
    addBox('교실창 투명유리 '+pane.name,b,[.85,.93,.91],'finish',pane.floor);
    colliders.push({name:'교실창 충돌막 '+pane.name,bounds:b,kind:'window_collision'});
    const span=south?0:1,frame=(name,a)=>addBox('교실창 알루미늄 '+pane.name+name,a,[.73,.75,.74],'finish',pane.floor);
    for(const z of [b[2]-.035,b[5]]){const a=[...b];a[2]=z;a[5]=z+.035;a[axis]=c-.045;a[axis+3]=c+.045;frame(' 가로 '+z,a);}
    for(const x of [b[span]-.035,b[span+3]]){const a=[...b];a[span]=x;a[span+3]=x+.035;a[axis]=c-.045;a[axis+3]=c+.045;frame(' 세로 '+x,a);}
  }
  return windows;
}
