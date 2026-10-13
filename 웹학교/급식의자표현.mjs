import * as THREE from './외부도구/three.module.js';
// Repeated moulded seats use shared geometry and instancing (48 chairs, 3 draws).
export function cafeteriaChairs(chairs){
 const root=new THREE.Group(),matrix=new THREE.Matrix4(),local=new THREE.Matrix4(),world=new THREE.Matrix4(),quat=new THREE.Quaternion(),parts=new Map();
 const round=new THREE.SphereGeometry(1,12,8),cube=new THREE.BoxGeometry(1,1,1);
 const plastic=new THREE.MeshStandardMaterial({color:'#dc8c1c',roughness:.42}),steel=new THREE.MeshStandardMaterial({color:'#bdc8c8',roughness:.3,metalness:.65}),rubber=new THREE.MeshStandardMaterial({color:'#303735',roughness:.8});
 const add=(key,geo,mat,position,scale)=>{
  if(!parts.has(key))parts.set(key,{geo,mat,matrices:[]});
  local.compose(new THREE.Vector3(...position),new THREE.Quaternion(),new THREE.Vector3(...scale));
  parts.get(key).matrices.push(matrix.clone().multiply(local));
 };
 for(const q of chairs){
  quat.setFromAxisAngle(new THREE.Vector3(0,1,0),q.angle);matrix.compose(new THREE.Vector3(q.x,q.z,-q.y),quat,new THREE.Vector3(1,1,1));
  add('plastic',round,plastic,[0,.43,0],[.24,.045,.23]);
  // Three oval sections leave the photographed hand-grip opening in the back.
  add('plastic',round,plastic,[0,.62,.20],[.235,.095,.047]);
  add('plastic',round,plastic,[0,.79,.22],[.225,.035,.045]);
  for(const x of [-.185,.185])add('plastic',round,plastic,[x,.725,.21],[.055,.09,.045]);
  for(const x of [-.18,.18])for(const z of [-.16,.16]){
   add('steel',cube,steel,[x,.23,z],[.037,.41,.037]);
   add('rubber',round,rubber,[x,.025,z],[.036,.025,.042]);
  }
 }
 for(const [name,p] of parts){const mesh=new THREE.InstancedMesh(p.geo,p.mat,p.matrices.length);mesh.name='급식실 '+name;for(let i=0;i<p.matrices.length;i++){world.copy(p.matrices[i]);mesh.setMatrixAt(i,world);}mesh.computeBoundingSphere();root.add(mesh);}
 return root;
}
