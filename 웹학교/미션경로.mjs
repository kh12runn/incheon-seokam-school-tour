import {doorLayouts} from './출입문.mjs';
import {localPoint} from './이동물리.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export async function prepareMissionMap(world,teachers,{yieldFrame=()=>Promise.resolve()}={}){
 const nodes=[],floors=new Map(),rooms=new Map(),cache=new Map(),fh=world.data.floorHeight;
 const valid=p=>world.navigationCandidate(p.x,p.y,p.z);
 function trace(points){
  let p={x:points[0].x,y:points[0].y,z:points[0].z},length=0;const route=[p];if(!valid(p))return null;
  for(const target of points.slice(1)){
   const start={...p},n=Math.max(1,Math.ceil(Math.hypot(target.x-p.x,target.y-p.y)/.12));
   for(let i=1;i<=n;i++){
    const q=valid({x:start.x+(target.x-start.x)*i/n,y:start.y+(target.y-start.y)*i/n,z:p.z});
    if(!q)return null;length+=distance(p,q);p=q;
   }
   if(Math.abs(p.z-target.z)>.06)return null;route.push({...p});
  }return{length,points:route};
 }
 function node(p){const n={...p,id:nodes.length,edges:[]};nodes.push(n);return n;}
 function link(a,b,points=[a,b]){const route=trace(points);if(!route)return false;a.edges.push({id:b.id,...route});b.edges.push({id:a.id,length:route.length,points:[...route.points].reverse()});return true;}
 function corridor(p,building){
  const floor=Math.round(p.z/fh)+1,key=floor+':'+building;if(!floors.has(key))floors.set(key,[]);
  const list=floors.get(key),q=building==='MAIN'?{x:p.x,y:1.75,z:p.z}:{x:101.5,y:p.y,z:p.z};
  let found=list.find(n=>distance(n,q)<.01);if(!found){found=node(q);list.push(found);}return found;
 }
 for(let f=1;f<=4;f++){
  const z=(f-1)*fh;for(let x=1;x<102;x+=2)corridor({x,z},'MAIN');
  for(let y=-72;y<2;y+=2)corridor({y,z},'ANNEX');
  const corner=corridor({x:101.5,z},'MAIN'),annex=corridor({y:1.75,z},'ANNEX');link(corner,annex);
 }
 for(const stair of world.stairs)for(let f=0;f<3;f++){
  const s=stair.frame,W=s.width,D=s.depth,z=f*fh,point=(u,v,h=z)=>localPoint(s,u,v,h);
  const a=point(W/4,-.6),b=point(3*W/4,-.6,z+fh),na=corridor(a,stair.room.building),nb=corridor(b,stair.room.building);
  if(!link(na,nb,[na,a,point(W/4,.6),point(W/4,D-.6,z+fh/2),point(3*W/4,D-.6,z+fh/2),point(3*W/4,.6,z+fh),b,nb]))throw Error('미션 계단 경로 확인 실패: '+stair.id);
 }
 const layouts=doorLayouts(world.data),wanted=world.data.rooms.filter(r=>r.type==='classroom'||teachers.some(t=>t.roomId===r.id));
 for(const room of wanted){
  const d=layouts.find(d=>d.roomIds.includes(room.id));if(!d)throw Error('미션 출입문 없음: '+room.id);
  const b=room.bounds,z=b[4],center={x:(b[0]+b[1])/2,y:(b[2]+b[3])/2,z},door={x:d.x+d.tx*d.width/2,y:d.y+d.ty*d.width/2,z};
  const nx=-d.ty,ny=d.tx,side=Math.sign((center.x-door.x)*nx+(center.y-door.y)*ny);
  const entryDepth=d.kind==='swing'?d.width+.55:.75;
  const inside={x:door.x+nx*side*entryDepth,y:door.y+ny*side*entryDepth,z},outside={x:door.x-nx*side*.75,y:door.y-ny*side*.75,z};
  const entry=corridor(outside,d.tx?'MAIN':'ANNEX'),access=trace([entry,outside,inside]);
  if(!access)throw Error('미션 교실 입구 확인 실패: '+room.id);
  const cells=[],grid=new Map(),step=.4;
  const safe=p=>p.x>b[0]+.32&&p.x<b[1]-.32&&p.y>b[2]+.32&&p.y<b[3]-.32&&valid(p);
  const first={...inside,ix:0,iy:0,dist:0,prev:null};cells.push(first);grid.set('0,0',first);
  for(let index=0;index<cells.length;index++){
   const a=cells[index];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const ix=a.ix+dx,iy=a.iy+dy,key=ix+','+iy;if(grid.has(key))continue;
    const p={x:inside.x+ix*step,y:inside.y+iy*step,z};
    if(!safe(p)){grid.set(key,null);continue;}if(!trace([a,p]))continue;
    const cell={...p,ix,iy,dist:a.dist+step,prev:a};grid.set(key,cell);cells.push(cell);
   }
  }
  const treasures=cells.filter(p=>distance(p,door)>2.2&&p.dist<14);
  if(room.type==='classroom'&&!treasures.length)throw Error('안전한 보물 위치 없음: '+room.id);
  const nearest=p=>cells.reduce((best,n)=>distance(p,n)<distance(p,best)?n:best);
  rooms.set(room.id,{room,entry,inside,outside,door,cells,treasures,access,nearest,
   routeTo(p){const n=nearest(p),path=[];for(let c=n;c;c=c.prev)path.unshift({x:c.x,y:c.y,z:c.z});return{length:access.length+n.dist+distance(n,p),points:[...access.points,...path.slice(1),p]};}});
  await yieldFrame();
 }
 for(const [key,list] of floors){list.sort((a,b)=>key.endsWith('MAIN')?a.x-b.x:a.y-b.y);for(let i=1;i<list.length;i++)if(!link(list[i-1],list[i]))throw Error('복도 경로 확인 실패: '+key+' '+i);}
 function shortest(a,b){
  if(!cache.has(a.id)){
   const costs=new Map([[a.id,0]]),previous=new Map(),open=new Set([a.id]);
   while(open.size){let id=null;for(const n of open)if(id===null||costs.get(n)<costs.get(id))id=n;open.delete(id);
    for(const e of nodes[id].edges){const cost=costs.get(id)+e.length;if(cost<(costs.get(e.id)??Infinity)){costs.set(e.id,cost);previous.set(e.id,{from:id,points:e.points});open.add(e.id);}}
   }cache.set(a.id,{costs,previous});
  }
  const {costs,previous}=cache.get(a.id),length=costs.get(b.id);if(length===undefined)throw Error(`연결되지 않은 미션 경로: ${a.id} (${a.x},${a.y},${a.z}) → ${b.id} (${b.x},${b.y},${b.z}); 방문 ${costs.size}/${nodes.length}, 시작 연결 ${a.edges.length}`);
  const legs=[];for(let n=b.id;n!==a.id;){const e=previous.get(n);legs.unshift(e.points);n=e.from;}
  return{length,points:legs.flat()};
 }
 const start=corridor({x:52.5,z:3*fh},'MAIN');
 // Start was already present as a stair projection in normal layouts. Connect
 // explicitly in case a future plan moves that projection.
 for(const n of floors.get('4:MAIN'))if(n!==start&&Math.abs(n.x-start.x)<3)link(start,n);
 for(const r of rooms.values())shortest(start,r.entry);
 function roomAt(p){return [...rooms.values()].find(r=>{const b=r.room.bounds;return Math.abs(p.z-b[4])<.3&&p.x>b[0]&&p.x<b[1]&&p.y>b[2]&&p.y<b[3];});}
 function fromPoint(p){const r=roomAt(p);if(r){const route=r.routeTo(p);return{node:r.entry,length:route.length,points:[...route.points].reverse()};}
  const nearest=nodes.filter(n=>Math.abs(n.z-p.z)<.1).sort((a,b)=>distance(a,p)-distance(b,p)).find(n=>trace([p,n]));
  if(!nearest)throw Error('미션 출발 경로 없음');const route=trace([p,nearest]);return{node:nearest,...route};
 }
 function route(from,roomId,target){const a=fromPoint(from),b=rooms.get(roomId);if(!b)throw Error('미션 목적지 없음');const middle=shortest(a.node,b.entry),last=b.routeTo(target);return{length:a.length+middle.length+last.length,points:[...a.points,...middle.points,...last.points]};}
 const grades=new Map();for(const r of rooms.values()){const grade=Number(r.room.name.match(/^(\d)-/)?.[1]);if(grade){if(!grades.has(grade))grades.set(grade,[]);grades.get(grade).push(r);}}
 // Include the search across ALL rooms in a grade (even multiple floors), not
 // just the hidden room. A conservative tour provides ample exploration time.
 function searchDistance(grade){const remaining=[...grades.get(grade)];let current=remaining.shift(),length=0;while(remaining.length){remaining.sort((a,b)=>shortest(current.entry,a.entry).length-shortest(current.entry,b.entry).length);const next=remaining.shift();length+=shortest(current.entry,next.entry).length+12;current=next;}return length+12;}
 return {floorHeight:fh,start:{x:start.x,y:start.y,z:start.z},rooms,grades,teachers,route,searchDistance,shortest,nodes};
}
