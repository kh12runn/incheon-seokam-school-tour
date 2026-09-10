import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import * as THREE from '../외부도구/three.module.js';
import {PHOTO_URLS,PHOTO_PATCHES,photoSurfaces,photoGeometry,createClass64PhotoFinish} from '../육학년사반사진마감.mjs';
const surfaces=photoSurfaces();
assert.equal(surfaces.length,165);
assert.equal(surfaces.filter(s=>s.name.startsWith('책상 상판')).length,24);
assert.equal(surfaces.filter(s=>s.name.startsWith('사물함 목재문')).length,12);
for(const surface of surfaces){
  assert.equal(surface.spaceId,'4F_6-4');
  const geometry=photoGeometry([surface]),p=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),n=geometry.getAttribute('normal');
  for(let i=0;i<p.count;i++){
    assert(p.getX(i)>30.1&&p.getX(i)<39.9,surface.name+' x');
    assert(p.getY(i)>10.2&&p.getY(i)<13.35,surface.name+' height');
    assert(p.getZ(i)>.1&&p.getZ(i)<6.9,surface.name+' y');
    assert(uv.getX(i)>0&&uv.getX(i)<1&&uv.getY(i)>0&&uv.getY(i)<1);
    assert(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5);
  }
  geometry.dispose();
}
for(const patch of Object.values(PHOTO_PATCHES))assert(patch.photo===0||patch.photo===1);
const hashes=['9e90002e483fe75e88a69925527ec7ca15c4c2a2e152cf0644292c35ae225dae','2d552fac0d9e96ed6dec2741a1307d0d1cb29bdbf70689d19ae68dca7ca02083'];
PHOTO_URLS.forEach((url,i)=>assert.equal(createHash('sha256').update(fs.readFileSync(url)).digest('hex'),hashes[i],'Existing edited photo preserved'));
let requests=0;
const success=createClass64PhotoFinish({loadTexture:async()=>{requests++;return new THREE.Texture();}});
assert.equal(requests,0,'Lazy until near classroom');
await Promise.all([success.load(),success.load()]);
assert.equal(requests,2,'One request per photo');
assert.equal(success.getState().status,'ready');
assert(success.group.children.every(mesh=>mesh.visible));
const failure=createClass64PhotoFinish({loadTexture:async()=>{throw new Error('offline');}});
await failure.load();assert.equal(failure.getState().status,'error');
assert(failure.group.children.every(mesh=>!mesh.visible),'Failed texture never obscures the original classroom');
const root=fileURLToPath(new URL('../../',import.meta.url));
let preserved=0;
if(process.argv[2]){
  const backup=path.resolve(root,process.argv[2]);
  assert(backup.startsWith(path.join(root,'모델/백업')+path.sep));
  for(const rel of ['모델/school_master.blend','웹학교/학교구조.json','웹학교/이동물리.mjs','웹학교/교실기본배치.mjs','웹학교/본관교실.mjs','웹학교/본관교실표현.mjs','웹학교/교실별특징.mjs','웹학교/육학년사반.mjs','웹학교/삼인칭카메라.mjs','웹학교/학생캐릭터.mjs','웹학교/점프물리.mjs']){
    assert.deepEqual(fs.readFileSync(path.join(root,rel)),fs.readFileSync(path.join(backup,rel)),rel+' unchanged');preserved++;
  }
}
console.log({ok:true,room:'4F_6-4',surfaces:surfaces.length,photos:2,drawMeshes:2,lazy:true,errorFallback:true,preservedCoreFiles:preserved});
