// Coordinates remain Blender's x/y horizontal, z vertical. Shared with Node tests.
import {sealEnvelope} from './외피보강.mjs';
import {addFourthFloorFinish,addLowerMainFloorFinish} from './사진참고마감.mjs';
import {addElevator,ELEVATOR_SPAN} from './엘리베이터.mjs';
import {openMainWindows,openClassroomWindows,subtractBox} from './창문배치.mjs';
import {applyGroundFloorPlan,LOBBY_OPEN} from './일층배치.mjs';
import {applyRestroomPlan} from './화장실배치.mjs';
import {principalOfficeLayout,openPrincipalWindows} from './교장실배치.mjs';
import {outdoorBox,addPlaygroundDetails} from './운동장.mjs';
import {addParking} from './주차장.mjs';
import {class64Interior} from './육학년사반.mjs';
import {mainClassroomsInterior} from './본관교실.mjs';
import {courtyardDecor} from './외관사진디자인.mjs';
import {classroomDevices} from './교실영상기기.mjs';
import {addAnnexCorridorFinish} from './별관복도마감.mjs';
import {openRearExit,openStairRearExit,addMainRooftop,ROOF_STAIR} from './본관출입연결.mjs';
export const PLAYER_RADIUS=.28, PLAYER_HEIGHT=1.7, EYE_HEIGHT=1.58;
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
export function buildWorld(data,{class64=true,mainClassrooms=true,exterior=true,annexFinish=true,restrooms=true,principalOffice=true}={}){
  data=applyGroundFloorPlan(data);
  if(restrooms)data=applyRestroomPlan(data);
  const {left:entranceLeft,right:entranceRight,height:entranceHeight}=LOBBY_OPEN;
  const boxes=[],surfaces=[],colliders=[],stairs=[];
  const roomById=new Map(data.rooms.map(r=>[r.id,r]));
  const addBox=(name,bounds,color,kind='wall',floor=0)=>{
    const b={name,bounds,color,kind,floor};boxes.push(b);
    if(kind==='wall'||kind==='slab'||kind==='ceiling')colliders.push(b);
    return b;
  };
  const flat=(b,z,name)=>surfaces.push({bounds:b,height:()=>z,name});
  const addFlatBox=(name,b,c,f=0)=>{const box=addBox(name,b,c,'slab',f);flat(b,b[5],name);return box;};
  for(const source of data.boxes){
    const item=outdoorBox(source);
    const room=roomById.get(item.spaceId);
    if(item.kind==='old_stair'||room?.type==='stair')continue;
    // Replace one solid wall with an actual outdoor entrance, without editing .blend.
    const b=item.bounds;
    if(item.spaceId==='1F_MAIN_LOBBY'&&item.kind==='wall'&&b[1]<-6.9&&b[4]<-6.8){
      if(item.name.startsWith('Wall_')){
        addBox('현관 출입문 왼쪽',[b[0],b[1],b[2],entranceLeft,b[4],b[5]],item.color,'wall',1);
        addBox('현관 출입문 오른쪽',[entranceRight,b[1],b[2],b[3],b[4],b[5]],item.color,'wall',1);
        addBox('현관 출입문 위',[entranceLeft,b[1],entranceHeight,entranceRight,b[4],b[5]],item.color,'wall',1);
      }
      continue;
    }
    // Facade band would otherwise cross the new doorway at ankle height.
    if(item.name==='1F_SouthBand'){
      addBox(item.name+'왼쪽',[b[0],b[1],b[2],entranceLeft,b[4],b[5]],item.color,'wall',1);
      addBox(item.name+'오른쪽',[entranceRight,b[1],b[2],b[3],b[4],b[5]],item.color,'wall',1);continue;
    }
    boxes.push(item);
    if(item.kind==='wall'||item.collision||item.kind==='roof'||item.kind==='floor')colliders.push(item);
    if(item.kind==='floor'||['SiteGround','SPACE_EXT_PLAYGROUND','SPACE_EXT_PLAY_AREA','SPACE_EXT_SCHOOL_GARDEN','SPACE_EXT_MEDITATION_GROVE'].includes(item.name))flat(b,b[5],item.name);
  }
  // Rebuild each of the four shafts with open floor holes and two real flights.
  for(const room of data.rooms.filter(r=>r.type==='stair'&&r.floor==='1F')){
    const frame=stairFrame(room),W=frame.width,D=frame.depth,L=1.2,T=D-L,FH=data.floorHeight;
    const shaft=room.id.replace(/^1F_/,''), stair={id:shaft,frame,L,T,height:FH,room};stairs.push(stair);
    const roofAccess=shaft===ROOF_STAIR,levels=roofAccess?5:4,wallTop=roofAccess?4*FH+3:4*FH;
    stair.roofAccess=roofAccess;
    const b=(u0,u1,v0,v1,z0,z1)=>localBounds(frame,u0,u1,v0,v1,z0,z1);
    // Full-height enclosure stops falling out or crossing into adjacent rooms.
    addBox(shaft+' 왼벽',b(-.08,.08,0,D,-.2,wallTop),[.76,.79,.8]);
    addBox(shaft+' 오른벽',b(W-.08,W+.08,0,D,-.2,wallTop),[.76,.79,.8]);
    addBox(shaft+' 뒷벽',b(0,W,D-.08,D+.08,-.2,wallTop),[.76,.79,.8]);
    // Narrow spine, open around the far landing, keeps the two flights separate.
    addBox(shaft+' 중앙벽',b(W/2-.1,W/2+.1,L,T,-.2,(levels-1)*FH+(roofAccess?1.2:1)),[.53,.6,.64]);
    addBox(shaft+' 지붕',b(0,W,0,D,wallTop-.1,wallTop+.1),[.69,.73,.75],'slab');
    if(roofAccess)addBox('옥상 계단 출입구 상부',b(0,W,-.08,.08,4*FH+2.6,wallTop),[.76,.79,.8],'wall',5);
    for(let level=0;level<levels;level++){
      const z=level*FH+(roofAccess&&level===4?.11:0),rise=FH+(roofAccess&&level===3?.11:0);
      const entry=addFlatBox(shaft+' 입구 '+level,b(0,W,0,L,z-.16,z),[.7,.73,.72],level+1);
      if(roofAccess&&level===4)entry.stepSurface=true;
      if(level===levels-1){
        addBox(shaft+' 최상층 막음',b(.08,W/2-.1,L-.04,L+.06,z,z+1.1),[.53,.6,.64],'wall',level+1);
        continue;
      }
      const landing=addFlatBox(shaft+' 중간참 '+level,b(0,W,T,D,z+rise/2-.16,z+rise/2),[.7,.73,.72],level+1);
      if(roofAccess&&level===3)landing.stepSurface=true;
      for(const lane of [0,1]){
        const u0=lane?W/2+.1:.08,u1=lane?W-.08:W/2-.1;
        const bounds=b(u0,u1,L,T,z,z+rise);
        surfaces.push({name:shaft+' 경사 '+level+' '+lane,bounds,height:(x,y)=>{
          const v=(x-frame.origin[0])*frame.inward[0]+(y-frame.origin[1])*frame.inward[1];
          const t=Math.max(0,Math.min(1,(v-L)/(T-L)));
          return z+(lane?rise/2+(1-t)*rise/2:t*rise/2);
        }});
        // Visible treads; physics follows a smooth ramp under each flight.
        const n=12;
        for(let i=0;i<n;i++){
          const v0=L+i*(T-L)/n,v1=L+(i+1)*(T-L)/n;
          const top=z+(lane?rise/2+(1-i/n)*rise/2:(i+1)/n*rise/2);
          addBox(shaft+' 디딤판 '+level+' '+lane+' '+i,b(u0,u1,v0,v1,top-.12,top),[.61,.66,.69],'step',level+1);
        }
      }
    }
  }
  sealEnvelope(data,addBox);
  addFourthFloorFinish(data,addBox);
  addLowerMainFloorFinish(data,addBox);
  // Remove former facade glazing/backing at the new lift front, then install it.
  for(let floor=1;floor<=4;floor++){
    const z=(floor-1)*data.floorHeight,cut=[ELEVATOR_SPAN[0],2.74,z,ELEVATOR_SPAN[1],3.26,z+3.15];
    const replacements=new Map(boxes.map(b=>[b,subtractBox(b,cut)]));
    for(const list of [boxes,colliders]){const next=list.flatMap(b=>replacements.get(b)??[b]);list.splice(0,list.length,...next);}
  }
  addElevator(data,addBox);
  openMainWindows(data,boxes,colliders);
  openClassroomWindows(data,boxes,colliders,addBox);
  if(principalOffice)openPrincipalWindows(data,boxes,colliders,addBox);
  if(annexFinish)addAnnexCorridorFinish(data,boxes,colliders,addBox);
  openRearExit(boxes,colliders,surfaces,addBox);
  openStairRearExit(boxes,colliders,surfaces,addBox);
  addMainRooftop(data,boxes,surfaces,addBox);
  addPlaygroundDetails(addBox);
  addParking(addBox);
  if(exterior)for(const box of courtyardDecor()){boxes.push(box);if(box.collision)colliders.push(box);}
  // Entrance access ramp from courtyard to ground-floor lobby.
  const ramp={bounds:[entranceLeft,-9,-.65,entranceRight,-7,0],height:(x,y)=>(y+7)*.3,name:'본관 출입 경사로'};
  surfaces.push(ramp);
  for(let i=0;i<20;i++){
    const y0=-9+i*.1,y1=y0+.1,z=ramp.height(45,y1);
    addBox('현관 접근 '+i,[entranceLeft,y0,z-.15,entranceRight,y1,z],[.65,.68,.65],'step');
  }
  addBox('현관 경사로 왼쪽 난간',[entranceLeft-.1,-8.5,-.6,entranceLeft,-7,1],[.43,.5,.53]);
  addBox('현관 경사로 오른쪽 난간',[entranceRight,-8.5,-.6,entranceRight+.1,-7,1],[.43,.5,.53]);
  // Playground's low rostrum and walls are solid, too.
  for(const b of boxes)if(b.name==='SPACE_EXT_ROSTRUM')colliders.push(b);
  const classroom64=class64?class64Interior(data):null;
  if(classroom64){boxes.push(...classroom64.boxes);colliders.push(...classroom64.colliders);}
  const classroomsMain=mainClassrooms?mainClassroomsInterior(data):{rooms:[],boxes:[],colliders:[]};
  boxes.push(...classroomsMain.boxes);colliders.push(...classroomsMain.colliders);
  const equipped=classroomDevices(boxes,data.rooms);boxes.splice(0,boxes.length,...equipped);
  for(const tv of boxes.filter(b=>b.cornerTV&&!b.name.endsWith('벽걸이 화면'))){
    const b=tv.bounds,cx=(b[0]+b[3])/2,cy=(b[1]+b[4])/2,half=(b[3]-b[0]+b[4]-b[1])*Math.SQRT1_2/2;
    colliders.push({...tv,name:tv.name+' 충돌',bounds:[cx-half,cy-half,b[2],cx+half,cy+half,b[5]]});
  }
  const office=principalOffice?principalOfficeLayout(data):null;
  if(office)colliders.push(...office.colliders);
  const grid=(items)=>{
    const map=new Map();
    for(const item of items){const b=item.bounds;for(let x=Math.floor((b[0]-.5)/CELL);x<=Math.floor((b[3]+.5)/CELL);x++)for(let y=Math.floor((b[1]-.5)/CELL);y<=Math.floor((b[4]+.5)/CELL);y++){
      const key=x+','+y;if(!map.has(key))map.set(key,[]);map.get(key).push(item);
    }}return map;
  };
  const wallsGrid=grid(colliders),floorGrid=grid(surfaces);
  const query=(map,x,y)=>map.get(Math.floor(x/CELL)+','+Math.floor(y/CELL))??[];
  function blocked(x,y,z){
    return query(wallsGrid,x,y).some(o=>!(o.stepSurface&&o.bounds[5]<=z+.34)&&o.bounds[5]>z+.09&&o.bounds[2]<z+PLAYER_HEIGHT&&intersect(x,y,PLAYER_RADIUS,o.bounds));
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
    if(p.z>=4*data.floorHeight-.05)return {floor:5,room:null,rooftop:true};
    const floor=Math.max(1,Math.min(4,Math.floor((p.z+.15)/data.floorHeight)+1));
    const found=data.rooms.find(r=>parseInt(r.floor)===floor&&['classroom','special_room','entrance','toilet'].includes(r.type)&&p.x>r.bounds[0]&&p.x<r.bounds[1]&&p.y>r.bounds[2]&&p.y<r.bounds[3]);
    return {floor,room:found};
  }
  function floorBelow(x,y,z){
    let best=-Infinity;
    for(const s of query(floorGrid,x,y)){
      const b=s.bounds;if(x<b[0]-EPS||x>b[3]+EPS||y<b[1]-EPS||y>b[4]+EPS)continue;
      const h=s.height(x,y);if(h<=z+.025&&h>best)best=h;
    }
    // Solid furniture/slabs can support a landing; never drop through their tops.
    for(const s of query(wallsGrid,x,y)){
      const b=s.bounds;if(b[5]<=z+.025&&b[5]>best&&intersect(x,y,PLAYER_RADIUS,b))best=b[5];
    }
    return best;
  }
  function moveAir(p,dx,dy){
    if(!blocked(p.x+dx,p.y+dy,p.z))return {...p,x:p.x+dx,y:p.y+dy};
    let q={...p};if(!blocked(q.x+dx,q.y,q.z))q.x+=dx;
    if(!blocked(q.x,q.y+dy,q.z))q.y+=dy;return q;
  }
  return {data,boxes,colliders,surfaces,stairs,classroom64,classroomsMain,principalOffice:office,move,candidate,blocked,support,floorBelow,moveAir,roomAt,spawn:{x:20,y:1.5,z:0}};
}
