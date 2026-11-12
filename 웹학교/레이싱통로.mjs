import * as THREE from './외부도구/three.module.js';
import {finishMaterial} from './현실재질.mjs';
import {RACE_CUT_ZONES,RACE_SURFACES,groundHeight} from './레이싱코스.mjs';

const number=value=>Number(value).toFixed(4);
const vector=(x,y,z)=>`vec3(${number(x)},${number(y)},${number(z)})`;
const cutTests=RACE_CUT_ZONES.map(b=>`(all(greaterThan(vRaceCutPoint,${vector(b.minX,b.minY,b.minZ)}))&&all(lessThan(vRaceCutPoint,${vector(b.maxX,b.maxY,b.maxZ)})))`).join('||');
// Keep every original mesh and collider. A race-only visual opening is switched
// off atomically on exit; race physics uses its own boundaries and checkpoints.
export function patchPassageShader(shader,enabled){
 shader.uniforms.racePassageOpen=enabled;
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
 shader.fragmentShader='varying vec3 vRaceCutPoint;\nuniform float racePassageOpen;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('void main() {',`void main() {\nif(racePassageOpen>.5&&(${cutTests}))discard;`);
}

export function createRacePassages(scene){
 const root=new THREE.Group();root.name='레이싱 임시 연결 통로';root.visible=false;root.userData.raceOnly=true;scene.add(root);
 const enabled={value:0},patched=new WeakSet(),shadows=new Map();
 const zones=RACE_CUT_ZONES.map(b=>new THREE.Box3(new THREE.Vector3(b.minX,b.minY,b.minZ),new THREE.Vector3(b.maxX,b.maxY,b.maxZ)));
 const box=new THREE.Box3();let changedMaterials=0;
 function patch(material){
  if(!material||patched.has(material)||material.isShaderMaterial)return;
  const before=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){before.call(this,shader,renderer);patchPassageShader(shader,enabled);};
  material.customProgramCacheKey=()=>cacheKey+'|central-race-passages-v1';material.needsUpdate=true;
  patched.add(material);changedMaterials++;
 }
 const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});patch(depth);
 const distance=new THREE.MeshDistanceMaterial();patch(distance);
 function excluded(object){for(let p=object;p;p=p.parent)if(p.userData.raceOnly||p.name==='운동장 가상 레이싱 트랙')return true;return false;}
 function open(){
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
  enabled.value=1;root.visible=true;
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
 return {open,close,getState:()=>({open:enabled.value===1,temporarySurfaces:RACE_SURFACES.length,cutZones:RACE_CUT_ZONES.length,changedMaterials})};
}
