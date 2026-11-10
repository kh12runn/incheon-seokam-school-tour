import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inflateSync} from 'node:zlib';
import * as THREE from '../외부도구/three.module.js';
import {createRoomDetailsCache} from '../공간상세로딩.mjs';
import {clearDaySky} from '../야외풍경.mjs';
import {partitionOutdoorInstances} from '../실외공간분할.mjs';
const scene=new THREE.Scene(),shared=new THREE.MeshBasicMaterial(),keep=new THREE.Mesh(new THREE.BoxGeometry(),shared);scene.add(keep);
let materialDisposed=false;shared.addEventListener('dispose',()=>{materialDisposed=true;});
const count=new Map(),disposed=[],cache=createRoomDetailsCache(scene,{capacity:1});
for(const [id,x] of [['a',0],['b',100]])cache.add({roomId:id,floor:1,center:new THREE.Vector3(x,0,0),create(){count.set(id,(count.get(id)??0)+1);const root=new THREE.Group(),g=new THREE.BoxGeometry(1,2,3);g.addEventListener('dispose',()=>disposed.push(id));root.add(new THREE.Mesh(g,shared));return root;}});
const settled=async()=>{for(let i=0;i<200;i++){await new Promise(r=>setTimeout(r,5));if(!cache.state().loading.length&&cache.state().loaded)return;}throw Error('Room preparation timeout');};
cache.update({x:0,y:0,z:0},'overview');await new Promise(r=>setTimeout(r,20));assert.equal(cache.state().loaded,0,'No room details during aerial startup');
cache.update({x:0,y:0,z:0},'walk');await settled();assert.deepEqual(cache.state().rooms,['a']);
cache.update({x:100,y:0,z:0},'walk');await settled();assert.deepEqual(cache.state().rooms,['b']);assert.deepEqual(disposed,['a']);assert(!materialDisposed,'Shared live material retained');
cache.update({x:0,y:0,z:0},'walk');await settled();assert.equal(count.get('a'),2,'Evicted room restores its own artwork');assert.deepEqual(cache.state().errors,[]);
let pixels;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>{pixels=image;}})})};clearDaySky();
const png=fs.readFileSync(new URL('../텍스처/가을하늘.png',import.meta.url)),chunks=[];for(let p=8;p<png.length;){const length=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+length));p+=length+12;}
const rows=inflateSync(Buffer.concat(chunks));for(let y=0;y<pixels.height;y++){const start=y*(pixels.width*4+1);assert.equal(rows[start],0);assert.deepEqual(rows.subarray(start+1,start+1+pixels.width*4),Buffer.from(pixels.data.buffer,y*pixels.width*4,pixels.width*4));}
const outdoor=new THREE.Group(),instances=new THREE.InstancedMesh(new THREE.BoxGeometry(),shared,100),m=new THREE.Matrix4(),c=new THREE.Color();outdoor.add(instances);const reference=[];
for(let i=0;i<100;i++){m.makeTranslation(i,0,i*.7);instances.setMatrixAt(i,m);instances.setColorAt(i,c.setRGB(i/100,.4,.7));reference.push([m.elements.slice(),c.toArray()]);}
const partition=partitionOutdoorInstances([outdoor]);assert.equal(partition.count,1);partition.update(true);assert(!instances.visible);const actual=[];outdoor.traverseVisible(o=>{if(o.isInstancedMesh)for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);o.getColorAt(i,c);actual.push([m.elements.slice(),c.toArray()]);}});
const round=values=>JSON.stringify(values,(key,v)=>typeof v==='number'?Math.round(v*10000)/10000:v);assert.equal(round(actual.sort((a,b)=>a[0][12]-b[0][12])),round(reference));partition.update(false);assert(instances.visible);
console.log(JSON.stringify({ok:true,deferredInitialRooms:true,distantMemoryReleased:true,roomRestoration:true,sharedMaterialsPreserved:true,spatialInstancesIdentical:true,skyPixelsIdentical:pixels.width*pixels.height}));
