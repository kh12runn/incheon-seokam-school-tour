import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../외부도구/three.module.js';
import {GLTFLoader} from '../외부도구/GLTFLoader.js';
import {STUDENT_MODELS,normalizeStudentModel,createStudentMotionClip} from '../학생캐릭터.mjs';
import {createCarryPose} from '../학생운반모션.mjs';
globalThis.ProgressEvent??=class{constructor(type,values){Object.assign(this,values);}};
const report=[];
for(const [id,file] of Object.entries(STUDENT_MODELS)){
  const bytes=fs.readFileSync(new URL('../캐릭터모델/'+file,import.meta.url)),len=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+len));
  json.images=[];json.textures=[];json.materials=json.materials.map(m=>({name:m.name}));json.buffers[0].uri='data:application/octet-stream;base64,'+bytes.subarray(28+len).toString('base64');
  const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),''),asset=gltf.scene,root=new THREE.Group();
  const idle=gltf.animations.find(c=>c.name==='Idle');root.add(normalizeStudentModel(asset,idle,.9));
  const mixer=new THREE.AnimationMixer(asset),pose=createCarryPose(root,asset);let maxError=0,frames=0;
  for(const kind of ['idle','run','jump']){
    mixer.stopAllAction();const source=gltf.animations.find(c=>c.name==={idle:'Idle',run:'Run_02',jump:'Jump_Run'}[kind]);
    mixer.clipAction(createStudentMotionClip(source,asset,kind,.9)).play();
    for(let i=0;i<120;i++){
      root.position.set(i*.01,kind==='jump'?Math.sin(Math.PI*i/120):0,-i*.015);root.rotation.y=i*.035;
      mixer.update(1/60);pose.update(1/60,true);root.updateMatrixWorld(true);
      for(const side of ['Left','Right']){
        const hand=asset.getObjectByName(side+'Hand'),upper=asset.getObjectByName(side+'Arm'),p=pose.socket.worldToLocal(hand.getWorldPosition(new THREE.Vector3())),s=root.worldToLocal(upper.getWorldPosition(new THREE.Vector3())).x<0?-1:1;
        const error=p.distanceTo(new THREE.Vector3(s*.16,-.13,-.035));
        if(i>30){maxError=Math.max(maxError,error);assert(error<.065,id+' '+kind+' hand separated from box: '+error);}
        assert(hand.quaternion.toArray().every(Number.isFinite));
      }
      frames++;
    }
  }
  for(let i=0;i<60;i++){mixer.update(1/60);pose.update(1/60,false);}assert(pose.blend<.001,'Release returns to normal animation');
  report.push({id,frames,maxHandError:Math.round(maxError*1000)/1000,release:true});
}
console.log({ok:true,report});
