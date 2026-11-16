import assert from 'node:assert/strict';
import {createRace} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {PICKUP_BOOST} from '../차량성능.mjs';
import {createSchoolProgress} from '../스쿨런저장.mjs';
function fixture(){const r=createRace({car:PARKED_CARS[0],random:()=>.4});for(let i=0;i<32;i++)r.update(.1);r.obstacles.splice(0);place(r,8,10);return r;}
function place(r,s,speed=10){const p=r.course.trackPoint(s);Object.assign(r.player,{x:p.x,z:p.z,height:p.height,s,lane:0,yaw:p.yaw,speed,steering:0,wall:0,contact:0});}
function pickup(r,kind='books',extra={}){const c=r.player,o={id:r.obstacles.length,s:c.s,lane:c.lane,x:c.x,z:c.z,height:c.height,kind,collectedBy:null,...extra};r.obstacles.push(o);return o;}
for(const kind of ['books','chair']){
 const race=fixture(),control=fixture(),item=pickup(race,kind),dt=1/120;
 control.update(dt,{throttle:1});race.update(dt,{throttle:1});
 assert.equal(item.collectedBy,0);assert.equal(race.player.pickups,1);assert.equal(race.player.hits,0);assert.equal(race.player.assistActive,false);
 assert(Math.abs(race.player.speed/control.player.speed-PICKUP_BOOST.multiplier)<1e-8,'instant current-speed multiplier');
 assert.equal(race.view().itemBoostTime,3);assert.equal(race.player.boost,1);
 race.pause();race.update(.25,{throttle:1});assert.equal(race.view().itemBoostTime,3);race.pause(false);
 for(let i=0;i<90;i++)race.update(dt,{brake:true});assert(race.player.speed<.05,'brake still works during item boost');
 const remaining=race.view().itemBoostTime;place(race,item.s,0);race.update(dt,{});assert.equal(race.player.pickups,1);assert(race.view().itemBoostTime<remaining,'collected item cannot be farmed');
 pickup(race,kind);race.update(dt,{});assert.equal(race.player.pickups,2);assert.equal(race.view().itemBoostTime,3,'another item refreshes duration');
 for(let i=0;i<361;i++)race.update(dt,{brake:true});assert.equal(race.view().itemBoostTime,0);assert.equal(race.player.boosting,false);
}
{
 const race=fixture();pickup(race,'books',{height:race.player.height+5});race.update(1/120,{throttle:1});assert.equal(race.player.pickups,0,'no pickup from a bridge above');
 pickup(race);race.update(1/120,{throttle:1});for(let i=0;i<20;i++){pickup(race);race.update(1/120,{throttle:1,boost:true});}
 assert(race.player.speed<=race.player.profile.speed*1.5+.00001,'items and Shift never multiply into runaway speed');assert.equal(race.player.boost,1,'item boost never drains manual gauge');
 assert(race.resetCar());assert.equal(race.view().itemBoostTime,0,'reset clears active boost');
}
{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},p=createSchoolProgress(storage);
 p.stamp('mission-1');assert(p.raceFinish('run-1'));assert.equal(p.view().stamps,3);assert.equal(p.raceFinish('run-1'),false);
 const restored=createSchoolProgress(storage);assert.equal(restored.view().stamps,3);assert.equal(restored.raceFinish('run-1'),false);assert(restored.raceFinish('run-2'));assert.equal(restored.view().stamps,5);
}
console.log('Pickups: both items, 1.5x instant speed, 3 seconds, refresh/no stacking, braking, pause, height, reset, saved +2 finish reward passed');
