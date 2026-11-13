import * as THREE from '../외부도구/three.module.js';
import {createStudent} from '../학생캐릭터.mjs';
import {CAR_DIMENSIONS} from '../주차장.mjs';

// Browser-only: measures real skinned vertices, not the unposed bind bounds.
// The minimum checks the body underside as well as the ground, so hiding a
// protruding shoe with the garage floor cannot make this regression pass.
export async function checkSeatedStudents(){
 const checks=[],v=new THREE.Vector3();
 function bounds(root,legsOnly=false){const box=new THREE.Box3();root.updateMatrixWorld(true);root.traverse(o=>{
  if(!o.isSkinnedMesh)return;o.skeleton.update();const indices=o.geometry.attributes.skinIndex,weights=o.geometry.attributes.skinWeight;
  for(let i=0;i<o.geometry.attributes.position.count;i++){
   if(legsOnly){let leg=false;for(let j=0;j<4;j++)if(weights.getComponent(i,j)>.3&&/Leg|Foot|Toe/.test(o.skeleton.bones[indices.getComponent(i,j)].name)){leg=true;break;}if(!leg)continue;}
   o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld);box.expandByPoint(v);
  }
 });return box;}
 const assert=(value,message)=>{if(!value)throw Error(message);};
 for(const variant of ['boy-cute','girl-cute']){
  const student=createStudent(variant);await student.ready;
  try{
   for(const type of ['sports','sedan','compact','suv']){
    student.setSeated(1,type);const all=new THREE.Box3(),legs=new THREE.Box3();
    for(let frame=0;frame<=240;frame++){student.update(1/60);if(frame%30===0){all.union(bounds(student.root));legs.union(bounds(student.root,true));}}
    assert(legs.min.y>.28,variant+' '+type+' legs below chassis');
    assert(legs.min.x>-.30&&legs.max.x<.30&&legs.min.z>-.20&&legs.max.z<.78,variant+' '+type+' legs outside footwell');
    assert(all.max.y<CAR_DIMENSIONS[type].height-.015,variant+' '+type+' head outside roof');
    checks.push({variant,type,lowestLeg:legs.min.y,headTop:all.max.y});
   }
   student.setSeated(0);student.update(0);const restored=bounds(student.root);
   assert(restored.max.y-restored.min.y>1.43,'standing height restored after sports car');
   assert(restored.min.y>-.06&&restored.min.y<.06,'standing feet grounded after exit');
   const base=restored.clone();for(let i=0;i<10;i++){student.setSeated(1,'sports');student.update(0);student.setSeated(0);student.update(0);}
   const again=bounds(student.root);assert(again.min.distanceTo(base.min)<.002&&again.max.distanceTo(base.max)<.002,'repeated boarding accumulates no pose/scale drift');
  }finally{student.dispose();}
 }
 return {ok:true,checks,standingRestored:true};
}
