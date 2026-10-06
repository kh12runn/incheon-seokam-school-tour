// Distance is measured from entrance y=-7 to the nearest rear step y=-12.
// Keep a five-metre approach; the goals sit beyond the stage on the lower field.
export const ROSTRUM={left:40,right:48,front:-20,rear:-15,ground:-.3,top:1.4,treads:8,run:3,roof:4.3};
export const ROSTRUM_SPAWN={x:44,y:(ROSTRUM.front+ROSTRUM.rear)/2,z:ROSTRUM.top};
export function rebuildRostrum(boxes,colliders,surfaces){
 const old=b=>b.name==='SPACE_EXT_ROSTRUM'||b.name.startsWith('구령대 ')||b.name.startsWith('정후문 사진 구령대 ');
 for(const list of [boxes,colliders,surfaces]){const kept=list.filter(b=>!old(b));list.splice(0,list.length,...kept);}
 const r=ROSTRUM;
 const add=(name,bounds,{solid=true,step=false,hidden=false,color=[.62,.63,.60],material='storage_concrete'}={})=>{
  const b={name:'구령대 '+name,bounds,color,material,kind:'finish',floor:0,stepSurface:step,renderInDetails:hidden};boxes.push(b);if(solid)colliders.push(b);if(step)surfaces.push({name:b.name,bounds,height:()=>bounds[5]});return b;
 };
 add('높은 단상',[r.left,r.front,-.6,r.right,r.rear,r.top],{step:true});
 for(let i=0;i<r.treads;i++){
  const run=(i+1)*r.run/r.treads,top=r.top-(i+1)*(r.top-r.ground)/(r.treads+1);
  add('서측 계단 '+i,[r.left-run,r.front,-.6,r.left,r.rear,top],{step:true});
  add('동측 계단 '+i,[r.right,r.front,-.6,r.right+run,r.rear,top],{step:true});
  add('현관방향 뒤 계단 '+i,[r.left,r.rear,-.6,r.right,r.rear+run,top],{step:true});
 }
 // Fine round railings are rendered by the outdoor detail module; these are
 // continuous physical guards, not hundreds of narrow gaps for the avatar.
 add('전면 난간 충돌',[r.left,r.front-.06,r.top,r.right,r.front+.06,r.top+1.05],{hidden:true});
 for(const side of [-1,1])for(let i=0;i<r.treads;i++){
  const a=side<0?r.left-(i+1)*r.run/r.treads:r.right+i*r.run/r.treads;
  const top=r.top-(i+1)*(r.top-r.ground)/(r.treads+1);
  add('계단 난간 충돌 '+side+i,[a,r.front-.07,top,a+r.run/r.treads,r.front+.07,top+1.03],{hidden:true});
 }
 for(const x of [r.left+.18,r.right-.18])for(const y of [r.front+.22,r.rear-.22])add('차양 기둥 충돌',[x-.055,y-.055,r.top,x+.055,y+.055,r.roof],{hidden:true});
 add('차양 지붕 충돌',[r.left-.35,r.front-.45,r.roof-.06,r.right+.35,r.rear+.35,r.roof+.22],{hidden:true});
}
