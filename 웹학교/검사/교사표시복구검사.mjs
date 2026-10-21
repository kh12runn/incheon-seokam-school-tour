import assert from 'node:assert/strict';
import * as T from '../외부도구/three.module.js';
import {CLASS_TEACHERS,createClassTeachers} from '../담임선생님.mjs';
import {finishTeacherMaterials} from '../선생님재질.mjs';
import {createPrincipalWalkRigAsync} from '../교장보행리그.mjs';
const world={data:{rooms:CLASS_TEACHERS.map(c=>({id:c.roomId,bounds:[c.position.x-2,c.position.x+8,-7,0,c.position.z,c.position.z+3.4]}))},candidate:()=>true};
const model=()=>{const root=new T.Group();root.add(new T.Mesh(new T.BoxGeometry(.5,1.8,.3),new T.MeshStandardMaterial()));return root;};
const until=async fn=>{for(let i=0;i<400&&!fn();i++)await new Promise(r=>setTimeout(r,5));assert(fn(),'Timed out');};
const pending=[],downloads=[];
const manager=createClassTeachers(world,{
 fetchModel:async c=>{downloads.push(c.id);return model();},
 prepareMaterials:(source,{signal})=>new Promise((resolve,reject)=>{
  const entry={signal,done:()=>{signal.removeEventListener('abort',abort);finishTeacherMaterials(source);resolve({processing:'worker'});}};
  const abort=()=>reject(signal.reason);signal.addEventListener('abort',abort,{once:true});pending.push(entry);
 })
});
const corridor=i=>({...CLASS_TEACHERS[i].position,y:1.5});
manager.update(.016,corridor(3),'overview');assert.equal(downloads.length,0,'No startup downloads');
manager.update(.016,corridor(3),'walk');
await until(()=>manager.getStates()[3].modelStatus==='ready');
assert(manager.getStates()[3].visible,'Visible from the center of the corridor');
assert(manager.getStates()[3].hasModel,'Model visible before filter completes');
assert.equal(manager.getStates()[3].preparation.processing,'filtering');
assert.equal(pending.length,1);
manager.update(.016,corridor(5),'walk');await until(()=>manager.getStates()[5].modelStatus==='ready');
assert(manager.getStates()[5].hasModel,'Next room loads independently of earlier filter');
assert.equal(pending.length,1,'At most one atlas worker');
manager.update(.016,corridor(0),'walk');await until(()=>manager.getStates()[0].modelStatus==='ready');
assert(pending[0].signal.aborted,'Evicted filter cancelled');
assert.equal(manager.getStates().filter(s=>s.hasModel).length,2,'Bounded GPU model cache');
await until(()=>pending.length===2);pending[1].done();await until(()=>pending.length===3);pending[2].done();
await until(()=>manager.getStates()[0].preparation.processing==='worker');
assert(manager.getStates()[0].hasModel);
manager.update(.016,corridor(0),'overview');assert(manager.getStates().every(s=>!s.visible));
for(const t of manager.teachers)t.evict();
const failing=createClassTeachers(world,{fetchModel:async()=>model(),prepareMaterials:async()=>{throw Error('Filter unavailable');}});
failing.update(.016,corridor(3),'walk');await until(()=>failing.getStates()[3].preparation?.processing==='original-fallback');
assert.equal(failing.getStates()[3].modelStatus,'ready');assert(failing.getStates()[3].hasModel,'Optional filter cannot remove teacher');
for(const t of failing.teachers)t.evict();
let releaseRig;const rigGate=new Promise(resolve=>{releaseRig=resolve;});
const slowRig=createClassTeachers(world,{fetchModel:async()=>model(),makeRig:async(model,options)=>{await rigGate;return createPrincipalWalkRigAsync(model,options);},prepareMaterials:async()=>({processing:'original-fallback'})});
slowRig.update(.016,corridor(3),'walk');await until(()=>slowRig.getStates()[3].hasModel);
assert.equal(slowRig.getStates()[3].modelStatus,'loading','Original preview shown even while rig builds');
releaseRig();await until(()=>slowRig.getStates()[3].modelStatus==='ready');for(const t of slowRig.teachers)t.evict();
console.log(JSON.stringify({ok:true,corridorVisible:true,previewBeforeRig:true,visibleBeforeFinish:true,independentRoomLoading:true,singleWorker:true,evictionCancelsWorker:true,cacheLimit:2,filterFailureKeepsAvatar:true}));
