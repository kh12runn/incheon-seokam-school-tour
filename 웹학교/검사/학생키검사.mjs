import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from '../외부도구/three.module.js';
import {GLTFLoader} from '../외부도구/GLTFLoader.js';
import {STUDENT_MODELS,STUDENT_HEIGHT,normalizeStudentModel,createStudentMotionClip} from '../학생캐릭터.mjs';

globalThis.ProgressEvent??=class{constructor(type,values){Object.assign(this,values);}};
const results=[];
for(const [id,file] of Object.entries(STUDENT_MODELS)){
  const bytes=fs.readFileSync(new URL('../캐릭터모델/'+file,import.meta.url)),jsonLength=bytes.readUInt32LE(12);
  const json=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
  // Keep the real meshes, skin and animation. Texture decoding needs a browser.
  json.images=[];json.textures=[];json.materials=json.materials.map(m=>({name:m.name}));
  json.buffers[0].uri='data:application/octet-stream;base64,'+bytes.subarray(28+jsonLength).toString('base64');
  const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'');
  const headScale=id.endsWith('-cute')?.9:1;
  const idle=gltf.animations.find(clip=>clip.name==='Idle'),holder=normalizeStudentModel(gltf.scene,idle,headScale);
  assert.equal(holder.scale.x,holder.scale.y);assert.equal(holder.scale.y,holder.scale.z);
  const mixer=new THREE.AnimationMixer(gltf.scene);mixer.clipAction(createStudentMotionClip(idle,gltf.scene,'idle',headScale)).play();
  let top=-Infinity,foot=Infinity,maxFoot=-Infinity;
  for(let i=0;i<=100;i++){
    mixer.setTime(idle.duration*i/100);holder.updateMatrixWorld(true);
    holder.traverse(object=>{if(object.isSkinnedMesh)object.computeBoundingBox();});
    const bounds=new THREE.Box3().setFromObject(holder);top=Math.max(top,bounds.max.y);foot=Math.min(foot,bounds.min.y);maxFoot=Math.max(maxFoot,bounds.min.y);
  }
  assert(Math.abs(top-STUDENT_HEIGHT)<.005,id+' standing height must stay at 1.40m');
  assert(foot>=-.005&&maxFoot<.025,id+' idle feet must stay near the floor');
  assert(top/1.84<.77,id+' student must be visibly shorter than the principal');
  for(const source of gltf.animations){
    mixer.stopAllAction();mixer.clipAction(createStudentMotionClip(source,gltf.scene,source.name,headScale)).play();
    for(let i=0;i<=10;i++){mixer.setTime(source.duration*i/10);assert(gltf.scene.getObjectByName('Head').scale.toArray().every(v=>Math.abs(v-headScale)<1e-5),id+' '+source.name+' head scale persists');}
  }
  results.push({id,top,foot,maxFoot,uniformScale:holder.scale.x,headScale});
}
console.log(JSON.stringify({ok:true,targetHeight:STUDENT_HEIGHT,results},null,2));
