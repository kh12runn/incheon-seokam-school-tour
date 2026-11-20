import * as THREE from './외부도구/three.module.js';
import {mergeGeometries} from './외부도구/BufferGeometryUtils.js';

// Reference: https://flying-hoverboard-3dd.pages.dev/ (2026-11-20).
// Original lightweight geometry: 6 coaxial pairs, long central deck, four feet,
// white fairings/carbon frame and turquoise LEDs. No remote runtime dependency.
export const DRONE_DECK_HEIGHT=.94;
export function addDroneDetails(root,environment){
 const frame=new THREE.MeshStandardMaterial({color:'#242c32',metalness:.65,roughness:.28,envMap:environment});
 const shell=new THREE.MeshPhysicalMaterial({color:'#f2f5f5',metalness:.28,roughness:.25,clearcoat:1,envMap:environment});
 const metal=new THREE.MeshStandardMaterial({color:'#9daeb5',metalness:.85,roughness:.22,envMap:environment});
 const grip=new THREE.MeshStandardMaterial({color:'#182126',roughness:.83});
 const cyan=new THREE.MeshStandardMaterial({color:'#60eff2',emissive:'#1adbe5',emissiveIntensity:.65,roughness:.25});
 const red=new THREE.MeshStandardMaterial({color:'#ef5366',emissive:'#ff183a',emissiveIntensity:.45});
 const staticRoot=new THREE.Group();root.add(staticRoot);
 const unit=new THREE.BoxGeometry();
 function part(g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;staticRoot.add(o);return o;}
 function box(m,x,y,z,w,h,d){const o=part(unit,m,x,y,z);o.scale.set(w,h,d);return o;}
 function rod(a,b,r,m=frame){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),o=part(new THREE.CylinderGeometry(r,r,d.length(),8),m,...A.add(B).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
 const shape=new THREE.Shape();shape.moveTo(-.28,-.37);shape.quadraticCurveTo(-.28,-.51,-.14,-.51);shape.lineTo(.14,-.51);shape.quadraticCurveTo(.28,-.51,.28,-.37);shape.lineTo(.28,.37);shape.quadraticCurveTo(.28,.51,.14,.51);shape.lineTo(-.14,.51);shape.quadraticCurveTo(-.28,.51,-.28,.37);
 const deck=new THREE.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,curveSegments:12});deck.rotateX(-Math.PI/2);part(deck,shell,0,.79,0);
 box(frame,0,.67,0,.46,.27,.75);box(grip,0,.927,0,.52,.018,.96);
 for(const s of [-1,1]){
  box(cyan,s*.29,.855,0,.018,.026,.71);box(s<0?cyan:red,0,.855,s*.49,.34,.025,.018);
  box(frame,s*.16,.955,0,.15,.025,.30);
  const binding=part(new THREE.TorusGeometry(.062,.012,6,16,Math.PI),shell,s*.16,.96,-.07);binding.rotation.y=Math.PI/2;
  for(const z of [-.65,.65]){rod([s*.18,.61,z*.5],[s*.59,.045,z],.025);rod([s*.5,.58,z],[s*.59,.045,z],.014,metal);part(new THREE.CylinderGeometry(.085,.10,.035,12),grip,s*.59,.025,z);}
 }
 // Handheld flight controller aligned with the student's relaxed riding pose.
 rod([0,.90,-.40],[0,1.76,-.34],.019,metal);
 box(frame,0,1.80,-.33,.31,.075,.17);for(const s of [-1,1])part(new THREE.CylinderGeometry(.023,.023,.03,10),metal,s*.085,1.85,-.34);
 box(cyan,0,1.84,-.34,.065,.006,.046);
 const rotors=[];
 for(const x of [-.93,.93])for(const z of [-1.25,0,1.25]){
  rod([0,.60,z*.2],[x,.60,z],.039);rod([0,.64,z*.2],[x,.64,z],.009,cyan);
  part(new THREE.CylinderGeometry(.095,.095,.19,16),metal,x,.60,z);
  for(const y of [.46,.74]){part(new THREE.CylinderGeometry(.081,.081,.07,16),frame,x,y,z);part(new THREE.TorusGeometry(.083,.007,6,24),cyan,x,y+.018,z).rotation.x=Math.PI/2;rotors.push({x,y:y+(y>.6?.047:-.047),z,sign:(x*z>=0?1:-1)*(y>.6?1:-1)});}
  // Open inner/front access, protective arcs on the outer edge of each pair.
  const angle=x<0?Math.PI/2:-Math.PI/2;
  for(const y of [.40,.80]){const guard=part(new THREE.TorusGeometry(.575,.011,6,24,Math.PI),frame,x,y,z);guard.rotation.set(Math.PI/2,0,angle);}
  for(const zz of [-.57,.57])rod([x,.4,z+zz],[x,.8,z+zz],.008,metal);
 }
 staticRoot.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),batches=new Map(),oldGeometry=new Set();
 staticRoot.traverse(o=>{if(!o.isMesh)return;oldGeometry.add(o.geometry);const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(inverse.clone().multiply(o.matrixWorld));g.deleteAttribute('uv');if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);});
 staticRoot.clear();for(const [material,parts] of batches){const mesh=new THREE.Mesh(mergeGeometries(parts),material);mesh.castShadow=true;mesh.receiveShadow=true;staticRoot.add(mesh);parts.forEach(g=>g.dispose());}oldGeometry.forEach(g=>g.dispose());
 const blade=new THREE.BoxGeometry(1.05,.012,.055),blades=new THREE.InstancedMesh(blade,frame,12);blades.name='동축 프로펠러 12개';blades.instanceMatrix.setUsage(THREE.DynamicDrawUsage);blades.castShadow=false;root.add(blades);
 const dummy=new THREE.Object3D();root.userData.droneRotors={blades,rotors,dummy};root.userData.wheels=[];root.userData.door=new THREE.Group();root.add(root.userData.door);
 updateDroneDetails(root,0);
}
export function updateDroneDetails(root,time,running=false){
 const state=root.userData.droneRotors;if(!state)return;
 for(let i=0;i<state.rotors.length;i++){const r=state.rotors[i];state.dummy.position.set(r.x,r.y,r.z);state.dummy.rotation.y=time*(running?27:1.8)*r.sign+i*.8;state.dummy.updateMatrix();state.blades.setMatrixAt(i,state.dummy.matrix);}
 state.blades.instanceMatrix.needsUpdate=true;
 if(!state.blades.boundingSphere)state.blades.computeBoundingSphere();
}
