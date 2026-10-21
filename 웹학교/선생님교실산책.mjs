// Navigation is derived from the current classroom furniture, never an older map.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function createTeacherWalk(world,config){
  const room=world.data.rooms.find(r=>r.id===config.roomId);
  if(!room)throw new Error('선생님 교실을 찾을 수 없습니다: '+config.roomId);
  const b=room.bounds,z=b[4],spacing=.32,nodes=[],grid=new Map();
  const safe=(p,pad=.10)=>p.x>b[0]+.38&&p.x<b[1]-.38&&p.y>b[2]+.38&&p.y<b[3]-.38&&
    Math.abs(p.z-z)<.03&&[[0,0],[pad,0],[-pad,0],[0,pad],[0,-pad]].every(([x,y])=>world.candidate(p.x+x,p.y+y,z));
  const clear=(a,c)=>{const n=Math.ceil(distance(a,c)/.03);for(let i=0;i<=n;i++)if(!safe({x:a.x+(c.x-a.x)*i/(n||1),y:a.y+(c.y-a.y)*i/(n||1),z}))return false;return true;};
  for(let ix=0,x=b[0]+.45;x<b[1]-.4;ix++,x+=spacing)for(let iy=0,y=b[2]+.45;y<b[3]-.4;iy++,y+=spacing){
    const p={x,y,z};if(safe(p)){const node={...p,ix,iy,id:nodes.length,neighbors:[]};nodes.push(node);grid.set(ix+','+iy,node);}
  }
  for(const node of nodes)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const other=grid.get((node.ix+dx)+','+(node.iy+dy));if(other&&clear(node,other))node.neighbors.push(other.id);
  }
  if(!nodes.length)throw new Error('교실 보행 공간이 없습니다: '+config.roomId);
  const initial=nodes.reduce((a,c)=>distance(a,config.position)<distance(c,config.position)?a:c);
  const connected=new Set([initial.id]),queue=[initial.id];
  for(let i=0;i<queue.length;i++)for(const id of nodes[queue[i]].neighbors)if(!connected.has(id)){connected.add(id);queue.push(id);}
  const reachable=queue.map(id=>nodes[id]);
  let position={x:initial.x,y:initial.y,z},heading=Math.PI/2,speed=0,phase=0,total=0,wait=1.1,serial=0,path=[],moving=false,yielding=false;
  function choosePath(){
    const start=[...reachable].sort((a,c)=>distance(a,position)-distance(c,position)).find(n=>clear(position,n));
    if(!start)return;
    // Alternate distant clear aisles, rather than jitter between nearby cells.
    const ranked=reachable.filter(n=>distance(n,position)>1.5).sort((a,c)=>distance(c,position)-distance(a,position));
    if(!ranked.length)return;
    const target=ranked[(serial++*37)%Math.max(1,Math.floor(ranked.length*.35))];
    const prev=new Map([[start.id,null]]),q=[start.id];
    for(let i=0;i<q.length&&!prev.has(target.id);i++)for(const id of nodes[q[i]].neighbors)if(!prev.has(id)){prev.set(id,q[i]);q.push(id);}
    const route=[];for(let id=target.id;id!==null&&id!==undefined;id=prev.get(id))route.unshift(nodes[id]);
    let anchor=position;path=[];
    while(route.length){let index=route.length-1;while(index>0&&!clear(anchor,route[index]))index--;const point=route[index];path.push(point);anchor=point;route.splice(0,index+1);}
  }
  const state=()=>({position:{...position},heading,speed,phase,distance:total,moving,yielding,waiting:wait>0,roomId:config.roomId,navigationNodes:reachable.length});
  return {getState:state,update(dt,player,{paused=false}={}){
    if(paused||!Number.isFinite(dt)||dt<=0){speed=0;moving=false;return state();}
    dt=Math.min(dt,.05);moving=false;
    yielding=!!player&&Math.abs(player.z-z)<1.15&&distance(player,position)<1.05;
    if(yielding){speed=0;return state();}
    if(wait>0){wait-=dt;speed=0;return state();}
    if(!path.length){choosePath();if(!path.length)return state();}
    const target=path[0],len=distance(position,target);
    if(len<.001){path.shift();if(!path.length)wait=1.2+(serial%4)*.45;speed=0;return state();}
    const dx=(target.x-position.x)/len,dy=(target.y-position.y)/len,angle=turn(heading,Math.atan2(dx,-dy));
    heading+=Math.max(-2*dt,Math.min(2*dt,angle));
    const desired=Math.abs(angle)>.55?0:Math.min(.48,Math.sqrt(len*.8));
    speed+=Math.max(-1.5*dt,Math.min(.65*dt,desired-speed));
    const step=Math.min(speed*dt,len),next={x:position.x+dx*step,y:position.y+dy*step,z};
    if(!safe(next,.04)){speed=0;path=[];wait=.4;return state();}
    position=next;total+=step;phase+=step*Math.PI*2/.68;moving=step>.00001;return state();
  }};
}
