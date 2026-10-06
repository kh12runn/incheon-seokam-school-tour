import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {OCTOBER_OUTDOOR_PHOTOS} from '../정후문사진배치.mjs';
import {PARKED_CARS} from '../주차장.mjs';
const w=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))));
assert.deepEqual(Object.values(OCTOBER_OUTDOOR_PHOTOS).map(v=>v.length),[26,17,9,7]);
assert.equal(new Set(Object.values(OCTOBER_OUTDOOR_PHOTOS).flat()).size,59);
const details=w.boxes.filter(b=>b.name.startsWith('정후문 사진 '));
for(const b of details){assert(b.bounds.every(Number.isFinite));for(let a=0;a<3;a++)assert(b.bounds[a+3]>b.bounds[a],b.name);}
for(const name of ['후문 경비실','후문 차단기','후문 파란 차양','후문 열린 유리문','후문 점자블록','후문 신발 선반','후문 통로 스테인리스 손잡이','정문 위 화단 흰 울타리'])assert(details.some(b=>b.name.includes(name)),name);
for(const fps of [30,60,144]){
 let p={x:-23,y:-13.5,z:-3.4};for(let i=0;i<14*fps;i++)p=w.move(p,4.8/fps,0);assert(p.x>36,'Front uphill route');
 for(const y of [13.5,15,16.5]){let p={x:-22,y,z:-.6};for(let i=0;i<7*fps;i++)p=w.move(p,4.8/fps,0);assert(p.x>10,'Rear gate clear '+y);}
 for(const x of [53.2,53.75,54.3]){
  let p={x,y:1.5,z:0};for(let i=0;i<3*fps;i++)p=w.move(p,0,4.8/fps);assert(p.y>15,'Exit no jump '+x);
  for(let i=0;i<3*fps;i++)p=w.move(p,0,-4.8/fps);assert(Math.abs(p.y-1.5)<.05&&Math.abs(p.z)<.02,'Return no jump');
 }
}
assert(!w.candidate(-19.5,20,-.6),'Security booth solid');
assert(w.candidate(w.spawn.x,w.spawn.y,w.spawn.z),'Existing rostrum spawn unchanged');
assert(w.move(w.spawn,0,-7).y>-12.5,'Photo front railing prevents falling through');
let lobbyWalk=w.move(w.spawn,0,10);assert(lobbyWalk.y>-1.05,'Rostrum rear approach crosses both glazed vestibule lines');lobbyWalk=w.move(lobbyWalk,0,-10);assert(Math.abs(lobbyWalk.y-w.spawn.y)<.03,'Lobby to rostrum round trip');
for(const direction of [-1,1]){let p={...w.spawn};p=w.move(p,direction*7.6,0);assert(Math.abs(p.x-w.spawn.x-direction*7.6)<.02,'Side stair foot reachable');p=w.move(p,0,-3);assert(p.y<-13.95,'Turn from stair foot toward field without hitting seating/rail');assert(Math.abs(p.z+.3)<.05,'Side stairs reach field grade');}
assert.equal(PARKED_CARS.length,11,'All drivable cars retained');
assert(w.boxes.some(b=>b.name==='후문 철거부 연속 외벽'),'Owner-removed doorway not reintroduced');
console.log(JSON.stringify({ok:true,newPhotos:59,details:details.length,walkTests:[30,60,144],rostrumSideStairs:true,vehicleCount:11,rawPhotosPublished:false}));
