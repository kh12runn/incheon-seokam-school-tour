import {batchStaticDetailsAsync,freezeStaticTree} from './정적장면최적화.mjs';

function resources(root){const set=new Set();root.traverse(o=>{if(o.geometry)set.add(o.geometry);for(const m of [].concat(o.material??[])){set.add(m);for(const v of Object.values(m))if(v?.isTexture)set.add(v);}});return set;}
// Each factory is the original, room-specific artwork. Only its creation time
// changes. Keep near rooms warm and release distant GPU resources on phones.
const yieldWork=()=>new Promise(resolve=>setTimeout(resolve,0));
export function createRoomDetailsCache(scene,{compile=async()=>{},initTexture=()=>{},capacity=12,stairs=[],onBuilt=()=>{}}={}){
 const entries=[],clock=()=>performance.now();let busy=false,queued=false,point=null,walking=false,prefetch=new Set();
 const timings={built:0,evicted:0,maxCreateMs:0,maxBatchMs:0};
 const gap=e=>Math.hypot(point.x-e.center.x,point.y+e.center.z);
 const nearby=e=>walking&&Math.abs(point.z-(e.floor-1)*3.4)<2&&gap(e)<42;
 const wanted=e=>nearby(e)||prefetch.has(e);
 function release(entry){const root=entry.mesh;if(!root)return;scene.remove(root);const keep=resources(scene),owned=resources(root);for(const item of owned)if(!keep.has(item))item.dispose?.();entry.mesh=null;entry.state='idle';entry.onEvict?.();timings.evicted++;}
 function victim(){const loaded=entries.filter(e=>e.state==='ready');return loaded.length>capacity?loaded.filter(e=>!wanted(e)).sort((a,b)=>a.used-b.used)[0]:null;}
 function choose(){return entries.filter(e=>e.state==='idle'&&wanted(e)).sort((a,b)=>(nearby(a)?0:100)+gap(a)-(nearby(b)?0:100)-gap(b))[0];}
 async function run(){
  queued=false;if(busy||!point)return;
  // Dispose at most one distant room per task, never in the movement/HUD frame.
  const old=victim();if(old){release(old);schedule();return;}
  const next=choose();if(!next)return;
  busy=true;next.state='loading';
  try{
   let started=clock();const root=next.create();next.mesh=root;timings.maxCreateMs=Math.max(timings.maxCreateMs,clock()-started);
   await yieldWork();started=clock();const removed=await batchStaticDetailsAsync(root,yieldWork);timings.maxBatchMs=Math.max(timings.maxBatchMs,clock()-started);freezeStaticTree(root);
   await yieldWork();await compile(root);
   // Upload each original-resolution canvas separately before first visibility.
   for(const texture of resources(root))if(texture.isTexture){await yieldWork();initTexture(texture);}
   await yieldWork();scene.add(root);next.state='ready';next.used=clock();onBuilt(removed);timings.built++;
   root.visible=nearby(next)&&gap(next)<34;
  }catch(error){next.state='error';next.error=String(error?.message??error);console.error('공간 상세 로딩',next.roomId,error);}
  finally{busy=false;schedule();}
 }
 function schedule(){if(!queued&&!busy&&(victim()||choose())){queued=true;setTimeout(run,16);}}
 return{
  add(entry){entries.push({...entry,mesh:null,state:'idle',used:0});},
  update(position,mode){
   point={...position};walking=mode==='walk';prefetch=new Set();
   if(walking){
    const atStair=stairs.some(s=>{const f=s.frame,dx=point.x-f.origin[0],dy=point.y-f.origin[1],u=dx*f.right[0]+dy*f.right[1],v=dx*f.inward[0]+dy*f.inward[1];return u>-.8&&u<f.width+.8&&v>-6&&v<f.depth+.8;});
    if(atStair){const floor=Math.round(point.z/3.4)+1;
     for(const target of [floor-1,floor+1])for(const e of entries.filter(e=>e.floor===target&&gap(e)<24).sort((a,b)=>gap(a)-gap(b)).slice(0,2))prefetch.add(e);
    }
   }
   for(const e of entries)if(e.mesh){e.mesh.visible=e.state==='ready'&&nearby(e)&&gap(e)<34;if(wanted(e))e.used=clock();}
   schedule();
  },
  state:()=>({total:entries.length,loaded:entries.filter(e=>e.state==='ready').length,loading:entries.filter(e=>e.state==='loading').map(e=>e.roomId),errors:entries.filter(e=>e.state==='error').map(e=>({roomId:e.roomId,error:e.error})),rooms:entries.filter(e=>e.state==='ready').map(e=>e.roomId),prefetch:[...prefetch].map(e=>e.roomId),timings:{...timings}})
 };
}
