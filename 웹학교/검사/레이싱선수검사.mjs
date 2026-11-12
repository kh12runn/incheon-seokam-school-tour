import assert from 'node:assert/strict';
import {RACE_DRIVERS,pickRaceDrivers,resultDriverBadge} from '../레이싱선수.mjs';
import {CLASS_TEACHERS} from '../담임선생님.mjs';
import {OFFICE_CHARACTERS} from '../교장실캐릭터.mjs';
import {createRace,raceOpponents} from '../레이싱물리.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {carName} from '../차량성능.mjs';

// Names/IDs must stay in sync with the avatars already present in the school.
assert.deepEqual(RACE_DRIVERS,[
 ...CLASS_TEACHERS.map(t=>({id:t.id,name:t.label})),
 ...OFFICE_CHARACTERS.map(t=>({id:'office-'+t.id,name:t.label})),
]);
let seed=19;
const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const seen=new Set();
for(let round=1;round<=100;round++){
 const drivers=pickRaceDrivers(5,random);
 assert.equal(drivers.length,5);
 assert.equal(new Set(drivers.map(d=>d.id)).size,5);
 for(const driver of drivers){assert.ok(RACE_DRIVERS.includes(driver));seen.add(driver.id);}
}
assert.equal(seen.size,RACE_DRIVERS.length,'Every existing teacher can enter a race');
assert.equal(pickRaceDrivers(99,random).length,RACE_DRIVERS.length);
assert.equal(pickRaceDrivers(0,random).length,0);
const first=pickRaceDrivers(5,random),second=pickRaceDrivers(5,random);
assert.notDeepEqual(first,second,'Separate starts draw fresh randomized rosters');
assert.equal(resultDriverBadge('teacher-6-2'),'6-2');
assert.equal(resultDriverBadge('office-cute'),'교장');
assert.equal(resultDriverBadge('teacher-science'),'과학');
assert.equal(resultDriverBadge('player'),'나');

const race=createRace({car:PARKED_CARS[0],opponents:raceOpponents(5,random),round:5,random});
assert.equal(new Set(race.cars.slice(1).map(c=>c.driverId)).size,race.cars.length-1);
for(const row of race.view().standings){
 const car=race.cars.find(c=>c.id===row.id);
 assert.equal(row.driverId,car.driverId);
 assert.equal(row.driverName,car.driverName);
 assert.equal(row.carId,car.source.id);
 assert.equal(row.carName,carName(car.source));
 if(row.id)assert.ok(RACE_DRIVERS.some(d=>d.id===row.driverId&&d.name===row.driverName));
 else assert.equal(row.driverId,'player');
}
console.log('레이싱 선수 검사 통과: 기존 9명 일치, 중복 없는 무작위 배정, 순위·선수·차량 연결');
