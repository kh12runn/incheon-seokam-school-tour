import * as THREE from './외부도구/three.module.js';
export function recyclingShelterDetails(config){
 const group=new THREE.Group();group.name='후문 분리수거장 안내표';
 const vertices=[],section=t=>new THREE.Vector3(0,2.06+.32*Math.sin(t*Math.PI*.85),-(3.22+t*2.72));
 for(let i=0;i<18;i++){const a=section(i/18),b=section((i+1)/18);for(const p of [[25.85,a],[33.5,a],[33.5,b],[25.85,a],[33.5,b],[25.85,b]])vertices.push(p[0],p[1].y,p[1].z);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#388c8a',roughness:.35,transparent:true,opacity:.78,side:THREE.DoubleSide})));
 const rimMaterial=new THREE.MeshStandardMaterial({color:'#aebbb0',metalness:.65,roughness:.35});
 for(const x of [25.85,29.65,33.5]){const points=Array.from({length:19},(_,i)=>{const p=section(i/18);p.x=x;return p;});group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),18,.025,6,false),rimMaterial));}
 for(const label of config.labels){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle=label.color;ctx.fillRect(0,0,256,64);ctx.fillStyle='#fff';ctx.font='bold 33px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillText(label.text,128,44);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(label.width,label.height),new THREE.MeshStandardMaterial({map,side:THREE.DoubleSide}));mesh.position.set(label.x,label.z,-label.y);mesh.rotation.y=Math.PI;group.add(mesh);
 }
 const p=config.pose;
 group.applyMatrix4(new THREE.Matrix4().set(0,0,1,p.offsetX,0,1,0,0,-p.lengthScale,0,0,p.sourceX*p.lengthScale-p.offsetY,0,0,0,1));
 return group;
}
