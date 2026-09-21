import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../외부도구/three.module.js';
import {OFFICE_CHARACTERS,normalizePrincipalModel} from '../교장실캐릭터.mjs';
import {buildWorld} from '../이동물리.mjs';
import {blocksPrincipal} from '../교장선생님인사.mjs';
import {runtimeFiles} from '../../관리도구/배포최적화.mjs';

const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')));
assert.equal(OFFICE_CHARACTERS.length,1);
assert.deepEqual(OFFICE_CHARACTERS.map(c=>c.id),['cute']);
for(const config of OFFICE_CHARACTERS){
  const p=config.position;
  assert.equal(config.height,1.83);
  assert.equal(world.roomAt(p).room.id,'2F_PRINCIPAL');
  assert(world.candidate(p.x,p.y,p.z),'캐릭터가 가구와 겹치지 않음');
  assert(blocksPrincipal({...p,x:p.x+1},p,p),'캐릭터 중심 충돌');
  const bytes=fs.readFileSync(config.url);
  assert.equal(bytes.readUInt32LE(0),0x46546c67,'GLB magic');
  assert.equal(bytes.readUInt32LE(4),2,'GLB version');
  assert.equal(bytes.readUInt32LE(8),bytes.length,'GLB complete');
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  assert(json.meshes.length>0);
  assert(json.buffers.every(b=>!b.uri),'독립 GLB geometry');
  assert(json.images.length>0&&json.images.every(i=>Number.isInteger(i.bufferView)),'내장 피부 텍스처');
}
assert(world.candidate(32.45,-.85,3.4),'입구 유지');
for(const c of OFFICE_CHARACTERS)assert(!blocksPrincipal({x:32.45,y:0,z:3.4},{x:32.45,y:-.85,z:3.4},c.position),'입구 캐릭터 충돌 없음');
// Offset, transformed geometry catches normalization that assumes a centered origin.
const asset=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(2,4,1),new THREE.MeshStandardMaterial());
mesh.position.set(3,7,-2);asset.position.set(2,-1,4);asset.scale.set(1.5,2,.5);asset.add(mesh);
const normalized=normalizePrincipalModel(asset,1.83),bounds=new THREE.Box3().setFromObject(normalized),size=bounds.getSize(new THREE.Vector3());
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,a+' ≈ '+b);
near(size.y,1.83);near(bounds.min.y,0);near(bounds.min.x+bounds.max.x,0);near(bounds.min.z+bounds.max.z,0);
near(size.x/size.y,3/8);near(size.z/size.y,.5/8);assert(mesh.castShadow&&mesh.receiveShadow);
assert.throws(()=>normalizePrincipalModel(new THREE.Group(),1.83),/높이/);
const runtime=runtimeFiles();
const approvedModels=['교장선생님-귀여운','교장선생님-머리','남학생-귀여운','여학생-귀여운'].map(name=>'웹학교/캐릭터모델/'+name+'.glb');
assert.deepEqual(runtime.filter(p=>p.endsWith('.glb')).sort(),approvedModels.sort());
assert(!runtime.some(p=>p.startsWith('모델/')||p.startsWith('사진보관/')),'원본 제외');
console.log({ok:true,characters:1,height:1.83,placement:true,normalization:true,embeddedTextures:true,packedModels:4});
