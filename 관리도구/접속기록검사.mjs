import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {createVisitorRecords} from './접속기록.mjs';

test('고유 브라우저 집계, 한국 날짜 경계, 동시 요청, DB 재시작 보존',async t=>{
 const root=fileURLToPath(new URL('../output/',import.meta.url));fs.mkdirSync(root,{recursive:true});
 const folder=fs.mkdtempSync(path.join(root,'visitor-counter-test-')),filename=path.join(folder,'visitors.sqlite');
 let now=Date.parse('2026-11-12T14:59:59Z');const servers=[];
 async function serve(options={}){
  const api=createVisitorRecords({filename,production:true,origin:'https://school.test',now:()=>now,...options});
  const server=http.createServer(async(req,res)=>{if(!await api(req,res)){res.writeHead(404);res.end();}});
  server.listen(0,'127.0.0.1');await once(server,'listening');servers.push({server,api});
  return {url:`http://127.0.0.1:${server.address().port}`,close:async()=>{server.close();await once(server,'close');api.close();servers.splice(servers.findIndex(s=>s.server===server),1);}};
 }
 t.after(async()=>{for(const {server,api} of servers){server.close();await once(server,'close');api.close();}
  const target=path.resolve(folder);assert(target.startsWith(path.resolve(root)+path.sep));fs.rmSync(target,{recursive:true,force:true});});
 let app=await serve();
 async function visit(cookie='',base=app.url,headers={}){return fetch(base+'/api/visitors/visit',{method:'POST',headers:{Origin:'https://school.test',Cookie:cookie,...headers}});}
 const stats=async()=>await(await fetch(app.url+'/api/visitors')).json();
 const initial=await stats();assert.equal(initial.today,0);assert.equal(initial.total,0);
 const first=await visit();assert.equal(first.status,200);const setCookie=first.headers.get('set-cookie'),cookie=setCookie.split(';')[0];
 assert.match(setCookie,/__Host-school_visitor=/);for(const attr of ['HttpOnly','Secure','SameSite=Lax','Path=/'])assert(setCookie.includes(attr));
 assert.equal((await first.json()).total,1);
 for(const response of await Promise.all(Array.from({length:8},()=>visit(cookie))))assert.equal((await response.json()).today,1);
 await visit(cookie);assert.equal((await stats()).total,1,'Refresh must not increment TOTAL');
 await visit();assert.equal((await stats()).today,2);assert.equal((await stats()).total,2);
 assert.equal((await visit(cookie,app.url,{Origin:'https://evil.test'})).status,403);
 assert.equal((await fetch(app.url+'/api/visitors/visit')).status,405);assert.equal((await stats()).total,2,'Read-only requests never count');
 now+=2000;const midnight=await stats();assert.equal(midnight.date,'2026-11-13');assert.equal(midnight.today,0);assert.equal(midnight.total,2);
 await visit(cookie);assert.equal((await stats()).today,1);assert.equal((await stats()).total,2,'Returning browser on a new day is not a new total visitor');
 const saved=await stats();await app.close();app=await serve();assert.deepEqual(await stats(),saved,'Restart must preserve counts and start date');
 const second=await serve();await Promise.all([visit(cookie),visit(cookie,second.url)]);assert.deepEqual(await stats(),saved,'Concurrent instances must deduplicate');
 const unavailable=await serve({filename:undefined});assert.equal((await fetch(unavailable.url+'/api/visitors')).status,503,'No ephemeral production fallback');
 const {DatabaseSync}=await import('node:sqlite'),db=new DatabaseSync(filename);
 const rows=db.prepare('SELECT * FROM visitors').all();assert.equal(rows.length,2);assert(rows.every(r=>/^[a-f0-9]{64}$/.test(r.id)));assert.equal(db.prepare('SELECT COUNT(*) AS count FROM visitor_days').get().count,2);db.close();
});
