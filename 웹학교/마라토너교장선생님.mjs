import * as THREE from './외부도구/three.module.js';
import {GLTFLoader} from './외부도구/GLTFLoader.js';
import {createPrincipalFace,PRINCIPAL_FACE_VERSION,PRINCIPAL_HEAD_SCALE,PRINCIPAL_SKIN_COLOR,getPrincipalFaceState} from './교장선생님얼굴.mjs';
import {applyApprovedPrincipalAppearance,PRINCIPAL_APPEARANCE_VERSION} from './교장선생님피부마감.mjs';
// Articulated runner with the same locally stored portrait as the office NPC.
const sphere=new THREE.SphereGeometry(1,24,16),box=new THREE.BoxGeometry(1,1,1);
const officeHeadURL=new URL('./캐릭터모델/교장선생님-머리.glb',import.meta.url),loader=new GLTFLoader();
const OFFICE_SOURCE_MIN_Y=-.95166099,OFFICE_SOURCE_MAX_Y=1.00037324;
export const RUNNER_PRINCIPAL_HEIGHT=1.83;
const paint=(color,roughness=.7)=>new THREE.MeshStandardMaterial({color,roughness});
function put(parent,geometry,material,position,scale=[1,1,1]){
  const o=new THREE.Mesh(geometry,material);o.position.set(...position);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
const ball=(p,m,pos,scale)=>put(p,sphere,m,pos,scale);
const cube=(p,m,pos,scale)=>put(p,box,m,pos,scale);
function line(p,m,points,r){return put(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),20,r,6,false),m,[0,0,0]);}
function label(p,value,pos,w,h){
  const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle='#f8f5ea';ctx.fillRect(0,0,512,256);ctx.fillStyle='#1c5365';ctx.textAlign='center';
  ctx.font='bold 45px "Malgun Gothic",sans-serif';ctx.fillText('석암 RUN',256,70);ctx.font='bold 110px sans-serif';ctx.fillText(value,256,198);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
  return put(p,new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,roughness:.9}),pos);
}
export function createRunnerPrincipalNPC(){
  const root=new THREE.Group();root.name='중앙현관 마라토너 교장선생님';
  root.userData.greetingHeight=2.12;
  const skin=paint(PRINCIPAL_SKIN_COLOR),blue=paint('#176f89'),coral=paint('#f18a68'),navy=paint('#21394e'),white=paint('#f0eee5'),sole=paint('#d8dedb'),black=paint('#151e26',.25),silver=paint('#b2bac2',.4);
  const body=new THREE.Group();body.position.y=.96;root.add(body);
  ball(body,skin,[0,.35,0],[.188,.23,.111]);
  put(body,new THREE.CylinderGeometry(.202,.168,.45,24),blue,[0,.25,0],[1,1,.62]);
  ball(body,blue,[0,.445,0],[.181,.061,.112]);
  // Broad sleeveless straps and contrast side panels.
  for(const s of [-1,1]){
    line(body,coral,[[s*.15,.45,.063],[s*.192,.32,.061],[s*.17,.05,.069]],.014);
    line(body,blue,[[s*.118,.34,.104],[s*.122,.52,.043],[s*.145,.46,-.064]],.031);
  }
  line(body,white,[[-.087,.466,.105],[0,.413,.123],[.087,.466,.105]],.008);
  label(body,'09',[0,.226,.130],.235,.13);
  put(body,new THREE.CylinderGeometry(.041,.062,.082,32),skin,[0,.491,-.006]);
  const head=new THREE.Group();head.position.y=.59;head.scale.setScalar(PRINCIPAL_HEAD_SCALE);body.add(head);
  const fallbackFace=createPrincipalFace({sunglasses:true});head.add(fallbackFace);
  // Hair now belongs to the continuous head; no separate intersecting hair blobs.
  // Sports sunglasses: connected frame, dark lenses and side arms.
  for(const s of [-1,1]){
    const lens=ball(head,black,[s*.059,.173,.098],[.051,.030,.016]);lens.rotation.y=s*-.16;
    line(head,navy,[[s*.010,.191,.112],[s*.060,.204,.105],[s*.112,.189,.081],[s*.110,.152,.082],[s*.052,.145,.113],[s*.010,.160,.114]],.005);
    line(head,black,[[s*.111,.183,.087],[s*.128,.180,-.042],[s*.121,.164,-.061]],.005);
    line(head,silver,[[s*.035,.186,.115],[s*.067,.188,.113]],.0012);
  }
  line(head,black,[[-.014,.18,.118],[0,.187,.129],[.014,.18,.118]],.005);
  const band=put(head,new THREE.CylinderGeometry(.129,.127,.035,40,1,true),white,[0,.244,-.006],[1,1,.85]);band.name='흰색 선캡 띠 — 머리 윗부분 열림';band.material.side=THREE.DoubleSide;
  const brim=new THREE.Shape();brim.moveTo(-.128,.018);brim.quadraticCurveTo(-.174,.095,-.125,.172);brim.quadraticCurveTo(0,.241,.125,.172);brim.quadraticCurveTo(.174,.095,.128,.018);brim.quadraticCurveTo(0,.095,-.128,.018);
  const brimMesh=put(head,new THREE.ExtrudeGeometry(brim,{depth:.007,bevelEnabled:true,bevelThickness:.002,bevelSize:.003,bevelSegments:2,steps:1,curveSegments:16}),white,[0,.233,0]);brimMesh.rotation.x=Math.PI/2;brimMesh.name='선캡 햇빛 가리개';
  line(head,coral,[[-.126,.234,.173],[0,.232,.207],[.126,.234,.173]],.003);
  let modelStatus='loading',modelError=null;
  void loader.loadAsync(officeHeadURL.href).then(gltf=>{
    const scale=RUNNER_PRINCIPAL_HEIGHT/(OFFICE_SOURCE_MAX_Y-OFFICE_SOURCE_MIN_Y);
    gltf.scene.scale.setScalar(scale);gltf.scene.position.y=-OFFICE_SOURCE_MIN_Y*scale;
    gltf.scene.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
    root.add(gltf.scene);fallbackFace.visible=false;modelStatus='ready';
  }).catch(reason=>{modelStatus='error';modelError=String(reason?.message??reason);console.warn('러닝복 교장선생님 얼굴 모델 로드 실패',reason);});
  ball(root,navy,[0,.965,0],[.176,.12,.11]);
  const legs=[];
  for(const s of [-1,1]){
    const leg=new THREE.Group();leg.position.set(s*.094,.94,0);root.add(leg);legs.push(leg);
    put(leg,new THREE.CylinderGeometry(.089,.081,.225,18),navy,[0,-.106,0]);
    line(leg,coral,[[s*.081,-.015,.005],[s*.079,-.21,.005]],.007);
    ball(leg,skin,[0,-.295,.001],[.066,.145,.064]);
    ball(leg,skin,[0,-.415,.006],[.055,.059,.06]);
    ball(leg,skin,[0,-.576,-.009],[.05,.172,.055]);
    put(leg,new THREE.CylinderGeometry(.038,.038,.13,18),white,[0,-.755,0]);
    line(leg,blue,[[-.025,-.705,.029],[0,-.705,.038],[.025,-.705,.029]],.005);
    ball(leg,sole,[0,-.89,.052],[.072,.026,.141]);
    ball(leg,blue,[0,-.859,.049],[.066,.048,.13]);
    ball(leg,coral,[0,-.860,.142],[.057,.035,.039]);
    for(let i=0;i<3;i++)line(leg,white,[[-.025,-.817,.045+i*.02],[.025,-.817,.045+i*.02]],.0025);
    // Bend the calf/foot as a unit below the knee, retaining the approved outfit.
    const shin=new THREE.Group();shin.position.y=-.415;
    for(const part of [...leg.children]){
      part.geometry.computeBoundingBox();
      if(part.position.y<-.45||part.geometry.boundingBox.max.y<-.65){
        leg.remove(part);part.position.y+=.415;shin.add(part);
      }
    }
    leg.add(shin);leg.userData.shin=shin;
  }
  const arms=[];
  for(const s of [-1,1]){
    const arm=new THREE.Group();arm.position.set(s*.188,.423,0);arm.rotation.z=s*.075;body.add(arm);arms.push(arm);
    ball(arm,skin,[0,-.092,0],[.055,.151,.057]);
    const forearm=new THREE.Group();forearm.position.set(0,-.22,0);arm.add(forearm);arm.userData.forearm=forearm;
    ball(forearm,skin,[0,-.098,0],[.045,.126,.047]);
    ball(forearm,skin,[0,-.225,.006],[.039,.05,.029]);
    for(let k=0;k<4;k++)ball(forearm,skin,[-.025+k*.016,-.257,.016],[.009,.024,.011]);
    ball(forearm,skin,[-s*.039,-.221,.022],[.012,.025,.014]);
  }
  // Megaphone follows the right forearm and hand as one articulated group.
  const holding=arms[1];holding.rotation.x=-.28;holding.userData.forearm.rotation.x=-1.22;
  const megaphone=new THREE.Group();megaphone.name='오른손 메가폰';megaphone.position.set(0,-.229,.048);holding.userData.forearm.add(megaphone);megaphone.rotation.x=1.50;
  cube(megaphone,navy,[0,.001,0],[.043,.13,.042]);
  const horn=put(megaphone,new THREE.CylinderGeometry(.113,.040,.235,32,1,true),white,[0,.095,.055]);horn.rotation.x=Math.PI/2;horn.material=new THREE.MeshStandardMaterial({color:'#f2eee6',side:THREE.DoubleSide,roughness:.65});
  const lip=put(megaphone,new THREE.TorusGeometry(.113,.012,10,40),coral,[0,.095,.172]);
  const inner=put(megaphone,new THREE.CircleGeometry(.085,32),navy,[0,.095,.134]);
  ball(megaphone,silver,[0,.095,.148],[.034,.034,.018]);
  ball(megaphone,coral,[0,.095,-.067],[.047,.047,.037]);
  let t=0,walkBlend=0;
  function update(dt,state){
    t+=dt;root.position.set(state.position.x,state.position.z,-state.position.y);root.rotation.y=state.heading;
    walkBlend+=((state.moving?1:0)-walkBlend)*(1-Math.exp(-dt*10));
    const swing=Math.sin(state.phase??0)*.26*walkBlend;
    legs[0].rotation.x=swing;legs[1].rotation.x=-swing;
    legs[0].userData.shin.rotation.x=Math.max(0,-Math.cos(state.phase??0))*.35*walkBlend;
    legs[1].userData.shin.rotation.x=Math.max(0,Math.cos(state.phase??0))*.35*walkBlend;
    body.position.y=.96+Math.sin(t*1.8)*.003+Math.abs(Math.sin(state.phase??0))*.007*walkBlend;
    arms[0].rotation.x=-.07-swing*.65+Math.sin(t*.9)*.025;holding.rotation.x=-.28+swing*.15;
    head.rotation.z=Math.sin(t*.75)*.012;
  }
  applyApprovedPrincipalAppearance(root,{runner:true});
  return {root,update,getState:()=>({outfit:'running',accessories:['sunglasses','sun-visor','megaphone'],faceTexture:modelStatus,modelStatus,modelError,faceVersion:PRINCIPAL_FACE_VERSION,appearanceVersion:PRINCIPAL_APPEARANCE_VERSION,height:RUNNER_PRINCIPAL_HEIGHT,headScale:PRINCIPAL_HEAD_SCALE,sameFaceAsOffice:true,fallbackFaceTexture:getPrincipalFaceState()})};
}
