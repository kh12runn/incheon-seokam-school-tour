import * as THREE from './외부도구/three.module.js';
export function createMissionVisual(){
 const root=new THREE.Group(),star=new THREE.Group(),gift=new THREE.Group(),pickup=new THREE.Group();root.add(pickup);pickup.add(star,gift);root.visible=false;
 const gold=new THREE.MeshStandardMaterial({color:'#ffcc48',roughness:.4,metalness:.25}),mint=new THREE.MeshStandardMaterial({color:'#68cdb1',roughness:.55}),ribbon=new THREE.MeshStandardMaterial({color:'#ffe5a0',roughness:.6});
 const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.19:.43,x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelThickness:.035,bevelSize:.025,bevelSegments:1,steps:1});geometry.translate(0,0,-.06);star.add(new THREE.Mesh(geometry,gold));
 const box=new THREE.Mesh(new THREE.BoxGeometry(.58,.52,.58),mint);gift.add(box);
 const lid=new THREE.Mesh(new THREE.BoxGeometry(.64,.09,.64),mint);lid.position.y=.29;gift.add(lid);
 gift.add(new THREE.Mesh(new THREE.BoxGeometry(.09,.63,.66),ribbon),new THREE.Mesh(new THREE.BoxGeometry(.66,.63,.09),ribbon));
 const marker=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(2.7,.10,5,32),new THREE.MeshBasicMaterial({color:'#ffd66d'}));ring.rotation.x=Math.PI/2;marker.add(ring);
 const beacon=new THREE.Mesh(new THREE.OctahedronGeometry(.48),gold);beacon.position.y=2.8;marker.add(beacon);root.add(marker);
 const carry=gift.clone();carry.name='운반 상자';carry.scale.setScalar(.52);carry.visible=false;
 // A single collectible, marker and shared-material carried parcel. No assets,
 // textures, lights or physics bodies added; all other scene geometry is reused.
 return {root,hide(){root.visible=false;carry.visible=false;},update(item,position,time,visible,state={},avatar,vehiclePhase='walking'){
  root.visible=visible&&state.active;pickup.visible=!!item&&Math.abs(position.z-item.z)<.8;
  if(pickup.visible){star.visible=item.kind==='별';gift.visible=!star.visible;pickup.position.set(item.x,item.z+.85+Math.sin(time*2)*.09,-item.y);pickup.rotation.y=time*.65;}
  const target=state.type==='drive'&&state.phase!=='pickup'?state.target:null;marker.visible=!!target;
  if(target){marker.position.set(target.x,target.z+.16,-target.y);ring.scale.setScalar(state.phase==='board'?.65:1);beacon.rotation.y=time;beacon.position.y=2.8+Math.sin(time*2)*.15;}
  const held=visible&&!!state.cargo&&vehiclePhase==='walking';avatar?.setCarrying(held);
  const anchor=avatar?.carryAnchor;if(anchor&&carry.parent!==anchor)anchor.add(carry);carry.visible=held;
 }};
}
