import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {randomBytes,randomUUID,createHmac,createHash,timingSafeEqual} from 'node:crypto';
import {GithubStore,ApiError} from './저장소.mjs';
import {inspectImage} from './이미지검사.mjs';
import {applyGroundFloorPlan} from '../../웹학교/일층배치.mjs';
import {applyRestroomPlan} from '../../웹학교/화장실배치.mjs';
const digest=s=>createHash('sha256').update(String(s)).digest();
const equal=(a,b)=>timingSafeEqual(digest(a),digest(b));
const idOK=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,90}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id);
const cleanName=value=>{
  if(typeof value!=='string')throw new ApiError(400,'이름을 입력해주세요.');
  const text=value.normalize('NFC').trim();if(!text||text.length>100||/[\x00-\x1f\x7f/\\]/.test(text)||text.includes('..'))throw new ApiError(400,'이름에 경로 문자나 제어 문자를 사용할 수 없습니다.');return text;
};
const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});res.end(JSON.stringify(value));};
async function jsonBody(req){
  if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new ApiError(415,'JSON 요청이 필요합니다.');
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8192)throw new ApiError(413,'요청이 너무 큽니다.');chunks.push(chunk);}
  try{const body=JSON.parse(Buffer.concat(chunks).toString());if(!body||typeof body!=='object'||Array.isArray(body))throw 0;return body;}catch{throw new ApiError(400,'올바른 JSON이 아닙니다.');}
}
export function createAdminAPI({root,env=process.env,store=new GithubStore(env),now=Date.now,sessionTTL=4*60*60*1000}={}){
  const data=applyRestroomPlan(applyGroundFloorPlan(JSON.parse(fs.readFileSync(path.join(root,'웹학교/학교구조.json'),'utf8'))));
  const base=data.rooms.filter(r=>['MAIN','ANNEX'].includes(r.building)&&/^[1-4]F$/.test(r.floor)).map(r=>({...r,roomId:r.id,roomName:r.name,custom:false}));
  base.push({id:'5F_MAIN_ROOF',roomId:'5F_MAIN_ROOF',name:'본관 옥상',roomName:'본관 옥상',floor:'5F',building:'MAIN',type:'outdoor',bounds:null,custom:false});
  const sessions=new Map(),rates=new Map(),production=env.NODE_ENV==='production',cookieName=production?'__Host-school_admin':'school_admin';
  const maxUpload=Math.min(25,Math.max(1,Number(env.MAX_UPLOAD_MB)||20))*1024*1024;
  let uploading=false;
  const configured=()=>env.ADMIN_PASSWORD?.length>=12&&env.SESSION_SECRET?.length>=32&&(!production||/^https:\/\//.test(env.ADMIN_ORIGIN??''));
  const signature=s=>createHmac('sha256',env.SESSION_SECRET??'disabled').update(s).digest('hex');
  function cookie(res,sid='',age=0){res.setHeader('Set-Cookie',`${cookieName}=${sid?sid+'.'+signature(sid):''}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${production?'; Secure':''}`);}
  function rate(key,limit,period=60000){
    const time=now();for(const [k,v] of rates)if(v.until<=time)rates.delete(k);
    if(rates.size>10000)throw new ApiError(429,'요청이 많습니다. 잠시 후 다시 시도해주세요.');
    const v=rates.get(key)??{count:0,until:time+period};v.count++;rates.set(key,v);
    if(v.count>limit)throw new ApiError(429,'요청이 많습니다. 잠시 후 다시 시도해주세요.');
  }
  function session(req){
    const raw=(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
    if(!raw||raw.length>180)return null;const [id,sig]=raw.split('.');
    if(!sig||!equal(sig,signature(id)))return null;
    const s=sessions.get(id);if(!s||s.expires<=now()){sessions.delete(id);return null;}return {...s,id,owner:s.ownerUntil>now()};
  }
  function requireSession(req,owner=false){const s=session(req);if(!s)throw new ApiError(401,'관리자 로그인이 필요합니다.');if(owner&&!s.owner)throw new ApiError(403,'소유자 인증이 필요합니다.');return s;}
  function origin(req){
    const expected=env.ADMIN_ORIGIN||(production?'':`http://${req.headers.host}`);
    if(!expected||req.headers.origin!==expected||req.headers['sec-fetch-site']==='cross-site')throw new ApiError(403,'같은 사이트에서 다시 요청해주세요.');
  }
  function rooms(catalog){return [...base,...Object.values(catalog.rooms).filter(r=>r.custom)].map(r=>({...r,...catalog.rooms[r.roomId],id:r.roomId})).filter(r=>!r.archived);}
  function roomFor(catalog,id){if(!idOK(id))throw new ApiError(400,'잘못된 공간 ID입니다.');const r=rooms(catalog).find(r=>r.roomId===id);if(!r)throw new ApiError(404,'공간을 찾을 수 없습니다.');return r;}
  const folder=r=>`school-assets/uploads/${r.building==='MAIN'?'본관':'별관'}/${parseInt(r.floor)}층/${r.roomId}`;
  const changed=(catalog,room,message,files=[])=>{catalog.rooms[room.roomId]=room;return {message,files:[...files,{path:folder(room)+'/manifest.json',content:JSON.stringify(room)}],value:{room}};};
  const publicRoom=r=>({roomId:r.roomId,roomName:r.roomName,building:r.building,floor:r.floor,location:{bounds:r.bounds??null,coordinates:'Blender x/y horizontal, z up'},requiresManualMapping:true,hotspots:[],assets:(r.images??[]).filter(i=>i.approval==='approved').map(i=>({id:i.id,type:i.type,width:i.width,height:i.height,approvedAt:i.approvedAt,url:`/api/rooms/${r.roomId}/assets/${i.id}`}))});
  return async function handle(req,res){
    const url=new URL(req.url,'http://localhost'),route=url.pathname;
    if(!route.startsWith('/api/'))return false;
    try{
      // Railway forwards all requests from its proxy. A global limit is also
      // enforced, so spoofing forwarded IP headers cannot evade brute-force limits.
      const ip=req.socket.remoteAddress??'unknown';rate('all:'+ip,600);if(req.method==='POST')rate('write-global',120);
      if(req.method==='POST')origin(req);
      if(route==='/api/admin/session'&&req.method==='GET'){
        const s=session(req);send(res,200,{configured:!!configured(),authenticated:!!s,owner:!!s?.owner,csrf:s?.csrf??null,maxUploadBytes:maxUpload,expires:s?.expires??null});return true;
      }
      if(route==='/api/admin/login'&&req.method==='POST'){
        rate('login-global',20,15*60000);rate('login:'+ip,10,15*60000);
        if(!configured())throw new ApiError(503,'관리자 환경변수를 아직 설정하지 않았습니다. 학교 탐험은 계속 이용할 수 있습니다.');
        const body=await jsonBody(req);if(typeof body.password!=='string'||!equal(body.password,env.ADMIN_PASSWORD))throw new ApiError(401,'비밀번호가 올바르지 않습니다.');
        for(const [id,s] of sessions)if(s.expires<=now())sessions.delete(id);
        if(sessions.size>=200)throw new ApiError(429,'접속 중인 관리자가 많습니다. 잠시 후 다시 시도해주세요.');
        const old=session(req);if(old)sessions.delete(old.id);
        const id=randomBytes(32).toString('hex'),s={csrf:randomBytes(24).toString('hex'),expires:now()+sessionTTL,ownerUntil:0};sessions.set(id,s);cookie(res,id,Math.floor(sessionTTL/1000));send(res,200,{authenticated:true,csrf:s.csrf,owner:false});return true;
      }
      const publicMatch=route.match(/^\/api\/rooms\/([A-Za-z0-9_-]+)\/assets(?:\/([a-f0-9-]+))?$/);
      if(publicMatch&&req.method==='GET'){
        if(!store.ready()){if(publicMatch[2])throw new ApiError(404,'승인된 사진이 없습니다.');send(res,200,{roomId:publicMatch[1],assets:[],requiresManualMapping:true,hotspots:[]});return true;}
        const snap=await store.snapshot(),r=roomFor(snap.catalog,publicMatch[1]);
        if(!publicMatch[2]){send(res,200,publicRoom(r));return true;}
        const image=(r.images??[]).find(i=>i.id===publicMatch[2]&&i.approval==='approved');if(!image)throw new ApiError(404,'승인된 사진이 없습니다.');
        await serveImage(image,snap.head,res);return true;
      }
      if(!route.startsWith('/api/admin/'))throw new ApiError(404,'API를 찾을 수 없습니다.');
      const s=requireSession(req);
      if(req.method!=='GET'&&(!req.headers['x-csrf-token']||!equal(req.headers['x-csrf-token'],s.csrf)))throw new ApiError(403,'보안 토큰이 만료되었습니다. 새로 로그인해주세요.');
      if(route==='/api/admin/logout'&&req.method==='POST'){sessions.delete(s.id);cookie(res);send(res,200,{ok:true});return true;}
      if(route==='/api/admin/owner-login'&&req.method==='POST'){
        rate('owner-global',10,15*60000);const body=await jsonBody(req);
        if(env.OWNER_APPROVAL_PASSWORD?.length<12||!env.OWNER_APPROVAL_PASSWORD||equal(env.ADMIN_PASSWORD,env.OWNER_APPROVAL_PASSWORD))throw new ApiError(503,'업로드 비밀번호와 다른 소유자 비밀번호(12자 이상)를 설정해주세요.');
        if(typeof body.password!=='string'||!equal(body.password,env.OWNER_APPROVAL_PASSWORD))throw new ApiError(401,'소유자 비밀번호가 올바르지 않습니다.');
        sessions.get(s.id).ownerUntil=now()+30*60000;send(res,200,{owner:true});return true;
      }
      if(['/api/admin/structure','/api/admin/pending'].includes(route)&&req.method==='GET'){
        const snap=await store.snapshot();let list=rooms(snap.catalog).map(r=>({...r,status:r.status??'unshot',images:(r.images??[]).map(i=>({...i,previewUrl:`/api/admin/rooms/${r.roomId}/images/${i.id}`})),existingImplementation:['4F_6-4','4F_6-6','4F_2-1'].includes(r.roomId)||r.name==='교장실'}));
        if(route.endsWith('/pending'))list=list.filter(r=>r.status==='pending');
        send(res,200,{rooms:list,buildings:[{id:'MAIN',name:'본관',floors:[1,2,3,4,5]},{id:'ANNEX',name:'별관',floors:[1,2,3,4]}]});return true;
      }
      const preview=route.match(/^\/api\/admin\/rooms\/([A-Za-z0-9_-]+)\/images\/([a-f0-9-]+)$/);
      if(preview&&req.method==='GET'){
        const snap=await store.snapshot(),r=roomFor(snap.catalog,preview[1]),image=r.images?.find(i=>i.id===preview[2]);if(!image)throw new ApiError(404,'사진을 찾을 수 없습니다.');await serveImage(image,snap.head,res);return true;
      }
      if(route==='/api/admin/upload'&&req.method==='POST'){
        rate('upload-global',60,60000);if(uploading)throw new ApiError(429,'다른 사진을 저장 중입니다. 잠시 후 다시 업로드해주세요.');
        const roomId=url.searchParams.get('roomId');if(!idOK(roomId))throw new ApiError(400,'잘못된 공간입니다.');
        let name;try{name=cleanName(decodeURIComponent(req.headers['x-file-name']??''));}catch{throw new ApiError(400,'파일 이름을 확인해주세요.');}
        if(Number(req.headers['content-length'])>maxUpload)throw new ApiError(413,`파일당 최대 ${maxUpload/1024/1024}MB까지 업로드할 수 있습니다.`);
        uploading=true;let dir;
        try{
          // One in-flight upload only; spool to ephemeral server disk, never the developer PC.
          dir=await fsp.mkdtemp(path.join(os.tmpdir(),'school-upload-'));const file=path.join(dir,'image');const handle=await fsp.open(file,'wx');let size=0;
          const timer=setTimeout(()=>req.destroy(),90000);timer.unref();
          try{for await(const chunk of req){size+=chunk.length;if(size>maxUpload)throw new ApiError(413,'이 파일은 업로드 가능한 최대 크기를 초과했습니다.');await handle.writeFile(chunk);}}finally{clearTimeout(timer);await handle.close();}
          if(!size)throw new ApiError(400,'빈 파일은 업로드할 수 없습니다.');
          const bytes=await fsp.readFile(file),info=inspectImage(bytes,req.headers['content-type']?.split(';')[0],name),id=randomUUID(),uploadedAt=new Date(now()).toISOString();
          const result=await store.mutate(catalog=>{
            const r=roomFor(catalog,roomId);if((r.images?.length??0)>=100)throw new ApiError(409,'공간당 최대 100장입니다. 관리자에게 문의해주세요.');
            const fileName=uploadedAt.replace(/[-:.TZ]/g,'')+'_'+id+'.'+info.extension;
            const image={id,...info,originalName:name,file:folder(r)+'/'+fileName,size,uploadedAt,approval:'pending'};
            const next={...r,status:'pending',revision:randomUUID(),uploadedAt,images:[...(r.images??[]),image]};
            return changed(catalog,next,`사진 업로드: ${r.roomName}`,[{path:image.file,content:bytes}]);
          });send(res,201,{ok:true,id,status:'pending',commit:result.commit,message:'사진이 업로드되었습니다. 3D 구현 승인 대기 상태입니다.'});
        }finally{uploading=false;if(dir){await fsp.rm(path.join(dir,'image'),{force:true});await fsp.rmdir(dir);}}
        return true;
      }
      if(route==='/api/admin/approve'&&req.method==='POST'){
        requireSession(req,true);const body=await jsonBody(req);
        if(body.privacyConfirmed!==true)throw new ApiError(400,'인물·개인정보 확인에 동의해주세요.');
        const result=await store.mutate(catalog=>{
          const r=roomFor(catalog,body.roomId);if(body.revision!==r.revision)throw new ApiError(409,'사진 목록이 바뀌었습니다. 새로 확인한 후 승인해주세요.');
          if(!(r.images??[]).some(i=>i.approval==='pending'))throw new ApiError(409,'승인 대기 사진이 없습니다.');
          const approvedAt=new Date(now()).toISOString(),next={...r,status:'approved',approvedAt,revision:randomUUID(),images:r.images.map(i=>i.approval==='pending'?{...i,approval:'approved',approvedAt}:i)};
          return changed(catalog,next,`소유자 승인: ${r.roomName}`);
        });send(res,200,result);return true;
      }
      if(route==='/api/admin/status'&&req.method==='POST'){
        requireSession(req,true);const body=await jsonBody(req);if(!['in_progress','completed','approved'].includes(body.status))throw new ApiError(400,'잘못된 상태입니다.');
        const result=await store.mutate(catalog=>{const r=roomFor(catalog,body.roomId);if(r.status==='pending'||!r.approvedAt||body.revision!==r.revision)throw new ApiError(409,'승인된 최신 사진 목록에서만 변경할 수 있습니다.');return changed(catalog,{...r,status:body.status,revision:randomUUID()},`구현 상태 변경: ${r.roomName}`);});send(res,200,result);return true;
      }
      if(route==='/api/admin/rooms'&&req.method==='POST'){
        const body=await jsonBody(req);if(body.action!=='add')requireSession(req,true);
        const result=await store.mutate(catalog=>{
          if(body.action==='add'){
            const name=cleanName(body.name);if(!['MAIN','ANNEX'].includes(body.building)||!Number.isInteger(body.floor)||body.floor<1||body.floor>(body.building==='MAIN'?5:4))throw new ApiError(400,'건물과 층을 확인해주세요.');
            if(Object.keys(catalog.rooms).length>400)throw new ApiError(409,'추가 공간이 너무 많습니다.');
            const id='custom_'+randomUUID().replaceAll('-','');return changed(catalog,{roomId:id,id,roomName:name,name,building:body.building,floor:body.floor+'F',type:'special_room',bounds:null,custom:true,status:'unshot',images:[],revision:randomUUID()},'사진 관리 공간 추가');
          }
          const r=roomFor(catalog,body.roomId);if(r.revision!==body.revision)throw new ApiError(409,'목록이 변경되었습니다.');
          if(body.action==='rename')return changed(catalog,{...r,roomName:cleanName(body.name),revision:randomUUID()},'사진 관리 공간 이름 변경');
          if(body.action==='archive'&&r.custom&&!r.images?.length)return changed(catalog,{...r,archived:true,revision:randomUUID()},'빈 추가 공간 보관');
          throw new ApiError(400,'기존 공간과 사진이 있는 공간은 삭제할 수 없습니다.');
        });send(res,200,result);return true;
      }
      throw new ApiError(404,'API를 찾을 수 없습니다.');
    }catch(error){
      if(res.headersSent){res.destroy();return true;}
      if(error.status===429)res.setHeader('Retry-After','60');
      send(res,error.status>=400&&error.status<600?error.status:500,{error:error instanceof ApiError?error.message:'처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'});return true;
    }
  };
  async function serveImage(image,head,res){
    if(!image.file.startsWith('school-assets/uploads/')||image.file.includes('..')||image.file.includes('\\'))throw new ApiError(400,'잘못된 사진 경로입니다.');
    const upstream=await store.image(image.file,head);
    res.writeHead(200,{'Content-Type':image.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; sandbox"});
    const stream=Readable.fromWeb(upstream.body);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }
}
