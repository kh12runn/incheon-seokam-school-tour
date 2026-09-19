import * as THREE from './외부도구/three.module.js';
import {createStudent,CHARACTER_NAMES} from './학생캐릭터.mjs';
const VARIANTS=['boy-realistic','boy-cute','girl-realistic','girl-cute'];
export function createCharacterPicker({onChoose,onClose,onStarted,initial='boy'}){
  const dialog=document.createElement('dialog');dialog.id='캐릭터창';dialog.setAttribute('aria-labelledby','캐릭터제목');
  dialog.innerHTML=`<h2 id="캐릭터제목">함께 탐험할 친구를 골라요</h2><p>실사풍과 귀여운 모습 중 마음에 드는 친구를 골라 보세요.</p><canvas aria-label="선택한 친구의 3D 달리기 미리보기"></canvas><p id="캐릭터미리보기상태" role="status" aria-live="polite"></p><button id="캐릭터다시시도" hidden>다시 불러오기</button><div class="캐릭터선택줄"><button data-character="boy-realistic" aria-pressed="false">남학생<span>실사풍</span></button><button data-character="boy-cute" aria-pressed="false">남학생<span>귀여운 모습</span></button><button data-character="girl-realistic" aria-pressed="false">여학생<span>실사풍</span></button><button data-character="girl-cute" aria-pressed="false">여학생<span>귀여운 모습</span></button></div><button class="primary" id="캐릭터확인" disabled>이 친구로 출발!</button><button id="캐릭터닫기">취소</button>`;
  document.body.append(dialog);const canvas=dialog.querySelector('canvas'),status=dialog.querySelector('#캐릭터미리보기상태'),confirm=dialog.querySelector('#캐릭터확인'),retry=dialog.querySelector('#캐릭터다시시도');
  let renderer,scene,camera,student=null,selected=VARIANTS.includes(initial)?initial:initial==='girl'?'girl-cute':'boy-cute',frameId=0,last=0,time=0,confirmed=false,requestId=0,ready=false;
  const refresh=()=>dialog.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.character===selected)));
  function clearStudent(){
    requestId++;ready=false;confirm.disabled=true;
    if(student){scene.remove(student.root);student.dispose?.();student=null;}
  }
  async function loadSelected(){
    clearStudent();const currentRequest=requestId;
    status.textContent='친구를 불러오는 중이에요…';retry.hidden=true;canvas.setAttribute('aria-busy','true');
    try{
      const next=createStudent(selected);student=next;scene.add(next.root);next.snapHeading(.12);
      await next.ready;
      if(currentRequest!==requestId||student!==next)return;
      if(next.modelStatus==='error')throw new Error('모델을 불러오지 못했습니다.');
      ready=true;confirm.disabled=false;status.textContent=CHARACTER_NAMES[selected]+' — 함께 출발할 준비가 됐어요.';canvas.setAttribute('aria-label',CHARACTER_NAMES[selected]+' 3D 달리기 미리보기');canvas.setAttribute('aria-busy','false');
    }catch(error){
      if(currentRequest!==requestId)return;
      clearStudent();status.textContent='친구를 불러오지 못했어요. 다시 시도해 주세요.';retry.hidden=false;canvas.setAttribute('aria-busy','false');
    }
  }
  function draw(now){
    if(!dialog.open)return;frameId=requestAnimationFrame(draw);const dt=Math.min((now-last)/1000,.05);last=now;time+=dt;
    const width=canvas.clientWidth||400,height=canvas.clientHeight||280;
    if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio())){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
    if(student&&ready){student.update(dt,{time,distance:dt*2.4});student.snapHeading(.12+Math.sin(time*.6)*.15);}
    renderer.render(scene,camera);
  }
  function open(){
    if(dialog.open)return;
    confirmed=false;dialog.showModal();refresh();
    if(!renderer){
      renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
      scene=new THREE.Scene();scene.background=new THREE.Color('#e5edec');scene.add(new THREE.HemisphereLight('#fff7ec','#869fac',2.4));const light=new THREE.DirectionalLight('#fff0dc',3);light.position.set(-2,4,4);scene.add(light);
      camera=new THREE.PerspectiveCamera(37,1,.05,20);camera.position.set(0,1.03,3.3);camera.lookAt(0,.85,0);
      const pad=new THREE.Mesh(new THREE.CylinderGeometry(.48,.5,.055,40),new THREE.MeshStandardMaterial({color:'#a8c6c3',roughness:.9}));pad.position.set(0,-.04,0);scene.add(pad);
    }
    loadSelected();cancelAnimationFrame(frameId);last=performance.now();draw(last);
  }
  for(const button of dialog.querySelectorAll('[data-character]'))button.onclick=()=>{if(selected===button.dataset.character)return;selected=button.dataset.character;refresh();loadSelected();};
  retry.onclick=()=>loadSelected();
  confirm.onclick=async()=>{
    if(!ready||confirm.disabled)return;
    const chosen=selected;confirm.disabled=true;status.textContent='탐험을 준비하고 있어요…';
    const controls=[...dialog.querySelectorAll('[data-character]'),dialog.querySelector('#캐릭터닫기')];controls.forEach(b=>b.disabled=true);
    const preventCancel=event=>event.preventDefault();dialog.addEventListener('cancel',preventCancel);
    try{await onChoose(chosen);confirmed=true;dialog.close();onStarted?.();}
    catch(error){status.textContent='탐험을 시작하지 못했어요. 다시 출발 버튼을 눌러 주세요.';confirm.disabled=!ready;}
    finally{controls.forEach(b=>b.disabled=false);dialog.removeEventListener('cancel',preventCancel);}
  };
  dialog.querySelector('#캐릭터닫기').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{cancelAnimationFrame(frameId);clearStudent();if(!confirmed)onClose?.();});
  return {open,isOpen:()=>dialog.open,getSelected:()=>selected,name:()=>CHARACTER_NAMES[selected]};
}
