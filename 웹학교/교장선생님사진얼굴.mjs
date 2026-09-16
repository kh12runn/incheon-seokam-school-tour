import * as THREE from './외부도구/three.module.js';

// Preserve the previously deployed portrait, on a closed 3D head rather than a cutout.
// Only the front is observed: the side, nape and neck are modeled approximations.
export const PRINCIPAL_FACE_VERSION='portrait-continuous-v5';
export const PRINCIPAL_HEAD_SCALE=.82;
export const PRINCIPAL_SKIN_COLOR='#dfbaa7';
const portraitURL=new URL('./사진마감/교장실/교장선생님-얼굴.png',import.meta.url).href;
let portrait,faceState='idle';
const ready={value:0};
export const getPrincipalFaceState=()=>faceState;
function portraitTexture(){
  if(portrait)return portrait;
  if(typeof document==='undefined')return new THREE.Texture();
  faceState='loading';
  portrait=new THREE.TextureLoader().load(portraitURL,()=>{faceState='ready';ready.value=1;},undefined,()=>{faceState='failed';ready.value=0;});
  portrait.colorSpace=THREE.SRGBColorSpace;portrait.anisotropy=4;
  return portrait;
}
const profile=[[-.09,.051],[-.045,.048],[-.012,.049],[0,.054],[.020,.061],[.040,.076],[.09,.110],[.16,.124],[.23,.120],[.28,.099],[.31,.058],[.329,0]];
function widthAt(h){
  if(h>.23)return .122*Math.sqrt(Math.max(0,1-((h-.204)/.125)**2));
  let i=1;while(i<profile.length-1&&h>profile[i][0])i++;
  const a=profile[i-1],b=profile[i],p=profile[Math.max(0,i-2)],n=profile[Math.min(profile.length-1,i+1)],d=b[0]-a[0],t=THREE.MathUtils.clamp((h-a[0])/d,0,1);
  const m0=(b[1]-p[1])/(b[0]-p[0]),m1=(n[1]-a[1])/(n[0]-a[0]);
  return (2*t**3-3*t*t+1)*a[1]+(t**3-2*t*t+t)*d*m0+(-2*t**3+3*t*t)*b[1]+(t**3-t*t)*d*m1;
}
export function principalFaceDepth(x,h){
  const w=widthAt(h),c=Math.sqrt(Math.max(0,1-(x/Math.max(w,.001))**2));
  const neck=THREE.MathUtils.smoothstep(h,-.018,.045);
  const round=.095*Math.pow(Math.max(0,Math.sin(Math.PI*THREE.MathUtils.clamp(h,0,.329)/.329)),.35);
  const nose=.035*Math.exp(-((x/.026)**2)-(((h-.125)/.038)**2));
  return THREE.MathUtils.lerp(.043*c-.012,.017+round*c+nose,neck);
}
const rows=128,cols=128,positions=[],uvs=[],colors=[],weights=[],indices=[];
const skin=new THREE.Color(PRINCIPAL_SKIN_COLOR),hair=new THREE.Color('#37332f');
for(let j=0;j<=rows;j++)for(let i=0;i<cols;i++){
  const h=-.09+j/rows*.419,a=-Math.PI+2*Math.PI*i/cols,c=Math.cos(a),s=Math.sin(a),front=THREE.MathUtils.smoothstep(c,-.12,.28),w=widthAt(h),x=w*s;
  const neck=THREE.MathUtils.smoothstep(h,-.018,.065),backRadius=THREE.MathUtils.lerp(.046,.112*Math.sqrt(Math.max(0,1-((h-.174)/.158)**2)),neck);
  const back=-.012+backRadius*c;
  const z=THREE.MathUtils.lerp(back,principalFaceDepth(x,h),front);
  positions.push(x,h,z);uvs.push(.5+x/.128*.335,.039+h/.325*.947);
  // The unseen neck and hair share the SAME indexed surface as the visible face.
  const hairline=.085+.160*THREE.MathUtils.smoothstep(c,-.4,.8)+.008*Math.sin(a*2+.4);
  const coverage=THREE.MathUtils.smoothstep(h,hairline-.009,hairline+.006);
  const strand=(Math.sin(a*176+h*93)+Math.sin(a*311-h*157))*.035;
  const shade=skin.clone().lerp(hair.clone().multiplyScalar(1+strand),coverage);
  colors.push(shade.r,shade.g,shade.b);
  const frontWeight=THREE.MathUtils.smoothstep(c,.06,.52);
  const chin=THREE.MathUtils.smoothstep(h,-.002,.018),crown=1-THREE.MathUtils.smoothstep(h,.306,.328);
  const temple=1-.30*THREE.MathUtils.smoothstep(Math.abs(x),.094,.123);
  weights.push(frontWeight*chin*crown*temple);
}
for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const a=j*cols+i,b=j*cols+(i+1)%cols,c=a+cols,d=b+cols;
  indices.push(a,b,c,b,d,c);
}
// Close the underside inside the collar; no open back, photo plane or detached neck.
const bottom=positions.length/3;positions.push(0,-.09,-.012);uvs.push(.5,0);colors.push(skin.r,skin.g,skin.b);weights.push(0);
for(let i=0;i<cols;i++)indices.push(bottom,(i+1)%cols,i);
const headGeometry=new THREE.BufferGeometry();
headGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));headGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
headGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));headGeometry.setAttribute('portraitWeight',new THREE.Float32BufferAttribute(weights,1));
headGeometry.setIndex(indices);headGeometry.computeVertexNormals();headGeometry.computeBoundingSphere();
export function createPrincipalFace(){
  const group=new THREE.Group();group.name='교장선생님 사진 특징을 반영한 입체 얼굴';
  group.userData={faceVersion:PRINCIPAL_FACE_VERSION,photoTexture:true,continuousNeck:true,headScale:PRINCIPAL_HEAD_SCALE};
  const material=new THREE.MeshStandardMaterial({map:portraitTexture(),vertexColors:true,roughness:.84});
  material.onBeforeCompile=shader=>{
    shader.uniforms.portraitReady=ready;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float portraitWeight; varying float faceBlend;').replace('#include <begin_vertex>','#include <begin_vertex>\nfaceBlend=portraitWeight;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float portraitReady; varying float faceBlend;').replace('#include <map_fragment>','').replace('#include <color_fragment>',`#include <color_fragment>
    #ifdef USE_MAP
      vec4 portraitColor=texture2D(map,vMapUv);
      diffuseColor.rgb=mix(diffuseColor.rgb,portraitColor.rgb,faceBlend*portraitReady);
    #endif`);
  };
  material.customProgramCacheKey=()=>PRINCIPAL_FACE_VERSION;
  const head=new THREE.Mesh(headGeometry,material);head.name='사진 얼굴에서 뒷머리와 목까지 이어진 두상';head.castShadow=true;head.receiveShadow=true;group.add(head);
  // Ears are recessed into the side of the head, not superimposed on the portrait.
  const earMaterial=new THREE.MeshStandardMaterial({color:PRINCIPAL_SKIN_COLOR,roughness:.85});
  for(const s of [-1,1]){
    const ear=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),earMaterial);ear.position.set(s*.118,.126,-.008);ear.scale.set(.015,.034,.020);ear.rotation.z=-s*.12;ear.name='옆면 귓바퀴';ear.castShadow=true;group.add(ear);
    const fold=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),new THREE.MeshStandardMaterial({color:'#c69780',roughness:.95}));fold.position.set(s*.13,.126,-.003);fold.scale.set(.003,.019,.009);group.add(fold);
  }
  return group;
}
