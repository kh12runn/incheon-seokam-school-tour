import * as THREE from './외부도구/three.module.js';
import {GLTFLoader} from './외부도구/GLTFLoader.js';
import {RUN_SPEED} from './달리기모션.mjs';
export {RUN_SPEED,gaitFoot} from './달리기모션.mjs';
export const STUDENT_HEIGHT=1.4;

export const CHARACTER_NAMES=Object.freeze({'boy-realistic':'남학생 · 실사풍','boy-cute':'남학생 · 귀여운형','girl-realistic':'여학생 · 실사풍','girl-cute':'여학생 · 귀여운형',boy:'남학생 · 귀여운형',girl:'여학생 · 귀여운형'});
export const STUDENT_MODELS=Object.freeze({'boy-realistic':'남학생-실사풍.glb','boy-cute':'남학생-귀여운.glb','girl-realistic':'여학생-실사풍.glb','girl-cute':'여학생-귀여운.glb'});
const MODEL_URLS=Object.freeze({
  'boy-realistic':new URL('./캐릭터모델/남학생-실사풍.glb',import.meta.url),
  'boy-cute':new URL('./캐릭터모델/남학생-귀여운.glb',import.meta.url),
  'girl-realistic':new URL('./캐릭터모델/여학생-실사풍.glb',import.meta.url),
  'girl-cute':new URL('./캐릭터모델/여학생-귀여운.glb',import.meta.url)
});
export const normalizeStudentVariant=id=>id==='boy'?'boy-cute':id==='girl'?'girl-cute':id;
const loader=new GLTFLoader(),templates=new Map();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function template(id){
  if(!templates.has(id)){
    const promise=loader.loadAsync(MODEL_URLS[id].href).catch(error=>{templates.delete(id);throw error;});
    templates.set(id,promise);
  }
  return templates.get(id);
}

// Clone bones as well as the scene; meshes in separate previews must never share poses.
function cloneRig(source,materials){
  const clone=source.clone(true),copies=new Map();
  function pair(a,b){copies.set(a,b);a.children.forEach((child,i)=>pair(child,b.children[i]));}pair(source,clone);
  source.traverse(original=>{
    const object=copies.get(original);
    if(original.isMesh){
      const material=m=>{
        if(!materials.has(m)){
          const copy=m.clone();
          // Meshy animation exports default to metallic, emissive surfaces. These
          // students have fabric, skin and hair, so use a matte dielectric finish.
          copy.metalness=0;copy.roughness=.85;copy.emissive?.set(0);copy.emissiveIntensity=0;copy.specularColor?.set(0xffffff);
          materials.set(m,copy);
        }
        return materials.get(m);
      };
      object.material=Array.isArray(original.material)?original.material.map(material):material(original.material);
      object.castShadow=true;object.receiveShadow=true;
      // Animated limbs can leave the bind-pose bounds.
      if(object.isSkinnedMesh)object.frustumCulled=false;
    }
    if(original.isSkinnedMesh){
      object.skeleton=original.skeleton.clone();
      object.skeleton.bones=original.skeleton.bones.map(bone=>copies.get(bone));
      if(object.skeleton.bones.some(bone=>!bone))throw new Error('학생 모델의 뼈대가 올바르지 않습니다.');
      object.bind(object.skeleton,original.bindMatrix);
    }
  });
  return clone;
}
export function createStudentMotionClip(source,asset,kind,headScale=1){
  const clip=source.clone();
  // Keep the hips in place horizontally. Game physics alone owns jump height.
  for(const track of clip.tracks){
    if(headScale!==1&&track.name==='Head.scale')for(let i=0;i<track.values.length;i++)track.values[i]*=headScale;
    if(!track.name.endsWith('.position'))continue;
    let node;
    try{node=THREE.PropertyBinding.findNode(asset,THREE.PropertyBinding.parseTrackName(track.name).nodeName);}catch{}
    const rootBone=node?.isBone&&!node.parent?.isBone;
    const rootObject=node&&!node.isBone&&(node===asset||node.children.some(child=>child.isBone));
    if(!rootBone&&!rootObject)continue;
    for(let i=0;i<track.values.length;i+=3){track.values[i]=node.position.x;track.values[i+2]=node.position.z;if(kind==='jump')track.values[i+1]=node.position.y;}
  }
  clip.name=kind;return clip;
}
const matchers={idle:/idle|standing|(^|[^0-9])0([^0-9]|$)/i,run:/run_?02|running|^run$|(^|[^0-9])14([^0-9]|$)/i,jump:/jump|(^|[^0-9])13([^0-9]|$)/i,wave:/wave|hello|(^|[^0-9])28([^0-9]|$)/i};

export function normalizeStudentModel(asset,idleClip,headScale=1){
  if(headScale!==1)asset.getObjectByName('Head').scale.multiplyScalar(headScale);
  asset.updateMatrixWorld(true);
  const bindBounds=new THREE.Box3().setFromObject(asset),idleBounds=new THREE.Box3();
  const measurementMixer=new THREE.AnimationMixer(asset),action=measurementMixer.clipAction(createStudentMotionClip(idleClip,asset,'idle',headScale));
  action.play();
  // Meshy retargeting stretches the standing pose beyond the original bind pose.
  // Size the actual idle animation, keeping the complete breathing cycle grounded.
  for(let i=0;i<=10;i++){
    measurementMixer.setTime(idleClip.duration*i/10);asset.updateMatrixWorld(true);
    asset.traverse(object=>{if(object.isSkinnedMesh)object.computeBoundingBox();});
    idleBounds.union(new THREE.Box3().setFromObject(asset));
  }
  measurementMixer.stopAllAction();measurementMixer.uncacheRoot(asset);asset.updateMatrixWorld(true);
  asset.traverse(object=>{if(object.isSkinnedMesh)object.computeBoundingBox();});
  const height=idleBounds.max.y-idleBounds.min.y;
  if(!(height>0&&Number.isFinite(height)))throw new Error('학생 모델 높이를 계산할 수 없습니다.');
  const holder=new THREE.Group(),scale=STUDENT_HEIGHT/height;holder.add(asset);holder.scale.setScalar(scale);
  holder.position.set(-(bindBounds.min.x+bindBounds.max.x)*.5*scale,-idleBounds.min.y*scale,-(bindBounds.min.z+bindBounds.max.z)*.5*scale);
  return holder;
}

