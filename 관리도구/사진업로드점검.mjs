// Read-only remote audit. Private catalog snapshots remain in ignored 참고자료.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const response=JSON.parse(execFileSync('gh',['api','repos/kh12runn/incheon-seokam-school-photos/contents/school-assets/catalog.json?ref=main'],{encoding:'utf8',maxBuffer:8*1024*1024}));
const catalog=JSON.parse(Buffer.from(response.content,'base64'));
const target=path.join(root,'참고자료','업로드점검-20261002');
fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,'catalog.json'),JSON.stringify(catalog,null,2));
console.log(JSON.stringify({catalogSha:response.sha,spaces:Object.keys(catalog.rooms).length,photos:Object.values(catalog.rooms).reduce((n,r)=>n+r.images.length,0),snapshot:target}));
