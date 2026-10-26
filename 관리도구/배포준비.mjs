import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
import {pipeline} from 'node:stream/promises';
import {runtimeFiles,serverFiles} from './배포최적화.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),output=path.join(root,'output','production-'+commit.slice(0,12));
if(fs.existsSync(output))throw Error('Use an empty immutable deploy directory: '+output);
const files=[...new Set([...runtimeFiles(),...serverFiles,'관리도구/배포최적화.mjs','Dockerfile','railway.toml','.dockerignore'])];
// No untracked authoring files, photos, credentials or working-copy-only edits.
fs.mkdirSync(output,{recursive:true});
const archive=spawn('git',['archive','--format=tar',commit,'--',...files],{cwd:root,stdio:['ignore','pipe','pipe'],windowsHide:true});
const extract=spawn('tar',['-xf','-','-C',output],{cwd:root,stdio:['pipe','ignore','pipe'],windowsHide:true});
let errors='';for(const child of [archive,extract])child.stderr.on('data',b=>{errors+=b;});
const exited=child=>new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Archive failed '+code+' '+errors)));});
await Promise.all([pipeline(archive.stdout,extract.stdin),exited(archive),exited(extract)]);
for(const file of files)if(!fs.existsSync(path.join(output,file)))throw Error('Missing committed deployment file: '+file);
console.log(JSON.stringify({commit,output,files:files.length,source:'committed runtime only'},null,2));
