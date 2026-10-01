import {World,Body,Vec3,Sphere,Box,Plane,Material,ContactMaterial,SAPBroadphase} from './외부도구/cannon-es.mjs';
export const BALL_RADIUS=.115;
export const BALL_COUNT=12;
export function createFootballPhysics(school,{random=Math.random,count=BALL_COUNT}={}){
  const world=new World({gravity:new Vec3(0,0,-9.81),allowSleep:true});world.broadphase=new SAPBroadphase(world);
  const rubber=new Material('football'),ground=new Material('field');
  world.addContactMaterial(new ContactMaterial(rubber,ground,{friction:.48,restitution:.53}));
  world.addContactMaterial(new ContactMaterial(rubber,rubber,{friction:.3,restitution:.65}));
  const floor=new Body({mass:0,material:ground,shape:new Plane(),position:new Vec3(0,0,-.6)});world.addBody(floor);
  function box(b){
    const [x,y,z,X,Y,Z]=b;if(X-x<.005||Y-y<.005||Z-z<.005)return;
    world.addBody(new Body({mass:0,material:ground,shape:new Box(new Vec3((X-x)/2,(Y-y)/2,(Z-z)/2)),position:new Vec3((x+X)/2,(y+Y)/2,(z+Z)/2)}));
  }
  box([-9.5,-69,-.6,85.5,-11,-.3]);
  for(const c of school.colliders){const b=c.bounds;if(b[0]<90&&b[3]>-23&&b[1]<-8&&b[4]>-82&&b[2]<3&&b[5]>-.5)box(b);}
  for(const y of [-65.25,-14.75])box([34.5,y-.035,-.3,41.5,y+.035,2.1]);
  const balls=[];
  for(let i=0;i<count;i++){
    let x,y;
    for(let attempt=0;attempt<100;attempt++){
      x=18+random()*43;y=-22-random()*38;
      if(balls.every(b=>Math.hypot(b.position.x-x,b.position.y-y)>2))break;
    }
    const body=new Body({mass:.43,material:rubber,shape:new Sphere(BALL_RADIUS),position:new Vec3(x,y,-.3+BALL_RADIUS+.015),linearDamping:.28,angularDamping:.3,sleepSpeedLimit:.08,sleepTimeLimit:1.2});
    body.home={x,y};body.lastKick=-Infinity;body.kicks=0;world.addBody(body);balls.push(body);
  }
  let time=0;
  function update(dt,player,previous,{active=true,yaw=0}={}){
    if(!active||dt<=0)return;dt=Math.min(dt,.1);time+=dt;
    const dx=player.x-previous.x,dy=player.y-previous.y,speed=Math.hypot(dx,dy)/dt;
    for(const b of balls){
      const distance=Math.hypot(b.position.x-player.x,b.position.y-player.y),height=b.position.z-player.z;
      // A foot-height contact, not a proximity kick from upstairs or while paused.
      if(distance<.42+BALL_RADIUS&&height>-.05&&height<.62&&time-b.lastKick>.32){
        const ux=speed>.1?dx/(speed*dt):-Math.sin(yaw),uy=speed>.1?dy/(speed*dt):Math.cos(yaw);
        const along=(b.position.x-player.x)*ux+(b.position.y-player.y)*uy;
        if(along>-.15){
          const target=Math.min(8,3.7+speed*.65),current=b.velocity.x*ux+b.velocity.y*uy;
          b.applyImpulse(new Vec3(ux*Math.max(0,target-current)*b.mass,uy*Math.max(0,target-current)*b.mass,Math.max(0,1.6-b.velocity.z)*b.mass));
          b.angularVelocity.set(-uy*target/BALL_RADIUS,ux*target/BALL_RADIUS,0);b.lastKick=time;b.kicks++;
        }
      }
    }
    world.step(1/120,dt,12);
    for(const b of balls){
      if(b.position.z< -5||b.position.x< -23||b.position.x>100||b.position.y< -85||b.position.y>5){
        b.position.set(b.home.x,b.home.y,-.3+BALL_RADIUS);b.velocity.setZero();b.angularVelocity.setZero();b.wakeUp();
      }
    }
  }
  return {balls,update,world,getState:()=>balls.map((b,id)=>({id,position:{x:b.position.x,y:b.position.y,z:b.position.z},velocity:{x:b.velocity.x,y:b.velocity.y,z:b.velocity.z},kicks:b.kicks,sleeping:b.sleepState===Body.SLEEPING}))};
}
