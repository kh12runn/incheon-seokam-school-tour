// Offline mesh authoring only. Textures are read for segmentation, never repainted.
import * as T from '../외부도구/three.module.js';
import {normalizePrincipalModel} from '../교장실캐릭터.mjs';
const smooth=(a,b,v)=>{const t=T.MathUtils.clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
function meshes(asset){
 const model=normalizePrincipalModel(asset,1.82);model.updateMatrixWorld(true);const result=[];
 model.traverse(o=>{if(o.isMesh){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);result.push(new T.Mesh(g,o.material));}});return result;
}
function sampler(material){
 const map=material.map;if(!map)return ()=>[0,0,0];const c=document.createElement('canvas');c.width=map.image.width;c.height=map.image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(map.image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
 return (g,i)=>{const uv=g.attributes.uv,u=uv.getX(i),v=map.flipY?1-uv.getY(i):uv.getY(i),n=(Math.min(c.height-1,Math.max(0,Math.floor(v*c.height)))*c.width+Math.min(c.width-1,Math.max(0,Math.floor(u*c.width))))*4;const color=new T.Color().setRGB(data[n]/255,data[n+1]/255,data[n+2]/255,T.SRGBColorSpace);if(material.vertexColors&&g.attributes.color)color.multiply(new T.Color().fromBufferAttribute(g.attributes.color,i));color.multiply(material.color);color.convertLinearToSRGB();return [color.r,color.g,color.b];};
}
function partition(mesh,classify,materials){
 const g=mesh.geometry,p=g.attributes.position,index=g.index,sets=materials.map(()=>[]),v=new T.Vector3();
 for(let k=0;k<(index?.count??p.count);k+=3){const ids=[0,1,2].map(j=>index?index.getX(k+j):k+j),center=ids.reduce((a,i)=>a.add(v.fromBufferAttribute(p,i)),new T.Vector3()).multiplyScalar(1/3);const group=classify(center,ids,g);if(group>=0)sets[group].push(...ids);}
 return sets.flatMap((indices,i)=>{if(!indices.length)return [];const geometry=g.clone();geometry.setIndex(indices);geometry.clearGroups();geometry.computeBoundingBox();geometry.computeBoundingSphere();return new T.Mesh(geometry,materials[i]);});
}
const matte=(color,name)=>new T.MeshStandardMaterial({color,roughness:.9,metalness:0,name});
export function suitOnly(current,previous){
 const result=new T.Group(),kept=[],navy=matte('#172238','Restored navy suit'),shirt=matte('#eeeef0','White shirt'),tie=matte('#162032','Navy tie'),shoe=matte('#17181d','Black dress shoes');
 for(const mesh of meshes(current)){
  const selected=partition(mesh,p=>p.y>=1.435||(Math.abs(p.x)>.244&&p.y<.845&&p.y>.69)?0:-1,[mesh.material]);
  result.add(...selected);kept.push(...selected);
 }
 for(const mesh of meshes(previous)){
  const sample=sampler(mesh.material);
  const selected=partition(mesh,(p,ids,g)=>{
   if(p.y>1.49||(Math.abs(p.x)>.238&&p.y<.935&&p.y>.68))return -1;
   if(p.y<.112)return 3;
   const cs=ids.map(i=>sample(g,i));const bright=cs.map(c=>(c[0]+c[1]+c[2])/3).sort((a,b)=>a-b)[1];
   if(p.y>1.12&&Math.abs(p.x)<.115&&p.z>.028)return bright>.48?1:2;
   return 0;
  },[navy,shirt,tie,shoe]);
  for(const m of selected){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);let yy=y<.78?y*.98:.7644+(y-.78)*.96;yy-=.055*smooth(.16,.24,Math.abs(x))*smooth(.7,.85,y)*(1-smooth(.94,1.25,y));p.setXYZ(i,x*1.03,yy,z);}p.needsUpdate=true;m.geometry.computeVertexNormals();}
  result.add(...selected);
 }
 const collar=new T.Mesh(new T.CylinderGeometry(.053,.066,.035,40,1,true,.65,Math.PI*2-1.3),shirt);collar.position.set(0,1.432,.009);result.add(collar);
 for(const sign of [-1,1]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([sign*.014,1.45,.062,sign*.064,1.432,.073,sign*.034,1.386,.101],3));g.computeVertexNormals();const flap=new T.Mesh(g,shirt.clone());flap.material.side=T.DoubleSide;result.add(flap);}
 for(const sign of [-1,1]){const cuff=new T.Mesh(new T.CylinderGeometry(.027,.026,.045,32),shirt);cuff.position.set(sign*.292,.852,.002);cuff.rotation.z=sign*.13;result.add(cuff);}
 // New face, hair, ears, neck and hands keep their exact vertex positions and UVs.
 result.userData.edit='6-7 clothes and shoes only';result.userData.preservedMeshes=kept.length;return result;
}
function hairCurtain(material){
 const positions=[],indices=[],uv=[],rings=30,segments=72;
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
  const t=j/rings,opening=1.1-.63*smooth(0,.45,t),a=opening+(Math.PI*2-2*opening)*i/segments,front=Math.max(0,Math.cos(a)),bottom=1.225+.07*front;
  const y=1.72*(1-t)+bottom*t,rx=.126+.046*smooth(0,.3,t)-.015*smooth(.5,1,t),rz=.111+.052*smooth(0,.4,t)-.006*t,ridge=.0025*Math.cos(a*42)*smooth(0,.25,t);
  positions.push(Math.sin(a)*(rx+ridge),y,Math.cos(a)*(rz+ridge)+.006*t);uv.push(i/segments,t);
  if(j<rings&&i<segments){const n=j*(segments+1)+i;indices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const m=new T.Mesh(g,material);m.material.side=T.DoubleSide;return m;
}
export function straightHairOnly(current){
 const result=new T.Group(),hair=matte('#302017','Long straight dark hair');let changed=0;
 for(const mesh of meshes(current)){
  // The separate approved facial/dimple primitive is never segmented.
  if(mesh.material.name==='Soft face shading'){result.add(mesh);continue;}
  const sample=sampler(mesh.material);
  const selected=partition(mesh,(p,ids,g)=>{
   if(p.y<1.19||Math.abs(p.x)>.215)return 0;
   const cs=ids.map(i=>sample(g,i)),dark=cs.some(c=>c[0]<.78&&c[1]<.52&&c[2]<.38&&c[0]>c[1]*1.18&&c[0]>c[2]*1.38);
   const region=p.y>1.72||p.z<-.055||(p.y<1.56?((Math.abs(p.x)>.02&&p.z>.09)||(Math.abs(p.x)>.13&&p.z>.025)):(Math.abs(p.x)>.122&&p.z>.085));
   if(!dark||!region)return 0;
   changed++;return p.y<1.705?-1:1;
  },[mesh.material,hair]);
  result.add(...selected);
 }
 result.add(hairCurtain(hair));result.userData.edit='6-6 hair only';result.userData.changedHairTriangles=changed;return result;
}
