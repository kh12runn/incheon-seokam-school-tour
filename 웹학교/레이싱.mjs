import {PARKED_CARS} from './주차장.mjs';
import {carName,profileFor,stampsFor,canUseCar} from './차량성능.mjs';
import {createRace,ROUND_COUNT,roundRules,raceOpponents} from './레이싱물리.mjs';
import {getRaceCourse} from './레이싱코스.mjs';
import {createRaceVisual} from './레이싱표현.mjs';
import {resultDriverBadge} from './레이싱선수.mjs';
import {createRaceAudio} from './레이싱오디오.mjs';

export function createMiniRacing({scene,camera,progress,onEnter,onExit,onShadow,getDriver}){
 let visual=null,race=null,active=false,selected=PARKED_CARS[0],round=1,lastResult=false,elapsed=0,hudTime=0,resetNotice=0,resetNoticeText='';
 const audio=createRaceAudio();
 const keys=new Set(),held=new Map();
 const root=document.createElement('section');root.id='레이싱';root.hidden=true;root.setAttribute('aria-label','석암 미니레이싱');
 root.innerHTML=`<div class="레이스상단"><div><small>ROCK ON MOTOR CLUB</small><strong>스쿨 서킷</strong></div><div><button id="레이스소리" aria-pressed="false">소리 꺼짐</button><button id="레이스일시정지">일시정지 <kbd>Esc</kbd></button><button id="레이스종료">학교로</button></div></div>
 <section id="레이스차고" aria-label="차고"><small>나만의 컬렉션</small><h2>오늘은 어떤 차로 달릴까요?</h2><p id="레이스스탬프"></p><div class="차량목록" id="레이스차량목록"></div><h3 id="레이스차량명"></h3><p id="레이스특성"></p><div id="레이스성능"></div><label class="라운드선택">도전 라운드 <select id="레이스라운드"></select></label><div id="레이스코스안내" aria-live="polite"><strong id="레이스코스이름"></strong><span id="레이스코스설명"></span><small id="레이스코스정보"></small></div><button id="레이스출발" class="레이스주버튼">그리드로 출발</button><p class="레이스도움">W / ↑ 전진 · S / ↓ 후진 · A D / ← → 핸들<br>Space 브레이크 · Shift 부스트 · R 코스로 복귀<br>3바퀴 · 1위로 다음 라운드<br>라운드마다 새로운 코스와 더 강한 상대가 기다려요.<br>책·의자는 내 차가 한 바퀴 돌 때마다 새로 놓여요.</p></section>
 <div id="레이스HUD" hidden><div class="레이스기록"><b id="레이스순위"></b><span id="레이스바퀴"></span><span id="레이스시간"></span><span id="레이스코스길이"></span></div><button id="레이스복귀" title="마지막 통과 위치로 복귀">코스로 복귀 <kbd>R</kbd></button><div class="레이스중앙" id="레이스카운트" role="status"></div><div id="레이스알림" role="status"></div><canvas id="레이스트랙지도" width="250" height="150" aria-label="트랙과 차량 위치"></canvas><div class="레이스계기"><strong id="레이스속도"></strong><small>KM/H</small><progress id="레이스부스트" max="1" value="1" aria-label="부스트 잔량"></progress><span>BOOST · Shift</span></div><div class="레이스터치"><div><button data-race-hold="left" aria-label="왼쪽 조향">◀</button><button data-race-hold="right" aria-label="오른쪽 조향">▶</button></div><div class="레이스페달"><button data-race-hold="boost">부스트</button><button data-race-hold="reverse">후진</button><button data-race-hold="brake">브레이크</button><button data-race-hold="gas" class="가속페달">가속</button></div></div></div>
 <div id="레이스덮개" hidden><section role="dialog" aria-modal="true" aria-labelledby="레이스결과제목"><small id="레이스결과분류"></small><h2 id="레이스결과제목"></h2><p id="레이스결과설명"></p><div id="레이스결과표" hidden><table><caption id="레이스결과표제목">라운드 순위</caption><thead><tr><th scope="col">순위</th><th scope="col">선수</th><th scope="col">차량</th><th scope="col">기록</th></tr></thead><tbody id="레이스결과순위"></tbody></table><p class="레이스결과기준">내가 결승선을 통과한 시점의 순위예요. 아직 달리는 차량은 통과한 구간과 진행 거리로 순위를 정해요.</p></div><p id="레이스다음코스" hidden></p><button id="레이스다음" class="레이스주버튼"></button><button id="레이스재도전">다시 달리기</button><button id="레이스차고이동">차고로</button></section></div>`;
 document.body.append(root);const elements=new Map([...root.querySelectorAll('[id]')].map(element=>[element.id,element])),el=id=>elements.get(id),list=el('레이스차량목록'),cover=el('레이스덮개');
 const cards=new Map();
 for(const car of [...PARKED_CARS].sort((a,b)=>stampsFor(a)-stampsFor(b))){const button=document.createElement('button');button.type='button';button.dataset.car=car.id;button.innerHTML='<span class="차량색"></span><span></span><small></small>';button.firstChild.style.background=car.color;button.children[1].textContent=carName(car);button.addEventListener('click',()=>{selected=car;showSelection();});list.append(button);cards.set(car.id,button);}
 function resetInput(){keys.clear();held.clear();root.querySelectorAll('[data-race-hold]').forEach(b=>b.classList.remove('눌림'));}
 function input(){const has=name=>[...held.values()].includes(name);return {throttle:Number(keys.has('KeyW')||keys.has('ArrowUp')||has('gas'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||has('reverse')),steer:Number(keys.has('KeyD')||keys.has('ArrowRight')||has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||has('left')),brake:keys.has('Space')||has('brake'),boost:keys.has('ShiftLeft')||keys.has('ShiftRight')||has('boost')};}
 function returnToCourse(){if(!race||race.view().paused||race.view().phase!=='racing')return;resetInput();resetNoticeText=race.resetCar()?'마지막 통과 지점으로 복귀했어요':'주변 차량이 지나간 뒤 다시 시도하세요';resetNotice=2.5;}
 function showSelection(){
  const p=profileFor(selected),record=progress.view(),required=stampsFor(selected),unlocked=canUseCar(selected,record.stamps);
  for(const [id,b] of cards){const c=PARKED_CARS.find(c=>c.id===id),open=canUseCar(c,record.stamps);b.setAttribute('aria-pressed',String(id===selected.id));b.classList.toggle('잠금',!open);b.lastChild.textContent=open?'보유 중':'스탬프 '+stampsFor(c)+'개';}
  el('레이스스탬프').textContent=`누적 스탬프 ${record.stamps}개 · ${PARKED_CARS.filter(c=>canUseCar(c,record.stamps)).length}/${PARKED_CARS.length}대 보유`+(record.saved?' · 이 브라우저에 저장됨':' · 저장 불가: 현재 방문에서만 유지');
  el('레이스차량명').textContent=carName(selected);el('레이스특성').textContent=p.specialty;
  const metrics=[['최고 속도',p.speed,33],['가속',p.accel,24],['출발',p.launch,32],['코너링',p.handling,11],['접지력',p.grip,30],['회복력',p.resilience,1]];
  el('레이스성능').replaceChildren(...metrics.map(([name,value,max])=>{const label=document.createElement('label');label.textContent=name;const bar=document.createElement('meter');bar.min=0;bar.max=max;bar.value=value;label.append(bar);return label;}));
  el('레이스출발').disabled=!unlocked;el('레이스출발').textContent=unlocked?'그리드로 출발 →':`스탬프 ${Math.max(0,required-record.stamps)}개 더 모으면 해금`;
  showCourse();
 }
 function selectedCourse(){return getRaceCourse(Number(el('레이스라운드').value)||round);}
 function roundLabel(n){return `라운드 ${n} · ${getRaceCourse(n).name}`;}
 function showCourse(){const course=selectedCourse();el('레이스코스이름').textContent=course.name;el('레이스코스설명').textContent=course.description;el('레이스코스정보').textContent=`한 바퀴 ${Math.round(course.length)}m · ${roundRules(Number(el('레이스라운드').value)||round).laps}바퀴`;visual.garage(selected,course);prepareMap(course);onShadow?.();}
 function garage(){race=null;lastResult=false;resetInput();silence();cover.hidden=true;el('레이스차고').hidden=false;el('레이스HUD').hidden=true;el('레이스일시정지').hidden=true;root.dataset.stage='garage';
  const picker=el('레이스라운드');picker.replaceChildren();for(let i=1;i<=Math.min(ROUND_COUNT,progress.view().bestRound+1);i++){const opt=document.createElement('option');opt.value=i;opt.textContent=roundLabel(i);picker.append(opt);}picker.value=String(Math.min(round,picker.options.length));showSelection();
 }
 function start(){if(!canUseCar(selected,progress.view().stamps))return;audio.start();round=Number(el('레이스라운드').value)||round;resetInput();lastResult=false;cover.hidden=true;el('레이스차고').hidden=true;el('레이스HUD').hidden=false;el('레이스일시정지').hidden=false;root.dataset.stage='race';
  // Preset opponent classes grow with the round, never with the player's car.
  // Unlocking a better car gives a real advantage rather than rubber-banding.
  race=createRace({car:selected,opponents:raceOpponents(round),round});resetNotice=0;el('레이스코스길이').textContent=`${race.course.name} · 한 바퀴 ${Math.round(race.course.length)}m`;prepareMap(race.course);visual.start(race);onShadow?.();root.querySelector('#레이스일시정지').focus({preventScroll:true});
 }
 function silence(){audio.stop();}
 function result(){lastResult=true;resetInput();const s=race.view(),finalRound=round===ROUND_COUNT;if(s.won)progress.win(round);cover.hidden=false;el('레이스결과분류').textContent=finalRound?'FINAL ROUND · 최종 라운드 결과':`ROUND ${round} / ${ROUND_COUNT}`;el('레이스결과제목').textContent=s.won?(finalRound?'스쿨 서킷 챔피언!':'1위! 다음 라운드로'):'한 번 더 도전해 볼까요?';el('레이스결과설명').textContent=`${s.rank}위 · ${s.laps}바퀴 · ${formatTime(s.time)} · 장애물/접촉 ${s.hits}회`;
  el('레이스결과표').hidden=false;el('레이스결과표제목').textContent=finalRound?'최종 라운드 선수 순위':`라운드 ${round} 선수 순위`;
  el('레이스결과순위').replaceChildren(...s.standings.map((c,index)=>{
   const row=document.createElement('tr');row.dataset.player=String(c.id===0);
   const rankCell=document.createElement('td');rankCell.className='레이스등수';rankCell.textContent=`${index+1}위`;
   const driverCell=document.createElement('td'),badge=document.createElement('span'),name=document.createElement('span');driverCell.className='레이스선수';badge.className='레이스선수표식';badge.textContent=resultDriverBadge(c.driverId??(c.id===0?'player':''));badge.setAttribute('aria-hidden','true');name.textContent=c.driverName??c.name;driverCell.append(badge,name);
   const vehicleCell=document.createElement('td');vehicleCell.textContent=c.carName??carName(race.cars.find(car=>car.id===c.id)?.source??selected);
   const timeCell=document.createElement('td');timeCell.className='레이스기록셀';timeCell.textContent=c.finished?formatTime(c.time):'주행 중';
   row.append(rankCell,driverCell,vehicleCell,timeCell);return row;
  }));el('레이스다음').hidden=!s.won||finalRound;el('레이스다음').textContent='다음 라운드 →';el('레이스다음코스').hidden=!s.won||finalRound;if(s.won&&!finalRound){const next=getRaceCourse(round+1);el('레이스다음코스').textContent=`다음 코스: ${next.name} · ${Math.round(next.length)}m\n${next.description}`;}el('레이스재도전').hidden=false;el('레이스차고이동').hidden=false;el('레이스재도전').focus({preventScroll:true});
 }
 function pause(value){if(!race||race.view().phase==='finished')return;race.pause(value);resetInput();if(value)silence();else audio.unlock();cover.hidden=!value;if(value){el('레이스결과분류').textContent='PIT STOP';el('레이스결과제목').textContent='잠깐 쉬어가기';el('레이스결과설명').textContent='멈춰 있는 동안 시간과 상대 차량도 함께 멈춰요.';el('레이스결과표').hidden=true;el('레이스결과순위').replaceChildren();el('레이스다음코스').hidden=true;el('레이스다음').hidden=false;el('레이스다음').textContent='레이스 계속하기';el('레이스재도전').hidden=false;el('레이스차고이동').hidden=false;el('레이스다음').focus();}}
 function exit(){resetInput();silence();active=false;race=null;root.hidden=true;visual?.hide();onExit();}
 el('레이스출발').onclick=start;el('레이스종료').onclick=exit;el('레이스차고이동').onclick=garage;el('레이스재도전').onclick=start;
 el('레이스복귀').onclick=returnToCourse;
 el('레이스라운드').onchange=showCourse;
 el('레이스다음').onclick=()=>{if(race.view().paused){pause(false);return;}if(race.view().won&&round<ROUND_COUNT){round++;if(![...el('레이스라운드').options].some(o=>Number(o.value)===round)){const opt=document.createElement('option');opt.value=round;opt.textContent=roundLabel(round);el('레이스라운드').append(opt);}el('레이스라운드').value=round;start();}};
 el('레이스일시정지').onclick=()=>pause(!race.view().paused);
 el('레이스소리').textContent='소리 켜짐';el('레이스소리').setAttribute('aria-pressed','true');
 el('레이스소리').onclick=()=>{const enabled=audio.setEnabled(!audio.getState().enabled);el('레이스소리').textContent=enabled?'소리 켜짐':'소리 꺼짐';el('레이스소리').setAttribute('aria-pressed',String(enabled));};
 document.addEventListener('keydown',e=>{if(!active)return;if(e.code==='Escape'){e.preventDefault();if(!e.repeat){if(race)pause(!race.view().paused);else exit();}return;}if(e.code==='KeyR'){e.preventDefault();if(!e.repeat)returnToCourse();return;}if(race&&!race.view().paused&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
 document.addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{if(active&&race)pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&race)pause(true);});
 root.querySelectorAll('[data-race-hold]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();held.set(e.pointerId,b.dataset.raceHold);b.classList.add('눌림');b.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{held.delete(e.pointerId);b.classList.remove('눌림');});});
 const map=el('레이스트랙지도'),ctx=map.getContext('2d');
 let mapCourse=null,mapBounds=null,mapScale=1;
 const mapX=x=>125+(x-(mapBounds.minX+mapBounds.maxX)/2)*mapScale,mapZ=z=>75+(z-(mapBounds.minZ+mapBounds.maxZ)/2)*mapScale;
 const mapBase=document.createElement('canvas');mapBase.width=250;mapBase.height=150;const mapCtx=mapBase.getContext('2d');mapCtx.strokeStyle='#b7a17c';mapCtx.lineCap='round';
 function prepareMap(course){if(mapCourse===course)return;mapCourse=course;mapBounds=course.bounds;mapScale=Math.min(222/(mapBounds.maxX-mapBounds.minX),122/(mapBounds.maxZ-mapBounds.minZ));map.dataset.course=course.id;map.setAttribute('aria-label',course.name+' 트랙과 차량 위치');mapCtx.clearRect(0,0,250,150);mapCtx.strokeStyle='#b7a17c';for(let i=0;i<260;i++){const a=course.trackPoint(i/260*course.length),b=course.trackPoint((i+1)/260*course.length);mapCtx.lineWidth=((a.width??course.width)+(b.width??course.width))*.5*mapScale;mapCtx.beginPath();mapCtx.moveTo(mapX(a.x),mapZ(a.z));mapCtx.lineTo(mapX(b.x),mapZ(b.z));mapCtx.stroke();}
  // Direction marks keep reversed rounds visibly distinct on the minimap too.
  for(let i=0;i<8;i++){const p=course.trackPoint((i+.35)/8*course.length);mapCtx.save();mapCtx.translate(mapX(p.x),mapZ(p.z));mapCtx.rotate(-p.yaw);mapCtx.lineWidth=1;mapCtx.strokeStyle='#fff1ca';mapCtx.beginPath();mapCtx.moveTo(-2.5,2);mapCtx.lineTo(0,-3);mapCtx.lineTo(2.5,2);mapCtx.stroke();mapCtx.restore();}
 }
 function mapDraw(){ctx.clearRect(0,0,250,150);ctx.drawImage(mapBase,0,0);for(const o of race.obstacles){const p=race.course.trackPoint(o.s,o.lane);ctx.fillStyle='#f1a38b';ctx.fillRect(mapX(p.x)-2,mapZ(p.z)-2,4,4);}for(const c of [...race.cars].reverse()){ctx.save();ctx.translate(mapX(c.x),mapZ(c.z));ctx.rotate(-c.yaw);ctx.beginPath();ctx.fillStyle=c.id?'#c2d8e3':'#ffe08a';ctx.moveTo(0,c.id?-4:-6);ctx.lineTo(c.id?3:4,4);ctx.lineTo(c.id?-3:-4,4);ctx.closePath();ctx.fill();ctx.restore();}}
 return {open(){if(active)return;audio.unlock();onEnter();active=true;root.hidden=false;if(!visual)visual=createRaceVisual(scene,{getDriver});garage();},exit,get active(){return active;},getState:()=>race?{...race.view(),audio:audio.getState(),carId:selected.id,progress:progress.view(),drivers:visual?.teacherState?.()??[]}:{phase:active?'garage':'idle',audio:audio.getState(),carId:selected.id,progress:progress.view(),drivers:visual?.teacherState?.()??[]},
  update(dt){if(!active)return;elapsed+=dt;let state=null;if(race){const controls=input();state=race.update(dt,controls);audio.update(state,race.player,controls);if(!state.paused)resetNotice=Math.max(0,resetNotice-dt);if(state.phase==='finished'&&!lastResult)result();hudTime+=dt;if(hudTime>.08){hudTime=0;el('레이스순위').textContent=`${state.rank} / ${state.total}위`;el('레이스바퀴').textContent=`ROUND ${round} · LAP ${state.lap}/${state.laps}`;el('레이스시간').textContent=formatTime(state.time);el('레이스속도').textContent=(state.speed<-.15?'R ':'')+String(Math.round(Math.abs(state.speed)*3.6)).padStart(2,'0');el('레이스부스트').value=state.boost;el('레이스카운트').textContent=state.phase==='countdown'?Math.ceil(state.countdown):state.time<.8?'GO!':'';el('레이스알림').textContent=resetNotice>0?resetNoticeText:state.wrongWay?'반대 방향이에요! 핸들을 돌려주세요':state.offTrack?'코스로 돌아오세요 · 필요하면 복귀 버튼':race.player.boosting?'BOOST!':state.lap===state.laps?'FINAL LAP':'';mapDraw();}}visual.update(race,dt,camera,elapsed,state);},
  getAudioState:audio.getState,debug:()=>race};
}
function formatTime(seconds){return Math.floor(seconds/60)+':'+(seconds%60).toFixed(2).padStart(5,'0');}
