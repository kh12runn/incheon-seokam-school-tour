// Bake the existing procedural sky once, with identical RGBA pixels.
import fs from 'node:fs';
import {deflateSync} from 'node:zlib';
import {clearDaySky} from '../웹학교/야외풍경.mjs';
let pixels;
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>{pixels=image;}})})};
clearDaySky();
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,data){const label=Buffer.from(type),body=Buffer.concat([label,data]),result=Buffer.alloc(data.length+12);result.writeUInt32BE(data.length);body.copy(result,4);let crc=0xffffffff;for(const b of body)crc=crcTable[(crc^b)&255]^(crc>>>8);result.writeUInt32BE((crc^0xffffffff)>>>0,result.length-4);return result;}
const header=Buffer.alloc(13);header.writeUInt32BE(pixels.width);header.writeUInt32BE(pixels.height,4);header[8]=8;header[9]=6;
const rows=Buffer.alloc((pixels.width*4+1)*pixels.height);for(let y=0;y<pixels.height;y++)Buffer.from(pixels.data.buffer,y*pixels.width*4,pixels.width*4).copy(rows,y*(pixels.width*4+1)+1);
const output=new URL('../웹학교/텍스처/가을하늘.png',import.meta.url);fs.mkdirSync(new URL('.',output),{recursive:true});fs.writeFileSync(output,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows,{level:9})),chunk('IEND',Buffer.alloc(0))]));
console.log({width:pixels.width,height:pixels.height,bytes:fs.statSync(output).size});