export function createStudent(requested='boy-cute',{lazy=false}={}){
  const variant=normalizeStudentVariant(requested);
  if(!STUDENT_MODELS[variant])throw new Error('Unknown character');
  const headScale=variant.endsWith('-cute')?.9:1;
  const root=new THREE.Group();root.name=CHARACTER_NAMES[variant];
  const materials=new Map(),actions={};
  let asset,mixer,currentAction,currentAnimation=null,status='not-requested',error=null,disposed=false,loading;
  let heading=0,speed=0,blend=0,opacity=1,waveTime=0,waveHeading=0,airBlend=0,motion='대기',animationNames=[];
  let resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  // Consumers still receive rejection; this prevents an unhandled rejection before awaiting.
  ready.catch(()=>{});
  function setOpacity(value){opacity=clamp(value,0,1);for(const m of materials.values()){m.transparent=opacity<1;m.opacity=opacity;m.depthWrite=opacity>.95;}}
  function play(kind){
    const next=actions[kind];if(!next||next===currentAction)return;
    next.reset().setEffectiveWeight(1).fadeIn(.16).play();currentAction?.fadeOut(.16);currentAction=next;currentAnimation=kind;
  }
  function load(){
    if(loading)return ready;
    status='loading';
    loading=(async()=>{
      try{
        const gltf=await template(variant);if(disposed)throw new Error('학생 캐릭터 로드가 취소되었습니다.');
        asset=cloneRig(gltf.scene,materials);
        const idleClip=gltf.animations.find(clip=>matchers.idle.test(clip.name));
        if(!idleClip)throw new Error(CHARACTER_NAMES[variant]+'의 idle 동작이 없습니다.');
        root.add(normalizeStudentModel(asset,idleClip,headScale));
        animationNames=gltf.animations.map(clip=>clip.name);mixer=new THREE.AnimationMixer(asset);
        for(const [kind,matcher] of Object.entries(matchers)){
          const clip=gltf.animations.find(clip=>matcher.test(clip.name));
          if(!clip)throw new Error(CHARACTER_NAMES[variant]+'의 '+kind+' 동작이 없습니다.');
          const action=mixer.clipAction(createStudentMotionClip(clip,asset,kind,headScale));actions[kind]=action;
          if(kind==='wave'||kind==='jump'){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}
        }
        play('idle');mixer.update(0);setOpacity(opacity);status='ready';resolveReady(api);
      }catch(reason){status='error';error=String(reason?.message??reason);rejectReady(reason);}
    })();return ready;
  }
  function update(dt,{distance=0,dx=0,dy=0,airborne=false,verticalSpeed=0,landing=0}={}){
    const delta=Math.max(0,Math.min(dt,.1)),actualSpeed=dt>0?distance/dt:0,a=1-Math.exp(-delta*12);
    speed+=(actualSpeed-speed)*a;blend+=(clamp(actualSpeed/1.2,0,1)-blend)*a;airBlend+=((airborne?1:0)-airBlend)*a;
    if(distance>.00001){const target=Math.atan2(dx,-dy);heading+=Math.atan2(Math.sin(target-heading),Math.cos(target-heading))*(1-Math.exp(-delta*10));}
    else if(waveTime>0)heading+=Math.atan2(Math.sin(waveHeading-heading),Math.cos(waveHeading-heading))*(1-Math.exp(-delta*8));
    root.rotation.y=heading;
    waveTime=Math.max(0,waveTime-delta);
    const kind=airborne?'jump':waveTime>0?'wave':speed>.15?'run':'idle';
    play(kind);if(kind==='run'&&actions.run)actions.run.setEffectiveTimeScale(clamp(speed/RUN_SPEED,.3,1.5));
    mixer?.update(delta);
    motion=airborne?(verticalSpeed>0?'점프':'낙하'):waveTime>0?'인사':landing>.1?'착지':kind==='run'?'달리기':'대기';
  }
  const api={root,variant,ready,load,update,get modelStatus(){return status;},
    wave(targetHeading=heading){waveHeading=targetHeading;waveTime=actions.wave?.getClip().duration??2.6;},cancelWave(){waveTime=0;},
    snapHeading(value){heading=value;root.rotation.y=value;},setOpacity,
    getState:()=>({variant,name:CHARACTER_NAMES[variant],heading,speed,blend,phase:currentAction?.time??0,motion,waving:waveTime>0,waveBlend:currentAnimation==='wave'?1:0,airBlend,opacity,footHeights:[0,0],arms:[],modelStatus:status,error,animationNames:[...animationNames],currentAnimation,height:STUDENT_HEIGHT,headScale}),
    dispose(){disposed=true;mixer?.stopAllAction();if(asset)mixer?.uncacheRoot(asset);root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});materials.forEach(m=>m.dispose());root.clear();if(status==='not-requested')rejectReady(new Error('학생 캐릭터가 닫혔습니다.'));}
  };
  if(!lazy)load();return api;
}
