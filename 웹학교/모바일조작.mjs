// Independent pointer ownership: a left thumb never steals the right look gesture.
// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
export const prefersTouch=()=>matchMedia('(pointer: coarse)').matches;
export function joystickVector(dx,dy,radius){
  const length=Math.hypot(dx,dy),distance=Math.min(1,length/Math.max(1,radius));
  if(distance<.14)return {right:0,forward:0,x:dx,y:dy};
  return {right:dx/length,forward:-dy/length,x:dx/length*radius*distance,y:dy/length*radius*distance};
}
export function createTouchControls({canvas,canPlay,getMode,onLook,onOrbit,onZoom,onJump,onGreet,onStop,onModeChange}){
  const root=document.getElementById('터치조작'),stick=document.getElementById('이동패드'),knob=document.getElementById('조이스틱손잡이'),toggle=document.getElementById('터치조작사용');
  let active=prefersTouch(),stickId=null,stickCenter=null,movement={right:0,forward:0};
  const points=new Map();
  const isTouch=e=>e.pointerType==='touch'||e.pointerType==='pen';
  const capture=(element,id)=>{try{element.setPointerCapture(id);}catch{}};
  const release=(element,id)=>{try{if(element.hasPointerCapture(id))element.releasePointerCapture(id);}catch{}};
  function stopStick(){const id=stickId;stickId=null;movement={right:0,forward:0};knob.style.transform='translate(0px,0px)';stick.classList.remove('누르는중');if(id!==null)release(stick,id);onStop?.();}
  function reset(){stopStick();const ids=[...points.keys()];points.clear();for(const id of ids)release(canvas,id);}
  function sync(){root.hidden=!active||!canPlay();}
  function setActive(value){reset();active=value;toggle.checked=value;document.body.dataset.touch=String(value);sync();onModeChange?.(value);}
  function updateStick(e){
    const input=joystickVector(e.clientX-stickCenter.x,e.clientY-stickCenter.y,stickCenter.radius);
    movement={right:input.right,forward:input.forward};knob.style.transform=`translate(${input.x}px,${input.y}px)`;
  }
  stick.addEventListener('pointerdown',e=>{
    if(!active||!canPlay()||stickId!==null)return;
    e.preventDefault();const b=stick.getBoundingClientRect();stickId=e.pointerId;stickCenter={x:b.left+b.width/2,y:b.top+b.height/2,radius:b.width*.32};
    capture(stick,e.pointerId);stick.classList.add('누르는중');updateStick(e);
  });
  stick.addEventListener('pointermove',e=>{if(e.pointerId!==stickId)return;e.preventDefault();updateStick(e);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>{if(e.pointerId===stickId)stopStick();});
  canvas.addEventListener('pointerdown',e=>{
    if(!isTouch(e))return;
    if(!active)setActive(true);
    const mode=getMode();if(mode!=='overview'&&!canPlay())return;
    // In exploration the right half is for looking; the visible left pad moves.
    if(mode==='walk'&&(e.clientX<innerWidth*.43||points.size))return;
    if(mode==='overview'&&document.querySelector('dialog[open]'))return;
    if(points.size>=2)return;e.preventDefault();capture(canvas,e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});
  });
  const separation=()=>{const [a,b]=[...points.values()];return b?Math.hypot(a.x-b.x,a.y-b.y):0;};
  canvas.addEventListener('pointermove',e=>{
    const previous=points.get(e.pointerId);if(!previous)return;e.preventDefault();
    if(getMode()==='walk'&&!canPlay()){reset();return;}
    const before=separation(),dx=e.clientX-previous.x,dy=e.clientY-previous.y;
    points.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(getMode()==='overview'){
      if(points.size===2){const after=separation();if(before>8&&after>8)onZoom(before/after);}
      else onOrbit(dx,dy);
    }else onLook(Math.max(-100,Math.min(100,dx)),Math.max(-100,Math.min(100,dy)));
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(!points.has(e.pointerId))return;points.delete(e.pointerId);release(canvas,e.pointerId);});
  for(const [id,action] of [['터치점프',onJump],['터치인사',onGreet]]){
    const button=document.getElementById(id);
    // Act on pointerdown so a second/third finger works while the stick is held.
    button.addEventListener('pointerdown',e=>{e.preventDefault();if(active&&canPlay())action();});
    // Keyboard/assistive activation has no preceding pointerdown.
    button.addEventListener('click',e=>{e.preventDefault();if(e.detail===0&&active&&canPlay())action();});
  }
  root.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('contextmenu',e=>{if(active)e.preventDefault();});
  toggle.addEventListener('change',()=>setActive(toggle.checked));
  addEventListener('blur',reset);addEventListener('resize',reset);document.addEventListener('visibilitychange',reset);
  setActive(active);
  return {isActive:()=>active,getMovement:()=>({...movement}),reset,sync,getState:()=>({active,visible:!root.hidden,movement:{...movement},stickHeld:stickId!==null,lookPointers:points.size})};
}
