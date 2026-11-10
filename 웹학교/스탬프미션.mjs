import {pickQuestion,shuffled} from './탐험문제.mjs';
import {createMissionDraws} from './미션추첨.mjs';
import {principalCanGreet} from './교장선생님인사.mjs';
export function missionTime({distance,searchDistance,roomCount,speed}){
 if(!Number.isFinite(speed)||speed<=0)throw Error('이동 속도가 필요합니다.');
 // Four times the route + grade-wide search at the SAME speed as the avatar,
 // 15 seconds to inspect each room, and a full minute to read/answer the quiz.
 return Math.ceil(Math.max(240,(distance+searchDistance)/speed*4+roomCount*15+60)/5)*5;
}
export function createStampMission(map,{speed,random=Math.random,history,onHistory}={}){
 let phase='idle',index=0,round=null,remaining=0,elapsed=0,stamps=0,mistakes=0,feedback='',reward=0,nearTeacher=false,waiting=false,latestPosition=map.start;
 let grades=[],categories=[],kinds=[],used=new Set(),usedTeachers=new Set();
 const draws=createMissionDraws({random,history}),gradeOptions=[...map.grades.keys()];
 let previousFirstGrade=history?.version===1&&gradeOptions.includes(history.firstGrade)?history.firstGrade:null;
 const active=()=>['search','teacher','quiz','reward'].includes(phase);
 function beginRound(from){
  const grade=grades[index],group=map.grades.get(grade),place=draws.pick('rooms-'+grade,group,r=>r.room.id),cell=shuffled(place.treasures,random)[0],item={x:cell.x,y:cell.y,z:cell.z};
  const teacher=draws.pick('teachers',map.teachers,t=>t.id,usedTeachers);
  if(!teacher)throw Error('미션 선생님을 찾을 수 없습니다.');usedTeachers.add(teacher.id);
  const approach=map.rooms.get(teacher.roomId).nearest(teacher.position);
  const route1=map.route(from,place.room.id,item),route2=map.route(item,teacher.roomId,{x:approach.x,y:approach.y,z:approach.z}),travel=route1.length+route2.length;
  const limit=missionTime({distance:travel,searchDistance:map.searchDistance(grade),roomCount:group.length,speed});
  const floors=[...new Set(group.map(r=>parseInt(r.room.floor)))].sort(),buildings=[...new Set(group.map(r=>r.room.building==='MAIN'?'본관':'별관'))];
  round={grade,room:place.room,item,teacher,limit,travel,searchDistance:map.searchDistance(grade),roomCount:group.length,
   area:buildings.join('·')+' '+floors.map(f=>f+'층').join('·'),kind:kinds[index],question:pickQuestion(categories[index],used,index,random,draws.pick),wrong:[],routes:[route1.points,route2.points]};
  phase='search';remaining=limit;nearTeacher=false;waiting=false;feedback='';
  onHistory?.({...draws.snapshot(),firstGrade:previousFirstGrade});
 }
 function view(){return {phase,active:active(),round:index+1,total:4,stamps,mistakes,elapsed,remaining,limit:round?.limit??0,nearTeacher,waiting,
  grade:round?.grade,kind:round?.kind,area:round?.area,roomCount:round?.roomCount,teacher:round&&phase!=='search'?{id:round.teacher.id,label:round.teacher.label,roomId:round.teacher.roomId,floor:Math.round(round.teacher.position.z/map.floorHeight)+1}:null,
  prompt:round?.question.prompt,category:round?.question.category,choices:round?.question.choices,wrong:[...(round?.wrong??[])],feedback,
  clue:round?`${round.grade}학년 교실 중 한 곳에서 ${round.kind}${round.kind==='별'?'을':'를'} 찾아보세요!`:'',
  explanation:phase==='reward'||phase==='complete'?round?.question.explanation:null};}
 return {view,active,
  start(){
   index=0;stamps=0;mistakes=0;elapsed=0;used=new Set();usedTeachers=new Set();grades=[];
   const usedGrades=new Set();for(let i=0;i<4;i++){
    const excluded=new Set(usedGrades);if(i===0&&gradeOptions.length>1&&previousFirstGrade!==null)excluded.add(previousFirstGrade);
    const grade=draws.pick('grades',gradeOptions,String,excluded);grades.push(grade);usedGrades.add(grade);
   }
   previousFirstGrade=grades[0];categories=shuffled(['영어','영어','상식','상식'],random);kinds=shuffled(['별','별','선물상자','선물상자'],random);
   latestPosition={...map.start};beginRound(latestPosition);return view();
  },
  stop(){phase='idle';nearTeacher=false;waiting=false;},
  // Never expose the hidden room in the HUD/minimap. This position is for the
  // depth-tested in-world collectible, and local-only route acceptance tests.
  collectible:()=>phase==='search'?{...round.item,roomId:round.room.id,kind:round.kind}:null,
  teacherTarget:()=>round?.teacher,
  debug:()=>round?{roomId:round.room.id,item:{...round.item},routes:round.routes,travel:round.travel,searchDistance:round.searchDistance,limit:round.limit,correct:round.question.correct,questionId:round.question.id}:null,
  tick(dt,{position,npcs=[],active:playing=true,colliders=[]}={}){
   latestPosition=position??latestPosition;
   if(!active()||!playing)return view();
   dt=Number.isFinite(dt)?Math.max(0,dt):0;
   if(phase==='reward'){reward-=dt;if(reward<=0){if(stamps===4)phase='complete';else{index++;beginRound(latestPosition);}}return view();}
   const npc=npcs.find(n=>n.id===round.teacher.id),p=npc?.position??round.teacher.position;
   waiting=phase!=='search'&&Math.abs(latestPosition.z-p.z)<1&&Math.hypot(latestPosition.x-p.x,latestPosition.y-p.y)<12&&npc?.modelStatus!=='ready';
   nearTeacher=!waiting&&npc?.modelStatus==='ready'&&principalCanGreet(latestPosition,p,{colliders});
   if(!waiting){elapsed+=Math.min(dt,remaining);remaining=Math.max(0,remaining-dt);}
   if(remaining<=0){phase='timeout';feedback='모은 스탬프를 확인하고 다시 도전해 보세요!';return view();}
   if(phase==='search'){
    const b=round.room.bounds,inside=latestPosition.x>b[0]&&latestPosition.x<b[1]&&latestPosition.y>b[2]&&latestPosition.y<b[3];
    if(inside&&Math.abs(latestPosition.z-round.item.z)<.4&&Math.hypot(latestPosition.x-round.item.x,latestPosition.y-round.item.y)<.85){phase='teacher';feedback=round.kind+'을 찾았어요! '+round.teacher.label+'에게 가져가세요.';}
   }else if(phase==='teacher'&&nearTeacher){phase='quiz';feedback='행복하세요~ 문제를 풀고 스탬프를 받아요!';}
   else if(phase==='quiz'&&!nearTeacher)phase='teacher';
   return view();
  },
  answer(choice){
   if(phase!=='quiz'||!nearTeacher||remaining<=0||!Number.isInteger(choice)||choice<0||choice>3||round.wrong.includes(choice))return view();
   if(choice===round.question.correct){stamps++;phase='reward';reward=3.5;feedback='참 잘했어요! 스탬프를 받았어요. '+round.question.explanation;}
   else{mistakes++;round.wrong.push(choice);feedback='다시 한번 생각해 보세요!';if(round.wrong.length>=2)feedback+=' 힌트: '+round.question.explanation;}
   return view();
  }
 };
}
