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
let routeCount=0,stamps=0,awarded=0;const times=[],selectedRooms=new Set(),orders=new Set();
function traverse(points){
 // Let pushed swing doors settle between independent route simulations.
 for(let i=0;i<40;i++)world.roomDoors.update(.1,{x:52,y:1.75,z:0});
 let p={...points[0]};
 for(const target of points.slice(1)){
  for(let i=0;i<4000;i++){
   const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);if(d<.005)break;
   const step=Math.min(d,RUN_SPEED/60),movement={x:dx/d*step,y:dy/d*step};world.roomDoors.update(1/60,p,movement);p=world.move(p,movement.x,movement.y);
   if(i===3999)assert.fail('Unwalkable route near '+JSON.stringify({p,target,doors:world.roomDoors.getState().filter(d=>d.kind==='swing'&&d.amount>0),colliders:world.colliders.filter(c=>p.x>c.bounds[0]-.4&&p.x<c.bounds[3]+.4&&p.y>c.bounds[1]-.4&&p.y<c.bounds[4]+.4&&p.z>=c.bounds[2]-.1&&p.z<c.bounds[5]).map(c=>c.name)}));
  }
  assert(Math.abs(p.z-target.z)<.08,'stair route elevation');
 }routeCount++;return p;
}
for(let seed=1;seed<=12;seed++){
 let value=Math.imul(seed,0x9e3779b9)>>>0;const random=()=>((value=(value*1664525+1013904223)>>>0)/4294967296),game=createStampMission(map,{speed:RUN_SPEED,random,onStamp:()=>awarded++});game.start();
 const questionIds=new Set(),types=[],categories=[];let pos=map.start,wrongCount=0;
 for(let stage=0;stage<12;stage++){
  const d=game.debug(),s=game.view();types.push(s.type);times.push(s.limit);if(d.roomId)selectedRooms.add(d.roomId);
  assert.equal(s.total,12);assert.equal(s.round,stage+1);assert(s.limit>=240);
  assert.equal(game.answer(d.correct).stamps,stage,'cannot answer remotely');
  assert.equal(game.interact().phase,s.phase,'cannot interact remotely');
  game.tick(20,{position:pos,active:false});assert.equal(game.view().remaining,s.remaining,'menu pause');
  if(seed===1)for(const route of d.routes)traverse(route);
  if(s.type==='drive'){
   assert(s.limit>=480);const c=d.course;pos=c.pickup;
   game.tick(.01,{position:pos});assert.equal(game.view().phase,'pickup');game.interact();assert.equal(game.view().phase,'board');assert(game.view().cargo);
   const vehicle=(phase,p,carId=c.carId,speed=0)=>({phase,carId,speed,cars:[{id:c.carId,position:p}]});
   game.tick(.01,{position:c.checkpoints[0],vehicle:vehicle('walking',c.checkpoints[0])});assert.equal(game.view().checkpoint,0,'walking cannot complete a car checkpoint');
   game.tick(.01,{position:c.checkpoints[0],vehicle:vehicle('driving',c.checkpoints[0],'wrong-car')});assert.equal(game.view().phase,'board','assigned car required');
   game.tick(.01,{position:c.launch,vehicle:vehicle('driving',c.launch)});assert.equal(game.view().phase,'drive');
   game.tick(.01,{position:c.checkpoints[1],vehicle:vehicle('driving',c.checkpoints[1])});assert.equal(game.view().checkpoint,0,'checkpoints are ordered');
   for(const p of c.checkpoints)game.tick(.01,{position:p,vehicle:vehicle('driving',p)});
   assert.equal(game.view().phase,'park');game.tick(2,{position:c.park,vehicle:vehicle('driving',c.park,c.carId,5)});assert.equal(game.view().phase,'park','must stop');
   game.tick(1,{position:c.park,vehicle:vehicle('driving',c.park)});assert.equal(game.view().phase,'unload');
   game.tick(.01,{position:c.drop,vehicle:vehicle('driving',c.park)});game.interact();assert.equal(game.view().stamps,stage,'must exit before delivery');
   pos=c.drop;game.tick(.01,{position:pos,vehicle:vehicle('walking',c.park)});game.interact();
  }else{
   questionIds.add(d.questionId);categories.push(s.category);const q=MISSION_QUESTIONS.find(q=>q.id===d.questionId);assert(q.level<=(stage<4?1:2),'same difficulty range');
   if(s.type==='search'){assert(!JSON.stringify(s).includes(d.roomId),'hidden room stays hidden');game.tick(.01,{position:d.item});assert.equal(game.view().phase,'teacher');}
   if(s.type==='delivery'){game.tick(.01,{position:d.item});assert.equal(game.view().phase,'pickup','explicit pickup required');game.interact();assert.equal(game.view().phase,'teacher');assert(game.view().cargo);}
   async function visit(t){
    const p=map.rooms.get(t.roomId).nearest(t.position);pos={x:p.x,y:p.y,z:p.z};const before=game.view().remaining;
    game.tick(30,{position:pos,npcs:[{...t,modelStatus:'loading'}]});assert.equal(game.view().remaining,before,'NPC loading pause');
    game.tick(.01,{position:pos,npcs:[{...t,position:pos,modelStatus:'ready'}]});
   }
   if(s.type==='relay'){assert.notEqual(d.contact.id,d.teacher.id);await visit(d.contact);assert.equal(game.view().phase,'contact');game.interact();assert.equal(game.view().phase,'teacher');assert(game.view().feedback.includes(q.explanation));}
   await visit(d.teacher);if(s.type!=='search'){assert.equal(game.view().phase,'teacher');game.interact();}assert.equal(game.view().phase,'quiz');
   game.tick(.01,{position:map.start,npcs:[]});assert.equal(game.view().phase,'teacher','walking away dismisses question');await visit(d.teacher);if(s.type!=='search')game.interact();
   const wrong=(d.correct+1)%4;game.answer(wrong);game.answer(wrong);wrongCount++;assert.equal(game.view().mistakes,wrongCount);
   game.answer(d.correct);game.answer(d.correct);
  }
  assert.equal(game.view().stamps,stage+1,'one stamp per mission');assert.equal(game.view().cargo,null);stamps++;
  game.tick(4.6,{position:pos});
 }
 assert.equal(game.view().phase,'complete');assert.equal(questionIds.size,9);assert.equal(categories.filter(c=>c==='영어').length,5);
 for(let c=0;c<3;c++)assert.deepEqual(types.slice(c*4,c*4+4).sort(),['delivery','drive','relay','search']);orders.add(types.join(','));
 game.start();assert.equal(game.view().stamps,0);game.tick(99999,{position:map.start,npcs:teachers.map(t=>({...t,modelStatus:'ready'}))});assert.equal(game.view().phase,'timeout');assert.equal(game.view().remaining,0);game.stop();assert.equal(game.view().phase,'idle');assert.equal(game.view().cargo,null);
}
assert(orders.size>=8,'mission order varies');assert.equal(awarded,144,'One persistent award per completed task; none for repeated answers, timeout or restart');
let saved;const prior=createStampMission(map,{speed:RUN_SPEED,random:()=>0,onHistory:h=>{saved=h;}});prior.start();
const next=createStampMission(map,{speed:RUN_SPEED,random:()=>0,history:JSON.parse(JSON.stringify(saved))});next.start();
assert.notEqual(next.view().grade,prior.view().grade,'reload changes first grade');assert.notEqual(next.debug().questionId,prior.debug().questionId,'question history persists');
for(const r of map.rooms.values())for(const p of r.treasures)assert(world.navigationCandidate(p.x,p.y,p.z));
console.log(JSON.stringify({ok:true,questions:60,connectedRooms:map.rooms.size,simulatedRoutes:routeCount,rounds:stamps,differentRooms:selectedRooms.size,differentSchedules:orders.size,minimumSeconds:Math.min(...times),maximumSeconds:Math.max(...times),delivery:true,teacherRelay:true,vehicleOnlyCheckpoints:true,parkingAndUnloading:true,pause:true},null,2));
