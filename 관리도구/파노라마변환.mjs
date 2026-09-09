import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'사진보관','변환본','4층_직접변환');
const ffmpeg=process.argv[2];if(!ffmpeg||!fs.existsSync(ffmpeg))throw new Error('FFmpeg path required');
const manifestPath=path.join(dir,'변환기록.json'),rows=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
for(const row of rows){
  const target=path.join(dir,row.name+'_파노라마초안.jpg');
  if(!fs.existsSync(target)){
    const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-threads','2','-filter_threads','2','-i',path.join(dir,row.lensImage),'-vf','v360=input=dfisheye:output=equirect:ih_fov=200:iv_fov=200:w=4096:h=2048','-frames:v','1','-update','1','-q:v','3','-n',target],{windowsHide:true,encoding:'utf8'});
    if(result.status!==0)throw new Error(result.stderr||'FFmpeg conversion failed');
  }
  row.stitched=true;row.panorama=path.basename(target);row.outputSize=[4096,2048];
  row.method='FFmpeg dual-fisheye template projection; nominal 200-degree lens FOV, visually checked; not factory-calibrated optical-flow stitching';
  console.log(row.name,'panorama ready');
  fs.writeFileSync(manifestPath,JSON.stringify(rows,null,2)+'\n');
}
