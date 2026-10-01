import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),original=JSON.stringify(data),world=buildWorld(data);
const backs=world.boxes.filter(b=>/의자 등받이 \d+$/.test(b.name)),rooms=new Set();
const center=b=>[(b[0]+b[3])/2,(b[1]+b[4])/2];
const projection=(b,n)=>{const c=center(b),p=c[0]*n[0]+c[1]*n[1],r=(Math.abs(n[0])*(b[3]-b[0])+Math.abs(n[1])*(b[4]-b[1]))/2;return [p-r,p+r];};
for(const back of backs){
 const id=back.name.match(/\d+$/)[0],parts=world.boxes.filter(b=>b.spaceId===back.spaceId),seat=parts.find(b=>new RegExp('의자 좌판 '+id+'$').test(b.name));
 assert(seat,back.name+' seat');const a=center(seat.bounds),b=center(back.bounds),length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=[(b[0]-a[0])/length,(b[1]-a[1])/length];
 const supports=parts.filter(b=>new RegExp('의자 (?:뒷다리|등지지대 .*?) '+id+'$').test(b.name));assert.equal(supports.length,2,back.name+' two rear supports');
 for(const support of supports){
  const rear=projection(back.bounds,n)[1],front=projection(support.bounds,n)[0];
  assert(front>=rear-1e-6&&front-rear<.005,back.name+' panel contacts inside of support');
  assert(support.bounds[5]>back.bounds[2]&&support.bounds[2]<back.bounds[5],back.name+' supported at back height');
 }
 rooms.add(back.spaceId);
}
assert.equal(backs.length,660);assert.equal(rooms.size,28);assert.equal(JSON.stringify(data),original);
console.log({ok:true,classrooms:rooms.size,studentChairs:backs.length,insideBackPanels:true,pairedSupports:true,sourceUnchanged:true});
