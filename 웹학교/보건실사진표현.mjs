import * as THREE from './외부도구/three.module.js';
export function nurseRoomDetails(config){
  const group=new THREE.Group();group.name='보건실 사진 참고 아치·안내판·대기의자';group.userData.photoReference=config.reference;
  const wood=new THREE.MeshStandardMaterial({color:'#97603d',roughness:.54}),turquoise=new THREE.MeshStandardMaterial({color:'#59a9a6',roughness:.8});
  for(const a of config.arches){
    const w=a.right-a.left,s=new THREE.Shape();s.moveTo(0,2.15);s.quadraticCurveTo(0,2.64,w/2,2.64);s.quadraticCurveTo(w,2.64,w,2.15);s.lineTo(w,2.76);s.lineTo(0,2.76);s.closePath();
    const arch=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.17,bevelEnabled:false,curveSegments:18}),wood);arch.position.set(59+a.left,0,a.v-.07);group.add(arch);
  }
  const cylinder=new THREE.CylinderGeometry(.23,.23,.21,20);
  for(const p of config.stools){
    const base=new THREE.Mesh(cylinder,turquoise);base.position.set(59+p.x,.13,p.v);group.add(base);
    const seat=new THREE.Mesh(cylinder,new THREE.MeshStandardMaterial({color:p.color,roughness:.83}));seat.position.set(59+p.x,.34,p.v);group.add(seat);
  }
  function board(text,w,h,pos,rotation=0,bg='#e1e9db'){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,512,384);c.strokeStyle='#946c42';c.lineWidth=18;c.strokeRect(9,9,494,366);c.fillStyle='#267775';c.fillRect(20,20,472,78);c.fillStyle='#fff';c.textAlign='center';c.font='bold 34px sans-serif';c.fillText(text,256,72);
    for(let i=0;i<3;i++){c.fillStyle=['#b8d3cd','#d8c9a8','#b9cbe0'][i];c.fillRect(34+i*151,120,137,230);c.fillStyle='#fff';c.beginPath();c.arc(102+i*151,182,35,0,Math.PI*2);c.fill();c.fillStyle='#507e77';for(let j=0;j<4;j++)c.fillRect(47+i*151,243+j*20,108,6);}
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map}));m.position.set(...pos);m.rotation.y=rotation;group.add(m);
  }
  board('건강하게 생활해요',1.65,1.3,[64.875,1.93,1.25],-Math.PI/2);
  board('안정실',.66,.26,[63.9,2.9,3.69],Math.PI,'#81baac');
  board('손 씻기 · 건강 안내',.77,1.4,[62.56,1.48,2.42],Math.PI);
  const quiltCanvas=document.createElement('canvas');quiltCanvas.width=256;quiltCanvas.height=256;const qc=quiltCanvas.getContext('2d');qc.fillStyle='#e3e4dc';qc.fillRect(0,0,256,256);qc.strokeStyle='#617c7e';qc.lineWidth=7;
  for(let row=0;row<5;row++){qc.beginPath();for(let col=0;col<9;col++){const x=col*32,y=row*58+(col%2)*25;col?qc.lineTo(x,y):qc.moveTo(x,y);}qc.stroke();}
  const quiltMap=new THREE.CanvasTexture(quiltCanvas);quiltMap.colorSpace=THREE.SRGBColorSpace;const quiltMaterial=new THREE.MeshStandardMaterial({map:quiltMap,roughness:.94});
  for(const b of config.beds){const quilt=new THREE.Mesh(new THREE.PlaneGeometry(.714,.70),quiltMaterial);quilt.rotation.x=-Math.PI/2;quilt.position.set(59+b.x,.842,5.575);group.add(quilt);}
  const clockCanvas=document.createElement('canvas');clockCanvas.width=128;clockCanvas.height=128;const cc=clockCanvas.getContext('2d');cc.fillStyle='#eeeede';cc.beginPath();cc.arc(64,64,59,0,7);cc.fill();cc.strokeStyle='#956541';cc.lineWidth=8;cc.stroke();cc.strokeStyle='#566660';cc.lineWidth=3;cc.beginPath();cc.moveTo(64,28);cc.lineTo(64,64);cc.lineTo(94,77);cc.stroke();
  const clockMap=new THREE.CanvasTexture(clockCanvas);clockMap.colorSpace=THREE.SRGBColorSpace;const clock=new THREE.Mesh(new THREE.PlaneGeometry(.37,.37),new THREE.MeshStandardMaterial({map:clockMap,transparent:true}));clock.position.set(62.1,2.65,.21);group.add(clock);
  // Small repeated tree motif is drawn, not a photograph containing personal data.
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#e3e5d9';c.fillRect(0,0,128,128);c.strokeStyle='#a8ac92';c.lineWidth=1;c.beginPath();c.moveTo(64,93);c.lineTo(64,43);c.stroke();
  for(let i=0;i<18;i++){const a=i*2.4,r=8+Math.sqrt(i)*6;c.fillStyle=i%2?'#b2b29a':'#c2c3b0';c.beginPath();c.ellipse(64+Math.cos(a)*r,49+Math.sin(a)*r,4,2,a,0,7);c.fill();}
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(7,3);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.8),new THREE.MeshStandardMaterial({map}));wall.position.set(59.105,1.99,1.3);wall.rotation.y=Math.PI/2;group.add(wall);
  return group;
}
