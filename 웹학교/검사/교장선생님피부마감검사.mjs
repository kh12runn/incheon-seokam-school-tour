import assert from 'node:assert/strict';
import * as THREE from '../외부도구/three.module.js';
import {createPrincipalFace,principalFaceDepth,PRINCIPAL_SKIN_COLOR} from '../교장선생님사진얼굴.mjs';
import {applyApprovedPrincipalAppearance,PRINCIPAL_APPEARANCE_VERSION,PRINCIPAL_APPROVED_SKIN} from '../교장선생님피부마감.mjs';
import {runtimeFiles} from '../../관리도구/배포최적화.mjs';
let checkedRays=0;
for(const runner of [false,true]){
  const root=new THREE.Group(),head=new THREE.Group(),face=createPrincipalFace();root.add(head);head.add(face);
  const skin=new THREE.Mesh(new THREE.SphereGeometry(.05),new THREE.MeshStandardMaterial({color:PRINCIPAL_SKIN_COLOR}));root.add(skin);
  const source=face.children[0].geometry,original=source.attributes.position.array.slice();
  applyApprovedPrincipalAppearance(root,{runner});
  assert.equal(root.userData.appearanceVersion,PRINCIPAL_APPEARANCE_VERSION);
  assert.equal(skin.material.color.getHexString(),PRINCIPAL_APPROVED_SKIN.slice(1));
  assert.deepEqual(source.attributes.position.array,original,'공유 기본 형상 보존');
  const mesh=face.children[0];assert.notEqual(mesh.geometry,source);
  for(const key of ['position','normal'])assert([...mesh.geometry.attributes[key].array].every(Number.isFinite));
  const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <map_fragment>'};mesh.material.onBeforeCompile(shader);
  assert.equal(shader.uniforms.solidHair.value,runner?1:0);assert.equal(shader.uniforms.portraitReady.value,0,'사진 미로드 시 피부색 대체');
  assert(shader.fragmentShader.includes('crease*.92'),'승인된 주름 강도');
  const lenses=head.children.filter(o=>o.name==='옆눈까지 감싸는 불투명 선글라스');assert.equal(lenses.length,runner?2:0);
  if(runner){root.updateMatrixWorld(true);const ray=new THREE.Raycaster();
    for(const side of [-1,1])for(const x of [.029,.049,.070])for(const y of [.155,.166])for(const a of [-1.25,-.8,0,.8,1.25])for(const pitch of [-.20,0,.20]){
      ray.set(new THREE.Vector3(side*x,y,principalFaceDepth(side*x,y)+.0001),new THREE.Vector3(Math.sin(a),pitch,Math.cos(a)).normalize());
      assert(ray.intersectObjects(lenses).length,`눈 가림 ${side*x},${y},${a},${pitch}`);checkedRays++;
    }
  }
  const geometry=mesh.geometry,count=head.children.length;applyApprovedPrincipalAppearance(root,{runner});assert.equal(mesh.geometry,geometry);assert.equal(head.children.length,count,'반복 적용 시 중복 없음');
}
assert(runtimeFiles().includes('웹학교/교장선생님피부마감.mjs'));
console.log({ok:true,approvedAppearance:true,sourceUnchanged:true,uniformSkin:true,blackRunnerHair:true,eyeCoverageRays:checkedRays,runtimeIncluded:true});
