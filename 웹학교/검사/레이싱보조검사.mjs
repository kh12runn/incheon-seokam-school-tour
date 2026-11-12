import assert from 'node:assert/strict';
import {createRace,TRACK,trackPoint,nearestTrack} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';

// Regression fixtures use the ordinary update/input API. Setting a starting pose
// isolates collisions; no test driver aligns or teleports the car during escape.
const source=PARKED_CARS[0],DT=1/60,results=[];
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
function fixture(opponents=[]){
 let seed=83;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const race=createRace({car:source,opponents,random});
 for(let i=0;i<190;i++)race.update(DT,{});
 race.obstacles.splice(0);return race;
}
function pose(car,s,lane=0,yaw=trackPoint(s).yaw){
 const p=trackPoint(s,lane);
 Object.assign(car,{x:p.x,z:p.z,s,lane,yaw,height:p.height,speed:0,steering:0,wall:0,hit:0,reverseTime:0,recoveryCooldown:0,stuckTime:0,lastAdvance:s});
 return {x:p.x,z:p.z,yaw,s};
}
function bodyOutside(car){
 // Check the actual four body corners independently of the physics capsules.
 const fx=-Math.sin(car.yaw),fz=-Math.cos(car.yaw),rx=Math.cos(car.yaw),rz=-Math.sin(car.yaw);
 let outside=0;
 for(const along of [-car.dimensions.length/2,0,car.dimensions.length/2])for(const side of [-car.dimensions.width/2,car.dimensions.width/2]){
  const p=nearestTrack(car.x+fx*along+rx*side,car.z+fz*along+rz*side,car.s);
  outside=Math.max(outside,p.distance-p.width/2);
 }
 return outside;
}
function run(race,input,seconds,{before,after}={}){
 let active=0,maxAssistSpeed=0,maxStep=0,maxOutside=0;
 for(let i=0;i<Math.round(seconds/DT);i++){
  before?.(i);const c=race.player,previous={x:c.x,z:c.z};race.update(DT,input);
  if(c.assistActive){active++;maxAssistSpeed=Math.max(maxAssistSpeed,Math.abs(c.speed));assert.ok(c.assistStrength<=.300001);assert.ok(c.speed<=c.profile.speed*.30+.05,'Assistance must stay at 30% normal speed');}
  maxStep=Math.max(maxStep,Math.hypot(c.x-previous.x,c.z-previous.z));maxOutside=Math.max(maxOutside,bodyOutside(c));after?.(i);
 }
 return {active,maxAssistSpeed,maxStep,maxOutside};
}
function check(name,test){try{results.push({name,ok:true,...test()});}catch(error){results.push({name,ok:false,error:error.message});}}
function moved(c,start){return Math.hypot(c.x-start.x,c.z-start.z);}

for(const steer of [-1,1])check(`실제 첫 코너 막힘, ${steer<0?'왼쪽':'오른쪽'} 조향`,()=>{
 const race=fixture();run(race,{throttle:1},25);const c=race.player,start={x:c.x,z:c.z};
 assert.ok(Math.abs(c.speed)<.3,'Fixture must reproduce the stopped W-only corner');
 let maxEscape=0;const stats=run(race,{throttle:1,steer},6,{after(){maxEscape=Math.max(maxEscape,moved(c,start));}});
 assert.ok(stats.active>0,'Contact should enable low-speed assistance');
 // Holding a steering key after escaping can circle back toward the start.
 assert.ok(maxEscape>3,'Forward + steering must escape without reverse');
 assert.ok(stats.maxStep<.8,'Escape must be continuous, without a reset teleport');
 assert.equal(c.resetSerial,0);assert.equal(c.lap,0);assert.ok(stats.maxOutside<.22);
 return {...stats,moved:moved(c,start),maxEscape};
});

for(const wallSide of [-1,1])for(const steer of [-1,1])check(`90도 벽 접촉 ${wallSide}/${steer}`,()=>{
 const race=fixture(),c=race.player;
 const lane=wallSide*(5-c.dimensions.width/2-.12-(c.dimensions.length/2-.18)-.01);
 const start=pose(c,8,lane,wallSide>0?Math.PI:0);
 const stats=run(race,{throttle:1,steer},8);
 assert.ok(stats.active>0);assert.ok(moved(c,start)>3,'Head-on wall escape must work with either steering key');
 assert.ok(stats.maxOutside<.22,'Escape may not pass through the course boundary');
 assert.equal(c.resetSerial,0);return {...stats,moved:moved(c,start)};
});

