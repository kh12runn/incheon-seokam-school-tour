import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from '../외부도구/three.module.js';
import {getRaceCourse} from '../레이싱코스.mjs';
import {createRace} from '../레이싱물리.mjs';
import {createRaceVisual} from '../레이싱표현.mjs';
import {PARKED_CARS} from '../주차장.mjs';

// This verifies actual Three.js objects and resource lifetimes without claiming
// browser rendering. The production texture drawing uses a no-op 2D context.
const gradient={addColorStop(){}};
const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:t=>({width:String(t).length*12})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>ctx})};
const scene=new THREE.Scene(),visual=createRaceVisual(scene),car=PARKED_CARS[0],signatures=new Set();
visual.garage(car,getRaceCourse(1));
const preview=visual.root.getObjectByName(car.id),pool=visual.root.getObjectByName('라운드 장애물 풀');
let disposedGeometry=0,disposedBanners=0,sharedMaterialDisposals=0;
const chalk=visual.root.getObjectByName('왼쪽 분필 경계').material;
chalk.addEventListener('dispose',()=>sharedMaterialDisposals++);
for(let pass=0;pass<2;pass++)for(let round=1;round<=5;round++){
 const course=getRaceCourse(round),old=visual.root.getObjectByName('라운드별 분필 코스'),changing=old.userData.courseId!==course.id;
 const previousGeometries=new Set();old.traverse(o=>{if(o.geometry)previousGeometries.add(o.geometry);});
 let thisDisposal=0;
 if(changing){for(const geo of previousGeometries)geo.addEventListener('dispose',()=>{disposedGeometry++;thisDisposal++;});old.getObjectByName('코스 출발 현수막').material.map.addEventListener('dispose',()=>disposedBanners++);}
 visual.garage(car,course);
 const track=visual.root.getObjectByName('라운드별 분필 코스');
 assert.equal(track.visible,false,'garage never intersects preview tyres with an elevated road');
 preview.updateWorldMatrix(true,true);
 for(const wheel of preview.userData.wheels){const bounds=new THREE.Box3().setFromObject(wheel);assert(Math.abs(bounds.min.y-(-.30))<.006,'tyre tread touches the school ground');}
 assert.equal(visual.root.userData.courseId,course.id);
 assert.equal(visual.root.userData.courseLength,course.length);
 assert.equal(visual.root.children.filter(o=>o.name==='라운드별 분필 코스').length,1,'one current course group');
 assert.equal(visual.root.getObjectByName(car.id),preview,'course selection must retain preview vehicle');
 assert.equal(visual.root.getObjectByName('라운드 장애물 풀'),pool,'course selection must retain pooled obstacles');
 assert.equal(visual.teacherState().length,0,'course preview must not load teachers');
 assert.equal(sharedMaterialDisposals,0,'powder material remains valid across course changes');
 if(changing){assert.equal(old.parent,null);assert.equal(thisDisposal,previousGeometries.size,'every previous course geometry disposed');}
 const edge=track.getObjectByName('왼쪽 분필 경계'),positions=edge.geometry.attributes.position;
 signatures.add(createHash('sha256').update(Buffer.from(positions.array.buffer)).digest('hex'));
 for(const fraction of [0,.13,.34,.67,1]){
  const step=Math.round((positions.count/2-1)*fraction),distance=step/(positions.count/2-1)*course.length;
  const center=course.trackPoint(distance),expected=course.trackPoint(distance,-(center.width??course.width)/2-.25);
  assert(Math.hypot(positions.getX(step*2)-expected.x,positions.getZ(step*2)-expected.z)<.0001,'rendered chalk follows selected geometry');
 }
 const banner=track.getObjectByName('코스 출발 현수막');
 assert(Math.abs(banner.rotation.y-course.trackPoint(0).yaw)<.0001,'reverse grid points along reversed course');
}
assert.equal(signatures.size,5,'all five ordered course geometries must differ');
assert(disposedBanners>=9,'previous banner texture released');

const camera=new THREE.PerspectiveCamera();
for(let round=1;round<=5;round++){
 const race=createRace({car,opponents:[],round,seed:17});visual.start(race);visual.update(race,.016,camera,0);
 assert.equal(visual.root.getObjectByName('라운드별 분필 코스').visible,true,'race restores the selected road');
 assert.equal(visual.root.userData.courseId,race.course.id);
 for(const [i,o] of race.obstacles.entries()){
  const item=pool.children[i],p=race.course.trackPoint(o.s,o.lane),world=new THREE.Vector3();item.getWorldPosition(world);
  assert(item.visible);assert(Math.hypot(world.x-p.x,world.z-p.z)<.0001,'pooled obstacle follows selected course');
  assert(Math.abs(world.y-(p.height+.06))<.0001,'pooled obstacle retains ground height');
 }
 assert(visual.root.getObjectByName('race-0'),'real player vehicle exists after round change');
}
visual.hide();assert.equal(visual.root.visible,false);assert.equal(visual.teacherState().length,0);
visual.dispose();assert.equal(visual.root.parent,null);assert.equal(sharedMaterialDisposals,1,'shared powder disposed once at final teardown');
console.log(JSON.stringify({ok:true,courseGeometries:signatures.size,previewPreserved:true,obstaclePoolPreserved:true,roundObstaclePositions:true,disposedGeometry,disposedBanners,sharedMaterialDisposals,webGLPixelCheck:false}));
