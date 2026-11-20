import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {OFFICE_STAFF} from '../교무실선생님목록.mjs';
import {createTeacherWalk} from '../선생님교실산책.mjs';
import {prepareMissionMap} from '../미션경로.mjs';
import {createStampMission} from '../스탬프미션.mjs';
import {principalCanGreet} from '../교장선생님인사.mjs';
import {RUN_SPEED} from '../달리기모션.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),{interactiveDoors:true}),fingerprint=JSON.stringify(world.boxes);
const map=await prepareMissionMap(world,OFFICE_STAFF),room=map.rooms.get('2F_STAFF');
const walks=OFFICE_STAFF.map(config=>createTeacherWalk(world,config));let minimum=Infinity;
for(let i=0;i<60*180;i++)for(let j=0;j<walks.length;j++){
 const before=walks[j].getState(),others=walks.filter((_,k)=>k!==j).map(w=>w.getState().position),s=walks[j].update(1/60,null,{others}),p=s.position,b=room.room.bounds;
 assert(world.candidate(p.x,p.y,p.z),'Staff must avoid furniture');assert(p.x>b[0]+.3&&p.x<b[1]-.3&&p.y>b[2]+.3&&p.y<b[3]-.3,'Stay inside office');
 assert(Math.hypot(p.x-before.position.x,p.y-before.position.y)<=.49/60,'No teleport');assert(Math.abs(s.heading-before.heading)<=2/60+1e-8,'Smooth turns');
 for(const other of others){minimum=Math.min(minimum,Math.hypot(p.x-other.x,p.y-other.y));assert(minimum>=.68-1e-8,'Staff do not pass through each other');}
}
const report=walks.map((w,i)=>({id:OFFICE_STAFF[i].id,...w.getState()}));for(const s of report)assert(s.distance>10,s.id+' keeps moving: '+s.distance);
for(let i=0;i<walks.length;i++){
 const walk=walks[i],staff=OFFICE_STAFF[i],position=walk.getState().position;
 for(let j=0;j<60;j++)walk.update(1/60,null,{paused:true});assert.deepEqual(walk.getState().position,position,'Freeze while solving quiz');
 const approach=room.cells.find(p=>Math.hypot(p.x-position.x,p.y-position.y)>.7&&principalCanGreet(p,position,{colliders:world.colliders}));assert(approach,'Moving staff remains reachable for dialogue');
 let seed=19;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),mission=createStampMission(map,{speed:RUN_SPEED,random});
 // Find a treasure mission using the actual draw rather than altering its state.
 for(let tries=0;tries<150;tries++){mission.start();if(mission.view().type==='search'&&mission.debug().teacher.id===staff.id)break;}
 assert.equal(mission.view().type,'search');assert.equal(mission.debug().teacher.id,staff.id);const d=mission.debug();mission.tick(.01,{position:d.item});
 mission.tick(.01,{position:approach,npcs:[{...staff,position,modelStatus:'ready'}],colliders:world.colliders});assert.equal(mission.view().phase,'quiz');
 assert.equal(mission.view().teacher.label,staff.label);mission.answer(d.correct);assert.equal(mission.view().stamps,1);assert.equal(mission.view().phase,'reward');
}
assert.equal(JSON.stringify(world.boxes),fingerprint,'No office furnishings changed');
console.log(JSON.stringify({ok:true,minimumSeparation:minimum,staff:report.map(s=>({id:s.id,distance:s.distance,nodes:s.navigationNodes})),movingQuiz:true}));
