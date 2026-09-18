import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {once} from 'node:events';
import {createAdminAPI} from '../../관리도구/관리자/API.mjs';
import {GithubStore,CATALOG} from '../../관리도구/관리자/저장소.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZioAAAAASUVORK5CYII=','base64');
const hash=s=>createHash('sha1').update(s).digest('hex');
// Contract-level fake GitHub: the real REST adapter runs against this endpoint
// implementation, including immutable Git trees and non-fast-forward conflicts.
export class FakeGithub {
  constructor(){this.blobs=new Map();this.trees=new Map([['initial-tree',{}]]);this.commits=new Map([['initial',{tree:{sha:'initial-tree'},parents:[]}]]);this.head='initial';this.private=true;this.conflict=false;this.failBlob=false;this.publishCount=0;}
  async fetch(url,options){
    assert(options.headers.Authorization.startsWith('Bearer '));
    const u=new URL(url),route=decodeURIComponent(u.pathname.replace('/repos/test-owner/test-repo','')),body=options.body?JSON.parse(options.body):null;
    const out=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
    if(!route)return out({private:this.private});
    if(route.startsWith('/git/ref/heads/'))return out({object:{sha:this.head}});
    if(route.startsWith('/git/commits/')&&!body)return out(this.commits.get(route.split('/').pop()));
    if(route.startsWith('/contents/')){
      const files=this.trees.get(this.commits.get(u.searchParams.get('ref')).tree.sha),sha=files[route.slice(10)],bytes=this.blobs.get(sha);if(!bytes)return out({},404);
      return options.headers.Accept.includes('raw')?new Response(bytes):out({content:bytes.toString('base64'),size:bytes.length});
    }
    if(route==='/git/blobs'){
      if(this.failBlob){this.failBlob=false;return out({},503);}
      const bytes=Buffer.from(body.content,body.encoding==='base64'?'base64':'utf8'),sha=hash(bytes);this.blobs.set(sha,bytes);return out({sha},201);
    }
    if(route==='/git/trees'){
      assert(body.base_tree,'Must preserve unrelated repository files');const files={...this.trees.get(body.base_tree)};for(const f of body.tree){assert(f.path.startsWith('school-assets/'));files[f.path]=f.sha;}
      const sha=hash(JSON.stringify(files));this.trees.set(sha,files);return out({sha},201);
    }
    if(route==='/git/commits'){
      const sha=hash(JSON.stringify(body));this.commits.set(sha,{tree:{sha:body.tree},parents:body.parents});return out({sha},201);
    }
    if(route.startsWith('/git/refs/heads/')){
      assert.equal(body.force,false);
      if(this.conflict){this.conflict=false;const head='parallel-'+this.publishCount;this.commits.set(head,{...this.commits.get(this.head),parents:[this.head]});this.head=head;return out({},422);}
      if(this.commits.get(body.sha).parents[0]!==this.head)return out({},422);
      this.head=body.sha;this.publishCount++;return out({object:{sha:this.head}});
    }
    throw new Error('Unexpected GitHub route '+route);
  }
  catalog(){const files=this.trees.get(this.commits.get(this.head).tree.sha);return files[CATALOG]?JSON.parse(this.blobs.get(files[CATALOG])):{rooms:{}};}
}
const token=()=>randomBytes(24).toString('hex');
const env={ADMIN_PASSWORD:token(),OWNER_APPROVAL_PASSWORD:token(),SESSION_SECRET:token(),GITHUB_TOKEN:token(),GITHUB_OWNER:'test-owner',GITHUB_REPO:'test-repo',GITHUB_BRANCH:'photo-assets',MAX_UPLOAD_MB:'1'};
const gh=new FakeGithub(),store=new GithubStore(env,gh.fetch.bind(gh));let time=Date.now();
const handler=createAdminAPI({root,env,store,now:()=>time});
const server=http.createServer(async(req,res)=>{
  if(await handler(req,res))return;
  // Test UI server only: never part of the Docker/runtime output.
  const u=new URL(req.url,'http://localhost');let rel=decodeURIComponent(u.pathname).slice(1);if(rel==='admin')rel='관리자/index.html';
  if(!['관리자/index.html','관리자/관리자.css','관리자/관리자.mjs'].includes(rel)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',rel.endsWith('.mjs')?'text/javascript':rel.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,rel)));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
if(process.argv.includes('--serve')){console.log(JSON.stringify({origin,adminPassword:env.ADMIN_PASSWORD,ownerPassword:env.OWNER_APPROVAL_PASSWORD}));}
else{
  let cookie='',csrf='';const results=[];
  async function req(route,body,extra={}){
    const response=await fetch(origin+route,{method:body!==undefined?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body!==undefined?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...extra.headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
    const text=await response.text();return {response,status:response.status,data:text?JSON.parse(text):{}};
  }
  async function upload(name='same.png',bytes=png,mime='image/png',extra={}){
    const response=await fetch(origin+'/api/admin/upload?roomId=4F_2-1',{method:'POST',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,'Content-Type':mime,'X-File-Name':encodeURIComponent(name),...extra},body:bytes});
    return {status:response.status,data:await response.json()};
  }
  try{
    assert.equal((await req('/api/admin/structure')).status,401);
    assert.equal((await upload()).status,401);results.push('unauthenticated blocked');
    assert.equal((await req('/api/admin/login',{password:'wrong'})).status,401);
    assert.equal((await req('/api/admin/login',{password:env.ADMIN_PASSWORD},{headers:{Origin:'https://evil.invalid'}})).status,403);
    const login=await req('/api/admin/login',{password:env.ADMIN_PASSWORD});assert.equal(login.status,200);cookie=login.response.headers.get('set-cookie').split(';')[0];csrf=login.data.csrf;
    assert(login.response.headers.get('set-cookie').includes('HttpOnly'));assert(login.response.headers.get('set-cookie').includes('SameSite=Strict'));
    assert(!JSON.stringify(login.data).includes(env.ADMIN_PASSWORD));results.push('login + secure session + CSRF');
    const structure=await req('/api/admin/structure');assert.equal(structure.status,200);assert.deepEqual(structure.data.buildings[1].floors,[1,2,3,4]);assert(structure.data.rooms.some(r=>r.roomId==='4F_2-1'));
    assert.equal((await upload('same.png',png,'image/png',{'X-CSRF-Token':'bad'})).status,403);
    assert.equal((await upload('../bad.png')).status,400);assert.equal((await upload('bad.svg',Buffer.from('<svg/>'),'image/svg+xml')).status,415);
    assert.equal((await upload('bad.jpg',png,'image/jpeg')).status,415);assert.equal((await upload('large.png',Buffer.alloc(1024*1024+1))).status,413);results.push('path, extension, MIME, magic, size validation');
    const first=await upload();assert.equal(first.status,201);const firstId=first.data.id;
    assert.equal((await req('/api/admin/approve',{roomId:'4F_2-1'})).status,403);
    const pending=await req('/api/admin/pending');assert.equal(pending.data.rooms.length,1);assert.equal(pending.data.rooms[0].status,'pending');
    assert.equal((await req('/api/rooms/4F_2-1/assets')).data.assets.length,0);
    assert.equal((await fetch(origin+'/api/rooms/4F_2-1/assets/'+firstId)).status,404);results.push('atomic photo + manifest + pending; private before approval');
    assert.equal((await req('/api/admin/owner-login',{password:'wrong'})).status,401);
    assert.equal((await req('/api/admin/owner-login',{password:env.OWNER_APPROVAL_PASSWORD})).status,200);
    let r=gh.catalog().rooms['4F_2-1'];const revision=r.revision;
    assert.equal((await req('/api/admin/approve',{roomId:r.roomId,revision,privacyConfirmed:false})).status,400);
    gh.conflict=true;
    assert.equal((await req('/api/admin/approve',{roomId:r.roomId,revision,privacyConfirmed:true})).status,200);
    assert.equal((await req('/api/rooms/4F_2-1/assets')).data.assets.length,1);
    const approvedImage=await fetch(origin+'/api/rooms/4F_2-1/assets/'+firstId);assert.equal(approvedImage.status,200);assert.deepEqual(Buffer.from(await approvedImage.arrayBuffer()),png);
    const multi=await Promise.all([upload(),upload()]);assert(multi.some(r=>r.status===201));assert(multi.every(r=>[201,429].includes(r.status)));
    assert.equal((await upload()).status,201);r=gh.catalog().rooms['4F_2-1'];assert.equal(new Set(r.images.map(i=>i.file)).size,r.images.length);assert.equal((await req('/api/rooms/4F_2-1/assets')).data.assets.length,1);
    assert.equal((await req('/api/admin/approve',{roomId:r.roomId,revision,privacyConfirmed:true})).status,409);
    const count=r.images.length;gh.failBlob=true;assert.equal((await upload()).status,503);assert.equal(gh.catalog().rooms['4F_2-1'].images.length,count);assert.equal((await upload()).status,201);results.push('owner approval, stale revision, CAS retry, duplicate filenames, bounded concurrency, partial failure recovery');
    r=gh.catalog().rooms['4F_2-1'];assert.equal((await req('/api/admin/approve',{roomId:r.roomId,revision:r.revision,privacyConfirmed:true})).status,200);
    r=gh.catalog().rooms['4F_2-1'];assert.equal((await req('/api/admin/status',{roomId:r.roomId,revision:r.revision,status:'in_progress'})).status,200);
    r=gh.catalog().rooms['4F_2-1'];assert.equal((await req('/api/admin/status',{roomId:r.roomId,revision:r.revision,status:'completed'})).status,200);
    const add=await req('/api/admin/rooms',{action:'add',name:'추가 촬영 공간',building:'MAIN',floor:2});assert.equal(add.status,200);
    const rename=await req('/api/admin/rooms',{action:'rename',roomId:add.data.room.roomId,revision:add.data.room.revision,name:'새 특별실'});assert.equal(rename.status,200);
    assert.equal((await req('/api/admin/rooms',{action:'archive',roomId:rename.data.room.roomId,revision:rename.data.room.revision})).status,200);
    gh.private=false;assert.equal((await upload()).status,503);gh.private=true;results.push('workflow + room management + public repository refused');
    assert.equal((await req('/api/admin/logout',{})).status,200);assert.equal((await req('/api/admin/structure')).status,401);
    const again=await req('/api/admin/login',{password:env.ADMIN_PASSWORD});cookie=again.response.headers.get('set-cookie').split(';')[0];time+=4*60*60*1000+1;assert.equal((await req('/api/admin/structure')).status,401);
    for(let i=0;i<11;i++)await req('/api/admin/login',{password:'wrong'});assert.equal((await req('/api/admin/login',{password:'wrong'})).status,429);results.push('logout + expiration + brute-force rate limit');
    const prodHandler=createAdminAPI({root,env:{...env,NODE_ENV:'production',ADMIN_ORIGIN:'https://school.example'},store});
    const prod=http.createServer((req,res)=>prodHandler(req,res));await new Promise(resolve=>prod.listen(0,'127.0.0.1',resolve));
    try{
      const response=await fetch(`http://127.0.0.1:${prod.address().port}/api/admin/login`,{method:'POST',headers:{Origin:'https://school.example','Content-Type':'application/json'},body:JSON.stringify({password:env.ADMIN_PASSWORD})});
      assert.equal(response.status,200);const cookie=response.headers.get('set-cookie');assert(cookie.startsWith('__Host-school_admin='));for(const flag of ['Secure','HttpOnly','SameSite=Strict','Max-Age=14400'])assert(cookie.includes(flag));
      results.push('production HTTPS origin + __Host Secure HttpOnly cookie');
    }finally{prod.closeAllConnections();prod.close();await once(prod,'close');}
    console.log(JSON.stringify({ok:true,github:'real REST adapter against in-memory GitHub contract; no external write',publishedCommits:gh.publishCount,checks:results},null,2));
  }finally{server.closeAllConnections();server.close();await once(server,'close');}
}
