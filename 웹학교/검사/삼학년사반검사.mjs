import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {mainClassroomsInterior} from '../본관교실.mjs';
import {applyClass34Details,CLASS34_ID,CLASS34_PROFILE} from '../삼학년사반.mjs';
const data=JSON.parse(readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),original=JSON.stringify(data),world=buildWorld(data,{uploadedClassPhotos:false}),config=world.classroomsMain.rooms.find(r=>r.roomId===CLASS34_ID);
assert.equal(JSON.stringify(data),original);assert.equal(config.profile.photoCount,6);assert.equal(config.profile.photoStatus,'reviewed');assert.equal(CLASS34_PROFILE.sourceImageIds.length,6);
for(const r of world.classroomsMain.rooms.filter(r=>r.roomId!==CLASS34_ID))assert.equal(applyClass34Details(r),r,'Other rooms must be untouched');
const base=mainClassroomsInterior(world.data,{photoOverrides:false});
for(const r of base.rooms.filter(r=>![CLASS34_ID,'4F_6-6'].includes(r.roomId)))assert.equal(JSON.stringify(world.classroomsMain.rooms.find(x=>x.roomId===r.roomId)),JSON.stringify(r),r.roomId+' unaffected');
const byName=fragment=>config.boxes.filter(b=>b.name.includes(fragment));
assert.equal(byName('사물함 문 ').length,27);assert.equal(config.photoDetails.latches.length,27);assert.equal(config.photoDetails.fanCount,4);
assert.equal(byName('중앙 흰 칠판').length,1);assert.equal(byName('싱크볼').length,1);assert.equal(byName('검정 분리수거함').length,3);
assert.equal(new Set(byName('의자 좌판').map(b=>b.color.join(','))).size,2);assert.equal(config.desks.length,24);assert.equal(config.chairs.length,24);
for(const seat of [...config.desks,...config.chairs])assert(world.blocked(seat.x,seat.y,0),'Desk and chair collision');
for(const fragment of ['싱크대 하부장','창가 서랍장','뒤 사물함 몸체','철제 선반 충돌','이동 교탁 몸체']){
  const b=config.colliders.find(b=>b.name.includes(fragment));assert(b,fragment+' collider');assert(world.blocked((b.bounds[0]+b.bounds[3])/2,(b.bounds[1]+b.bounds[4])/2,0));
}
let p={...config.entry};for(const q of [config.spawn,config.frame.point(3.5,-4.37),config.frame.point(8.85,-4.37),config.frame.point(8.85,-2.34),config.frame.point(3.5,-2.34),config.spawn,config.entry]){p=world.move(p,q.x-p.x,q.y-p.y);assert(Math.hypot(p.x-q.x,p.y-q.y)<.025,'Door and aisles remain open');}
const tv=world.boxes.filter(b=>b.spaceId===CLASS34_ID&&b.cornerTV);assert.equal(tv.length,2);
const monitors=world.boxes.filter(b=>b.spaceId===CLASS34_ID&&/컴퓨터 모니터$|두 번째 검정 모니터$/.test(b.name));assert.equal(monitors.length,2);
console.log({ok:true,approvedReferences:6,onlyClass34Changed:true,whiteBoard:true,navyAndGreenChairs:true,lockers:27,deskAndChairCollisions:48,doorAndAisles:true,dualMonitors:true,cornerTV:true});
