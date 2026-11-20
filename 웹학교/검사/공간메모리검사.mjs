import assert from 'node:assert/strict';
import * as THREE from '../외부도구/three.module.js';
import {createRoomDetailsCache} from '../공간상세로딩.mjs';
const scene=new THREE.Scene(),disposed=new Set(),uploads=[];
const make=id=>{const root=new THREE.Group(),map=new THREE.Texture({width:1024,height:2048});map.addEventListener('dispose',()=>disposed.add(id));root.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({map})));return root;};
const until=async predicate=>{for(let i=0;i<600;i++){if(predicate())return;await new Promise(r=>setTimeout(r,10));}throw Error('Cache did not settle');};
const cache=createRoomDetailsCache(scene,{capacity:3,memoryBudget:30*1024*1024,initTexture:t=>uploads.push(t)});
for(let i=0;i<14;i++)cache.add({roomId:String(i),floor:1,center:new THREE.Vector3(i*4,0,0),create:()=>make(i)});
cache.update({x:0,y:0,z:0},'walk');await until(()=>cache.state().loaded===2&&!cache.state().loading.length);
assert(cache.state().estimatedBytes<=cache.state().memoryBudget);assert.deepEqual(cache.state().rooms,['0','1']);
for(const x of [24,48,12,40,0]){
 cache.update({x,y:0,z:0},'walk');const id=String(Math.round(x/4));await until(()=>cache.state().rooms.includes(id)&&!cache.state().loading.length);
 assert(cache.state().loaded<=3);assert(cache.state().estimatedBytes<=cache.state().memoryBudget);assert(cache.isVisible(id));
}
cache.update({x:0,y:0,z:0},'race');await until(()=>cache.state().loaded===0&&!cache.state().loading.length);assert.equal(scene.children.length,0);assert(disposed.size>5);
cache.update({x:0,y:0,z:0},'walk');await until(()=>cache.state().loaded===2&&!cache.state().loading.length);assert(cache.isVisible('0'),'Revisit rebuilds original room');
cache.update({x:0,y:0,z:0},'overview');await until(()=>!cache.state().loaded);
// A mode change during async shader compilation must not resurrect old rooms.
let finishCompile,started=false;const barrier=new Promise(r=>{finishCompile=r;});
const slow=createRoomDetailsCache(scene,{compile:async()=>{started=true;await barrier;},initTexture:()=>{throw Error('Obsolete upload');}});
slow.add({roomId:'slow',floor:1,center:new THREE.Vector3(),create:()=>make('slow')});slow.update({x:0,y:0,z:0},'walk');await until(()=>started);
slow.update({x:0,y:0,z:0},'race');finishCompile();await until(()=>!slow.state().loading.length);assert.equal(scene.children.length,0);assert(disposed.has('slow'));assert.deepEqual(slow.state().errors,[]);
assert(uploads.every(t=>t.image.width===1024&&t.image.height===2048),'Original texture pixels retained');
console.log({ok:true,boundedBytes:true,revisit:true,cancelInFlight:true,releaseOnRace:true,unchangedResolution:true});
