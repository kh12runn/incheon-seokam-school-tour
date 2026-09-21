// Non-modal NPC bubble; no focus capture or pointer-lock changes.
export function createMonthQuizBubble({onAnswer,onAnswered}){
  const bubble=document.createElement('section');bubble.id='월퀴즈말풍선';bubble.hidden=true;
  bubble.setAttribute('aria-labelledby','월퀴즈문제');
  bubble.innerHTML=`<p id="월퀴즈문제"></p><div id="월퀴즈보기" role="group" aria-label="영어 월 이름 보기"></div><p id="월퀴즈결과" role="status" aria-live="polite"></p><small>숫자 1~4 또는 보기 터치 · 멀어지면 닫혀요</small>`;
  document.body.append(bubble);
  const get=id=>bubble.querySelector('#'+id);let buttons=[];
  function answer(index){
    if(bubble.hidden||!buttons[index]||buttons[index].disabled)return;
    const state=onAnswer(index);get('월퀴즈결과').textContent=state.message;
    get('월퀴즈결과').dataset.result=state.solved?'correct':'retry';
    buttons[index].dataset.result=state.solved?'correct':'wrong';buttons[index].disabled=true;
    if(state.solved)for(const button of buttons)button.disabled=true;
    onAnswered?.();
  }
  return {
    answer,isVisible:()=>!bubble.hidden,
    hide(){bubble.hidden=true;},
    show(state){
      get('월퀴즈문제').textContent=state.question.prompt;
      get('월퀴즈결과').textContent='';delete get('월퀴즈결과').dataset.result;
      buttons=state.question.choices.map((word,index)=>{
        const button=document.createElement('button');button.type='button';button.dataset.index=String(index);
        const number=document.createElement('span');number.textContent=String(index+1);
        const label=document.createElement('span');label.textContent=word;label.lang='en';button.append(number,label);
        button.onclick=()=>answer(index);return button;
      });
      get('월퀴즈보기').replaceChildren(...buttons);
    },
    anchor(x,y,visible){
      bubble.hidden=!visible;if(!visible)return;
      const width=bubble.offsetWidth,height=bubble.offsetHeight;
      const left=Math.max(12,Math.min(innerWidth-width-12,x-width/2));
      const top=Math.max(12,Math.min(innerHeight-height-12,y-height-12));
      bubble.style.left=left+'px';bubble.style.top=top+'px';
      bubble.style.setProperty('--tail-x',Math.max(20,Math.min(width-20,x-left))+'px');
    }
  };
}
