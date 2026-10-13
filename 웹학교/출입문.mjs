// Blender coordinates. The moving leaf is shared by rendering and collision.
const R=.28,THICK=.065,OPEN=Math.PI*.48;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Legacy upper-volume records: their old lintels meet the stair enclosure / 3-4
// classroom, NOT a corridor. The accessible multipurpose hall is B1_MAIN_HALL.
// Do not punch doors through the stair shaft or through a neighbouring class.
export const NON_CORRIDOR_SPACES=['1F_STORAGE_2','1F_MULTIPURPOSE'];
export function doorLayouts(data){
  const result=[];
  for(const room of data.rooms.filter(r=>['classroom','special_room'].includes(r.type))){
    if(['2F_KOREAN_CLASS','B1_MAIN_HALL',...NON_CORRIDOR_SPACES].includes(room.id))continue;
    const b=data.boxes.find(b=>b.spaceId===room.id&&b.name.startsWith('Lintel_'))?.bounds;
    if(!b)continue;
    const alongX=b[3]-b[0]>b[4]-b[1];
    let x=alongX?b[0]:(b[0]+b[3])/2,y=alongX?(b[1]+b[4])/2:b[1],width=alongX?b[3]-b[0]:b[4]-b[1],tx=alongX?1:0,ty=alongX?0:1,height=b[2]-room.bounds[4];
    if(['2F_AUDIO_VISUAL','3F_COUNSELING'].includes(room.id)){x=0;y=room.id==='3F_COUNSELING'?.74:.75;width=room.id==='3F_COUNSELING'?1.52:1.5;tx=0;ty=1;height=2.3;}
    // Sliding leaves run beside (not inside) the wall, on the corridor side.
    if(room.type==='classroom'){if(tx)y+=room.bounds[2]>=3?-.16:.16;else x+=.16;}
    result.push({id:room.id,roomIds:room.id==='2F_AUDIO_VISUAL'?[room.id,'2F_KOREAN_CLASS']:[room.id],name:room.name,x,y,z:room.bounds[4],tx,ty,width,height,kind:room.type==='classroom'?'sliding':'swing',glass:false,double:false});
  }
  if(data.rooms.some(r=>r.id==='B1_MAIN_HALL'))for(const [id,x,y,tx,ty,width,height] of [['B1_MAIN_HALL',-5,.35,0,1,2.3,2.65],['B1_MAIN_HALL_GATE',-12.2,-7,1,0,2.4,2.6]]){
    result.push({id,roomIds:['B1_MAIN_HALL'],name:'다목적실 '+(id.endsWith('GATE')?'정문 쪽 출입구':'복도 출입구'),x,y,z:-data.floorHeight,tx,ty,width,height,kind:'swing',glass:true,double:true});
  }
  return result;
}
function coordinates(d,p){const x=p.x-d.x,y=p.y-d.y;return {u:x*d.tx+y*d.ty,v:-x*d.ty+y*d.tx};}
function onFloor(d,p){return p.z<d.z+d.height&&p.z+1.7>d.z+.15;}
function inPassage(d,p,margin=.5){const {u,v}=coordinates(d,p);return onFloor(d,p)&&u> -R&&u<d.width+R&&Math.abs(v)<margin;}
function pose(d,leaf,amount=d.amount){
  const slide=d.kind==='sliding'?amount*(d.width+.08):0,angle=d.kind==='swing'?amount*d.direction*(leaf.reverse?-1:1):0;
  const base=Math.atan2(d.ty,d.tx)+(leaf.reverse?Math.PI:0),heading=base+angle;
  const x=d.x+d.tx*(leaf.reverse?d.width:slide),y=d.y+d.ty*(leaf.reverse?d.width:slide);
  return {x,y,heading,ux:Math.cos(heading),uy:Math.sin(heading)};
}
function distanceToLeaf(d,leaf,p,amount){
  const a=pose(d,leaf,amount),dx=p.x-a.x,dy=p.y-a.y,u=clamp(dx*a.ux+dy*a.uy,0,leaf.width);
  return Math.hypot(dx-a.ux*u,dy-a.uy*u);
}
function sync(d){for(const leaf of d.leaves){
  const p=pose(d,leaf),X=p.x+p.ux*leaf.width,Y=p.y+p.uy*leaf.width;
  leaf.pose=p;leaf.bounds.splice(0,6,Math.min(p.x,X)-THICK/2,Math.min(p.y,Y)-THICK/2,d.z+.015,Math.max(p.x,X)+THICK/2,Math.max(p.y,Y)+THICK/2,d.z+d.height-.015);
}}
export function createRoomDoors(data,boxes,colliders){
  // Replace the old decorative, permanently-open counseling leaf only.
  for(const list of [boxes,colliders])for(let i=list.length-1;i>=0;i--)if(/^상담실 출입 (열린 여닫이문|문 유리창|문 손잡이|문 경첩)/.test(list[i].name))list.splice(i,1);
  const doors=doorLayouts(data).map(layout=>{
    const d={...layout,amount:layout.kind==='sliding'?1:0,target:layout.kind==='sliding'?1:0,direction:1,hold:0,blockedByPlayer:false,leaves:[]};
    for(let i=0;i<(d.double?2:1);i++){
      const leaf={name:d.name+' 움직이는 문 '+i,kind:'door',doorId:d.id,dynamicDoor:true,floor:Math.round(d.z/data.floorHeight)+1,width:d.width/(d.double?2:1),reverse:i===1,bounds:[],spatialBounds:[d.x-d.width-.4,d.y-d.width-.4,d.z,d.x+d.width*2+.5,d.y+d.width*2+.5,d.z+d.height]};
      leaf.containsXY=(x,y,r)=>distanceToLeaf(d,leaf,{x,y},d.amount)<r+THICK/2-.0001;
      d.leaves.push(leaf);colliders.push(leaf);
    }
    sync(d);return d;
  });
  function nearby(p){let nearest=null,best=1.65;for(const d of doors){if(d.kind!=='sliding'||Math.abs(p.z-d.z)>.65)continue;const {u,v}=coordinates(d,p),distance=Math.hypot(u-clamp(u,0,d.width),v);if(distance<best){best=distance;nearest=d;}}return nearest;}
  function toggle(p){const d=nearby(p);if(!d)return false;d.target=d.target?0:1;return true;}
  function update(dt,p,movement={x:0,y:0},active=true){
    if(!active)return;dt=clamp(dt,0,.1);
    for(const d of doors){
      if(d.kind==='swing'){
        const c=coordinates(d,p),probe={x:p.x+movement.x,y:p.y+movement.y,z:p.z},next=coordinates(d,probe);
        // Contact + intent towards the doorway, not a proximity automatic door.
        const pushing=onFloor(d,p)&&c.u>-.05&&c.u<d.width+.05&&Math.abs(c.v)<R+THICK+Math.hypot(movement.x,movement.y)&&Math.abs(next.v)<Math.abs(c.v)&&Math.hypot(movement.x,movement.y)>.0001;
        if(pushing){if(d.amount<.08)d.direction=c.v>=0?-1:1;d.target=OPEN;d.hold=1.1;}
        if(d.amount>.01&&inPassage(d,p,1.25))d.hold=1.1;
        d.hold=Math.max(0,d.hold-dt);if(!d.hold)d.target=0;
      }
      d.blockedByPlayer=false;
      let next=d.amount+clamp(d.target-d.amount,-dt*(d.kind==='sliding'?1.9:2.6),dt*(d.kind==='sliding'?1.9:3.8));
      // Never close on an avatar; leave the request queued until the opening clears.
      if(d.kind==='swing'&&next<d.amount&&inPassage(d,p,.65)){next=d.amount;d.blockedByPlayer=true;}
      if(onFloor(d,p)&&next!==d.amount){
        // Sample the entire small angular/linear step so low frame rates are safe.
        for(let i=1;i<=4;i++)if(d.leaves.some(l=>distanceToLeaf(d,l,p,d.amount+(next-d.amount)*i/4)<R+THICK/2+.01)){next=d.amount;d.blockedByPlayer=true;break;}
      }
      if(d.amount!==next){d.amount=next;sync(d);}
    }
  }
  return {doors,nearby,toggle,update,getState:()=>doors.map(d=>({id:d.id,kind:d.kind,glass:d.glass,double:d.double,amount:d.amount,target:d.target,direction:d.direction,blockedByPlayer:d.blockedByPlayer}))};
}
