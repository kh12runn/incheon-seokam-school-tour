import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {UPLOADED_CLASSROOM_PROFILES as profiles} from '../업로드교실관찰.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),snapshot=JSON.stringify(source);
const before=buildWorld(source,{uploadedClassPhotos:false}),world=buildWorld(source),ids=new Set(Object.keys(profiles));
assert.equal(ids.size,15);assert.equal(Object.values(profiles).reduce((n,p)=>n+p.photoCount,0),98);
assert.equal(JSON.stringify(source),snapshot);assert.deepEqual(world.data,before.data);
const unaffected=list=>list.filter(b=>!ids.has(b.spaceId)&&!ids.has(b.interiorRoom));
assert.ok(JSON.stringify(unaffected(world.boxes))===JSON.stringify(unaffected(before.boxes)),'Only the 15 uploaded classrooms change');
assert.ok(JSON.stringify(unaffected(world.colliders))===JSON.stringify(unaffected(before.colliders)),'Other collisions unchanged');
for(const key of ['classroom64','classroom21','specialInteriors','principalOffice','surfaces','stairs'])assert.ok(JSON.stringify(world[key])===JSON.stringify(before[key]),key+' preserved');
const signatures=new Set();
for(const id of ids){
  const c=world.classroomInteriors.find(r=>r.roomId===id);assert.ok(c?.photoDetails?.uploaded,id+' connected');
  assert.equal(c.profile.photoStatus,'reviewed');assert.ok(c.profile.sourceRevision);assert.ok(c.profile.observedFeatures.length>=6);
  signatures.add(JSON.stringify([c.profile.back,c.profile.locker,c.profile.chairs,c.profile.extras]));
  assert.ok(world.candidate(c.spawn.x,c.spawn.y,c.spawn.z),id+' spawn');
  const sight=c.frame.point(9.65,-3.51,2.0);
  const obstruction=c.boxes.filter(b=>b.bounds[0]<sight.x&&b.bounds[3]>sight.x&&b.bounds[1]<sight.y&&b.bounds[4]>sight.y&&b.bounds[2]<sight.z&&b.bounds[5]>sight.z);
  assert.deepEqual(obstruction.map(b=>b.name),[],id+' rear artwork must be in front of the room lining');
  const b=c.room.bounds;
  for(const item of [...c.boxes,...c.colliders]){
    const a=item.bounds;assert.ok(a.every(Number.isFinite)&&a.slice(0,3).every((n,i)=>n<a[i+3]),id+' valid bounds '+item.name);
    assert.ok(a[0]>=b[0]&&a[3]<=b[1]&&a[1]>=b[2]&&a[4]<=b[3]&&a[2]>=b[4]-.00001&&a[5]<=b[5]+.00001,id+' inside room '+item.name);
  }
  for(const seat of [...c.desks,...c.chairs]){
    const x=seat.x??(seat.bounds[0]+seat.bounds[3])/2,y=seat.y??(seat.bounds[1]+seat.bounds[4])/2;
    assert.equal(world.blocked(x,y,b[4]),true,id+' desk/chair collision');
  }
  const route=c.room.building==='ANNEX'?[c.entry,...c.aisleRoute,...[...c.aisleRoute].reverse(),c.entry]:[c.entry,c.spawn,c.frame.point(3.5,-4.37),c.frame.point(8.85,-4.37),c.frame.point(8.85,-2.34),c.frame.point(3.5,-2.34),c.spawn,c.entry];
  for(const fps of [30,60,144])for(const sequence of [route,[...route].reverse()]){
    let p={...sequence[0]};for(const target of sequence.slice(1)){
      const start={...p},n=Math.max(1,Math.ceil(Math.hypot(target.x-p.x,target.y-p.y)/(5/fps)));
      for(let i=0;i<n;i++)p=world.move(p,(target.x-start.x)/n,(target.y-start.y)/n);
      assert.ok(Math.hypot(p.x-target.x,p.y-target.y)<.025,id+' aisle '+JSON.stringify({fps,p,target}));assert.equal(p.z,b[4]);
    }
  }
  assert.equal(world.boxes.filter(box=>box.spaceId===id&&box.cornerTV).length,2,id+' existing corner TV');
}
assert.equal(signatures.size,15,'Every photographed classroom has a distinct observed configuration');
console.log(JSON.stringify({ok:true,rooms:15,photos:98,uniqueConfigurations:15,annexRooms:2,allDoorsAndAislesReachable:true,frameRates:[30,60,144],furnitureCollision:true,previousRoomsPreserved:true}));
