import * as T from '../외부도구/three.module.js';
import {normalizePrincipalModel} from '../교장실캐릭터.mjs';

// Cut at the neck only. In particular, never split the donor's sleeves/hands.
function clipNeck(mesh,above,level,reject=()=>false){
 const g=mesh.geometry,p=g.attributes.position,idx=g.index,keys=['position','normal','uv','color'].filter(k=>g.attributes[k]),values=Object.fromEntries(keys.map(k=>[k,[]]));
 const indices=[],cache=new Map();
 const vertex=i=>({key:String(i),...Object.fromEntries(keys.map(k=>[k,Array.from({length:g.attributes[k].itemSize},(_,c)=>g.attributes[k].getComponent(i,c))]))});
 const inside=v=>above?v.position[1]>=level:v.position[1]<=level;
 const intersect=(a,b)=>{const t=(level-a.position[1])/(b.position[1]-a.position[1]);return {key:[a.key,b.key].sort().join(':'),...Object.fromEntries(keys.map(k=>[k,a[k].map((v,c)=>v+(b[k][c]-v)*t)]))};};
 for(let i=0;i<(idx?.count??p.count);i+=3){
  const ids=[0,1,2].map(j=>idx?idx.getX(i+j):i+j);if(reject(ids))continue;
  const triangle=ids.map(vertex),polygon=[];
  for(let j=0;j<3;j++){const a=triangle[j],b=triangle[(j+1)%3];if(inside(a))polygon.push(a);if(inside(a)!==inside(b))polygon.push(intersect(a,b));}
  for(let j=1;j<polygon.length-1;j++)for(const v of [polygon[0],polygon[j],polygon[j+1]]){if(!cache.has(v.key)){cache.set(v.key,cache.size);for(const k of keys)values[k].push(...v[k]);}indices.push(cache.get(v.key));}
 }
 const result=new T.BufferGeometry();for(const k of keys)result.setAttribute(k,new T.Float32BufferAttribute(values[k],g.attributes[k].itemSize));
 // Keep the authored normals: recomputing a segmented scan makes seams visible.
 result.setIndex(indices);result.normalizeNormals();return new T.Mesh(result,mesh.material);
}
// Read the original atlas only; retain its bytes in the exported GLB.
function surfaceSampler(mesh){
 const m=mesh.material,map=m.map;if(!map)return i=>{const c=m.color.clone();if(m.vertexColors&&mesh.geometry.attributes.color)c.multiply(new T.Color().fromBufferAttribute(mesh.geometry.attributes.color,i));return c;};
 const canvas=document.createElement('canvas');canvas.width=map.image.width;canvas.height=map.image.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(map.image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,g=mesh.geometry;
 return i=>{const u=g.attributes.uv.getX(i),v=map.flipY?1-g.attributes.uv.getY(i):g.attributes.uv.getY(i),n=4*(Math.min(canvas.height-1,Math.max(0,Math.floor(v*canvas.height)))*canvas.width+Math.min(canvas.width-1,Math.max(0,Math.floor(u*canvas.width))));
  const c=new T.Color().setRGB(pixels[n]/255,pixels[n+1]/255,pixels[n+2]/255,T.SRGBColorSpace).multiply(m.color);
  if(m.vertexColors&&g.attributes.color)c.multiply(new T.Color().fromBufferAttribute(g.attributes.color,i));return c;
 };
}
function extendOwnNeck(mesh,cut){
 const g=mesh.geometry,p=g.attributes.position,keys=Object.keys(g.attributes),arrays=Object.fromEntries(keys.map(k=>[k,Array.from(g.attributes[k].array)])),indices=Array.from(g.index.array),lower=new Map(),edges=[];
 const pointKey=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e6)).join(','),counts=new Map();
 for(let k=0;k<g.index.count;k+=3)for(let j=0;j<3;j++){const a=g.index.getX(k+j),b=g.index.getX(k+(j+1)%3),key=[pointKey(a),pointKey(b)].sort().join('|');const entry=counts.get(key);if(entry)entry.count++;else counts.set(key,{count:1,a,b});}
 for(const {count,a,b}of counts.values())if(count===1&&Math.max(p.getY(a),p.getY(b))<1.49&&Math.min(p.getY(a),p.getY(b))<1.465)edges.push([a,b]);
 const down=i=>{if(lower.has(i))return lower.get(i);const id=arrays.position.length/3;for(const key of keys){const a=g.attributes[key];for(let c=0;c<a.itemSize;c++)arrays[key].push(a.getComponent(i,c));}arrays.position[id*3]*=.85;arrays.position[id*3+1]=1.395;arrays.position[id*3+2]=-.055+(arrays.position[id*3+2]+.055)*.85;lower.set(i,id);return id;};
 for(const [a,b]of edges){const ad=down(a),bd=down(b);indices.push(b,a,ad,b,ad,bd);}
 for(const key of keys)g.setAttribute(key,new T.Float32BufferAttribute(arrays[key],g.attributes[key].itemSize));g.setIndex(indices);g.computeBoundingBox();g.computeBoundingSphere();return edges.length;
}
function blackCloth(mesh){
 const g=mesh.geometry,sample=surfaceSampler(mesh),original=g.attributes.color,colors=new Float32Array(g.attributes.position.count*3);let count=0;
 for(let i=0;i<g.attributes.position.count;i++){
  const c=sample(i),p=g.attributes.position,y=p.getY(i);
  const blue=(c.b-c.r)/Math.max(.001,c.b),mask=y>.10&&y<1.49?T.MathUtils.smoothstep(blue,.06,.28):0;
  const target=(c.r*.2126+c.g*.7152+c.b*.0722)*.18;
  for(let k=0;k<3;k++){const channel=[c.r,c.g,c.b][k],base=original?original.getComponent(i,k):1;colors[i*3+k]=base*(1-mask+mask*target/Math.max(.00001,channel));}if(mask>.5)count++;
 }
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));mesh.material.vertexColors=true;return count;
}
function baked(asset,source){
 const root=normalizePrincipalModel(asset,1.82);root.updateMatrixWorld(true);const list=[];
 root.traverse(o=>{if(o.isMesh){const material=o.material.clone();material.userData={...material.userData,glbSource:source};list.push(new T.Mesh(o.geometry.clone().applyMatrix4(o.matrixWorld),material));}});return list;
}
export function restoreTeacher67Suit(faceAsset,principalAsset){
 const result=new T.Group();let neckEdges=0,blackVertices=0,removedNeck=0;
 for(const mesh of baked(faceAsset,0)){
  const part=clipNeck(mesh,true,1.455);if(part.geometry.attributes.position.count){neckEdges+=extendOwnNeck(part,1.455);result.add(part);}
 }
 for(const mesh of baked(principalAsset,1)){
  const sample=surfaceSampler(mesh),p=mesh.geometry.attributes.position;
  const part=clipNeck(mesh,false,1.49,ids=>{
   if(!ids.some(i=>p.getY(i)>1.405)||ids.some(i=>Math.abs(p.getX(i))>.115))return false;
   if(ids.every(i=>p.getZ(i)>.065&&p.getY(i)<1.445))return false;
   const skin=ids.filter(i=>{const c=sample(i);return c.r>c.g*1.12&&c.r>c.b*1.18&&c.r>.07;}).length>=2;
   if(skin)removedNeck++;return skin;
  });
  if(part.geometry.attributes.position.count){
   blackVertices+=blackCloth(part);const positions=part.geometry.attributes.position;
   for(let i=0;i<positions.count;i++){const amount=T.MathUtils.smoothstep(positions.getY(i),1.30,1.44)*(1-T.MathUtils.smoothstep(Math.abs(positions.getX(i)),.10,.18));positions.setZ(i,positions.getZ(i)-.045*amount);}
   positions.needsUpdate=true;result.add(part);
  }
 }
 result.userData={edit:'6-7 original face and continuous own neck fitted into collar; black tailored suit',neckEdges,removedNeck,blackVertices};return result;
}
