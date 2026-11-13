import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {brotliCompressSync,gzipSync,constants} from 'node:zlib';
import {compactModel} from './모델경량화.mjs';
import {buildSync} from 'esbuild';
import {createHash} from 'node:crypto';
const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const serverFiles=['관리도구/웹서버.mjs','관리도구/레이싱기록.mjs','관리도구/서버시작.mjs','관리도구/관리자/API.mjs','관리도구/관리자/저장소.mjs','관리도구/관리자/이미지검사.mjs','관리도구/관리자/사진변환.mjs','관리도구/관리자/이미지정책/policy.xml'];
// Follow only files reachable by the current game. Source photos and authoring assets stay local.
export function runtimeFiles(){
  const files=new Set(),queue=['index.html','웹학교/외부도구/저작권.txt','웹학교/외부도구/cannon-es-LICENSE.txt','웹학교/외부도구/lucide-LICENSE.txt'];
  while(queue.length){
    const rel=queue.shift();if(files.has(rel))continue;
    if(rel.includes('..')||path.isAbsolute(rel))throw new Error('Unsafe runtime path '+rel);
    // Binary model/texture assets have no source references to scan.
    const source=/\.(?:html|css|m?js)$/.test(rel)?fs.readFileSync(path.join(sourceRoot,rel),'utf8'):'';files.add(rel);
    const refs=[];
    if(rel.endsWith('.html'))for(const m of source.matchAll(/(?:src|href)="([^"]+)"/g))refs.push(m[1]);
    if(/\.m?js$/.test(rel)){
      for(const m of source.matchAll(/\bfrom\s*['"](\.[^'"]+)['"]/g))refs.push(m[1]);
      for(const m of source.matchAll(/\bimport\s*['"](\.[^'"]+)['"]/g))refs.push(m[1]);
      for(const m of source.matchAll(/new URL\(\s*['"](\.[^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g))refs.push(m[1]);
    }
    if(rel.endsWith('.css'))for(const m of source.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g))refs.push(m[1]);
    for(const ref of refs){
      if(/^(?:data:|https?:|#)/.test(ref))continue;
      const clean=ref.split(/[?#]/)[0];queue.push(clean==='/'?'index.html':path.posix.normalize(clean.startsWith('/')?clean.slice(1):path.posix.join(path.posix.dirname(rel),clean)));
    }
  }
  return [...files].sort();
}
export function packRuntime(output){
  output=path.resolve(output);
  if(output===sourceRoot||fs.existsSync(output))throw new Error('Build output must be a new directory: '+output);
  fs.mkdirSync(output,{recursive:true});
  const files=runtimeFiles(),sizes={sourceBytes:0,runtimeBytes:0,compressedTransferBytes:0,sidecarBytes:0,removedUnusedVertices:0};
  // Keep the entry in the same directory, preserving all import.meta asset URLs.
  // Original modules remain available for diagnostics, but the browser needs one
  // request for game code instead of a waterfall of ~150 ES module requests.
  const bundle=buildSync({absWorkingDir:sourceRoot,tsconfigRaw:{},entryPoints:[path.join(sourceRoot,'웹학교/게임.mjs')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true,charset:'utf8',legalComments:'inline'}).outputFiles[0].contents;
  const etags={};const remember=(rel,bytes)=>{etags[rel]='"'+createHash('sha256').update(bytes).digest('hex')+'"';};
  const sharedImages=new Map();
  for(const rel of [...files,...serverFiles]){
    let bytes=fs.readFileSync(path.join(sourceRoot,rel));
    if(files.includes(rel))sizes.sourceBytes+=bytes.length;
    if(rel==='웹학교/게임.mjs')bytes=Buffer.from(bundle);
    if(rel.endsWith('.glb')){
      const result=compactModel(bytes,(uri,data)=>{
        const asset=path.posix.join(path.posix.dirname(rel),uri);
        if(!sharedImages.has(asset)){
          const target=path.join(output,asset);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);sharedImages.set(asset,data.length);
        }
      });
      bytes=result.bytes;sizes.removedUnusedVertices+=result.removedVertices;
    }
    if(rel.endsWith('.json'))bytes=Buffer.from(JSON.stringify(JSON.parse(bytes)));
    const target=path.join(output,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
    remember(rel,bytes);
    if(!files.includes(rel))continue;
    sizes.runtimeBytes+=bytes.length;
    // HTTP lossless compression preserves every mesh, texture and animation byte.
    if(bytes.length>512&&/\.(?:html|css|m?js|json|txt|glb)$/.test(rel)){
      const br=brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:8}}),gz=gzipSync(bytes,{level:9});
      fs.writeFileSync(target+'.br',br);fs.writeFileSync(target+'.gz',gz);
      remember(rel+'.br',br);remember(rel+'.gz',gz);
      sizes.compressedTransferBytes+=br.length;sizes.sidecarBytes+=br.length+gz.length;
    }else sizes.compressedTransferBytes+=bytes.length;
  }
  for(const [rel,length] of sharedImages){
    files.push(rel);sizes.runtimeBytes+=length;sizes.compressedTransferBytes+=length;
    remember(rel,fs.readFileSync(path.join(output,rel)));
  }
  fs.writeFileSync(path.join(output,'.http-etags.json'),JSON.stringify(etags));
  fs.writeFileSync(path.join(output,'배포목록.json'),JSON.stringify(files));
  return {publicFiles:files.length,...sizes,files};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  console.log(JSON.stringify(packRuntime(process.argv[2]??path.join(sourceRoot,'배포자료')),null,2));
}
