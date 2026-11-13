import assert from 'node:assert/strict';
import {createRace,raceOpponents} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
const reports=[];
for(let round=1;round<=5;round++){
 let seed=72;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const race=createRace({round,car:PARKED_CARS[0],opponents:raceOpponents(round,random),random});
 for(let i=0;i<30*700&&race.cars.slice(1).some(c=>c.finish===null);i++)race.update(1/30,{});
 const opponents=race.cars.slice(1);assert.ok(opponents.every(c=>c.finish!==null),`Round ${round} AI must all finish`);
 reports.push({round,finishSeconds:opponents.map(c=>+c.finish.toFixed(1)),hits:opponents.map(c=>c.hits)});
 console.log(JSON.stringify(reports.at(-1)));
}
console.log('All AI opponents completed all five circuits with a stationary player');
