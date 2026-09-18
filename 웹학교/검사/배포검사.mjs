import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {packRuntime} from '../../관리도구/배포최적화.mjs';
const root=new URL('../../',import.meta.url),port=18081;
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'school-deploy-test-')),output=path.join(temporary,'runtime');
const packed=packRuntime(output);
assert(!packed.files.some(p=>/사진보관|미리보기|실사|검사/.test(p)||p.startsWith('모델/')),'Only current game runtime');
assert.deepEqual(packed.files.filter(p=>p.endsWith('.glb')).sort(),['웹학교/캐릭터모델/교장선생님-귀여운.glb','웹학교/캐릭터모델/교장선생님-실물.glb'].sort(),'Only the two approved principal models');
assert(packed.files.includes('웹학교/교실별특징.mjs'));
// JPEG is already compressed and lazily loaded near 6-4. Keep the text compression
// budget separate rather than claiming the new photographs shrink with Brotli.
let textBytes=0,textTransfer=0;
for(const file of packed.files.filter(file=>/\.(?:html|css|m?js|json|txt)$/.test(file))){
  const target=path.join(output,file);textBytes+=fs.statSync(target).size;
  textTransfer+=fs.statSync(fs.existsSync(target+'.br')?target+'.br':target).size;
}
assert(textTransfer<textBytes*.3,'At least 70% text transfer savings');
const photoFiles=packed.files.filter(file=>/\.jpg$/.test(file));
assert.equal(photoFiles.length,2,'Only the two 6-4 photo derivatives');
assert(photoFiles.every(file=>file.startsWith('웹학교/사진마감/6-4 교실/')));
const child=spawn(process.execPath,[path.join(output,'관리도구/웹서버.mjs')],{env:{...process.env,PORT:String(port),SCHOOL_WEB_ROOT:output},stdio:['ignore','pipe','pipe']});
try{
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw new Error('Server exited');}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Startup timeout')),10000).unref())]);
  const get=(p,options)=>fetch('http://127.0.0.1:'+port+p,options);
  assert.equal((await get('/healthz')).status,200);
  assert.equal((await get('/admin')).status,200);
  assert.equal((await get('/api/admin/structure')).status,401);
  assert.equal((await get('/관리도구/관리자/API.mjs')).status,403);
  assert.equal((await get('/school-assets/catalog.json')).status,403);
  for(const file of packed.files){
    const response=await get('/'+encodeURI(file),{headers:{'Accept-Encoding':'br'}});
    assert.equal(response.status,200,file);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(path.join(output,file)),file+' byte-exact round trip');
    if(file.endsWith('.jpg'))assert.equal(response.headers.get('content-type'),'image/jpeg');
    if(file.endsWith('.glb'))assert.equal(response.headers.get('content-type'),'model/gltf-binary');
  }
  for(const encoding of ['br','gzip','br;q=0, gzip','br;q=0, gzip;q=0']){
    const response=await get('/'+encodeURI('웹학교/학교구조.json'),{headers:{'Accept-Encoding':encoding}});
    assert.equal(response.headers.get('content-encoding'),encoding==='br'?'br':encoding==='br;q=0, gzip;q=0'?null:'gzip');
    assert((await response.json()).rooms.length>0);
  }
  const head=await get('/'+encodeURI('웹학교/게임.mjs'),{method:'HEAD',headers:{'Accept-Encoding':'br'}});
  assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('vary'),'Accept-Encoding');
  for(const p of ['/.git/config','/.env.local','/Dockerfile','/배포목록.json','/관리도구/웹서버.mjs','/참고자료/배치도.pdf','/사진보관/원본/사진.insp','/모델/school_master.blend','/웹학교/검사/이동검사.mjs','/웹학교/실사목록.json','/사진보관/웹용/4층/6-1_교실_앞_복도.jpg']){
    assert.equal((await get('/'+encodeURI(p.replace(/^\//,'')))).status,403,p);
  }
  assert.equal((await get('/',{method:'POST'})).status,405);
  const report={ok:true,healthcheck:true,privatePathsBlocked:true,postBlocked:true,compression:true,...packed};
  fs.writeFileSync(new URL('공간자료/배포검사.json',root),JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{
  child.kill();await once(child,'exit').catch(()=>{});
  // Only the unique directory created by this test is removed.
  fs.rmSync(temporary,{recursive:true,force:true});
}
