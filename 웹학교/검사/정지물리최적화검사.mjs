import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {createFootballPhysics} from '../축구공물리.mjs';
import * as THREE from '../외부도구/three.module.js';
import {freezeStaticTree} from '../정적장면최적화.mjs';
import {roomDoorVisuals} from '../출입문표현.mjs';
import {batchSurfaceColors,finishMaterial,surfaceInstanceColor} from '../현실재질.mjs';
const school=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url))),{interactiveDoors:true});
const physics=createFootballPhysics(school);physics.enableDrivingTerrain();
for(const b of school.boxes){
 if(!b.color||!batchSurfaceColors(b))continue;
 const original=finishMaterial(b),batched=finishMaterial({...b,color:[1,1,1]});
 const actual=batched.color.clone().multiply(surfaceInstanceColor(b));
 for(const k of ['r','g','b'])assert(Math.abs(actual[k]-original.color[k])<1e-12,'instance color preserves '+b.name);
 assert.equal(batched.roughness,original.roughness);assert.equal(batched.metalness,original.metalness);
 original.dispose();batched.dispose();
}
for(const b of physics.balls)b.sleep();
const p={x:33.5,y:.66,z:10.2},positions=physics.balls.map(b=>b.position.toArray());
for(let i=0;i<600;i++){school.roomDoors.update(1/60,p);physics.update(1/60,p,p);}
assert.equal(physics.getWorkState().physicsSteps,0);assert.equal(physics.getWorkState().doorSyncs,0);assert.equal(physics.getWorkState().idleFrames,600);
assert.deepEqual(positions,physics.balls.map(b=>b.position.toArray()));
const ball=physics.balls[0],near={x:ball.position.x,y:ball.position.y-.35,z:-.3};
physics.update(1/60,near,{...near,y:near.y-.1});
assert(ball.kicks>0);assert(physics.getWorkState().physicsSteps>0,'kick immediately resumes integration');
const parent=new THREE.Group(),child=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());parent.position.set(5,4,3);child.position.set(1,2,3);parent.add(child);parent.updateMatrixWorld(true);
const before=child.matrixWorld.toArray();freezeStaticTree(parent);parent.updateMatrixWorld(true);assert.deepEqual(before,child.matrixWorld.toArray());assert.equal(child.matrixAutoUpdate,false);
const view=roomDoorVisuals(school.roomDoors);view.userData.update(p,true);
const batches=view.children.filter(x=>x.isInstancedMesh);assert.equal(batches.length,3,'opaque door materials batched into three draws');
assert(batches.some(m=>m.count>0));let uploads=0;const versions=batches.map(b=>b.instanceMatrix.version);
view.userData.update(p,true);assert.deepEqual(batches.map(b=>b.instanceMatrix.version),versions,'no uploads for stationary doors');
school.roomDoors.toggle(p);for(let i=0;i<60;i++)school.roomDoors.update(1/60,p);view.userData.update(p,true);
assert(batches.some((b,i)=>b.instanceMatrix.version>versions[i]),'sliding updates geometry');
console.log({ok:true,idleFrames:600,idlePhysicsSteps:0,staticTransformsPreserved:true,opaqueDoorBatches:batches.length,kickResumes:true});
