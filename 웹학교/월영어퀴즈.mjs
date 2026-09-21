import {principalCanGreet} from './교장선생님인사.mjs';

export const MONTHS=Object.freeze(['january','february','march','april','may','june','july','august','september','october','november','december']);
export const QUIZ_RELEASE_DISTANCE=4.2;
const shuffle=(values,random)=>{
  const list=[...values];
  for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  return list;
};
export function createMonthQuestion(random=Math.random,previousMonth=0){
  const months=Array.from({length:12},(_,i)=>i+1).filter(n=>n!==previousMonth);
  const month=months[Math.floor(random()*months.length)],answer=MONTHS[month-1];
  const choices=shuffle([answer,...shuffle(MONTHS.filter(word=>word!==answer),random).slice(0,3)],random);
  return {month,prompt:`행복하세요~ ${month}월은 영어로 뭘까요?`,choices};
}
// A visit is latched until the player actually leaves the NPC's area. Closing
// a modal or jittering near the trigger must not immediately start another quiz.
export function createMonthQuiz(random=Math.random){
  const visited=new Set();let question=null,open=false,solved=false,attempts=0,message='',previousMonth=0,visit=0;
  const state=()=>({open,solved,attempts,message,visit,question:question?{...question,choices:[...question.choices]}:null});
  return {
    getState:state,
    update(player,npcs,{active=true,colliders=[]}={}){
      if(!player)return null;
      const nearby=npcs.filter(n=>Math.abs(player.z-n.position.z)<=1.15&&Math.hypot(player.x-n.position.x,player.y-n.position.y)<=QUIZ_RELEASE_DISTANCE);
      for(const id of visited)if(!nearby.some(n=>n.id===id))visited.delete(id);
      if(open||!active)return null;
      const candidates=npcs.filter(n=>n.available!==false&&!visited.has(n.id)&&principalCanGreet(player,n.position,{colliders}));
      candidates.sort((a,b)=>Math.hypot(player.x-a.position.x,player.y-a.position.y)-Math.hypot(player.x-b.position.x,player.y-b.position.y));
      const npc=candidates[0];if(!npc)return null;
      // Latch every nearby greeter for this encounter so movement jitter cannot reopen it.
      for(const n of nearby)visited.add(n.id);
      question={...createMonthQuestion(random,previousMonth),npcId:npc.id,npcName:npc.name};previousMonth=question.month;
      open=true;solved=false;attempts=0;message='보기 4개 중 하나를 골라주세요.';visit++;
      return state();
    },
    answer(index){
      if(!open||solved||!Number.isInteger(index)||index<0||index>3)return state();
      attempts++;solved=question.choices[index]===MONTHS[question.month-1];
      message=solved?'참 잘했어요~':'다시한번 생각해보세요';return state();
    },
    dismiss(){open=false;}
  };
}
