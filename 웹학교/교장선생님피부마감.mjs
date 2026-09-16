import * as THREE from './외부도구/three.module.js';
import {PRINCIPAL_SKIN_COLOR,getPrincipalFaceState} from './교장선생님사진얼굴.mjs';
// Approved isolated preview, 2026-09-16. No changes to NPC placement or controllers.
export const PRINCIPAL_APPEARANCE_VERSION='approved-skin-wrap-v6';
export const PRINCIPAL_APPROVED_SKIN='#dcb49f';
const skin=new THREE.Color(PRINCIPAL_APPROVED_SKIN);
const originalSkin=new THREE.Color(PRINCIPAL_SKIN_COLOR);
const portraitReady={get value(){return getPrincipalFaceState()==='ready'?1:0;}};
function unifySkin(npc,solidHair=false){
  npc.root.traverse(o=>{if(!o.isMesh||!o.material.color)return;if(o.material.color.equals(originalSkin)||o.material.color.getHexString()==='c69780'){o.material=o.material.clone();o.material.color.copy(skin);o.material.roughness=.84;}});
  const head=npc.root.getObjectByName('사진 얼굴에서 뒷머리와 목까지 이어진 두상');
  // Soften the old horizontal neck/occipital creases without changing the base head geometry.
  head.geometry=head.geometry.clone();const points=head.geometry.attributes.position;
  for(let pass=0;pass<28;pass++){const old=points.array.slice();for(let j=1;j<128;j++)for(let i=0;i<128;i++){
    const k=(j*128+i)*3,y=old[k+1],weight=.36*(1-THREE.MathUtils.smoothstep(y,.018,.078));if(weight===0)continue;
    for(const axis of [0,2])points.array[k+axis]=old[k+axis]+weight*(old[k-128*3+axis]+old[k+128*3+axis]-2*old[k+axis]);
  }}points.needsUpdate=true;head.geometry.computeVertexNormals();head.geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({map:head.material.map,roughness:.84,color:skin});
  material.onBeforeCompile=s=>{
    s.uniforms.portraitReady=portraitReady;s.uniforms.reviewSkin={value:skin};s.uniforms.reviewPortrait={value:material.map};s.uniforms.solidHair={value:solidHair?1:0};
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float portraitWeight;varying float faceBlend;varying vec3 facePoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nfaceBlend=portraitWeight;facePoint=position;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
      uniform float portraitReady;uniform vec3 reviewSkin;uniform sampler2D reviewPortrait;uniform float solidHair;varying float faceBlend;varying vec3 facePoint;
      float ellipseMask(vec2 p,vec2 c,vec2 r){return 1.0-smoothstep(.65,1.2,length((p-c)/r));}
      float luminanceAt(vec2 uv){return dot(texture2D(reviewPortrait,uv).rgb,vec3(.2126,.7152,.0722));}
    `).replace('#include <map_fragment>',`#ifdef USE_MAP
      vec3 original=texture2D(map,vMapUv).rgb;
      float l=dot(original,vec3(.2126,.7152,.0722));
      // Remove baked color/large lighting differences. Preserve medium-scale creases.
      float local=(l*4.0+luminanceAt(vMapUv+vec2(.0012,0.0))+luminanceAt(vMapUv-vec2(.0012,0.0))+luminanceAt(vMapUv+vec2(0.0,.0012))+luminanceAt(vMapUv-vec2(0.0,.0012)))/8.0;
      float blur=(l*2.0+luminanceAt(vMapUv+vec2(.019,0.0))+luminanceAt(vMapUv-vec2(.019,0.0))+luminanceAt(vMapUv+vec2(0.0,.019))+luminanceAt(vMapUv-vec2(0.0,.019))+luminanceAt(vMapUv+vec2(.014,.014))+luminanceAt(vMapUv-vec2(.014,.014)))/8.0;
      float crease=clamp((local-blur)/(blur+.10),-.40,.20);
      vec3 uniformSkin=reviewSkin*(1.0+crease*.92);
      vec2 p=facePoint.xy;float eyes=0.0,brows=0.0;
      for(int i=0;i<2;i++){float side=float(i)*2.0-1.0;eyes=max(eyes,ellipseMask(p,vec2(side*.049,.161),vec2(.032,.010)));brows=max(brows,ellipseMask(p,vec2(side*.053,.187),vec2(.036,.011)));}
      float lips=ellipseMask(p,vec2(0.0,.070),vec2(.057,.012));
      vec3 features=mix(uniformSkin,original,max(eyes,brows)*.93);
      features=mix(features,original,lips*.65);
      // Feather details before the jaw/temple, leaving exactly the same neck/body color.
      float detailFade=portraitReady*faceBlend*smoothstep(.016,.055,p.y)*(1.0-smoothstep(.077,.119,abs(p.x)));
      diffuseColor.rgb=mix(reviewSkin,features,detailFade);
      float facing=facePoint.z/sqrt(max(.0001,facePoint.x*facePoint.x+facePoint.z*facePoint.z));
      float rearHairline=.081+.163*smoothstep(-.4,.8,facing)+.008*sin(atan(facePoint.x,facePoint.z)*2.0+.4);
      float templeHairline=.243-.070*smoothstep(.052,.117,abs(p.x));
      float hairline=min(rearHairline,templeHairline);
      float sculptedHair=smoothstep(hairline-.008,hairline+.008,p.y);
      float photographHair=(1.0-smoothstep(.055,.18,l))*max(smoothstep(.202,.230,p.y),smoothstep(.086,.111,abs(p.x))*smoothstep(.15,.20,p.y));
      float blackCoverage=max(sculptedHair,photographHair*faceBlend*portraitReady);
      float strand=sin(p.x*1650.0+p.y*520.0)*sin(p.y*1270.0)*.0006;
      vec3 hairColor=mix(vec3(.010,.009,.008)+strand,original*.28,portraitReady*faceBlend*(1.0-solidHair));
      diffuseColor.rgb=mix(diffuseColor.rgb,hairColor,blackCoverage);
    #endif`);
  };material.customProgramCacheKey=()=> PRINCIPAL_APPEARANCE_VERSION;head.material=material;
  return head.parent.parent;
}

