import * as THREE from './외부도구/three.module.js';

function geometryKey(g){
  let hash=2166136261;const fields=[g.index,...Object.keys(g.attributes).sort().map(k=>g.attributes[k])].filter(Boolean);
  for(const a of fields){const bytes=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);for(const b of bytes)hash=Math.imul(hash^b,16777619);}
  return hash+':'+fields.map(a=>a.itemSize+':'+a.array.constructor.name+':'+a.count+':'+a.normalized).join('|');
}
function equalGeometry(a,b){
  const names=Object.keys(a.attributes).sort();if(names.join()!==Object.keys(b.attributes).sort().join()||!!a.index!==!!b.index)return false;
  return [null,...names].every(k=>{const x=k===null?a.index:a.attributes[k],y=k===null?b.index:b.attributes[k];
    if(!x)return !y;if(!y||x.array.length!==y.array.length||x.itemSize!==y.itemSize||x.normalized!==y.normalized)return false;
    const l=new Uint8Array(x.array.buffer,x.array.byteOffset,x.array.byteLength),r=new Uint8Array(y.array.buffer,y.array.byteOffset,y.array.byteLength);
    return l.length===r.length&&l.every((v,i)=>v===r[i]);});
}
// Moving cars retain their existing parent pivots, wheels and doors. Repeated
// opaque parts share a draw call; each transform is still updated independently.
export function instanceRepeatedParts(root){
  const candidates=new Map();root.updateMatrixWorld(true);
  root.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.children.length||Array.isArray(o.material)||o.material.transparent||Object.keys(o.geometry.morphAttributes).length)return;
    const key=[geometryKey(o.geometry),o.material.uuid,o.castShadow,o.receiveShadow,o.renderOrder,o.layers.mask].join('/');
    if(!candidates.has(key))candidates.set(key,[]);candidates.get(key).push(o);
  });
  const batches=[];let removed=0;
  for(const items of candidates.values()){
    if(items.length<2||!items.every(o=>equalGeometry(o.geometry,items[0].geometry)))continue;
    const first=items[0],mesh=new THREE.InstancedMesh(first.geometry,first.material,items.length);
    mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.renderOrder=first.renderOrder;mesh.layers.mask=first.layers.mask;
    mesh.name='차량 반복 부품';mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const records=items.map(o=>({parent:o.parent,local:o.matrix.clone(),last:new THREE.Matrix4().makeScale(0,0,0)}));
    items.forEach(o=>o.removeFromParent());root.add(mesh);batches.push({mesh,records});removed+=items.length-1;
  }
  const inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4();
  const update=()=>{
    root.updateMatrixWorld(true);inverse.copy(root.matrixWorld).invert();
    for(const {mesh,records} of batches){let dirty=false;
      records.forEach((r,i)=>{matrix.multiplyMatrices(inverse,r.parent.matrixWorld).multiply(r.local);if(!matrix.equals(r.last)){r.last.copy(matrix);mesh.setMatrixAt(i,matrix);dirty=true;}});
      if(dirty){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
    }
  };
  update();return {update,removed};
}
