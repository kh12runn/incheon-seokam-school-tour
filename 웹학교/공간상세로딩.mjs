import {batchStaticDetailsAsync,freezeStaticTree} from './정적장면최적화.mjs';

function resources(root){const set=new Set();root.traverse(o=>{if(o.geometry)set.add(o.geometry);for(const m of [].concat(o.material??[])){set.add(m);for(const v of Object.values(m))if(v?.isTexture)set.add(v);}});return set;}
// Each factory is the original, room-specific artwork. Only its creation time
// changes. Keep near rooms warm and release distant GPU resources on phones.
const yieldWork=()=>new Promise(resolve=>setTimeout(resolve,0));
export function createRoomDetailsCache(scene,{compile=async()=>{},initTexture=()=>{},capacity=12,stairs=[],onBuilt=()=>{}}={}){
 const entries=[],clock=()=>performance.now();let busy=false,queued=false,point=null,walking=false,prefetch=new Set(),onFlight=false,lastVerticalAt=-Infinity;
 const timings={built:0,evicted:0,maxCreateMs:0,maxBatchMs:0};
 const gap=e=>Math.hypot(point.x-e.center.x,point.y+e.center.z);
 const nearby=e=>walking&&Math.abs(point.z-(e.floor-1)*3.4)<2&&gap(e)<42;
 const wanted=e=>nearby(e)||prefetch.has(e);
 async function yieldAtLanding(){await yieldWork();while(onFlight)await new Promise(resolve=>setTimeout(resolve,60));}
 function release(entry){const root=entry.mesh;if(!root)return;scene.remove(root);const keep=resources(scene),owned=resources(root);for(const item of owned)if(!keep.has(item))item.dispose?.();entry.mesh=null;entry.state='idle';entry.onEvict?.();timings.evicted++;}
 function victim(){const loaded=entries.filter(e=>e.state==='ready');return loaded.length>capacity?loaded.filter(e=>!wanted(e)).sort((a,b)=>a.used-b.used)[0]:null;}
 function choose(){
  // A stair flight only exposes its landing, not every classroom on both floors.
  // Keep the already prepared rooms visible; defer new synchronous factories
  // until a landing/corridor rather than hitching on the descent itself.
  if(onFlight)return null;
  const current=walking?Math.round(point.z/3.4)+1:null;
  return entries.filter(e=>e.state==='idle'&&wanted(e)).sort((a,b)=>(a.floor===current?0:100)+gap(a)-(b.floor===current?0:100)-gap(b))[0];
 }
 async function run(){
  queued=false;if(busy||!point)return;
  // Dispose at most one distant room per task, never in the movement/HUD frame.
  const old=!onFlight&&victim();if(old){release(old);schedule();return;}
  const next=choose();if(!next)return;
  busy=true;next.state='loading';
  try{
   let started=clock();const root=next.create();next.mesh=root;timings.maxCreateMs=Math.max(timings.maxCreateMs,clock()-started);
   await yieldAtLanding();started=clock();const removed=await batchStaticDetailsAsync(root,yieldAtLanding);timings.maxBatchMs=Math.max(timings.maxBatchMs,clock()-started);freezeStaticTree(root);
   await yieldAtLanding();await compile(root);
   // Upload each original-resolution canvas separately before first visibility.
   for(const texture of resources(root))if(texture.isTexture){await yieldAtLanding();initTexture(texture);}
   await yieldAtLanding();scene.add(root);next.state='ready';next.used=clock();onBuilt(removed);timings.built++;
   root.visible=nearby(next)&&gap(next)<34;
  }catch(error){next.state='error';next.error=String(error?.message??error);console.error('공간 상세 로딩',next.roomId,error);}
  finally{busy=false;schedule();}
 }
 function schedule(){if(!queued&&!busy&&!onFlight&&(victim()||choose())){queued=true;setTimeout(run,32);}}
 return{
  isVisible:roomId=>!!entries.find(e=>e.roomId===roomId)?.mesh?.visible,
  add(entry){entries.push({...entry,mesh:null,state:'idle',used:0});},
  update(position,mode){
   const dz=point?Math.abs(position.z-point.z):0;if(dz>.005&&dz<.6)lastVerticalAt=clock();
   point={...position};walking=mode==='walk';prefetch=new Set();onFlight=false;
   if(walking){
    const atStair=stairs.some(s=>{const f=s.frame,dx=point.x-f.origin[0],dy=point.y-f.origin[1],u=dx*f.right[0]+dy*f.right[1],v=dx*f.inward[0]+dy*f.inward[1];return u>-.8&&u<f.width+.8&&v>-6&&v<f.depth+.8;});
    if(atStair){const floor=Math.round(point.z/3.4)+1;onFlight=Math.abs(point.z-(floor-1)*3.4)>.12||clock()-lastVerticalAt<800;
     for(const target of [floor-1,floor+1])for(const e of entries.filter(e=>e.floor===target&&gap(e)<24).sort((a,b)=>gap(a)-gap(b)).slice(0,2))prefetch.add(e);
    }
   }
   for(const e of entries)if(e.mesh){e.mesh.visible=e.state==='ready'&&nearby(e)&&gap(e)<34;if(wanted(e))e.used=clock();}
   schedule();
  },
  state:()=>({total:entries.length,loaded:entries.filter(e=>e.state==='ready').length,loading:entries.filter(e=>e.state==='loading').map(e=>e.roomId),errors:entries.filter(e=>e.state==='error').map(e=>({roomId:e.roomId,error:e.error})),rooms:entries.filter(e=>e.state==='ready').map(e=>e.roomId),prefetch:[...prefetch].map(e=>e.roomId),onFlight,timings:{...timings}})
 };
}
