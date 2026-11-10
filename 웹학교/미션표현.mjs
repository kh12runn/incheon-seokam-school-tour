import * as THREE from './외부도구/three.module.js';
export function createMissionVisual(){
 const root=new THREE.Group(),star=new THREE.Group(),gift=new THREE.Group();root.add(star,gift);root.visible=false;
 const gold=new THREE.MeshStandardMaterial({color:'#ffcc48',roughness:.4,metalness:.25}),mint=new THREE.MeshStandardMaterial({color:'#68cdb1',roughness:.55}),ribbon=new THREE.MeshStandardMaterial({color:'#ffe5a0',roughness:.6});
 const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.19:.43,x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelThickness:.035,bevelSize:.025,bevelSegments:1,steps:1});geometry.translate(0,0,-.06);star.add(new THREE.Mesh(geometry,gold));
 const box=new THREE.Mesh(new THREE.BoxGeometry(.58,.52,.58),mint);gift.add(box);
 const lid=new THREE.Mesh(new THREE.BoxGeometry(.64,.09,.64),mint);lid.position.y=.29;gift.add(lid);
 gift.add(new THREE.Mesh(new THREE.BoxGeometry(.09,.63,.66),ribbon),new THREE.Mesh(new THREE.BoxGeometry(.66,.63,.09),ribbon));
 // One tiny collectible; no new textures, lights, physics bodies or model files.
 return {root,update(item,position,time,visible){root.visible=!!item&&visible&&Math.abs(position.z-item.z)<.8;if(!root.visible)return;star.visible=item.kind==='별';gift.visible=!star.visible;root.position.set(item.x,item.z+.85+Math.sin(time*2)*.09,-item.y);root.rotation.y=time*.65;}};
}
