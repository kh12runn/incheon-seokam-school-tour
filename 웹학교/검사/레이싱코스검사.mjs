import assert from 'node:assert/strict';
import {RACE_COURSES,getRaceCourse,TRACK,trackPoint,nearestTrack,RACE_PASSAGES,RACE_SURFACES} from '../레이싱코스.mjs';
import {createRace,makeObstacles,roundRules} from '../레이싱물리.mjs';
import {PARKED_CARS,CAR_DIMENSIONS} from '../주차장.mjs';
const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
const ready=r=>{for(let i=0;i<181;i++)r.update(1/60);};
let seed=9182;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
assert.equal(RACE_COURSES.length,5);assert.equal(new Set(RACE_COURSES.map(c=>c.id)).size,5);
assert.equal(new Set(RACE_COURSES.map(c=>c.layout)).size,3);
assert.deepEqual(RACE_COURSES.map(c=>c.direction),[1,1,1,-1,-1]);
assert.equal(TRACK,getRaceCourse(1));assert.deepEqual(trackPoint(42,1),TRACK.trackPoint(42,1));assert.deepEqual(nearestTrack(40,0),TRACK.nearestTrack(40,0));
assert.equal(getRaceCourse(0),TRACK);assert.equal(getRaceCourse(999),getRaceCourse(5));
const summaries=[];
for(let round=1;round<=5;round++){
 const course=getRaceCourse(round),point=course.trackPoint,near=course.nearestTrack,L=course.length;
 assert.ok(course.name&&course.description);assert.ok(L>400&&L<450);assert.equal(roundRules(round).laps,3);
 assert.ok(course.bounds.minX>=-7&&course.bounds.maxX<=84.001&&course.bounds.minZ>=-42.001&&course.bounds.maxZ<=68.501);
 assert.ok(Math.abs(course.sections.reduce((n,s)=>n+s.length,0)-L)<1e-7);
 let maxCurve=0,maxProjection=0;
 for(let s=-1;s<L+1;s+=.19){
  const p=point(s),next=point(s+.01);assert.ok(Object.values(p).filter(v=>typeof v==='number').every(Number.isFinite));
  assert.ok(Math.abs(Math.hypot(p.tx,p.tz)-1)<1e-8);assert.ok(Math.hypot(p.x-next.x,p.z-next.z)<.0101,'Arc-length parameter must remain uniform');
  assert.ok(Math.abs(angle(next.yaw-p.yaw))<.002,'No abrupt steering at a segment join');
  assert.ok(p.width>=5&&p.width<=10);maxCurve=Math.max(maxCurve,Math.abs(p.curve));
  for(const lane of [0,-1.3,1.3]){
   const side=point(s,lane),project=near(side.x,side.z,s+L*3);maxProjection=Math.max(maxProjection,Math.abs(project.lane-lane));
   assert.ok(Math.abs(project.lane-lane)<.002,'Hinted projection cannot jump to the opposing central lane');
   assert.ok(Math.abs(angle(project.yaw-p.yaw))<.002);
  }
 }
 assert.ok(maxCurve<=.125001,'No corner is tighter than the established eight-metre radius');
 // The same temporary opening and rear apron work for every layout/direction.
 for(const x of [40,48])for(const z of [-10,-5,0,7]){const p=near(x,z);assert.ok(p.distance<1e-6);assert.equal(p.width,5);assert.ok(RACE_PASSAGES.some(q=>x>=q.minX&&x<=q.maxX&&z>=q.minZ&&z<=q.maxZ));}
 for(const [x,z]of [[12,-29],[20,-38],[64,-38],[72,-29]]){assert.ok(near(x,z).distance<1e-6);assert.ok(RACE_SURFACES.some(q=>x>=q.minX&&x<=q.maxX&&z>=q.minZ&&z<=q.maxZ));}
 // Each parked model fits all six grid slots, including reverse S-course grids.
 for(const source of PARKED_CARS){const dimensions=CAR_DIMENSIONS[source.type];
  for(let i=0;i<6;i++){const s=-8-Math.floor(i/2)*6,lane=i%2?2:-2,p=point(s,lane),halfL=dimensions.length/2-.18;
   for(const along of [-halfL,0,halfL]){const q=near(p.x+p.tx*along,p.z+p.tz*along,s);assert.ok(q.distance<=q.width/2-dimensions.width/2-.12+.005,`Grid body outside ${course.id}/${source.id}/${i}`);}
  }
 }
 const race=createRace({round,car:PARKED_CARS[0],random});assert.equal(race.course,course);assert.equal(race.view().course.id,course.id);assert.equal(race.view().checkpointsPerLap,Math.ceil(L/12));
 const p=point(-8,-2);assert.ok(Math.hypot(race.player.x-p.x,race.player.z-p.z)<1e-9);ready(race);
 const heading=race.player.yaw;for(let i=0;i<30;i++){race.update(1/60,{throttle:1});assert.ok(Math.abs(angle(race.player.yaw-heading))<1e-8,'Ordinary forward motion cannot steer itself');}
 const checkpoint=race.player.checkpoint;assert.ok(race.resetCar());assert.equal(race.player.checkpoint,checkpoint);assert.ok(near(race.player.x,race.player.z,race.player.s).distance<3);
 // Crossing the finish without the middle gates still awards no lap.
 const cheat=createRace({round,car:PARKED_CARS[0],random});ready(cheat);const finish=point(L-.6);Object.assign(cheat.player,{x:finish.x,z:finish.z,yaw:finish.yaw,s:L-.6,lane:0,speed:3,started:true,nextCheckpoint:1});for(let i=0;i<45;i++)cheat.update(1/60,{throttle:1});assert.equal(cheat.player.lap,0);assert.equal(cheat.player.checkpoint,0);
 for(let i=0;i<12;i++)for(const o of makeObstacles(round,random,race.cars)){const p=point(o.s,o.lane);assert.ok(Math.hypot(p.x-o.x,p.z-o.z)<1e-9);assert.ok(p.width>7);assert.ok(race.cars.every(c=>Math.abs(((o.s-c.s+L*1.5)%L)-L/2)>=15));}
 summaries.push({round,id:course.id,direction:course.direction,metres:+L.toFixed(2),maximumCurvature:+maxCurve.toFixed(4),projectionError:maxProjection});
}
for(const [forward,reverse]of [[getRaceCourse(2),getRaceCourse(4)],[getRaceCourse(3),getRaceCourse(5)]])for(let s=0;s<forward.length;s+=.63){const a=forward.trackPoint(s,1),b=reverse.trackPoint(-s,-1);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-9);assert.ok(Math.abs(a.curve+b.curve)<1e-9);assert.ok(Math.abs(Math.abs(angle(a.yaw-b.yaw))-Math.PI)<1e-9);}
assert.ok(getRaceCourse(1).nearestTrack(79,45).distance<1e-6);assert.ok(getRaceCourse(2).nearestTrack(79,45).distance>8.9,'Inner circuit must actually change geometry');
assert.ok(getRaceCourse(3).nearestTrack(53.5,58).distance<.05,'S circuit must bend away from the old straight');
console.log(JSON.stringify({ok:true,threeGeometries:true,fiveRoutes:true,unchangedCentralPassages:true,allVehicleGridsFit:true,orderedGates:true,summaries},null,2));
