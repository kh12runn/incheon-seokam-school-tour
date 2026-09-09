import fs from 'node:fs';
import assert from 'node:assert/strict';
import {floorDestination} from '../층별이동.mjs';
import {buildWorld} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),world=buildWorld(data),checks=[];
for(const building of ['MAIN','ANNEX'])for(const floor of [1,2,3,4]){
  const destination=floorDestination(data,building,floor),p=destination.point;
  assert(world.candidate(p.x,p.y,p.z),destination.label);
  assert.equal(world.roomAt(p).floor,floor);
  assert(data.rooms.some(r=>r.type==='corridor'&&r.building===building&&parseInt(r.floor)===floor&&p.x>r.bounds[0]&&p.x<r.bounds[1]&&p.y>r.bounds[2]&&p.y<r.bounds[3]));
  const dx=-Math.sin(destination.yaw),dy=Math.cos(destination.yaw),q=world.move(p,dx,dy);
  assert(Math.hypot(q.x-p.x,q.y-p.y)>.8,'Cannot walk out of destination');
  checks.push({building,floor,...destination});
}
assert.equal(floorDestination(data,'MAIN',5),null);
assert.equal(floorDestination(data,'OTHER',1),null);
console.log({ok:true,destinations:checks});
