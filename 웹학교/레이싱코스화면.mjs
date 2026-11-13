import {getRaceCourse} from './레이싱코스.mjs';
import {createRecordBoard,raceTime} from './레이싱기록화면.mjs';
export function createCourseHub({host,progress,onSelect,onStart,onGarage,onMission,onOrbit}){
 const root=document.createElement('section');root.id='레이스코스선택';root.hidden=true;
 root.innerHTML=`<div class="코스탭" role="tablist" aria-label="레이싱 라운드 선택"></div><div class="코스구경" aria-label="3D 코스 미리보기: 드래그로 회전, 휠로 확대"><span>잠긴 코스도 마음껏 둘러보세요 · 드래그로 회전</span></div><div class="코스확대"><button aria-label="코스 확대">＋</button><button aria-label="코스 축소">－</button></div><section class="코스카드"><small class="코스번호"></small><h2 class="코스제목"></h2><p class="코스설명"></p><div class="코스수치"></div><p class="코스해금안내" role="status"></p><div class="코스기록목표"></div><button class="코스출발 레이스주버튼"></button><div class="코스보조"><button class="코스차고">← 차량 선택</button><button class="코스기록보기">기록 TOP 10</button><button class="코스미션">★ 스탬프 모으기</button></div><small>미션 완료 → 스탬프 → 새 자동차 · 레이스 3위 이내 → 다음 코스</small></section><div class="코스순위패널" hidden><button class="코스순위닫기" aria-label="기록표 닫기">×</button></div>`;
 host.append(root);const tabs=root.querySelector('.코스탭'),boardHost=root.querySelector('.코스순위패널');
 const board=createRecordBoard({host:boardHost});board.show(false);let round=1,drag=null;
 for(let i=1;i<=5;i++){
  const c=getRaceCourse(i),b=document.createElement('button');b.role='tab';b.dataset.round=i;b.style.setProperty('--코스색',c.color);b.innerHTML=`<small>ROUND ${i}</small><b></b><span></span>`;b.querySelector('b').textContent=c.name;b.onclick=()=>select(i);tabs.append(b);
 }
 function select(value){round=value;const c=getRaceCourse(round),record=progress.view(),unlocked=round<=record.bestRound+1;
  root.style.setProperty('--코스색',c.color);[...tabs.children].forEach((b,i)=>{b.setAttribute('aria-selected',String(i+1===round));b.querySelector('span').textContent=i<record.bestRound?'★ 클리어':i===record.bestRound?'도전 가능':'🔒 미리보기';});
  root.querySelector('.코스번호').textContent=`ROUND ${round} / 5 · ${c.tag}`;root.querySelector('.코스제목').textContent=c.name;root.querySelector('.코스설명').textContent=c.description;
  root.querySelector('.코스수치').textContent=`한 바퀴 ${Math.round(c.length)}m   ·   3바퀴   ·   난이도 ${'★'.repeat(round)}`;
  root.querySelector('.코스구경 span').textContent=c.underground?'청록 점선은 지하 구간 · 드래그로 학교 안팎 둘러보기':'잠긴 코스도 마음껏 둘러보세요 · 드래그로 회전';
  root.querySelector('.코스해금안내').textContent=unlocked?'1~3위로 완주하면 다음 무대가 열려요!':`🔒 이전 라운드를 클리어해주세요. 라운드 ${round-1}에서 1~3위로 완주하면 열려요.`;
  const button=root.querySelector('.코스출발');button.disabled=!unlocked;button.textContent=unlocked?'이 코스에서 기록에 도전 →':'이전 라운드를 클리어해주세요';
  root.querySelector('.코스기록목표').textContent=record.bestTimes?.[round]?`나의 최고 기록 ${raceTime(record.bestTimes[round])} · 이번엔 더 빠르게!`:'이 코스에 나의 첫 기록을 남겨보세요.';
  board.select(round);onSelect(round);root.dataset.round=round;
 }
 root.querySelector('.코스출발').onclick=()=>{if(round<=progress.view().bestRound+1)onStart(round);};root.querySelector('.코스차고').onclick=onGarage;root.querySelector('.코스미션').onclick=onMission;
 root.querySelector('.코스기록보기').onclick=()=>{boardHost.hidden=false;board.show(true);};root.querySelector('.코스순위닫기').onclick=()=>{boardHost.hidden=true;board.show(false);};
 const surface=root.querySelector('.코스구경');surface.onpointerdown=e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};surface.setPointerCapture(e.pointerId);};surface.onpointermove=e=>{if(drag?.id!==e.pointerId)return;onOrbit(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;};for(const event of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(event,()=>drag=null);surface.addEventListener('wheel',e=>{e.preventDefault();onOrbit(0,0,e.deltaY>0?1.08:.92);},{passive:false});root.querySelectorAll('.코스확대 button').forEach((b,i)=>b.onclick=()=>onOrbit(0,0,i?1.15:.85));
 return {root,select,show(value,selected=round){root.hidden=!value;boardHost.hidden=true;board.show(false);if(value)select(selected);}};
}
