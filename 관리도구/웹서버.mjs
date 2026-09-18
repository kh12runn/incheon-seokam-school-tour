import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createAdminAPI} from './관리자/API.mjs';
const root=path.resolve(process.env.SCHOOL_WEB_ROOT??path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const manifest=path.join(root,'배포목록.json');
const publicFiles=fs.existsSync(manifest)?new Set(JSON.parse(fs.readFileSync(manifest,'utf8'))):null;
const deployed=process.env.PORT!==undefined,host=deployed?'0.0.0.0':'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.txt':'text/plain; charset=utf-8','.blend':'application/octet-stream','.csv':'text/csv; charset=utf-8'};
const adminAPI=createAdminAPI({root});
const server=http.createServer(async(req,res)=>{
  try{
    if(await adminAPI(req,res))return;
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const url=new URL(req.url,'http://localhost');let rel=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
    if(rel==='admin'||rel==='admin/')rel='관리자/index.html';
    if(rel==='healthz'){res.writeHead(200,{'Content-Type':'application/json'});res.end(req.method==='HEAD'?'':JSON.stringify({ok:true}));return;}
    const file=path.resolve(root,rel);
    // Public deployment exposes prepared derivatives, never raw photos or source documents.
    const photo=/^사진보관\/웹용\/4층\/[가-힣0-9_-]+\.jpg$/.test(rel);
    const allowed=publicFiles?publicFiles.has(rel):photo||rel==='index.html'||['관리자/index.html','관리자/관리자.css','관리자/관리자.mjs'].includes(rel)||rel==='모델/school_master.blend'||rel==='공간자료/촬영폴더_목록.csv'||rel.startsWith('웹학교/')||rel.startsWith('결과물/미리보기/');
    if(!allowed||!file.startsWith(root+path.sep)||rel.includes('..')||rel.includes('\\')||!types[path.extname(file)]){res.writeHead(403);res.end('Access denied');return;}
    if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
    const accepted=new Map((req.headers['accept-encoding']??'').split(',').map(item=>{
      const [name,...params]=item.trim().split(';'),q=params.find(p=>p.trim().startsWith('q='));
      return [name, q?Number(q.trim().slice(2)):1];
    }));
    const encoding=['br','gzip'].filter(e=>(accepted.get(e)??accepted.get('*')??0)>0&&fs.existsSync(file+(e==='br'?'.br':'.gz')))
      .sort((a,b)=>(accepted.get(b)??accepted.get('*')??0)-(accepted.get(a)??accepted.get('*')??0))[0];
    const served=encoding?file+(encoding==='br'?'.br':'.gz'):file;
    if(rel.startsWith('관리자/')){res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");res.setHeader('Referrer-Policy','same-origin');}
    res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','Vary':'Accept-Encoding','X-Content-Type-Options':'nosniff','Content-Length':fs.statSync(served).size,...(encoding?{'Content-Encoding':encoding}:{})});
    if(req.method==='HEAD')res.end();else fs.createReadStream(served).pipe(res);
  }catch{res.writeHead(400);res.end('Bad request');}
});
let port=Number(process.env.PORT||process.env.SCHOOL_WEB_PORT||8080);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid server port');
server.on('error',e=>{if(!deployed&&e.code==='EADDRINUSE'&&port<8090){port++;server.listen(port,host);}else{console.error(e);process.exitCode=1;}});
server.on('listening',()=>{
  const url='http://127.0.0.1:'+port+'/';console.log('석암초등학교 웹 3D: '+url+' (종료: Ctrl+C)');
  if(process.argv.includes('--open')&&process.platform==='win32')spawn('explorer.exe',[url],{windowsHide:true,detached:true,stdio:'ignore'}).unref();
});
server.listen(port,host);
