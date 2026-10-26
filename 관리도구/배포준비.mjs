import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {runtimeFiles,serverFiles} from './배포최적화.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
fs.mkdirSync(path.join(root,'output'),{recursive:true});
const output=fs.mkdtempSync(path.join(root,'output','production-'+commit.slice(0,12)+'-'));
const manifest=JSON.parse(execFileSync('git',['cat-file','blob',commit+':공간자료/아바타통합-20261026.json'],{cwd:root,encoding:'utf8'}));
const deferred=new Set(manifest.models.map(m=>'웹학교/캐릭터모델/'+m.file));
const files=[...new Set([...runtimeFiles().filter(f=>!deferred.has(f)),...serverFiles,'관리도구/배포최적화.mjs','관리도구/배포모델복원.mjs','공간자료/아바타통합-20261026.json','Dockerfile','railway.toml','.dockerignore'])];
// No untracked authoring files, photos, credentials or working-copy-only edits.
// Windows tar may decode Korean paths using the active ANSI locale. Read each
// immutable Git blob directly, with no text decoding or filename conversion.
for(const file of files){const target=path.join(output,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,execFileSync('git',['cat-file','blob',commit+':'+file],{cwd:root,maxBuffer:100*1024*1024,windowsHide:true}));}
for(const file of files)if(!fs.existsSync(path.join(output,file)))throw Error('Missing committed deployment file: '+file);
// Bind deferred files to this exact snapshot, including later avatar corrections.
fs.writeFileSync(path.join(output,'공간자료/아바타통합-20261026.json'),JSON.stringify({...manifest,sourceCommit:commit},null,2)+'\n');
console.log(JSON.stringify({commit,output,files:files.length,deferredModels:deferred.size,source:'committed runtime; immutable SHA256-verified models restored at build time'},null,2));
