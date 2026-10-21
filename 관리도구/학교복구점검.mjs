import fs from 'node:fs';
import {runtimeFiles} from './배포최적화.mjs';
import {buildWorld} from '../웹학교/이동물리.mjs';
// Read-only production comparison. A 403 denotes an asset not published by the
// old runtime allowlist, not proof that a repository file has been deleted.
const files=runtimeFiles().filter(f=>/\.(mjs|json|html)$/.test(f)&&!f.includes('외부도구'));
const changes=[];
const normalize=(f,s)=>f.endsWith('.json')?JSON.stringify(JSON.parse(s)):s.replaceAll('\r\n','\n');
for(let i=0;i<files.length;i+=5)await Promise.all(files.slice(i,i+5).map(async file=>{
  const r=await fetch('https://tour.seokam.es.kr/'+encodeURI(file),{signal:AbortSignal.timeout(30000)}),remote=await r.text(),local=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  if(!r.ok||normalize(file,local)!==normalize(file,remote))changes.push({file,status:r.status,localBytes:Buffer.byteLength(local),remoteBytes:Buffer.byteLength(remote)});
}));
const w=buildWorld(JSON.parse(fs.readFileSync(new URL('../웹학교/학교구조.json',import.meta.url))));
const rooms=[w.classroom64,...w.classroomInteriors,...w.specialInteriors].filter(Boolean).map(c=>({id:c.roomId??c.room?.id,name:c.room?.name??w.data.rooms.find(r=>r.id===c.roomId)?.name,boxes:c.boxes?.length??0,photos:c.photoCount??c.profile?.photoCount??c.reference?.photoCount,sourceRevision:c.profile?.sourceRevision??c.reference?.revision}));
console.log(JSON.stringify({checkedAt:new Date().toISOString(),basis:'local latest main; recover only teacher models from direct Railway deployment',compared:files.length,unpublishedFiles:changes.filter(c=>c.status!==200).length,changes,localRooms:rooms},null,2));
