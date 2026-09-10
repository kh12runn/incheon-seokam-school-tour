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
assert(!packed.files.some(p=>/사진보관|모델|미리보기|실사|검사/.test(p)),'Only current game runtime');
assert(packed.files.includes('웹학교/교실별특징.mjs'));
assert(packed.compressedTransferBytes<packed.sourceBytes*.3,'At least 70% transfer savings');
const child=spawn(process.execPath,[fileURLToPath(new URL('관리도구/웹서버.mjs',root))],{env:{...process.env,PORT:String(port),SCHOOL_WEB_ROOT:output},stdio:['ignore','pipe','pipe']});
try{
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw new Error('Server exited');}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Startup timeout')),10000).unref())]);
  const get=(p,options)=>fetch('http://127.0.0.1:'+port+p,options);
  assert.equal((await get('/healthz')).status,200);
  for(const file of packed.files){
    const response=await get('/'+encodeURI(file),{headers:{'Accept-Encoding':'br'}});
    assert.equal(response.status,200,file);
    assert.equal(await response.text(),fs.readFileSync(path.join(output,file),'utf8'),file+' compressed round trip');
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
