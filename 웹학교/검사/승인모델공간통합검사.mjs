import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildWorld} from '../이동물리.mjs';
import {runtimeFiles} from '../../관리도구/배포최적화.mjs';
const root=new URL('../../',import.meta.url),report=JSON.parse(fs.readFileSync(new URL('공간자료/아바타통합-20261026.json',root))),baseline=JSON.parse(fs.readFileSync(new URL('공간자료/학교복구비교-20261026.json',root)));
const sha=b=>createHash('sha256').update(b).digest('hex');
function glb(file){const b=fs.readFileSync(file),n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n));return {b,j,offset:28+n};}
function accessor(g,id){const a=g.j.accessors[id],v=g.j.bufferViews[a.bufferView],components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],size={5126:4,5125:4,5123:2,5121:1}[a.componentType],start=g.offset+(v.byteOffset??0)+(a.byteOffset??0);return Array.from({length:a.count},(_,i)=>Array.from({length:components},(_,c)=>{const p=start+i*(v.byteStride??components*size)+c*size;return a.componentType===5126?g.b.readFloatLE(p):a.componentType===5125?g.b.readUInt32LE(p):a.componentType===5123?g.b.readUInt16LE(p):g.b[p];}));}
const models=[];
for(const entry of report.models){
 const g=glb(new URL('웹학교/캐릭터모델/'+entry.file,root));assert.equal(sha(g.b),entry.sha256,entry.file);
 if(!/^6-[67]-/.test(entry.file)){assert.equal(entry.sha256,entry.sourceSHA256,'Unedited approved model remains byte-exact');models.push({file:entry.file,byteExact:true});continue;}
 const source=glb(new URL('웹학교/캐릭터모델/검토-20261025/'+entry.releaseAsset,root));
 const imageHashes=x=>x.j.images.map(im=>{const v=x.j.bufferViews[im.bufferView];return sha(x.b.subarray(x.offset+(v.byteOffset??0),x.offset+(v.byteOffset??0)+v.byteLength));});
 const expectedImages=imageHashes(source);
 if(entry.bodySource){const donor=glb(new URL('웹학교/캐릭터모델/'+entry.bodySource,root));expectedImages.push(...imageHashes(donor));}
 assert.deepEqual(imageHashes(g),expectedImages,'Source face and donor body texture bytes unchanged');
 const bounds=source.j.meshes.flatMap(m=>m.primitives).map(p=>source.j.accessors[p.attributes.POSITION]),min=[0,1,2].map(c=>Math.min(...bounds.map(b=>b.min[c]))),max=[0,1,2].map(c=>Math.max(...bounds.map(b=>b.max[c]))),s=1.82/(max[1]-min[1]);
 const key=p=>p.map(v=>Math.round(v*1e4)).join(',');
 const normalize=p=>[(p[0]-(min[0]+max[0])/2)*s,(p[1]-min[1])*s,(p[2]-(min[2]+max[2])/2)*s];
 const actual=new Set(g.j.meshes.flatMap(m=>m.primitives).filter(p=>g.j.materials[p.material]?.pbrMetallicRoughness?.baseColorTexture).flatMap(p=>accessor(g,p.attributes.POSITION).map(key)));
 const facePrimitive=entry.file.startsWith('6-6')?source.j.meshes[0].primitives[1]:source.j.meshes[0].primitives[0];
 const expected=accessor(source,facePrimitive.attributes.POSITION).map(normalize).filter(p=>entry.file.startsWith('6-6')||p[1]>1.50);
 let missing=0;for(const p of expected)if(!actual.has(key(p)))missing++;
 // Float32 normalisation can straddle a quantisation boundary; tolerate tiny
 // boundary rounding, never a removed facial patch or resculpted face.
 assert(missing<expected.length*.005,entry.file+' preserved face vertices: '+missing+'/'+expected.length);
 models.push({file:entry.file,originalImagesExact:true,faceVertices:expected.length,roundingBoundaryMisses:missing});
}
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('웹학교/학교구조.json',root)))),interiors=[world.classroom64,...world.classroomInteriors,...world.specialInteriors].filter(Boolean),runtime=runtimeFiles();
for(const b of baseline.localRooms){const interior=interiors.find(c=>(c.roomId??c.room?.id)===b.id);assert(interior,'Missing interior '+b.id);assert.equal(interior.boxes.length,b.boxes,'Existing detailed interior preserved '+b.id);}
for(const f of ['교무실사진배치','교무실사진표현','방송실사진배치','방송실사진표현','방송조정실배치','운영위원회회의실','추가공간사진배치','추가공간사진표현','연수실컴퓨터실수정'])assert(runtime.includes('웹학교/'+f+'.mjs'),'Deployment dependency '+f);
assert(!runtime.some(p=>p.includes('검토-20261025')||p.includes('/검사/')));
const result={ok:true,schoolInteriorsPreserved:baseline.localRooms.length,teacherModels:models,approvedRelease:report.release,authoringAssetsExcluded:true};
fs.writeFileSync(new URL('공간자료/승인모델공간통합검사-20261026.json',root),JSON.stringify(result,null,2)+'\n');console.log(result);
