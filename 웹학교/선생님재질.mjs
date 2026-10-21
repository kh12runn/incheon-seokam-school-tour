import {LinearFilter,LinearMipmapLinearFilter,MeshPhysicalMaterial,Source} from './외부도구/three.module.js';

// Remove isolated bright/dark texels, not broad features such as eyes, lips,
// buttons or shirt logos. Sixteen agreeing neighbours are required, so real color
// boundaries survive. Operates once at load time, never in the render loop.
export function cleanTeacherTexels(data,width,height){
  const input=new Uint8ClampedArray(data),offsets=[];
  for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)if(x||y)offsets.push(y*width+x);
  const neighbors=new Array(24),probes=[-width*2,width*2,-2,2];let repaired=0;
  const luminance=i=>input[i]*.2126+input[i+1]*.7152+input[i+2]*.0722;
  for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){
    const pixel=y*width+x,i=pixel*4,center=luminance(i);let mean=0;
    for(const offset of probes)mean+=luminance((pixel+offset)*4);
    if(Math.abs(center-mean/4)<22)continue;
    for(let n=0;n<24;n++)neighbors[n]=(pixel+offsets[n])*4;
    neighbors.sort((a,b)=>luminance(a)-luminance(b));const median=neighbors[12],mid=luminance(median);
    if(Math.abs(center-mid)<32)continue;
    let similar=0;
    for(const n of neighbors)if(Math.max(Math.abs(input[n]-input[median]),Math.abs(input[n+1]-input[median+1]),Math.abs(input[n+2]-input[median+2]))<28)similar++;
    if(similar<16)continue;
    for(let channel=0;channel<3;channel++)data[i+channel]=input[median+channel];
    repaired++;
  }
  return repaired;
}

// Extend original interior colors across contaminated atlas edges. Keep the
// original resolution, UVs, geometry and recognizable face/clothing features.
function atlasCanvas(w,h){
  if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;
}
export function paddedAtlas(texture,geometries){
  if((typeof document==='undefined'&&typeof OffscreenCanvas==='undefined')||!texture.image)return texture;
  const image=texture.image,w=image.width,h=image.height;
  if(!w||!h||w*h>16777216)return texture;
  const canvas=atlasCanvas(w,h);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,w,h);let known=new Uint8Array(w*h),frontier=[];
  for(const g of geometries){const uv=g.attributes.uv,index=g.index;if(!uv)continue;const count=index?index.count:uv.count;
    for(let i=0;i<count;i+=3){
      const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;
      const ax=uv.getX(a)*w,bx=uv.getX(b)*w,cx=uv.getX(c)*w;
      const ay=(texture.flipY?1-uv.getY(a):uv.getY(a))*h,by=(texture.flipY?1-uv.getY(b):uv.getY(b))*h,cy=(texture.flipY?1-uv.getY(c):uv.getY(c))*h;
      const sign=Math.sign((bx-ax)*(cy-ay)-(by-ay)*(cx-ax));if(!sign)continue;
      const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx)));
      const y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const px=x+.5,py=y+.5;
        if(sign*((bx-ax)*(py-ay)-(by-ay)*(px-ax))>=0&&sign*((cx-bx)*(py-by)-(cy-by)*(px-bx))>=0&&sign*((ax-cx)*(py-cy)-(ay-cy)*(px-cx))>=0)known[y*w+x]=1;
      }
    }
  }
  cleanTeacherTexels(pixels.data,w,h);
  for(let pass=0;pass<2;pass++){
    const inner=new Uint8Array(known.length);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(known[i]&&known[i-1]&&known[i+1]&&known[i-w]&&known[i+w])inner[i]=1;}
    known=inner;
  }
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(known[i]&&(!known[i-1]||!known[i+1]||!known[i-w]||!known[i+w]))frontier.push(i);}
  for(let depth=0;depth<16&&frontier.length;depth++){
    const next=[];for(const i of frontier)for(const n of [i-1,i+1,i-w,i+w]){if(n<0||n>=known.length||known[n]||Math.abs(n%w-i%w)>1)continue;known[n]=1;pixels.data.set(pixels.data.subarray(i*4,i*4+4),n*4);next.push(n);}frontier=next;
  }
  cleanTeacherTexels(pixels.data,w,h);
  // A narrow tonal range keeps hair/clothes charcoal rather than mirror-black,
  // and prevents pale skin from blowing out under the school's bright sun.
  for(let i=0;i<pixels.data.length;i+=4)for(let ch=0;ch<3;ch++)pixels.data[i+ch]=28+pixels.data[i+ch]*.82;
  ctx.putImageData(pixels,0,0);const result=texture.clone();result.source=new Source(canvas);
  // These generated atlases pack unrelated skin/hair/clothing islands tightly.
  // Coarse mip levels mix those colors into white cracks even after padding.
  // Keep two downsampled levels for antialiasing, but do not generate the coarse
  // levels that mix whole UV islands together. WebGL2 immutable storage limits
  // sampling to these uploaded levels (Three r180 getMipLevels/uploadTexture).
  result.mipmaps=[canvas];
  for(let level=1;level<=2;level++){
    const mip=atlasCanvas(Math.max(1,w>>level),Math.max(1,h>>level));
    // Use the same CPU resampler in the window and worker; GPU canvas
    // downsampling may round edges differently between the two contexts.
    mip.getContext('2d',{willReadFrequently:true}).drawImage(canvas,0,0,mip.width,mip.height);result.mipmaps.push(mip);
  }
  result.generateMipmaps=false;result.minFilter=LinearMipmapLinearFilter;result.magFilter=LinearFilter;
  result.needsUpdate=true;result.anisotropy=4;return result;
}
// Keep soft environment illumination, but explicitly remove the dielectric
// specular lobe. Roughness alone cannot remove grazing-angle reflections.
export function finishTeacherMaterials(model,prepared=null){
  const materials=new Map(),atlases=new Map();let meshes=0;
  model.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(m.map){if(!atlases.has(m.map))atlases.set(m.map,[]);atlases.get(m.map).push(o.geometry);}});
  const padded=prepared??new Map([...atlases].map(([texture,geometries])=>[texture,paddedAtlas(texture,geometries)]));
  model.traverse(object=>{
    if(!object.isMesh)return;meshes++;
    const finish=original=>{
      if(materials.has(original))return materials.get(original);
      const color=original.color.clone();
      if(!original.map){color.convertLinearToSRGB();color.setRGB(28/255+color.r*.82,28/255+color.g*.82,28/255+color.b*.82);color.convertSRGBToLinear();}
      const material=new MeshPhysicalMaterial({
        name:original.name+' / 교사 무광',
        color:color.multiplyScalar(.86),
        map:original.map?padded.get(original.map):null,
        side:original.side,transparent:original.transparent,opacity:original.opacity,
        alphaTest:original.alphaTest,alphaMap:original.alphaMap,
        // Use a single consistent color source for the atlas and the separate
        // dark hair patches rather than multiplying imported vertex tints.
        vertexColors:false,depthTest:original.depthTest,depthWrite:original.depthWrite,
        flatShading:false,metalness:0,roughness:1,specularIntensity:0,
        clearcoat:0,sheen:0,transmission:0,envMapIntensity:.45,
      });
      // Preserve silhouette/alpha, but do not inherit generated normal, AO,
      // emissive or specular atlases that amplify seams or bleach skin.
      material.userData.teacherFinish='diffuse-v2';
      material.needsUpdate=true;materials.set(original,material);return material;
    };
    object.material=Array.isArray(object.material)?object.material.map(finish):finish(object.material);
    object.castShadow=true;object.receiveShadow=false;
  });
  return {meshes,materials:materials.size};
}

