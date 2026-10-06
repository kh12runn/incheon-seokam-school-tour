import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {createFootballPhysics,BALL_COUNT,BALL_RADIUS} from '../축구공물리.mjs';
import {EXTRA_TREES,OUTDOOR_YAW} from '../운동장환경.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),before=JSON.stringify(data),school=buildWorld(data);
assert.equal(JSON.stringify(data),before);assert(school.candidate(...Object.values(school.spawn)));assert.equal(OUTDOOR_YAW,0);
assert(school.spawn.y< -7,'Outside main entrance');
assert(school.move(school.spawn,0,-7).y>-12.5,'Photo front guard is solid');
for(const dx of [-7.6,7.6]){let p=school.move(school.spawn,dx,0);assert(Math.abs(p.x-school.spawn.x-dx)<.08,'Walk off rostrum using side stairs');p=school.move(p,0,-3);assert(p.y<-13.95,'Turn from stairs onto field');}
assert(Math.abs(school.move(school.spawn,0,5).y-school.spawn.y-5)<.08,'Rear lobby approach remains open');
assert.equal(EXTRA_TREES.length,18);
const random=()=>{let s=27;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
const distances=[];
for(const fps of [30,60,144]){
  const physics=createFootballPhysics(school,{random:random()});assert.equal(physics.balls.length,BALL_COUNT);
  const b=physics.balls[0],start={...b.position},p={x:start.x,y:start.y-.36,z:-.3},prev={...p,y:p.y-2/fps};
  physics.update(1/fps,p,prev,{active:false});assert.equal(b.kicks,0,'Paused balls do not react');
  physics.update(1/fps,{...p,z:3.4},{...prev,z:3.4});assert.equal(b.kicks,0,'No kick through floors');
  physics.update(1/fps,p,prev);assert.equal(b.kicks,1);assert(b.velocity.y>3&&b.velocity.z>0,'Forward impulse and bounce');
  const away={x:-30,y:-90,z:0};for(let i=0;i<fps*3;i++)physics.update(1/fps,away,away);
  distances.push(b.position.y-start.y);assert(b.position.z>=-.6+BALL_RADIUS-.02,'No falling through ground');
  for(let i=0;i<fps*30;i++)physics.update(1/fps,away,away);
  assert(b.velocity.length()<.1,'Ball comes to rest');
  assert(physics.getState().every(b=>Number.isFinite(b.position.z)));
}
assert(Math.min(...distances)>2,'Ball travels forward');
assert(Math.max(...distances)-Math.min(...distances)<1.8,'Comparable behaviour across frame rates');
console.log({ok:true,balls:BALL_COUNT,trees:EXTRA_TREES.length,spawn:school.spawn,forwardBounce:true,settles:true,paused:true,frameRates:[30,60,144],distances});
