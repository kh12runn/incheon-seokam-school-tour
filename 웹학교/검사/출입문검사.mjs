import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {createRoomDoors,NON_CORRIDOR_SPACES} from '../출입문.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8'));
const world=buildWorld(data,{interactiveDoors:true}),control=world.roomDoors;
const point=(d,u,v)=>({x:d.x+d.tx*u-d.ty*v,y:d.y+d.ty*u+d.tx*v,z:d.z});
const far={x:500,y:500,z:0};
const tick=(p,n=120,m={x:0,y:0})=>{for(let i=0;i<n;i++)control.update(1/60,p,m);};
const expected=world.data.rooms.filter(r=>['classroom','special_room'].includes(r.type)&&!NON_CORRIDOR_SPACES.includes(r.id));
for(const r of expected)assert(control.doors.some(d=>d.roomIds.includes(r.id)),r.id+' missing door');
assert(control.doors.filter(d=>d.glass).length===2,'hall exterior and foyer have paired glass leaves');
assert(!control.doors.some(d=>d.id==='1F_MAIN_LOBBY'),'main lobby stays open');
const crossings=[];
for(const d of control.doors){
  assert(d.width>1&&d.height>2);
  assert.equal(d.amount,d.kind==='sliding'?1:0);
  const center=point(d,d.width/2,0);
  if(d.kind==='sliding'){
    assert(!d.leaves.some(l=>l.containsXY(center.x,center.y,.28)),d.id+' initially open');
    for(const side of [-1,1]){
      const start=point(d,d.width/2,side*.7),end=point(d,d.width/2,-side*.7);
      assert(world.candidate(start.x,start.y,start.z),d.id+' open approach');
      const after=world.move(start,end.x-start.x,end.y-start.y);
      assert(Math.hypot(after.x-end.x,after.y-end.y)<.02,d.id+' sliding leaf must clear both directions');
    }
    assert(control.toggle(point(d,d.width/2,.8)));tick(far);
    assert.equal(d.amount,0);assert(d.leaves.some(l=>l.containsXY(center.x,center.y,.28)));
    control.toggle(point(d,d.width/2,.8));tick(far);assert.equal(d.amount,1);
    control.toggle(center);tick(center);assert(d.amount>0&&d.blockedByPlayer,'cannot close on avatar');
    assert(!d.leaves.some(l=>l.containsXY(center.x,center.y,.28)),'no crushing');
    tick(far);assert.equal(d.amount,0);control.toggle(point(d,d.width/2,.8));tick(far);
    for(const distance of [.34,.4,.5,.64])for(const side of [-1,1]){
      const closeBy=point(d,d.width/2,distance*side);control.toggle(closeBy);tick(closeBy);
      assert.equal(d.amount,0,d.id+' must close beside opening at '+distance);
      control.toggle(closeBy);tick(closeBy);assert.equal(d.amount,1);
    }
  }else{
    assert(d.leaves.some(l=>l.containsXY(center.x,center.y,.28)),d.id+' private closed leaf');
    tick(point(d,d.width/2,.4),30);assert.equal(d.amount,0,'standing nearby does not open');
    for(const side of [1,-1]){
      let p=point(d,d.width/2,side*.8),started=world.candidate(p.x,p.y,p.z);
      if(!started){crossings.push({id:d.id,side,blockedStart:true});continue;}
      for(let i=0;i<180;i++){
        const movement={x:d.ty*side*.035,y:-d.tx*side*.035};control.update(1/60,p,movement);p=world.move(p,movement.x,movement.y);
        const progress=(p.x-d.x)*(-d.ty)+(p.y-d.y)*d.tx;
        if(progress*side<-.7)break;
      }
      const progress=((p.x-d.x)*(-d.ty)+(p.y-d.y)*d.tx)*side;
      crossings.push({id:d.id,side,progress,angle:d.amount});
      tick(far,240);assert.equal(d.amount,0,d.id+' auto close');
    }
  }
}
const sample=control.doors.find(d=>d.kind==='sliding');assert.equal(control.nearby({...point(sample,.6,.7),z:sample.z+3.4}),null);
assert.equal(control.toggle(far),false);
// Deterministic safety across frame rates, from either face, without world furniture.
for(const fps of [10,30,60,144])for(const side of [-1,1]){
  const c=createRoomDoors(world.data,[],[]),d=c.doors.find(d=>d.id==='2F_PRINCIPAL'),p=point(d,.6,side*.32);
  for(let i=0;i<fps;i++)c.update(1/fps,p,{x:0,y:-side*.06});
  assert(d.amount>1.3,`${fps}fps side ${side} must push away`);
  assert.equal(Math.sign(d.direction),-side);
}
const failed=crossings.filter(c=>c.blockedStart||c.progress>-.7);
console.log(JSON.stringify({doors:control.doors.length,classrooms:control.doors.filter(d=>d.kind==='sliding').length,specialPassages:control.doors.filter(d=>d.kind==='swing').length,crossings:crossings.length,failed},null,2));
assert.equal(failed.length,0,'all actual special-room doorways must remain traversable');
