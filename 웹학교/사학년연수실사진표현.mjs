import * as THREE from './외부도구/three.module.js';
import {mergeGeometries} from './외부도구/BufferGeometryUtils.js';
// Code-native details: no source photographs, identifying documents or large maps.
export function grade4ResearchDetails(c){
 const root=new THREE.Group(),materials=new Map();root.name='4학년 연수실 사진 반영';
 const mat=(color,metal=false)=>{const key=color+metal;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:metal?.3:.58,metalness:metal?.65:0}));return materials.get(key);};
 const mesh=(parent,geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(p,w,h,d,x,y,z,color,metal=false)=>mesh(p,new THREE.BoxGeometry(w,h,d),mat(color,metal),x,y,z);
 const rod=(p,a,b,r=.016,color='#a7b2ad')=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),delta=v.clone().sub(u),o=mesh(p,new THREE.CylinderGeometry(r,r,delta.length(),8),mat(color,true));o.position.copy(u.add(v).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());};
 function rounded(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
 const roundedMesh=(parent,w,h,r,thick,material,x,y,z)=>mesh(parent,new THREE.ExtrudeGeometry(rounded(w,h,r),{depth:thick,bevelEnabled:false,curveSegments:5}),material,x,y,z);
 for(const q of c.chairs.filter(q=>q.grade4Chair)){
  const g=new THREE.Group();g.position.set(q.x,q.z,-q.y);g.rotation.y=q.angle;root.add(g);
  roundedMesh(g,.48,.45,.055,.045,mat(q.color),0,.44,0).rotation.x=-Math.PI/2;
  const rest=roundedMesh(g,.46,.36,.065,.028,mat(q.color),0,.73,.20);rest.rotation.x=-.09;
  // Fine horizontal bands suggest the photographed mesh without an alpha texture.
  if(!q.office)for(let i=0;i<8;i++)box(g,.38,.009,.005,0,.60+i*.032,.194,'#46514e');
  if(q.office){
   rod(g,[0,.07,0],[0,.44,0],.035);
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5,x=Math.sin(a)*.27,z=Math.cos(a)*.27;rod(g,[0,.13,0],[x,.08,z],.022,'#3c4543');const wheel=mesh(g,new THREE.CylinderGeometry(.046,.046,.046,8),mat('#303835'),x,.045,z);wheel.rotation.z=Math.PI/2;}
  }else for(const x of [-.20,.20]){
   rod(g,[x,.43,-.15],[x*1.10,.035,-.24]);rod(g,[x,.43,.15],[x*1.1,.035,.24]);rod(g,[x,.43,.14],[x,.86,.23],.013);
   for(const z of [-.24,.24])box(g,.044,.038,.052,x*1.1,.023,z,'#343f3b');
  }
  for(const x of [-.25,.25]){rod(g,[x,.43,.14],[x,.63,.14],.013);box(g,.045,.035,.30,x,.63,.025,'#303b37');}
  if(q.blanket){
   box(g,.42,.51,.018,0,.61,.248,'#d7d8c9');
   for(const x of [-.15,0,.15])box(g,.058,.51,.006,x,.61,.261,'#687e81');
   for(const y of [.42,.58,.74])box(g,.42,.056,.006,0,y,.265,'#687e81');
  }
 }
 for(const p of c.props.filter(p=>p.type.startsWith('grade4-'))){
  const g=new THREE.Group();g.position.set(p.x,p.z,-p.y);root.add(g);
  if(p.type==='grade4-table'){
   const w=p.w*p.sx,d=p.d*p.sy;
   roundedMesh(g,w+.025,d+.025,.20,.045,mat('#343c38'),0,-.018,0).rotation.x=-Math.PI/2;
   roundedMesh(g,w,d,.19,.025,mat('#c9b186'),0,.020,0).rotation.x=-Math.PI/2;
   const glass=new THREE.MeshPhysicalMaterial({color:'#d6e5e2',transparent:true,opacity:.14,roughness:.16,metalness:0,depthWrite:false,clearcoat:1,clearcoatRoughness:.12});
   roundedMesh(g,w-.01,d-.01,.185,.006,glass,0,.049,0).rotation.x=-Math.PI/2;
  }else if(p.type==='grade4-cup'||p.type==='grade4-kettle'){
   const kettle=p.type==='grade4-kettle',r=kettle?.10:p.tall?.058:.055,h=kettle?.22:p.tall?.23:.10;
   mesh(g,new THREE.CylinderGeometry(r,r*.88,h,14),mat(p.color??'#e4dfce'),0,h/2,0);
   mesh(g,new THREE.CylinderGeometry(r*.91,r*.91,.014,14),mat(p.tall?'#28332f':'#777e73'),0,h+.006,0);
   if(!p.tall){const handle=mesh(g,new THREE.TorusGeometry(r*.6,.011,6,12),mat(kettle?'#76614c':'#d7dace'),r*.95,h*.56,0);handle.scale.y=1.35;}
   if(kettle){rod(g,[-.06,.10,0],[-.18,.20,0],.017,'#d9ddd2');rod(g,[-.18,.20,0],[-.19,.24,0],.012,'#d9ddd2');}
  }else if(p.type==='grade4-tap'){
   rod(g,[0,0,0],[0,.25,0],.019);rod(g,[0,.25,0],[.19,.25,0],.019);rod(g,[.19,.25,0],[.19,.20,0],.019);
  }else if(p.type==='grade4-clock'){
   const ring=mesh(g,new THREE.CylinderGeometry(.19,.19,.035,24),mat('#725e49'));ring.rotation.x=Math.PI/2;
   const face=mesh(g,new THREE.CircleGeometry(.165,24),mat('#e7e7d9'),0,0,-.021);face.rotation.y=Math.PI;
   // The south wall face points north (negative render Z).
   for(let i=0;i<12;i++){const a=i*Math.PI/6;const tick=box(g,.010,.027,.004,Math.sin(a)*.14,Math.cos(a)*.14,-.025,'#4d5851');tick.rotation.z=-a;}
   box(g,.009,.12,.005,0,.052,-.029,'#46504a');const hand=box(g,.09,.010,.006,.035,0,-.030,'#46504a');hand.rotation.z=-.2;
  }else if(p.type==='grade4-fan'){
   g.rotation.y=-Math.PI/2;box(g,.40,.40,.055,0,0,0,'#a6b1a8');
   const disc=mesh(g,new THREE.CircleGeometry(.16,20),mat('#526b72'),0,0,.035);disc.material=disc.material.clone();disc.material.side=THREE.DoubleSide;
   for(let i=0;i<3;i++){const a=i*Math.PI*2/3,o=mesh(g,new THREE.SphereGeometry(1,8,5),mat('#758f92'),Math.sin(a)*.06,Math.cos(a)*.06,.043);o.scale.set(.045,.11,.01);o.rotation.z=-a;}
   for(let i=-3;i<=3;i++)box(g,.29,.007,.01,0,i*.039,.055,'#b0bcb3');
  }else if(p.type==='grade4-aircon'){
   box(g,1.12,.11,1.03,0,0,0,'#d7d8c7');box(g,.83,.012,.72,0,-.062,0,'#6e7a73');
   for(let i=0;i<17;i++)box(g,.012,.014,.72,-.39+i*.049,-.073,0,'#bac2b4');
   for(const x of [-.5,.5])box(g,.06,.02,.90,x,-.08,0,'#e0e2d6');
  }
 }
 // Bake static pieces into material groups. Photo detail adds few draw calls and no downloads.
 root.updateMatrixWorld(true);const buckets=new Map();
 root.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);const a=buckets.get(o.material)??[];a.push(geometry);buckets.set(o.material,a);});
 const originalGeometries=new Set();root.traverse(o=>{if(o.isMesh)originalGeometries.add(o.geometry);});root.clear();
 for(const [material,geometries]of buckets){const combined=mergeGeometries(geometries,false);root.add(new THREE.Mesh(combined,material));for(const g of geometries)g.dispose();}
 for(const g of originalGeometries)g.dispose();return root;
}
