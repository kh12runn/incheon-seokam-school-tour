import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {PRINCIPAL_ID,OFFICE_FURNITURE,createPrincipalPatrol,officePoint} from '../교장실배치.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),original=JSON.stringify(source);
const before=buildWorld(source,{principalOffice:false}),world=buildWorld(source),office=world.principalOffice;
assert.equal(JSON.stringify(source),original,'원본 구조 보존');assert.deepEqual(world.data,before.data,'모든 방 이름·경계 보존');
assert.ok(JSON.stringify(world.classroom64)===JSON.stringify(before.classroom64),'6-4 보존');assert.ok(JSON.stringify(world.classroomsMain)===JSON.stringify(before.classroomsMain),'일반 교실 모두 보존');
const inside=b=>b.bounds[0]>=29.9&&b.bounds[3]<=37.1&&b.bounds[1]>=-7.24&&b.bounds[4]<=.15&&b.bounds[2]>=3.2&&b.bounds[5]<=6.56;
const oldNames=new Set(before.boxes.map(b=>b.name));
for(const b of world.boxes.filter(b=>!oldNames.has(b.name))){
  // Full-width facade strips may be split outside the window: coverage outside cuts is preserved by subtractBox.
  assert.ok(b.name.includes('PRINCIPAL')||b.name.includes('창 개구부'),b.name);
}
const afterSerialized=new Set(world.boxes.map(b=>JSON.stringify(b)));
for(const b of before.boxes){
  if(afterSerialized.has(JSON.stringify(b)))continue;
  const a=b.bounds;assert(a[0]<37&&a[3]>30&&a[1]<-6.8&&a[4]>-7.24&&a[2]<5.73&&a[5]>4.37,'교장실 창 범위 외 형상 보존 '+b.name);
}
for(const c of office.colliders)assert(inside(c),'가구는 교장실 안 '+c.name);
for(const f of OFFICE_FURNITURE){const p=officePoint(f.u,f.v);assert(world.blocked(p.x,p.y,p.z),f.id+' 충돌');}
assert(world.candidate(office.spawn.x,office.spawn.y,office.spawn.z),'바로가기 비어 있음');
let p=officePoint(2.45,-.9);
for(const target of [office.spawn,officePoint(2.45,1.55),officePoint(2.18,2.85),officePoint(2.26,4.35),officePoint(3.23,5.65),officePoint(2.26,4.35),officePoint(2.45,1.55),officePoint(2.45,-.9)]){
  p=world.move(p,target.x-p.x,target.y-p.y);assert(Math.hypot(p.x-target.x,p.y-target.y)<.04,'입구 왕복 '+JSON.stringify({p,target}));
}
const patrol=createPrincipalPatrol(world),visited=new Set();let moving=0,waiting=0;
for(let i=0;i<20000;i++){
  const s=patrol.update(.05);visited.add(s.waypoint);moving+=Number(s.moving);waiting+=Number(s.waiting);
  assert(world.candidate(s.position.x,s.position.y,s.position.z),'NPC 가구 통과 없음');
  assert.equal(world.roomAt(s.position).room?.id,PRINCIPAL_ID,'NPC 교장실 내부');
}
assert.equal(visited.size,office.route.length,'모든 순찰 구간 도달');assert(moving>100&&waiting>100);
let s=patrol.getState(),held={...s.position};patrol.update(.05,held);assert.deepEqual(patrol.getState().position,held,'사용자 앞 멈춤');
patrol.update(.05,null,true);assert.deepEqual(patrol.getState().position,held,'메뉴 일시정지');
const window=world.colliders.find(b=>b.name==='교실창 충돌막 Window_2F_PRINCIPAL');assert(window);assert(world.blocked((window.bounds[0]+window.bounds[3])/2,-6.88,3.4),'창문 추락 방지');
console.log({ok:true,furniture:OFFICE_FURNITURE.length,patrolSamples:20000,routeSegments:visited.size,doorRoundTrip:true,playerYield:true,otherRoomsPreserved:true,windowCollision:true});
