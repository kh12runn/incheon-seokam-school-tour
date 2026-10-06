import * as THREE from './외부도구/three.module.js';
import {mergeGeometries} from './외부도구/BufferGeometryUtils.js';
import {finishMaterial} from './현실재질.mjs';
import {ROSTRUM as R} from './구령대배치.mjs';

// Photo-observed architecture rebuilt with curved meshes and shared materials.
// No source photos, people, licence plates or document scans are published.
export function campusEntranceDetails(boxes=[]){
 const root=new THREE.Group();root.name='정문 후문 구령대 입체 마감';
 const batches=new Map(),materials=new Map(),vec=(x,y,z)=>new THREE.Vector3(x,z,-y);
 const material=(color,kind='paint')=>{
  const key=color+'|'+kind;
  if(!materials.has(key)){
   const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);
   const m=finishMaterial({name:'야외 입체 마감',color:rgb,material:kind});
   if(kind==='metal'){m.roughness=.26;m.metalness=.82;m.envMapIntensity=1.1;}
   materials.set(key,m);
  }
  return materials.get(key);
 };
 function put(geo,x,y,z,color,kind='paint',q=new THREE.Quaternion()){
  geo.applyMatrix4(new THREE.Matrix4().compose(vec(x,y,z),q,new THREE.Vector3(1,1,1)));
  if(geo.index){const original=geo;geo=geo.toNonIndexed();original.dispose();}
  for(const attr of Object.keys(geo.attributes))if(!['position','normal'].includes(attr))geo.deleteAttribute(attr);
  const key=color+'|'+kind;if(!batches.has(key))batches.set(key,{geos:[],color,kind});batches.get(key).geos.push(geo);
 }
 function box(a,color,kind='paint'){put(new THREE.BoxGeometry(a[3]-a[0],a[5]-a[2],a[4]-a[1]),(a[0]+a[3])/2,(a[1]+a[4])/2,(a[2]+a[5])/2,color,kind);}
 function tube(a,b,r=.025,color='#aeb8b8',kind='metal',r2=r){
  const p=vec(...a),end=vec(...b),d=end.clone().sub(p),mid=p.clone().add(end).multiplyScalar(.5);
  put(new THREE.CylinderGeometry(r2,r,d.length(),10),mid.x,-mid.z,mid.y,color,kind,new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));
 }
 function sign(text,x,y,z,w,h,bg='#ebca62',fg='#273e46',normal='south'){
  const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,768,192);
  ctx.strokeStyle=fg;ctx.lineWidth=4;ctx.strokeRect(8,8,752,176);ctx.fillStyle=fg;ctx.font='bold 70px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,96,710);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  const m=new THREE.MeshStandardMaterial({map:t,roughness:.85,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);mesh.name=text;mesh.position.copy(vec(x,y,z));if(normal==='east')mesh.rotation.y=Math.PI/2;if(normal==='ground')mesh.rotation.x=-Math.PI/2;root.add(mesh);
 }
 function curvedStrip(x0,x1,profile,color,kind='paint'){
  const pos=[];
  for(let i=0;i<profile.length-1;i++){
   const [y,z]=profile[i],[Y,Z]=profile[i+1],a=[x0,z,-y],b=[x1,z,-y],c=[x1,Z,-Y],d=[x0,Z,-Y];
   for(const v of [a,b,c,a,c,d,c,b,a,d,c,a])pos.push(...v);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();put(g,0,0,0,color,kind);
 }
 function arch(x,y,base,w,h,depth,color,kind='storage_concrete'){
  const s=new THREE.Shape(),radius=w/2;s.moveTo(-radius,0);s.lineTo(radius,0);s.lineTo(radius,h-radius);s.absarc(0,h-radius,radius,0,Math.PI,false);s.lineTo(-radius,0);
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.015,bevelThickness:.012,curveSegments:14});
  put(g,x,y,base,color,kind,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2));
 }
 function booth(x,y,z,w,d,front){
  const frame='#aab0ad',body=front?'#728966':'#b7b9b4',glazing='#53696b';
  box([x,y,z,x+w,y+d,z+2.52],body,'storage_concrete');
  box([x-.13,y-.16,z+2.52,x+w+.13,y+d+.12,z+2.63],'#555f62','metal');
  box([x+.13,y-.024,z+.86,x+w-.13,y-.01,z+2.18],frame,'metal');
  box([x+.19,y-.04,z+.93,x+w-.19,y-.03,z+2.12],glazing,'glass');
  for(const a of [x+w/3,x+w*2/3])box([a-.021,y-.06,z+.88,a+.021,y-.04,z+2.16],'#d0d2ca','metal');
  box([x+.08,y-.14,z+.82,x+w-.08,y+.05,z+.87],frame,'metal');
  // Glazed side door faces the vehicle lane / pedestrian approach.
  box([x+w+.005,y+.38,z+.06,x+w+.025,y+d-.3,z+2.25],frame,'metal');
  box([x+w+.028,y+.45,z+.86,x+w+.036,y+d-.38,z+2.17],glazing,'glass');
  tube([x+w+.07,y+d-.48,z+.78],[x+w+.07,y+d-.48,z+1.14],.018);
  for(let h=.38;h<2.5;h+=.4)box([x,y-.006,z+h,x+w,y,z+h+.012],'#939c98','paint');
  sign(front?'정문 · 배움터 지킴이':'365일 Safe 석암',x+w/2,y-.17,z+2.37,w+.20,.40);
  sign('방문 안내',x+w/2,y-.05,z+.48,w*.77,.42,'#e0e2d9','#425962');
  sign(front?'정문':'후문',x+w+.04,y+d/2,z+1.6,1,.40,'#164955','#edf0e6','east');
 }
 // Front: old low road level is retained; garden/blue uphill route stays open.
 booth(-22.5,-10.45,-3.4,3.5,3.05,true);
 for(const y of [-16.7,-11]){
  box([-18.25,y,-3.4,-17.55,y+.7,-1.05],'#a9aaa1','storage_concrete');
  box([-18.32,y-.065,-1.05,-17.48,y+.765,-.94],'#babcb2','storage_concrete');
  for(let z=-3;z<-1.1;z+=.36)box([-18.26,y-.009,z,-17.54,y+.709,z+.012],'#727c77');
  // Folded steel gate follows the approach edge, not across the route.
  for(const z of [-3.2,-1.59])tube([-21.1,y+.35,z],[-18.3,y+.35,z],.036,'#44645d');
  for(let x=-21.05;x<-18.3;x+=.22)tube([x,y+.35,-3.17],[x,y+.35,-1.59],.021,'#44645d');
 }
 sign('인천석암초등학교',-18.28,-10.65,-2.16,.55,1.52,'#424c49','#e8e4d5','east');
 // Rear entrance has grey security booth, arched masonry posts, steel leaves,
 // a raised barrier and visible warm-coloured footway to distinguish the gate.
 booth(-20.6,19,-.6,3.4,2.4,false);
 for(const y of [11.39,18.59]){
  arch(-21.1,y,-.6,.76,2.25,.65,'#a9aaa1');
  for(const x of [-21.12,-20.43]){
   arch(x,y,-.55,.52,1.92,.016,'#384643','metal');
   arch(x-.013,y,-.51,.40,1.76,.013,'#79847b','metal');
   arch(x-.026,y,-.48,.32,1.61,.012,'#2b3c3c','glass');
  }
  tube([-21.15,y-.25,-.6],[-21.15,y-.25,.9],.021);
  tube([-21.15,y+.25,-.6],[-21.15,y+.25,.9],.021);
 }
 sign('후문 · 차량 출입구',-20.42,18.59,.36,.49,1.27,'#273c3e','#deddd1','east');
 box([-23.2,11.05,-.588,-21.6,21.5,-.574],'#985c52','rubber_mat');
 for(let y=11.1;y<21.5;y+=.3)box([-23.15,y,-.572,-21.62,y+.008,-.568],'#c0a998');
 for(const [x,y,z] of [[-18.83,12.17,-.6],[-18.83,17.97,-.6]]){
  tube([x,y,z],[x,y,z+.83],.067,'#c4613c','paint',.06);
  for(const h of [.25,.55])tube([x,y,z+h],[x,y,z+h+.11],.069,'#e5e1d5','paint');
  box([x-.13,y-.13,z,x+.13,y+.13,z+.025],'#505b56','metal');
 }
 // Information plaques do not reproduce private notices from source photos.
 sign('후문 주차장',-18.86,18.80,.99,2.65,.23,'#314a50','#edead7');
 // More articulated front noticeboard, umbrella and safety cones.
 const board=boxes.find(b=>b.name==='정문 사진 게시판 흰 면');
 if(board)sign('학교 소식',-6,-20.905,board.bounds[5]-.16,1.84,.25,'#426b66','#f1eee2');
 const cloth=boxes.find(b=>b.name==='정문 사진 접힌 파라솔 천');
 if(cloth){
  const a=cloth.bounds,x=(a[0]+a[3])/2,y=(a[1]+a[4])/2;
  const radius=[.18,.25,.14,.22,.16,.12,.065,.025];
  for(let i=0;i<radius.length-1;i++)tube([x,y,a[2]+i*(a[5]-a[2])/7],[x,y,a[2]+(i+1)*(a[5]-a[2])/7],radius[i],'#3b5c52','staff_fabric',radius[i+1]);
  tube([x,y,a[2]+.75],[x,y,a[2]+.80],.157,'#243d35','staff_fabric');
 }
 for(const footing of boxes.filter(b=>b.name.startsWith('정문 사진 안전콘 받침 '))){
  const q=footing.bounds,x=(q[0]+q[3])/2,y=(q[1]+q[4])/2,z=q[2];
  box([x-.22,y-.22,z,x+.22,y+.22,z+.045],'#414b45','rubber_mat');
  tube([x,y,z+.04],[x,y,z+.76],.17,'#c86a37','paint',.028);
  tube([x,y,z+.4],[x,y,z+.53],.097,'#e5dfcf','paint',.071);
 }
 // Rostrum: an elevated concrete platform with silver tubular structure,
 // cream roof sheets and smoothly rolled blue/cream/green front fascia.
 const silver='#acb8b7',a=R.left-.35,b=R.right+.35;
 curvedStrip(a,b,[[R.front-.16,R.roof+.24],[R.rear+.32,R.roof+.06]],'#caccc1','metal');
 const stripe=['#278cab','#3298b8','#dadbc9','#75ab49','#86b651','#77a949','#dcddcd','#3194b3','#288aa9'];
 for(let i=0;i<9;i++){
  const l=a+(b-a)*i/9,u=a+(b-a)*(i+1)/9;
  const profile=Array.from({length:19},(_,j)=>{const t=-Math.PI/2+j*Math.PI/18;return [R.front-.16-.28*Math.cos(t),R.roof+.24*Math.sin(t)];});
  curvedStrip(l,u,profile,stripe[i]);
  tube([l,R.front-.16,R.roof+.25],[l,R.rear+.32,R.roof+.07],.022,silver);
  for(let j=0;j<profile.length-1;j++)tube([l,...profile[j]],[l,...profile[j+1]],.012,silver);
 }
 for(const y of [R.front-.08,R.front+1.4,R.front+3.2,R.rear+.22])tube([a,y,R.roof-.08],[b,y,R.roof-.08],.044,silver);
 for(const x of [R.left+.18,R.right-.18]){
  tube([x,R.front-.17,R.roof-.12],[x,R.rear+.26,R.roof-.12],.041,silver);
  for(const y of [R.front+.22,R.rear-.22]){
   tube([x,y,R.top],[x,y,R.roof],.05,silver);
   box([x-.11,y-.11,R.top+.003,x+.11,y+.11,R.top+.024],silver,'metal');
   for(const dx of [-.07,.07])for(const dy of [-.07,.07])tube([x+dx,y+dy,R.top+.02],[x+dx,y+dy,R.top+.045],.012,'#576664');
   tube([x,y,R.roof-.55],[x+(x<44?.45:-.45),y,R.roof-.1],.024,silver);
  }
 }
 for(const h of [.18,1.03])tube([R.left,R.front,R.top+h],[R.right,R.front,R.top+h],h>.5?.034:.024,silver);
 for(let x=R.left+.12;x<R.right;x+=.17){tube([x,R.front,R.top+.04],[x,R.front,R.top+1.03],.012,silver);box([x-.035,R.front-.035,R.top,x+.035,R.front+.035,R.top+.025],silver,'metal');}
 for(const side of [-1,1]){
  const edge=side<0?R.left:R.right;
  tube([edge,R.front,R.top+1.03],[edge+side*R.run,R.front,R.ground+1.20],.032,silver);
  for(let i=0;i<R.treads;i++){
   const dx=(i+.5)*R.run/R.treads,top=R.top-(i+1)*(R.top-R.ground)/(R.treads+1),xx=edge+side*dx;
   tube([xx,R.front,top],[xx,R.front,top+1.03],.015,silver);
   const outer=edge+side*(i+1)*R.run/R.treads;
   box([outer-.015,R.front+.1,top+.003,outer+.015,R.rear-.1,top+.014],'#686e64','rubber_mat');
  }
  // Yellow stair cheek forms the diagonal inverted-V silhouette in the photos.
  const s=new THREE.Shape();s.moveTo(edge,R.top-.03);s.lineTo(edge+side*R.run,R.ground+.17);s.lineTo(edge+side*R.run,R.ground-.05);s.lineTo(edge,R.top-.27);s.closePath();
  put(new THREE.ExtrudeGeometry(s,{depth:.045,bevelEnabled:false}),0,R.front-.045,0,'#d3a13c');
 }
 for(let x=R.left+.5;x<R.right;x+=.65)box([x,R.front+.04,R.top+.001,x+.007,R.rear-.04,R.top+.007],'#8e9288');
 for(let y=R.front+.4;y<R.rear;y+=.65)box([R.left+.03,y,R.top+.001,R.right-.03,y+.007,R.top+.007],'#8e9288');
 box([43.45,R.front-.025,R.ground+.12,44.55,R.front-.008,R.top-.1],'#9baba8','metal');
 for(const x of [43.45,44.52])box([x,R.front-.04,R.ground+.1,x+.025,R.front-.02,R.top-.08],'#667975','metal');
 tube([44.35,R.front-.06,R.ground+.64],[44.35,R.front-.06,R.ground+.85],.018,silver);
 for(const {geos,color,kind} of batches.values()){
  const merged=mergeGeometries(geos,false);for(const g of geos)g.dispose();
  const mesh=new THREE.Mesh(merged,material(color,kind));mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
 }
 root.userData.batchedMaterials=batches.size;return root;
}
