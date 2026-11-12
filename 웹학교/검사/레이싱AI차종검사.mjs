import assert from 'node:assert/strict';
import {createRace,roundRules} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';

const vehicles=[...new Map(PARKED_CARS.map(car=>[car.variant??car.type,car])).values()];
const rng=initial=>{let seed=initial;return ()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);};
const report=[];
for(let round=1;round<=5;round++){
 const groupSize=roundRules(round).opponents;
 for(let offset=0;offset<vehicles.length;offset+=groupSize){
  const race=createRace({car:PARKED_CARS[0],opponents:vehicles.slice(offset,offset+groupSize),round,random:rng(109+round*31+offset)});
  const stopped=race.cars.map(()=>0),longest=race.cars.map(()=>0),consecutive=race.cars.map(()=>0);
  for(let tick=0;tick<30*330;tick++){
   race.update(1/30,{brake:true});
   for(const car of race.cars.slice(1)){
    assert.ok([car.x,car.z,car.yaw,car.speed].every(Number.isFinite),'Every supported body must retain finite physics');
    if(car.finish===null&&Math.abs(car.speed)<.3&&race.view().time>5){stopped[car.id]+=1/30;consecutive[car.id]+=1/30;longest[car.id]=Math.max(longest[car.id],consecutive[car.id]);}
    else consecutive[car.id]=0;
   }
   if(race.cars.slice(1).every(car=>car.finish!==null))break;
  }
  for(const car of race.cars.slice(1)){
   const name=car.source.variant??car.source.type,context=`round ${round}, ${name}`;
   assert.ok(car.finish!==null&&car.lap===3,`${context}: finish all three laps through real controls`);
   assert.ok(car.recoveries<=2,`${context}: no persistent traffic lock`);
   assert.ok(longest[car.id]<8,`${context}: no extended standstill`);
   report.push({round,course:race.course.id,car:name,seconds:+car.finish.toFixed(1),recoveries:car.recoveries,stoppedSeconds:+stopped[car.id].toFixed(2),longestStop:+longest[car.id].toFixed(2)});
  }
 }
}
assert.equal(report.length,vehicles.length*5);
console.log(JSON.stringify({ok:true,cars:vehicles.length,courses:5,completed:report.length,report},null,2));
