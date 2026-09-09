import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)('sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'사진보관','변환본','4층_촬영자제거');
const output=path.join(root,'사진보관','웹용','4층');fs.mkdirSync(output,{recursive:true});
const rows=JSON.parse(fs.readFileSync(path.join(root,'사진보관','변환본','4층_직접변환','변환기록.json'),'utf8'));
const photos=[];
for(const row of rows){
  const png=path.join(dir,row.name+'.png'),jpg=path.join(output,row.name+'.jpg');
  const p={id:'사진'+row.no,name:row.name.replaceAll('_',' '),url:'./사진보관/웹용/4층/'+row.name+'.jpg',ready:false,heading:row.no===1?1.2:row.no<=6?1.5:row.no===7?-2.1:row.no===8?1.4:2.5,
    position:row.no<=7?{x:73.5-row.no*10,y:1.5,z:10.2}:row.no===8?{x:3.75,y:3.6,z:10.2}:{x:1.25,y:9.4,z:8.5},
    processing:'원본 렌즈 영상의 근사 투영 변환 + AI 촬영자 제거·가림 영역 보완',syntheticRegions:'주로 촬영자가 가린 바닥 및 주변 경계. 편집 과정에서 다른 작은 세부도 달라질 수 있음.'};
  if(row.no===8)p.name='6-7 교실 옆 계단 · 4층 입구';if(row.no===9)p.name='6-7 교실 옆 계단 · 중간참';
  if(fs.existsSync(png)){
    const m=await sharp(png).metadata();
    if(m.width!==m.height*2)throw new Error('Panorama must remain exactly 2:1: '+png);
    await sharp(png).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(jpg);
    p.ready=true;p.width=m.width;p.height=m.height;p.sha256=crypto.createHash('sha256').update(fs.readFileSync(jpg)).digest('hex');
  }
  photos.push(p);
}
fs.writeFileSync(path.join(root,'웹학교','실사목록.json'),JSON.stringify({version:1,localOnly:false,photos},null,2)+'\n');
console.log(JSON.stringify({ready:photos.filter(p=>p.ready).length,total:photos.length}));
