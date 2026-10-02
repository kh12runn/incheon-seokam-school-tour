import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {createFootballPhysics} from '../축구공물리.mjs';
import {createDriving,DRIVING_TUNING} from '../운전물리.mjs';
import {RUN_SPEED} from '../달리기모션.mjs';
import {parkingDestination} from '../주차장이동.mjs';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))));
const driving=createDriving(world,createFootballPhysics(world,{count:0}));
for(const [key,id] of [['front','field-lamborghini'],['rear','rear-lamborghini']]){
 const dest=parkingDestination(world,driving,key);assert(dest);assert.equal(dest.carId,id);
 const current=driving.cars.find(c=>c.id===id);
 assert(world.floorBelow(current.source.x,current.source.y,.6,{ignoreVehicles:true})<0,'Movable sports-car roof excluded from terrain');
 assert(world.candidate(dest.position.x,dest.position.y,dest.position.z));assert(driving.enter(dest.position));assert.equal(driving.active.id,id);driving.cancel();
 const car=driving.cars.find(c=>c.id===id),saved=car.body.position.clone();car.body.position.x=80;
 const fallback=parkingDestination(world,driving,key);assert(fallback);assert.notEqual(fallback.carId,id);car.body.position.copy(saved);
}
assert.equal(parkingDestination(world,driving,'invalid'),null);
assert.equal(driving.cars.filter(c=>c.source.type==='sports').length,2);
assert(driving.cars.every(c=>c.tuning===DRIVING_TUNING&&c.tuning.forwardSpeed===RUN_SPEED*3&&c.tuning.reverseSpeed===RUN_SPEED));
const missing={...driving,cars:[]};assert.equal(parkingDestination(world,missing,'rear'),null);
console.log({ok:true,frontAndRear:true,sportsCars:2,safeDriverSideSpawn:true,movedVehicleFallback:true,allCarsSameSpeed:true});
