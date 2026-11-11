import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../외부도구/three.module.js';
import {batchStaticDetails,batchStaticDetailsAsync,freezeStaticTree} from '../정적장면최적화.mjs';
import {instanceRepeatedParts} from '../반복부품통합.mjs';
import {circulationFinish,circulationEndCaps} from '../공용공간마감.mjs';
import {buildWorld} from '../이동물리.mjs';
const root=new THREE.Group(),material=new THREE.MeshStandardMaterial(),glass=new THREE.MeshBasicMaterial({transparent:true});
root.position.set(3,5,7);root.rotation.y=.7;
for(let i=0;i<4;i++){const g=new THREE.Group();g.position.set(i,1,-i);g.rotation.z=i*.1;root.add(g);const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);m.scale.set(1,2,3);g.add(m);}
const clear=new THREE.Mesh(new THREE.BoxGeometry(),glass);root.add(clear);
const tuples=object=>{const rows=[],v=new THREE.Vector3();object.updateMatrixWorld(true);object.traverseVisible(o=>{if(!o.isMesh||o.material.transparent)return;const g=o.geometry,p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<(g.index?.count??p.count);i++){const k=g.index?.getX(i)??i;v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld);rows.push([...v.toArray().map(n=>n.toFixed(4)),uv.getX(k),uv.getY(k)].join(','));}});return rows.sort();};
const before=tuples(root),asyncRoot=root.clone(true);assert.equal(await batchStaticDetailsAsync(asyncRoot),3);assert.deepEqual(tuples(asyncRoot),before,'Async work preserves every vertex and UV');assert.equal(batchStaticDetails(root),3);assert.deepEqual(tuples(root),before);assert.equal(clear.parent,root);freezeStaticTree(root);root.updateMatrixWorld(true);assert.deepEqual(tuples(root),before);
const cars=new THREE.Group(),pivots=[];for(let i=0;i<3;i++){const p=new THREE.Group();p.position.x=i*10;cars.add(p);p.add(new THREE.Mesh(new THREE.BoxGeometry(),material));pivots.push(p);}
const instancing=instanceRepeatedParts(cars);assert.equal(instancing.removed,2);pivots[1].position.z=4;pivots[2].rotation.y=.8;instancing.update();const mesh=cars.children.find(o=>o.isInstancedMesh),matrix=new THREE.Matrix4();for(let i=0;i<3;i++){mesh.getMatrixAt(i,matrix);assert(matrix.elements.every((n,k)=>Math.abs(n-pivots[i].matrixWorld.elements[k])<1e-6));}
const data=JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),world=buildWorld(data),snapshot=JSON.stringify(world.boxes),out=world.boxes.map(circulationFinish),finished=out.filter(b=>b.completionFinish);
assert.equal(JSON.stringify(world.boxes),snapshot,'Physical world must remain unchanged');
for(const b of world.boxes.filter(b=>b.material||b.interiorRoom||/사진/.test(b.name)))assert.equal(circulationFinish(b),b,'Reviewed room/photo finish changed');
for(const s of world.stairs)assert(out.some(b=>b.name.startsWith(s.id+' ')&&(b.completionFinish||b.material)),'Missing stair finish '+s.id);
assert(finished.some(b=>b.name.includes('MAIN_CORRIDOR')));assert(finished.some(b=>b.name.includes('ANNEX_CORRIDOR')));
for(const b of finished.filter(b=>b.kind==='step'))assert(b.bounds[5]-b.bounds[2]>=.154,'Riser gap left open');
const caps=circulationEndCaps(world.boxes,world.data);assert(caps.length>0);assert(caps.some(b=>b.bounds[1]<-73&&b.bounds[0]>=100));assert(caps.every(b=>b.kind==='finish'&&!b.collision));
console.log(JSON.stringify({ok:true,staticGeometryAndUVsPreserved:true,transparentOrderPreserved:true,movingPartsIndependent:true,physicsUnchanged:true,photoInteriorsUnchanged:true,finishedSurfaces:finished.length,endCaps:caps.length,stairs:world.stairs.map(s=>s.id)}));
