import {createHash} from 'node:crypto';

export function readGLB(bytes){
  if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2)throw Error('Invalid GLB');
  const length=bytes.readUInt32LE(12);
  return {json:JSON.parse(bytes.subarray(20,20+length)),binary:bytes.subarray(28+length)};
}
const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},sizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
export function accessorBytes(json,binary,index){
  const a=json.accessors[index],v=json.bufferViews[a.bufferView];
  if(a.sparse)throw Error('Sparse accessor is not supported by lossless repacker');
  const size=widths[a.type]*sizes[a.componentType],out=Buffer.alloc(a.count*size),start=(v.byteOffset??0)+(a.byteOffset??0),stride=v.byteStride??size;
  for(let i=0;i<a.count;i++)binary.copy(out,i*size,start+i*stride,start+i*stride+size);
  return out;
}
function encode(json,parts){
  const binary=Buffer.concat(parts),j=Buffer.from(JSON.stringify(json)),padding=(4-j.length%4)%4;
  const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+padding+binary.length,8);header.writeUInt32LE(j.length+padding,12);header.writeUInt32LE(0x4e4f534a,16);
  const chunk=Buffer.alloc(8);chunk.writeUInt32LE(binary.length);chunk.writeUInt32LE(0x004e4942,4);
  return Buffer.concat([header,j,Buffer.alloc(padding,32),chunk,binary]);
}

// Production derivative only: original approved GLBs remain untouched in Git.
// Image bytes are shared by content hash (no re-encoding). Unreferenced vertices
// in unrigged authoring meshes are removed; every referenced attribute byte and
// triangle order is retained. Animated/skinned student buffers stay untouched.
export function compactModel(bytes,writeImage){
  const {json:source,binary}=readGLB(bytes),json=structuredClone(source),parts=[];let offset=0,removedVertices=0;
  json.bufferViews=[];
  const append=(bytes,properties={})=>{
    const index=json.bufferViews.length;json.bufferViews.push({...properties,buffer:0,byteOffset:offset,byteLength:bytes.length});
    parts.push(bytes);offset+=bytes.length;const padding=(4-offset%4)%4;if(padding){parts.push(Buffer.alloc(padding));offset+=padding;}return index;
  };
  if(!source.skins?.length&&!source.animations?.length&&source.meshes.every(m=>m.primitives.every(p=>p.indices!==undefined&&!p.targets))){
    json.accessors=[];
    for(const [mi,m] of source.meshes.entries())for(const [pi,p] of m.primitives.entries()){
      const ix=source.accessors[p.indices],indices=accessorBytes(source,binary,p.indices),size=sizes[ix.componentType],read=i=>size===4?indices.readUInt32LE(i*size):size===2?indices.readUInt16LE(i*size):indices[i];
      const count=source.accessors[p.attributes.POSITION].count,remap=new Int32Array(count).fill(-1),used=[];
      for(let i=0;i<ix.count;i++){const old=read(i);if(old>=count)throw Error('Invalid vertex index');if(remap[old]<0){remap[old]=used.length;used.push(old);}}
      removedVertices+=count-used.length;
      const primitive=json.meshes[mi].primitives[pi];
      for(const [name,index] of Object.entries(p.attributes)){
        const a=source.accessors[index],input=accessorBytes(source,binary,index),width=widths[a.type]*sizes[a.componentType],output=Buffer.alloc(used.length*width);
        for(let i=0;i<used.length;i++)input.copy(output,i*width,used[i]*width,(used[i]+1)*width);
        primitive.attributes[name]=json.accessors.length;
        json.accessors.push({...a,bufferView:append(output,{target:34962}),byteOffset:0,count:used.length});
      }
      const output=Buffer.alloc(ix.count*4);for(let i=0;i<ix.count;i++)output.writeUInt32LE(remap[read(i)],i*4);
      primitive.indices=json.accessors.length;const next={...ix,componentType:5125,bufferView:append(output,{target:34963}),byteOffset:0};
      if(next.min)next.min=[0];if(next.max)next.max=[used.length-1];json.accessors.push(next);
    }
  }else{
    // Preserve all accessor references, inverse bind matrices and animation data.
    const used=new Set(source.accessors.map(a=>a.bufferView));const mapping=new Map();
    for(const i of used){const v=source.bufferViews[i];mapping.set(i,append(binary.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength),v));}
    json.accessors.forEach(a=>{a.bufferView=mapping.get(a.bufferView);});
  }
  for(const [i,img] of (source.images??[]).entries()){
    if(img.bufferView===undefined)throw Error('Expected embedded image');const v=source.bufferViews[img.bufferView],data=binary.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);
    const extension=({'image/webp':'webp','image/png':'png','image/jpeg':'jpg'})[img.mimeType];if(!extension)throw Error('Unsupported model image '+img.mimeType);
    const hash=createHash('sha256').update(data).digest('hex'),uri='./공유텍스처/'+hash+'.'+extension;
    writeImage(uri,data);json.images[i]={...img,uri};delete json.images[i].bufferView;
  }
  json.buffers=[{byteLength:offset}];return {bytes:encode(json,parts),removedVertices};
}
