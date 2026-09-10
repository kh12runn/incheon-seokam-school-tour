// Decode and project original INSP files. Format conversion only; no retouching here.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
const sharp=createRequire(import.meta.url)('sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ffmpeg=process.argv[2];if(!ffmpeg||!fs.existsSync(ffmpeg))throw new Error('FFmpeg executable required');
const dir=path.join(root,'사진보관','변환본','6-4_교실');fs.mkdirSync(dir,{recursive:true});
const records=[];
for(const n of [1,2]){
  const src=path.join(root,'촬영사진_넣는곳','4층','교실','6-4 교실',`6-4_원본_${n}.insp`);
  const bytes=fs.readFileSync(src),metadata=await sharp(bytes).metadata();
  const lens=path.join(dir,`원본렌즈_${n}.jpg`),pano=path.join(dir,`파노라마초안_${n}.jpg`);
  if(!fs.existsSync(lens))await sharp(bytes).resize({width:6144}).jpeg({quality:96,chromaSubsampling:'4:4:4'}).toFile(lens);
  if(!fs.existsSync(pano)){
    const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',lens,'-vf','v360=input=dfisheye:output=equirect:ih_fov=200:iv_fov=200:w=4096:h=2048','-frames:v','1','-update','1','-q:v','3','-n',pano],{windowsHide:true,encoding:'utf8'});
    if(result.status!==0)throw new Error(result.stderr);
  }
  records.push({number:n,source:path.relative(root,src),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),size:[metadata.width,metadata.height],panorama:path.basename(pano),method:'Nominal 200 degree dual-fisheye projection; not factory calibrated stitching.'});
}
fs.writeFileSync(path.join(dir,'변환기록.json'),JSON.stringify(records,null,2)+'\n');console.log(records);
