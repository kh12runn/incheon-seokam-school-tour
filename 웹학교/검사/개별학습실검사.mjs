import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),snapshot=JSON.stringify(data),w=buildWorld(data);
assert.equal(JSON.stringify(data),snapshot);
for(const [id,count,tops] of [['1F_INDIVIDUAL_4',6,6],['1F_INDIVIDUAL_5',12,4]]){
 const c=w.specialInteriors.find(r=>r.roomId===id);assert(c);assert.equal(c.reference.count,count);assert.equal(c.tops.length,tops);
 for(const b of [...c.boxes,...c.colliders]){const a=b.bounds,r=c.room.bounds;assert(a.every(Number.isFinite));assert(a[0]>=r[0]&&a[3]<=r[1]&&a[1]>=r[2]&&a[4]<=r[3],b.name+' room containment');}
 for(const b of c.colliders){const a=b.bounds;if(a[2]<1.4)assert(w.blocked((a[0]+a[3])/2,(a[1]+a[4])/2,0),b.name);}
 const p=c.point,u=c.room.bounds[3]-c.spawn.y,route=[{x:101.4,y:c.spawn.y,z:0},c.spawn,p(u,1.35),p(1.15,1.35),p(1.15,5.9),p(1.15,1.35),p(u,1.35),c.spawn,{x:101.4,y:c.spawn.y,z:0}];
 for(const fps of [30,60,144]){let pos={...route[0]};for(const q of route.slice(1)){const start={...pos},n=Math.ceil(Math.hypot(q.x-pos.x,q.y-pos.y)/(4/fps));for(let i=0;i<n;i++)pos=w.move(pos,(q.x-start.x)/n,(q.y-start.y)/n);assert(Math.hypot(pos.x-q.x,pos.y-q.y)<.03,id+' aisle '+JSON.stringify({pos,q}));}}
}
assert(!w.boxes.some(b=>b.spaceId==='3F_5-1'&&b.name.includes('창가 이동 보드')));
const four=w.specialInteriors.find(r=>r.roomId==='1F_INDIVIDUAL_4'),five=w.specialInteriors.find(r=>r.roomId==='1F_INDIVIDUAL_5');
assert(four.boxes.some(b=>b.name.includes('교구장 유리문')));assert(!five.boxes.some(b=>b.name.includes('교구장 유리문')));assert.notEqual(four.layout,five.layout);
console.log({ok:true,rooms:2,photos:18,differentLayouts:true,fps:[30,60,144],doorRoundTrip:true,furnitureCollision:true,class51WhiteRectangleRemoved:true});
