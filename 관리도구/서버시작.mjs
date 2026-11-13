// Railway mounts volumes as root. Create only our database directory, then
// drop privileges before opening HTTP or processing any uploaded content.
import fs from 'node:fs';
import path from 'node:path';
const mount=process.env.RAILWAY_VOLUME_MOUNT_PATH;
if(mount){
 const directory=path.join(mount,'racing');fs.mkdirSync(directory,{recursive:true});
 if(process.getuid?.()===0){fs.chownSync(directory,1000,1000);for(const name of ['records.sqlite','records.sqlite-wal','records.sqlite-shm']){const file=path.join(directory,name);if(fs.existsSync(file))fs.chownSync(file,1000,1000);}}
 process.env.RACE_DATA_DIR=directory;
 const visitors=path.join(mount,'visitors');fs.mkdirSync(visitors,{recursive:true});
 if(process.getuid?.()===0){fs.chownSync(visitors,1000,1000);for(const name of ['visitors.sqlite','visitors.sqlite-wal','visitors.sqlite-shm']){const file=path.join(visitors,name);if(fs.existsSync(file))fs.chownSync(file,1000,1000);}}
 process.env.VISITOR_DATA_DIR=visitors;
}
if(process.getuid?.()===0){process.setgid(1000);process.setuid(1000);}
await import('./웹서버.mjs');
