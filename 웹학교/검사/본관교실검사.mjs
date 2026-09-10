import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {mainClassroomsInterior,isMainClassroom} from '../본관교실.mjs';
import {CLASSROOM_PROFILES} from '../교실별특징.mjs';
const source=JSON.parse(readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),original=JSON.stringify(source);
const before=buildWorld(source,{mainClassrooms:false}),after=buildWorld(source);
assert.equal(JSON.stringify(source),original,'원본 데이터 보존');
assert.deepEqual(after.data,before.data,'모든 방 경계·이름 보존');
assert.deepEqual(after.boxes.filter(b=>!b.interiorRoom),before.boxes,'별관·특별실·복도·6-4 시각 요소 보존');
assert.deepEqual(after.colliders.filter(b=>!b.interiorRoom),before.colliders,'기존 충돌체 보존');
assert.deepEqual(after.classroom64,before.classroom64,'사진 반영한 6-4 보존');
const targets=source.rooms.filter(isMainClassroom);
assert.equal(targets.length,25);assert.equal(after.classroomsMain.rooms.length,24);
const themes=new Set();
for(const interior of after.classroomsMain.rooms){
  const {room,profile,frame,spawn,entry}=interior,b=room.bounds;
  assert.ok(isMainClassroom(room));assert.notEqual(room.id,'4F_6-4');
  assert.equal(profile.photoStatus,'awaiting');assert.deepEqual(profile.observedFeatures,[]);
  assert.ok(!themes.has(profile.theme),'개별 테마');themes.add(profile.theme);
  assert.equal(interior.desks.length,24);assert.equal(interior.chairs.length,24);
  for(const item of [...interior.boxes,...interior.colliders]){
    const a=item.bounds;
    assert.equal(item.spaceId,room.id);
    assert.ok(a.every(Number.isFinite)&&a[0]<a[3]&&a[1]<a[4]&&a[2]<a[5],item.name+' 유효 크기');
    assert.ok(a[0]>=b[0]&&a[3]<=b[1]&&a[1]>=b[2]&&a[4]<=b[3]&&a[2]>=b[4]-.00001&&a[5]<=b[5]+.00001,item.name+' 교실 내부');
  }
  for(const seat of [...interior.desks,...interior.chairs])assert.ok(after.blocked(seat.x,seat.y,b[4]),room.id+' 가구 충돌');
  assert.ok(after.candidate(spawn.x,spawn.y,spawn.z),room.id+' 안전한 바로가기');
  let p={...entry};
  const route=[spawn,frame.point(3.5,-4.37),frame.point(8.85,-4.37),frame.point(8.85,-2.34),frame.point(3.5,-2.34),spawn,entry];
  for(const q of route){
    p=after.move(p,q.x-p.x,q.y-p.y);
    assert.ok(Math.hypot(p.x-q.x,p.y-q.y)<.025,room.id+' 문·통로 막힘 '+JSON.stringify({p,q}));
  }
}
// Future edits must stay scoped to the photographed room, not the shared reference.
const changedId='4F_6-2',profiles=structuredClone(CLASSROOM_PROFILES);
profiles[changedId].lowerWall='#e3c4b5';
const updated=mainClassroomsInterior(after.data,{profiles});
assert.notDeepEqual(updated.rooms.find(r=>r.roomId===changedId).boxes,after.classroomsMain.rooms.find(r=>r.roomId===changedId).boxes);
assert.equal(JSON.stringify(updated.rooms.filter(r=>r.roomId!==changedId)),JSON.stringify(after.classroomsMain.rooms.filter(r=>r.roomId!==changedId)),'한 반 수정 시 나머지 반 보존');
console.log({ok:true,mainClassrooms:25,newInteriors:24,uniqueThemes:themes.size,desks:24*24,chairs:24*24,allDoorsAndAislesReachable:true,annexAndSpecialRoomsUnchanged:true,photo64Unchanged:true});
