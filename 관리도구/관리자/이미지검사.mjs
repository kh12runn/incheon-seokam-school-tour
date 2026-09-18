import {ApiError} from './저장소.mjs';
export function inspectImage(bytes,mime,name){
  let type,width,height;
  const b=bytes;
  if(b.length>32&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.toString('ascii',12,16)==='IHDR'&&b.toString('ascii',b.length-8,b.length-4)==='IEND'){
    type='png';width=b.readUInt32BE(16);height=b.readUInt32BE(20);
  }else if(b.length>4&&b[0]===255&&b[1]===216&&b[b.length-2]===255&&b[b.length-1]===217){
    type='jpeg';let pos=2;
    while(pos+4<b.length){
      if(b[pos++]!==255)break;while(b[pos]===255)pos++;
      const marker=b[pos++];if(marker===0xda||marker===0xd9)break;
      if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;
      const length=b.readUInt16BE(pos);if(length<2||pos+length>b.length)break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&length>=8){height=b.readUInt16BE(pos+3);width=b.readUInt16BE(pos+5);break;}pos+=length;
    }
  }else if(b.length>30&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'&&b.readUInt32LE(4)+8===b.length){
    type='webp';const chunk=b.toString('ascii',12,16);
    if(chunk==='VP8X'){width=1+b.readUIntLE(24,3);height=1+b.readUIntLE(27,3);}
    if(chunk==='VP8 '&&b[23]===0x9d&&b[24]===1&&b[25]===0x2a){width=b.readUInt16LE(26)&0x3fff;height=b.readUInt16LE(28)&0x3fff;}
    if(chunk==='VP8L'&&b[20]===0x2f){width=1+((b[22]&0x3f)<<8|b[21]);height=1+((b[24]&15)<<10|b[23]<<2|b[22]>>6);}
  }
  const ext=name.split('.').pop().toLowerCase();
  if(!type||!width||!height||mime!==`image/${type}`||!(type==='jpeg'?['jpg','jpeg'].includes(ext):ext===type))throw new ApiError(415,'파일 확장자·MIME·실제 이미지 형식이 일치하는 JPG, PNG, WEBP만 가능합니다. INSP는 변환 후 올려주세요.');
  if(width>20000||height>20000||width*height>120000000)throw new ApiError(413,'이미지 해상도가 너무 큽니다. 1억 2천만 화소 이하로 줄여주세요.');
  return {mime:`image/${type}`,extension:type==='jpeg'?'jpg':type,width,height,type:Math.abs(width/height-2)<.035?'panorama-candidate':'photo'};
}
