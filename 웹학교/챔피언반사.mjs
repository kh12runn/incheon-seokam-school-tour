import * as THREE from './외부도구/three.module.js';

// Baked from the actual campus at the garage: sharp school windows, trees and
// autumn sky, shared by parked/preview/race cars. No per-frame cube rendering.
let reflection=null,loading=false;
const materials=new Set();
export function applyChampionReflection(material){
  if(reflection){material.envMap=reflection;material.needsUpdate=true;return;}
  materials.add(material);
  const release=()=>{materials.delete(material);material.removeEventListener('dispose',release);};
  material.addEventListener('dispose',release);
  if(loading)return;
  loading=true;
  new THREE.TextureLoader().load(new URL('./차량재질/챔피언-학교반사.webp',import.meta.url).href,texture=>{
    texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;
    texture.userData.sharedVehicleEnvironment=true;texture.name='학교 풍경 차량 반사';reflection=texture;
    for(const m of materials){m.envMap=texture;m.needsUpdate=true;}
    materials.clear();
  },undefined,()=>{loading=false;materials.clear();});
}