export function createPrincipalSunglasses(runnerHead){
// Replace the previous eyewear. Keep the white sun visor and its orange lip.
for(const o of [...runnerHead.children]){
  if(o.isGroup||o.name.includes('선캡'))continue;
  if(o.geometry?.type==='TubeGeometry'){o.geometry.computeBoundingBox();if(o.geometry.boundingBox.min.y>.215)continue;}
  runnerHead.remove(o);
}
const black=new THREE.MeshStandardMaterial({color:'#080b10',roughness:.40,metalness:.06});
black.side=THREE.DoubleSide;const lenses=[];
function curve(points,r=.004){const o=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),36,r,8,false),black);runnerHead.add(o);return o;}
for(const side of [-1,1]){
  const point=(u,v)=>{const a=.026+u*1.45,span=.042*Math.sqrt(Math.max(.18,1-((u-.5)/.54)**4));return [side*.139*Math.sin(a),.165+span*v,.004+.143*Math.cos(a)];};
  const positions=[],indices=[];for(let j=0;j<=16;j++)for(let i=0;i<=48;i++)positions.push(...point(i/48,j/8-1));
  for(let j=0;j<16;j++)for(let i=0;i<48;i++){const a=j*49+i,b=a+49;indices.push(a,a+1,b,a+1,b+1,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
  const lens=new THREE.Mesh(g,black);lens.name='옆눈까지 감싸는 불투명 선글라스';runnerHead.add(lens);lenses.push(lens);
  const rim=[];for(let i=0;i<=48;i++)rim.push(point(i/48,1));for(let i=16;i>=0;i--)rim.push(point(1,i/8-1));for(let i=48;i>=0;i--)rim.push(point(i/48,-1));for(let i=0;i<=16;i++)rim.push(point(0,i/8-1));curve(rim,.0035);
  curve([[side*.137,.180,.023],[side*.133,.180,-.01],[side*.121,.158,-.040]],.005);
}
curve([[-.017,.18,.157],[0,.187,.164],[.017,.18,.157]],.0055);

return lenses;
}
export function applyApprovedPrincipalAppearance(root,{runner=false}={}){
  if(root.userData.appearanceVersion===PRINCIPAL_APPEARANCE_VERSION)return;
  const head=unifySkin({root},runner);
  if(runner)createPrincipalSunglasses(head);
  root.userData.appearanceVersion=PRINCIPAL_APPEARANCE_VERSION;
  root.userData.uniformSkin=true;root.userData.blackHair=runner;
}
