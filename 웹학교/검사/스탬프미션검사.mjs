import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {prepareMissionMap} from '../미션경로.mjs';
import {createStampMission,missionTime} from '../스탬프미션.mjs';
import {MISSION_QUESTIONS} from '../탐험문제.mjs';
import {CLASS_TEACHERS} from '../담임선생님.mjs';
import {OFFICE_CHARACTERS} from '../교장실캐릭터.mjs';
import {RUN_SPEED} from '../달리기모션.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),{interactiveDoors:true});
const teachers=[...CLASS_TEACHERS,...OFFICE_CHARACTERS.map(t=>({...t,id:'office-'+t.id,roomId:'2F_PRINCIPAL'}))];
const map=await prepareMissionMap(world,teachers);
assert.equal(map.rooms.size,43);assert.equal(map.grades.get(2).length,6);
assert.deepEqual([...new Set(map.grades.get(2).map(r=>r.room.floor))].sort(),['2F','3F','4F']);
assert.equal(MISSION_QUESTIONS.length,60);assert.equal(new Set(MISSION_QUESTIONS.map(q=>q.id)).size,60);
for(const q of MISSION_QUESTIONS){assert.equal(new Set(q.answers).size,4);assert(q.explanation);}
const base={distance:200,searchDistance:200,roomCount:7};assert(missionTime({...base,speed:RUN_SPEED/2})>missionTime({...base,speed:RUN_SPEED}));
assert(missionTime({...base,speed:RUN_SPEED*2})<missionTime({...base,speed:RUN_SPEED}));assert.equal(missionTime({distance:1,searchDistance:1,roomCount:1,speed:RUN_SPEED}),240);
let routeCount=0,stamps=0;const times=[],selectedRooms=new Set();
function traverse(points){
 let p={...points[0]};
 for(const target of points.slice(1)){
  for(let i=0;i<4000;i++){
   const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);if(d<.005)break;
   const step=Math.min(d,RUN_SPEED/60),movement={x:dx/d*step,y:dy/d*step};world.roomDoors.update(1/60,p,movement);p=world.move(p,movement.x,movement.y);
   if(i===3999)assert.fail('Unwalkable route near '+JSON.stringify({p,target}));
  }
  assert(Math.abs(p.z-target.z)<.08,'stair route elevation');
 }routeCount++;return p;
}
for(let seed=1;seed<=12;seed++){
 let value=seed;const random=()=>((value=(value*1664525+1013904223)>>>0)/4294967296),game=createStampMission(map,{speed:RUN_SPEED,random});game.start();
 const questionIds=new Set();
 for(let stage=0;stage<4;stage++){
  const debug=game.debug(),s=game.view();selectedRooms.add(debug.roomId);questionIds.add(debug.questionId);times.push(s.limit);
  assert(s.limit>=240);assert(!JSON.stringify(s).includes(debug.roomId),'hidden classroom must not leak into HUD');assert(!('item' in s));
  assert.equal(game.answer(debug.correct).stamps,stage,'cannot answer before collection');
  game.tick(20,{position:map.start,active:false});assert.equal(game.view().remaining,s.remaining,'menu/background pause');
  if(seed===1){traverse(debug.routes[0]);traverse(debug.routes[1]);}
  game.tick(.01,{position:debug.item});assert.equal(game.view().phase,'teacher');
  const teacher=game.teacherTarget(),point=map.rooms.get(teacher.roomId).nearest(teacher.position),position={x:point.x,y:point.y,z:point.z};
  const wait=game.view().remaining;game.tick(30,{position,npcs:[{...teacher,modelStatus:'loading'}]});assert.equal(game.view().remaining,wait,'model loading must not consume time');
  game.tick(.01,{position,npcs:[{...teacher,position,modelStatus:'ready'}]});assert.equal(game.view().phase,'quiz');
  const wrong=(debug.correct+1)%4;game.answer(wrong);game.answer(wrong);assert.equal(game.view().mistakes,stage+1,'same wrong choice counted once');
  game.answer(debug.correct);game.answer(debug.correct);assert.equal(game.view().stamps,stage+1,'one stamp per mission');stamps++;
  game.tick(3.6,{position});
 }
 assert.equal(game.view().phase,'complete');assert.equal(questionIds.size,4);game.start();assert.equal(game.view().stamps,0);game.tick(99999,{position:map.start});assert.equal(game.view().phase,'timeout');assert.equal(game.view().remaining,0);game.stop();assert.equal(game.view().phase,'idle');
}
// Every treasure candidate belongs to a connected classroom aisle.
for(const r of map.rooms.values())for(const p of r.treasures)assert(world.navigationCandidate(p.x,p.y,p.z));
console.log(JSON.stringify({ok:true,questions:60,grades:map.grades.size,connectedRooms:map.rooms.size,simulatedRoutes:routeCount,rounds:stamps,differentTreasureRooms:selectedRooms.size,minimumSeconds:Math.min(...times),maximumSeconds:Math.max(...times),speedScaled:true,pauses:true,hiddenRoomNotDisclosed:true},null,2));
