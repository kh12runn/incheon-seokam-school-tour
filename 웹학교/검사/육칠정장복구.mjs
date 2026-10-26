import * as T from '../외부도구/three.module.js';
import {normalizePrincipalModel} from '../교장실캐릭터.mjs';

// Cut at the neck only. In particular, never split the donor's sleeves/hands.
function clipNeck(mesh,above,level){
 const g=mesh.geometry,p=g.attributes.position,idx=g.index,keys=['position','normal','uv','color'].filter(k=>g.attributes[k]),values=Object.fromEntries(keys.map(k=>[k,[]]));
 const indices=[],cache=new Map();
 const vertex=i=>({key:String(i),...Object.fromEntries(keys.map(k=>[k,Array.from({length:g.attributes[k].itemSize},(_,c)=>g.attributes[k].getComponent(i,c))]))});
 const inside=v=>above?v.position[1]>=level:v.position[1]<=level;
 const intersect=(a,b)=>{const t=(level-a.position[1])/(b.position[1]-a.position[1]);return {key:[a.key,b.key].sort().join(':'),...Object.fromEntries(keys.map(k=>[k,a[k].map((v,c)=>v+(b[k][c]-v)*t)]))};};
 for(let i=0;i<(idx?.count??p.count);i+=3){
  const triangle=[0,1,2].map(j=>vertex(idx?idx.getX(i+j):i+j)),polygon=[];
  for(let j=0;j<3;j++){const a=triangle[j],b=triangle[(j+1)%3];if(inside(a))polygon.push(a);if(inside(a)!==inside(b))polygon.push(intersect(a,b));}
  for(let j=1;j<polygon.length-1;j++)for(const v of [polygon[0],polygon[j],polygon[j+1]]){if(!cache.has(v.key)){cache.set(v.key,cache.size);for(const k of keys)values[k].push(...v[k]);}indices.push(cache.get(v.key));}
 }
 const result=new T.BufferGeometry();for(const k of keys)result.setAttribute(k,new T.Float32BufferAttribute(values[k],g.attributes[k].itemSize));
 // Keep the authored normals: recomputing a segmented scan makes seams visible.
 result.setIndex(indices);result.normalizeNormals();return new T.Mesh(result,mesh.material);
}
function baked(asset,source){
 const root=normalizePrincipalModel(asset,1.82);root.updateMatrixWorld(true);const list=[];
 root.traverse(o=>{if(o.isMesh){const material=o.material.clone();material.userData={...material.userData,glbSource:source};list.push(new T.Mesh(o.geometry.clone().applyMatrix4(o.matrixWorld),material));}});return list;
}
export function restoreTeacher67Suit(faceAsset,principalAsset){
 const result=new T.Group();
 for(const mesh of baked(faceAsset,0)){const part=clipNeck(mesh,true,1.48);if(part.geometry.attributes.position.count)result.add(part);}
 for(const mesh of baked(principalAsset,1)){const part=clipNeck(mesh,false,1.482);if(part.geometry.attributes.position.count)result.add(part);}
 result.userData.edit='6-7 approved head retained; continuous principal suit, hands and dress shoes';return result;
}
