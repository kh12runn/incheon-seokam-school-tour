import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {runtimeFiles,serverFiles} from './배포최적화.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
fs.mkdirSync(path.join(root,'output'),{recursive:true});
const output=fs.mkdtempSync(path.join(root,'output','production-'+commit.slice(0,12)+'-'));
const files=[...new Set([...runtimeFiles(),...serverFiles,'관리도구/배포최적화.mjs','Dockerfile','railway.toml','.dockerignore'])];
// No untracked authoring files, photos, credentials or working-copy-only edits.
// Windows tar may decode Korean paths using the active ANSI locale. Read each
// immutable Git blob directly, with no text decoding or filename conversion.
for(const file of files){const target=path.join(output,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,execFileSync('git',['cat-file','blob',commit+':'+file],{cwd:root,maxBuffer:100*1024*1024,windowsHide:true}));}
for(const file of files)if(!fs.existsSync(path.join(output,file)))throw Error('Missing committed deployment file: '+file);
console.log(JSON.stringify({commit,output,files:files.length,source:'committed runtime only'},null,2));
