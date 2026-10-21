import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {CLASS_TEACHERS} from '../담임선생님.mjs';
import {createTeacherWalk} from '../선생님교실산책.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),{interactiveDoors:true});
const fingerprint=JSON.stringify([world.data,world.boxes,world.colliders]),report=[];
for(const config of CLASS_TEACHERS){
  const distances=[];
  for(const fps of [30,60]){
    const walk=createTeacherWalk(world,config),b=world.data.rooms.find(r=>r.id===config.roomId).bounds;let last=walk.getState(),moving=0,waiting=0;
    for(let i=0;i<fps*150;i++){
      const s=walk.update(1/fps,null),p=s.position;
      assert(p.x>b[0]+.3&&p.x<b[1]-.3&&p.y>b[2]+.3&&p.y<b[3]-.3,config.id+' stays in room');
      assert(world.candidate(p.x,p.y,p.z),config.id+' clear of furniture');
      assert(Math.hypot(p.x-last.position.x,p.y-last.position.y)<=.49/fps,config.id+' no teleport');
      assert(Math.abs(p.z-b[4])<.03);if(s.moving)moving++;if(s.waiting)waiting++;last=s;
    }
    assert(last.distance>12,config.id+' walks rather than stuck: '+last.distance);assert(moving>fps*20);assert(waiting>fps*2);
    const before=walk.getState();for(let i=0;i<60;i++)walk.update(1/fps,before.position);
    assert.deepEqual(walk.getState().position,before.position,'yield to player');
    for(let i=0;i<60;i++)walk.update(1/fps,null,{paused:true});assert.deepEqual(walk.getState().position,before.position,'menu pause');
    distances.push({fps,distance:+last.distance.toFixed(2),nodes:last.navigationNodes});
  }
  report.push({id:config.id,distances});
}
assert.equal(JSON.stringify([world.data,world.boxes,world.colliders]),fingerprint,'Teacher addition never alters classroom furnishings or walls');
console.log(JSON.stringify({ok:true,classroomsPreserved:true,teachers:report},null,2));
