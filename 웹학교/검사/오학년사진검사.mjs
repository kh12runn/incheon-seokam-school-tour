import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {GRADE5_RESEARCH_ID,grade5ResearchInterior} from '../오학년연수실사진배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),snapshot=JSON.stringify(data),world=buildWorld(data);
assert.equal(JSON.stringify(data),snapshot);
const research=world.specialInteriors.find(c=>c.roomId===GRADE5_RESEARCH_ID);
assert.equal(research.reference.count,7);assert.equal(new Set(research.reference.imageIds).size,7);assert(research.reference.approximateDimensions);
assert.equal(research.chairs.length,8);assert.equal(research.boxes.filter(b=>b.name.includes('교구장 유리문')).length,10);
assert(!world.boxes.some(b=>b.name.includes('외피 보강')&&b.bounds[0]<46&&b.bounds[3]>46&&b.bounds[1]<10.2&&b.bounds[4]>9.9&&b.bounds[2]<8.5&&b.bounds[5]>8.5),'Exterior backing must not conceal the window');
assert(world.blocked(46,9.86,6.8),'Window retains collision');
for(const word of ['회색 타일','코팅기','재단기','냉장고','전자레인지','온수기 배관','분리수거통','창가 모니터','복사기','옷걸이'])assert(research.boxes.some(b=>b.name.includes(word)),word);
for(const c of [research,...world.classroomInteriors.filter(c=>['3F_5-3','3F_5-6'].includes(c.roomId))]){
  assert(world.candidate(c.spawn.x,c.spawn.y,c.spawn.z),c.roomId+' spawn');
  for(const b of [...c.boxes,...c.colliders])assert(b.bounds.every(Number.isFinite)&&b.bounds.slice(0,3).every((v,i)=>v<b.bounds[i+3]),b.name);
}
const c3=world.classroomInteriors.find(c=>c.roomId==='3F_5-3'),c6=world.classroomInteriors.find(c=>c.roomId==='3F_5-6');
assert.equal(c3.photoCount,9);assert.equal(c6.photoCount,9);assert.equal(c3.profile.back,'white-papers');assert.equal(c6.profile.back,'sunflower-autumn');
assert.equal(c3.profile.locker,'green-row');assert.equal(c6.profile.locker,'ivory-row');
assert(c3.boxes.some(b=>b.name.includes('칠판 중앙 흰 보드')));assert(!c6.boxes.some(b=>b.name.includes('칠판 중앙 흰 보드')));
for(const c of [c3,c6])assert.equal(c.boxes.filter(b=>/흰 롤블라인드/.test(b.name)).length,4);
assert(!world.classroomInteriors.find(c=>c.roomId==='3F_5-7').photoDetails?.uploaded);
const route=[[46.1,1.5],[46.1,3.62],[45.17,3.62],[45.17,8.70],[48.84,8.70],[48.84,4.10],[46.1,4.10],[46.1,1.5]].map(([x,y])=>({x,y,z:6.8}));
for(const fps of [30,60,144])for(const sequence of [route,[...route].reverse()]){
  let p={...sequence[0]};for(const q of sequence.slice(1)){
    const from={...p},n=Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)/(4/fps));
    for(let i=0;i<n;i++)p=world.move(p,(q.x-from.x)/n,(q.y-from.y)/n);
    assert(Math.hypot(p.x-q.x,p.y-q.y)<.025,'Research aisle '+JSON.stringify({fps,p,q}));assert.equal(p.z,6.8);
  }
}
for(const p of [[47,6],[49.5,6],[44.4,5.8]])assert(world.blocked(...p,6.8),'Furniture '+p);
// Room-local aperture edits never carve neighbouring rooms or mutate originals.
const boxes=data.boxes.map(b=>({...b,bounds:[...b.bounds]})),colliders=boxes.filter(b=>b.collision),other=JSON.stringify(boxes.filter(b=>b.spaceId!==GRADE5_RESEARCH_ID));
grade5ResearchInterior(data,boxes,colliders);assert.equal(JSON.stringify(boxes.filter(b=>b.spaceId!==GRADE5_RESEARCH_ID)),other);
const first=JSON.stringify(boxes);grade5ResearchInterior(data,boxes,colliders);assert.equal(JSON.stringify(boxes),first,'Aperture edits repeat safely');
console.log(JSON.stringify({ok:true,newPhotos:25,rooms:3,researchChairs:8,glazedDoors:10,allRoutes:true,frameRates:[30,60,144],unphotographedRoomsPreserved:true}));
