import * as THREE from './외부도구/three.module.js';

// Code-native surface detail, referenced to the supplied corridor photos.
// World-space grain avoids stretching a single image across a 100 m corridor.
export function surfaceKind(b){
  if(b.material)return b.material;
  if(b.name.startsWith('주차장 아스팔트'))return 'asphalt';
  if(b.name.startsWith('주차장 주차선'))return 'chalk';
  if(b.name.startsWith('주차장 자동차 유리'))return 'glass';
  if(b.name.startsWith('주차장'))return 'paint';
  if(b.name.startsWith('교실창 투명유리'))return 'clear_glass';
  if(b.name.startsWith('교실창 알루미늄'))return 'metal';
  if(b.name==='SPACE_EXT_PLAYGROUND')return 'soil';
  if(b.name==='SiteGround')return 'ground';
  if(b.name.includes('운동장 임시'))return 'chalk';
  if(b.name.includes('엘리베이터'))return /문|문틀/.test(b.name)?'metal':'paint';
  if(!b.name.includes('사진참고'))return 'original';
  if(b.name.includes('알루미늄'))return 'metal';
  if(/신발장|문틀|창 .*틀/.test(b.name))return 'wood';
  if(b.name.includes('복도 바닥'))return 'terrazzo';
  if(b.name.includes('형광등'))return 'lamp';
  if(b.name.includes('창가 유리'))return 'clear_glass';
  if(b.name.includes('복도창'))return 'glass';
  return 'paint';
}
export function finishMaterial(b){
  const kind=surfaceKind(b),color=new THREE.Color(...b.color);
  if(kind==='original')return new THREE.MeshLambertMaterial({color});
  color.convertSRGBToLinear();
  const material=new THREE.MeshStandardMaterial({color,roughness:kind==='terrazzo'?.27:kind==='wood'?.48:kind==='metal'?.3:.88,
    metalness:kind==='metal'?.72:0,envMapIntensity:kind==='metal'?.8:.28});
  if(kind==='lamp'){material.emissive.set('#fff4dc');material.emissiveIntensity=1.2;}
  if(kind==='glass'){material.roughness=.2;material.envMapIntensity=.65;}
  if(kind==='clear_glass'){
    material.color.set('#e5f3ee');material.transparent=true;material.opacity=.1;material.depthWrite=false;
    material.roughness=.08;material.envMapIntensity=.35;return material;
  }
  if(!['wood','room_floor','terrazzo','paint','metal','soil','ground','chalk','asphalt','facade','foliage'].includes(kind))return material;
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vSurfacePoint;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec4 surfacePoint=vec4(position,1.0);
      #ifdef USE_INSTANCING
        surfacePoint=instanceMatrix*surfacePoint;
      #endif
      vSurfacePoint=(modelMatrix*surfacePoint).xyz;`);
    shader.fragmentShader=`varying vec3 vSurfacePoint;
      float grainHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float grainNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(grainHash(i),grainHash(i+vec2(1.,0.)),f.x),mix(grainHash(i+vec2(0.,1.)),grainHash(i+vec2(1.,1.)),f.x),f.y);}
      `+shader.fragmentShader;
    const detail=kind==='facade'?`
      float height=mod(vSurfacePoint.y+.001,3.4);
      float band=step(.65,height)*(1.-step(1.0,height))+step(2.34,height)*(1.-step(2.63,height));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.196,.048,.024),clamp(band,0.,1.)*.86);
      vec2 uv=vec2(vSurfacePoint.x+vSurfacePoint.z,vSurfacePoint.y);
      vec2 tile=abs(fract(uv/vec2(.36,.18))-.5);
      float seam=smoothstep(.46,.49,max(tile.x,tile.y));
      diffuseColor.rgb*=.94+.055*grainNoise(uv*42.)+.04*seam;
      diffuseColor.rgb*=.95+.05*grainNoise(uv*1.4);`
      :kind==='foliage'?`diffuseColor.rgb*=.8+.3*grainNoise(vSurfacePoint.xz*12.);`
      :kind==='room_floor'?`
      vec2 uv=vSurfacePoint.xz;
      float row=floor(uv.y/.18),offset=grainHash(vec2(row,1.))*1.2;
      vec2 board=vec2(fract((uv.x+offset)/1.2),fract(uv.y/.18));
      float seam=step(.006,board.x)*step(.013,board.y);
      float grain=grainNoise(vec2(uv.x*4.,uv.y*180.));
      diffuseColor.rgb*=mix(.85,1.,seam)*(.95+.09*grain)*(.96+.06*grainHash(vec2(floor((uv.x+offset)/1.2),row)));`
      :kind==='asphalt'?`
      vec2 uv=vSurfacePoint.xz;
      float grains=grainNoise(uv*130.0);
      diffuseColor.rgb*=.82+.14*grainNoise(uv*.5)+.16*grains;`
      :kind==='soil'?`
      vec2 uv=vSurfacePoint.xz;
      float broad=grainNoise(uv*.12),packed=grainNoise(uv*3.7),sand=grainNoise(uv*95.);
      float fade=clamp(1.-length(fwidth(uv*95.))*.5,0.,1.);
      diffuseColor.rgb*=.88+.075*broad+.075*packed;
      diffuseColor.rgb*=mix(1.,.92+.16*sand,fade);
      float wear=grainNoise(vec2(uv.x*.6,uv.y*2.));
      diffuseColor.rgb*=.96+.06*wear;`
      :['ground','chalk'].includes(kind)?`
      vec2 uv=vSurfacePoint.xz;
      float broad=grainNoise(uv*.16),soilVariation=grainNoise(uv*2.3),sand=grainNoise(uv*105.0);
      float detailFade=clamp(1.0-length(fwidth(uv*105.0))*.3,0.,1.);
      diffuseColor.rgb*=.7+.22*broad+.18*soilVariation;
      diffuseColor.rgb*=mix(1.0,.86+.25*sand,detailFade);
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.11,.96,.79),.18*grainNoise(uv*.6));`
      :kind==='terrazzo'?`
      vec2 uv=vSurfacePoint.xz;
      float fleck=grainNoise(uv*180.0);
      float chips=smoothstep(.66,.84,fleck);
      float fine=mix(1.0,.79+.3*fleck,clamp(1.0-length(fwidth(uv*180.0))*.2,0.,1.));
      diffuseColor.rgb*=fine*(1.0-.22*chips);
      diffuseColor.rgb*=.94+.08*grainNoise(uv*2.0);`
      :kind==='wood'?`
      vec2 uv=vec2(vSurfacePoint.x+vSurfacePoint.z,vSurfacePoint.y);
      float grain=grainNoise(vec2(uv.x*4.0,uv.y*110.0+4.0*grainNoise(uv*2.0)));
      diffuseColor.rgb*=.86+.24*grain;
      float level=mod(vSurfacePoint.y,3.4);
      diffuseColor.rgb*=.82+.18*smoothstep(.07,.3,level);`
      :kind==='metal'?`diffuseColor.rgb*=.91+.12*grainNoise(vec2(vSurfacePoint.x*320.0,vSurfacePoint.y*4.0));`
      :`diffuseColor.rgb*=.96+.06*grainNoise(vec2(vSurfacePoint.x+vSurfacePoint.z,vSurfacePoint.y)*90.0);`;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+detail);
  };
  material.customProgramCacheKey=()=>kind+'-surface-v2';
  return material;
}
export function softEnvironment(renderer){
  const faces=Array.from({length:6},(_,i)=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,64);
    gradient.addColorStop(0,i===3?'#74756f':'#e6ebea');gradient.addColorStop(1,i===2?'#e6ebea':'#737b7b');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);return canvas;
  });
  const cube=new THREE.CubeTexture(faces);cube.colorSpace=THREE.SRGBColorSpace;cube.needsUpdate=true;
  const generator=new THREE.PMREMGenerator(renderer),target=generator.fromCubemap(cube);
  cube.dispose();generator.dispose();return target.texture;
}
