import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
const w=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url)))),c=w.recyclingShelter;
assert.equal(c.reference.count,5);assert.equal(c.reference.imageIds.length,5);assert(c.reference.ownerConfirmed);
assert.equal(c.boxes.filter(b=>/금속 수거함/.test(b.name)).length,6);assert.equal(c.boxes.filter(b=>/청록 차양/.test(b.name)).length,9);
for(const z of [-.6,0,.8,1.5])assert(w.blocked(35,3,z),'Closed right-hand entrance, including jump height');
for(const start of [{x:35,y:1.5,z:0},{x:35,y:5.8,z:-.6}]){const p=w.move(start,0,start.y<3?5:-5);assert(start.y<3?p.y<3:p.y>3,'No passage through sealed door');}
const place=(x,y)=>({x:c.pose.offsetX-y,y:c.pose.offsetY+(x-c.pose.sourceX)*c.pose.lengthScale,z:-.6});
for(const sequence of [[place(33.4,4.8),place(26.65,4.8)],[place(26.65,4.8),place(33.4,4.8)]]){
 let p=sequence[0];const target=sequence[1],n=300;for(let i=0;i<n;i++)p=w.move(p,(target.x-sequence[0].x)/n,(target.y-sequence[0].y)/n);assert(Math.hypot(p.x-target.x,p.y-target.y)<.02,'Walkable rotated bin aisle');
}
for(const point of [place(27,3.8),place(29,5.66)])assert(w.blocked(point.x,point.y,point.z));
const start=place(33.4,7.8),target=place(33.4,4.8),access=w.move(start,target.x-start.x,0);assert(Math.abs(access.x-target.x)<.02,'Open north end from parking');
assert(!w.boxes.some(b=>/뒤 현관|오른쪽 출입문 봉쇄|닫힌 출입문 패널/.test(b.name)),'No door, frame, ramp or closed-door panels');
assert(!w.surfaces.some(s=>s.name==='뒤 주차장 출입 경사로'));
assert(!c.labels.some(l=>l.text==='출입 금지'));
assert(w.boxes.some(b=>b.name==='후문 철거부 연속 외벽'));
assert.equal(c.parking.spaces,3);assert.equal(c.boxes.filter(b=>b.name.includes('주차 구획선')).length,4);
for(let i=0;i<3;i++){
 const x=c.parking.bounds[0]+(i+.5)*2.5,p=w.move({x,y:10.65,z:-.6},0,-5);
 assert(Math.abs(p.y-5.65)<.02,'Each rotated parking bay is accessible from north');
}
assert.equal(c.parking.axis,'y');
assert(c.boxes.filter(b=>b.name.includes('주차 구획선')).every(b=>b.bounds[4]-b.bounds[1]>4.9&&b.bounds[3]-b.bounds[0]<.1),'Parking bays run vertically / Y');
const bins=c.boxes.filter(b=>/금속 수거함/.test(b.name));
assert(bins.every(b=>b.bounds[0]>36.8&&b.bounds[3]<37.86&&b.bounds[1]>3.2&&b.bounds[4]<10),'Bins fitted against left return wall');
for(let i=0;i<6;i++)assert(c.boxes.find(b=>b.name==='후문 분리수거장 수거함 앞문 '+i).bounds[3]<=bins[i].bounds[0]+.001,'Bin front faces right / -X');
assert(!w.blocked(27,3.8,-.6),'Old shelter footprint cleared');
let p={x:53.75,y:1.5,z:0};p=w.move(p,0,13.5);assert(Math.abs(p.y-15)<.02&&Math.abs(p.z+.6)<.02,'Central stair rear exit retained');
assert(c.boxes.every(o=>o.bounds.every(Number.isFinite)&&o.bounds.slice(0,3).every((n,i)=>n<o.bounds[i+3])));
console.log(JSON.stringify({ok:true,photos:5,bins:6,canopy:true,doorRemoved:true,leftCornerRightFacing:true,parkingBays:3,binAisleWalkable:true,centralExitPreserved:true}));
