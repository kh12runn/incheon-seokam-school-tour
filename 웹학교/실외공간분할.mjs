import * as THREE from './외부도구/three.module.js';
// The aerial view keeps one draw per original batch. Indoors, smaller batches
// allow normal frustum culling to reject offscreen trees/walls without any LOD.
export function partitionOutdoorInstances(roots,cellSize=20){
 const records=[],matrix=new THREE.Matrix4(),color=new THREE.Color();
 for(const root of roots){const meshes=[];root.traverse(o=>{if(o.isInstancedMesh&&o.count>=64&&!o.material.transparent)meshes.push(o);});
  for(const mesh of meshes){
   const cells=new Map();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);const p=matrix.elements,key=Math.floor(p[12]/cellSize)+','+Math.floor(p[14]/cellSize)+','+Math.floor(p[13]/3.4);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i);}
   if(cells.size<2)continue;
   if(mesh.matrixAutoUpdate)mesh.updateMatrix();const group=new THREE.Group();group.name='동일 형상 · 화면 밖 영역 생략';group.matrix.copy(mesh.matrix);group.matrixAutoUpdate=false;mesh.parent.add(group);
   for(const ids of cells.values()){
    const chunk=new THREE.InstancedMesh(mesh.geometry,mesh.material,ids.length);chunk.castShadow=mesh.castShadow;chunk.receiveShadow=mesh.receiveShadow;chunk.renderOrder=mesh.renderOrder;chunk.layers.mask=mesh.layers.mask;
    ids.forEach((index,i)=>{mesh.getMatrixAt(index,matrix);chunk.setMatrixAt(i,matrix);if(mesh.instanceColor){mesh.getColorAt(index,color);chunk.setColorAt(i,color);}});chunk.computeBoundingSphere();group.add(chunk);
   }group.visible=false;records.push({mesh,group});
  }
 }
 return{count:records.length,update(value){for(const {mesh,group} of records){mesh.visible=!value;group.visible=value;}}};
}
