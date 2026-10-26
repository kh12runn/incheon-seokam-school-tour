import fs from 'node:fs';
import path from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=new URL('../웹학교/캐릭터모델/검토-20261025/',import.meta.url);
fs.mkdirSync(root,{recursive:true});
const release=await (await fetch('https://api.github.com/repos/kh12runn/incheon-seokam-school-tour/releases/tags/teacher-models-20261025')).json();
const expected=new Set(['principal.glb','science.glb',...Array.from({length:7},(_,i)=>`teacher-6-${i+1}.glb`)]);
const assets=release.assets.filter(a=>expected.has(a.name)).sort((a,b)=>Number(!/6-[67]/.test(a.name))-Number(!/6-[67]/.test(b.name)));
if(assets.length!==expected.size)throw Error('Incomplete approved release');
for(const asset of assets){
 const file=new URL(asset.name,root);if(!fs.existsSync(file)||fs.statSync(file).size!==asset.size){
  const r=await fetch(asset.browser_download_url);if(!r.ok)throw Error('Download '+r.status);
  await pipeline(Readable.fromWeb(r.body),fs.createWriteStream(file));
 }
 const bytes=fs.readFileSync(file),json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 console.log(JSON.stringify({name:asset.name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),meshes:json.meshes?.map(m=>({name:m.name,primitives:m.primitives.map(p=>({vertices:json.accessors[p.attributes.POSITION].count,material:p.material,min:json.accessors[p.attributes.POSITION].min,max:json.accessors[p.attributes.POSITION].max}))})),materials:json.materials?.map(m=>({name:m.name,pbr:m.pbrMetallicRoughness})),images:json.images?.map(i=>({type:i.mimeType,bytes:json.bufferViews[i.bufferView]?.byteLength}))}));
}
for(const n of [6,7]){
 const file=new URL(`previous-6-${n}.glb`,root);
 if(!fs.existsSync(file))fs.writeFileSync(file,execFileSync('git',['show',`9cfeca3:웹학교/캐릭터모델/6-${n}-담임선생님.glb`],{maxBuffer:60*1024*1024}));
}
