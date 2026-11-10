import {batchStaticDetails,freezeStaticTree} from './정적장면최적화.mjs';

function resources(root){const set=new Set();root.traverse(o=>{if(o.geometry)set.add(o.geometry);for(const m of [].concat(o.material??[])){set.add(m);for(const v of Object.values(m))if(v?.isTexture)set.add(v);}});return set;}
// Each factory is the original, room-specific artwork. Only its creation time
// changes. Keep near rooms warm and release distant GPU resources on phones.
export function createRoomDetailsCache(scene,{compile=async()=>{},capacity=12,onBuilt=()=>{}}={}){
 const entries=[],clock=()=>performance.now();let busy=false,queued=false,point=null,walking=false;
 const gap=e=>Math.hypot(point.x-e.center.x,point.y+e.center.z);
 const nearby=e=>walking&&Math.abs(point.z-(e.floor-1)*3.4)<2&&gap(e)<42;
 function release(entry){const root=entry.mesh;if(!root)return;scene.remove(root);const keep=resources(scene),owned=resources(root);for(const item of owned)if(!keep.has(item))item.dispose?.();entry.mesh=null;entry.state='idle';entry.onEvict?.();}
 function trim(){let loaded=entries.filter(e=>e.state==='ready');for(const entry of loaded.sort((a,b)=>a.used-b.used)){if(loaded.length<=capacity)break;if(nearby(entry))continue;release(entry);loaded=loaded.filter(e=>e!==entry);}}
 async function run(){
  queued=false;if(busy||!point)return;
  const next=entries.filter(e=>e.state==='idle'&&nearby(e)).sort((a,b)=>gap(a)-gap(b))[0];if(!next)return;
  busy=true;next.state='loading';
  try{
   const root=next.create();next.mesh=root;
   const removed=batchStaticDetails(root);freezeStaticTree(root);
   await compile(root);scene.add(root);next.state='ready';next.used=clock();onBuilt(removed);
   root.visible=nearby(next)&&gap(next)<34;
  }catch(error){next.state='error';next.error=String(error?.message??error);console.error('공간 상세 로딩',next.roomId,error);}
  finally{busy=false;trim();schedule();}
 }
 function schedule(){if(!queued&&!busy&&entries.some(e=>e.state==='idle'&&nearby(e))){queued=true;setTimeout(run,0);}}
 return{
  add(entry){entries.push({...entry,mesh:null,state:'idle',used:0});},
  update(position,mode){point=position;walking=mode==='walk';for(const e of entries)if(e.mesh){e.mesh.visible=e.state==='ready'&&nearby(e)&&gap(e)<34;if(nearby(e))e.used=clock();}trim();schedule();},
  state:()=>({total:entries.length,loaded:entries.filter(e=>e.state==='ready').length,loading:entries.filter(e=>e.state==='loading').map(e=>e.roomId),errors:entries.filter(e=>e.state==='error').map(e=>({roomId:e.roomId,error:e.error})),rooms:entries.filter(e=>e.state==='ready').map(e=>e.roomId)})
 };
}
