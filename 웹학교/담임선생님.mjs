import * as THREE from './외부도구/three.module.js';
import {GLTFLoader} from './외부도구/GLTFLoader.js';
import {normalizePrincipalModel} from './교장실캐릭터.mjs';
import {createPrincipalWalkRigAsync} from './교장보행리그.mjs';
import {createTeacherWalk} from './선생님교실산책.mjs';
import {finishTeacherMaterials,finishTeacherMaterialsAsync} from './선생님재질.mjs';
import {correctScienceRestPose} from './과학교사자세.mjs';

// Recover only the collaborator's models, not their older copy of the school.
export const CLASS_TEACHERS=Object.freeze([
  {id:'teacher-6-1',roomId:'4F_6-1',label:'6-1 담임선생님',position:{x:62.6,y:-4.55,z:10.2},height:1.79,url:new URL('./캐릭터모델/6-1-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-2',roomId:'4F_6-2',label:'6-2 담임선생님',position:{x:52.6,y:-4.55,z:10.2},height:1.512,url:new URL('./캐릭터모델/6-2-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-3',roomId:'4F_6-3',label:'6-3 담임선생님',position:{x:42.6,y:-4.55,z:10.2},height:1.79,url:new URL('./캐릭터모델/6-3-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-4',roomId:'4F_6-4',label:'6-4 담임선생님',position:{x:32.6,y:-4.55,z:10.2},height:1.78,url:new URL('./캐릭터모델/6-4-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-5',roomId:'4F_6-5',label:'6-5 담임선생님',position:{x:22.6,y:-4.55,z:10.2},height:1.512,url:new URL('./캐릭터모델/6-5-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-6',roomId:'4F_6-6',label:'6-6 담임선생님',position:{x:12.6,y:-4.55,z:10.2},height:1.82,url:new URL('./캐릭터모델/6-6-담임선생님.glb',import.meta.url)},
  {id:'teacher-6-7',roomId:'4F_6-7',label:'6-7 담임선생님',position:{x:2.6,y:-4.55,z:10.2},height:1.76,url:new URL('./캐릭터모델/6-7-담임선생님.glb',import.meta.url)},
  {id:'teacher-science',roomId:'2F_SCIENCE',label:'과학선생님',position:{x:82.6,y:-4.55,z:3.4},height:1.68,url:new URL('./캐릭터모델/과학선생님.glb',import.meta.url)}
]);

function resources(root,set=new Set()){
  root.traverse(o=>{if(o.isMesh){set.add(o.geometry);if(o.skeleton)set.add(o.skeleton);for(const m of [].concat(o.material)){set.add(m);for(const value of Object.values(m))if(value?.isTexture)set.add(value);}}});return set;
}
function release(items,keep=new Set()){
  const liveImages=new Set([...keep].filter(x=>x.isTexture).flatMap(x=>[x.image,...x.mipmaps])),closed=new Set();
  for(const item of items)if(!keep.has(item)){
    item.dispose?.();if(item.isTexture)for(const image of [item.image,...item.mipmaps])if(image&&!liveImages.has(image)&&!closed.has(image)){image.close?.();closed.add(image);}
  }
}
function loadingLabel(text){
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#173e38';ctx.fillRect(0,0,512,64);
  ctx.fillStyle='#ffffff';ctx.font='26px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text+' · 불러오는 중',256,32,490);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true,depthWrite:false}));
  sprite.position.y=2.05;sprite.scale.set(1.75,.22,1);return sprite;
}
export function createClassTeachers(world,services={}){
  const loader=new GLTFLoader();let busy=false,tick=0,finishQueue=Promise.resolve();
  const fetchModel=services.fetchModel??(async config=>{
    const response=await fetch(config.url,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error('모델 HTTP '+response.status);
    return (await loader.parseAsync(await response.arrayBuffer(),new URL('.',config.url).href)).scene;
  });
  const prepare=services.prepareMaterials??finishTeacherMaterialsAsync;
  const makeRig=services.makeRig??createPrincipalWalkRigAsync;
  const teachers=CLASS_TEACHERS.map(config=>{
    const root=new THREE.Group();root.name=config.label;root.visible=false;
    root.position.set(config.position.x,config.position.z,-config.position.y);
    const label=loadingLabel(config.label);if(label)root.add(label);
    const room=world.data.rooms.find(r=>r.id===config.roomId);let walk=null,rig=null,preview=null,source=null,status='not-requested',error=null,retryAt=0,lastUsed=0,owned=new Set(),preparation=null,generation=0,finishAbort=null;
    async function finish(version){
      if(version!==generation||!source||!rig)return;
      const model=source,controller=new AbortController();finishAbort=controller;preparation={processing:'filtering'};
      try{
        const result=await prepare(model,{signal:controller.signal});
        if(version!==generation)return;
        resources(model,owned);
        const materials=[];model.traverse(o=>{if(o.isMesh)materials.push(o.material);});
        let index=0;rig.root.traverse(o=>{if(o.isMesh)o.material=materials[index++];});
        const live=resources(rig.root);release(owned,live);owned=live;source=null;preparation=result;
      }catch(reason){
        if(version!==generation)return;
        // Keep the already visible, moving original avatar if optional finishing fails.
        const live=resources(rig.root);release(resources(model,owned),live);owned=live;source=null;
        preparation={processing:'original-fallback',error:String(reason?.message??reason)};
      }finally{if(finishAbort===controller)finishAbort=null;}
    }
    return {root,config,near(player,mode){const b=room.bounds;return !!player&&mode==='walk'&&Math.abs(player.z-b[4])<1&&player.x>=b[0]-1.25&&player.x<=b[1]+1.25&&player.y>=b[2]-1.5&&player.y<=b[3]+4;},
      getState:()=>({...walk?.getState(),position:walk?.getState().position??{...config.position},id:config.id,roomId:config.roomId,label:config.label,height:config.height,modelStatus:status,visible:root.visible,hasModel:!!(preview||rig),error,lastUsed,preparation,animation:'procedural-skinned-walk'}),
      update(dt,player,paused){lastUsed=tick;const state=walk?.update(dt,player,{paused:paused||status!=='ready'});if(!state)return;root.position.set(state.position.x,state.position.z,-state.position.y);root.rotation.y=state.heading;rig?.update(paused?0:dt,state);},
      evict(){generation++;finishAbort?.abort();if(rig)root.remove(rig.root);if(preview)root.remove(preview);release(owned);owned.clear();rig=null;preview=null;source=null;status='not-requested';preparation=null;if(label)label.visible=true;},
      canLoad:()=>status==='not-requested'||status==='error'&&tick>retryAt,
      async load(){
        if(status==='loading'||status==='ready')return;
        const version=++generation;status='loading';error=null;if(label)label.visible=true;
        try{
          const asset=await fetchModel(config);
          if(version!==generation){release(resources(asset));return;}
          owned=resources(asset);source=normalizePrincipalModel(asset,config.height);
          if(config.id==='teacher-science'){
            await correctScienceRestPose(source);resources(source,owned);
            if(version!==generation){release(owned);return;}
          }
          // Show the actual approved model immediately. Do not gate visibility on
          // the expensive atlas filter. Cloned nodes share the original geometry.
          const rigSource=source.clone(true),textures=new Map();
          rigSource.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(m.map)textures.set(m.map,m.map);});
          finishTeacherMaterials(rigSource,textures);resources(rigSource,owned);
          preview=rigSource.clone(true);root.add(preview);if(label)label.visible=false;
          preparation={processing:'pending'};
          const built=await makeRig(rigSource,{height:config.height,receiveShadow:false});
          if(version!==generation){release(resources(built.root));return;}
          rig=built;resources(rig.root,owned);walk??=createTeacherWalk(world,config);
          root.add(rig.root);root.remove(preview);preview=null;status='ready';
          // One filter at a time, independent of loading/visibility. Moving to the
          // next classroom no longer waits for the previous teacher's filtering.
          finishQueue=finishQueue.catch(()=>{}).then(()=>finish(version));
        }catch(reason){
          if(version!==generation)return;
          if(rig)root.remove(rig.root);if(preview)root.remove(preview);
          release(owned);owned.clear();rig=null;preview=null;source=null;status='error';retryAt=tick+15;error=String(reason?.message??reason);console.warn(config.label,error);
          if(label)label.visible=true;
        }
      }
    };
  });
  return {teachers,getStates:()=>teachers.map(t=>t.getState()),update(dt,player,mode,{paused=false}={}){
    tick+=Math.max(0,dt);
    for(const teacher of teachers){teacher.root.visible=teacher.near(player,mode);if(teacher.root.visible)teacher.update(dt,player,paused);}
    // One decode at a time, at most two cached teachers. No model downloads on
    // the aerial start screen; moving between floors cannot accumulate 8 GPUs.
    if(!busy){const next=teachers.filter(t=>t.root.visible&&t.canLoad()).sort((a,b)=>Math.abs(player.x-a.config.position.x)-Math.abs(player.x-b.config.position.x))[0];if(next){
      const cached=teachers.filter(t=>t.getState().modelStatus==='ready').sort((a,b)=>a.getState().lastUsed-b.getState().lastUsed);
      while(cached.length>=2){const index=cached.findIndex(t=>!t.root.visible);if(index<0)break;cached.splice(index,1)[0].evict();}
      if(cached.length<2){busy=true;void next.load().finally(()=>{busy=false;});}
    }}
  }};
}
