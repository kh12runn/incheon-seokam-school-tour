import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld,localPoint} from '../이동물리.mjs';
import {classroomDevices,classroomTVPose} from '../교실영상기기.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),world=buildWorld(data);
const screens=world.boxes.filter(b=>b.name.endsWith('모니터 화면'));
assert.equal(screens.length,50,'25 furnished classrooms, exactly two monitors each');
for(const room of data.rooms.filter(r=>r.type==='classroom'&&r.building==='MAIN')){
  const own=screens.filter(b=>b.spaceId===room.id||b.interiorRoom===room.id);
  assert.equal(own.length,2,room.id);
  for(const screen of own){
    const casing=world.boxes.find(b=>b.name===screen.name.replace('추가 모니터 화면','두 번째 검정 모니터').replace(/(?<!추가 )모니터 화면$/,'컴퓨터 모니터'));
    assert(casing&&(screen.boardDirection===1?screen.bounds[0]>casing.bounds[3]:screen.bounds[3]<casing.bounds[0]),screen.name);
  }
  const tv=world.boxes.filter(b=>(b.spaceId===room.id||b.interiorRoom===room.id)&&b.cornerTV);
  assert.equal(tv.length,2,room.id+' TV casing + display');
  const pose=classroomTVPose(room);assert(room.id==='4F_4-3'?pose.normal[0]<0:pose.normal[0]>0);
  assert.equal(Math.sign(pose.normal[1]),room.bounds[2]>=3?-1:1);
  for(const box of tv){
    const b=box.bounds,dx=(b[3]-b[0])/2,dy=(b[4]-b[1])/2,h=(dx+dy)*Math.SQRT1_2,cx=(b[0]+b[3])/2,cy=(b[1]+b[4])/2;
    assert(cx-h>room.bounds[0]+.1&&cx+h<room.bounds[1]-.1);
    assert(cy-h>room.bounds[2]+.1&&cy+h<room.bounds[3]-.1);
  }
}
assert.equal(classroomDevices(world.boxes,world.data.rooms).length,world.boxes.length,'No duplicate monitors on repeat');
const near=(a,b)=>assert(Math.abs(a-b)<.075,`${a} != ${b}`);
const go=(p,x,y)=>{const q=world.move(p,x-p.x,y-p.y);near(q.x,x);near(q.y,y);return q;};
let p={x:35,y:1.5,z:0};p=go(p,35,15);near(p.z,-.6);p=go(p,35,1.5);near(p.z,0);
assert(world.blocked(33,3,0),'Facade remains closed beside the rear doorway');
for(const x of [53.2,53.75,54.3]){
  p={x,y:1.5,z:0};p=go(p,x,15);near(p.z,-.6);
  p=go(p,x,1.5);near(p.z,0);
}
assert(world.blocked(52.7,10,-.6),'Rear stair wall remains solid beside door');
assert(world.blocked(53.75,9.2,-.05),'Half-landing blocks jumping through the ceiling');
assert(world.blocked(53.75,10,3.4),'No accidental opening on upper floors');
assert(world.boxes.some(b=>b.name==='MAIN_STAIR_B 중간참 0'&&b.bounds[2]===1.54));
const stair=world.stairs.find(s=>s.roofAccess),f=stair.frame,W=f.width,D=f.depth;
p=localPoint(f,W/4,-.6,10.2);
for(const [u,v] of [[W/4,.6],[W/4,D-.6],[3*W/4,D-.6],[3*W/4,.6],[3*W/4,-.6]]){const q=localPoint(f,u,v);p=go(p,q.x,q.y);}
near(p.z,13.71);assert(world.roomAt(p).rooftop);
for(const [x,y] of [[53.75,1.5],[75,1.5],[75,-4],[35,-4],[35,1.5],[53.75,1.5]])p=go(p,x,y);
for(const [u,v] of [[3*W/4,.6],[3*W/4,D-.6],[W/4,D-.6],[W/4,.6],[W/4,-.6]]){const q=localPoint(f,u,v);p=go(p,q.x,q.y);}
near(p.z,10.2);assert(!world.roomAt(p).rooftop);
assert.equal(world.stairs.filter(s=>s.roofAccess).length,1);
assert(world.blocked(75,-7,13.71));assert(world.blocked(75,-7,14.9),'Guard prevents jumping out');
for(let floor=1;floor<=4;floor++){
  const finish=world.boxes.filter(b=>b.name.startsWith(floor+'층 사진참고 복도 바닥'));assert.equal(Math.max(...finish.map(b=>b.bounds[3])),103);
  assert(world.boxes.some(b=>b.name.startsWith(floor+'층 사진참고 북측 Wall_')&&b.bounds[0]>=80));
}
console.log({ok:true,classrooms:25,monitors:50,cornerTVs:25,mainCorridorFloors:4,rearParkingRoundTrip:true,centralStairParkingRoundTrip:true,rooftopRoundTrip:true});