check('책 장애물 접촉에서 전진 조향',()=>{
 const race=fixture(),c=race.player,start=pose(c,8),p=trackPoint(10.4);
 race.obstacles.push({id:999,s:10.4,lane:0,x:p.x,z:p.z,kind:'books',angle:0});
 const stats=run(race,{throttle:1,steer:1},3.5);
 assert.ok(stats.active>0,'An obstacle contact can enable low-speed assistance');
 assert.ok(moved(c,start)>3);assert.equal(c.resetSerial,0);return stats;
});

for(const input of [{},{steer:1},{throttle:1,steer:1,brake:true}])check('멈춤 입력 보존 '+JSON.stringify(input),()=>{
 const race=fixture();run(race,{throttle:1},25);const c=race.player,start={x:c.x,z:c.z,yaw:c.yaw};
 c.speed=0;const stats=run(race,input,2);
 assert.equal(stats.active,0);assert.ok(moved(c,start)<.005,'No throttle / braking must not cause autonomous motion');
 assert.ok(Math.abs(angle(c.yaw-start.yaw))<.005);return stats;
});

check('평소 직선은 자동 조향하지 않음',()=>{
 const race=fixture(),c=race.player,start=pose(c,8);
 const stats=run(race,{throttle:1},1);
 assert.equal(stats.active,0);assert.ok(Math.abs(angle(c.yaw-start.yaw))<1e-9);assert.ok(moved(c,start)>3);return stats;
});

check('중앙통로 정지 차량을 AI가 얕은 겹침으로 추월',()=>{
 const race=fixture([PARKED_CARS[1]]),player=race.player,ai=race.cars[1];
 const parked=pose(player,126),start=pose(ai,120);
 let minSide=Infinity,passed=false,maxAIOutside=0;
 run(race,{brake:true},22,{before(){pose(player,parked.s);},after(){
  const at=trackPoint(parked.s),forward=(ai.x-player.x)*at.tx+(ai.z-player.z)*at.tz,side=Math.abs((ai.x-player.x)*at.nx+(ai.z-player.z)*at.nz);
  if(Math.abs(forward)<2)minSide=Math.min(minSide,side);
  maxAIOutside=Math.max(maxAIOutside,bodyOutside(ai));if(ai.s>parked.s+6)passed=true;
 }});
 assert.ok(passed,'AI must pass a stationary player in the 5m corridor');
 assert.ok(minSide>(player.dimensions.width+ai.dimensions.width)/2-.52,'Only shallow side overlap is permitted');
 assert.ok(maxAIOutside<.22);assert.equal(ai.recoveries,0,'Passing must not use the jam reset');
 return {passed,minSide,maxAIOutside,advance:ai.s-start.s};
});

check('정면·후면 깊은 차량 관통 차단',()=>{
 const race=fixture([PARKED_CARS[1]]),c=race.player,blocker=race.cars[1];pose(c,8);const parked=pose(blocker,13);
 let nearestGap=Infinity;
 run(race,{throttle:1},9,{before(){pose(blocker,parked.s);blocker.profile={...blocker.profile,launch:0,accel:0,brake:0};},after(){
  const p=trackPoint(8),gap=(blocker.x-c.x)*p.tx+(blocker.z-c.z)*p.tz;nearestGap=Math.min(nearestGap,gap);
 }});
 assert.ok(nearestGap>3.2,'Forward input must not drive through a stationary body');return {nearestGap};
});

check('보조 주행으로 체크포인트 생략 불가',()=>{
 const race=fixture(),c=race.player;pose(c,TRACK.length-.6);Object.assign(c,{started:true,nextCheckpoint:1,checkpoint:0,lap:0,wall:.6});
 run(race,{throttle:1,steer:1},2);
 assert.equal(c.lap,0);assert.equal(c.checkpoint,0);assert.equal(c.nextCheckpoint,1);assert.equal(c.resetSerial,0);
 return {lap:c.lap,checkpoint:c.checkpoint};
});

console.log(JSON.stringify(results,null,2));
assert.equal(results.filter(r=>!r.ok).length,0,'Collision-assistance regressions failed');
