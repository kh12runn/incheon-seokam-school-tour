import * as THREE from './외부도구/three.module.js';
import {GLTFLoader} from './외부도구/GLTFLoader.js';
import {normalizePrincipalModel} from './교장실캐릭터.mjs';
import {createPrincipalWalkRig} from './교장보행리그.mjs';
import {createTeacherWalk} from './선생님교실산책.mjs';
import {finishTeacherMaterials} from './선생님재질.mjs';

// Recover only the collaborator's models, not their older copy of the school.
export const CLASS_TEACHERS=Object.freeze([
  {id:'teacher-6-1',roomId:'4F_6-1',label:'6-1 담임선생님',position:{x:62.6,y:-4.55,z:10.2},height:1.79,url:new URL('./캐릭터모델/6-1-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-2',roomId:'4F_6-2',label:'6-2 담임선생님',position:{x:52.6,y:-4.55,z:10.2},height:1.68,url:new URL('./캐릭터모델/6-2-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-3',roomId:'4F_6-3',label:'6-3 담임선생님',position:{x:42.6,y:-4.55,z:10.2},height:1.79,url:new URL('./캐릭터모델/6-3-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-4',roomId:'4F_6-4',label:'6-4 담임선생님',position:{x:32.6,y:-4.55,z:10.2},height:1.78,url:new URL('./캐릭터모델/6-4-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-5',roomId:'4F_6-5',label:'6-5 담임선생님',position:{x:22.6,y:-4.55,z:10.2},height:1.68,url:new URL('./캐릭터모델/6-5-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-6',roomId:'4F_6-6',label:'6-6 담임선생님',position:{x:12.6,y:-4.55,z:10.2},height:1.82,url:new URL('./캐릭터모델/6-6-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-7',roomId:'4F_6-7',label:'6-7 담임선생님',position:{x:2.6,y:-4.55,z:10.2},height:1.76,url:new URL('./캐릭터모델/6-7-담임선생님.glb',import.meta.url)},
  {id:'teacher-science',roomId:'2F_SCIENCE',label:'과학선생님',position:{x:82.6,y:-4.55,z:3.4},height:1.68,url:new URL('./캐릭터모델/과학선생님.glb',import.meta.url)}
]);

function resources(root,set=new Set()){
  root.traverse(o=>{if(o.isMesh){set.add(o.geometry);if(o.skeleton)set.add(o.skeleton);for(const m of [].concat(o.material)){set.add(m);for(const value of Object.values(m))if(value?.isTexture)set.add(value);}}});return set;
}
function release(items,keep=new Set()){
  const liveImages=new Set([...keep].filter(x=>x.isTexture).map(x=>x.image)),closed=new Set();
  for(const item of items)if(!keep.has(item)){
    item.dispose?.();if(item.isTexture&&item.image&&!liveImages.has(item.image)&&!closed.has(item.image)){item.image.close?.();closed.add(item.image);}
  }
}
export function createClassTeachers(world){
  const loader=new GLTFLoader();let busy=false,tick=0;
  const teachers=CLASS_TEACHERS.map(config=>{
    const root=new THREE.Group();root.name=config.label;root.visible=false;
    root.position.set(config.position.x,config.position.z,-config.position.y);
    const room=world.data.rooms.find(r=>r.id===config.roomId);let walk=null,rig=null,status='not-requested',error=null,retryAt=0,lastUsed=0,owned=new Set();
    return {root,config,near(player,mode){const b=room.bounds;return mode==='walk'&&Math.abs(player.z-b[4])<1&&player.x>b[0]-1&&player.x<b[1]+1&&player.y>b[2]-1.5&&player.y<b[3]+1.5;},
      getState:()=>({...walk?.getState(),position:walk?.getState().position??{...config.position},id:config.id,roomId:config.roomId,label:config.label,height:config.height,modelStatus:status,visible:root.visible,error,lastUsed,animation:'procedural-skinned-walk'}),
      update(dt,player,paused){lastUsed=tick;const state=walk?.update(dt,player,{paused:paused||status!=='ready'});if(!state)return;root.position.set(state.position.x,state.position.z,-state.position.y);root.rotation.y=state.heading;rig?.update(paused?0:dt,state);},
      evict(){if(!rig)return;root.remove(rig.root);release(owned);owned.clear();rig=null;status='not-requested';},
      canLoad:()=>status==='not-requested'||status==='error'&&tick>retryAt,
      async load(){
        status='loading';error=null;
        try{
          const response=await fetch(config.url,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error('모델 HTTP '+response.status);
          const gltf=await loader.parseAsync(await response.arrayBuffer(),new URL('.',config.url).href);
          owned=resources(gltf.scene);const model=normalizePrincipalModel(gltf.scene,config.height);
          finishTeacherMaterials(model);rig=createPrincipalWalkRig(model,{height:config.height,receiveShadow:false});const live=resources(rig.root);release(owned,live);owned=live;
          walk??=createTeacherWalk(world,config);root.add(rig.root);status='ready';
        }catch(reason){release(owned);owned.clear();rig=null;status='error';retryAt=tick+15;error=String(reason?.message??reason);console.warn(config.label,error);}
      }
    };
  });
  return {teachers,getStates:()=>teachers.map(t=>t.getState()),update(dt,player,mode,{paused=false}={}){
    tick+=Math.max(0,dt);
    for(const teacher of teachers){teacher.root.visible=teacher.near(player,mode);if(teacher.root.visible)teacher.update(dt,player,paused);}
    // One decode at a time, at most two cached teachers. No model downloads on
    // the aerial start screen; moving between floors cannot accumulate 8 GPUs.
    if(!busy){const next=teachers.find(t=>t.root.visible&&t.canLoad());if(next){
      const cached=teachers.filter(t=>t.getState().modelStatus==='ready').sort((a,b)=>a.getState().lastUsed-b.getState().lastUsed);
      while(cached.length>=2){const index=cached.findIndex(t=>!t.root.visible);if(index<0)break;cached.splice(index,1)[0].evict();}
      if(cached.length<2){busy=true;void next.load().finally(()=>{busy=false;});}
    }}
  }};
}
