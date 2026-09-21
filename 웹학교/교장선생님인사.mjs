// World coordinates: x/y ground plane, z height. Shared with regression tests.
export const ENGLISH_MONTHS=Object.freeze(['January','February','March','April','May','June','July','August','September','October','November','December']);
export const ENGLISH_WEEKDAYS=Object.freeze(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
const KOREAN_WEEKDAYS=Object.freeze(['일','월','화','수','목','금','토']);
export function principalGreetingLines(date=new Date()){
  const month=date.getMonth(),day=date.getDay(),monthName=ENGLISH_MONTHS[month],dayName=ENGLISH_WEEKDAYS[day],dayKo=KOREAN_WEEKDAYS[day];
  return [
    '행복하세요! 오늘도 힘차게!',
    `이번 달은 ${month+1}월, 영어로 ${monthName}!`,
    `영어 퀴즈! ${month+1}월은 영어로 무엇일까요?`,
    `월 퀴즈 정답은 ${monthName}!`,
    `오늘은 ${dayKo}요일, 영어로 ${dayName}!`,
    `요일 퀴즈! ${dayKo}요일은 영어로 무엇일까요?`,
    `요일 퀴즈 정답은 ${dayName}!`,
    '건강한 몸에 건강한 마음! 함께 걸어 볼까요?'
  ];
}
export function principalGreetingAt(date=new Date(),cycle=0,offset=0){
  const lines=principalGreetingLines(date),index=((Math.trunc(cycle)+offset)%lines.length+lines.length)%lines.length;
  return lines[index];
}
export const PRINCIPAL_GREETING=principalGreetingAt();
export const LOBBY_PRINCIPAL_POSITION=Object.freeze({x:47,y:-2.8,z:0});
export const GREETING_DISTANCE=2.8;

function crossesBox(a,b,bounds){
  let near=0,far=1;
  for(let i=0;i<3;i++){
    const delta=b[i]-a[i];
    if(Math.abs(delta)<1e-8){if(a[i]<bounds[i]||a[i]>bounds[i+3])return false;continue;}
    let lo=(bounds[i]-a[i])/delta,hi=(bounds[i+3]-a[i])/delta;
    if(lo>hi)[lo,hi]=[hi,lo];near=Math.max(near,lo);far=Math.min(far,hi);
    if(near>far)return false;
  }
  return far>.02&&near<.98;
}
export function principalCanGreet(player,npc,{active=true,colliders=[]}={}){
  if(!active||!player||!npc||Math.abs(player.z-npc.z)>1.15)return false;
  if(Math.hypot(player.x-npc.x,player.y-npc.y)>GREETING_DISTANCE)return false;
  const a=[player.x,player.y,player.z+1.45],b=[npc.x,npc.y,npc.z+1.65];
  return !colliders.some(c=>crossesBox(a,b,c.bounds));
}
export function blocksPrincipal(previous,next,npc){
  const distance=p=>Math.hypot(p.x-npc.x,p.y-npc.y);
  return Math.abs(next.z-npc.z)<1.85&&distance(next)<.56&&distance(next)<distance(previous);
}
export function createLobbyPrincipalState(){
  let heading=Math.PI,phase=0;
  const state=()=>({position:{...LOBBY_PRINCIPAL_POSITION},heading,phase,moving:false,yielding:false});
  return {getState:state,update(dt,player,paused=false){
    if(paused||!Number.isFinite(dt)||dt<=0)return state();
    dt=Math.min(dt,.05);phase+=dt;
    if(player&&Math.abs(player.z)<1.2&&Math.hypot(player.x-47,player.y+2.8)<4.5){
      const target=Math.atan2(player.x-47,-(player.y+2.8));
      heading+=Math.atan2(Math.sin(target-heading),Math.cos(target-heading))*(1-Math.exp(-dt*3));
    }
    return state();
  }};
}
