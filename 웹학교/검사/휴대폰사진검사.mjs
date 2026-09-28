import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {photoFormat,preparePhoto} from '../../관리도구/관리자/사진변환.mjs';
const execute=promisify(execFile);
export async function fixture(format,extra=[]){
  if(format==='HEIC'&&process.env.PHONE_HEIC_FIXTURE)return fs.readFile(process.env.PHONE_HEIC_FIXTURE);
  const {stdout}=await execute(process.env.IMAGEMAGICK_BINARY||'magick',['-size','32x16','gradient:red-blue',...extra,`${format}:-`],{encoding:'buffer',windowsHide:true,timeout:30000,maxBuffer:1024*1024});return stdout;
}
export async function phonePhotoChecks(){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'school-photo-check-')),file=path.join(dir,'image');
  const results=[];
  try{
    for(const [format,name,mime] of [['JPEG','Galaxy.jpg','image/jpeg'],['JPEG','renamed.HEIC','image/heic'],['JPEG','missing-mime.jpg',''],['PNG','iPhone.PNG','image/png'],['WEBP','photo.webp','application/octet-stream'],['HEIC','IMG_001.HEIC','image/heic'],['HEIC','Galaxy.heif','application/octet-stream'],['AVIF','photo.avif','image/avif']]){
      await fs.writeFile(file,await fixture(format));
      const {bytes,info}=await preparePhoto(file,{name,mime});
      assert.equal(info.mime,'image/jpeg');assert(info.width>0&&info.height>0);if(format!=='HEIC'){assert.equal(info.width,32);assert.equal(info.height,16);assert.equal(info.type,'panorama-candidate');}assert(bytes.length>0);results.push(name);
    }
    const motion=Buffer.concat([await fixture('JPEG'),Buffer.from('motion-photo-video-trailer')]);await fs.writeFile(file,motion);
    const converted=await preparePhoto(file,{name:'Galaxy-motion.jpg',mime:'image/jpg'});assert(!converted.bytes.includes(Buffer.from('motion-photo-video-trailer')));results.push('Motion Photo trailing data removed');
    const jpeg=await fixture('JPEG'),exif=Buffer.from('ffe1002245786966000049492a0008000000010012010300010000000600000000000000','hex');
    await fs.writeFile(file,Buffer.concat([jpeg.subarray(0,2),exif,jpeg.subarray(2)]));
    const rotated=await preparePhoto(file,{name:'portrait.jpg',mime:'image/jpeg'});assert.equal(rotated.info.width,16);assert.equal(rotated.info.height,32);assert(!rotated.bytes.includes(Buffer.from('Exif')));results.push('EXIF orientation baked in and metadata stripped');
    for(const [bytes,name,mime] of [[Buffer.from('<svg/>'),'evil.jpg','image/jpeg'],[Buffer.from('%PDF'),'evil.heic','image/heic'],[await fixture('PNG'),'evil.svg','image/svg+xml']])assert.throws(()=>photoFormat(bytes,mime,name),e=>e.status===415);
    await fs.writeFile(file,Buffer.from([255,216,255,224,0,50,1]));await assert.rejects(()=>preparePhoto(file,{name:'broken.jpg',mime:'image/jpeg'}),e=>e.status===415);
    await fs.writeFile(file,await fixture('PNG'));await assert.rejects(()=>preparePhoto(file,{name:'large.png',mime:'image/png',maxBytes:10}),e=>e.status===413);
    assert.deepEqual((await fs.readdir(dir)).sort(),['image']);results.push('invalid files, decoded size cap, temporary conversion cleanup');
    return results;
  }finally{await fs.rm(file,{force:true});await fs.rmdir(dir);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify({ok:true,checks:await phonePhotoChecks()},null,2));
