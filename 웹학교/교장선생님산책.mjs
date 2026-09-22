// Walk the clear furniture aisle, turn beside the window, then return.
export const PRINCIPAL_ROUTES=Object.freeze({
  cute:[[31.15,-3.35,3.4],[32.18,-2.85,3.4],[32.26,-4.35,3.4],[33.23,-5.65,3.4],[34.35,-5.87,3.4],[35.42,-5.59,3.4],[35.92,-5.05,3.4],[35.42,-5.59,3.4],[34.35,-5.87,3.4],[33.23,-5.65,3.4],[32.26,-4.35,3.4],[32.18,-2.85,3.4]],
  lobby:[[47,-2.8,0],[46,-3.7,0],[44.5,-3.7,0],[44.5,-2,0],[46,-2,0]]
});
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function createPrincipalWalk(world,id){
  const route=PRINCIPAL_ROUTES[id].map(([x,y,z])=>({x,y,z}));
  let position={...route[0]},heading=id==='lobby'?Math.PI:Math.PI/2,index=1,wait=id==='cute'?2.2:1.2;
  let speed=0,phase=0,distance=0,pauses=0,yielding=false,moving=false;
  const state=()=>({position:{...position},heading,speed,phase,distance,moving,yielding,waiting:wait>0,waypoint:index});
  return {getState:state,update(dt,player,{paused=false,others=[]}={}){
    if(paused||!Number.isFinite(dt)||dt<=0){speed=0;moving=false;return state();}
    dt=Math.min(dt,.05);
    // Stop to converse before the quiz appears; never chase or push the player.
    yielding=!!player&&Math.abs(player.z-position.z)<1.15&&Math.hypot(player.x-position.x,player.y-position.y)<3.1;
    if(yielding){
      speed=0;moving=false;
      const desired=Math.atan2(player.x-position.x,-(player.y-position.y));
      heading+=Math.max(-1.8*dt,Math.min(1.8*dt,turn(heading,desired)));return state();
    }
    if(wait>0){wait-=dt;speed=0;moving=false;return state();}
    const target=route[index],dx=target.x-position.x,dy=target.y-position.y,len=Math.hypot(dx,dy);
    if(len<.035){index=(index+1)%route.length;wait=[.9,1.7,1.1,2.1][pauses++%4];speed=0;moving=false;return state();}
    const desired=Math.atan2(dx,-dy),angle=turn(heading,desired);
    heading+=Math.max(-1.8*dt,Math.min(1.8*dt,angle));
    const targetSpeed=Math.abs(angle)>.5?0:Math.min(.48,Math.sqrt(1.2*len));
    speed+=Math.max(-1.2*dt,Math.min(.75*dt,targetSpeed-speed));
    const step=Math.min(speed*dt,len),next=world.move(position,dx/len*step,dy/len*step);
    const valid=world.candidate(next.x,next.y,next.z)&&Math.abs(next.z-route[0].z)<.05&&
      (id==='lobby'?(next.x>=44&&next.x<=47.5&&next.y>=-4.2&&next.y<=-1.5):world.roomAt(next).room?.id==='2F_PRINCIPAL');
    const occupied=others.some(p=>Math.abs(p.z-next.z)<1.15&&Math.hypot(p.x-next.x,p.y-next.y)<.72);
    const traveled=Math.hypot(next.x-position.x,next.y-position.y);
    if(!valid||occupied||(step>.001&&traveled<step*.5)){speed=0;moving=false;wait=.6;return state();}
    position=next;distance+=traveled;phase+=traveled*Math.PI*2/.68;moving=traveled>.00001;return state();
  }};
}
