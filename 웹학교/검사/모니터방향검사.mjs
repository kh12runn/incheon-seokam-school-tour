import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {faceMonitorsTowardBoard} from '../모니터방향.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),world=buildWorld(data);
const before=JSON.stringify(world.boxes),fixed=faceMonitorsTowardBoard(world.boxes),changed=fixed.filter((b,i)=>b!==world.boxes[i]);
assert.equal(changed.length,26,'25 main classrooms plus the second monitor in class 6-6');
assert.equal(JSON.stringify(world.boxes),before,'Source geometry and collider references preserved');
const rooms=new Set();
for(const screen of changed){
  assert(screen.name.endsWith('모니터 화면'));rooms.add(screen.spaceId);
  const old=world.boxes.find(b=>b.name===screen.name),casing=world.boxes.find(b=>b.name===screen.name.replace('추가 모니터 화면','두 번째 검정 모니터').replace(/(?<!추가 )모니터 화면$/,'컴퓨터 모니터'));
  assert(casing);assert(screen.bounds[3]<casing.bounds[0]);
  for(const i of [1,2,4,5])assert.equal(screen.bounds[i],old.bounds[i]);
  assert(Math.abs(screen.bounds[3]-screen.bounds[0]-(old.bounds[3]-old.bounds[0]))<1e-8);
}
assert.equal(rooms.size,25);
for(let i=0;i<fixed.length;i++)if(!world.boxes[i].name.endsWith('모니터 화면'))assert.equal(fixed[i],world.boxes[i],'Only desktop screen faces change');
assert(faceMonitorsTowardBoard(fixed).every((b,i)=>b===fixed[i]),'Repeat application must not flip screens back');
console.log({ok:true,desktopScreens:changed.length,classrooms:rooms.size,facing:'chalkboard / negative X',wallMountedTVsUnchanged:true,positionsAndCollisionsPreserved:true});
