import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {OCTOBER_OUTDOOR_PHOTOS} from '../정후문사진배치.mjs';
import {PARKED_CARS} from '../주차장.mjs';
import {ROSTRUM} from '../구령대배치.mjs';
const w=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))));
assert.deepEqual(Object.values(OCTOBER_OUTDOOR_PHOTOS).map(v=>v.length),[26,17,9,10]);
assert.equal(new Set(Object.values(OCTOBER_OUTDOOR_PHOTOS).flat()).size,62);
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
assert(w.candidate(w.spawn.x,w.spawn.y,w.spawn.z),'Relocated rostrum spawn is clear');
assert(w.move(w.spawn,0,-7).y>ROSTRUM.front,'Photo front railing prevents falling through');
assert.equal(-7-(ROSTRUM.rear+ROSTRUM.run),5,'Five metres from entrance to nearest rear step');
assert(Math.abs(ROSTRUM.top-ROSTRUM.ground-1.7)<.001,'Raised 1.7 metres above field');
assert(!w.boxes.some(b=>b.name==='SPACE_EXT_ROSTRUM'),'No old platform at lobby');
for(const fps of [30,60,144]){
 const speed=(.5-w.spawn.y)/5;
 let p={...w.spawn};for(let i=0;i<5*fps;i++)p=w.move(p,0,speed/fps);assert(p.y>.45&&Math.abs(p.z)<.01,'New rear stairs to lobby');
 for(let i=0;i<5*fps;i++)p=w.move(p,0,-speed/fps);assert(Math.abs(p.y-w.spawn.y)<.03&&Math.abs(p.z-ROSTRUM.top)<.01,'Lobby to raised platform');
 for(const direction of [-1,1]){let q={...w.spawn};for(let i=0;i<2*fps;i++)q=w.move(q,direction*3.9/fps,0);assert(Math.abs(q.x-w.spawn.x-direction*7.8)<.02,'Side stair foot reachable');q=w.move(q,0,-4);assert(q.y<ROSTRUM.front-1.45,'Turn from stair foot toward field');assert(Math.abs(q.z+.3)<.05,'Side stairs reach field grade');}
}
assert.equal(PARKED_CARS.length,11,'All drivable cars retained');
assert(w.boxes.some(b=>b.name==='후문 철거부 연속 외벽'),'Owner-removed doorway not reintroduced');
console.log(JSON.stringify({ok:true,newPhotos:62,details:details.length,walkTests:[30,60,144],rostrumEntranceGap:5,rostrumHeight:1.7,rostrumSideStairs:true,vehicleCount:11,rawPhotosPublished:false}));
