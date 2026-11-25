import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {EXTRA_PHOTO_ROOMS,additionalPhotoInteriors} from '../추가공간사진배치.mjs';
import {GRADE4_RESEARCH_ID as ID} from '../사학년연수실사진배치.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),snapshot=JSON.stringify(source);
const world=buildWorld(source,{interactiveDoors:true}),c=world.specialInteriors.find(c=>c.roomId===ID);
assert(c);assert.equal(c.reference.count,10);assert.equal(new Set(c.reference.imageIds).size,10);
assert.equal(c.reference.sourceRoomId,'custom_e4810ef9e89f46aebcb100f0a10e84b3');
assert.equal(JSON.stringify(source),snapshot,'original architecture remains unchanged');
assert.deepEqual(c.room.bounds,source.rooms.find(r=>r.id===ID).bounds);
assert.equal(c.boxes.filter(b=>/자료장 유리문 \d-\d$/.test(b.name)).length,10);
assert.equal(c.boxes.filter(b=>/듀얼 업무 모니터 \d 화면$/.test(b.name)).length,2);
assert.equal(c.chairs.length,9);
for(const s of c.boxes.filter(b=>/듀얼 업무 모니터 \d 화면$/.test(b.name))){const frame=c.boxes.find(b=>b.name===s.name.replace(/ 화면$/,' 화면틀'));assert(s.bounds[1]>frame.bounds[4],'screens face room');}
for(const term of ['복합기 흰 본체','흰 싱크 수납장','연두 서랍장 몸체','흰 냉장고'])assert(c.boxes.find(b=>b.name.endsWith(term)).bounds[3]<82,'utilities are left on entry');
assert(c.boxes.filter(b=>/오른쪽 자료장 뒷판/.test(b.name)).every(b=>b.bounds[0]>87));
for(const b of c.boxes.filter(b=>b.kind==='detail')){const a=b.bounds;assert(a.every(Number.isFinite));assert(a[0]>=80&&a[3]<=88&&a[1]>=3&&a[4]<=10&&a[2]>=10.2&&a[5]<=13.35,b.name+' within room');}
// Both sides of the push door are usable at multiple frame rates.
for(const fps of [30,60,144])for(const direction of [1,-1]){
 let p={x:82.8,y:direction===1?2.2:3.8,z:10.2};
 for(let i=0;i<fps*2;i++){const m={x:0,y:direction*1.3/fps};world.roomDoors.update(1/fps,p,m);p=world.move(p,m.x,m.y);}
 assert(direction===1?p.y>4:p.y<2,'push door crossing '+fps+' '+direction);
 for(let i=0;i<fps*3;i++)world.roomDoors.update(1/fps,{x:0,y:0,z:0});
}
// The left aisle links the entry, copier/sink and rear window without jumping.
let p={...c.spawn};p=world.move(p,-.60,.30);
for(let i=0;i<44;i++){const next=world.move(p,0,.10);assert(next.y>p.y+.09,'left aisle clear at '+p.y);p=next;}
assert(p.y>8.4);
// Furniture is solid, including the table and screen.
for(const [x,y] of [[84.8,6.4],[87.5,5],[80.65,6.3],[84,9.49]])assert.equal(world.candidate(x,y,10.2),null,'furniture collision '+x+','+y);
// Adding this recipe must leave every other photo room exactly as before.
const all=additionalPhotoInteriors(source,structuredClone(source.boxes));const recipe=EXTRA_PHOTO_ROOMS[ID];delete EXTRA_PHOTO_ROOMS[ID];
try{const prior=additionalPhotoInteriors(source,structuredClone(source.boxes));assert(JSON.stringify(all.filter(r=>r.roomId!==ID))===JSON.stringify(prior),'other room geometry and collision unchanged');}finally{EXTRA_PHOTO_ROOMS[ID]=recipe;}
console.log({ok:true,photos:10,glassDoors:10,dualMonitors:2,chairs:9,doorBothDirections:true,aisleClear:true,otherRoomsPreserved:true});
