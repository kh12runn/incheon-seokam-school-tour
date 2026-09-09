// Coordinates remain Blender's x/y horizontal, z vertical. Shared with Node tests.
import {sealEnvelope} from './외피보강.mjs';
import {addFourthFloorFinish,addLowerMainFloorFinish} from './사진참고마감.mjs';
import {addElevator} from './엘리베이터.mjs';
import {openMainWindows,openClassroomWindows} from './창문배치.mjs';
import {outdoorBox,addPlaygroundDetails} from './운동장.mjs';
import {addParking} from './주차장.mjs';
export const PLAYER_RADIUS=.22, PLAYER_HEIGHT=1.7, EYE_HEIGHT=1.58;
const EPS=.0001, CELL=4;
const intersect=(x,y,r,b)=>{
  const dx=x-Math.max(b[0],Math.min(x,b[3])),dy=y-Math.max(b[1],Math.min(y,b[4]));
  return dx*dx+dy*dy<r*r-EPS;
};
export function stairFrame(room) {
  const [x0,x1,y0,y1]=room.bounds;
  // Entry at south for main block; at east for annex block.
  return room.building==='ANNEX'
    ? {origin:[x1,y1],right:[0,-1],inward:[-1,0],width:y1-y0,depth:x1-x0}
    : {origin:[x0,y0],right:[1,0],inward:[0,1],width:x1-x0,depth:y1-y0};
}
export function localPoint(f,u,v,z=0){return {x:f.origin[0]+f.right[0]*u+f.inward[0]*v,y:f.origin[1]+f.right[1]*u+f.inward[1]*v,z};}
function localBounds(f,u0,u1,v0,v1,z0,z1){
  const p=localPoint(f,u0,v0),q=localPoint(f,u1,v1);
  return [Math.min(p.x,q.x),Math.min(p.y,q.y),z0,Math.max(p.x,q.x),Math.max(p.y,q.y),z1];
}
export function buildWorld(data){
  const boxes=[],surfaces=[],colliders=[],stairs=[];
  const roomById=new Map(data.rooms.map(r=>[r.id,r]));
  const addBox=(name,bounds,color,kind='wall',floor=0)=>{
    const b={name,bounds,color,kind,floor};boxes.push(b);
    if(kind==='wall'||kind==='slab'||kind==='ceiling')colliders.push(b);
    return b;
  };
  const flat=(b,z,name)=>surfaces.push({bounds:b,height:()=>z,name});
  const addFlatBox=(name,b,c,f=0)=>{addBox(name,b,c,'slab',f);flat(b,b[5],name);};
  for(const source of data.boxes){
    const item=outdoorBox(source);
    const room=roomById.get(item.spaceId);
    if(item.kind==='old_stair'||room?.type==='stair')continue;
    // Replace one solid wall with an actual outdoor entrance, without editing .blend.
    const b=item.bounds;
    if(item.spaceId==='1F_MAIN_LOBBY'&&item.kind==='wall'&&b[1]<-6.9&&b[4]<-6.8){
      if(item.name.startsWith('Wall_')){
        addBox('현관 출입문 왼쪽',[b[0],b[1],b[2],43.8,b[4],b[5]],item.color,'wall',1);
        addBox('현관 출입문 오른쪽',[46.2,b[1],b[2],b[3],b[4],b[5]],item.color,'wall',1);
        addBox('현관 출입문 위',[43.8,b[1],2.35,46.2,b[4],b[5]],item.color,'wall',1);
      }
      continue;
    }
    // Facade band would otherwise cross the new doorway at ankle height.
    if(item.name==='1F_SouthBand'){
      addBox(item.name+'왼쪽',[b[0],b[1],b[2],43.8,b[4],b[5]],item.color,'wall',1);
      addBox(item.name+'오른쪽',[46.2,b[1],b[2],b[3],b[4],b[5]],item.color,'wall',1);continue;
    }
    boxes.push(item);
    if(item.kind==='wall'||item.collision||item.kind==='roof'||item.kind==='floor')colliders.push(item);
    if(item.kind==='floor'||['SiteGround','SPACE_EXT_PLAYGROUND','SPACE_EXT_PLAY_AREA','SPACE_EXT_SCHOOL_GARDEN','SPACE_EXT_MEDITATION_GROVE'].includes(item.name))flat(b,b[5],item.name);
  }
  // Rebuild each of the four shafts with open floor holes and two real flights.
  for(const room of data.rooms.filter(r=>r.type==='stair'&&r.floor==='1F')){
    const frame=stairFrame(room),W=frame.width,D=frame.depth,L=1.2,T=D-L,FH=data.floorHeight;
    const shaft=room.id.replace(/^1F_/,''), stair={id:shaft,frame,L,T,height:FH,room};stairs.push(stair);
    const b=(u0,u1,v0,v1,z0,z1)=>localBounds(frame,u0,u1,v0,v1,z0,z1);
    // Full-height enclosure stops falling out or crossing into adjacent rooms.
    addBox(shaft+' 왼벽',b(-.08,.08,0,D,-.2,4*FH),[.76,.79,.8]);
    addBox(shaft+' 오른벽',b(W-.08,W+.08,0,D,-.2,4*FH),[.76,.79,.8]);
    addBox(shaft+' 뒷벽',b(0,W,D-.08,D+.08,-.2,4*FH),[.76,.79,.8]);
    // Narrow spine, open around the far landing, keeps the two flights separate.
    addBox(shaft+' 중앙벽',b(W/2-.1,W/2+.1,L,T,-.2,3*FH+1),[.53,.6,.64]);
    addBox(shaft+' 지붕',b(0,W,0,D,4*FH-.1,4*FH+.1),[.69,.73,.75],'slab');
    for(let level=0;level<4;level++){
      const z=level*FH;
      addFlatBox(shaft+' 입구 '+level,b(0,W,0,L,z-.16,z),[.7,.73,.72],level+1);
      if(level===3){
        // No fictional stairs to the roof: a guard closes the upper flight start.
        addBox(shaft+' 최상층 막음',b(.08,W/2-.1,L-.04,L+.06,z,z+1.1),[.53,.6,.64],'wall',4);
        continue;
      }
      addFlatBox(shaft+' 중간참 '+level,b(0,W,T,D,z+FH/2-.16,z+FH/2),[.7,.73,.72],level+1);
      for(const lane of [0,1]){
        const u0=lane?W/2+.1:.08,u1=lane?W-.08:W/2-.1;
        const bounds=b(u0,u1,L,T,z,z+FH);
        surfaces.push({name:shaft+' 경사 '+level+' '+lane,bounds,height:(x,y)=>{
          const v=(x-frame.origin[0])*frame.inward[0]+(y-frame.origin[1])*frame.inward[1];
          const t=Math.max(0,Math.min(1,(v-L)/(T-L)));
          return z+(lane?FH/2+(1-t)*FH/2:t*FH/2);
        }});
        // Visible treads; physics follows a smooth ramp under each flight.
        const n=12;
        for(let i=0;i<n;i++){
          const v0=L+i*(T-L)/n,v1=L+(i+1)*(T-L)/n;
          const top=z+(lane?FH/2+(1-i/n)*FH/2:(i+1)/n*FH/2);
          addBox(shaft+' 디딤판 '+level+' '+lane+' '+i,b(u0,u1,v0,v1,top-.12,top),[.61,.66,.69],'step',level+1);
        }
      }
    }
  }
  sealEnvelope(data,addBox);
  addFourthFloorFinish(data,addBox);
  addLowerMainFloorFinish(data,addBox);
  addElevator(data,addBox);
  openMainWindows(data,boxes,colliders);
  openClassroomWindows(data,boxes,colliders,addBox);
  addPlaygroundDetails(addBox);
  addParking(addBox);
  // Entrance access ramp from courtyard to ground-floor lobby.
  const ramp={bounds:[43.8,-9,-.65,46.2,-7,0],height:(x,y)=>(y+7)*.3,name:'본관 출입 경사로'};
  surfaces.push(ramp);
  for(let i=0;i<20;i++){
    const y0=-9+i*.1,y1=y0+.1,z=ramp.height(45,y1);
    addBox('현관 접근 '+i,[43.8,y0,z-.15,46.2,y1,z],[.65,.68,.65],'step');
  }
  addBox('현관 경사로 왼쪽 난간',[43.7,-8.5,-.6,43.8,-7,1],[.43,.5,.53]);
  addBox('현관 경사로 오른쪽 난간',[46.2,-8.5,-.6,46.3,-7,1],[.43,.5,.53]);
  // Playground's low rostrum and walls are solid, too.
  for(const b of boxes)if(b.name==='SPACE_EXT_ROSTRUM')colliders.push(b);
  const grid=(items)=>{
    const map=new Map();
    for(const item of items){const b=item.bounds;for(let x=Math.floor((b[0]-.5)/CELL);x<=Math.floor((b[3]+.5)/CELL);x++)for(let y=Math.floor((b[1]-.5)/CELL);y<=Math.floor((b[4]+.5)/CELL);y++){
      const key=x+','+y;if(!map.has(key))map.set(key,[]);map.get(key).push(item);
    }}return map;
  };
  const wallsGrid=grid(colliders),floorGrid=grid(surfaces);
  const query=(map,x,y)=>map.get(Math.floor(x/CELL)+','+Math.floor(y/CELL))??[];
  function blocked(x,y,z){
    return query(wallsGrid,x,y).some(o=>o.bounds[5]>z+.09&&o.bounds[2]<z+PLAYER_HEIGHT&&intersect(x,y,PLAYER_RADIUS,o.bounds));
  }
  function support(x,y,z){
    let best=-Infinity;
    for(const s of query(floorGrid,x,y)){
      const b=s.bounds;if(x<b[0]-EPS||x>b[3]+EPS||y<b[1]-EPS||y>b[4]+EPS)continue;
      const h=s.height(x,y);
      if(h<=z+.34&&h>=z-.4&&h>best)best=h;
    }return best;
  }
  function candidate(x,y,z){
    const h=support(x,y,z);if(!Number.isFinite(h)||blocked(x,y,h))return null;
    // Stay on solid footing; no invisible drop through a stair opening.
    for(const [dx,dy] of [[.14,0],[-.14,0],[0,.14],[0,-.14]])if(!Number.isFinite(support(x+dx,y+dy,h)))return null;
    return {x,y,z:h};
  }
  function move(position,dx,dy){
    let p={...position};const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.065));
    for(let i=0;i<n;i++){
      const x=dx/n,y=dy/n;
      let q=candidate(p.x+x,p.y+y,p.z);
      if(q){p=q;continue;}
      q=candidate(p.x+x,p.y,p.z);if(q)p=q;
      q=candidate(p.x,p.y+y,p.z);if(q)p=q;
    }return p;
  }
  function roomAt(p){
    const floor=Math.max(1,Math.min(4,Math.floor((p.z+.15)/data.floorHeight)+1));
    const found=data.rooms.find(r=>parseInt(r.floor)===floor&&['classroom','special_room','entrance'].includes(r.type)&&p.x>r.bounds[0]&&p.x<r.bounds[1]&&p.y>r.bounds[2]&&p.y<r.bounds[3]);
    return {floor,room:found};
  }
  return {boxes,colliders,surfaces,stairs,move,candidate,blocked,support,roomAt,spawn:{x:20,y:1.5,z:0}};
}
