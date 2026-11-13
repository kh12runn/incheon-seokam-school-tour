import * as THREE from './외부도구/three.module.js';
import {GLTFLoader} from './외부도구/GLTFLoader.js';
import {normalizePrincipalModel} from './교장실캐릭터.mjs';
import {createPrincipalWalkRigAsync} from './교장보행리그.mjs';

const smooth=x=>{const t=THREE.MathUtils.clamp(x,0,1);return t*t*(3-2*t);};
export function starterPose(seconds){
 const lift=smooth(seconds/1.1),go=smooth((seconds-2.3)/.5),settle=1-smooth((seconds-5.2)/1.8),wave=Math.sin((seconds-3)*Math.PI*2*1.25),follow=Math.sin((seconds-3)*Math.PI*2*1.25-.55);
 return {shoulderZ:(.28+.95*lift+wave*.30*go)*settle,shoulderX:(-.2-.25*lift+follow*.16*go)*settle,
  elbowX:(-.18-.48*lift+follow*.2*go)*settle,bodyYaw:wave*.045*go,bodyLean:follow*.025*go,
  poleAngle:(-.25+wave*.56*go)*settle,clothPhase:seconds*8,grip:lift};
}
export function createRaceStarter(scene,{loadModel}={}){
 const root=new THREE.Group();root.name='출발 신호 교장선생님';root.userData.raceOnly=true;root.visible=false;scene.add(root);
 const body=new THREE.Group();root.add(body);let rig=null,loading=null,status='idle',disposed=false,course=null,time=0;
 const controller=new AbortController(),loader=new GLTFLoader();
 const stage=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.5,.32,24),new THREE.MeshStandardMaterial({color:0x263d4c,roughness:.8}));stage.position.y=.16;root.add(stage);body.position.y=.32;
 const fabric=document.createElement('canvas');fabric.width=256;fabric.height=192;const ctx=fabric.getContext('2d');
 for(let y=0;y<6;y++)for(let x=0;x<8;x++){ctx.fillStyle=(x+y)%2?'#12151a':'#fffdf4';ctx.fillRect(x*32,y*32,32,32);}
 const texture=new THREE.CanvasTexture(fabric);texture.colorSpace=THREE.SRGBColorSpace;
 const flag=new THREE.Group();flag.name='흑백 체크 출발 깃발';root.add(flag);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,1.4,10),new THREE.MeshStandardMaterial({color:0xb3bbc0,metalness:.5,roughness:.38}));pole.position.y=.65;flag.add(pole);
 const geometry=new THREE.PlaneGeometry(.95,.65,20,12);geometry.translate(.48,.92,0);const cloth=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,side:THREE.DoubleSide,roughness:.8}));cloth.name='바람에 펄럭이는 체크 천';cloth.frustumCulled=false;flag.add(cloth);const rest=geometry.attributes.position.array.slice();
 const hand=new THREE.Vector3();
 function release(model){const resources=new Set();model?.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.skeleton)resources.add(o.skeleton);for(const m of [].concat(o.material??[])){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v);}});for(const r of resources)r.dispose?.();}
 async function prepare(){
  if(rig)return true;if(loading)return loading;status='loading';
  loading=(async()=>{
   const url=new URL('./캐릭터모델/레이싱/교장선생님-출발.glb',import.meta.url),response=loadModel?null:await fetch(url,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])});if(response&&!response.ok)throw Error('출발 교장선생님 HTTP '+response.status);
   const source=loadModel?await loadModel():(await loader.parseAsync(await response.arrayBuffer(),new URL('.',url).href)).scene;
   const built=await createPrincipalWalkRigAsync(normalizePrincipalModel(source,1.83),{receiveShadow:false,continuousSleeves:true});
   // The rig owns cloned geometry and shares the approved material/texture data.
   source.traverse(o=>o.geometry?.dispose());
   if(disposed){release(built.root);return false;}rig=built;body.add(rig.root);rig.root.traverse(o=>{if(o.isMesh)o.castShadow=false;});status='ready';return true;
  })().catch(error=>{status='error';console.warn('출발 심판 준비 실패',error.message);return false;}).finally(()=>{loading=null;});return loading;
 }
 function show(next){course=next;const p=course.trackPoint(-9,-course.width/2-2.2);root.position.set(p.x,p.height+.02,p.z);root.rotation.y=p.yaw+Math.PI;time=0;root.visible=true;update({phase:'countdown',countdown:3,time:0,paused:false});}
 function update(state){
  if(!root.visible||!rig)return;
  if(!state.paused)time=state.phase==='countdown'?3-state.countdown:3+state.time;
  if(time>9){root.visible=false;return;}const pose=starterPose(time),b=rig.bones;
  b[7].rotation.set(pose.shoulderX,0,pose.shoulderZ);b[8].rotation.set(pose.elbowX,0,.08);b[5].rotation.x=-.1;b[6].rotation.x=-.12;
  b[0].rotation.y=pose.bodyYaw;b[0].rotation.z=pose.bodyLean;b[1].rotation.x=-pose.bodyLean*.4;b[3].rotation.x=pose.bodyLean*.4;
  root.updateMatrixWorld(true);hand.set(0,-.255,.015);b[8].localToWorld(hand);root.worldToLocal(hand);flag.position.copy(hand);flag.rotation.set(.12,Math.sin(time*2)*.08,pose.poleAngle);
  const pos=geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=rest[i*3],u=Math.max(0,x/.95);pos.setXYZ(i,x,rest[i*3+1]+Math.sin(pose.clothPhase-5*u)*.025*u,Math.sin(pose.clothPhase-6*u)*.085*u+Math.sin(pose.clothPhase*1.4-u*9)*.018*u);}pos.needsUpdate=true;geometry.computeVertexNormals();
 }
 return {root,prepare,show,update,hide(){root.visible=false;},getState:()=>({status,visible:root.visible,source:'office-cute',time,pose:starterPose(time),flagVertices:geometry.attributes.position.count}),
  focus(cameraPosition,look){root.updateMatrixWorld(true);cameraPosition.copy(root.localToWorld(new THREE.Vector3(-1.8,2.3,5.4)));look.copy(root.localToWorld(new THREE.Vector3(.2,1.5,0)));},
  dispose(){disposed=true;controller.abort();release(root);root.removeFromParent();}};
}
