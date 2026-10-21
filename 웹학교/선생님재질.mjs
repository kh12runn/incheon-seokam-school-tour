import {Source} from './외부도구/three.module.js';
// Extend existing interior color through the two-pixel contaminated atlas edge
// and its unused padding. No generated face/clothing texture or UV remapping.
function paddedAtlas(texture,geometries){
  if(typeof document==='undefined'||!texture.image)return texture;
  const image=texture.image,w=image.width,h=image.height;
  if(!w||!h||w*h>16777216)return texture;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
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
  for(let pass=0;pass<2;pass++){
    const inner=new Uint8Array(known.length);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(known[i]&&known[i-1]&&known[i+1]&&known[i-w]&&known[i+w])inner[i]=1;}
    known=inner;
  }
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(known[i]&&(!known[i-1]||!known[i+1]||!known[i-w]||!known[i+w]))frontier.push(i);}
  for(let depth=0;depth<12&&frontier.length;depth++){
    const next=[];for(const i of frontier)for(const n of [i-1,i+1,i-w,i+w]){if(n<0||n>=known.length||known[n]||Math.abs(n%w-i%w)>1)continue;known[n]=1;pixels.data.set(pixels.data.subarray(i*4,i*4+4),n*4);next.push(n);}frontier=next;
  }
  ctx.putImageData(pixels,0,0);const result=texture.clone();result.source=new Source(canvas);result.needsUpdate=true;result.anisotropy=4;return result;
}
// Preserve all original face/clothing colors and UVs. Only fix surface response.
export function finishTeacherMaterials(model){
  const materials=new Map(),atlases=new Map();let meshes=0;
  model.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(m.map){if(!atlases.has(m.map))atlases.set(m.map,[]);atlases.get(m.map).push(o.geometry);}});
  const padded=new Map([...atlases].map(([texture,geometries])=>[texture,paddedAtlas(texture,geometries)]));
  model.traverse(object=>{
    if(!object.isMesh)return;meshes++;
    const finish=original=>{
      if(materials.has(original))return materials.get(original);
      const material=original.clone();
      material.metalness=0;material.metalnessMap=null;
      material.roughness=.86;material.roughnessMap=null;
      material.envMapIntensity=.35;
      if(material.map)material.map=padded.get(material.map);
      // The original geometric relief and albedo retain facial detail. Imported
      // generated normal atlases exaggerate UV borders and are omitted here.
      material.normalMap=null;
      material.needsUpdate=true;materials.set(original,material);return material;
    };
    object.material=Array.isArray(object.material)?object.material.map(finish):finish(object.material);
    object.castShadow=true;object.receiveShadow=false;
  });
  return {meshes,materials:materials.size};
}
