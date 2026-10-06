import * as THREE from './외부도구/three.module.js';
import {mergeGeometries} from './외부도구/BufferGeometryUtils.js';
// Full-size ordinary steel-frame chairs and joined desk leaves. No source
// photograph, pupil name, document or face is uploaded as a texture.
export function magpieRoomDetails(c){
 const root=new THREE.Group(),mats=new Map();root.name='사진 참고 까치방 조합탁자와 의자';
 const mat=(color,metal=false)=>{const key=color+metal;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:metal?.27:.53,metalness:metal?.75:0}));return mats.get(key);};
 const mesh=(parent,geometry,material,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(parent,w,h,d,x,y,z,color,metal=false)=>mesh(parent,new THREE.BoxGeometry(w,h,d),mat(color,metal),x,y,z);
 const rod=(parent,a,b,r=.017,color='#a5b0a8')=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),delta=v.clone().sub(u),m=mesh(parent,new THREE.CylinderGeometry(r,r,delta.length(),8),mat(color,true));m.position.copy(u.add(v).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());};
 function rounded(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
 for(const chair of c.chairs.filter(q=>q.magpieStudent)){
  const g=new THREE.Group();g.position.set(chair.x,chair.z,-chair.y);g.rotation.y=chair.angle;root.add(g);
  const seat=mesh(g,new THREE.ExtrudeGeometry(rounded(.46,.44,.055),{depth:.035,bevelEnabled:false,curveSegments:5}),mat(chair.color),0,.43,0);seat.rotation.x=-Math.PI/2;
  const back=rounded(.44,.28,.045),hole=new THREE.Path();hole.absellipse(0,.065,.067,.022,0,Math.PI*2,true,0);back.holes.push(hole);
  const rest=mesh(g,new THREE.ExtrudeGeometry(back,{depth:.025,bevelEnabled:false,curveSegments:6}),mat(chair.color),0,.70,.20);rest.rotation.x=-.08;
  for(const x of [-.18,.18]){
   rod(g,[x,.44,-.15],[x*1.10,.04,-.19]);rod(g,[x,.44,.15],[x*1.10,.04,.21]);
   rod(g,[x,.42,.16],[x,.79,.22],.013);
   for(const z of [-.19,.21])box(g,.042,.035,.045,x*1.10,.025,z,'#313e38');
  }
  rod(g,[-.18,.405,-.15],[.18,.405,-.15]);rod(g,[-.18,.405,.15],[.18,.405,.15]);
 }
 const t=c.table,table=new THREE.Group();table.position.set(t.x,t.z,-t.y);root.add(table);
 for(const x of [-.4,.4])for(const v of [-t.halfBody/2,t.halfBody/2]){
  box(table,.796,.045,t.halfBody-.004,x,.0225,-v,t.color);
  for(const dx of [-.26,.26])rod(table,[x+dx,0,-v],[x+dx,-t.height+.03,-v],.021,'#7e8b83');
 }
 const cap=new THREE.Shape();cap.moveTo(-t.radius,0);cap.lineTo(t.radius,0);cap.absarc(0,0,t.radius,0,Math.PI,false);cap.closePath();
 const capGeometry=new THREE.ExtrudeGeometry(cap,{depth:.045,bevelEnabled:false,curveSegments:20});
 for(const end of [-1,1]){
  const piece=mesh(table,capGeometry,mat(t.color),0,0,-end*t.halfBody);piece.rotation.x=-Math.PI/2;if(end<0)piece.rotation.z=Math.PI;
  for(const x of [-.43,.43])rod(table,[x,0,-end*(t.halfBody+.24)],[x,-t.height+.03,-end*(t.halfBody+.24)],.021,'#7e8b83');
 }
 // Small clock/dartboard painted procedurally; no identifying image content.
 for(const p of c.props){
  const g=new THREE.Group();g.position.set(p.x,p.z,-p.y);g.rotation.y=-Math.PI/2;root.add(g);
  const dart=p.type==='magpieDart',radius=dart?.19:.145;
  mesh(g,new THREE.CylinderGeometry(radius,radius,.025,32),mat(dart?'#353d3b':'#c8b394')).rotation.x=Math.PI/2;
  if(dart){
   for(let n=0;n<16;n++){const a=n*Math.PI/8,shape=new THREE.Shape();shape.moveTo(0,0);shape.absarc(0,0,.165,a,a+Math.PI/8,false);shape.lineTo(0,0);mesh(g,new THREE.ShapeGeometry(shape),mat(n%2?'#bfc7bd':'#334047'),0,0,.018);}
   mesh(g,new THREE.CircleGeometry(.025,16),mat('#b54b3c'),0,0,.021);
  }else{
   mesh(g,new THREE.CircleGeometry(.12,24),mat('#ecebdc'),0,0,.018);
   for(let n=0;n<12;n++){const a=n*Math.PI/6,b=box(g,.009,.019,.007,Math.sin(a)*.101,Math.cos(a)*.101,.022,'#596558');b.rotation.z=-a;}
   box(g,.008,.075,.008,0,.032,.029,'#414e44');const hand=box(g,.052,.009,.008,.02,0,.029,'#414e44');hand.rotation.z=-.45;
  }
 }
 // Merge by shared material so detailed furniture adds only a few draw calls.
 root.updateMatrixWorld(true);const groups=new Map();
 root.traverse(o=>{if(!o.isMesh)return;if(!groups.has(o.material))groups.set(o.material,[]);const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);if(geometry.index){groups.get(o.material).push(geometry.toNonIndexed());geometry.dispose();}else groups.get(o.material).push(geometry);});
 const result=new THREE.Group();result.name=root.name;
 for(const [material,geometries] of groups){const combined=mergeGeometries(geometries,false);mesh(result,combined,material);for(const g of geometries)g.dispose();}
 const originals=new Set();root.traverse(o=>{if(o.isMesh)originals.add(o.geometry);});for(const g of originals)g.dispose();
 return result;
}
