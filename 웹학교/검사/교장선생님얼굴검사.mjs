import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPrincipalFace,principalFaceDepth,PRINCIPAL_FACE_VERSION,PRINCIPAL_HEAD_SCALE} from '../교장선생님얼굴.mjs';
import {runtimeFiles} from '../../관리도구/배포최적화.mjs';
for(const sunglasses of [false,true]){
  const face=createPrincipalFace({sunglasses});let count=0;
  face.traverse(o=>{if(!o.isMesh)return;count++;for(const key of ['position','normal'])assert([...o.geometry.attributes[key].array].every(Number.isFinite),'유효한 '+key);});
  assert(count>=5);assert.equal(face.userData.faceVersion,PRINCIPAL_FACE_VERSION);
  const head=face.getObjectByName('사진 얼굴에서 뒷머리와 목까지 이어진 두상');
  assert(head.material.map,'이전 배포본 인물 사진 재사용');
  assert.equal(face.userData.continuousNeck,true);assert(head.geometry.attributes.position.count>10000);
  const p=head.geometry.attributes.position,blend=head.geometry.attributes.portraitWeight;
  let neck=false,back=false,photoFront=false;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),w=blend.getX(i);
    assert(w>=0&&w<=1);
    if(y<-.04){neck=true;assert.equal(w,0,'목에 얼굴 사진 반복 없음');}
    if(z<-.06){back=true;assert.equal(w,0,'뒤통수에 얼굴 비침 없음');}
    if(Math.abs(x)<.02&&y>.12&&y<.2&&z>.08){photoFront=true;assert(w>.99,'눈·코·입 사진 보존');}
  }
  assert(neck&&back&&photoFront,'앞·뒤·목 입체 표면 유지');
  assert(PRINCIPAL_HEAD_SCALE>=.78&&PRINCIPAL_HEAD_SCALE<=.86,'성인 머리 비율');
  assert(principalFaceDepth(0,.131)>principalFaceDepth(.065,.131),'부드럽게 돌출된 코끝');
}
for(const filename of ['교장실표현.mjs','마라토너교장선생님.mjs']){
  const code=fs.readFileSync(new URL('../'+filename,import.meta.url),'utf8');assert(code.includes('createPrincipalFace('),'두 NPC 공유 얼굴');assert(code.includes('head.scale.setScalar(PRINCIPAL_HEAD_SCALE)'),'복장·선캡·선글라스와 함께 머리 비율 조정');
}
const runtime=runtimeFiles();assert(runtime.includes('웹학교/교장선생님얼굴.mjs'));assert(runtime.some(p=>p.endsWith('교장선생님-얼굴.png')));
assert(runtime.includes('웹학교/교장선생님사진얼굴.mjs'));
console.log({ok:true,sharedFace:true,photoTexture:true,continuousHeadAndNeck:true,adultProportions:true,validGeometry:true,runtimeIncluded:true});
