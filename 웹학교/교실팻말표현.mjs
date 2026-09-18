import * as THREE from './외부도구/three.module.js';
import {classroomSignPoses} from './교실팻말.mjs';

// Code-native reconstruction of the provided green/ivory projecting plaque.
export function classroomSigns(data){
  const frameMaterial=new THREE.MeshStandardMaterial({color:'#dedfd3',roughness:.65});
  const metal=new THREE.MeshStandardMaterial({color:'#a6afa5',metalness:.55,roughness:.4});
  return classroomSignPoses(data).map(pose=>{
    const group=new THREE.Group();group.name=pose.text+' 복도 양면 돌출 팻말';
    const {point,width,height,angle}=pose;
    group.position.set(point.x,point.z,-point.y);
    const board=new THREE.Mesh(new THREE.BoxGeometry(width+.018,height+.018,.028),frameMaterial);
    board.rotation.y=angle;group.add(board);
    const c=document.createElement('canvas');c.width=256;c.height=288;const ctx=c.getContext('2d');ctx.scale(.5,.5);
    ctx.fillStyle='#f0f0dc';ctx.fillRect(0,0,512,576);
    ctx.fillStyle='#3d783f';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(512,0);ctx.lineTo(512,72);ctx.quadraticCurveTo(270,25,0,205);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ebf0da';ctx.font='bold 23px "Malgun Gothic",sans-serif';ctx.fillText('인천석암초등학교',24,40);
    ctx.fillStyle='#728b50';ctx.beginPath();ctx.arc(439,121,30,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d5be68';ctx.beginPath();ctx.arc(439,121,18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#183e32';ctx.font=`bold ${pose.text.length>5?88:174}px "Malgun Gothic",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(pose.text,256,343,470);
    ctx.strokeStyle='#cad3bc';ctx.lineWidth=3;ctx.strokeRect(7,7,498,562);
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
    const material=new THREE.MeshStandardMaterial({map,roughness:.8});
    for(const direction of [1,-1]){
      const face=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
      face.rotation.y=angle+(direction<0?Math.PI:0);
      face.position.set(Math.sin(angle)*.015*direction,0,Math.cos(angle)*.015*direction);
      face.name=direction>0?'정방향 표기':'역방향 표기';group.add(face);
    }
    // Mounts join the plaque to the wall beside (not across) the door opening.
    const dx=pose.wall.x-point.x,dz=-pose.wall.y+point.y;
    const distance=Math.hypot(dx,dz),gap=Math.max(.02,distance-width/2);
    for(const h of [-.17,.17]){
      const arm=new THREE.Mesh(new THREE.BoxGeometry(Math.abs(dx/distance)*gap+.02,.025,Math.abs(dz/distance)*gap+.02),metal);
      arm.position.set(dx/distance*(width/2+gap/2),h,dz/distance*(width/2+gap/2));group.add(arm);
    }
    group.userData.sign=pose;
    return {mesh:group,floor:pose.floor,name:group.name};
  });
}
