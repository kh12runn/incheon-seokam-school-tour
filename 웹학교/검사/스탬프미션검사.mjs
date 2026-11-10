import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {prepareMissionMap} from '../미션경로.mjs';
import {createStampMission,missionTime} from '../스탬프미션.mjs';
import {MISSION_QUESTIONS,pickQuestion} from '../탐험문제.mjs';
import {createMissionDraws} from '../미션추첨.mjs';
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
// Pool cycling, persistence and eligibility must still work with worst-case RNG.
const draws=createMissionDraws({random:()=>0});
const firstCycle=Array.from({length:6},()=>draws.pick('grades',[1,2,3,4,5,6]));assert.equal(new Set(firstCycle).size,6);
const afterCycle=draws.pick('grades',[1,2,3,4,5,6]);
const restored=createMissionDraws({random:()=>0,history:JSON.parse(JSON.stringify(draws.snapshot()))});
assert.notEqual(restored.pick('grades',[1,2,3,4,5,6]),afterCycle,'restore drawing history');
assert.equal(restored.pick('teachers',['a','b','c'],String,new Set(['a','b'])),'c');
assert.equal(restored.pick('teachers',['a','b','c'],String,new Set(['a','b'])),'c','eligible pool may cycle without selecting excluded teachers');
const historyWithRooms={version:1,bags:{'rooms-2':['room-a'],grades:['1']}};
const roomMemory=createMissionDraws({history:historyWithRooms});roomMemory.pick('grades',[1,2]);assert.deepEqual(roomMemory.snapshot().bags['rooms-2'],['room-a'],'untouched room history survives a save');
for(const category of ['영어','상식'])for(const stage of [0,2]){
 const bag=createMissionDraws({random:()=>0}),pool=MISSION_QUESTIONS.filter(q=>q.category===category&&(stage>1||q.level===1)),seen=new Set();
 for(let i=0;i<pool.length;i++){const q=pickQuestion(category,new Set(),stage,()=>0,bag.pick);assert(!seen.has(q.id),'no repeated eligible question before pool exhaustion');seen.add(q.id);assert.equal(new Set(q.choices).size,4);assert.equal(q.choices[q.correct],q.answers[0]);}
 assert(seen.has(pickQuestion(category,new Set(),stage,()=>0,bag.pick).id),'exhausted question pool renews safely');
}
let routeCount=0,stamps=0;const times=[],selectedRooms=new Set(),byStage=Array.from({length:4},()=>({grades:new Set(),teachers:new Set(),categories:new Set(),kinds:new Set()}));
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
 let value=Math.imul(seed,0x9e3779b9)>>>0;const random=()=>((value=(value*1664525+1013904223)>>>0)/4294967296),game=createStampMission(map,{speed:RUN_SPEED,random});game.start();
 const questionIds=new Set(),runGrades=new Set(),runTeachers=new Set(),categories=[],kinds=[];const firstGrade=game.view().grade;
 for(let stage=0;stage<4;stage++){
  const debug=game.debug(),s=game.view();selectedRooms.add(debug.roomId);questionIds.add(debug.questionId);times.push(s.limit);
  const question=MISSION_QUESTIONS.find(q=>q.id===debug.questionId);assert(question.level<=(stage<2?1:2),'original stage difficulty is preserved');
  runGrades.add(s.grade);runTeachers.add(game.teacherTarget().id);categories.push(s.category);kinds.push(s.kind);
  byStage[stage].grades.add(s.grade);byStage[stage].teachers.add(game.teacherTarget().id);byStage[stage].categories.add(s.category);byStage[stage].kinds.add(s.kind);
  assert.equal(s.limit,missionTime({distance:debug.travel,searchDistance:debug.searchDistance,roomCount:s.roomCount,speed:RUN_SPEED}),'new route still receives full generous time budget');
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
 assert.equal(game.view().phase,'complete');assert.equal(questionIds.size,4);assert.equal(runGrades.size,4);assert.equal(runTeachers.size,4);
 assert.deepEqual(categories.sort(),['상식','상식','영어','영어']);assert.deepEqual(kinds.sort(),['별','별','선물상자','선물상자']);
 game.start();assert.notEqual(game.view().grade,firstGrade,'retry starts with a different grade');assert.equal(game.view().stamps,0);game.tick(99999,{position:map.start});assert.equal(game.view().phase,'timeout');assert.equal(game.view().remaining,0);game.stop();assert.equal(game.view().phase,'idle');
}
for(const stage of byStage){assert(stage.grades.size>=3,'grade progression varies');assert(stage.teachers.size>=3,'no fixed teacher in any round');assert.equal(stage.categories.size,2);assert.equal(stage.kinds.size,2);}
let saved;const prior=createStampMission(map,{speed:RUN_SPEED,random:()=>0,onHistory:h=>{saved=h;}});prior.start();
const next=createStampMission(map,{speed:RUN_SPEED,random:()=>0,history:JSON.parse(JSON.stringify(saved))});next.start();
assert.notEqual(next.view().grade,prior.view().grade,'reload changes starting grade');assert.notEqual(next.debug().questionId,prior.debug().questionId,'reload avoids previous question');assert.notEqual(next.teacherTarget().id,prior.teacherTarget().id,'reload avoids previous teacher');
// Every treasure candidate belongs to a connected classroom aisle.
for(const r of map.rooms.values())for(const p of r.treasures)assert(world.navigationCandidate(p.x,p.y,p.z));
console.log(JSON.stringify({ok:true,questions:60,grades:map.grades.size,connectedRooms:map.rooms.size,simulatedRoutes:routeCount,rounds:stamps,differentTreasureRooms:selectedRooms.size,stageVariety:byStage.map(s=>({grades:s.grades.size,teachers:s.teachers.size,categories:s.categories.size,kinds:s.kinds.size})),minimumSeconds:Math.min(...times),maximumSeconds:Math.max(...times),speedScaled:true,pauses:true,hiddenRoomNotDisclosed:true,historyRestored:true,difficultyPreserved:true},null,2));
