import * as THREE from './외부도구/three.module.js';
import {GLTFLoader} from './외부도구/GLTFLoader.js';
import {CAR_DIMENSIONS} from './주차장.mjs';

// Small seated derivatives of the approved teachers. Literal URLs are also
// discovered by the existing production asset packer.
export const RACE_TEACHER_MODELS=Object.freeze({
 'teacher-6-1':{height:1.79,url:new URL('./캐릭터모델/레이싱/teacher-6-1.glb',import.meta.url)},
 'teacher-6-2':{height:1.512,url:new URL('./캐릭터모델/레이싱/teacher-6-2.glb',import.meta.url)},
 'teacher-6-3':{height:1.79,url:new URL('./캐릭터모델/레이싱/teacher-6-3.glb',import.meta.url)},
 'teacher-6-4':{height:1.78,url:new URL('./캐릭터모델/레이싱/teacher-6-4.glb',import.meta.url)},
 'teacher-6-5':{height:1.512,url:new URL('./캐릭터모델/레이싱/teacher-6-5.glb',import.meta.url)},
 'teacher-6-6':{height:1.82,url:new URL('./캐릭터모델/레이싱/teacher-6-6.glb',import.meta.url)},
 'teacher-6-7':{height:1.76,url:new URL('./캐릭터모델/레이싱/teacher-6-7.glb',import.meta.url)},
 'teacher-science':{height:1.68,url:new URL('./캐릭터모델/레이싱/teacher-science.glb',import.meta.url)},
 'office-cute':{height:1.83,url:new URL('./캐릭터모델/레이싱/office-cute.glb',import.meta.url)}
});

function disposeModel(root){
 const items=new Set(),images=new Set();
 root.traverse(o=>{if(!o.isMesh)return;items.add(o.geometry);for(const m of [].concat(o.material??[])){items.add(m);for(const value of Object.values(m))if(value?.isTexture){items.add(value);if(value.image)images.add(value.image);}}});
 for(const item of items)item.dispose();for(const image of images)image.close?.();
}
function driverLabel(name){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=64;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#183233db';ctx.beginPath();ctx.roundRect(1,1,382,62,14);ctx.fill();
 ctx.fillStyle='#fff8df';ctx.font='bold 27px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,192,33,356);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:true,depthWrite:false,transparent:true}));sprite.scale.set(2.2,.367,1);sprite.name=name+' 차량 이름표';return sprite;
}

// This cache belongs only to racing. Classroom teachers, their walking rigs,
// materials and visibility are never borrowed or changed.
export function createRaceTeachers(scene,{fetchModel}={}){
 const root=new THREE.Group();root.name='레이싱 선생님 운전자';root.userData.raceOnly=true;scene.add(root);
 const loader=new GLTFLoader(),cache=new Map(),entries=new Map(),controllers=new Set();
 let queue=Promise.resolve(),generation=0,disposed=false;
 const wanted=new Set(),position=new THREE.Vector3(),rotation=new THREE.Quaternion();
 const load=fetchModel??(async(config,signal)=>{
  const response=await fetch(config.url,{signal});if(!response.ok)throw new Error('운전자 모델 HTTP '+response.status);
  return (await loader.parseAsync(await response.arrayBuffer(),new URL('.',config.url).href)).scene;
 });
 const forget=(id,item)=>{if(cache.get(id)===item)cache.delete(id);};
 function trim(){for(const [id,item] of cache)if(!wanted.has(id)&&item.model){disposeModel(item.model);cache.delete(id);}}
 function ensure(id){
  const found=cache.get(id);if(found)return found.promise;
  const item={model:null,promise:null};cache.set(id,item);
  // One decode at a time avoids a frame spike from five textures/model uploads.
  item.promise=queue.catch(()=>{}).then(async()=>{
   if(disposed||!wanted.has(id)||cache.get(id)!==item){forget(id,item);return null;}
   const controller=new AbortController();controllers.add(controller);
   const timeout=setTimeout(()=>controller.abort(),20000);
   try{
    const model=await load(RACE_TEACHER_MODELS[id],controller.signal);
    if(disposed||!wanted.has(id)||cache.get(id)!==item){disposeModel(model);forget(id,item);return null;}
    model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});item.model=model;return model;
   }catch(error){forget(id,item);if(error.name!=='AbortError')console.warn('레이싱 선생님 준비 실패',id,error.message);return null;}
   finally{clearTimeout(timeout);controllers.delete(controller);}
  });queue=item.promise;return item.promise;
 }
 function clear({keepCache=false}={}){
  generation++;
  for(const entry of entries.values()){
   root.remove(entry.group);
   if(entry.label){entry.label.material.map.dispose();entry.label.material.dispose();}
  }
  entries.clear();wanted.clear();root.visible=false;
  if(!keepCache){controllers.forEach(c=>c.abort());trim();for(const [id,item] of cache)if(!item.model)cache.delete(id);}
 }
 function start(cars){
  clear({keepCache:true});const version=generation;root.visible=true;
  for(const car of cars){
   if(!car.id||!RACE_TEACHER_MODELS[car.driverId])continue;
   const group=new THREE.Group();group.name=car.driverName+' 운전석';root.add(group);
   const label=driverLabel(car.driverName),entry={car,group,label,model:null,status:'loading'};
   if(label)group.add(label);entries.set(car.id,entry);wanted.add(car.driverId);
  }
  trim();
  for(const entry of entries.values())void ensure(entry.car.driverId).then(template=>{
   if(disposed||generation!==version||entries.get(entry.car.id)!==entry)return;
   if(!template){entry.status='error';return;}
   const model=template.clone(true),height=RACE_TEACHER_MODELS[entry.car.driverId].height,sports=entry.car.source.type==='sports';
   const seatY=sports?.40:.49,roof=CAR_DIMENSIONS[entry.car.source.type].height-.13;
   const scale=Math.min(1,(roof-seatY)/(height*.51));
   model.scale.setScalar(scale);model.rotation.y=Math.PI;
   model.position.set(-.36,seatY-height*.49*scale,.10);
   entry.group.add(model);entry.model=model;entry.status='ready';
  });
 }
 function update(cars,fleet,camera){
  for(const car of cars){
   const entry=entries.get(car.id);if(!entry)continue;
   entry.group.visible=car.finish===null||car.finish===undefined;if(!entry.group.visible)continue;
   const body=fleet.getObjectByName('race-'+car.id);if(!body)continue;
   body.updateWorldMatrix(true,false);body.getWorldPosition(position);body.getWorldQuaternion(rotation);
   entry.group.position.copy(position);entry.group.quaternion.copy(rotation);
   if(entry.label){const distance=position.distanceTo(camera.position);entry.label.position.set(0,car.source.type==='sports'?1.65:1.95,0);entry.label.visible=distance<48;entry.label.material.opacity=Math.min(1,Math.max(0,(48-distance)/16));}
  }
 }
 return {root,start,update,clear,getState:()=>[...entries.values()].map(e=>({id:e.car.id,driverId:e.car.driverId,driverName:e.car.driverName,status:e.status})),
  dispose(){disposed=true;clear();root.removeFromParent();}};
}
