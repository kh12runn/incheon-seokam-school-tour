import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {exteriorRenderBox,exteriorSkins,courtyardDecor} from '../외관사진디자인.mjs';
import {classroomWindows} from '../창문배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const before=JSON.stringify(data),base=buildWorld(data,{exterior:false}),world=buildWorld(data);
// Graded gate terrain adds footings only when exterior seating/trees are present.
const isExterior=b=>b.name.startsWith('사진야외 ')||b.name.startsWith('정문 연결 기존 시설 기초 ');
const decor=courtyardDecor(),original=world.boxes.filter(b=>!isExterior(b));
assert(JSON.stringify(original)===JSON.stringify(base.boxes),'All existing boxes and classroom furniture preserved');
assert(JSON.stringify(world.colliders.filter(b=>!isExterior(b)))===JSON.stringify(base.colliders),'Only outdoor decor and its footings add collision');
assert.deepEqual(world.data.rooms,base.data.rooms);
assert.equal(JSON.stringify(data),before,'Export remains immutable');
const skins=exteriorSkins(world.boxes,world.data),overlays=skins.filter(b=>b.skinSource);
assert(overlays.length>0);assert.equal(new Set(overlays.map(b=>b.floor)).size,4);
for(const b of [...skins,...decor])for(let i=0;i<3;i++)assert(Number.isFinite(b.bounds[i])&&b.bounds[i+3]>b.bounds[i],b.name);
for(const b of overlays){
  const source=world.boxes.find(x=>x.name===b.skinSource),i=b.skinAxis;
  assert(b.skinNormal<0?b.bounds[i+3]<source.bounds[i]:b.bounds[i]>source.bounds[i+3],'Skin faces outward only');
  for(let j=0;j<3;j++)if(j!==i){assert.equal(b.bounds[j],source.bounds[j]);assert.equal(b.bounds[j+3],source.bounds[j+3]);}
}
// No opaque new skin lies in the middle of an existing classroom view opening.
for(const {cut} of classroomWindows(data)){
  assert(!overlays.some(b=>[0,1,2].every(i=>Math.min(cut[i+3],b.bounds[i+3])-Math.max(cut[i],b.bounds[i])>.00001)),'Exterior skin covers classroom window');
}
for(const b of decor.filter(b=>b.collision)){
  for(const r of world.data.rooms){const [x0,x1,y0,y1]=r.bounds;assert(b.bounds[3]<=x0||b.bounds[0]>=x1||b.bounds[4]<=y0||b.bounds[1]>=y1,b.name+' intrudes into '+r.id);}
}
for(const p of [[20,-40,-.3],[45,-8,0],[30,15,-.6]])assert.equal(!!world.candidate(...p),!!base.candidate(...p),'Existing route changed');
const trunk=decor.find(b=>b.name.includes('수목 줄기'));
assert(!world.candidate((trunk.bounds[0]+trunk.bounds[3])/2,(trunk.bounds[1]+trunk.bounds[4])/2,-.6));
assert.equal(exteriorRenderBox(data.boxes.find(b=>b.name==='SPACE_EXT_PLAYGROUND')).material,'soil');
assert.equal(base.boxes.filter(b=>b.name.startsWith('운동장 골대 가로대')).length,2);
assert.equal(skins.filter(b=>b.name.includes('Window_1F_MAIN_LOBBY')).length,0);
assert(base.boxes.filter(b=>b.interiorRoom).every(b=>exteriorRenderBox(b)===b));
const canopy=decor.filter(b=>b.name.startsWith('사진야외 별관 앞 운동장 '));
assert.equal(canopy.filter(b=>b.name.includes('곡면 차양')).length,120,'One complete canopy moved');
assert.equal(canopy.filter(b=>b.name.includes('관람석')).length,3);
assert(!decor.some(b=>b.name.startsWith('사진야외 운동장 서쪽 ')),'Old opposite-side canopy removed');
assert(canopy.every(b=>b.bounds[0]>85&&b.bounds[3]<=89.05&&b.bounds[1]>=-66.05&&b.bounds[4]<=-24.95),'Canopy is on the annex side of the yard, including roof overhang');
for(let y=-67;y<=-24;y+=.25)assert(world.candidate(90.5,y,-.6),'Walkable passage between canopy and annex at '+y);
assert(!world.candidate(88.95,-66,-.6),'Moved canopy posts retain collision');
console.log({ok:true,exteriorSkins:overlays.length,windowDetails:skins.length-overlays.length,outdoorDetails:decor.length,newSolidDetails:decor.filter(b=>b.collision).length,originalBoxes:original.length,existingCollidersPreserved:true,roomsPreserved:true,openEntrance:true});
