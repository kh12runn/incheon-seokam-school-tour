import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {compactModel,readGLB,accessorBytes} from '../../관리도구/모델경량화.mjs';
import {runtimeFiles} from '../../관리도구/배포최적화.mjs';
const root=new URL('../../',import.meta.url);
const size={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const index=(buffer,type,i)=>type===5125?buffer.readUInt32LE(i*4):type===5123?buffer.readUInt16LE(i*2):buffer[i];
export function verifyLossless(original,result,loadImage){
 const a=readGLB(original),b=readGLB(result),aj=a.json,bj=b.json;
 for(const key of ['nodes','scenes','scene','materials','textures','samplers','skins','animations'])assert.deepEqual(bj[key],aj[key],key);
 assert.equal(bj.meshes.length,aj.meshes.length);
 for(const [mi,m] of aj.meshes.entries())for(const [pi,p] of m.primitives.entries()){
  const q=bj.meshes[mi].primitives[pi];assert.equal(q.material,p.material);assert.equal(q.mode,p.mode);
  const mapping=new Map(),oldCount=aj.accessors[p.attributes.POSITION].count,newCount=bj.accessors[q.attributes.POSITION].count;
  if(p.indices===undefined){assert.equal(oldCount,newCount);for(let i=0;i<oldCount;i++)mapping.set(i,i);}
  else{
   const ia=aj.accessors[p.indices],ib=bj.accessors[q.indices],x=accessorBytes(aj,a.binary,p.indices),y=accessorBytes(bj,b.binary,q.indices);assert.equal(ia.count,ib.count);
   for(let i=0;i<ia.count;i++){const old=index(x,ia.componentType,i),now=index(y,ib.componentType,i);assert(now<newCount);if(mapping.has(now))assert.equal(mapping.get(now),old,'Triangle order changed');else mapping.set(now,old);}
  }
  assert.deepEqual(Object.keys(q.attributes),Object.keys(p.attributes));
  for(const [name,ai] of Object.entries(p.attributes)){
   const bi=q.attributes[name],aa=aj.accessors[ai],bb=bj.accessors[bi];assert.equal(bb.componentType,aa.componentType);assert.equal(bb.type,aa.type);assert.deepEqual(bb.min,aa.min);assert.deepEqual(bb.max,aa.max);
   const x=accessorBytes(aj,a.binary,ai),y=accessorBytes(bj,b.binary,bi),stride=size[aa.componentType]*width[aa.type];
   for(const [now,old] of mapping)assert(x.subarray(old*stride,(old+1)*stride).equals(y.subarray(now*stride,(now+1)*stride)),name+' changed');
  }
 }
 for(const [i,img] of (aj.images??[]).entries()){
  const v=aj.bufferViews[img.bufferView],original=a.binary.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);
  assert(original.equals(loadImage(bj.images[i].uri)),'Texture bytes changed');
 }
 if(aj.skins?.length||aj.animations?.length)for(let i=0;i<aj.accessors.length;i++)assert(accessorBytes(aj,a.binary,i).equals(accessorBytes(bj,b.binary,i)),'Animated accessor changed');
}
if(process.argv[1]&&new URL('file:///'+process.argv[1].replaceAll('\\','/')).href===import.meta.url){
 const shared=new Map(),report=[];
 for(const rel of runtimeFiles().filter(f=>f.endsWith('.glb'))){
  const input=fs.readFileSync(new URL(rel,root)),local=new Map(),result=compactModel(input,(uri,data)=>{local.set(uri,data);shared.set(uri,data);});
  verifyLossless(input,result.bytes,uri=>local.get(uri));
  assert.equal(createHash('sha256').update(input).digest('hex'),createHash('sha256').update(fs.readFileSync(new URL(rel,root))).digest('hex'));
  report.push({file:rel,sourceBytes:input.length,geometryBytes:result.bytes.length,removedUnusedVertices:result.removedVertices});
 }
 const before=report.reduce((s,r)=>s+r.sourceBytes,0),after=report.reduce((s,r)=>s+r.geometryBytes,0)+[...shared.values()].reduce((s,b)=>s+b.length,0);
 console.log(JSON.stringify({ok:true,referencedVertexBytesUnchanged:true,triangleOrderUnchanged:true,textureBytesUnchanged:true,sourceModelsUnchanged:true,before,after,savedBytes:before-after,models:report},null,2));
}
