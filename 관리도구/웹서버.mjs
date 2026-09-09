import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const deployed=process.env.PORT!==undefined,host=deployed?'0.0.0.0':'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.txt':'text/plain; charset=utf-8','.blend':'application/octet-stream','.csv':'text/csv; charset=utf-8'};
const server=http.createServer((req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const url=new URL(req.url,'http://localhost');let rel=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
    if(rel==='healthz'){res.writeHead(200,{'Content-Type':'application/json'});res.end(req.method==='HEAD'?'':JSON.stringify({ok:true}));return;}
    const file=path.resolve(root,rel);
    // Public deployment exposes prepared derivatives, never raw photos or source documents.
    const photo=/^사진보관\/웹용\/4층\/[가-힣0-9_-]+\.jpg$/.test(rel);
    const allowed=photo||rel==='index.html'||rel==='모델/school_master.blend'||rel==='공간자료/촬영폴더_목록.csv'||rel.startsWith('웹학교/')||rel.startsWith('결과물/미리보기/');
    if(!allowed||!file.startsWith(root+path.sep)||rel.includes('..')||rel.includes('\\')||!types[path.extname(file)]){res.writeHead(403);res.end('Access denied');return;}
    if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Length':fs.statSync(file).size});
    if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
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
