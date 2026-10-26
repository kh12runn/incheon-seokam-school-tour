import * as T from '../외부도구/three.module.js';
// Minimal offline GLB packer. Original embedded image bytes are copied verbatim.
// Only referenced vertices are written; no bitmap resampling or lossy geometry.
export async function editedGLB(root,sourceURL){
 const original=await (await fetch(sourceURL)).arrayBuffer(),view=new DataView(original),length=view.getUint32(12,true),source=JSON.parse(new TextDecoder().decode(new Uint8Array(original,20,length))),binOffset=28+length;
 const json={asset:{version:'2.0',generator:'Seokam targeted mesh edit 2026-10-26',extras:{release:'teacher-models-20261025',edit:root.userData.edit}},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[{byteLength:0}],images:[],textures:source.textures,samplers:source.samplers};
 const parts=[];let offset=0;
 const append=(bytes,target)=>{const a=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength),id=json.bufferViews.length;json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:a.byteLength,...(target?{target}:{})});parts.push({offset,bytes:a});offset+=a.byteLength;offset=(offset+3)&~3;return id;};
 for(const img of source.images){const bv=source.bufferViews[img.bufferView];json.images.push({...img,bufferView:append(new Uint8Array(original,binOffset+(bv.byteOffset??0),bv.byteLength))});}
 const materialMap=new Map();
 function material(m){if(materialMap.has(m))return materialMap.get(m);let result;
  if(m.map){const src=source.materials.find(v=>(v.name??'')===m.name);if(!src)throw Error('Original material not found: '+m.name);result=structuredClone(src);}
  else result={name:m.name,doubleSided:m.side===T.DoubleSide,pbrMetallicRoughness:{baseColorFactor:[m.color.r,m.color.g,m.color.b,m.opacity],roughnessFactor:m.roughness,metallicFactor:m.metalness}};
  const n=json.materials.length;json.materials.push(result);materialMap.set(m,n);return n;
 }
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
 root.traverse(o=>{if(!o.isMesh)return;if(Array.isArray(o.material))throw Error('Unsupported material groups');
  const g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld)),old=g.index?Array.from(g.index.array):Array.from({length:g.attributes.position.count},(_,i)=>i),map=new Map(),ids=[],index=Uint32Array.from(old,i=>{if(!map.has(i)){map.set(i,ids.length);ids.push(i);}return map.get(i);}),attributes={};
  for(const [key,name] of [['position','POSITION'],['normal','NORMAL'],['uv','TEXCOORD_0'],['color','COLOR_0']]){
   const a=g.attributes[key];if(!a||(key==='color'&&!o.material.vertexColors))continue;const values=new Float32Array(ids.length*a.itemSize),min=Array(a.itemSize).fill(Infinity),max=Array(a.itemSize).fill(-Infinity);
   ids.forEach((i,k)=>{for(let c=0;c<a.itemSize;c++){const v=a.getComponent(i,c);values[k*a.itemSize+c]=v;min[c]=Math.min(min[c],v);max[c]=Math.max(max[c],v);}});
   attributes[name]=json.accessors.length;json.accessors.push({bufferView:append(values,34962),componentType:5126,count:ids.length,type:'VEC'+a.itemSize,...(key==='position'?{min,max}:{})});
  }
  const indices=json.accessors.length;json.accessors.push({bufferView:append(index,34963),componentType:5125,count:index.length,type:'SCALAR'});
  const mesh=json.meshes.length;json.meshes.push({primitives:[{attributes,indices,material:material(o.material),mode:4}]});json.scenes[0].nodes.push(json.nodes.length);json.nodes.push({mesh,name:o.material.name||'Preserved approved surface'});g.dispose();
 });
 json.buffers[0].byteLength=offset;const text=new TextEncoder().encode(JSON.stringify(json)),jsonLength=(text.length+3)&~3,total=28+jsonLength+offset,result=new ArrayBuffer(total),header=new DataView(result),bytes=new Uint8Array(result);
 header.setUint32(0,0x46546c67,true);header.setUint32(4,2,true);header.setUint32(8,total,true);header.setUint32(12,jsonLength,true);header.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+jsonLength);bytes.set(text,20);header.setUint32(20+jsonLength,offset,true);header.setUint32(24+jsonLength,0x004e4942,true);for(const part of parts)bytes.set(part.bytes,28+jsonLength+part.offset);return result;
}
