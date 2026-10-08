// Owner confirmed 4-6 and 4-2, not 4-5. Retain campus shell and corridors.
export const RESIZED_CLASSROOM_IDS=['3F_4-6','4F_4-2'];
export function resizeOversizedClassrooms(source){
 if(source.classroomSizeRevision)return source;
 const ids=new Set(RESIZED_CLASSROOM_IDS),old=new Map(source.rooms.filter(r=>ids.has(r.id)).map(r=>[r.id,r]));
 const rooms=source.rooms.map(r=>ids.has(r.id)?{...r,bounds:[r.bounds[0],r.bounds[0]+10,...r.bounds.slice(2)],originalBounds:[...r.bounds]}:r);
 const boxes=source.boxes.filter(b=>{
  if(!ids.has(b.spaceId))return true;
  // Rebuild only corridor-facing partitions and door frames at the smaller room.
  return !(/^(Wall_|Lintel_|Doorframe_)/.test(b.name)&&b.bounds[1]>-.2&&b.bounds[4]<.2);
 });
 for(const id of ids){
  const r=old.get(id);if(!r)continue;
  const [x,X,y,Y,z,top]=r.bounds,end=x+10,door=x+3.5;
  const add=(name,bounds,kind='wall',color=[.84,.86,.82])=>boxes.push({name:name+'_'+id,spaceId:id,floor:parseInt(r.floor),kind,bounds,color,collision:true});
  add('Wall_교실축소왼쪽',[x,-.09,z,door-.6,.09,top]);
  add('Wall_교실축소오른쪽',[door+.6,-.09,z,X,.09,top]);
  add('Lintel_교실축소',[door-.6,-.09,z+2.25,door+.6,.09,top]);
  add('Wall_내부면적분리',[end-.09,y,z,end+.09,Y,top]);
  for(const a of [door-.638,door+.562])add('Doorframe_교실축소'+a,[a,-.04,z,a+.076,.04,z+2.2],'detail',[.69,.54,.38]);
 }
 const labels=source.labels.map(l=>{
  if(!ids.has(l.spaceId))return l;
  const r=old.get(l.spaceId),p=[...l.position];p[0]=r.bounds[0]+(p[0]-r.bounds[0])*.5;
  return {...l,position:p,width:l.width*.5};
 });
 return {...source,classroomSizeRevision:'2026-10-08',rooms,boxes,labels};
}
