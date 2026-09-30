import * as THREE from './외부도구/three.module.js';
import {exteriorClassSigns} from './교사자리와창팻말.mjs';
export function teacherChairDetails(poses){
  const root=new THREE.Group();root.name='일반교실 둥근 바퀴 사무의자';
  const dark=new THREE.MeshStandardMaterial({color:'#333d40',roughness:.76}),metal=new THREE.MeshStandardMaterial({color:'#9ca9a9',metalness:.7,roughness:.37});
  const sphere=new THREE.SphereGeometry(1,14,10),stem=new THREE.CylinderGeometry(.024,.032,1,8),wheel=new THREE.CylinderGeometry(.045,.045,.033,10),bar=new THREE.BoxGeometry(1,1,1);
  for(const p of poses){const chair=new THREE.Group();chair.position.set(p.x,p.z,-p.y);chair.rotation.y=p.angle;chair.name=p.roomId+' 교사 사무의자';root.add(chair);
    const mesh=(g,m,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);chair.add(o);return o;};
    mesh(sphere,dark,0,.45,0,.23,.055,.22);mesh(sphere,dark,0,.76,.175,.225,.27,.06);
    mesh(stem,metal,0,.26,0,1,.32,1);
    for(const x of [-.225,.225]){mesh(bar,dark,x,.625,0,.035,.035,.29);mesh(stem,dark,x,.53,.10,.65,.18,.65);}
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5,x=Math.sin(a),z=Math.cos(a);const foot=mesh(bar,metal,x*.12,.115,z*.12,.035,.027,.25);foot.rotation.y=a;const w=mesh(wheel,dark,x*.235,.058,z*.235,1,1,1);w.rotation.z=Math.PI/2;w.rotation.y=a;}
  }
  // Batch shared shapes without reducing geometry or texture quality.
  root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(o.isMesh){const key=o.geometry.uuid+o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}});
  for(const items of groups.values()){const m=new THREE.InstancedMesh(items[0].geometry,items[0].material,items.length);items.forEach((o,i)=>m.setMatrixAt(i,o.matrixWorld));m.computeBoundingSphere();root.add(m);items.forEach(o=>o.removeFromParent());}
  return root;
}
export function classroomWindowSigns(data){
  const root=new THREE.Group();root.name='운동장 쪽 남색 타원 학급 팻말';const geometry=new THREE.PlaneGeometry(1.02,.36);
  for(const p of exteriorClassSigns(data)){
    const c=document.createElement('canvas');c.width=512;c.height=180;const ctx=c.getContext('2d');
    ctx.fillStyle='#162f55';ctx.beginPath();ctx.ellipse(256,90,251,86,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff';ctx.font='bold 99px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.text,256,94,436);
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
    const material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.1,depthWrite:false});const m=new THREE.Mesh(geometry,material);m.name=p.text+' 창문 팻말';m.position.set(p.x,p.z,-p.y);m.rotation.y=p.angle;root.add(m);
  }return root;
}
