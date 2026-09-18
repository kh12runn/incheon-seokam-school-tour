import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {brotliCompressSync,gzipSync,constants} from 'node:zlib';
const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const serverFiles=['관리도구/웹서버.mjs','관리도구/관리자/API.mjs','관리도구/관리자/저장소.mjs','관리도구/관리자/이미지검사.mjs'];
// Follow only files reachable by the current game. Source photos and authoring assets stay local.
export function runtimeFiles(){
  const files=new Set(),queue=['index.html','웹학교/외부도구/저작권.txt'];
  while(queue.length){
    const rel=queue.shift();if(files.has(rel))continue;
    if(rel.includes('..')||path.isAbsolute(rel))throw new Error('Unsafe runtime path '+rel);
    const source=fs.readFileSync(path.join(sourceRoot,rel),'utf8');files.add(rel);
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
  const files=runtimeFiles(),sizes={sourceBytes:0,runtimeBytes:0,compressedTransferBytes:0,sidecarBytes:0};
  for(const rel of [...files,...serverFiles]){
    let bytes=fs.readFileSync(path.join(sourceRoot,rel));
    if(files.includes(rel))sizes.sourceBytes+=bytes.length;
    if(rel.endsWith('.json'))bytes=Buffer.from(JSON.stringify(JSON.parse(bytes)));
    const target=path.join(output,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
    if(!files.includes(rel))continue;
    sizes.runtimeBytes+=bytes.length;
    if(bytes.length>512&&/\.(?:html|css|m?js|json|txt)$/.test(rel)){
      const br=brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:8}}),gz=gzipSync(bytes,{level:9});
      fs.writeFileSync(target+'.br',br);fs.writeFileSync(target+'.gz',gz);
      sizes.compressedTransferBytes+=br.length;sizes.sidecarBytes+=br.length+gz.length;
    }else sizes.compressedTransferBytes+=bytes.length;
  }
  fs.writeFileSync(path.join(output,'배포목록.json'),JSON.stringify(files));
  return {publicFiles:files.length,...sizes,files};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  console.log(JSON.stringify(packRuntime(process.argv[2]??path.join(sourceRoot,'배포자료')),null,2));
}
