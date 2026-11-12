import assert from 'node:assert/strict';
import {createRaceAI} from '../레이싱AI.mjs';
import {createRace,raceOpponents,roundRules,trackPoint} from '../레이싱물리.mjs';
import {getRaceCourse} from '../레이싱코스.mjs';
import {PARKED_CARS} from '../주차장.mjs';

// Measured directly from commit e5fc7b9, with a parked player, the original
// 427.796 m course and 30 Hz updates. Only round 1 still uses identical geometry;
// the other rows are historical context, not apples-to-apples speed assertions.
const BASELINE=[
 {round:1,seed:42,average:175.2297408682451},
 {round:1,seed:87,average:180.69776548506016},
 {round:2,seed:42,average:164.24714594430515},
 {round:2,seed:87,average:166.06907526693954},
 {round:3,seed:42,average:140.88880195474235},
 {round:3,seed:87,average:146.65172481715788},
 {round:4,seed:42,average:126.44178557521825},
 {round:4,seed:87,average:118.75886458951443},
 {round:5,seed:42,average:117.5622148837947},
 {round:5,seed:87,average:117.6340925602852},
];
const rng=initial=>{let seed=initial;return ()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);};
const mean=items=>items.reduce((sum,n)=>sum+n,0)/items.length;
function place(c,s,lane=0,speed=0,course=getRaceCourse(1)){const p=course.trackPoint(s,lane);Object.assign(c,{x:p.x,z:p.z,s,lane,speed,yaw:p.yaw});}
function decisionFixture(round=3,course=getRaceCourse(1)){
 const random=rng(42),race=createRace({car:PARKED_CARS[0],opponents:[PARKED_CARS[1]],round,random});
 const c=race.cars[1],other=race.player,obstacles=[];let now=5;
 place(c,8,0,11);place(other,65,0,8);
 const ai=createRaceAI({cars:race.cars,obstacles:()=>obstacles,rules:roundRules(round),course,random,time:()=>now});
 return {race,c,other,obstacles,ai,advance(seconds){now+=seconds;}};
}

{
 const f=decisionFixture(),o=trackPoint(24);f.obstacles.push({id:1,s:24,lane:0,x:o.x,z:o.z});
 f.ai(f.c);assert.ok(Math.abs(f.c.aiLane)>1.5,'Plan an open lane before reaching books/chairs');
}
{
 const f=decisionFixture();place(f.other,21,0,6);f.ai(f.c);
 assert.equal(f.c.passingId,f.other.id,'Overtake a slower moving car, not just parked cars');
 const side=Math.sign(f.c.aiLane);assert.notEqual(side,0);
 for(let i=0;i<5;i++){f.advance(.2);f.ai(f.c);assert.equal(Math.sign(f.c.aiLane),side,'Commit to a passing side instead of weaving');}
}
{
 const f=decisionFixture();place(f.c,120,0,8);place(f.other,125,0,6);
 const input=f.ai(f.c);assert.equal(Math.abs(f.c.aiLane),0);assert.ok(input.throttle<.4,'Yield safely when merging behind a moving car in the lobby');
}
{
 const f=decisionFixture();f.c.dimensions={...f.c.dimensions,width:1.90};place(f.c,120,0,3);place(f.other,126,0,0);f.ai(f.c);
 assert.equal(f.c.passingId,f.other.id);
 assert.ok(Math.abs(f.c.aiLane)>=1.40,'A stopped-car passing lane must clear the hard collision hull, including SUV width');
 assert.ok(Math.abs(f.c.aiLane)<=1.43,'The passing lane must remain within the corridor boundary');
}
{
 const f=decisionFixture();place(f.other,21,0,6);f.ai(f.c);assert.equal(f.c.passingId,f.other.id);
 place(f.c,120,0,8);place(f.other,129,0,10);f.advance(.3);f.ai(f.c);
 assert.equal(f.c.passingId,null,'Cancel a narrow-section overtake if the target is faster than passing speed');
 assert.equal(Math.abs(f.c.aiLane),0);
}
{
 const f=decisionFixture();const state=()=>Object.fromEntries(['x','z','s','yaw','speed','lap','checkpoint','progress'].map(k=>[k,f.c[k]])),before=state();
 for(let i=0;i<240;i++){const input=f.ai(f.c);assert.ok(Number.isFinite(input.throttle)&&Number.isFinite(input.steer));assert.ok(input.throttle>=0&&input.throttle<=1&&Math.abs(input.steer)<=1);f.advance(1/120);}
 assert.deepEqual(state(),before,'AI may only return controls, never write pose/progress/speed');
 assert.ok(f.c.aiPlan.decisions<=13,'Expensive perception must remain below 6 decisions per second');
}
{
 const f=decisionFixture();f.c.wall=1;f.c.speed=0;
 for(let i=0;i<240;i++){f.ai(f.c);f.advance(1/120);}
 assert.ok(f.c.aiPlan.decisions<=13,'A blocked bumper must not restart expensive perception every physics step');
}
{
 const a=decisionFixture(),b=decisionFixture();b.other.lap=9;b.other.progress=99999;
 assert.deepEqual(a.ai(a.c),b.ai(b.c),'No player-rank rubber banding');
}
for(let round=1;round<=5;round++){
 const course=getRaceCourse(round),fixture=decisionFixture(round,course);
 const signs=new Set();
 for(let s=0;s<course.length;s+=1){
  const at=course.trackPoint(s),ahead=course.trackPoint(s+6);
  if(Math.abs(at.curve)<.04||at.curve*ahead.curve<=0)continue;
  const sign=Math.sign(at.curve);if(signs.has(sign))continue;
  place(fixture.c,s,0,5,course);fixture.other.finish=0;fixture.advance(1);
  const input=fixture.ai(fixture.c);
  assert.equal(Math.sign(input.steer),-sign,`${course.id}: steering must follow actual signed curvature`);
  signs.add(sign);
 }
 assert.equal(signs.size,2,`${course.id}: exercise both left and right corners`);
}
{
 const random=rng(42),suv=PARKED_CARS.find(c=>c.type==='suv');assert.ok(suv);
 const race=createRace({car:PARKED_CARS[0],opponents:[suv],round:3,random});
 for(let i=0;i<190;i++)race.update(1/60,{brake:true});race.obstacles.splice(0);
 const course=race.course;let entrance;
 for(let s=20;s<course.length-30;s++)if([0,6,12,18].every(d=>{const p=course.trackPoint(s+d);return p.width===5&&Math.abs(p.curve)<.001;})){entrance=s;break;}
 assert.ok(Number.isFinite(entrance),'Find a real 5m straight in the selected course');
 const player=race.player,ai=race.cars[1];place(player,entrance+6,0,0,course);place(ai,entrance,0,0,course);let passed=false,maxOverlap=0;
 // Sample the rotating body centerlines, rather than measuring separation along
 // the road axes (which overstates overlap while one car is changing lanes).
 const sample=(c,t)=>{const d=(c.dimensions.length-c.dimensions.width)*(t-.5);return {x:c.x-Math.sin(c.yaw)*d,z:c.z-Math.cos(c.yaw)*d};};
 for(let i=0;i<60*22;i++){
  place(player,entrance+6,0,0,course);race.update(1/60,{brake:true});
  if(Math.hypot(ai.x-player.x,ai.z-player.z)<6){
   let separation=Infinity;
   for(let a=0;a<=40;a++)for(let b=0;b<=40;b++){const p=sample(player,a/40),q=sample(ai,b/40);separation=Math.min(separation,Math.hypot(p.x-q.x,p.z-q.z));}
   maxOverlap=Math.max(maxOverlap,(player.dimensions.width+ai.dimensions.width)/2-separation);
  }
  if(ai.s>entrance+12)passed=true;
 }
 assert.ok(passed,'A full-size SUV must pass the stopped sedan in the 5m lobby');
 assert.ok(maxOverlap<.52,`SUV passing must retain shallow body overlap: ${maxOverlap}`);
 assert.equal(ai.recoveries,0,'SUV passing must not rely on recovery teleportation');
 console.log(JSON.stringify({narrowSUVPass:true,maxBodyOverlap:+maxOverlap.toFixed(4),advance:+(ai.s-entrance).toFixed(1)}));
}
console.log('AI decisions: obstacle anticipation, moving-car overtake, lane commitment, safe merge, input-only control, bounded perception, no rubber banding passed.');