// A cold classroom entry must never run multi-million-pixel filtering on the
// game thread. Transfer only copied UVs/bitmaps; original GLB resources survive.
export async function finishTeacherMaterialsAsync(model,{signal}={}){
  const atlases=new Map(),prepared=new Map();
  model.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(m.map){if(!atlases.has(m.map))atlases.set(m.map,[]);atlases.get(m.map).push(o.geometry);}});
  let worker;
  try{
    signal?.throwIfAborted();
    if(typeof Worker==='undefined'||typeof createImageBitmap==='undefined')throw Error('Image workers unavailable');
    worker=new Worker(new URL('./선생님재질작업자.mjs',import.meta.url),{type:'module'});
    for(const [texture,geometries] of atlases){
      signal?.throwIfAborted();
      const image=await createImageBitmap(texture.image),uvs=[];
      if(signal?.aborted){image.close();signal.throwIfAborted();}
      for(const g of geometries){const uv=g.attributes.uv;if(!uv)continue;
        const values=new Float32Array(uv.count*2);
        for(let i=0;i<uv.count;i++){values[i*2]=uv.getX(i);values[i*2+1]=uv.getY(i);}
        const indices=g.index?Uint32Array.from(g.index.array):null;uvs.push({values,indices});
      }
      const mipmaps=await new Promise((resolve,reject)=>{
        const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
        const abort=()=>{cleanup();reject(signal.reason??new DOMException('Aborted','AbortError'));};
        const timer=setTimeout(()=>{cleanup();reject(Error('Teacher finish timeout'));},60000);
        signal?.addEventListener('abort',abort,{once:true});
        worker.onmessage=({data})=>{cleanup();data.error?reject(Error(data.error)):resolve(data.mipmaps);};
        worker.onerror=e=>{cleanup();reject(Error(e.message||'Teacher worker failed'));};
        try{worker.postMessage({image,flipY:texture.flipY,uvs},[image,...uvs.flatMap(g=>[g.values.buffer,...(g.indices?[g.indices.buffer]:[])])]);}
        catch(error){cleanup();image.close();reject(error);}
      });
      const result=texture.clone();result.source=new Source(mipmaps[0]);result.mipmaps=mipmaps;
      result.generateMipmaps=false;result.minFilter=LinearMipmapLinearFilter;result.magFilter=LinearFilter;result.anisotropy=4;result.needsUpdate=true;
      prepared.set(texture,result);
    }
    signal?.throwIfAborted();return {...finishTeacherMaterials(model,prepared),processing:'worker'};
  }catch(error){
    if(signal?.aborted){for(const texture of prepared.values()){texture.dispose();for(const image of new Set([texture.image,...texture.mipmaps]))image.close?.();}throw error;}
    // Keep the original appearance playable on browsers that block workers.
    // Do not fall back to the multi-second synchronous filter on the game thread.
    for(const texture of atlases.keys())if(!prepared.has(texture))prepared.set(texture,texture);
    console.warn('교사 재질 보정 작업자 사용 불가: 원본 텍스처 사용',error.message);
    return {...finishTeacherMaterials(model,prepared),processing:'original-fallback'};
  }finally{worker?.terminate();}
}
