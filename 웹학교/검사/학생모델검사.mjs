import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createStudent,CHARACTER_NAMES,STUDENT_MODELS,normalizeStudentVariant} from '../학생캐릭터.mjs';

const models=['남학생-귀여운','여학생-귀여운'];
const variants=['boy-cute','girl-cute'];
assert.deepEqual(Object.keys(STUDENT_MODELS).sort(),[...variants].sort(),'두 귀여운 모델만 제공');
assert.deepEqual(Object.values(STUDENT_MODELS).sort(),models.map(name=>name+'.glb').sort(),'모델 파일 연결');
assert.equal(normalizeStudentVariant('boy'),'boy-cute','이전 남학생 선택 호환');
assert.equal(normalizeStudentVariant('girl'),'girl-cute','이전 여학생 선택 호환');
assert.equal(normalizeStudentVariant('boy-realistic'),'boy-cute','이전 실사 남학생 선택 호환');
assert.equal(normalizeStudentVariant('girl-realistic'),'girl-cute','이전 실사 여학생 선택 호환');
for(const variant of variants){
  assert(CHARACTER_NAMES[variant],variant+' 표시 이름');
  const student=createStudent(variant,{lazy:true});
  assert(student.root?.isObject3D,variant+' THREE root');
  assert(student.ready instanceof Promise,variant+' 준비 Promise');
  for(const method of ['load','update','snapHeading','getState','dispose'])assert.equal(typeof student[method],'function',variant+' '+method);
  assert.notEqual(student.modelStatus,'loading',variant+' 지연 로딩');
  assert.notEqual(student.modelStatus,'ready',variant+' 초기 모델 미생성');
  student.dispose();
}
const report=[];
for(const name of models){
  const bytes=fs.readFileSync(new URL('../캐릭터모델/'+name+'.glb',import.meta.url));
  assert(bytes.length<30*1024*1024,name+' 모바일 전송 크기 30 MiB 미만');
  assert.equal(bytes.readUInt32LE(0),0x46546c67,name+' GLB magic');
  assert.equal(bytes.readUInt32LE(4),2,name+' GLB version');
  assert.equal(bytes.readUInt32LE(8),bytes.length,name+' 완전한 파일');
  assert.equal(bytes.readUInt32LE(16),0x4e4f534a,name+' JSON chunk');
  const jsonLength=bytes.readUInt32LE(12),binaryOffset=20+jsonLength;
  const gltf=JSON.parse(bytes.subarray(20,binaryOffset).toString('utf8'));
  assert.equal(bytes.readUInt32LE(binaryOffset+4),0x004e4942,name+' BIN chunk');
  const binaryLength=bytes.readUInt32LE(binaryOffset);
  assert.equal(binaryOffset+8+binaryLength,bytes.length,name+' 전체 바이너리 포함');
  assert(gltf.buffers?.length===1&&!gltf.buffers[0].uri,name+' 외부 geometry 없음');
  assert(gltf.buffers[0].byteLength<=binaryLength,name+' buffer 범위');
  for(const view of gltf.bufferViews??[])assert(view.buffer===0&&(view.byteOffset??0)>=0&&(view.byteOffset??0)+view.byteLength<=binaryLength,name+' bufferView 범위');
  assert(gltf.meshes?.length>0,name+' mesh 포함');
  assert(gltf.images?.length>0&&gltf.images.every(image=>Number.isInteger(image.bufferView)&&gltf.bufferViews[image.bufferView]&&!image.uri),name+' 내장 텍스처');
  assert(gltf.skins?.some(skin=>skin.joints.length>=15),name+' 휴머노이드 관절');
  for(const skin of gltf.skins){
    assert(skin.joints.every(index=>gltf.nodes[index]),name+' 유효한 관절 참조');
    assert.equal(new Set(skin.joints).size,skin.joints.length,name+' 중복 관절 없음');
  }
  const skinnedNodes=gltf.nodes.filter(node=>Number.isInteger(node.skin)&&Number.isInteger(node.mesh));
  assert(skinnedNodes.length>0,name+' 스킨 mesh 연결');
  for(const node of skinnedNodes){
    assert(gltf.skins[node.skin],name+' 유효한 skin 참조');
    for(const primitive of gltf.meshes[node.mesh].primitives){
      assert(Number.isInteger(primitive.attributes.JOINTS_0)&&Number.isInteger(primitive.attributes.WEIGHTS_0),name+' 관절과 가중치');
      const attributes=['POSITION','JOINTS_0','WEIGHTS_0'].map(key=>gltf.accessors[primitive.attributes[key]]);
      assert(attributes.every(accessor=>accessor&&accessor.count===attributes[0].count&&accessor.count>0),name+' 정점별 스킨 데이터');
    }
  }
  assert(gltf.animations?.length>0,name+' 애니메이션 포함');
  assert(gltf.animations.some(clip=>/run|running/i.test(clip.name??'')),name+' 달리기 클립');
  for(const clip of gltf.animations){
    assert(clip.channels.length>0&&clip.samplers.length>0,name+' 재생 가능한 클립');
    assert(clip.samplers.some(sampler=>{const input=gltf.accessors[sampler.input];return input?.count>1&&input.max?.[0]>input.min?.[0];}),name+' 양수 클립 길이');
    for(const channel of clip.channels){
      assert(gltf.nodes[channel.target.node]&&clip.samplers[channel.sampler],name+' 애니메이션 대상');
      const sampler=clip.samplers[channel.sampler],input=gltf.accessors[sampler.input],output=gltf.accessors[sampler.output];
      assert(input?.count>0&&output?.count>0,name+' 키프레임 데이터');
    }
  }
  report.push({name,bytes:bytes.length,joints:gltf.skins[0].joints.length,clips:gltf.animations.map(clip=>clip.name)});
}
console.log({ok:true,models:report});