if(!process.argv.includes('--quick')){
 const report=[];
 for(const baseline of BASELINE){
  const {round,seed}=baseline,random=rng(seed),race=createRace({car:PARKED_CARS[0],opponents:raceOpponents(round,random),round,random});
  const jam=Array(race.cars.length).fill(0);let overtakes=0,previousOrder=race.cars.slice(1).map(c=>c.id);
  for(let tick=0;tick<30*330;tick++){
   race.update(1/30,{brake:true});const now=race.view().time;
   for(const c of race.cars.slice(1))if(c.finish===null&&Math.abs(c.speed)<.3&&now>5)jam[c.id]+=1/30;
   if(tick%15===0&&now>12){
    const order=[...race.cars.slice(1)].sort((a,b)=>a.finish!==null&&b.finish!==null?a.finish-b.finish:a.finish!==null?-1:b.finish!==null?1:b.progress-a.progress).map(c=>c.id);
    for(let i=0;i<order.length;i++)for(let j=i+1;j<order.length;j++)if(previousOrder.indexOf(order[i])>previousOrder.indexOf(order[j]))overtakes++;
    previousOrder=order;
   }
   if(race.cars.slice(1).every(c=>c.finish!==null))break;
  }
  const rivals=race.cars.slice(1);
  assert.ok(rivals.every(c=>c.finish!==null&&c.lap===3),`Every AI must finish three laps: ${round}/${seed}`);
  assert.ok(rivals.every(c=>c.recoveries<=2),`No persistent AI traffic jam: ${round}/${seed}`);
  assert.ok(jam.slice(1).every(seconds=>seconds<20),'Opponents must not remain stationary for long');
  const average=mean(rivals.map(c=>c.finish)),previous=baseline.average;
  if(round===1)assert.ok(average<previous*.97,'The same opening course must improve on e5fc7b9');
  report.push({round,seed,course:race.course.id,length:+race.course.length.toFixed(2),baselineAverage:+previous.toFixed(1),sameCourse:round===1,average:+average.toFixed(1),overtakes,cars:rivals.map(c=>({id:c.id,time:+c.finish.toFixed(1),laps:c.lap,hits:c.hits,recoveries:c.recoveries,stuckSeconds:+jam[c.id].toFixed(1)}))});
 }
 assert.ok(report.some(r=>r.overtakes>0),'Real race positions should change through passing');
 console.log(JSON.stringify({ok:true,baseline:'e5fc7b9',report},null,2));
}
