import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createWriteStream,createReadStream} from 'node:fs';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

// Immutable public Git objects, never credentials or mutable branch URLs.
const root=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await fs.readFile(new URL('../공간자료/아바타통합-20261026.json',import.meta.url),'utf8'));
const sourceCommit=manifest.sourceCommit;
for(const model of manifest.models){
  if(path.basename(model.file)!==model.file||!model.file.endsWith('.glb'))throw Error('Invalid model path');
  const relative='웹학교/캐릭터모델/'+model.file,target=path.join(root,relative);
  try{
    const hash=createHash('sha256');for await(const chunk of createReadStream(target))hash.update(chunk);
    if(hash.digest('hex')!==model.sha256)throw Error('Existing model checksum mismatch: '+model.file);
    console.log('Verified existing '+model.file);continue;
  }catch(error){if(error.code!=='ENOENT')throw error;}
  if(!/^[a-f0-9]{40}$/.test(sourceCommit??''))throw Error('Missing immutable source commit: use 배포준비.mjs to package missing models');
  await fs.mkdir(path.dirname(target),{recursive:true});
  const temp=target+'.download';
  try{
    const response=await fetch('https://raw.githubusercontent.com/kh12runn/incheon-seokam-school-tour/'+sourceCommit+'/'+relative.split('/').map(encodeURIComponent).join('/'),{signal:AbortSignal.timeout(300000)});
    if(!response.ok)throw Error('Model download HTTP '+response.status+': '+model.file);
    let size=0;const hash=createHash('sha256');
    const verify=new Transform({transform(chunk,encoding,callback){size+=chunk.length;if(size>model.bytes)return callback(Error('Model size exceeded'));hash.update(chunk);callback(null,chunk);}});
    await pipeline(Readable.fromWeb(response.body),verify,createWriteStream(temp,{flags:'wx'}));
    if(size!==model.bytes||hash.digest('hex')!==model.sha256)throw Error('Downloaded model verification failed: '+model.file);
    await fs.rename(temp,target);console.log('Restored verified '+model.file);
  }catch(error){await fs.rm(temp,{force:true});throw error;}
}
