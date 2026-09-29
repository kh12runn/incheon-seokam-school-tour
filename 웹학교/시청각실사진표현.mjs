import * as THREE from './외부도구/three.module.js';
export function audioRoomDetails(config){
  const group=new THREE.Group();group.name='사진참고 시청각실 빨간 객석';
  const red=new THREE.MeshStandardMaterial({color:'#86464f',roughness:.96}),ivory=new THREE.MeshStandardMaterial({color:'#d2d0bc',roughness:.6}),metal=new THREE.MeshStandardMaterial({color:'#b7bcac',metalness:.5,roughness:.32}),wood=new THREE.MeshStandardMaterial({color:'#a78e69',roughness:.58});
  const rounded=(w,h,d,r)=>{const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,steps:1,curveSegments:5});g.translate(0,0,-d/2);return g;};
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
  const part=(name,geo,mat,dx,dy,dz,rotation=0)=>{
    const mesh=new THREE.InstancedMesh(geo,mat,config.seats.length);mesh.name=name;
    config.seats.forEach((s,i)=>{q.setFromAxisAngle(new THREE.Vector3(1,0,0),rotation);matrix.compose(new THREE.Vector3(s.x+dx,s.z+dy,-s.y+dz),q,new THREE.Vector3(1,1,1));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);
  };
  part('빨간 둥근 등받이',rounded(.49,.58,.11,.13),red,0,.76,.19,-.10);
  part('아이보리 등받이 뒷판',rounded(.475,.60,.042,.09),ivory,0,.73,.271,-.10);
  part('빨간 좌판',rounded(.48,.47,.09,.06),red,0,.45,-.075,-Math.PI/2);
  for(const x of [-.284,.284]){
    part('흰 객석 측판',new THREE.BoxGeometry(.045,.39,.45),ivory,x,.27,-.005);
    part('목재 팔걸이',new THREE.BoxGeometry(.067,.04,.43),wood,x,.55,-.015);
    part('객석 고정발',new THREE.BoxGeometry(.10,.03,.48),metal,x,.025,-.005);
  }
  const skin=new THREE.MeshStandardMaterial({color:'#d3c7a4',roughness:.82}),body=new THREE.MeshStandardMaterial({color:'#6b5537',roughness:.5}),rope=new THREE.MeshStandardMaterial({color:'#c2b796',roughness:.85});
  for(const drum of config.drums){
    const root=new THREE.Group();root.position.set(drum.x,drum.z+.30,-drum.y);root.rotation.z=Math.PI/2;
    for(const sign of [-1,1]){
      const shell=new THREE.Mesh(new THREE.CylinderGeometry(sign>0?.27:.12,sign>0?.12:.27,.28,12),body);shell.position.y=sign*.14;root.add(shell);
      const end=new THREE.Mesh(new THREE.CylinderGeometry(.275,.275,.025,16),skin);end.position.y=sign*.285;root.add(end);
    }
    for(let i=0;i<10;i++){const a=i*Math.PI/5,line=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.57,5),rope);line.position.set(Math.cos(a)*.253,0,Math.sin(a)*.253);root.add(line);}
    group.add(root);
  }
  group.userData.photoReference=config.reference;return group;
}
