import * as THREE from './외부도구/three.module.js';
export function meetingRoomDetails(config){
  const group=new THREE.Group();group.name='사진참고 운영위원회 회의실 의자';
  const green=new THREE.MeshStandardMaterial({color:'#a6b877',roughness:.65}),wood=new THREE.MeshStandardMaterial({color:'#514c40',roughness:.6});
  const sphere=new THREE.SphereGeometry(1,16,10),leg=new THREE.CylinderGeometry(.023,.033,.43,8);
  for(const c of config.chairs){
    const chair=new THREE.Group();chair.position.set(c.x,c.z,-c.y);chair.rotation.y=c.angle;
    const seat=new THREE.Mesh(sphere,green);seat.scale.set(.28,.052,.27);seat.position.y=.44;chair.add(seat);
    const back=new THREE.Mesh(sphere,green);back.scale.set(.285,.24,.052);back.position.set(0,.68,.22);back.rotation.x=-.12;chair.add(back);
    for(const x of [-.21,.21])for(const z of [-.19,.19]){const foot=new THREE.Mesh(leg,wood);foot.position.set(x,.215,z);foot.rotation.z=-x*.35;chair.add(foot);}
    group.add(chair);
  }
  group.userData.photoReference=config.reference;return group;
}
