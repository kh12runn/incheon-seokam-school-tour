import * as THREE from './외부도구/three.module.js';
import {BALL_RADIUS} from './축구공물리.mjs';
export function footballDetails(physics){
  const group=new THREE.Group();group.name='운동장 축구공';
  const ico=new THREE.IcosahedronGeometry(1,0),pos=ico.getAttribute('position'),vertices=[];
  for(let i=0;i<pos.count;i++){const p=new THREE.Vector3().fromBufferAttribute(pos,i).normalize();if(!vertices.some(v=>v.distanceTo(p)<.001))vertices.push(p);}
  const blackPanels=vertices.length;
  for(let i=0;i<pos.count;i+=3){const center=new THREE.Vector3();for(let j=0;j<3;j++)center.add(new THREE.Vector3().fromBufferAttribute(pos,i+j));vertices.push(center.normalize());}
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(512,256);
  for(let y=0;y<256;y++)for(let x=0;x<512;x++){
    const phi=x/512*Math.PI*2,theta=y/256*Math.PI,px=-Math.cos(phi)*Math.sin(theta),py=Math.cos(theta),pz=Math.sin(phi)*Math.sin(theta);
    let first=-2,second=-2,panel=0;
    vertices.forEach((v,i)=>{const dot=v.x*px+v.y*py+v.z*pz;if(dot>first){second=first;first=dot;panel=i;}else if(dot>second)second=dot;});
    const c=panel<blackPanels?32:first-second<.007?132:236,index=(y*512+x)*4;pixels.data.set([c,c+2,c,255],index);
  }
  ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshStandardMaterial({map:texture,roughness:.72}),geometry=new THREE.SphereGeometry(BALL_RADIUS,32,20),meshes=[];
  for(const b of physics.balls){const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);meshes.push(mesh);}
  const conversion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),q=new THREE.Quaternion();
  function update(){physics.balls.forEach((b,i)=>{meshes[i].position.set(b.position.x,b.position.z,-b.position.y);q.set(b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w);meshes[i].quaternion.copy(conversion).multiply(q);});}
  update();return {group,update};
}
