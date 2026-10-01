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
for(const rel of ['관리도구/관리자/사진변환.mjs','관리도구/관리자/이미지정책/policy.xml'])assert(fs.existsSync(path.join(output,rel)),'Phone converter runtime dependency: '+rel);
assert(!packed.files.some(p=>/사진보관|미리보기|검사/.test(p)||p.startsWith('모델/')||p==='웹학교/실사목록.json'||p.startsWith('웹학교/실사/')),'Only current game runtime');
const approvedModels=['교장선생님-귀여운','교장선생님-머리','남학생-귀여운','여학생-귀여운'].map(name=>'웹학교/캐릭터모델/'+name+'.glb');
assert.deepEqual(packed.files.filter(p=>p.endsWith('.glb')).sort(),approvedModels.sort(),'Only the office principal, shared runner head, and two student models');
assert(packed.files.includes('웹학교/교실별특징.mjs'));
for(const file of ['운전물리.mjs','운전화면.mjs','운전.css','외부도구/car-front.svg','외부도구/lucide-LICENSE.txt'])assert(packed.files.includes('웹학교/'+file),'Driving runtime included: '+file);
for(const file of ['자동차표현.mjs','숙직실사진배치.mjs','지원실사진표현.mjs','야외풍경.mjs','운동장환경.mjs','축구공물리.mjs','축구공표현.mjs','외부도구/cannon-es.mjs','외부도구/cannon-es-LICENSE.txt'])assert(packed.files.includes('웹학교/'+file),'Outdoor interaction runtime included: '+file);
for(const file of ['개별학습실사진배치.mjs','개별학습실사진표현.mjs'])assert(packed.files.includes('웹학교/'+file),'Individual learning room runtime included: '+file);
for(const file of ['보건실사진배치.mjs','보건실사진표현.mjs'])assert(packed.files.includes('웹학교/'+file),'Nurse room runtime included: '+file);
for(const file of ['교무실사진배치.mjs','교무실사진표현.mjs','교장실연결문.mjs','교장실연결문표현.mjs','교사자리와창팻말.mjs','교사자리와창팻말표현.mjs'])assert(packed.files.includes('웹학교/'+file),'Staff office, door and classroom furnishings included: '+file);
for(const file of ['업로드교실관찰.mjs','업로드교실배치.mjs','업로드교실표현.mjs'])assert(packed.files.includes('웹학교/'+file),'Uploaded classroom runtime included: '+file);
for(const file of ['방송실사진배치.mjs','방송실사진표현.mjs'])assert(packed.files.includes('웹학교/'+file),'Broadcast room runtime included: '+file);
for(const file of ['방송조정실배치.mjs','방송조정실표현.mjs'])assert(packed.files.includes('웹학교/'+file),'Control room runtime included: '+file);
for(const file of ['운영위원회회의실.mjs','운영위원회회의실표현.mjs','시청각실사진배치.mjs','시청각실사진표현.mjs','중앙계단사진마감.mjs','중앙계단사진표현.mjs'])assert(packed.files.includes('웹학교/'+file),'Photo-reference interior runtime included: '+file);
for(const file of ['지하층배치.mjs','다목적실표현.mjs','정문지형.mjs','외부도구/Reflector.js','삼학년사반.mjs','삼학년사반표현.mjs'])assert(packed.files.includes('웹학교/'+file),'New school runtime included: '+file);
for(const file of ['월영어퀴즈.mjs','월영어퀴즈화면.mjs','월영어퀴즈.css','교장선생님산책.mjs','교장보행리그.mjs'])assert(packed.files.includes('웹학교/'+file),'NPC asset included: '+file);
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
    if(file.endsWith('.svg'))assert.equal(response.headers.get('content-type'),'image/svg+xml');
    if(file.endsWith('.glb')){
      assert.equal(response.headers.get('content-type'),'model/gltf-binary');
      assert.equal(response.headers.get('content-encoding'),'br');
      assert(Number(response.headers.get('content-length'))<fs.statSync(path.join(output,file)).size,'Lossless GLB transfer saving');
    }
    const tag=response.headers.get('etag');assert.ok(tag);
    const cached=await get('/'+encodeURI(file),{headers:{'Accept-Encoding':'br','If-None-Match':tag}});
    assert.equal(cached.status,304);assert.equal(await cached.text(),'');
  }
  for(const encoding of ['br','gzip','br;q=0, gzip','br;q=0, gzip;q=0']){
    const response=await get('/'+encodeURI('웹학교/학교구조.json'),{headers:{'Accept-Encoding':encoding}});
    assert.equal(response.headers.get('content-encoding'),encoding==='br'?'br':encoding==='br;q=0, gzip;q=0'?null:'gzip');
    assert((await response.json()).rooms.length>0);
  }
  const head=await get('/'+encodeURI('웹학교/게임.mjs'),{method:'HEAD',headers:{'Accept-Encoding':'br'}});
  const changed=await get('/'+encodeURI('웹학교/게임.mjs'),{headers:{'If-None-Match':'"old-deployment"'}});assert.equal(changed.status,200);
  const identity=await get('/'+encodeURI('웹학교/게임.mjs'),{headers:{'Accept-Encoding':'identity','If-None-Match':head.headers.get('etag')}});assert.equal(identity.status,200);assert.notEqual(identity.headers.get('etag'),head.headers.get('etag'));
  assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('vary'),'Accept-Encoding');
  for(const p of ['/.git/config','/.env.local','/Dockerfile','/배포목록.json','/관리도구/웹서버.mjs','/관리도구/관리자/사진변환.mjs','/관리도구/관리자/이미지정책/policy.xml','/참고자료/배치도.pdf','/사진보관/원본/사진.insp','/모델/school_master.blend','/웹학교/검사/이동검사.mjs','/웹학교/실사목록.json','/사진보관/웹용/4층/6-1_교실_앞_복도.jpg']){
    assert.equal((await get('/'+encodeURI(p.replace(/^\//,'')))).status,403,p);
  }
  assert.equal((await get('/',{method:'POST'})).status,405);
  const report={ok:true,healthcheck:true,privatePathsBlocked:true,postBlocked:true,compression:true,losslessModels:true,cacheRevalidation:true,...packed};
  fs.writeFileSync(new URL('공간자료/배포검사.json',root),JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{
  child.kill();await once(child,'exit').catch(()=>{});
  // Only the unique directory created by this test is removed.
  fs.rmSync(temporary,{recursive:true,force:true});
}
