import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {PARKING} from '../주차장.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const world=buildWorld(data),boxes=world.boxes;
const goals=boxes.filter(b=>b.name.startsWith('운동장 골대 가로대'));
assert.equal(goals.length,2);
assert.deepEqual(goals.map(b=>(b.bounds[1]+b.bounds[4])/2).sort((a,b)=>a-b),[-64,-16]);
for(const g of goals){assert.equal((g.bounds[0]+g.bounds[3])/2,38);assert(g.bounds[3]-g.bounds[0]>7);}
assert.equal(boxes.filter(b=>b.name.startsWith('운동장 골대 기둥')).length,4);
for(const name of ['SPACE_EXT_PLAYGROUND','SiteGround'])assert.deepEqual(boxes.find(b=>b.name===name).bounds,data.boxes.find(b=>b.name===name).bounds);
const site=boxes.find(b=>b.name==='SiteGround').bounds,parking=boxes.filter(b=>b.name.startsWith('주차장'));
for(const p of parking){
  const [x,y,,xx,yy]=p.bounds;
  assert(x>=site[0]&&xx<=site[3]&&y>=12&&yy<=site[4],p.name+' outside rear site');
  for(const r of data.rooms){const [a,b,c,d]=r.bounds;assert(xx<=a||x>=b||yy<=c||y>=d,p.name+' overlaps room '+r.id);}
}
assert.equal(boxes.filter(b=>/^주차장 주차선 \d+$/.test(b.name)).length,PARKING.spaces+1);
assert.equal(boxes.filter(b=>b.name.startsWith('주차장 자동차 차체')).length,4);
assert(world.candidate(30,15,-.6));
const q=world.move({x:-20,y:15,z:-.6},79,0);
assert(Math.abs(q.x-59)<.07&&Math.abs(q.y-15)<.07,'Entry aisle blocked');
assert(!world.candidate(19.875,21,-.6),'Car does not block walking');
assert(world.candidate(20,-40,-.3),'Courtyard blocked');
const report={ok:true,goalEnds:'상하',goalCenters:goals.map(g=>[38,(g.bounds[1]+g.bounds[4])/2]),parkingSpaces:PARKING.spaces,parkedCars:4,parkingBehindMain:true,entranceAisleClear:true,carCollision:true,originalFieldAndSiteUnchanged:true};
fs.writeFileSync(new URL('../../공간자료/골대주차장검사.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(report);
