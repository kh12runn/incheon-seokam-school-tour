import * as THREE from './외부도구/three.module.js';
import {createStudent,CHARACTER_NAMES} from './학생캐릭터.mjs';
export function createCharacterPicker({onChoose,onClose,initial='boy'}){
  const dialog=document.createElement('dialog');dialog.id='캐릭터창';dialog.setAttribute('aria-labelledby','캐릭터제목');
  dialog.innerHTML=`<h2 id="캐릭터제목">함께 탐험할 친구를 골라요</h2><p>친구를 선택하고 학교를 신나게 달려 보세요.</p><canvas aria-label="남학생과 여학생 3D 달리기 미리보기"></canvas><div class="캐릭터선택줄"><button data-character="boy" aria-pressed="false">남학생<span>민트 후드 · 꿀색 가방</span></button><button data-character="girl" aria-pressed="false">여학생<span>라일락 후드 · 복숭아색 가방</span></button></div><button class="primary" id="캐릭터확인">이 친구로 출발!</button><button id="캐릭터닫기">취소</button>`;
  document.body.append(dialog);const canvas=dialog.querySelector('canvas');
  let renderer,scene,camera,students,selected=initial,frameId=0,last=0,time=0,confirmed=false;
  const refresh=()=>dialog.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.character===selected)));
  function draw(now){
    if(!dialog.open)return;frameId=requestAnimationFrame(draw);const dt=Math.min((now-last)/1000,.05);last=now;time+=dt;
    const width=canvas.clientWidth||400,height=canvas.clientHeight||240;
    if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio())){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
    students.forEach((s,i)=>{const running=s.variant===selected;s.update(dt,{time:time+i,distance:running?dt*2.4:0});s.root.position.x=i?.64:-.64;s.snapHeading((i?-.28:.28)+(running?Math.sin(time*.6)*.12:0));});
    renderer.render(scene,camera);
  }
  function open(){
    confirmed=false;dialog.showModal();refresh();
    if(!renderer){
      renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
      scene=new THREE.Scene();scene.background=new THREE.Color('#e5edec');scene.add(new THREE.HemisphereLight('#fff7ec','#869fac',2.4));const light=new THREE.DirectionalLight('#fff0dc',3);light.position.set(-2,4,4);scene.add(light);
      camera=new THREE.PerspectiveCamera(37,1,.05,20);camera.position.set(0,1.03,3.3);camera.lookAt(0,.85,0);
      students=['boy','girl'].map(createStudent);students.forEach((s,i)=>{scene.add(s.root);const pad=new THREE.Mesh(new THREE.CylinderGeometry(.38,.4,.055,40),new THREE.MeshStandardMaterial({color:i?'#c9b7d5':'#a8c6c3',roughness:.9}));pad.position.set(i?.64:-.64,-.04,0);scene.add(pad);});
    }
    cancelAnimationFrame(frameId);last=performance.now();draw(last);
  }
  for(const button of dialog.querySelectorAll('[data-character]'))button.onclick=()=>{selected=button.dataset.character;refresh();};
  dialog.querySelector('#캐릭터확인').onclick=()=>{confirmed=true;dialog.close();onChoose(selected);};
  dialog.querySelector('#캐릭터닫기').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{cancelAnimationFrame(frameId);if(!confirmed)onClose?.();});
  return {open,isOpen:()=>dialog.open,getSelected:()=>selected,name:()=>CHARACTER_NAMES[selected]};
}
