import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {ApiError} from './저장소.mjs';
import {inspectImage} from './이미지검사.mjs';

const execute=promisify(execFile);
const policyDir=fileURLToPath(new URL('./이미지정책/',import.meta.url));
const extensions=/\.(jpe?g|jfif|png|webp|heic|heif|avif)$/i;
const mimes=new Set(['','application/octet-stream','binary/octet-stream','image/jpeg','image/jpg','image/pjpeg','image/png','image/x-png','image/webp','image/heic','image/heif','image/heic-sequence','image/heif-sequence','image/avif']);

// A browser may rename/transcode a phone photo or omit its MIME type. Neither
// field selects a decoder: the signature does, followed by a full native decode.
export function photoFormat(b,mime='',name=''){
  if(!extensions.test(name)||!mimes.has(mime.toLowerCase().trim()))throw new ApiError(415,'JPG, PNG, WEBP, HEIC, HEIF, AVIF 사진을 선택해주세요. 동영상·RAW·INSP는 지원하지 않습니다.');
  if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255)return 'JPEG';
  if(b.length>=8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'PNG';
  if(b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return 'WEBP';
  if(b.length>=16&&b.toString('ascii',4,8)==='ftyp'){
    const end=b.readUInt32BE(0),brands=[];
    if(end>=16&&end<=b.length&&end<=4096){
      brands.push(b.toString('ascii',8,12));
      for(let i=16;i+4<=end;i+=4)brands.push(b.toString('ascii',i,i+4));
      if(brands.some(s=>['heic','heix','hevc','hevx','mif1','msf1','avif','avis'].includes(s)))return 'HEIC';
    }
  }
  throw new ApiError(415,'실제 사진 형식을 확인할 수 없습니다. 손상되지 않은 휴대폰 사진을 선택해주세요.');
}

export async function preparePhoto(file,{name,mime,env=process.env,maxBytes=25*1024*1024}={}){
  const handle=await fs.open(file,'r');let format;
  try{const header=Buffer.alloc(4096),{bytesRead}=await handle.read(header,0,header.length,0);format=photoFormat(header.subarray(0,bytesRead),mime,name);}finally{await handle.close();}
  const output=path.join(path.dirname(file),'converted.jpg');
  const command=env.IMAGEMAGICK_BINARY||'magick';
  const options={windowsHide:true,timeout:90000,maxBuffer:65536,env:{...process.env,MAGICK_CONFIGURE_PATH:policyDir,MAGICK_TEMPORARY_PATH:path.dirname(file)}};
  const limits=['-limit','memory','128MiB','-limit','map','256MiB','-limit','disk','512MiB','-limit','thread','2','-limit','time','80'];
  try{
    const input=`${format}:${file}[0]`;
    const {stdout}=await execute(command,['identify',...limits,'-ping','-format','%w %h',input],options);
    const dimensions=stdout.trim().match(/^(\d+) (\d+)$/);
    if(!dimensions)throw new ApiError(415,'사진 크기를 확인하지 못했습니다. 다른 원본 사진으로 다시 시도해주세요.');
    const [,w,h]=dimensions.map(Number);
    if(!w||!h||w>20000||h>20000||w*h>120000000)throw new ApiError(413,'이미지 해상도가 너무 큽니다. 1억 2천만 화소 이하 사진을 선택해주세요.');
    // First still frame only (Live/Motion Photo video is not retained), EXIF
    // orientation baked in before removing metadata, including GPS coordinates.
    await execute(command,[...limits,input,'-auto-orient','-colorspace','sRGB','-background','white','-alpha','remove','-alpha','off','-resize','16384x16384>','-strip','-quality','92',`JPEG:${output}`],options);
    if((await fs.stat(output)).size>maxBytes)throw new ApiError(413,'자동 변환한 사진의 용량이 너무 큽니다. 낮은 해상도로 촬영 후 다시 올려주세요.');
    const bytes=await fs.readFile(output),info=inspectImage(bytes,'image/jpeg','converted.jpg');
    return {bytes,info:{...info,sourceFormat:format,normalized:true}};
  }catch(error){
    if(error instanceof ApiError)throw error;
    if(error.code==='ENOENT')throw new ApiError(503,'서버 사진 변환기가 준비되지 않았습니다. 관리자에게 서버 업데이트를 요청해주세요.');
    if(error.killed||/cache resources exhausted|memory allocation|exceeds limit/i.test(error.stderr??''))throw new ApiError(413,'사진 변환에 필요한 용량 또는 시간을 초과했습니다. 낮은 해상도 사진으로 다시 시도해주세요.');
    throw new ApiError(415,'사진을 해석하지 못했습니다. 손상된 파일 또는 지원되지 않는 카메라 형식입니다. 다른 사진은 계속 업로드할 수 있습니다.');
  }finally{await fs.rm(output,{force:true});}
}
