// Navigation is derived from the current classroom furniture, never an older map.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
// Segment/circle test is cheap enough for steering; furniture stays in the
// precomputed graph. Never choose a shortcut through the student's body.
function avoidsPlayer(a,b,player){
  if(!player)return true;
  const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
  const t=len2?Math.max(0,Math.min(1,((player.x-a.x)*dx+(player.y-a.y)*dy)/len2)):0;
  return Math.hypot(a.x+dx*t-player.x,a.y+dy*t-player.y)>=.68;
}
function* prepareTeacherWalk(world,config,{planningBudgetMs=0,clock=()=>performance.now()}={}){
  const room=world.data.rooms.find(r=>r.id===config.roomId);
  if(!room)throw new Error('선생님 교실을 찾을 수 없습니다: '+config.roomId);
  const b=room.bounds,z=b[4],spacing=.32,nodes=[],grid=new Map();
  const safe=(p,pad=.10)=>p.x>b[0]+.38&&p.x<b[1]-.38&&p.y>b[2]+.38&&p.y<b[3]-.38&&
    Math.abs(p.z-z)<.03&&[[0,0],[pad,0],[-pad,0],[0,pad],[0,-pad]].every(([x,y])=>world.candidate(p.x+x,p.y+y,z));
  function* clearSteps(a,c){
    const n=Math.ceil(distance(a,c)/.03);
    for(let i=0;i<=n;i++){
      if(!safe({x:a.x+(c.x-a.x)*i/(n||1),y:a.y+(c.y-a.y)*i/(n||1),z}))return false;
      // Keep even a long diagonal visibility test interruptible. Every exact
      // collision sample is retained; furniture and doors are never bypassed.
      if(i%8===7)yield;
    }return true;
  }
  for(let ix=0,x=b[0]+.45;x<b[1]-.4;ix++,x+=spacing)for(let iy=0,y=b[2]+.45;y<b[3]-.4;iy++,y+=spacing){
    const p={x,y,z};if(safe(p)){const node={...p,ix,iy,id:nodes.length,neighbors:[]};nodes.push(node);grid.set(ix+','+iy,node);}
    yield;
  }
  const edges=new Map();
  for(const node of nodes)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const other=grid.get((node.ix+dx)+','+(node.iy+dy));
    if(other){
      const key=Math.min(node.id,other.id)+':'+Math.max(node.id,other.id);
      // A static graph edge has the same sampled path in either direction.
      // Preserve neighbor order so the original walking routes stay stable.
      if(!edges.has(key))edges.set(key,yield* clearSteps(node,other));
      if(edges.get(key))node.neighbors.push(other.id);
    }yield;
  }
  edges.clear();
  if(!nodes.length)throw new Error('교실 보행 공간이 없습니다: '+config.roomId);
  const initial=nodes.reduce((a,c)=>distance(a,config.position)<distance(c,config.position)?a:c);
  const connected=new Set([initial.id]),queue=[initial.id];
  for(let i=0;i<queue.length;i++)for(const id of nodes[queue[i]].neighbors)if(!connected.has(id)){connected.add(id);queue.push(id);}
  const reachable=queue.map(id=>nodes[id]);
  let position={x:initial.x,y:initial.y,z},heading=Math.PI/2,speed=0,phase=0,total=0,wait=1.1,serial=0,path=[],moving=false,yielding=false,replanIn=0,replans=0,planner=null;
  const planningStats={slices:0,maxSliceMs:0};
  function* choosePath(player=null){
    path=[];replans++;
    const passable=(a,c)=>avoidsPlayer(a,c,player);
    let start;
    for(const node of [...reachable].sort((a,c)=>distance(a,position)-distance(c,position))){if((yield* clearSteps(position,node))&&passable(position,node)){start=node;break;}yield;}
    if(!start)return;
    const prev=new Map([[start.id,null]]),q=[start.id];
    for(let i=0;i<q.length;i++){
      for(const id of nodes[q[i]].neighbors)if(!prev.has(id)&&passable(nodes[q[i]],nodes[id])){prev.set(id,q[i]);q.push(id);}
      if(i%16===15)yield;
    }
    // Alternate distant clear aisles, rather than jitter between nearby cells.
    let ranked=q.map(id=>nodes[id]).filter(n=>distance(n,position)>1.5).sort((a,c)=>distance(c,position)-distance(a,position));
    // A student can divide a narrow aisle. Use the free side instead of waiting
    // forever for a target in the disconnected half of the room.
    if(!ranked.length)ranked=q.map(id=>nodes[id]).filter(n=>distance(n,position)>.45).sort((a,c)=>distance(c,position)-distance(a,position));
    if(!ranked.length)return;
    const target=ranked[(serial++*37)%Math.max(1,Math.floor(ranked.length*.35))];
    const route=[];for(let id=target.id;id!==null&&id!==undefined;id=prev.get(id))route.unshift(nodes[id]);
    let anchor=position;const planned=[];
    while(route.length){
      let index=route.length-1;
      while(index>0&&(!(yield* clearSteps(anchor,route[index]))||!passable(anchor,route[index])))index--;
      const point=route[index];planned.push(point);anchor=point;route.splice(0,index+1);yield;
    }
    path=planned;
  }
  function plan(player){planner=choosePath(player);advancePlan();}
  function advancePlan(){
    const started=clock();let result;
    do{result=planner.next();if(result.done){planner=null;break;}}while(planningBudgetMs<=0||clock()-started<planningBudgetMs);
    planningStats.slices++;planningStats.maxSliceMs=Math.max(planningStats.maxSliceMs,clock()-started);
  }
  const state=()=>({position:{...position},heading,speed,phase,distance:total,moving,yielding,waiting:wait>0,planning:!!planner,planningSlices:planningStats.slices,maxPlanningSliceMs:planningStats.maxSliceMs,roomId:config.roomId,navigationNodes:reachable.length,replans});
  return {getState:state,update(dt,player,{paused=false}={}){
    if(paused||!Number.isFinite(dt)||dt<=0){speed=0;moving=false;return state();}
    dt=Math.min(dt,.05);moving=false;replanIn=Math.max(0,replanIn-dt);
    const obstacle=player&&Math.abs(player.z-z)<1.15?player:null;
    // Physical contact still stops the teacher; merely watching from 0.8–1 m
    // away no longer freezes them indefinitely.
    yielding=!!obstacle&&distance(obstacle,position)<.68;
    if(yielding){speed=0;return state();}
    if(planner){speed=0;advancePlan();if(planner)return state();}
    if(wait>0){wait-=dt;speed=0;return state();}
    if(path.length&&!avoidsPlayer(position,path[0],obstacle)){
      speed=0;yielding=true;
      if(replanIn<=0){plan(obstacle);replanIn=.8;wait=.35;}
      return state();
    }
    if(!path.length){if(replanIn>0)return state();plan(obstacle);replanIn=.8;if(planner||!path.length)return state();}
    const target=path[0],len=distance(position,target);
    if(len<.001){path.shift();if(!path.length)wait=1.2+(serial%4)*.45;speed=0;return state();}
    const dx=(target.x-position.x)/len,dy=(target.y-position.y)/len,angle=turn(heading,Math.atan2(dx,-dy));
    heading+=Math.max(-2*dt,Math.min(2*dt,angle));
    const desired=Math.abs(angle)>.55?0:Math.min(.48,Math.sqrt(len*.8));
    speed+=Math.max(-1.5*dt,Math.min(.65*dt,desired-speed));
    const step=Math.min(speed*dt,len),next={x:position.x+dx*step,y:position.y+dy*step,z};
    if(!safe(next,.04)||!avoidsPlayer(position,next,obstacle)){speed=0;path=[];wait=.4;return state();}
    position=next;total+=step;phase+=step*Math.PI*2/.68;moving=step>.00001;return state();
  }};
}

// Keep synchronous creation for deterministic tools. The live school uses the
// cooperative variant: the same geometry, graph and safety tests, spread out.
export function createTeacherWalk(world,config,options){
  const steps=prepareTeacherWalk(world,config,options);let step;do{step=steps.next();}while(!step.done);return step.value;
}
export async function createTeacherWalkAsync(world,config,{budgetMs=3,planningBudgetMs=2,clock=()=>performance.now(),yieldWork=()=>new Promise(resolve=>setTimeout(resolve,0)),signal}={}){
  const steps=prepareTeacherWalk(world,config,{planningBudgetMs,clock}),budget=Math.max(.5,Math.min(6,budgetMs));let started=clock();
  for(;;){
    if(signal?.aborted){steps.return?.();throw signal.reason??new Error('교사 이동 경로 준비가 취소되었습니다.');}
    const step=steps.next();if(step.done)return step.value;
    if(clock()-started>=budget){await yieldWork();started=clock();}
  }
}
