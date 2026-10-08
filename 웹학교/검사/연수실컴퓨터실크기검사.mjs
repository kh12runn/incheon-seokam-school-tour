import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {resizeOversizedClassrooms,RESIZED_CLASSROOM_IDS} from '../큰교실면적조정.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),snapshot=JSON.stringify(source),adjusted=resizeOversizedClassrooms(source),w=buildWorld(source);
assert.equal(JSON.stringify(source),snapshot);
for(const r of source.rooms){const after=adjusted.rooms.find(q=>q.id===r.id);if(!RESIZED_CLASSROOM_IDS.includes(r.id))assert.deepEqual(after,r);else{assert.equal(after.bounds[1]-after.bounds[0],10);assert.equal(after.bounds[3]-after.bounds[2],7);}}
// Outer walls, roofs, floors, exterior windows and other room geometry stay put.
for(const b of source.boxes){
 const affected=RESIZED_CLASSROOM_IDS.includes(b.spaceId)&&/^(Wall_|Lintel_|Doorframe_)/.test(b.name)&&b.bounds[1]>-.2&&b.bounds[4]<.2;
 if(!affected)assert(adjusted.boxes.includes(b),b.name+' preserved');
}
for(const id of RESIZED_CLASSROOM_IDS){const c=w.classroomInteriors.find(c=>c.roomId===id);assert(w.candidate(c.spawn.x,c.spawn.y,c.spawn.z));const barrier=w.move({x:89.5,y:-3.5,z:c.room.bounds[4]},2,0);assert(barrier.x<90,'new partition solid');}
const research=w.specialInteriors.find(c=>c.roomId==='4F_GRADE6_RESEARCH');
assert.equal(research.boxes.filter(b=>/왼쪽 교구장 뒷판/.test(b.name)).length,7);
assert(research.boxes.filter(b=>/왼쪽 교구장/.test(b.name)).every(b=>b.bounds[3]<45));
assert(research.boxes.filter(b=>/오른쪽 업무 책상/.test(b.name)).every(b=>b.bounds[0]>49));
assert(research.props.some(p=>p.type==='roundedTable'&&p.glass));
const computer=w.specialInteriors.find(c=>c.roomId==='4F_COMPUTER');
const screens=computer.boxes.filter(b=>/학생 컴퓨터 \d+ 화면$/.test(b.name));assert.equal(screens.length,16);
for(const screen of screens){const frame=computer.boxes.find(b=>b.name===screen.name.replace(/ 화면$/,' 화면틀'));assert(screen.bounds[1]>frame.bounds[4],'screen faces north');}
assert.equal(computer.chairs.filter(c=>c.name.startsWith('갈색 학생 의자')&&c.angle===0).length,16);
assert(computer.boxes.some(b=>b.name.includes('우측 구석 교사용 책상')));
assert(computer.boxes.some(b=>b.name.includes('중앙 빔스크린 흰 천')));
assert(computer.boxes.some(b=>b.name.includes('천장 프로젝터')));
console.log({ok:true,resized:RESIZED_CLASSROOM_IDS,outerEnvelopePreserved:true,glassCupboardsLeft:true,studentScreensReversed:16,teacherDeskAndProjector:true});
