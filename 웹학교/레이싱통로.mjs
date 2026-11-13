import * as THREE from './외부도구/three.module.js';
import {finishMaterial} from './현실재질.mjs';
import {RACE_COURSES,RACE_CUT_ZONES,RACE_SURFACES,groundHeight,getRaceCourse} from './레이싱코스.mjs';

const originalCuts=RACE_CUT_ZONES.map(b=>({cx:(b.minX+b.maxX)/2,cz:(b.minZ+b.maxZ)/2,tx:1,tz:0,halfL:(b.maxX-b.minX)/2,halfW:(b.maxZ-b.minZ)/2,minY:b.minY,maxY:b.maxY}));
const cutsFor=course=>course?.cutVolumes??originalCuts;
const boundsFor=b=>{const dx=Math.abs(b.tx)*b.halfL+Math.abs(b.tz)*b.halfW,dz=Math.abs(b.tz)*b.halfL+Math.abs(b.tx)*b.halfW;return new THREE.Box3(new THREE.Vector3(b.cx-dx,b.minY,b.cz-dz),new THREE.Vector3(b.cx+dx,b.maxY,b.cz+dz));};
// Keep every original mesh and collider. A race-only visual opening is switched
// off atomically on exit; race physics uses its own boundaries and checkpoints.
export function patchPassageShader(shader,enabled,cuts){
 shader.uniforms.racePassageOpen=enabled;
 Object.assign(shader.uniforms,cuts);
 shader.vertexShader='varying vec3 vRaceCutPoint;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
 vec4 raceCutPosition=vec4(transformed,1.0);
 #ifdef USE_BATCHING
 raceCutPosition=batchingMatrix*raceCutPosition;
 #endif
 #ifdef USE_INSTANCING
 raceCutPosition=instanceMatrix*raceCutPosition;
 #endif
 vRaceCutPoint=(modelMatrix*raceCutPosition).xyz;`);
 shader.fragmentShader='varying vec3 vRaceCutPoint;\nuniform float racePassageOpen;\nuniform int raceCutCount;\nuniform vec4 raceCutA[32];\nuniform vec4 raceCutB[32];\nuniform vec2 raceCutC[32];\nuniform vec3 raceCutMin;\nuniform vec3 raceCutMax;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('void main() {',`void main() {
 if(racePassageOpen>.5&&all(greaterThan(vRaceCutPoint,raceCutMin))&&all(lessThan(vRaceCutPoint,raceCutMax))){
  for(int i=0;i<32;i++){if(i>=raceCutCount)break;vec4 a=raceCutA[i],b=raceCutB[i];
   vec2 q=vRaceCutPoint.xz-a.xy;float along=dot(q,a.zw),floorY=along*raceCutC[i].x+raceCutC[i].y;
   if(vRaceCutPoint.y<floorY+b.z||vRaceCutPoint.y>floorY+b.w)continue;
   if(abs(along)<b.x&&abs(dot(q,vec2(-a.w,a.z)))<b.y)discard;
  }
 }`);
}

export function createRacePassages(scene){
 const root=new THREE.Group();root.name='레이싱 임시 연결 통로';root.visible=false;root.userData.raceOnly=true;scene.add(root);
 const enabled={value:0},patched=new WeakSet(),shadows=new Map();
 const uniforms={raceCutCount:{value:0},raceCutA:{value:Array.from({length:32},()=>new THREE.Vector4())},raceCutB:{value:Array.from({length:32},()=>new THREE.Vector4())},raceCutC:{value:Array.from({length:32},()=>new THREE.Vector2())},raceCutMin:{value:new THREE.Vector3()},raceCutMax:{value:new THREE.Vector3()}};
 const zones=RACE_COURSES.flatMap(course=>cutsFor(course).map(boundsFor));let currentCourse=getRaceCourse(1);
 const box=new THREE.Box3();let changedMaterials=0;
 function patch(material){
  if(!material||patched.has(material)||material.isShaderMaterial)return;
  const before=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){before.call(this,shader,renderer);patchPassageShader(shader,enabled,uniforms);};
  material.customProgramCacheKey=()=>cacheKey+'|campus-race-passages-v2';material.needsUpdate=true;
  patched.add(material);changedMaterials++;
 }
 const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});patch(depth);
 const distance=new THREE.MeshDistanceMaterial();patch(distance);
 function excluded(object){for(let p=object;p;p=p.parent)if(p.userData.raceOnly||p.name==='운동장 가상 레이싱 트랙')return true;return false;}
 function select(course=getRaceCourse(1)){
  currentCourse=course;const volumes=cutsFor(course),bounds=new THREE.Box3();uniforms.raceCutCount.value=volumes.length;
  volumes.forEach((b,i)=>{uniforms.raceCutA.value[i].set(b.cx,b.cz,b.tx,b.tz);uniforms.raceCutB.value[i].set(b.halfL,b.halfW,b.lower??b.minY,b.upper??b.maxY);uniforms.raceCutC.value[i].set(b.heightSlope??0,b.heightCenter??0);bounds.union(boundsFor(b));});
  uniforms.raceCutMin.value.copy(bounds.min);uniforms.raceCutMax.value.copy(bounds.max);root.visible=enabled.value===1&&!course.elevated;
 }
 function open(course=getRaceCourse(1)){
  scene.updateMatrixWorld(true);
  scene.traverse(object=>{
   if(!object.isMesh||excluded(object))return;
   box.setFromObject(object);if(!zones.some(zone=>zone.intersectsBox(box)))return;
   for(const material of [].concat(object.material??[]))patch(material);
   if(object.castShadow){
    if(!shadows.has(object))shadows.set(object,{depth:object.customDepthMaterial,distance:object.customDistanceMaterial});
    object.customDepthMaterial=object.customDepthMaterial??depth;patch(object.customDepthMaterial);
    object.customDistanceMaterial=object.customDistanceMaterial??distance;patch(object.customDistanceMaterial);
   }
  });
  enabled.value=1;select(course);
 }
 function close(){enabled.value=0;root.visible=false;for(const [object,old] of shadows){object.customDepthMaterial=old.depth;object.customDistanceMaterial=old.distance;}shadows.clear();}
 // Small grid meshes follow the gentle ramp heights without replacing the
 // existing dirt playground. Only the temporary lobby/rear apron gets a floor.
 for(const area of RACE_SURFACES){
  const nx=Math.ceil((area.maxX-area.minX)/1.5),nz=Math.ceil((area.maxZ-area.minZ)/1.5),vertices=[],indices=[];
  for(let z=0;z<=nz;z++)for(let x=0;x<=nx;x++){
   const px=area.minX+(area.maxX-area.minX)*x/nx,pz=area.minZ+(area.maxZ-area.minZ)*z/nz;
   vertices.push(px,groundHeight(px,pz)+.004,pz);
  }
  for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const i=z*(nx+1)+x;indices.push(i,i+nx+1,i+1,i+1,i+nx+1,i+nx+2);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=finishMaterial({name:'레이싱 연결 바닥',material:area.material==='soil'?'soil':'asphalt',color:area.material==='soil'?[.61,.52,.41]:[.31,.325,.32]});
  const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;root.add(mesh);
 }
 return {open,select,close,getState:()=>({open:enabled.value===1,courseId:currentCourse.id,temporarySurfaces:root.visible?RACE_SURFACES.length:0,cutZones:uniforms.raceCutCount.value,changedMaterials})};
}
