const clock=seconds=>{const s=Math.ceil(Math.max(0,seconds));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
export function createMissionUI({onAnswer,onRetry,onFree,onQuestion,onQuestionEnd,onResult,onInteract,getCollectionHint,onGarage}){
 const hud=document.createElement('aside');hud.id='미션안내';hud.hidden=true;hud.innerHTML='<div class="미션윗줄"><span id="미션단계"></span><strong id="미션시간"></strong></div><progress id="미션시계" max="1" value="1" aria-label="이번 미션의 남은 시간"></progress><h2 id="미션목표"></h2><p id="미션장소"></p><div id="미션도장" aria-label="획득한 스탬프"></div><p id="미션상태" role="status"></p>';
 const bubble=document.createElement('section');bubble.id='탐험퀴즈말풍선';bubble.hidden=true;bubble.setAttribute('aria-labelledby','탐험퀴즈문제');bubble.innerHTML='<small id="탐험퀴즈선생님"></small><h2 id="탐험퀴즈문제"></h2><div id="탐험퀴즈보기" role="group" aria-label="정답 선택지"></div><p id="탐험퀴즈반응" role="status" aria-live="polite"></p><small>숫자 1~4 · 선택지 클릭 또는 터치</small>';
 const result=document.createElement('section');result.id='미션결과';result.hidden=true;result.setAttribute('aria-labelledby','미션결과제목');result.innerHTML='<span class="작은제목">나만의 학교 모험</span><h2 id="미션결과제목"></h2><p id="미션결과내용"></p><p id="미션최고기록"></p><button id="미션다시" class="primary">다시 도전하기</button><button id="미션자유">자유 탐험으로 돌아가기</button>';
 const guide=document.createElement('p');guide.id='미션방향';hud.append(guide);
 const collection=document.createElement('p');collection.id='미션차량보상';hud.append(collection);
 if(onGarage){const button=document.createElement('button');button.id='미션보상차고';button.textContent='모은 스탬프로 차고 구경하기 →';button.onclick=onGarage;result.append(button);}
 const action=document.createElement('button');action.id='미션동작';action.type='button';action.hidden=true;action.onclick=onInteract;hud.append(action);
 document.body.append(hud,bubble,result);document.getElementById('미션다시').onclick=onRetry;document.getElementById('미션자유').onclick=onFree;
 const $=id=>document.getElementById(id);let questionKey='',lastPhase='',lastSignature='',state=null;
 const setText=(element,text)=>{if(element.textContent!==text)element.textContent=text;};
 // Layout measurements arrive after layout, rather than forcing one immediately
 // after changing the quiz text on every animation frame.
 let bubbleWidth=360,bubbleHeight=260,hudBottom=190;
 const sizeObserver=new ResizeObserver(entries=>{for(const entry of entries){if(entry.target===bubble){if(entry.contentRect.width){bubbleWidth=bubble.offsetWidth;bubbleHeight=bubble.offsetHeight;}}else hudBottom=hud.getBoundingClientRect().bottom;}});
 sizeObserver.observe(bubble);sizeObserver.observe(hud);
 function closeQuestion(resume=true){if(bubble.hidden)return;bubble.hidden=true;if(resume)onQuestionEnd?.();}
 function answer(i){
  if(bubble.hidden||!state||state.phase!=='quiz')return;
  const next=onAnswer(i);
  // Restore look within the answer click/key gesture, before the next frame.
  if(next&&next.phase!=='quiz')closeQuestion();
 }
 function record(s){let best=null;try{best=JSON.parse(localStorage.getItem('석암학교-스탬프최고기록-12단계-v2')??'null');if(!best||!Number.isFinite(best.seconds))best=null;if(s.phase==='complete'&&(!best||s.elapsed<best.seconds)){best={seconds:Math.round(s.elapsed),date:new Date().toISOString()};localStorage.setItem('석암학교-스탬프최고기록-12단계-v2',JSON.stringify(best));}}catch{}return best;}
 return{answer,isVisible:()=>!bubble.hidden,isResult:()=>!result.hidden,
  hide(){hud.hidden=true;bubble.hidden=true;result.hidden=true;state=null;lastPhase='';lastSignature='';questionKey='';},
  render(s,{playing,anchor,yaw=0,position}={}){
   state=s;hud.hidden=!s.active;const showing=s.phase==='quiz'&&s.nearTeacher&&playing;
   if(showing&&bubble.hidden){bubble.hidden=false;onQuestion();}
   if(!showing)closeQuestion(playing&&!['complete','timeout'].includes(s.phase));
   if(showing){
    const key=s.round+':'+s.prompt;if(key!==questionKey){questionKey=key;$('탐험퀴즈문제').textContent=s.prompt;$('탐험퀴즈선생님').textContent=s.teacher.label+' · '+s.category;
     $('탐험퀴즈보기').replaceChildren(...s.choices.map((word,i)=>{const button=document.createElement('button');button.type='button';button.dataset.choice=i;button.textContent=(i+1)+'. '+word;button.onclick=()=>answer(i);return button;}));}
    for(const b of $('탐험퀴즈보기').children){const wrong=s.wrong.includes(Number(b.dataset.choice));if(b.disabled!==wrong)b.disabled=wrong;if(b.dataset.wrong!==String(wrong))b.dataset.wrong=String(wrong);}
    setText($('탐험퀴즈반응'),s.feedback);
    const w=bubbleWidth,h=bubbleHeight,low=Math.min(innerHeight-h-12,innerWidth<=600?hudBottom+12:190),x=innerHeight<=560&&innerWidth>600?Math.max(280+w/2,anchor?.x??innerWidth/2):anchor?.x??innerWidth/2,y=anchor?.y??innerHeight*.55;
    bubble.style.left=Math.max(12,Math.min(innerWidth-w-12,x-w/2))+'px';bubble.style.top=Math.max(Math.max(12,low),Math.min(innerHeight-h-12,y-h-18))+'px';
   }
   guide.hidden=!s.target;action.hidden=!s.action||!playing;
   if(s.target&&position){const angle=Math.atan2(-(s.target.x-position.x),s.target.y-position.y)-yaw,relative=Math.atan2(Math.sin(angle),Math.cos(angle));setText(guide,(Math.abs(relative)<.4?'↑ 앞쪽':Math.abs(relative)>2.7?'↓ 뒤쪽':relative<0?'→ 오른쪽':'← 왼쪽')+` · ${s.target.label} ${s.target.distance}m`);}
   setText(action,'R · '+s.action);
   const signature=[s.phase,s.round,s.stamps,Math.ceil(s.remaining),playing,s.waiting,s.feedback,s.checkpoint,s.cargo].join('|');
   if(signature!==lastSignature){
    setText(collection,getCollectionHint?.()??'미션 하나 완료 → 스탬프 1개 → 새 자동차 해금!');
    $('미션단계').textContent=`${s.round} / ${s.total} · ${s.title} · ${s.chapter}/3장`;$('미션시간').textContent=clock(s.remaining);$('미션시계').value=s.remaining/Math.max(1,s.limit);
    $('미션목표').textContent=s.clue;$('미션장소').textContent=s.place;
    $('미션도장').textContent=Array.from({length:s.total},(_,i)=>i<s.stamps?'★':'☆').join('');$('미션도장').setAttribute('aria-label',`스탬프 ${s.stamps}개 / ${s.total}개`);
    $('미션상태').textContent=s.waiting?'선생님을 불러오는 동안 시간은 멈춰요.':!playing?'일시정지 · 남은 시간은 그대로예요.':s.feedback||`이번 미션 ${clock(s.limit)} · 문/차량 F · 물건/대화 R 또는 버튼`;lastSignature=signature;
   }
   const finished=['complete','timeout'].includes(s.phase);result.hidden=!finished;
   if(finished&&lastPhase!==s.phase){
    const best=record(s);$('미션결과제목').textContent=s.phase==='complete'?'12단계 스쿨런 성공!':'오늘도 멋진 탐험이었어요!';$('미션결과내용').textContent=`스탬프 ${s.stamps} / ${s.total}개 · 활동 시간 ${clock(s.elapsed)} · 다시 생각한 문제 ${s.mistakes}회`;
    $('미션최고기록').textContent=(best?'이 기기의 최고 기록 '+clock(best.seconds)+' · ':'')+'다시 도전하면 미션 순서·학년·선생님·물건·문제가 바뀌어요.';onResult();
   }lastPhase=s.phase;
  }
 };
}
