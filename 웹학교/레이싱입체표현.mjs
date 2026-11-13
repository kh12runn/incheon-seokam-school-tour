import * as THREE from './외부도구/three.module.js';
import {mergeGeometries} from './외부도구/BufferGeometryUtils.js';

// A handful of merged meshes per course; no downloaded models, per-frame
// geometry creation, point lights, or new WebGL context for the preview.
export function createWorldRoad(course,offset=.18){
 const root=new THREE.Group();root.name='고속도로 고가교 터널';
 const mats={road:new THREE.MeshStandardMaterial({color:0x343e49,roughness:.94,emissive:0x111923,emissiveIntensity:.3}),concrete:new THREE.MeshStandardMaterial({color:0xa8b3bd,roughness:.9}),steel:new THREE.MeshStandardMaterial({color:0x536578,metalness:.55,roughness:.4}),light:new THREE.MeshBasicMaterial({color:course.color}),white:new THREE.MeshBasicMaterial({color:0xe9eff4}),tunnel:new THREE.MeshStandardMaterial({color:0x52667a,emissive:0x263e54,emissiveIntensity:.6,roughness:.9,side:THREE.DoubleSide})};
 const bins=new Map(),box=new THREE.BoxGeometry(),dummy=new THREE.Object3D();
 function part(mat,p,w,h,d,y=0,yaw=p.yaw){dummy.position.set(p.x,p.height-offset+y,p.z);dummy.rotation.set(0,yaw,0);dummy.scale.set(w,h,d);dummy.updateMatrix();const g=box.clone().applyMatrix4(dummy.matrix);if(!bins.has(mat))bins.set(mat,[]);bins.get(mat).push(g);}
 function strip(lane1,lane2,y,mat,closedBottom=false){
  const vertices=[],indices=[],steps=Math.ceil(course.length/1.2);
  for(let i=0;i<=steps;i++){for(const lane of [lane1,lane2]){const p=course.trackPoint(course.length*i/steps,lane);vertices.push(p.x,p.height-offset+y,p.z);}if(i<steps){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,mat);mesh.receiveShadow=true;root.add(mesh);
 }
 const half=course.width/2;strip(-half,half,-.015,mats.road);mats.concrete.side=THREE.DoubleSide;strip(-half-.9,half+.9,-.38,mats.concrete);
 for(const side of [-1,1]){
  strip(side*half-.18,side*half+.18,.025,mats.white);
  strip(side*(half+.65)-.55,side*(half+.65)+.55,-.08,mats.concrete);
 }
 for(let s=0;s<course.length;s+=3){
  const p=course.trackPoint(s),q=course.trackPoint(s+1.5);part(mats.white,p,.12,.025,1.3,.02);
  for(const side of [-1,1]){
   const edge=course.trackPoint(s,side*(half+.55));part(mats.steel,edge,.16,.85,.16,.43);part(mats.steel,edge,.16,.15,3.2,.85);
   if(Math.round(s)%12===0)part(mats.light,edge,.22,.12,.45,.98);
  }
 }
 for(let s=8;s<course.length;s+=22){const p=course.trackPoint(s);if(p.height>4){
  // Do not drive supports through the original school; the roof spans are
  // supported by beams resting above the building instead.
  const school=p.x>-20&&p.x<105&&p.z>-17&&p.z<87;
  if(!school)part(mats.concrete,p,1.6,p.height+.6,1.6,-(p.height+.6)/2-.15);
  part(mats.steel,p,course.width+1,.5,.55,-.55);
 }}
 // Color-coded gantries make each world recognizable at driving height too.
 for(let s=55;s<course.length;s+=95){const p=course.trackPoint(s);if(p.tunnel)continue;
  for(const side of [-1,1]){const edge=course.trackPoint(s,side*(half+1));part(mats.steel,edge,.35,5.6,.35,2.8);part(mats.light,edge,.15,3.2,.42,3);}
  part(mats.steel,p,course.width+2.5,.55,.55,5.5);part(mats.light,p,course.width+1.8,.10,.6,5.2);
 }
 const tunnelVertices=[],tunnelIndices=[];
 for(const [from,to] of course.tunnels??[]){
  const steps=Math.ceil((to-from)*course.length/2),start=tunnelVertices.length/3;
  for(let i=0;i<=steps;i++){
   const s=(from+(to-from)*i/steps)*course.length;
   for(let j=0;j<=14;j++){
    const a=Math.max(0,Math.min(12,j-1))/12*Math.PI,p=course.trackPoint(s,Math.cos(a)*(half+.8));tunnelVertices.push(p.x,p.height-offset+(j===0||j===14?-.2:.7+Math.sin(a)*4.4),p.z);
   }
   if(i<steps)for(let j=0;j<14;j++){const n=start+i*15+j;tunnelIndices.push(n,n+1,n+15,n+1,n+16,n+15);}
   if(i%5===0){
    for(let j=0;j<=12;j++){const a=j/12*Math.PI,p=course.trackPoint(s,Math.cos(a)*(half+.65));part(mats.light,p,.12,.18,.45,.7+Math.sin(a)*4.3);}
   }
  }
  for(const s of [from*course.length,to*course.length])for(const side of [-1,1]){const p=course.trackPoint(s,side*(half+.8));part(mats.concrete,p,.8,5.3,.8,2.65);}
 }
 if(tunnelVertices.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(tunnelVertices,3));g.setIndex(tunnelIndices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,mats.tunnel);mesh.name='빛의 터널';root.add(mesh);}
 for(const [material,geos] of bins){const mesh=new THREE.Mesh(mergeGeometries(geos),material);mesh.receiveShadow=true;root.add(mesh);geos.forEach(g=>g.dispose());}
 const guide=[];for(let s=0;s<course.length;s+=3){const a=course.trackPoint(s),b=course.trackPoint(s+1.5);if(a.height<-.6)guide.push(a.x,.65-offset,a.z,b.x,.65-offset,b.z);}
 if(guide.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(guide,3));const line=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x56f3f2,transparent:true,opacity:.8,depthTest:false,depthWrite:false}));line.name='지하 코스 안내선';line.renderOrder=100;line.visible=false;root.add(line);}
 box.dispose();return root;
}
