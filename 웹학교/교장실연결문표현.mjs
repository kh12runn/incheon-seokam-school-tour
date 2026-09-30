import * as THREE from './외부도구/three.module.js';
import {OFFICE_DOOR as d} from './교장실연결문.mjs';
export function officeConnectingDoor(controller){
  const root=new THREE.Group();root.name='교장실 ↔ 운영위원회 회의실 여닫이문';root.position.set(d.x,d.z,-d.y);
  const wood=new THREE.MeshStandardMaterial({color:'#b79870',roughness:.68}),metal=new THREE.MeshStandardMaterial({color:'#b4c0ba',metalness:.8,roughness:.3});
  const box=new THREE.BoxGeometry(1,1,1),part=(parent,x,y,z,w,h,l,mat)=>{const m=new THREE.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,l);parent.add(m);return m;};
  for(const z of [-.055,d.width+.055])part(root,0,1.13,z,.29,2.26,.06,wood);part(root,0,2.23,d.width/2,.29,.075,d.width+.17,wood);
  const hinge=new THREE.Group();root.add(hinge);part(hinge,0,d.height/2,d.width/2,.046,d.height,d.width,wood);
  for(const x of [-.049,.049]){part(hinge,x,1.01,d.width-.14,.065,.045,.17,metal);part(hinge,x,1.02,d.width-.18,.02,.18,.055,metal);}
  for(const h of [.28,1.04,1.87])part(hinge,0,h,.02,.07,.12,.05,metal);
  root.userData.update=()=>{hinge.rotation.y=-controller.angle;};return root;
}
