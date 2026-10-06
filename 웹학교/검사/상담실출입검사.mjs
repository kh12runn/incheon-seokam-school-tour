import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {COUNSELING_ID} from '../상담실출입연결.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),snapshot=JSON.stringify(source),w=buildWorld(source),before=buildWorld(source,{additionalPhotos:false});
const c=w.specialInteriors.find(r=>r.roomId===COUNSELING_ID);
assert.equal(JSON.stringify(source),snapshot);assert(c.entryConfirmedByOwner&&!c.entryNeedsConfirmation);
assert.equal(w.roomAt(c.spawn).room.id,COUNSELING_ID,'Through the corridor door immediately enters counseling reception');
assert.equal(c.entryYaw,Math.PI/2);
assert.equal(JSON.stringify(w.classroomInteriors),JSON.stringify(before.classroomInteriors),'No change to classrooms or furniture');
assert.equal(JSON.stringify(w.stairs),JSON.stringify(before.stairs),'Stair shafts and floors retained');
assert.deepEqual(w.boxes.filter(b=>b.spaceId==='3F_5-7'),before.boxes.filter(b=>b.spaceId==='3F_5-7'),'5-7 shared wall never cut');
const waypoints=[[1.3,3.6],[1.3,1.5],[-.85,1.5],[-.85,-.5],[-3,-.5],[-3,-1.4],[-4,-1.4],[-3,-1.4],[-3,-4.8],[-4,-4.8]];
let traversals=0;
for(const fps of [30,60,144])for(const route of [waypoints,[...waypoints].reverse()]){
 let p={x:route[0][0],y:route[0][1],z:6.8};assert(w.candidate(p.x,p.y,p.z));
 for(const [x,y] of route.slice(1)){
  const n=Math.ceil(Math.hypot(x-p.x,y-p.y)/(4.8/fps)),dx=(x-p.x)/n,dy=(y-p.y)/n;
  for(let i=0;i<n;i++)p=w.move(p,dx,dy);
  assert(Math.hypot(p.x-x,p.y-y)<.03,'No jump or teleport: '+JSON.stringify({fps,p,target:[x,y]}));assert.equal(p.z,6.8);traversals++;
 }
}
for(const [x,y] of [[0,.35],[0,2.65],[-3.3,1.5],[-2,3.08],[0,-4.55]])assert(w.blocked(x,y,6.8),'Door surround / old classroom wall remains solid');
assert.equal(w.candidate(-8,1.5,6.8),null,'Cannot walk onto unmodeled exterior roof');
assert(c.boxes.some(b=>b.name==='상담실 출입 열린 여닫이문'));
assert(c.panels.some(p=>p.text==='상담실'));
console.log(JSON.stringify({ok:true,stairToReceptionToBothCounselingZones:true,traversals,frameRates:[30,60,144],noJump:true,otherClassroomsUnchanged:true}));
