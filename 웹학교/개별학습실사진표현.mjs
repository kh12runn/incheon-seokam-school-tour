import * as THREE from './외부도구/three.module.js';
export function individualLearningDetails(config){
 const group=new THREE.Group();group.name=config.room.name+' 사진 참고 가구';group.userData.photoReference=config.reference;
 const green=new THREE.MeshStandardMaterial({color:'#a9c86b',roughness:.52}),chairGreen=new THREE.MeshStandardMaterial({color:'#8cae54',roughness:.62}),metal=new THREE.MeshStandardMaterial({color:'#adb9b0',metalness:.65,roughness:.38});
 const place=(obj,u,v,h)=>{const p=config.point(u,v,h);obj.position.set(p.x,p.z,-p.y);group.add(obj);return obj;};
 for(const t of config.tops){
  const w=t.w,d=t.d,s=new THREE.Shape();s.moveTo(-w/2+.05,-d/2);s.lineTo(w/2-.05,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+.05);s.lineTo(w*.38,d/2-.04);s.quadraticCurveTo(w*.37,d/2,w*.33,d/2);s.lineTo(-w*.33,d/2);s.quadraticCurveTo(-w*.37,d/2,-w*.38,d/2-.04);s.lineTo(-w/2,-d/2+.05);s.quadraticCurveTo(-w/2,-d/2,-w/2+.05,-d/2);
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2}),green);m.rotation.x=-Math.PI/2;place(m,t.u,t.v,.715);
 }
 const sphere=new THREE.SphereGeometry(1,12,8),rod=new THREE.CylinderGeometry(.022,.025,.43,7);
 for(const c of config.chairs){
  const root=new THREE.Group();place(root,c.u,c.v,0);root.rotation.y=c.angle;
  const seat=new THREE.Mesh(sphere,chairGreen);seat.scale.set(.26,.043,.25);seat.position.y=.44;root.add(seat);
  const back=new THREE.Mesh(sphere,chairGreen);back.scale.set(.26,.20,.035);back.position.set(0,.69,.21);root.add(back);
  for(const x of [-.21,.21])for(const z of [-.18,.18]){const leg=new THREE.Mesh(rod,metal);leg.position.set(x,.215,z);root.add(leg);}
 }
 for(const p of config.posters){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#edeadc';c.fillRect(0,0,128,128);
  if(p.kind==='landscape'){c.fillStyle='#aac7d0';c.fillRect(8,8,112,72);c.fillStyle='#8ca468';c.beginPath();c.moveTo(8,100);c.lineTo(35,40);c.lineTo(65,75);c.lineTo(90,45);c.lineTo(120,100);c.fill();}
  else for(let i=0;i<7;i++){c.fillStyle=['#d3958a','#d5c367','#82a99d','#97aec2'][i%4];c.beginPath();c.arc(64+Math.cos(i)*30,64+Math.sin(i)*30,13,0,7);c.fill();}
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(.43,.54),new THREE.MeshStandardMaterial({map}));place(m,p.u,p.v,p.h);m.rotation.y=p.side==='front'?0:p.side==='rear'?Math.PI:-Math.PI/2;
 }
 return group;
}
