export function drivingControls({onAction,canPlay}){
  const root=document.getElementById('차량조작'),action=document.getElementById('차량탑승'),label=document.getElementById('차량동작'),brake=document.getElementById('차량브레이크'),speed=document.getElementById('차량속도');
  let held=false;
  action.addEventListener('click',()=>{if(canPlay())onAction();});
  brake.addEventListener('pointerdown',e=>{e.preventDefault();if(canPlay()){held=true;brake.setPointerCapture(e.pointerId);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(event,()=>held=false);
  brake.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();held=true;}});
  brake.addEventListener('keyup',()=>held=false);addEventListener('blur',()=>held=false);
  function update(driving,position,playing){
    const state=driving.getState(),nearby=driving.nearby(position),walking=state.phase==='walking',transit=['approaching','entering','exiting'].includes(state.phase);
    root.hidden=!playing||walking&&!nearby;action.disabled=transit;
    label.textContent=walking?'탑승하기':state.phase==='driving'?'내리기':state.phase==='exiting'?'하차 중':'탑승 중';
    brake.hidden=walking||transit;speed.hidden=walking||transit;speed.value=Math.round(Math.abs(state.speed)*3.6)+' km/h';
    document.body.dataset.driving=String(!walking);brake.classList.toggle('누르는중',held);
  }
  return {update,get brake(){return held;},reset(){held=false;}};
}
