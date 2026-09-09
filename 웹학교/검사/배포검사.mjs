import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),port=18081;
const child=spawn(process.execPath,[fileURLToPath(new URL('관리도구/웹서버.mjs',root))],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
try{
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw new Error('Server exited');}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Startup timeout')),10000).unref())]);
  const get=p=>fetch('http://127.0.0.1:'+port+p);
  for(const p of ['/','/healthz','/'+encodeURI('웹학교/게임.mjs')])assert.equal((await get(p)).status,200,p);
  const manifest=await (await get('/'+encodeURI('웹학교/실사목록.json'))).json();
  assert.equal(manifest.photos.length,9);
  for(const photo of manifest.photos){const response=await get('/'+encodeURI(photo.url.replace(/^\.\//,'')));assert.equal(response.status,200,photo.name);assert.equal(response.headers.get('content-type'),'image/jpeg');}
  for(const p of ['/.git/config','/.env.local','/Dockerfile','/'+encodeURI('참고자료/배치도.pdf'),'/'+encodeURI('사진보관/원본/사진.insp')])assert.equal((await get(p)).status,403,p);
  assert.equal((await fetch('http://127.0.0.1:'+port,{method:'POST'})).status,405);
  const report={ok:true,healthcheck:true,photos:9,privatePathsBlocked:true,postBlocked:true};
  fs.writeFileSync(new URL('공간자료/배포검사.json',root),JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{child.kill();}
