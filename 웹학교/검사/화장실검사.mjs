import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildWorld} from '../이동물리.mjs';
import {applyGroundFloorPlan} from '../일층배치.mjs';
import {applyRestroomPlan,toiletFrame,toiletPoint} from '../화장실배치.mjs';
const source=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')),snapshot=JSON.stringify(source);
const baseline=applyGroundFloorPlan(source),data=applyRestroomPlan(baseline),world=buildWorld(source);
assert.equal(JSON.stringify(source),snapshot,'원본 불변');
assert.equal(applyRestroomPlan(data),data,'중복 적용 방지');
assert.deepEqual(data.rooms.filter(r=>r.type!=='toilet'),baseline.rooms.filter(r=>r.type!=='toilet'),'주변 교실·계단 유지');
const oldIds=new Set(baseline.rooms.filter(r=>r.type==='toilet').map(r=>r.id));
assert.equal(data.rooms.filter(r=>r.type==='toilet').length,24);
const privateIds=new Set(data.rooms.filter(r=>r.type==='toilet').map(r=>r.id));
assert(!world.boxes.some(b=>privateIds.has(b.spaceId)&&b.name.includes('창 개구부')),'인접 교실 창문이 화장실 벽과 기구를 뚫지 않음');
assert(!data.boxes.some(b=>oldIds.has(b.spaceId)||[...oldIds].some(id=>b.name==='Roof_'+id)),'기존 막힌 벽 제거');
function go(p,q,label){const next=world.move(p,q.x-p.x,q.y-p.y);assert(Math.hypot(next.x-q.x,next.y-q.y)<.06,`${label}: ${JSON.stringify({next,q})}`);return next;}
let visits=0,stalls=0;
for(const old of baseline.rooms.filter(r=>r.type==='toilet')){
  const pair=data.rooms.filter(r=>r.parentToiletId===old.id),female=pair.find(r=>r.sex==='female'),male=pair.find(r=>r.sex==='male');
  assert(female&&male);
  // Facing north: left is west. Facing west: left is south (map down).
  if(old.building==='MAIN')assert(female.bounds[1]===male.bounds[0]&&female.entry.x<male.entry.x);
  else assert(female.bounds[3]===male.bounds[2]&&female.entry.y<male.entry.y);
  for(const room of pair){
    const f=toiletFrame(room),z=room.bounds[4],area=(room.bounds[1]-room.bounds[0])*(room.bounds[3]-room.bounds[2]);
    assert(area>((old.bounds[1]-old.bounds[0])*(old.bounds[3]-old.bounds[2]))/2);
    let p=world.candidate(room.entry.x,room.entry.y,z);assert(p,room.id+' 복도 출발');
    for(const waypoint of room.interiorRoute)p=go(p,waypoint,room.id+' 출입');
    assert.equal(world.roomAt(p).room.id,room.id);
    const aisle=(f.width+1.5)/2;
    for(const target of room.stallTargets){
      // Align with the open stall door before turning into the stall.
      const v=old.building==='MAIN'?target.y-f.origin[1]:f.origin[0]-target.x;
      p=go(p,toiletPoint(f,aisle,v,z),room.id+' 칸 앞');
      p=go(p,target,room.id+' 칸 진입');stalls++;
      p=go(p,toiletPoint(f,aisle,v,z),room.id+' 칸 나오기');
    }
    p=go(p,room.interiorRoute[2],room.id+' 돌아오기');
    for(const q of [...room.interiorRoute.slice(0,2)].reverse())p=go(p,q,room.id+' 입구');
    go(p,room.entry,room.id+' 복도 복귀');visits++;
    for(const [u,v] of [[0,4],[f.width,4],[f.width/2,f.depth]]){
      const q=toiletPoint(f,u,v,z);assert(world.blocked(q.x,q.y,z),room.id+' 벽 충돌');
    }
    for(const feature of ['변기 도기','세면대 상판','화장실 칸막이']){
      const box=data.boxes.find(b=>b.spaceId===room.id&&b.name.startsWith(feature));assert(box,feature);
      const b=box.bounds;assert(world.blocked((b[0]+b[3])/2,(b[1]+b[4])/2,z),feature+' 충돌');
    }
    const fixtures=data.boxes.filter(b=>b.spaceId===room.id);
    const urinals=fixtures.filter(b=>b.name.startsWith('소변기 도기'));
    assert.equal(urinals.length,room.sex==='male'?4:0);
    const localU=box=>{const b=box.bounds;return (((b[0]+b[3])/2)-f.origin[0])*f.right[0]+(((b[1]+b[4])/2)-f.origin[1])*f.right[1];};
    for(const sink of fixtures.filter(b=>/^(세면대|손세정제)/.test(b.name)))assert(localU(sink)<f.width/2,'세면대·거울은 입구에서 왼쪽 '+room.id);
    for(const urinal of fixtures.filter(b=>b.name.startsWith('소변기')))assert(localU(urinal)>f.width/2,'소변기·가림판은 입구에서 오른쪽 '+room.id);
    assert.equal(fixtures.filter(b=>b.name.startsWith('세면대 도기')).length,2);
    for(const urinal of urinals){
      const b=urinal.bounds;assert(world.blocked((b[0]+b[3])/2,(b[1]+b[4])/2,z),'소변기 충돌');
    }
    const back=toiletPoint(f,f.width-.45,f.depth-.4,z);
    assert(world.candidate(back.x,back.y,z),'확장 바닥');
    if(room.floor==='4F')assert(data.boxes.some(b=>b.spaceId===room.id&&b.kind==='roof'),'확장 옥상');
  }
}
console.log({ok:true,toilets:24,corridorRoundTrips:visits,stallRoundTrips:stalls,floors:[1,2,3,4],otherRoomsPreserved:true});
