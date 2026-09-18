import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {classroomDevices,classroomTVPose} from '../교실영상기기.mjs';
import {classroomSignPoses} from '../교실팻말.mjs';
import {COMPUTER_GATE} from '../이학년일반.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const world=buildWorld(data),rooms=data.rooms.filter(r=>r.type==='classroom'),signs=classroomSignPoses(data);
assert.equal(rooms.length,41);assert.equal(signs.length,rooms.length);
assert.equal(new Set(signs.map(s=>s.roomId)).size,rooms.length);
for(const room of rooms){
  const tv=world.boxes.filter(b=>b.spaceId===room.id&&b.cornerTV),p=classroomTVPose(room),b=room.bounds;
  assert.equal(tv.length,2,room.id+' exactly one casing and screen');
  assert(tv.every(t=>t.rotation&&t.bounds[5]>t.bounds[2]));
  const towardCenter=[(b[0]+b[1])/2-p.x,(b[2]+b[3])/2-p.y];
  assert(towardCenter[0]*p.normal[0]+towardCenter[1]*p.normal[1]>0,room.id+' screen faces into room');
  assert(Math.abs(Math.abs(p.normal[0])-Math.SQRT1_2)<1e-8);assert(Math.abs(Math.abs(p.normal[1])-Math.SQRT1_2)<1e-8);
  const sign=signs.find(s=>s.roomId===room.id);
  assert.equal(sign.text,room.name.replace(/ 교실$/,''));assert(sign.point.z-sign.height/2>b[4]+2.1,'Above player head');
  if(room.building==='ANNEX'){assert(sign.point.x>100.2&&sign.point.x<101);assert(p.y>b[3]-1&&p.x<b[0]+1);}
  else assert(sign.point.y>0&&sign.point.y<3);
}
assert.equal(classroomDevices(world.boxes,world.data.rooms).length,world.boxes.length,'No duplicate devices');
const c=world.classroom21;
for(const [coordinates,spacing] of [[c.seatRows,1.10],[c.seatColumns,1.32]])
  for(let i=1;i<coordinates.length;i++)assert(Math.abs(coordinates[i]-coordinates[i-1]-spacing)<1e-8,'Uniform desk grid');
const g=COMPUTER_GATE;
for(const x of [101.1,101.5,101.9]){
  const from={x,y:g.y+2,z:g.base},to=world.move(from,0,-5);assert(Math.abs(to.y-(g.y-3))<.07,'Open glass doors allow walking');
}
assert(world.blocked(g.left+.07,g.y+.4,g.base),'Glass leaf remains solid');
assert(world.blocked(g.right-.07,g.y+.4,g.base),'Other glass leaf remains solid');
console.log({ok:true,classroomTVs:rooms.length,doubleSidedSigns:signs.length,uniformClass21Desks:true,glassDoorsOpenAndSolid:true});
