import {subtractBox} from './창문배치.mjs';
export const OFFICE_DOOR={x:37,y:-5.12,z:3.4,width:1.10,height:2.15,cut:[36.75,-6.30,3.399,37.25,-5.03,5.65]};
export function connectPrincipalMeeting(boxes,colliders){
  const ids=new Set(['2F_PRINCIPAL','2F_OPERATIONS_MEETING']),cut=OFFICE_DOOR.cut;
  for(const list of [boxes,colliders]){
    const next=list.flatMap(b=>ids.has(b.spaceId)&&b.kind!=='floor'&&b.bounds[0]<37.25&&b.bounds[3]>36.75?subtractBox(b,cut):[b]);list.splice(0,list.length,...next);
  }
  const d=OFFICE_DOOR,leaf={name:'교장실 회의실 여닫이문 충돌',spaceId:'2F_OPERATIONS_MEETING',kind:'furniture',floor:2,bounds:[36.97,d.y-d.width,d.z,37.03,d.y,d.z+d.height]};
  leaf.spatialBounds=[35.8,-6.3,3.4,37.1,-5,5.65];colliders.push(leaf);let angle=0,hold=0;
  function bounds(a){const x=d.x-Math.sin(a)*d.width,y=d.y-Math.cos(a)*d.width;return [Math.min(d.x,x)-.028,Math.min(d.y,y)-.028,d.z,Math.max(d.x,x)+.028,Math.max(d.y,y)+.028,d.z+d.height];}
  return {leaf,get angle(){return angle;},update(dt,p,active=true){
    if(!active||!Number.isFinite(dt)||dt<=0)return angle;
    const near=p&&Math.abs(p.z-d.z)<1.1&&Math.hypot(p.x-d.x,p.y-(d.y-d.width/2))<2.0;
    hold=near?1.6:Math.max(0,hold-dt);const target=hold>0?Math.PI/2:0,step=Math.min(dt,.05)*2.2,next=angle+Math.sign(target-angle)*Math.min(step,Math.abs(target-angle)),b=bounds(next);
    // Never sweep through the avatar; a person within the doorway keeps it open.
    if(p&&Math.abs(p.z-d.z)<1.8&&p.x>b[0]-.30&&p.x<b[3]+.30&&p.y>b[1]-.30&&p.y<b[4]+.30)return angle;
    angle=next;leaf.bounds=b;return angle;
  }};
}
