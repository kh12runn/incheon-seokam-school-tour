import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildWorld} from '../이동물리.mjs';
import {PRINCIPAL_ROUTES,createPrincipalWalk} from '../교장선생님산책.mjs';
import {createPrincipalWalkRig} from '../교장보행리그.mjs';
import * as THREE from '../외부도구/three.module.js';
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('../학교구조.json',import.meta.url),'utf8')));
const walkers=Object.keys(PRINCIPAL_ROUTES).map(id=>({id,walk:createPrincipalWalk(world,id),visited:new Set()}));
for(const {id} of walkers)for(const [x,y,z] of PRINCIPAL_ROUTES[id])assert(world.candidate(x,y,z),id+' valid waypoint '+[x,y,z]);
for(let i=0;i<16000;i++)for(const actor of walkers){
  const s=actor.walk.update(.05,null,{others:walkers.filter(a=>a!==actor).map(a=>a.walk.getState().position)});
  actor.visited.add(s.waypoint);assert(world.candidate(s.position.x,s.position.y,s.position.z),actor.id+' solid footing');
  if(actor.id!=='lobby')assert.equal(world.roomAt(s.position).room?.id,'2F_PRINCIPAL');
}
for(const {id,walk,visited} of walkers){
  assert.equal(visited.size,PRINCIPAL_ROUTES[id].length,id+' all waypoints');assert(walk.getState().distance>10,id+' actually walks');
  const p=walk.getState().position;walk.update(.05,{...p,x:p.x+.8});assert.deepEqual(walk.getState().position,p,'Stop to converse');
  walk.update(.05,null,{paused:true});assert.deepEqual(walk.getState().position,p,'Menu pauses patrol');
}
// Weights are normalized; bind pose preserves geometry and head stays on root.
for(const cute of [false,true]){
  const model=new THREE.Group(),g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([-.1,.08,0,-.1,.4,0,.1,.08,0,.1,.4,0,0,1.7,0,.3,1,0],3));
  const material=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(g,material);model.add(mesh);
  const rig=createPrincipalWalkRig(model,{cute}),skin=rig.root.children.find(n=>n.isSkinnedMesh);
  for(let i=0;i<6;i++){
    const weights=skin.geometry.getAttribute('skinWeight');let sum=0;for(let j=0;j<4;j++)sum+=weights.array[i*4+j];assert(Math.abs(sum-1)<1e-6);
    const v=new THREE.Vector3().fromBufferAttribute(g.getAttribute('position'),i),actual=v.clone();skin.applyBoneTransform(i,actual);assert(v.distanceTo(actual)<1e-6,'Bind pose preserved');
  }
  for(let i=0;i<50;i++)rig.update(.02,{moving:true,speed:.48,phase:Math.PI/2});
  rig.root.updateMatrixWorld(true);skin.skeleton.update();
  assert(rig.bones[1].rotation.x>0&&rig.bones[3].rotation.x<0,'Opposite legs');
  assert(rig.bones[5].rotation.x<0&&rig.bones[7].rotation.x>0,'Contralateral arms');
  const head=new THREE.Vector3(0,1.7,0),posed=head.clone();skin.applyBoneTransform(4,posed);assert(head.distanceTo(posed)<1e-6,'Face shape is not deformed');
}
console.log({ok:true,samples:16000*walkers.length,walkers:walkers.map(a=>({id:a.id,distance:a.walk.getState().distance,waypoints:a.visited.size})),collision:true,conversationalStop:true,skinWeights:true,bindPose:true});
