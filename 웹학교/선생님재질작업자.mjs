import {Texture} from './외부도구/three.module.js';
import {paddedAtlas} from './선생님재질.mjs';
self.onmessage=({data:{image,flipY,uvs}})=>{
  try{
    const texture=new Texture(image);texture.flipY=flipY;
    const geometries=uvs.map(({values,indices})=>({attributes:{uv:{count:values.length/2,getX:i=>values[i*2],getY:i=>values[i*2+1]}},index:indices?{count:indices.length,getX:i=>indices[i]}:null}));
    const result=paddedAtlas(texture,geometries);
    if(!result.mipmaps.length)throw Error('Unsupported teacher atlas dimensions');
    const mipmaps=result.mipmaps.map(canvas=>canvas.transferToImageBitmap());
    self.postMessage({mipmaps},mipmaps);
  }catch(error){self.postMessage({error:String(error.message??error)});}
  finally{image.close();}
};
