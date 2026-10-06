// Private, read-only photo review: thumbnails stay in ignored 참고자료.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import sharp from '../../node_modules/sharp/lib/index.js';
const current=process.argv[2]??'20261006',baseline=process.argv[3]??'20261002';
if(![current,baseline].every(s=>/^\d{8}(?:-[a-z0-9]+)?$/.test(s)))throw new Error('Invalid snapshot label');
const root=new URL('../참고자료/업로드점검-'+current+'/',import.meta.url);
const fresh=JSON.parse(fs.readFileSync(new URL('catalog.json',root)));
const old=JSON.parse(fs.readFileSync(new URL('../업로드점검-'+baseline+'/catalog.json',root)));
for(const room of Object.values(fresh.rooms)){
 const previous=new Set(old.rooms[room.roomId]?.images.map(i=>i.id));
 const images=room.images.filter(i=>!previous.has(i.id));
 const tiles=[];
 for(const [n,img] of images.entries()){
  const local=new URL(img.id+'.jpg',root);
  if(!fs.existsSync(local)){
   const endpoint='repos/kh12runn/incheon-seokam-school-photos/contents/'+img.file.split('/').map(encodeURIComponent).join('/')+'?ref=main';
   let result=JSON.parse(execFileSync('gh',['api',endpoint],{encoding:'utf8',maxBuffer:48*1024*1024}));
   if(!result.content)result=JSON.parse(execFileSync('gh',['api','repos/kh12runn/incheon-seokam-school-photos/git/blobs/'+result.sha],{encoding:'utf8',maxBuffer:48*1024*1024}));
   const bytes=Buffer.from(result.content,'base64');
   await sharp(bytes).rotate().resize({width:1400,height:1400,fit:'inside',withoutEnlargement:true}).jpeg({quality:87}).toFile(fileURLToPath(local));
  }
  const thumbnail=await sharp(fs.readFileSync(local)).resize(480,360,{fit:'contain',background:'#222'}).toBuffer();
  const label=Buffer.from(`<svg width="480" height="30"><rect width="480" height="30" fill="white"/><text x="12" y="22" font-size="20">${n+1} / ${img.id.slice(0,8)}</text></svg>`);
  tiles.push({thumbnail,label});
 }
 for(let offset=0;offset<tiles.length;offset+=8){
  const batch=tiles.slice(offset,offset+8),composite=[];
  batch.forEach((tile,n)=>{const left=n%2*480,top=Math.floor(n/2)*390;composite.push({input:tile.thumbnail,left,top},{input:tile.label,left,top:top+360});});
  const out=new URL(room.roomId+'-'+(offset/8+1)+'.jpg',root);
  const buffer=await sharp({create:{width:960,height:Math.ceil(batch.length/2)*390,channels:3,background:'#222'}}).composite(composite).jpeg({quality:90}).toBuffer();
  fs.writeFileSync(out,buffer);
 }
 if(images.length)console.log({room:room.roomId,reviewedDownloads:images.length});
}
