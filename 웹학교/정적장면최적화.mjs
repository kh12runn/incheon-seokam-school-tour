import * as THREE from './외부도구/three.module.js';
import {mergeGeometries} from './외부도구/BufferGeometryUtils.js';

// Merge only opaque, static detail belonging to the SAME visibility root and
// material. Transparent objects retain their individual depth sorting. No
// vertices, normals, UVs, texture pixels or shadow flags are simplified.
function* batchDetailsSteps(root){
  root.updateMatrixWorld(true);
  const inverse=root.matrixWorld.clone().invert(),groups=new Map();
  root.traverseVisible(o=>{
    const g=o.geometry,m=o.material;
    if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||Array.isArray(m)||m.transparent||o.children.length||
      Object.keys(g.morphAttributes).length||g.drawRange.start!==0||Number.isFinite(g.drawRange.count)||
      o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender||o.matrixWorld.determinant()<=0)return;
    const attributes=Object.keys(g.attributes).sort().map(k=>{const a=g.attributes[k];return k+':'+a.itemSize+':'+a.normalized+':'+a.array?.constructor.name;}).join('|');
    const key=[m.uuid,!!g.index,attributes,o.castShadow,o.receiveShadow,o.renderOrder,o.layers.mask].join('/');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
  });
  let removed=0;
  for(const items of groups.values()){
    if(items.length<2)continue;
    const parts=[];for(const o of items){parts.push(o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld)));yield;}
    const geometry=mergeGeometries(parts,false);for(const g of parts)g.dispose();
    if(!geometry)continue;
    geometry.computeBoundingSphere();const first=items[0],mesh=new THREE.Mesh(geometry,first.material);
    mesh.name='정적 세부 통합';mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.renderOrder=first.renderOrder;mesh.layers.mask=first.layers.mask;
    for(const o of items)o.removeFromParent();root.add(mesh);removed+=items.length-1;
    yield;
  }
  return removed;
}
export function batchStaticDetails(root){const steps=batchDetailsSteps(root);let result;do{result=steps.next();}while(!result.done);return result.value;}
export async function batchStaticDetailsAsync(root,yieldWork=()=>new Promise(r=>setTimeout(r,0))){
  const steps=batchDetailsSteps(root);let result,start=performance.now();
  do{result=steps.next();if(!result.done&&performance.now()-start>4){await yieldWork();start=performance.now();}}while(!result.done);
  return result.value;
}

// Preserve all vertices, textures, shadows and transforms, without recomputing
// authoring-only transforms every frame. Never use on avatars or moving props.
export function freezeStaticTree(root){
  root.updateMatrixWorld(true);let count=0;
  root.traverse(object=>{object.matrixAutoUpdate=false;object.matrixWorldAutoUpdate=false;count++;});
  // Three r180 still recursively visits children even with both matrix flags
  // disabled. This root is explicitly immutable; skip that traversal too.
  root.updateMatrixWorld=()=>{};
  return count;
}
