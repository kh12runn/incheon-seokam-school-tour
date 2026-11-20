import {carName} from './차량성능.mjs';
export function drivingControls({onAction,canPlay}){
  const root=document.getElementById('차량조작'),action=document.getElementById('차량탑승'),label=document.getElementById('차량동작'),brake=document.getElementById('차량브레이크'),speed=document.getElementById('차량속도');
  let held=false;const verticalPointers=new Map();
  const flight=document.createElement('div');flight.id='드론조작';flight.hidden=true;
  flight.innerHTML='<div><button type="button" data-flight="1">▲ 상승 <kbd>Space</kbd></button><button type="button" data-flight="-1">▼ 하강 <kbd>C</kbd></button><output id="드론고도"></output></div><small>WASD / 조이스틱 이동 · 마우스 / 화면 드래그로 방향 · 손을 떼면 제자리 비행</small>';
  root.append(flight);
  for(const button of flight.querySelectorAll('[data-flight]')){
    button.addEventListener('pointerdown',e=>{e.preventDefault();if(!canPlay())return;verticalPointers.set(e.pointerId,Number(button.dataset.flight));button.setPointerCapture(e.pointerId);button.classList.add('누르는중');});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{verticalPointers.delete(e.pointerId);button.classList.remove('누르는중');});
  }
  const resetFlight=()=>{verticalPointers.clear();flight.querySelectorAll('.누르는중').forEach(b=>b.classList.remove('누르는중'));};addEventListener('blur',resetFlight);
  action.addEventListener('click',()=>{if(canPlay())onAction();});
  brake.addEventListener('pointerdown',e=>{e.preventDefault();if(canPlay()){held=true;brake.setPointerCapture(e.pointerId);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(event,()=>held=false);
  brake.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();held=true;}});
  brake.addEventListener('keyup',()=>held=false);addEventListener('blur',()=>held=false);
  function update(driving,position,playing){
    const state=driving.getState(),nearby=driving.nearby(position),walking=state.phase==='walking',transit=['approaching','entering','exiting'].includes(state.phase);
    root.hidden=!playing||walking&&!nearby;action.disabled=transit;
    const locked=walking&&nearby&&!driving.canEnter(nearby);action.disabled=transit||locked;
    label.textContent=walking&&nearby?(locked?carName(nearby.source)+' · '+driving.lockedMessage(nearby):carName(nearby.source)+' · 탑승하기'):state.phase==='driving'?'내리기':state.phase==='exiting'?'하차 중':'탑승 중';
    brake.hidden=walking||transit;speed.hidden=walking||transit;speed.value=Math.round(Math.abs(state.speed)*3.6)+' km/h';
    const flying=!!state.flight&&state.phase==='driving';flight.hidden=!flying||!playing;root.dataset.flight=String(flying);document.body.dataset.flying=String(flying);
    if(!flying||!playing)resetFlight();
    brake.textContent=flying?'제자리 정지':'브레이크';
    if(flying){label.textContent=state.flight.landing?'자동 착륙 중 · 이동하면 취소':state.flight.landed?'내리기':'착륙 후 내리기';flight.querySelector('output').textContent='지면까지 '+(state.flight.altitude??0).toFixed(1)+' m';}
    document.body.dataset.driving=String(!walking);brake.classList.toggle('누르는중',held);
  }
  return {update,get brake(){return held;},get vertical(){return Math.max(-1,Math.min(1,[...verticalPointers.values()].reduce((a,b)=>a+b,0)));},reset(){held=false;resetFlight();}};
}
