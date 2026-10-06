import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {HALL_PHOTO_REFERENCE} from '../다목적실사진배치.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),original=JSON.stringify(data),world=buildWorld(data),z=-data.floorHeight;
assert.equal(JSON.stringify(data),original);
assert.equal(new Set(HALL_PHOTO_REFERENCE.imageIds).size,15);
assert.equal(world.hallPhotoFinish.hoops.length,9);
for(const name of ['주황 충격 보호벽','흰 코트 세로선','쌓은 파란 체육 매트','주황 교구 바구니','교구 공','교구실 흰 칸막이'])assert(world.boxes.some(b=>b.name==='다목적실 사진 '+name),name);
assert(world.blocked(-8.1,-5.5,z),'Mats block avatars');
assert(world.blocked(-5.4,-5.5,z),'Storage baskets block avatars');
let p={x:-4,y:1.5,z};
for(const q of [{x:-11,y:1.5},{x:-11,y:-4.2},{x:-7.1,y:-4.2},{x:-6.3,y:-4.2},{x:-11,y:-4.2},{x:-11,y:-8}]){
 for(let step=0;step<400;step++){
  const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);if(d<.02)break;
  p=world.move(p,dx/d*Math.min(.08,d),dy/d*Math.min(.08,d));
 }
 assert(Math.hypot(q.x-p.x,q.y-p.y)<.03,JSON.stringify({p,q}));
}
assert.equal(world.hallPhotoFinish.reference.sourceRoomId,'1F_MULTIPURPOSE');
console.log({ok:true,photos:15,storageAccessible:true,matCollision:true,levelGateExit:true,sourcePreserved:true});
