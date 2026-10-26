export const TEACHER_MODEL_RELEASE='teacher-models-20261025';
// Keep approved cartoon vertex tints, face overlays, UVs and material maps.
// The old scanned-face atlas filter and asymmetric science pose correction are
// incompatible with this release and must not be run on these models.
export function prepareApprovedTeacherMaterials(model){
 let meshes=0;const materials=new Set();
 model.traverse(o=>{if(!o.isMesh)return;meshes++;o.castShadow=true;o.receiveShadow=false;
  for(const m of [].concat(o.material)){m.userData.teacherFinish=TEACHER_MODEL_RELEASE;materials.add(m);}
 });return {meshes,materials:materials.size,processing:'approved-original',release:TEACHER_MODEL_RELEASE};
}
