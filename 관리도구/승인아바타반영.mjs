import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../웹학교/캐릭터모델/',import.meta.url),backup=new URL('../모델/백업/아바타-20261026/',import.meta.url);
fs.mkdirSync(backup,{recursive:true});
const names=[...Array.from({length:7},(_,i)=>({release:`teacher-6-${i+1}.glb`,local:`6-${i+1}-담임선생님.glb`,edit:i>=5})),{release:'science.glb',local:'과학선생님.glb'},{release:'principal.glb',local:'교장선생님-귀여운.glb'}];
const digest=b=>createHash('sha256').update(b).digest('hex');const records=[];
for(const n of names){
 const original=new URL('검토-20261025/'+n.release,root),source=n.edit?new URL('검토-20261025/'+n.release.replace('.glb','-edited.glb'),root):original,target=new URL(n.local,root),saved=new URL(n.local,backup);
 const bytes=fs.readFileSync(source);if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(8)!==bytes.length)throw Error('Invalid GLB '+n.local);
 if(!fs.existsSync(saved))fs.copyFileSync(target,saved);
 fs.copyFileSync(source,target);records.push({file:n.local,releaseAsset:n.release,sourceSHA256:digest(fs.readFileSync(original)),sha256:digest(bytes),bytes:bytes.length,edit:n.edit?(n.local.startsWith('6-6')?'긴 생머리만 수정; 얼굴·의상 유지':'이전 정장·구두 형상 활용; 새 얼굴·머리·손 유지'):'승인 원본 바이트 그대로'});
}
const report={release:'teacher-models-20261025',schoolBaseline:'9cfeca3',date:'2026-10-26',models:records};
fs.writeFileSync(new URL('../공간자료/아바타통합-20261026.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
