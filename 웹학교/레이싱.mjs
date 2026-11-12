import {PARKED_CARS} from './주차장.mjs';
import {carName,profileFor,stampsFor,canUseCar} from './차량성능.mjs';
import {createRace,TRACK,trackPoint,ROUND_COUNT,roundRules,raceOpponents} from './레이싱물리.mjs';
import {createRaceVisual} from './레이싱표현.mjs';

export function createMiniRacing({scene,camera,progress,onEnter,onExit,onShadow}){
 let visual=null,race=null,active=false,selected=PARKED_CARS[0],round=1,lastResult=false,elapsed=0,hudTime=0,soundOn=false,audio=null,osc=null,gain=null;
 const keys=new Set(),held=new Map();
 const root=document.createElement('section');root.id='레이싱';root.hidden=true;root.setAttribute('aria-label','석암 미니레이싱');
 root.innerHTML=`<div class="레이스상단"><div><small>ROCK ON MOTOR CLUB</small><strong>스쿨 서킷</strong></div><div><button id="레이스소리" aria-pressed="false">소리 꺼짐</button><button id="레이스일시정지">일시정지 <kbd>Esc</kbd></button><button id="레이스종료">학교로</button></div></div>
 <section id="레이스차고" aria-label="차고"><small>나만의 컬렉션</small><h2>오늘은 어떤 차로 달릴까요?</h2><p id="레이스스탬프"></p><div class="차량목록" id="레이스차량목록"></div><h3 id="레이스차량명"></h3><p id="레이스특성"></p><div id="레이스성능"></div><label class="라운드선택">도전 라운드 <select id="레이스라운드"></select></label><button id="레이스출발" class="레이스주버튼">그리드로 출발</button><p class="레이스도움">W / ↑ 가속 · A D / ← → 좌우 · S / ↓ 감속<br>Space 브레이크 · Shift 부스트 · Esc 일시정지<br>자동 코너 보조 · 중앙 진입 불가 · 1위로 다음 라운드<br>책·의자는 내 차가 한 바퀴 돌 때마다 새로 놓여요.</p></section>
 <div id="레이스HUD" hidden><div class="레이스기록"><b id="레이스순위"></b><span id="레이스바퀴"></span><span id="레이스시간"></span></div><div class="레이스중앙" id="레이스카운트" role="status"></div><div id="레이스알림" role="status"></div><canvas id="레이스트랙지도" width="250" height="150" aria-label="트랙과 차량 위치"></canvas><div class="레이스계기"><strong id="레이스속도"></strong><small>KM/H</small><progress id="레이스부스트" max="1" value="1" aria-label="부스트 잔량"></progress><span>BOOST · Shift</span></div><div class="레이스터치"><div><button data-race-hold="left" aria-label="왼쪽 조향">◀</button><button data-race-hold="right" aria-label="오른쪽 조향">▶</button></div><div><button data-race-hold="boost">부스트</button><button data-race-hold="brake">감속</button><button data-race-hold="gas" class="가속페달">가속</button></div></div></div>
 <div id="레이스덮개" hidden><section role="dialog" aria-modal="true" aria-labelledby="레이스결과제목"><small id="레이스결과분류"></small><h2 id="레이스결과제목"></h2><p id="레이스결과설명"></p><ol id="레이스결과순위"></ol><button id="레이스다음" class="레이스주버튼"></button><button id="레이스재도전">다시 달리기</button><button id="레이스차고이동">차고로</button></section></div>`;
 document.body.append(root);const el=id=>root.querySelector('#'+id),list=el('레이스차량목록'),cover=el('레이스덮개');
 const cards=new Map();
 for(const car of [...PARKED_CARS].sort((a,b)=>stampsFor(a)-stampsFor(b))){const button=document.createElement('button');button.type='button';button.dataset.car=car.id;button.innerHTML='<span class="차량색"></span><span></span><small></small>';button.firstChild.style.background=car.color;button.children[1].textContent=carName(car);button.addEventListener('click',()=>{selected=car;showSelection();});list.append(button);cards.set(car.id,button);}
 function resetInput(){keys.clear();held.clear();root.querySelectorAll('[data-race-hold]').forEach(b=>b.classList.remove('눌림'));}
 function input(){const has=name=>[...held.values()].includes(name);return {throttle:keys.has('KeyW')||keys.has('ArrowUp')||has('gas')?1:0,steer:Number(keys.has('KeyD')||keys.has('ArrowRight')||has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||has('left')),brake:keys.has('Space')||keys.has('KeyS')||keys.has('ArrowDown')||has('brake'),boost:keys.has('ShiftLeft')||keys.has('ShiftRight')||has('boost')};}
 function showSelection(){
  const p=profileFor(selected),record=progress.view(),required=stampsFor(selected),unlocked=canUseCar(selected,record.stamps);
  for(const [id,b] of cards){const c=PARKED_CARS.find(c=>c.id===id),open=canUseCar(c,record.stamps);b.setAttribute('aria-pressed',String(id===selected.id));b.classList.toggle('잠금',!open);b.lastChild.textContent=open?'보유 중':'스탬프 '+stampsFor(c)+'개';}
  el('레이스스탬프').textContent=`누적 스탬프 ${record.stamps}개 · ${PARKED_CARS.filter(c=>canUseCar(c,record.stamps)).length}/${PARKED_CARS.length}대 보유`+(record.saved?' · 이 브라우저에 저장됨':' · 저장 불가: 현재 방문에서만 유지');
  el('레이스차량명').textContent=carName(selected);el('레이스특성').textContent=p.specialty;
  const metrics=[['최고 속도',p.speed,33],['가속',p.accel,24],['출발',p.launch,32],['코너링',p.handling,11],['접지력',p.grip,30],['회복력',p.resilience,1]];
  el('레이스성능').replaceChildren(...metrics.map(([name,value,max])=>{const label=document.createElement('label');label.textContent=name;const bar=document.createElement('meter');bar.min=0;bar.max=max;bar.value=value;label.append(bar);return label;}));
  el('레이스출발').disabled=!unlocked;el('레이스출발').textContent=unlocked?'그리드로 출발 →':`스탬프 ${Math.max(0,required-record.stamps)}개 더 모으면 해금`;
  visual.garage(selected);onShadow?.();
 }
 function garage(){race=null;lastResult=false;resetInput();silence();cover.hidden=true;el('레이스차고').hidden=false;el('레이스HUD').hidden=true;el('레이스일시정지').hidden=true;root.dataset.stage='garage';
  const picker=el('레이스라운드');picker.replaceChildren();for(let i=1;i<=Math.min(5,progress.view().bestRound+1);i++){const opt=document.createElement('option');opt.value=i;opt.textContent=`라운드 ${i} · ${roundRules(i).laps}바퀴`;picker.append(opt);}picker.value=String(Math.min(round,picker.options.length));showSelection();
 }
 function start(){if(!canUseCar(selected,progress.view().stamps))return;round=Number(el('레이스라운드').value)||round;resetInput();lastResult=false;cover.hidden=true;el('레이스차고').hidden=true;el('레이스HUD').hidden=false;el('레이스일시정지').hidden=false;root.dataset.stage='race';
  // Preset opponent classes grow with the round, never with the player's car.
  // Unlocking a better car gives a real advantage rather than rubber-banding.
  race=createRace({car:selected,opponents:raceOpponents(round),round});visual.start(race);onShadow?.();root.querySelector('#레이스일시정지').focus({preventScroll:true});
 }
 function silence(){if(gain&&audio)gain.gain.setTargetAtTime(0,audio.currentTime,.04);}
 function sound(){if(!soundOn||!race||race.view().paused||race.view().phase!=='racing'){silence();return;}if(!audio)return;osc.frequency.setTargetAtTime(42+race.player.speed*4,audio.currentTime,.06);gain.gain.setTargetAtTime(.025,audio.currentTime,.05);}
 function result(){lastResult=true;resetInput();silence();const s=race.view();if(s.won)progress.win(round);cover.hidden=false;el('레이스결과분류').textContent=`ROUND ${round} / ${ROUND_COUNT}`;el('레이스결과제목').textContent=s.won?(round===5?'스쿨 서킷 챔피언!':'1위! 다음 라운드로'):'한 번 더 도전해 볼까요?';el('레이스결과설명').textContent=`${s.rank}위 · ${s.laps}바퀴 · ${formatTime(s.time)} · 장애물/접촉 ${s.hits}회`;
  el('레이스결과순위').replaceChildren(...s.standings.map(c=>{const li=document.createElement('li');li.textContent=c.name+' · '+(c.finished?formatTime(c.time):'주행 중');return li;}));el('레이스다음').hidden=!s.won||round===5;el('레이스다음').textContent='다음 라운드 →';el('레이스재도전').hidden=false;el('레이스차고이동').hidden=false;el('레이스재도전').focus({preventScroll:true});
 }
 function pause(value){if(!race||race.view().phase==='finished')return;race.pause(value);resetInput();silence();cover.hidden=!value;if(value){el('레이스결과분류').textContent='PIT STOP';el('레이스결과제목').textContent='잠깐 쉬어가기';el('레이스결과설명').textContent='멈춰 있는 동안 시간과 상대 차량도 함께 멈춰요.';el('레이스결과순위').replaceChildren();el('레이스다음').hidden=false;el('레이스다음').textContent='레이스 계속하기';el('레이스재도전').hidden=false;el('레이스차고이동').hidden=false;el('레이스다음').focus();}}
 function exit(){resetInput();silence();active=false;race=null;root.hidden=true;visual?.hide();onExit();}
 el('레이스출발').onclick=start;el('레이스종료').onclick=exit;el('레이스차고이동').onclick=garage;el('레이스재도전').onclick=start;
 el('레이스다음').onclick=()=>{if(race.view().paused){pause(false);return;}if(race.view().won&&round<5){round++;const opt=document.createElement('option');opt.value=round;opt.textContent='라운드 '+round;el('레이스라운드').append(opt);el('레이스라운드').value=round;start();}};
 el('레이스일시정지').onclick=()=>pause(!race.view().paused);
 el('레이스소리').onclick=()=>{soundOn=!soundOn;if(soundOn){try{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();osc=audio.createOscillator();gain=audio.createGain();gain.gain.value=0;osc.type='triangle';osc.connect(gain);gain.connect(audio.destination);osc.start();}void audio.resume().catch(()=>{});}catch{soundOn=false;}}else silence();el('레이스소리').textContent=soundOn?'소리 켜짐':'소리 꺼짐';el('레이스소리').setAttribute('aria-pressed',String(soundOn));};
 document.addEventListener('keydown',e=>{if(!active)return;if(e.code==='Escape'){e.preventDefault();if(!e.repeat){if(race)pause(!race.view().paused);else exit();}return;}if(race&&!race.view().paused&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
 document.addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{if(active&&race)pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&race)pause(true);});
 root.querySelectorAll('[data-race-hold]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();held.set(e.pointerId,b.dataset.raceHold);b.classList.add('눌림');b.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{held.delete(e.pointerId);b.classList.remove('눌림');});});
 const map=el('레이스트랙지도'),ctx=map.getContext('2d');
 function mapDraw(){ctx.clearRect(0,0,250,150);const sx=x=>x*2.4+20,sz=z=>(z-25)*2.4+12;ctx.lineWidth=22;ctx.strokeStyle='#b7a17c';ctx.beginPath();for(let i=0;i<=150;i++){const p=trackPoint(i/150*TRACK.length);if(i)ctx.lineTo(sx(p.x),sz(p.z));else ctx.moveTo(sx(p.x),sz(p.z));}ctx.stroke();for(const o of race.obstacles){const p=trackPoint(o.s,o.lane);ctx.fillStyle='#f1a38b';ctx.fillRect(sx(p.x)-2,sz(p.z)-2,4,4);}for(const c of [...race.cars].reverse()){const p=trackPoint(c.s,c.lane);ctx.beginPath();ctx.fillStyle=c.id?'#c2d8e3':'#ffe08a';ctx.arc(sx(p.x),sz(p.z),c.id?3:5,0,Math.PI*2);ctx.fill();}}
 return {open(){if(active)return;onEnter();active=true;root.hidden=false;if(!visual)visual=createRaceVisual(scene);garage();},exit,get active(){return active;},getState:()=>race?{...race.view(),carId:selected.id,progress:progress.view()}:{phase:active?'garage':'idle',carId:selected.id,progress:progress.view()},
  update(dt){if(!active)return;elapsed+=dt;if(race){const state=race.update(dt,input());if(state.phase==='finished'&&!lastResult)result();hudTime+=dt;if(hudTime>.08){hudTime=0;el('레이스순위').textContent=`${state.rank} / ${state.total}위`;el('레이스바퀴').textContent=`ROUND ${round} · LAP ${state.lap}/${state.laps}`;el('레이스시간').textContent=formatTime(state.time);el('레이스속도').textContent=String(Math.round(state.speed*3.6)).padStart(2,'0');el('레이스부스트').value=state.boost;el('레이스카운트').textContent=state.phase==='countdown'?Math.ceil(state.countdown):state.time<.8?'GO!':'';el('레이스알림').textContent=race.player.hit>0?'접촉! 속도를 회복하세요':race.player.boosting?'BOOST!':state.lap===state.laps?'FINAL LAP':'';mapDraw();}sound();}visual.update(race,dt,camera,elapsed);},
  debug:()=>race};
}
function formatTime(seconds){return Math.floor(seconds/60)+':'+(seconds%60).toFixed(2).padStart(5,'0');}
