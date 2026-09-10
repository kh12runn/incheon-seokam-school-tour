import * as THREE from './외부도구/three.module.js';
import {buildWorld,EYE_HEIGHT,localPoint} from './이동물리.mjs';
import {floorDestination} from './층별이동.mjs';
import {surfaceKind,finishMaterial,softEnvironment} from './현실재질.mjs';
import {ELEVATOR,nearElevator,elevatorDestination} from './엘리베이터.mjs';
import {shoeCabinets} from './사진참고마감.mjs';
import {createStudent,CHARACTER_NAMES,RUN_SPEED} from './학생캐릭터.mjs';
import {createCharacterPicker} from './캐릭터선택.mjs';
import {createCameraCollision,thirdPersonDesired} from './삼인칭카메라.mjs';
import {createJumpMotion} from './점프물리.mjs';
import {CLASS64_ID,CLASS64_SPAWN} from './육학년사반.mjs';
import {class64Details} from './육학년사반표현.mjs';
import {mainClassroomDetails} from './본관교실표현.mjs';
const $=id=>document.getElementById(id);
const canvas=$('화면'),panel=$('시작안내'),status=$('상태'),where=$('현재위치');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(error){$('불러오기').textContent='3D 그래픽을 시작할 수 없습니다.';status.textContent='Chrome 또는 Edge에서 하드웨어 가속을 켜고 다시 열어주세요.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#bdd7e5');scene.fog=new THREE.Fog('#bdd7e5',190,350);
scene.add(new THREE.HemisphereLight(0xe4edfa,0xb4ac91,1.35));
scene.environment=softEnvironment(renderer);
const interiorLight=new THREE.PointLight(0xfff3de,12,13,2);scene.add(interiorLight);
const sun=new THREE.DirectionalLight(0xfff4dd,2.7);sun.position.set(-30,90,-65);scene.add(sun);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-135,right:135,top:135,bottom:-135,near:.5,far:350});
sun.shadow.bias=-.00008;sun.shadow.normalBias=.025;
const camera=new THREE.PerspectiveCamera(76,1,.045,500);camera.rotation.order='YXZ';
let data,world,position,mode='overview',locked=false,dragMode=false,freeLook=false,yaw=-Math.PI/2,pitch=0;
let freeLookPoint=null;
let velocity={x:0,y:0},smoothZ=EYE_HEIGHT,last=performance.now(),elapsed=0,ready=false;
let orbit={yaw:.75,pitch:.83,distance:185},drag=null;
// Explicit user preference: always rotate immediately, independent of OS settings.
let autoOrbit=true,orbitResumeAt=0,elevatorBusy=false;
let selectedCharacter=null;
let jumpMotion;
let class64PhotoFinish;
const greeting=document.createElement('div');greeting.id='인사말';greeting.textContent='안녕~ 👋';greeting.hidden=true;greeting.setAttribute('role','status');document.body.append(greeting);
let characterChosenThisVisit=false;
try{const saved=localStorage.getItem('석암학교-캐릭터');if(CHARACTER_NAMES[saved])selectedCharacter=saved;}catch{}
let avatar=createStudent(selectedCharacter??'boy');scene.add(avatar.root);avatar.root.visible=false;avatar.snapHeading(Math.PI/2);
let resolveCamera,followDistance=2.9,cameraDistance=2.9,cameraReset=true,cameraBlocked=false,pickerFallback=false,pickerResume=false;
const keys=new Set(),visitedRooms=new Set(),visitedFloors=new Set(),visuals=[],labels=[];
const markerGroup=new THREE.Group();scene.add(markerGroup);
const upConversion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
const convert=p=>new THREE.Vector3(p.x,p.z,-p.y);
function notice(text){status.textContent=text;}
function updateCharacterLabel(){$('캐릭터상태').textContent=mode==='walk'&&characterChosenThisVisit?CHARACTER_NAMES[selectedCharacter]+'과 함께, 다음 교실로 가볼까요?':'탐험 시작 후 남학생 / 여학생을 선택하세요';}
const characterPicker=createCharacterPicker({initial:selectedCharacter??'boy',onChoose(variant){
  if(avatar.variant!==variant){scene.remove(avatar.root);avatar.dispose();avatar=createStudent(variant);scene.add(avatar.root);avatar.snapHeading(Math.PI+yaw);}
  selectedCharacter=variant;characterChosenThisVisit=true;try{localStorage.setItem('석암학교-캐릭터',variant);}catch{}
  updateCharacterLabel();cameraReset=true;startWalk(pickerFallback);
},onClose(){if(pickerResume)startWalk(true);else pausePanel();}});
function openCharacterPicker(fallback=false){
  if(!ready||characterPicker.isOpen())return;
  $('게임메뉴').close();
  pickerFallback=fallback;pickerResume=isPlaying();clearInput();dragMode=false;freeLook=false;if(document.pointerLockElement)document.exitPointerLock();pausePanel();characterPicker.open();
}
updateCharacterLabel();
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
function textTexture(text,background=false){
  const c=document.createElement('canvas'),ctx=c.getContext('2d');const lines=text.split('\n');
  ctx.font='600 52px "Malgun Gothic",sans-serif';
  const width=Math.ceil(Math.max(...lines.map(s=>ctx.measureText(s).width))+36);
  c.width=Math.min(2048,Math.max(128,width));c.height=lines.length*68+20;
  ctx.font='600 52px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  if(background){ctx.fillStyle='#153843';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#fff';}
  else ctx.fillStyle='#172f36';
  lines.forEach((s,i)=>ctx.fillText(s,c.width/2,44+i*68,c.width-12));
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return {tex,ratio:c.width/c.height};
}
function buildVisuals(){
  const roomDetails=class64Details();scene.add(roomDetails);visuals.push({mesh:roomDetails,floor:4,ceiling:false});
  class64PhotoFinish=roomDetails.userData.photoFinish;
  for(const config of world.classroomsMain.rooms){
    const mesh=mainClassroomDetails(config);scene.add(mesh);
    visuals.push({mesh,floor:parseInt(config.room.floor),interiorRoom:config.roomId,center:convert(config.spawn),ceiling:false});
  }
  const groups=new Map(),geometry=new THREE.BoxGeometry(1,1,1);
  for(const b of world.boxes){
    const groupKey=b.color.join(',')+'|'+b.floor+'|'+(b.kind==='ceiling'?'ceiling':'normal')+'|'+surfaceKind(b)+'|'+(b.interiorRoom??'');
    if(!groups.has(groupKey))groups.set(groupKey,[]);groups.get(groupKey).push(b);
  }
  const matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion();
  for(const items of groups.values()){
    const mesh=new THREE.InstancedMesh(geometry,finishMaterial(items[0]),items.length);
    mesh.castShadow=!['clear_glass','glass','lamp'].includes(surfaceKind(items[0]));mesh.receiveShadow=true;
    items.forEach((b,i)=>{const a=b.bounds;
      matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),quaternion,new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));
      mesh.setMatrixAt(i,matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);
    const interiorRoom=items[0].interiorRoom,config=world.classroomsMain.rooms.find(r=>r.roomId===interiorRoom);
    visuals.push({mesh,floor:items[0].floor,ceiling:items[0].kind==='ceiling',interiorRoom,center:config?convert(config.spawn):null});
  }
  const roomById=new Map(data.rooms.map(r=>[r.id,r]));
  {
    const {tex}=textTexture('야외 주차장',true);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.65),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
    sign.position.set(10.25,1.3,-19.29);scene.add(sign);labels.push({mesh:sign,floor:0,name:'주차장 안내'});
  }
  for(const floor of [3,4])for(const cabinet of shoeCabinets(data,floor)){
    const {tex}=textTexture(cabinet.name,true);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.12),new THREE.MeshBasicMaterial({map:tex}));
    sign.position.set(cabinet.x+cabinet.width/2,(floor-1)*data.floorHeight+.99,-cabinet.y+.008);scene.add(sign);
    labels.push({mesh:sign,floor,name:'신발장 이름표'});
  }
  for(let floor=1;floor<=4;floor++){
    const {tex}=textTexture(`엘리베이터  ${floor}층\n앞에서 E · 층 선택`,true);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.45,.5),new THREE.MeshBasicMaterial({map:tex}));
    sign.position.set(ELEVATOR.x,(floor-1)*data.floorHeight+2.69,-2.78);scene.add(sign);
    labels.push({mesh:sign,floor,name:'엘리베이터 안내'});
  }
  for(const label of data.labels){
    if(roomById.get(label.spaceId)?.type==='stair'||label.name.includes('Heading'))continue;
    if(label.spaceId==='1F_MAIN_LOBBY'&&label.name.startsWith('Sign_')){} // interior entrance sign stays
    const {tex}=textTexture(label.text);
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(.1,label.width),Math.max(.1,label.height)),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
    plane.position.set(label.position[0],label.position[2],-label.position[1]);
    plane.quaternion.copy(upConversion).multiply(new THREE.Quaternion(...label.quaternion));
    scene.add(plane);labels.push({mesh:plane,floor:label.floor,name:label.name});
  }
  for(const stair of world.stairs){
    for(let floor=1;floor<=4;floor++){
      const room=data.rooms.find(r=>r.id===floor+'F_'+stair.id);
      const text=room?.captureName??'계단';
      const {tex,ratio}=textTexture(`${floor}층  계단\n${text}`,true);
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:true}));
      const p=localPoint(stair.frame,stair.frame.width/2,-.05,(floor-1)*3.4+2.45);
      sprite.position.copy(convert(p));sprite.scale.set(Math.min(4.6,ratio*.64),.64,1);scene.add(sprite);
      labels.push({mesh:sprite,floor,name:'계단 안내'});
    }
  }
  // Four simple exploration beacons; aesthetics can be replaced with real imagery.
  for(let floor=1;floor<=4;floor++){
    const beacon=new THREE.Mesh(new THREE.OctahedronGeometry(.16),new THREE.MeshBasicMaterial({color:[0,0xffb54c,0xbd99ff,0x39d7b2,0xffdb50][floor]}));
    beacon.position.set(58,(floor-1)*3.4+1.15,-1.5);beacon.userData.floor=floor;markerGroup.add(beacon);
  }
}
function overviewCamera(dt){
  if(camera.fov!==76){camera.fov=76;camera.updateProjectionMatrix();}
  if(autoOrbit&&!$('게임메뉴').open&&!drag&&!document.hidden&&performance.now()>orbitResumeAt)orbit.yaw+=dt*.12;
  const center=new THREE.Vector3(44,4,27);
  const distance=orbit.distance*Math.max(1,1/Math.max(.45,camera.aspect));
  camera.position.copy(center).add(new THREE.Vector3(Math.sin(orbit.yaw)*Math.cos(orbit.pitch),Math.sin(orbit.pitch),Math.cos(orbit.yaw)*Math.cos(orbit.pitch)).multiplyScalar(distance));
  camera.lookAt(center);
}
function cameraWalk(dt){
  smoothZ=THREE.MathUtils.lerp(smoothZ,position.z+EYE_HEIGHT,1-Math.exp(-dt*18));
  const target={x:position.x,y:position.y,z:smoothZ-EYE_HEIGHT+1.12};
  const desired=thirdPersonDesired(target,yaw,pitch,followDistance),safe=resolveCamera(target,desired);
  // Snap inward on collision; only ease outward, so smoothing never crosses a wall.
  cameraDistance=cameraReset||safe.distance<cameraDistance?safe.distance:THREE.MathUtils.lerp(cameraDistance,safe.distance,1-Math.exp(-dt*6));cameraReset=false;cameraBlocked=safe.blocked;
  const length=Math.hypot(desired.x-target.x,desired.y-target.y,desired.z-target.z),t=cameraDistance/Math.max(length,.001);
  const cam={x:target.x+(desired.x-target.x)*t,y:target.y+(desired.y-target.y)*t,z:target.z+(desired.z-target.z)*t};
  if(camera.fov!==68){camera.fov=68;camera.updateProjectionMatrix();}
  camera.position.copy(convert(cam));camera.lookAt(convert(target));
}
function isPlaying(){return mode==='walk'&&(locked||dragMode||freeLook)&&!document.hidden&&!$('게임메뉴').open&&!characterPicker.isOpen()&&!elevatorBusy&&!$('승강기창').open;}
function clearInput(){keys.clear();velocity={x:0,y:0};drag=null;freeLookPoint=null;avatar.cancelWave();greeting.hidden=true;}
function greet(){
  if(!isPlaying()||jumpMotion.getState().airborne||avatar.getState().waving)return;
  clearInput();avatar.wave(yaw);notice('안녕~! · Z 인사 · Space 점프');
  if('speechSynthesis' in window){
    const line=new SpeechSynthesisUtterance('안녕!');line.lang='ko-KR';line.rate=1.03;line.pitch=1.2;
    const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ko'));if(voice)line.voice=voice;
    speechSynthesis.cancel();speechSynthesis.speak(line);
  }
}
function pausePanel(){
  const playing=isPlaying();
  panel.hidden=playing||$('게임메뉴').open;document.body.dataset.mode=mode;document.body.dataset.playing=String(playing);
  $('조준점').hidden=true;
  const title=mode==='overview'?'탐험 시작하기':'탐험 계속하기';
  $('걷기').textContent=title;$('시작').textContent=title+'  →';
  $('안내표식').textContent=mode==='overview'?'나만의 학교 모험':'탐험 일시정지';
  $('안내제목').innerHTML=mode==='overview'?'익숙한 학교,<br>새로운 모험.':'잠깐 쉬어갈까요?';
  updateCharacterLabel();
}
function openMenu(){
  if(!ready||characterPicker.isOpen()||$('승강기창').open||elevatorBusy||$('게임메뉴').open)return;
  dragMode=false;freeLook=false;clearInput();if(document.pointerLockElement)document.exitPointerLock();
  $('게임메뉴').showModal();pausePanel();notice('탐험 메뉴 · 이동할 층을 선택하거나 탐험을 계속하세요.');
}
$('메뉴').addEventListener('click',openMenu);
function dismissMenu(){
  if(!$('게임메뉴').open)return;
  if(mode==='walk')startWalk();
  else{$('게임메뉴').close();pausePanel();}
}
$('메뉴닫기').addEventListener('click',dismissMenu);
// Only user dismissal resumes: programmatic close also serves floor/picker/overview transitions.
$('게임메뉴').addEventListener('cancel',e=>{e.preventDefault();dismissMenu();});
$('게임메뉴').addEventListener('close',pausePanel);
async function startWalk(fallback=false){
  if(ready&&!characterChosenThisVisit){openCharacterPicker(fallback);return;}
  if(!ready)return;$('게임메뉴').close();mode='walk';dragMode=fallback;freeLook=!fallback;clearInput();
  cameraReset=true;camera.rotation.order='YXZ';smoothZ=position.z+EYE_HEIGHT;cameraWalk(.1);
  if(fallback){pausePanel();notice('드래그 시점 모드 · 화면을 드래그해 둘러보세요.');canvas.focus();return;}
  pausePanel();
  try{
    canvas.focus();
    await canvas.requestPointerLock();
  }catch(error){
    lockFallback();
  }
}
function lockFallback(){
  if(mode!=='walk'||locked||dragMode||$('게임메뉴').open||characterPicker.isOpen()||$('승강기창').open||elevatorBusy)return;
  freeLook=true;clearInput();pausePanel();canvas.focus();
  notice('마우스를 움직여 둘러보기 · 화면을 한 번 클릭하면 마우스 잠금 재시도 · ESC 메뉴');
}
function overview(){
  $('게임메뉴').close();mode='overview';dragMode=false;freeLook=false;clearInput();if(document.pointerLockElement)document.exitPointerLock();
  orbit={yaw:.75,pitch:.83,distance:150};orbitResumeAt=0;
  pausePanel();notice('학교 전체 항공뷰 · 드래그로 회전 / 휠로 확대 · 학교 탐험 시작하기');
}
function reset(){position={...world.spawn};jumpMotion.reset();yaw=-Math.PI/2;pitch=0;smoothZ=position.z+EYE_HEIGHT;cameraReset=true;avatar.snapHeading(Math.PI+yaw);clearInput();notice('1층 본관 복도 출발점으로 돌아왔습니다.');}
function openElevator(){
  if(!ready||mode!=='walk'||elevatorBusy||!nearElevator(position,data.floorHeight))return;
  clearInput();dragMode=false;freeLook=false;if(document.pointerLockElement)document.exitPointerLock();pausePanel();
  $('승강기현재층').textContent=Math.round(position.z/data.floorHeight)+1+'층';$('승강기창').showModal();
}
$('승강기호출').addEventListener('click',openElevator);
$('승강기닫기').addEventListener('click',()=>$('승강기창').close());
$('승강기창').addEventListener('close',()=>{if(!elevatorBusy)startWalk(true);});
for(const button of document.querySelectorAll('[data-elevator-floor]'))button.addEventListener('click',async()=>{
  if(elevatorBusy)return;
  const p=elevatorDestination(Number(button.dataset.elevatorFloor),data.floorHeight),valid=p&&world.candidate(p.x,p.y,p.z);
  if(!valid){notice('승강기 도착 위치를 확인하지 못했습니다.');return;}
  elevatorBusy=true;clearInput();$('승강기창').close();$('승강기전환').hidden=false;
  try{
    await new Promise(resolve=>setTimeout(resolve,700));position=valid;jumpMotion.reset();yaw=Math.PI;pitch=0;smoothZ=p.z+EYE_HEIGHT;
  }finally{elevatorBusy=false;$('승강기전환').hidden=true;await startWalk(true);notice(button.dataset.elevatorFloor+'층 엘리베이터 앞에 도착했습니다.');}
});
$('걷기').addEventListener('click',()=>mode==='overview'?openCharacterPicker():startWalk());$('시작').addEventListener('click',()=>mode==='overview'?openCharacterPicker():startWalk());
$('육사이동').addEventListener('click',()=>{if(!ready)return;position={...CLASS64_SPAWN};jumpMotion.reset();yaw=Math.PI/2;pitch=0;avatar.snapHeading(Math.PI+yaw);startWalk(true);notice('6-4 교실 · 사진을 참고한 실내 · 책상/의자 충돌 적용');});
$('드래그걷기').addEventListener('click',()=>startWalk(true));$('전체').addEventListener('click',overview);
$('처음').addEventListener('click',()=>{if(ready){reset();startWalk(true);}});
$('동층이동').addEventListener('change',async e=>{
  const value=e.target.value;e.target.value='';if(!ready||!value)return;
  const [building,floor]=value.split(':');
  const destination=floorDestination(data,building,Number(floor));if(!destination)return;
  const p=destination.point,valid=world.candidate(p.x,p.y,p.z);
  if(!valid){notice('중앙현관 이동 위치를 확인하지 못했습니다.');return;}
  if(document.pointerLockElement)document.exitPointerLock();
  position=valid;jumpMotion.reset();yaw=destination.yaw;pitch=0;
  // Native select changes do not reliably grant pointer-lock permission.
  await startWalk(true);notice(destination.label+' · WASD 이동 / 드래그로 둘러보기');
});
$('방이동').addEventListener('click',()=>{
  const room=data.rooms.find(r=>r.id===$('방선택').value);if(!room)return;
  const b=room.bounds,interior=world.classroomsMain.rooms.find(r=>r.roomId===room.id);
  const p=room.id===CLASS64_ID?{...CLASS64_SPAWN}:interior?{...interior.spawn}:{x:(b[0]+b[1])/2,y:(b[2]+b[3])/2,z:b[4]};
  const valid=world.candidate(p.x,p.y,p.z);if(!valid){notice('해당 위치는 이동할 수 없습니다.');return;}
  position=valid;jumpMotion.reset();yaw=interior||room.id===CLASS64_ID?Math.PI/2:room.building==='ANNEX'?-Math.PI/2:0;pitch=0;startWalk();
});
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===canvas;
  if(locked&&(mode!=='walk'||$('게임메뉴').open||characterPicker.isOpen()||$('승강기창').open||elevatorBusy)){document.exitPointerLock();return;}
  if(locked){freeLook=false;dragMode=false;}
  clearInput();pausePanel();
  if(!locked&&mode==='walk'&&!dragMode&&!freeLook&&!characterPicker.isOpen()&&!$('승강기창').open&&!elevatorBusy)openMenu();
  if(locked)notice('WASD 달리기 · Space 점프 · Z 안녕~ · 마우스 시점 · ESC 정지');
  else if($('게임메뉴').open)notice('일시정지 · ESC / X / 탐험 계속하기로 재개');
});
document.addEventListener('pointerlockerror',lockFallback);
function lookAround(dx,dy){
  const sensitivity=Number($('감도').value)*.001;
  yaw-=dx*sensitivity;pitch=Math.max(-.8,Math.min(.65,pitch-dy*sensitivity));
}
document.addEventListener('mousemove',e=>{
  if(!locked||!isPlaying())return;lookAround(e.movementX,e.movementY);
});
canvas.addEventListener('pointerdown',e=>{
  if(freeLook&&isPlaying()){startWalk();return;}
  if(locked)return;orbitResumeAt=performance.now()+6000;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus();
});
canvas.addEventListener('pointermove',e=>{
  // Esc is not a user-activation gesture in every browser. Keep mouse look usable
  // without holding a button when re-locking is denied; a click can restore lock.
  if(freeLook&&!locked&&isPlaying()&&e.pointerType==='mouse'){
    const previous=freeLookPoint;freeLookPoint={x:e.clientX,y:e.clientY};
    if(previous)lookAround(e.clientX-previous.x,e.clientY-previous.y);
    return;
  }
  if(!drag||locked)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};
  if(mode==='overview'){orbitResumeAt=performance.now()+6000;orbit.yaw-=dx*.006;orbit.pitch=Math.max(.1,Math.min(1.5,orbit.pitch+dy*.006));}
  else if(dragMode){yaw-=dx*.004;pitch=Math.max(-.8,Math.min(.65,pitch-dy*.004));}
});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('pointerleave',()=>freeLookPoint=null);
canvas.addEventListener('wheel',e=>{if(mode==='overview'){orbitResumeAt=performance.now()+6000;orbit.distance=Math.max(18,Math.min(280,orbit.distance+e.deltaY*.09));e.preventDefault();}else if(isPlaying()){followDistance=Math.max(1.4,Math.min(4.8,followDistance+e.deltaY*.004));e.preventDefault();}},{passive:false});
document.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&$('게임메뉴').open){e.preventDefault();if(!e.repeat)dismissMenu();return;}
  if($('게임메뉴').open||$('승강기창').open||characterPicker.isOpen()||elevatorBusy)return;
  if(['INPUT','SELECT','TEXTAREA','BUTTON','SUMMARY'].includes(e.target.tagName)&&e.code!=='Escape')return;
  if(isPlaying()&&['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){keys.add(e.code);e.preventDefault();}
  if(e.code==='Space'&&isPlaying()){
    e.preventDefault();if(!e.repeat){avatar.cancelWave();jumpMotion.start(position);}
  }
  if(e.code==='KeyZ'&&isPlaying()){e.preventDefault();if(!e.repeat)greet();}
  if(e.code==='KeyV'&&!e.repeat)overview();
  if(e.code==='KeyR'&&!e.repeat&&ready)reset();
  if(e.code==='KeyE'&&!e.repeat)openElevator();
  if(e.code==='Escape'&&!e.repeat){e.preventDefault();openMenu();}
});
document.addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',clearInput);document.addEventListener('visibilitychange',clearInput);
const map=$('지도'),mapCtx=map.getContext('2d');
function updateHUD(){
  if(!world)return;
  $('승강기호출').hidden=!isPlaying()||!nearElevator(position,data.floorHeight);
  const at=world.roomAt(position),floor=at.floor;
  const stair=world.stairs.find(s=>{const f=s.frame,dx=position.x-f.origin[0],dy=position.y-f.origin[1],u=dx*f.right[0]+dy*f.right[1],v=dx*f.inward[0]+dy*f.inward[1];return u>0&&u<f.width&&v>0&&v<f.depth;});
  where.textContent=mode==='overview'?'학교 전체 · 4개 층':`${at.floor}층 · ${at.room?.name??(stair?'계단 이동 중':position.y<-8&&position.x<90?'운동장':'복도')}`;
  if(isPlaying()){
    if(at.room?.type==='classroom')visitedRooms.add(at.room.id);
    if(Math.hypot(position.x-58,position.y-1.5)<1.5&&Math.abs(position.z-(at.floor-1)*3.4)<.2)visitedFloors.add(at.floor);
  }
  $('탐험').textContent=`교실 탐험 ${visitedRooms.size}/41 · 층별 표식 ${visitedFloors.size}/4`;
  for(const m of markerGroup.children)m.visible=!visitedFloors.has(m.userData.floor);
  $('탐험진행').value=visitedRooms.size;
  for(const v of visuals)v.mesh.visible=!v.interiorRoom||(mode==='walk'&&v.floor===at.floor&&v.center.distanceTo(camera.position)<32);
  for(const l of labels){
    const distance=l.mesh.position.distanceTo(camera.position);
    l.mesh.visible=mode==='walk'?(distance<24&&(!l.floor||l.floor===at.floor)&&!l.name.startsWith('Label_')):false;
  }
  mapCtx.fillStyle='#102529';mapCtx.fillRect(0,0,250,185);
  const sx=x=>28+x*1.9,sy=y=>28-y*1.9;
  for(const r of data.rooms){
    if(parseInt(r.floor)!==floor)continue;const b=r.bounds;
    mapCtx.fillStyle=r.type==='stair'?'#bca1ff':r.type==='corridor'?'#91a6b4':visitedRooms.has(r.id)?'#57c79f':'#4d7184';
    mapCtx.fillRect(sx(b[0]),sy(b[3]),(b[1]-b[0])*1.9,(b[3]-b[2])*1.9);
    mapCtx.strokeStyle='#172f3c';mapCtx.strokeRect(sx(b[0]),sy(b[3]),(b[1]-b[0])*1.9,(b[3]-b[2])*1.9);
  }
  mapCtx.save();mapCtx.translate(sx(position.x),sy(position.y));mapCtx.rotate(mode==='walk'?Math.PI-avatar.getState().heading:-yaw);
  mapCtx.fillStyle='#ffdc68';mapCtx.beginPath();mapCtx.moveTo(0,-7);mapCtx.lineTo(4,5);mapCtx.lineTo(-4,5);mapCtx.closePath();mapCtx.fill();mapCtx.restore();
  mapCtx.fillStyle='white';mapCtx.font='12px sans-serif';mapCtx.fillText(floor+'층 · 보라색은 계단',10,176);
}
function frame(now){
  requestAnimationFrame(frame);const wallDt=Math.min((now-last)/1000,1),dt=Math.min(wallDt,.05);last=now;elapsed+=dt;
  if(!ready)return;
  if(characterPicker.isOpen())return;
  if(mode==='walk'&&position.z>9.8&&Math.hypot(position.x-35,position.y+3.5)<14)class64PhotoFinish.load();
  const previous={...position};
  if(isPlaying()){
    let forward=Number(keys.has('KeyW'))-Number(keys.has('KeyS')),right=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
    const length=Math.hypot(forward,right);if(length){forward/=length;right/=length;}
    const speed=RUN_SPEED;
    const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*speed,dy=(Math.cos(yaw)*forward+Math.sin(yaw)*right)*speed;
    const a=1-Math.exp(-dt*14);velocity.x+=(dx-velocity.x)*a;velocity.y+=(dy-velocity.y)*a;
    if(length&&avatar.getState().waving)avatar.cancelWave();
    position=jumpMotion.step(position,velocity.x*dt,velocity.y*dt,dt);
  }
  if(mode==='walk')cameraWalk(dt);else overviewCamera(wallDt);
  avatar.root.visible=mode==='walk'&&cameraDistance>.32;
  if(mode==='walk'){
    const dx=position.x-previous.x,dy=position.y-previous.y,baseZ=position.z;
    avatar.root.position.set(position.x,baseZ,-position.y);
    const heading=avatar.getState().heading,c=Math.cos(heading),s=Math.sin(heading);
    avatar.update(isPlaying()?dt:0,{distance:Math.hypot(dx,dy),dx,dy,time:elapsed,baseZ,...jumpMotion.getState(),
      groundHeight:(x,z)=>{const h=world.support(position.x+c*x+s*z,position.y+s*x-c*z,position.z);return Number.isFinite(h)?h:position.z;}});
    avatar.setOpacity(THREE.MathUtils.clamp((cameraDistance-.3)/.7,0,1));
  }
  greeting.hidden=mode!=='walk'||!avatar.getState().waving||!isPlaying();
  if(!greeting.hidden){const p=new THREE.Vector3(position.x,position.z+1.95,-position.y).project(camera);greeting.hidden=p.z>1||p.z< -1;greeting.style.left=(p.x*.5+.5)*innerWidth+'px';greeting.style.top=(-p.y*.5+.5)*innerHeight+'px';}
  interiorLight.visible=mode==='walk'&&position.y>=0&&position.y<=3;
  interiorLight.position.copy(camera.position);interiorLight.position.y+=.65;
  markerGroup.children.forEach(m=>m.rotation.y+=dt);
  if(Math.floor(elapsed*10)!==Math.floor((elapsed-dt)*10))updateHUD();
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
try{
  const response=await fetch(new URL('./학교구조.json',import.meta.url));if(!response.ok)throw new Error('학교 구조 파일 '+response.status);
  world=buildWorld(await response.json());data=world.data;position={...world.spawn};jumpMotion=createJumpMotion(world);resolveCamera=createCameraCollision([...world.colliders,...world.boxes.filter(b=>b.kind==='step')]);buildVisuals();ready=true;
  for(let floor=1;floor<=4;floor++){
    const group=document.createElement('optgroup');group.label=floor+'층';
    for(const r of data.rooms.filter(r=>parseInt(r.floor)===floor&&['classroom','special_room'].includes(r.type))){const option=document.createElement('option');option.value=r.id;option.textContent=r.name;group.append(option);}
    $('방선택').append(group);
  }
  document.querySelectorAll('button').forEach(b=>b.disabled=false);$('동층이동').disabled=false;autoOrbit=true;overview();last=performance.now();updateHUD();
  $('불러오기').textContent='Blender 학교 모델 준비 완료';
  // Read-only state is useful for diagnostics. Test positioning is only enabled
  // on loopback with an explicit test URL; it is not a public wall-clipping key.
  window.schoolTour={getState:()=>({ready,mode,locked,dragMode,freeLook,position:{...position},yaw,pitch,photoFinish:class64PhotoFinish.getState(),jump:jumpMotion.getState(),character:{...avatar.getState(),visible:avatar.root.visible,position:avatar.root.position.toArray()},thirdPerson:{distance:cameraDistance,requestedDistance:followDistance,blocked:cameraBlocked,camera:camera.position.toArray()},overview:{autoOrbit,orbit:{...orbit},camera:camera.position.toArray()},visitedRooms:visitedRooms.size,visitedFloors:visitedFloors.size,drawCalls:renderer.info.render.calls,menuOpen:$('게임메뉴').open})};
  if(['127.0.0.1','localhost'].includes(location.hostname)&&new URLSearchParams(location.search).has('test'))window.schoolTour.test={
    world,data,setPosition(p){if(!world.candidate(p.x,p.y,p.z))throw new Error('Invalid test position');position={...p};jumpMotion.reset();smoothZ=p.z+EYE_HEIGHT;cameraReset=true;clearInput();},setYaw(y){yaw=y;},
    step(dx,dy){position=world.move(position,dx,dy);return {...position};}
  };
  // Always begin with the whole campus, including old ?photo=1 bookmarks.
}catch(error){
  console.error(error);$('불러오기').textContent='학교를 불러오지 못했습니다.';notice(error.message+' · 학교_웹_열기.cmd로 다시 열어주세요.');
}
