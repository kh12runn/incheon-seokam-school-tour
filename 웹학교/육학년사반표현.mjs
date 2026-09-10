import * as THREE from './외부도구/three.module.js';
import {createClass64PhotoFinish} from './육학년사반사진마감.mjs';
export function class64Details(){
  const group=new THREE.Group();group.name='6-4 교실 전용 세부';
  function panel(w,h,x,y,z,rotation,draw){
    const c=document.createElement('canvas');c.width=1536;c.height=Math.round(1536*h/w);const ctx=c.getContext('2d');draw(ctx,c.width,c.height);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));mesh.position.set(x,z,-y);mesh.rotation.y=rotation;group.add(mesh);return mesh;
  }
  panel(5.50,1.12,39.705,-3.52,12.18,-Math.PI/2,(c,w,h)=>{
    c.fillStyle='#dfe7dc';c.fillRect(0,0,w,h);c.fillStyle='#eed677';c.fillRect(0,0,w,26);
    for(let row=0;row<3;row++)for(let col=0;col<8;col++){
      const x=55+col*180,y=40+row*84;c.fillStyle='#343b3c';c.fillRect(x-5,y-4,106,77);c.fillStyle='#faf7ed';c.fillRect(x,y,96,69);
      for(let j=0;j<3;j++){c.fillStyle=['#bdcbb5','#e1c388','#b5c6d6'][(col+row+j)%3];c.beginPath();c.arc(x+19+j*28,y+22,9,0,Math.PI*2);c.fill();}
      c.strokeStyle='#b3bab6';for(let j=0;j<3;j++){c.beginPath();c.moveTo(x+12,y+40+j*8);c.lineTo(x+79,y+40+j*8);c.stroke();}
    }
  });
  panel(.57,1.08,30.265,-.61,11.92,Math.PI/2,(c,w,h)=>{c.fillStyle='#e8e4c5';c.fillRect(0,0,w,h);c.fillStyle='#567f61';c.font='bold 140px sans-serif';c.fillText('6-4',100,170);for(let i=0;i<4;i++){c.fillStyle=['#e2b5b0','#dfd48a','#b0c9da','#bbd0b4'][i];c.fillRect(100,300+i*420,w-200,320);}});
  // Round locker latches, kept as shared instanced geometry.
  const latch=new THREE.InstancedMesh(new THREE.CylinderGeometry(.044,.044,.013,16),new THREE.MeshStandardMaterial({color:'#474c49',metalness:.65,roughness:.3}),24);
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
  for(let row=0;row<3;row++)for(let col=0;col<8;col++)matrix.compose(new THREE.Vector3(39.26,10.2+.23+row*.35,6.36-col*.705-.34),q,new THREE.Vector3(1,1,1)),latch.setMatrixAt(row*8+col,matrix);
  latch.instanceMatrix.needsUpdate=true;group.add(latch);
  // Clock on the exterior-window wall.
  panel(.40,.40,32.65,-6.82,12.59,Math.PI,(c,w,h)=>{
    c.clearRect(0,0,w,h);c.fillStyle='#b39370';c.beginPath();c.arc(w/2,h/2,w*.48,0,Math.PI*2);c.fill();c.fillStyle='#eee8db';c.beginPath();c.arc(w/2,h/2,w*.43,0,Math.PI*2);c.fill();c.translate(w/2,h/2);c.strokeStyle='#5e625a';c.lineWidth=15;for(let i=0;i<12;i++){c.rotate(Math.PI/6);c.beginPath();c.moveTo(0,-w*.37);c.lineTo(0,-w*.32);c.stroke();}c.lineWidth=25;c.beginPath();c.moveTo(0,-w*.29);c.lineTo(0,0);c.lineTo(w*.20,w*.09);c.stroke();
  }).material.transparent=true;
  const white=new THREE.MeshStandardMaterial({color:'#dddcd2',roughness:.7});
  for(const x of [32.8,37.25]){
    const fan=new THREE.Group();fan.position.set(x,13.05,3.5);group.add(fan);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.22,12),white);stem.position.y=.10;fan.add(stem);
    const hub=new THREE.Mesh(new THREE.SphereGeometry(.09,16,10),white);hub.scale.y=.55;fan.add(hub);
    for(let i=0;i<4;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.36,.018,.12),white);blade.rotation.y=i*Math.PI/2;blade.position.set(Math.cos(i*Math.PI/2)*.19,0,Math.sin(i*Math.PI/2)*.19);fan.add(blade);}
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.39,.007,5,48),white);ring.rotation.x=Math.PI/2;ring.position.y=-.045;fan.add(ring);
  }
  const photos=createClass64PhotoFinish();group.add(photos.group);group.userData.photoFinish=photos;
  return group;
}
