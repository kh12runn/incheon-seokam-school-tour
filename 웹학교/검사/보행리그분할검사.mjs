import assert from 'node:assert/strict';
import * as T from '../외부도구/three.module.js';
import {createPrincipalWalkRig,createPrincipalWalkRigAsync} from '../교장보행리그.mjs';
const model=new T.Group(),original=new T.SphereGeometry(.6,64,32);
const mesh=new T.Mesh(original,new T.MeshBasicMaterial());
mesh.position.set(.2,.8,-.1);mesh.rotation.set(.1,.2,.3);mesh.scale.set(.9,1.4,.8);model.add(mesh);model.updateMatrixWorld(true);
original.computeBoundingBox();original.computeBoundingSphere();
const reference=original.clone().applyMatrix4(mesh.matrixWorld);
const sync=createPrincipalWalkRig(model),asyncRig=await createPrincipalWalkRigAsync(model);
for(const rig of [sync,asyncRig]){
 const output=rig.root.children.find(o=>o.isSkinnedMesh).geometry;
 for(const key of ['position','normal'])assert.deepEqual(output.attributes[key].array,reference.attributes[key].array,'Exact original Three.js transform: '+key);
 assert.deepEqual(output.boundingBox,reference.boundingBox);
 assert.deepEqual(output.boundingSphere,reference.boundingSphere);
}
const a=sync.root.children.find(o=>o.isSkinnedMesh),b=asyncRig.root.children.find(o=>o.isSkinnedMesh);
for(const key of ['skinIndex','skinWeight'])assert.deepEqual(a.geometry.attributes[key].array,b.geometry.attributes[key].array);
assert.notEqual(mesh.geometry,a.geometry);assert.equal(mesh.geometry,original);
console.log(JSON.stringify({ok:true,exactOriginalTransforms:true,exactWeights:true,originalPreserved:true}));
