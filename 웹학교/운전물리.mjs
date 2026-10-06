import {Body,Box,Vec3,RaycastVehicle,Material,ContactMaterial} from './외부도구/cannon-es.mjs';
import {PARKED_CARS,CAR_DIMENSIONS} from './주차장.mjs';
import {RUN_SPEED} from './달리기모션.mjs';
const CENTER_HEIGHT=.52;
const TRANSITION_SECONDS=1.35;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function boardingPose(phase,progress){
  const t=Math.max(0,Math.min(1,progress)),travel=smooth((t-.22)/.56);
  return {travel,seatBlend:phase==='entering'?travel:1-travel,door:t<.22?smooth(t/.22):t>.78?1-smooth((t-.78)/.22):1};
}
export const DRIVING_TUNING=Object.freeze({forwardSpeed:RUN_SPEED*3,reverseSpeed:RUN_SPEED*2,brakeForce:140,inputDeadzone:.08});
export function createDriving(school,physics){
  physics.enableDrivingTerrain();const material=new Material('car');
  physics.world.addContactMaterial(new ContactMaterial(material,physics.groundMaterial,{friction:.35,restitution:.03}));
  const cars=PARKED_CARS.map(source=>{
    const d=CAR_DIMENSIONS[source.type],body=new Body({mass:0,material,position:new Vec3(source.x,source.y,source.z+CENTER_HEIGHT),linearDamping:.05,angularDamping:.5});
    body.addShape(new Box(new Vec3(d.width*.48,d.length*.48,.25)));
    const sports=source.type==='sports';
    // Every car starts/stops instantly, so soften pitch/roll torque for all
    // chassis while preserving steering and vertical suspension travel.
    body.angularFactor.set(.035,.035,1);
    body.addShape(new Box(new Vec3(d.width*.38,d.length*.27,sports?.22:.30)),new Vec3(0,-.05,sports?.44:.60));
    body.quaternion.setFromAxisAngle(new Vec3(0,0,1),source.yaw);body.vehicleId=source.id;physics.world.addBody(body);
    const vehicle=new RaycastVehicle({chassisBody:body,indexRightAxis:0,indexForwardAxis:1,indexUpAxis:2});
    for(const y of [d.wheelbase/2,-d.wheelbase/2])for(const x of [-d.width*.48,d.width*.48])vehicle.addWheel({
      chassisConnectionPointLocal:new Vec3(x,y,-.03),directionLocal:new Vec3(0,0,-1),axleLocal:new Vec3(1,0,0),
      radius:source.type==='suv'?.365:source.type==='compact'?.29:.325,suspensionRestLength:.24,suspensionStiffness:35,
      dampingRelaxation:4.5,dampingCompression:4.5,maxSuspensionForce:35000,maxSuspensionTravel:.18,frictionSlip:4.5,rollInfluence:.015,isFrontWheel:y>0,
    });
    const proxy=school.colliders.find(b=>b.vehicleId===source.id);
    if(proxy)proxy.containsXY=(x,y,r)=>{const p=body.pointToLocalFrame(new Vec3(x,y,body.position.z));return Math.hypot(Math.max(0,Math.abs(p.x)-d.width/2),Math.max(0,Math.abs(p.y)-d.length/2))<r;};
    return {id:source.id,source,d,body,vehicle,proxy,tuning:DRIVING_TUNING,door:0,steering:0,wheelSpin:0};
  });
  let phase='walking',active=null,route=[],timer=0,transitionFrom=null,transitionTo=null,error='';
  const point=(car,x,y,z=0)=>{const p=car.body.pointToWorldFrame(new Vec3(x,y,z-CENTER_HEIGHT));return {x:p.x,y:p.y,z:p.z};};
  const carYaw=car=>{const d=car.body.vectorToWorldFrame(new Vec3(0,1,0));return Math.atan2(-d.x,d.y);};
  const speed=car=>car.body.velocity.dot(car.body.vectorToWorldFrame(new Vec3(0,1,0)));
  function safePoint(car,x,y){const p=point(car,x,y);return school.candidate(p.x,p.y,p.z);}
  function pathClear(start,points){let p=start;for(const q of points){if(!q)return false;const end=school.move(p,q.x-p.x,q.y-p.y);if(Math.hypot(end.x-q.x,end.y-q.y)>.12)return false;p=end;}return true;}
  function entryPath(car,p){
    const w=car.d.width/2+.62,l=car.d.length/2+.62,door=safePoint(car,-w,.35);
    const fl=safePoint(car,-w,l),bl=safePoint(car,-w,-l),fr=safePoint(car,w,l),br=safePoint(car,w,-l);
    const paths=[[door],[fl,door],[bl,door],[fr,fl,door],[br,bl,door]].filter(points=>pathClear(p,points));
    const length=points=>{let total=0,last=p;for(const q of points){total+=Math.hypot(q.x-last.x,q.y-last.y);last=q;}return total;};
    return paths.sort((a,b)=>length(a)-length(b))[0];
  }
  function nearby(player){
    if(phase!=='walking')return null;
    return cars.filter(c=>Math.abs(c.body.position.z-CENTER_HEIGHT-player.z)<.7&&Math.hypot(c.body.position.x-player.x,c.body.position.y-player.y)<3.2).sort((a,b)=>a.body.position.distanceTo(new Vec3(player.x,player.y,player.z))-b.body.position.distanceTo(new Vec3(player.x,player.y,player.z)))[0]??null;
  }
  function enter(player){
    const car=nearby(player);if(!car)return false;const path=entryPath(car,player);
    if(!path){error='운전석 쪽 통로가 막혀 있습니다.';return false;}
    active=car;route=path;phase='approaching';timer=0;error='';return true;
  }
  // Lower the avatar's root to fit the low coupe roof; the seated hips remain
  // above the cushion instead of leaving a standing-height head through it.
  const seat=()=>point(active,-.36,.15,active.source.type==='sports'?-.43:-.10);
  function resetControls(car){
    car.parkingBrake=false;car.steering=0;car.body.force.setZero();car.body.torque.setZero();
    for(let i=0;i<4;i++){car.vehicle.applyEngineForce(0,i);car.vehicle.setBrake(0,i);car.vehicle.setSteeringValue(0,i);}
  }
  function exitPoint(){
    for(const [x,y] of [[-active.d.width/2-.65,.35],[active.d.width/2+.65,.35],[0,-active.d.length/2-.65],[0,active.d.length/2+.65]]){const p=safePoint(active,x,y);if(p)return p;}
    return null;
  }
  function park(){
    if(!active)return;
    resetControls(active);
    if(active.body.mass){active.vehicle.removeFromWorld(physics.world);active.body.mass=0;active.body.type=Body.STATIC;active.body.updateMassProperties();active.body.velocity.setZero();active.body.angularVelocity.setZero();physics.world.addBody(active.body);}
  }
  function exit(){
    if(phase!=='driving')return false;
    if(active.body.velocity.length()>1){error='차를 멈춘 뒤 내릴 수 있습니다.';return false;}
    const p=exitPoint();if(!p){error='내릴 공간이 없습니다. 열린 곳에 주차해 주세요.';return false;}
    park();transitionFrom=seat();transitionTo=p;phase='exiting';timer=0;error='';return true;
  }
  function cancel(){
    const p=active?exitPoint():null;park();if(active)active.door=0;phase='walking';active=null;route=[];return p??{...school.spawn};
  }
  function update(dt,player,input={},{playing=true}={}){
    if(!playing)return {...player};let p={...player};
    if(phase==='approaching'){
      const target=route[0],distance=Math.hypot(target.x-p.x,target.y-p.y),step=Math.min(distance,dt*2.5);
      const q=school.move(p,(target.x-p.x)/Math.max(distance,.001)*step,(target.y-p.y)/Math.max(distance,.001)*step);
      if(step>.001&&Math.hypot(q.x-p.x,q.y-p.y)<step*.1){error='운전석 쪽 이동이 막혔습니다.';cancel();return p;}p=q;
      if(distance<.10){route.shift();if(!route.length){phase='entering';transitionFrom=p;timer=0;}}
    }else if(phase==='entering'||phase==='exiting'){
      timer+=dt;const t=Math.min(1,timer/TRANSITION_SECONDS),pose=boardingPose(phase,t),s=pose.travel,from=transitionFrom,to=phase==='entering'?seat():transitionTo;
      p={x:from.x+(to.x-from.x)*s,y:from.y+(to.y-from.y)*s,z:from.z+(to.z-from.z)*s};active.door=pose.door;
      if(t>=1){
        if(phase==='entering'){
          resetControls(active);
          phase='driving';physics.world.removeBody(active.body);active.body.mass=1100;active.body.type=Body.DYNAMIC;active.body.updateMassProperties();active.body.wakeUp();active.vehicle.addToWorld(physics.world);
        }else{phase='walking';active.door=0;active=null;}
      }
    }else if(phase==='driving'){
      const car=active,tuning=car.tuning,forward=Math.max(-1,Math.min(1,input.forward||0)),right=Math.max(-1,Math.min(1,input.right||0));
      // Fixed-speed arcade movement. Touch and keys select direction, with no
      // accumulated engine force, acceleration curve or sports-only boost.
      const target=input.brake?0:forward>tuning.inputDeadzone?tuning.forwardSpeed:forward< -tuning.inputDeadzone?-tuning.reverseSpeed:0;
      car.parkingBrake=target===0;
      if(target!==0)car.body.wakeUp();
      if(car.vehicle.numWheelsOnGround>=2||target===0){
        const heading=carYaw(car);
        car.body.velocity.x=-Math.sin(heading)*target;car.body.velocity.y=Math.cos(heading)*target;
      }
      car.steering+=(-right*(.48/(1+Math.abs(target)*.10))-car.steering)*(1-Math.exp(-dt*7));
      for(let i=0;i<4;i++){
        car.vehicle.setSteeringValue(i<2?car.steering:0,i);
        car.vehicle.applyEngineForce(0,i);car.vehicle.setBrake(car.parkingBrake?tuning.brakeForce:0,i);
      }
      p=seat();
    }
    return p;
  }
  function sync(dt=0){
    for(const c of cars){
      // Do not restore target velocity after physics: walls must still stop us.
      if(c===active&&phase==='driving'){
        const heading=carYaw(c),x=-Math.sin(heading),y=Math.cos(heading),v=c.body.velocity.x*x+c.body.velocity.y*y;
        const excess=v-Math.max(-c.tuning.reverseSpeed,Math.min(c.tuning.forwardSpeed,v));
        if(excess){c.body.velocity.x-=x*excess;c.body.velocity.y-=y*excess;}
        // Hold the parking brake after the physics step; wheel constraints can
        // otherwise add a small creep velocity even with the brake held.
        if(c.parkingBrake&&c.vehicle.numWheelsOnGround>=2){c.body.velocity.x=0;c.body.velocity.y=0;}
      }
      const yaw=carYaw(c),w=(Math.abs(Math.cos(yaw))*c.d.width+Math.abs(Math.sin(yaw))*c.d.length)/2,l=(Math.abs(Math.sin(yaw))*c.d.width+Math.abs(Math.cos(yaw))*c.d.length)/2;
      const {x,y,z}=c.body.position;if(c.proxy)c.proxy.bounds=[x-w,y-l,z-CENTER_HEIGHT+.1,x+w,y+l,z-CENTER_HEIGHT+c.d.height];
      c.wheelSpin+=speed(c)*dt/c.vehicle.wheelInfos[0].radius;
    }
  }
  const seatBlend=()=>phase==='driving'?1:phase==='entering'||phase==='exiting'?boardingPose(phase,timer/TRANSITION_SECONDS).seatBlend:0;
  return {cars,nearby,enter,exit,cancel,update,sync,point,get phase(){return phase;},get active(){return active;},get error(){return error;},get seated(){return seatBlend()>.5;},get seatBlend(){return seatBlend();},seat:()=>active?seat():null,
    getState:()=>({phase,seatBlend:seatBlend(),carId:active?.id??null,speed:active?speed(active):0,yaw:active?carYaw(active):0,door:active?.door??0,error,cars:cars.map(c=>({id:c.id,position:point(c,0,0),yaw:carYaw(c)}))})};
}
