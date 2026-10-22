import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {CLASS_TEACHERS} from '../담임선생님.mjs';
import {createTeacherWalk} from '../선생님교실산책.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),{interactiveDoors:true});
const fingerprint=JSON.stringify([world.data,world.boxes,world.colliders]),report=[];
for(const id of ['teacher-6-2','teacher-6-5'])assert.equal(CLASS_TEACHERS.find(c=>c.id===id).height,1.68*.9,id+' exact 90% height');
for(const config of CLASS_TEACHERS){
  const distances=[];
  for(const fps of [30,60]){
    const walk=createTeacherWalk(world,config),b=world.data.rooms.find(r=>r.id===config.roomId).bounds;let last=walk.getState(),moving=0,waiting=0;
    for(let i=0;i<fps*150;i++){
      const s=walk.update(1/fps,null),p=s.position;
      assert(p.x>b[0]+.3&&p.x<b[1]-.3&&p.y>b[2]+.3&&p.y<b[3]-.3,config.id+' stays in room');
      assert(world.candidate(p.x,p.y,p.z),config.id+' clear of furniture');
      assert(Math.hypot(p.x-last.position.x,p.y-last.position.y)<=.49/fps,config.id+' no teleport');
      assert(Math.abs(s.heading-last.heading)<=2/fps+1e-8,config.id+' smooth turn');
      assert(Math.abs(p.z-b[4])<.03);if(s.moving)moving++;if(s.waiting)waiting++;last=s;
    }
    assert(last.distance>12,config.id+' walks rather than stuck: '+last.distance);assert(moving>fps*20);assert(waiting>fps*2);
    const before=walk.getState();for(let i=0;i<60;i++)walk.update(1/fps,before.position);
    assert.deepEqual(walk.getState().position,before.position,'yield to player');
    for(let i=0;i<60;i++)walk.update(1/fps,null,{paused:true});assert.deepEqual(walk.getState().position,before.position,'menu pause');
    distances.push({fps,distance:+last.distance.toFixed(2),nodes:last.navigationNodes});
  }
  const nearbyWalk=createTeacherWalk(world,config),start=nearbyWalk.getState().position;
  const observer={...start,x:start.x+.8};let minimum=Infinity;
  for(let i=0;i<30*40;i++){
    const s=nearbyWalk.update(1/30,observer),p=s.position;
    minimum=Math.min(minimum,Math.hypot(p.x-observer.x,p.y-observer.y));
    assert(minimum>=.68-1e-8,'Never pass through nearby student');assert(world.candidate(p.x,p.y,p.z));
  }
  assert(nearbyWalk.getState().distance>5,config.id+' keeps walking beside stationary observer');
  // Place an obstacle on the current route, far enough to permit a safe turn.
  const block={...nearbyWalk.getState().position};block.x+=.8;
  const before=nearbyWalk.getState().distance;
  for(let i=0;i<30*30;i++){const s=nearbyWalk.update(1/30,block);assert(Math.hypot(s.position.x-block.x,s.position.y-block.y)>=.68-1e-8);}
  assert(nearbyWalk.getState().distance>before+2,config.id+' replans around moved observer');
  report.push({id:config.id,distances,nearbyObserverDistance:+nearbyWalk.getState().distance.toFixed(2),minimumPlayerClearance:minimum});
}
const smallWorld={data:{rooms:[{id:'small',bounds:[0,2,0,2,0]}]},candidate:()=>true};
const small=createTeacherWalk(smallWorld,{roomId:'small',position:{x:1,y:1,z:0}});
for(let i=0;i<1200;i++)small.update(1/30,null);
assert(small.getState().distance>2,'Short clear aisles do not require a 1.5m destination');
assert.equal(JSON.stringify([world.data,world.boxes,world.colliders]),fingerprint,'Teacher addition never alters classroom furnishings or walls');
console.log(JSON.stringify({ok:true,classroomsPreserved:true,teachers:report},null,2));
