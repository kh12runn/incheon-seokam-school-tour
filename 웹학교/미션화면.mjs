const clock=seconds=>{const s=Math.ceil(Math.max(0,seconds));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
export function createMissionUI({onAnswer,onRetry,onFree,onQuestion,onResult}){
 const hud=document.createElement('aside');hud.id='미션안내';hud.hidden=true;hud.innerHTML='<div class="미션윗줄"><span id="미션단계"></span><strong id="미션시간"></strong></div><progress id="미션시계" max="1" value="1" aria-label="이번 미션의 남은 시간"></progress><h2 id="미션목표"></h2><p id="미션장소"></p><div id="미션도장" aria-label="획득한 스탬프"></div><p id="미션상태" role="status"></p>';
 const bubble=document.createElement('section');bubble.id='탐험퀴즈말풍선';bubble.hidden=true;bubble.setAttribute('aria-labelledby','탐험퀴즈문제');bubble.innerHTML='<small id="탐험퀴즈선생님"></small><h2 id="탐험퀴즈문제"></h2><div id="탐험퀴즈보기" role="group" aria-label="정답 선택지"></div><p id="탐험퀴즈반응" role="status" aria-live="polite"></p><small>숫자 1~4 · 선택지 클릭 또는 터치</small>';
 const result=document.createElement('section');result.id='미션결과';result.hidden=true;result.setAttribute('aria-labelledby','미션결과제목');result.innerHTML='<span class="작은제목">나만의 학교 모험</span><h2 id="미션결과제목"></h2><p id="미션결과내용"></p><p id="미션최고기록"></p><button id="미션다시" class="primary">다시 도전하기</button><button id="미션자유">자유 탐험으로 돌아가기</button>';
 document.body.append(hud,bubble,result);document.getElementById('미션다시').onclick=onRetry;document.getElementById('미션자유').onclick=onFree;
 const $=id=>document.getElementById(id);let questionKey='',lastPhase='',lastSignature='',state=null;
 function answer(i){if(bubble.hidden||!state||state.phase!=='quiz')return;onAnswer(i);}
 function record(s){let best=null;try{best=JSON.parse(localStorage.getItem('석암학교-스탬프최고기록-v1')??'null');if(!best||!Number.isFinite(best.seconds))best=null;if(s.phase==='complete'&&(!best||s.elapsed<best.seconds)){best={seconds:Math.round(s.elapsed),date:new Date().toISOString()};localStorage.setItem('석암학교-스탬프최고기록-v1',JSON.stringify(best));}}catch{}return best;}
 return{answer,isVisible:()=>!bubble.hidden,isResult:()=>!result.hidden,
  hide(){hud.hidden=true;bubble.hidden=true;result.hidden=true;state=null;lastPhase='';lastSignature='';questionKey='';},
  render(s,{playing,anchor}={}){
   state=s;hud.hidden=!s.active;const showing=s.phase==='quiz'&&s.nearTeacher&&playing;
   if(showing&&bubble.hidden)onQuestion();
   bubble.hidden=!showing;
   if(showing){
    const key=s.round+':'+s.prompt;if(key!==questionKey){questionKey=key;$('탐험퀴즈문제').textContent=s.prompt;$('탐험퀴즈선생님').textContent=s.teacher.label+' · '+s.category;
     $('탐험퀴즈보기').replaceChildren(...s.choices.map((word,i)=>{const button=document.createElement('button');button.type='button';button.dataset.choice=i;button.textContent=(i+1)+'. '+word;button.onclick=()=>answer(i);return button;}));}
    for(const b of $('탐험퀴즈보기').children){b.disabled=s.wrong.includes(Number(b.dataset.choice));b.dataset.wrong=String(b.disabled);}
    $('탐험퀴즈반응').textContent=s.feedback;
    const w=bubble.offsetWidth,h=bubble.offsetHeight,low=Math.min(innerHeight-h-12,innerWidth<=600?hud.getBoundingClientRect().bottom+12:190),x=innerHeight<=560&&innerWidth>600?Math.max(280+w/2,anchor?.x??innerWidth/2):anchor?.x??innerWidth/2,y=anchor?.y??innerHeight*.55;
    bubble.style.left=Math.max(12,Math.min(innerWidth-w-12,x-w/2))+'px';bubble.style.top=Math.max(Math.max(12,low),Math.min(innerHeight-h-12,y-h-18))+'px';
   }
   const signature=[s.phase,s.round,s.stamps,Math.ceil(s.remaining),playing,s.waiting,s.feedback].join('|');
   if(signature!==lastSignature){
    $('미션단계').textContent=`퀴즈 미션 ${s.round} / ${s.total}`;$('미션시간').textContent=clock(s.remaining);$('미션시계').value=s.remaining/Math.max(1,s.limit);
    $('미션목표').textContent=s.phase==='search'?s.clue:s.phase==='reward'?'스탬프 획득!':`${s.teacher?.label??''}에게 가서 문제를 풀어보세요!`;
    $('미션장소').textContent=s.phase==='search'?`${s.area} · ${s.roomCount}개 교실 중 한 곳 · 가까이 가면 자동 획득`:s.teacher?`${s.teacher.floor}층 · ${s.teacher.roomId==='2F_PRINCIPAL'?'교장실':s.teacher.roomId==='2F_SCIENCE'?'과학실':s.teacher.label.replace(' 담임선생님',' 교실')}`:'';
    $('미션도장').textContent=Array.from({length:4},(_,i)=>i<s.stamps?'★':'☆').join('  ');$('미션도장').setAttribute('aria-label',`스탬프 ${s.stamps}개 / 4개`);
    $('미션상태').textContent=s.waiting?'선생님을 불러오는 동안 시간은 멈춰요.':!playing?'일시정지 · 남은 시간은 그대로예요.':s.feedback||`이번 미션 ${clock(s.limit)} · 문은 F키 / 버튼으로 열어요.`;lastSignature=signature;
   }
   const finished=['complete','timeout'].includes(s.phase);result.hidden=!finished;
   if(finished&&lastPhase!==s.phase){
    const best=record(s);$('미션결과제목').textContent=s.phase==='complete'?'석암초 탐험 성공!':'오늘도 멋진 탐험이었어요!';$('미션결과내용').textContent=`스탬프 ${s.stamps} / 4개 · 활동 시간 ${clock(s.elapsed)} · 다시 생각한 문제 ${s.mistakes}회`;
    $('미션최고기록').textContent=best?'이 기기의 최고 기록 '+clock(best.seconds):'다시 도전하면 보물 위치와 문제가 달라져요.';onResult();
   }lastPhase=s.phase;
  }
 };
}
