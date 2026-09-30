import * as THREE from './외부도구/three.module.js';
import {finishMaterial} from './현실재질.mjs';
const rounded=(w,h,r,depth)=>{
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:8});
};
export function grade5ResearchDetails(config){
  const group=new THREE.Group();group.name='5학년 연수실 사진 세부';group.userData.photoReference=config.reference;
  const black=new THREE.MeshStandardMaterial({color:'#29352e',roughness:.7}),steel=new THREE.MeshStandardMaterial({color:'#aab7af',metalness:.65,roughness:.38});
  const table=config.boxes.find(b=>b.renderInDetails),b=table.bounds,w=b[3]-b[0],d=b[4]-b[1],cx=(b[0]+b[3])/2,cy=-(b[1]+b[4])/2;
  for(const [width,depth,rise,height,mat] of [[w+.035,d+.035,.063,b[2]-.007,black],[w,d,.057,b[2]+.011,finishMaterial(table)]]){
    const mesh=new THREE.Mesh(rounded(width,depth,.65,rise),mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(cx,height,cy);group.add(mesh);
  }
  const glass=new THREE.Mesh(rounded(w-.06,d-.06,.62,.005),new THREE.MeshPhysicalMaterial({color:'#e1e7d9',transparent:true,opacity:.12,roughness:.13,clearcoat:1,depthWrite:false}));
  glass.rotation.x=-Math.PI/2;glass.position.set(cx,b[5]+.002,cy);group.add(glass);
  const seat=rounded(.52,.49,.09,.055),back=rounded(.51,.47,.07,.027);
  const rod=new THREE.CylinderGeometry(.018,.018,1,7);
  const tube=(root,a,b)=>{
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from),mesh=new THREE.Mesh(rod,steel);
    mesh.scale.y=delta.length();mesh.position.copy(from.add(to).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());root.add(mesh);
  };
  // Perforated chair backs: repeated small holes, without a private photo texture.
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#28342c';ctx.fillRect(0,0,128,128);
  ctx.fillStyle='#5b695e';for(let y=9;y<128;y+=12)for(let x=8;x<128;x+=12){ctx.beginPath();ctx.arc(x,y,2.7,0,Math.PI*2);ctx.fill();}
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
  const perforated=new THREE.MeshStandardMaterial({map,roughness:.88,side:THREE.DoubleSide});
  for(const chair of config.chairs){
    const root=new THREE.Group();root.position.set(chair.x,chair.z,-chair.y);root.rotation.y=chair.angle;group.add(root);
    const s=new THREE.Mesh(seat,black);s.rotation.x=-Math.PI/2;s.position.y=.42;root.add(s);
    const b=new THREE.Mesh(back,black);b.position.set(0,.74,.22);b.rotation.x=-.10;root.add(b);
    for(const z of [.215,.256]){const face=new THREE.Mesh(new THREE.PlaneGeometry(.45,.38),perforated);face.position.set(0,.75,z);face.rotation.x=-.10;root.add(face);}
    for(const x of [-.22,.22])for(const z of [-.22,.22])tube(root,[x,.03,z],[x,.44,z*.7]);
    for(const x of [-.22,.22]){tube(root,[x,.42,.15],[x,.94,.24]);tube(root,[x,.22,-.2],[x,.22,.2]);}
  }
  const calendar=new THREE.Mesh(new THREE.PlaneGeometry(.24,.21),new THREE.MeshStandardMaterial({color:'#e8e6d7',side:THREE.DoubleSide}));
  calendar.position.set(cx-.20,b[5]+.115,-(b[1]+3.17));calendar.rotation.x=-.20;group.add(calendar);
  return group;
}
