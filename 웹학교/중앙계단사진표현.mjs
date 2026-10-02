import * as THREE from './외부도구/three.module.js';
export function centralStairDetails(config){
  const group=new THREE.Group();group.name='행정실 맞은편 중앙계단 사진 마감';
  const p=a=>new THREE.Vector3(a[0],a[2],-a[1]);
  const metal=new THREE.MeshStandardMaterial({color:'#b8c2c3',metalness:.85,roughness:.24}),wood=new THREE.MeshStandardMaterial({color:'#8c6842',roughness:.4});
  const geometry=new THREE.CylinderGeometry(1,1,1,10),matrix=new THREE.Matrix4(),up=new THREE.Vector3(0,1,0);
  for(const [kind,material] of [['metal',metal],['wood',wood],['orange',new THREE.MeshStandardMaterial({color:'#df713c',roughness:.75})]]){
    const rods=config.rods.filter(r=>r.material===kind),mesh=new THREE.InstancedMesh(geometry,material,rods.length);
    rods.forEach((r,i)=>{const a=p(r.a),b=p(r.b),d=b.clone().sub(a),q=new THREE.Quaternion().setFromUnitVectors(up,d.clone().normalize());matrix.compose(a.add(b).multiplyScalar(.5),q,new THREE.Vector3(r.r,d.length(),r.r));mesh.setMatrixAt(i,matrix);});
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);
  }
  for(const color of new Set(config.panels.map(p=>p.color))){
    const vertices=[];for(const panel of config.panels.filter(p=>p.color===color))for(const i of [0,1,2,0,2,3])vertices.push(...p(panel.points[i]).toArray());
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.78,side:THREE.DoubleSide})));
  }
  for(const sign of config.signs){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#e5e6d5';ctx.fillRect(0,0,512,128);ctx.fillStyle='#35515a';ctx.font='bold 44px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillText(sign.text,256,81);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.85,.213),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));mesh.position.copy(p(sign.position));mesh.rotation.set(...sign.rotation);group.add(mesh);
  }
  if(config.artworks?.length){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#e9e7da';ctx.fillRect(0,0,512,320);
    const colors=['#618e9d','#d5b861','#a4b56d','#c28177','#aaa0bd'];
    for(let row=0;row<7;row++)for(let col=0;col<13;col++){const x=5+col*39,y=5+row*44;ctx.fillStyle=colors[(row*3+col)%5];ctx.fillRect(x,y,34,38);ctx.fillStyle='#f4edda';ctx.fillRect(x+3,y+3,28,32);ctx.fillStyle=colors[(row+col*2+1)%5];ctx.beginPath();ctx.arc(x+16,y+14,8,0,7);ctx.fill();ctx.fillRect(x+6,y+25,23,3);}
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshStandardMaterial({map,side:THREE.DoubleSide});
    for(const a of config.artworks){const m=new THREE.Mesh(new THREE.PlaneGeometry(a.width,a.height),material);m.position.copy(p(a.position));m.rotation.set(...a.rotation);group.add(m);}
  }
  group.userData.reference=config.reference;return group;
}
