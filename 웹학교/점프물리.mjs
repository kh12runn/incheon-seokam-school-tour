// Swept, sub-stepped jump controller. z is the actual foot height, not a visual offset.
export const JUMP_VELOCITY=5.6,GRAVITY=18;
export function createJumpMotion(world){
  let airborne=false,verticalSpeed=0,landing=0,lastSafe={...world.spawn};
  function reset(){airborne=false;verticalSpeed=0;landing=0;}
  function start(p){
    if(airborne||world.blocked(p.x,p.y,p.z+.04))return false;
    lastSafe={...p};airborne=true;verticalSpeed=JUMP_VELOCITY;landing=0;return true;
  }
  function step(position,dx,dy,dt){
    if(dt<=0)return {...position};
    landing=Math.max(0,landing-dt*5);
    let p={...position};const n=Math.max(1,Math.ceil(dt/(1/120)),Math.ceil(Math.hypot(dx,dy)/.04)),h=dt/n;
    for(let i=0;i<n;i++){
      if(!airborne){
        // After landing on a low object, walk off its edge and fall normally.
        if(world.candidate&&!world.candidate(p.x,p.y,p.z)){airborne=true;verticalSpeed=0;}
        else {p=world.move(p,dx/n,dy/n);continue;}
      }
      p=world.moveAir(p,dx/n,dy/n);
      const nextZ=p.z+verticalSpeed*h-.5*GRAVITY*h*h;verticalSpeed-=GRAVITY*h;
      if(nextZ>p.z&&world.blocked(p.x,p.y,nextZ)){
        let low=p.z,high=nextZ;
        for(let k=0;k<12;k++){const mid=(low+high)/2;if(world.blocked(p.x,p.y,mid))high=mid;else low=mid;}
        p.z=low;verticalSpeed=0;
      }else if(verticalSpeed<=0){
        const ground=world.floorBelow(p.x,p.y,p.z);
        if(Number.isFinite(ground)&&nextZ<=ground){p.z=ground;landing=Math.min(1,Math.abs(verticalSpeed)/JUMP_VELOCITY);airborne=false;verticalSpeed=0;}
        else p.z=nextZ;
      }else p.z=nextZ;
      if(p.z<lastSafe.z-12){p={...lastSafe};reset();}
    }
    return p;
  }
  return {start,step,reset,getState:()=>({airborne,verticalSpeed,landing})};
}
