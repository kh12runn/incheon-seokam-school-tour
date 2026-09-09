// Decode the primary JPEG exposure in INSP. This is format conversion, not retouching.
// Originals remain immutable. The following stitching step runs locally in FFmpeg.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),sharp=require('sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(root,'촬영사진_넣는곳','4층');
const output=path.join(root,'사진보관','변환본','4층_직접변환');
fs.mkdirSync(output,{recursive:true});
const files=[];
function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p);else if(f.name.endsWith('.insp'))files.push(p);}}
walk(input);files.sort((a,b)=>path.basename(a).localeCompare(path.basename(b)));
const report=[];
for(const p of files){
  const no=Number(path.basename(p).match(/_(\d+)\.insp$/)[1]);
  const name=no<=7?`6-${no}_교실_앞_복도`:`6-7_교실_옆_계단_${no-7}`;
  const bytes=fs.readFileSync(p),m=await sharp(bytes).metadata();
  const target=path.join(output,name+'_원본렌즈.jpg');
  if(!fs.existsSync(target))await sharp(bytes).resize({width:6144}).jpeg({quality:96,chromaSubsampling:'4:4:4'}).toFile(target);
  report.push({no,name,source:path.relative(root,p).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),width:m.width,height:m.height,orientation:m.orientation??1,primaryExposure:true,lensImage:path.basename(target),projection:'dual-fisheye',stitched:false});
  console.log(name,'decoded',m.width,m.height);
}
fs.writeFileSync(path.join(output,'변환기록.json'),JSON.stringify(report,null,2)+'\n');
