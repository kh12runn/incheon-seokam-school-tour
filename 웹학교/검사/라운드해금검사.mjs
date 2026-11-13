import assert from 'node:assert/strict';
import {createRace,raceOpponents} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {createSchoolProgress,PROGRESS_KEY} from '../스쿨런저장.mjs';

for(const rank of [1,2,3,4]){
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const progress=createSchoolProgress(storage),race=createRace({car:PARKED_CARS[0],opponents:raceOpponents(1)});
 // Finishing order only: exercise the actual race state transition, preserving
 // a distinction between winning and qualifying for the next round.
 for(let i=0;i<20;i++)race.update(.25,{});
 assert.equal(race.view().cleared,false,'Leading without finishing does not clear');
 race.player.finish=100;
 race.cars.slice(1).forEach((c,i)=>{c.finish=i<rank-1?80+i:120+i;});
 race.update(1/30,{});const result=race.view();
 assert.equal(result.rank,rank);assert.equal(result.cleared,rank<=3);assert.equal(result.won,rank===1);
 assert.equal(progress.completeRace(1,rank),rank<=3);
 const restored=createSchoolProgress(storage).view();assert.equal(restored.bestRound,rank<=3?1:0);assert.equal(restored.wins,rank===1?1:0);
}
const saved=new Map([[PROGRESS_KEY,JSON.stringify({version:1,stamps:42,bestRound:3,wins:7,awards:[]})]]),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
const progress=createSchoolProgress(storage);progress.completeRace(4,3);progress.completeRace(5,2);
assert.equal(createSchoolProgress(storage).view().bestRound,5);assert.equal(progress.view().wins,7);assert.equal(progress.view().stamps,42);
for(const [round,rank] of [[0,1],[6,1],[2,0],[2,2.5],[2,NaN]])assert.equal(progress.completeRace(round,rank),false);
console.log('Top 3 unlocks verified; 4th/incomplete races stay locked; saved rounds, stamps and real wins preserved.');
