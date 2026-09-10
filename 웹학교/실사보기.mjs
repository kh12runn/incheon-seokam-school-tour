import * as THREE from './외부도구/three.module.js';

// Discrete captured viewpoints: this does not claim novel-view 3D reconstruction.
export function createPhotoTour({onClose}){
  const host=document.createElement('section');host.id='실사화면';host.hidden=true;
  host.innerHTML=`<canvas tabindex="0" aria-label="4층 실제 360도 사진"></canvas><div class="사진메뉴"><strong>4층 실사 360도</strong><button data-action="close">3D 탐험으로 돌아가기</button><select aria-label="촬영 위치"></select></div><div class="사진하단"><button data-action="prev">← 이전 위치</button><span role="status">사진 준비 중</span><button data-action="next">다음 위치 →</button><small>화면 드래그: 둘러보기 · W/S 또는 ↑/↓: 촬영 위치 이동 · A/D: 시점 회전 · Esc: 3D 복귀<br>촬영 위치 사이를 연결한 360도 보기입니다. 가려진 바닥 등 일부 영역은 생성 보완했습니다.</small></div>`;
  document.body.append(host);
  const canvas=host.querySelector('canvas'),status=host.querySelector('[role=status]'),select=host.querySelector('select');
  let renderer,scene,camera,sphere,entries=[],index=0,yaw=0,pitch=0,drag=null,sequence=0,texture=null;
  let active=false,loaded=false,loadedFrom='',frameId=0;
  function resize(){if(!renderer)return;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  function draw(){if(!active)return;frameId=requestAnimationFrame(draw);camera.rotation.set(pitch,yaw,0,'YXZ');renderer.render(scene,camera);}
  function close(){active=false;sequence++;host.hidden=true;drag=null;cancelAnimationFrame(frameId);onClose(entries[index]);}
  async function show(next){
    if(!entries.length)return;
    index=Math.max(0,Math.min(entries.length-1,next));select.value=String(index);
    const item=entries[index],ticket=++sequence;
    status.textContent=item.name+' · 불러오는 중…';
    host.querySelector('[data-action=prev]').disabled=index===0;
    host.querySelector('[data-action=next]').disabled=index===entries.length-1;
    // Hide the previous viewpoint while loading to prevent a mismatched location label.
    sphere.visible=false;
    try{
      const incoming=await new THREE.TextureLoader().loadAsync(item.url);
      if(ticket!==sequence||!active){incoming.dispose();return;}
      incoming.colorSpace=THREE.SRGBColorSpace;incoming.minFilter=THREE.LinearFilter;incoming.generateMipmaps=false;
      const old=texture;texture=incoming;sphere.material.map=incoming;sphere.material.needsUpdate=true;sphere.visible=true;old?.dispose();
      sphere.rotation.y=item.heading??0;
      status.textContent=`${index+1}/${entries.length} · ${item.name}`;
    }catch(error){if(ticket===sequence)status.textContent='사진을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.';}
  }
  async function open(fromPosition,manifestUrl='./웹학교/실사목록.json'){
    active=true;host.hidden=false;status.textContent='사진 목록을 불러오는 중…';
    if(!renderer){
      renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
      scene=new THREE.Scene();scene.background=new THREE.Color('#121b22');camera=new THREE.PerspectiveCamera(78,1,.05,20);camera.rotation.order='YXZ';
      sphere=new THREE.Mesh(new THREE.SphereGeometry(10,96,64),new THREE.MeshBasicMaterial({side:THREE.BackSide}));sphere.scale.x=-1;scene.add(sphere);
    }
    sphere.visible=false;resize();cancelAnimationFrame(frameId);draw();canvas.focus();
    try{
      if(!loaded||loadedFrom!==manifestUrl){const response=await fetch(manifestUrl);if(!response.ok)throw new Error();const manifest=await response.json();entries=manifest.photos.filter(p=>p.ready);loaded=true;loadedFrom=manifestUrl;index=0;select.replaceChildren();host.querySelector('strong').textContent=manifest.title??'4층 실사 360도';
        entries.forEach((p,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=p.name;select.append(o);});}
      if(!active)return;
      if(!entries.length){status.textContent='사진 변환·검수 중입니다.';return;}
      if(fromPosition&&fromPosition.z>8){
        let distance=Infinity;
        entries.forEach((p,i)=>{const q=p.position,d=Math.hypot(q.x-fromPosition.x,q.y-fromPosition.y,3*(q.z-fromPosition.z));if(d<distance){distance=d;index=i;}});
      }
      await show(index);
    }catch(error){status.textContent='사진 목록을 불러오지 못했습니다.';}
  }
  host.querySelector('[data-action=close]').onclick=close;
  host.querySelector('[data-action=prev]').onclick=()=>show(index-1);
  host.querySelector('[data-action=next]').onclick=()=>show(index+1);
  select.onchange=()=>show(Number(select.value));
  canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus();};
  canvas.onpointermove=e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.y)*.004,-Math.PI/2+.001,Math.PI/2-.001);drag={x:e.clientX,y:e.clientY};};
  canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
  canvas.onwheel=e=>{camera.fov=THREE.MathUtils.clamp(camera.fov+e.deltaY*.025,40,95);camera.updateProjectionMatrix();e.preventDefault();};
  addEventListener('resize',resize);
  addEventListener('keydown',e=>{
    if(!active)return;e.stopImmediatePropagation();
    if(e.code==='Escape'){e.preventDefault();close();return;}
    if(e.target.tagName==='SELECT')return;
    if(['KeyW','ArrowUp','KeyS','ArrowDown','KeyA','KeyD'].includes(e.code))e.preventDefault();
    if(e.code==='KeyA')yaw+=.10;if(e.code==='KeyD')yaw-=.10;
    if(e.repeat)return;
    if(['KeyW','ArrowUp'].includes(e.code))show(index+1);
    if(['KeyS','ArrowDown'].includes(e.code))show(index-1);
  },true);
  return {open,close,isActive:()=>active,getState:()=>({active,index,count:entries.length,name:entries[index]?.name,manifest:loadedFrom,loadedTexture:!!sphere?.visible,yaw,pitch})};
}
