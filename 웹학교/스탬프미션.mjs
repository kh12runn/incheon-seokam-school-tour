import {pickQuestion,shuffled} from './탐험문제.mjs';
import {createMissionDraws} from './미션추첨.mjs';
import {principalCanGreet} from './교장선생님인사.mjs';
import {DELIVERY_COURSES,DELIVERY_ITEMS} from './미션배송.mjs';
export const MISSION_TOTAL=12;
const TYPES=['search','delivery','relay','drive'];
const TITLES={search:'숨은 보물',delivery:'교실 배달부',relay:'선생님 연결 미션',drive:'학교 배송 드라이버'};
const close=(a,b,r=1.35)=>!!a&&!!b&&Math.abs(a.z-b.z)<.7&&Math.hypot(a.x-b.x,a.y-b.y)<r;
const point=p=>({x:p.x,y:p.y,z:p.z});
export function missionTime({distance,searchDistance=0,roomCount=0,speed}){
 if(!Number.isFinite(speed)||speed<=0)throw Error('이동 속도가 필요합니다.');
 return Math.ceil(Math.max(240,(distance+searchDistance)/speed*4+roomCount*15+60)/5)*5;
}
export function createStampMission(map,{speed,random=Math.random,history,onHistory,onVehicle,onStamp}={}){
 let phase='idle',index=0,round=null,remaining=0,elapsed=0,stamps=0,mistakes=0,feedback='',reward=0,nearTeacher=false,waiting=false,playing=false;
 let latestPosition=map.start,roundExit=map.start,latestVehicle={phase:'walking'},canInteract=false,checkpoint=0,parked=0,cargo=false;
 let schedule=[],used=new Set(),usedTeachers=new Set(),usedGrades=new Set(),lastCourse=null;
 const draws=createMissionDraws({random,history}),gradeOptions=[...map.grades.keys()];
 let previousFirstGrade=history?.version===1&&gradeOptions.includes(history.firstGrade)?history.firstGrade:null,firstGrade=null;
 const active=()=>!['idle','complete','timeout'].includes(phase);
 const targetTeacher=()=>round&&(phase==='contact'?round.contact:round.teacher);
 const vehicleAllowed=()=>round?.type==='drive'&&['board','drive','park','unload'].includes(phase);
 const location=t=>{const r=map.rooms.get(t.roomId).room;return `${r.building==='MAIN'?'본관':'별관'} ${parseInt(r.floor)}층 · ${r.name}`;};
 const approach=t=>point(map.rooms.get(t.roomId).nearest(t.position));
 function teacher(){const t=draws.pick('teachers',map.teachers,t=>t.id,usedTeachers);if(!t)throw Error('미션 선생님을 찾을 수 없습니다.');usedTeachers.add(t.id);return t;}
 function beginRound(from){
  if(index%4===0){usedTeachers=new Set();usedGrades=new Set();}
  const spec=schedule[index],type=spec.type;
  round={type,wrong:[],routes:[],travel:0,searchDistance:0,roomCount:0};cargo=false;checkpoint=0;parked=0;
  if(type==='drive'){
   const course=shuffled(DELIVERY_COURSES.filter(c=>c.id!==lastCourse),random)[0];lastCourse=course.id;
   const route=map.routeToPoint(from,course.pickup);
   round={...round,course,item:course.pickup,kind:shuffled(DELIVERY_ITEMS,random)[0],routes:[route.points],travel:route.length};
   // Deliberately generous time for walking, boarding, checkpoints and unloading.
   round.limit=Math.max(480,missionTime({distance:route.length+180,speed})+120);
   onVehicle?.(course);phase='pickup';
  }else{
   const excluded=new Set(usedGrades);if(firstGrade===null&&previousFirstGrade!==null)excluded.add(previousFirstGrade);
   const grade=draws.pick('grades',gradeOptions,String,excluded);usedGrades.add(grade);
   if(firstGrade===null){firstGrade=grade;previousFirstGrade=grade;}
   const group=map.grades.get(grade),place=draws.pick('rooms-'+grade,group,r=>r.room.id),item=point(shuffled(place.treasures,random)[0]);
   const destination=teacher(),contact=type==='relay'?teacher():null;
   const route1=contact?map.route(from,contact.roomId,approach(contact)):map.route(from,place.room.id,item);
   const route2=map.route(contact?approach(contact):item,destination.roomId,approach(destination));
   const floors=[...new Set(group.map(r=>parseInt(r.room.floor)))].sort(),buildings=[...new Set(group.map(r=>r.room.building==='MAIN'?'본관':'별관'))];
   round={...round,grade,room:place.room,item,teacher:destination,contact,roomCount:group.length,
    area:buildings.join('·')+' '+floors.map(f=>f+'층').join('·'),kind:type==='search'?shuffled(['별','선물상자'],random)[0]:shuffled(DELIVERY_ITEMS,random)[0],
    question:pickQuestion(spec.category,used,index<4?0:2,random,draws.pick),routes:[route1.points,route2.points],travel:route1.length+route2.length,
    searchDistance:type==='search'?map.searchDistance(grade):0};
   round.limit=missionTime({distance:round.travel,searchDistance:round.searchDistance,roomCount:type==='search'?group.length:0,speed})+(type==='relay'?60:0);
   phase=type==='search'?'search':type==='relay'?'contact':'pickup';
  }
  remaining=round.limit;nearTeacher=false;waiting=false;canInteract=false;feedback='';
  onHistory?.({...draws.snapshot(),firstGrade:previousFirstGrade});
 }
 function complete(){roundExit={...latestPosition};stamps++;onStamp?.();phase='reward';reward=4.5;canInteract=false;cargo=false;feedback='참 잘했어요! 스탬프를 받았어요.'+(round.question?' '+round.question.explanation:' 안전하게 배송을 마쳤어요!');}
 function pointTarget(){
  if(!round)return null;
  if(phase==='pickup')return round.item;
  if(phase==='board')return latestVehicle.cars?.find(c=>c.id===round.course.carId)?.position??round.course.launch;
  if(phase==='drive')return round.course.checkpoints[checkpoint];
  if(phase==='park')return round.course.park;
  if(phase==='unload')return round.course.drop;
  return null;
 }
 function view(){
  const t=targetTeacher(),type=round?.type,target=pointTarget();let clue='',place='',action='';
  if(phase==='search'){clue=`${round.grade}학년 교실 중 한 곳에서 ${round.kind}${round.kind==='별'?'을':'를'} 찾아보세요!`;place=`${round.area} · ${round.roomCount}개 교실 중 한 곳 · 가까이 가면 획득`;}
  if(phase==='pickup'){clue=`${round.kind} 받기`;place=type==='drive'?`${round.course.label} · 빛나는 상자로 가세요`:`${round.room.building==='MAIN'?'본관':'별관'} ${parseInt(round.room.floor)}층 · ${round.room.name} 안`;action='물건 들기';}
  if(phase==='contact'){clue=`${t.label}에게 말 걸기`;place=location(t)+' · 다음 선생님에게 전할 힌트를 받아요';action='말 걸기';}
  if(['teacher','quiz'].includes(phase)){clue=`${t.label}에게 ${type==='delivery'?'물건 전달하기':type==='relay'?'소식 전하기':'퀴즈 풀러 가기'}`;place=location(t);action=type==='delivery'?'물건 전달하기':'말 걸기';}
  if(phase==='board'){clue='배송 차량에 탑승하세요';place=round.course.label+' · 표시된 스포츠카 옆에서 F / 차량 버튼';}
  if(phase==='drive'){clue=`배송 표지 ${checkpoint+1} / ${round.course.checkpoints.length} 통과하기`;place=round.course.label+' · 차를 타고 빛나는 원으로! 뒤쪽 표지는 S / 후진도 가능';}
  if(phase==='park'){clue='도착 구역에 차를 멈추세요';place='빛나는 원 안에서 키·페달을 놓고 잠시 정차해요';}
  if(phase==='unload'){clue='차에서 내려 물건 전달하기';place='F / 하차 버튼 → 빛나는 상자로 가세요';action='배송 완료하기';}
  if(phase==='reward'){clue='스탬프 획득!';place=index%4===3?`${Math.floor(index/4)+1}번째 모험 묶음을 마쳤어요!`:'잠시 후 새로운 미션이 시작돼요.';}
  return {phase,active:active(),round:index+1,total:MISSION_TOTAL,chapter:Math.floor(index/4)+1,title:TITLES[type],type,stamps,mistakes,elapsed,remaining,limit:round?.limit??0,nearTeacher,waiting,
   grade:round?.grade,kind:round?.kind,area:round?.area,roomCount:round?.roomCount,
   teacher:t&&!['search','pickup'].includes(phase)?{id:t.id,label:t.label,roomId:t.roomId,floor:Math.round(t.position.z/map.floorHeight)+1}:null,
   prompt:round?.question?.prompt,category:round?.question?.category,choices:round?.question?.choices,wrong:[...(round?.wrong??[])],feedback,clue,place,
   action:canInteract?action:'',cargo:cargo?round.kind:null,checkpoint,vehicleAllowed:vehicleAllowed(),carId:round?.course?.carId,
   target:target?{...target,distance:Math.round(Math.hypot(target.x-latestPosition.x,target.y-latestPosition.y)),label:phase==='drive'?'배송 표지':phase==='board'?'배송 차량':phase==='park'?'정차 구역':'물건'}:null,
   explanation:phase==='reward'||phase==='complete'?round?.question?.explanation:null};
 }
 return {view,active,
  start(){
   index=0;stamps=0;mistakes=0;elapsed=0;used=new Set();firstGrade=null;lastCourse=null;
   const categories=shuffled(['영어','영어','영어','영어','영어','상식','상식','상식','상식'],random);
   schedule=Array.from({length:3},()=>shuffled(TYPES,random).map(type=>({type,category:type==='drive'?null:categories.pop()}))).flat();
   latestPosition={...map.start};beginRound(latestPosition);return view();
  },
  stop(){phase='idle';nearTeacher=false;waiting=false;canInteract=false;cargo=false;},
  collectible:()=>['search','pickup'].includes(phase)?{...round.item,kind:phase==='search'?round.kind:'상자'}:null,
  teacherTarget:targetTeacher,
  debug:()=>round?{type:round.type,roomId:round.room?.id,item:{...round.item},routes:round.routes,travel:round.travel,searchDistance:round.searchDistance,limit:round.limit,correct:round.question?.correct,questionId:round.question?.id,course:round.course,contact:round.contact,teacher:round.teacher,schedule:schedule.map(s=>s.type)}:null,
  tick(dt,{position,npcs=[],active:running=true,colliders=[],vehicle={phase:'walking'}}={}){
   latestPosition=position??latestPosition;latestVehicle=vehicle;playing=running;canInteract=false;
   if(!active()||!playing)return view();
   dt=Number.isFinite(dt)?Math.max(0,dt):0;
   // Plan from the completed task, so walking onto a stair during the short
   // celebration cannot turn its intermediate height into an invalid origin.
   if(phase==='reward'){reward-=dt;if(reward<=0){if(stamps===MISSION_TOTAL)phase='complete';else{index++;beginRound(roundExit);}}return view();}
   const t=targetTeacher(),npc=t&&npcs.find(n=>n.id===t.id),p=npc?.position??t?.position,teacherPhase=['contact','teacher','quiz'].includes(phase),walking=vehicle.phase==='walking';
   waiting=teacherPhase&&Math.abs(latestPosition.z-p.z)<1&&Math.hypot(latestPosition.x-p.x,latestPosition.y-p.y)<12&&npc?.modelStatus!=='ready';
   nearTeacher=teacherPhase&&!waiting&&walking&&npc?.modelStatus==='ready'&&principalCanGreet(latestPosition,p,{colliders});
   if(!waiting){elapsed+=Math.min(dt,remaining);remaining=Math.max(0,remaining-dt);}
   if(remaining<=0){phase='timeout';feedback='모은 스탬프를 확인하고 다시 도전해 보세요.';return view();}
   if(['search','pickup'].includes(phase)){
    const b=round.room?.bounds,inside=!b||(latestPosition.x>b[0]&&latestPosition.x<b[1]&&latestPosition.y>b[2]&&latestPosition.y<b[3]);
    canInteract=walking&&inside&&close(latestPosition,round.item)&&principalCanGreet(latestPosition,round.item,{colliders});
    if(phase==='search'&&canInteract&&close(latestPosition,round.item,.85)){phase='teacher';canInteract=false;feedback=round.kind+'을 찾았어요! 선생님을 찾아가세요.';}
   }else if(teacherPhase){
    canInteract=nearTeacher&&phase!=='quiz';
    if(phase==='teacher'&&round.type==='search'&&nearTeacher){phase='quiz';canInteract=false;feedback='행복하세요! 문제를 풀고 스탬프를 받아요.';}
    else if(phase==='quiz'&&!nearTeacher)phase='teacher';
   }else if(round.type==='drive'){
    const course=round.course,car=vehicle.cars?.find(c=>c.id===course.carId),driving=vehicle.phase==='driving'&&vehicle.carId===course.carId;
    if(phase==='board'&&driving)phase='drive';
    if(phase==='drive'&&driving&&close(car?.position,course.checkpoints[checkpoint],3.2)){
     checkpoint++;feedback=`배송 표지 ${checkpoint}개 통과!`;if(checkpoint===course.checkpoints.length)phase='park';
    }
    if(phase==='park'){
     parked=driving&&close(car?.position,course.park,3)&&Math.abs(vehicle.speed)<.5?parked+dt:0;
     if(parked>=.8){phase='unload';feedback='주차 성공! 차에서 내려 상자에 물건을 전달하세요.';}
    }
    if(phase==='unload'){
     if(!close(car?.position,course.park,3.5)){phase='park';parked=0;}
     else canInteract=walking&&close(latestPosition,course.drop)&&principalCanGreet(latestPosition,course.drop,{colliders});
    }
   }
   return view();
  },
  interact(){
   if(!playing||!canInteract||remaining<=0)return view();canInteract=false;
   if(phase==='pickup'){cargo=true;phase=round.type==='drive'?'board':'teacher';feedback='물건을 들었어요. 목적지로 출발!';}
   else if(phase==='contact'){cargo=true;phase='teacher';feedback='전할 힌트: '+round.question.explanation;}
   else if(phase==='teacher'){cargo=false;phase='quiz';feedback='행복하세요! 잘 왔어요. 이번 문제를 풀어볼까요?';}
   else if(phase==='unload')complete();
   return view();
  },
  answer(choice){
   if(!playing||phase!=='quiz'||!nearTeacher||remaining<=0||!Number.isInteger(choice)||choice<0||choice>3||round.wrong.includes(choice))return view();
   if(choice===round.question.correct)complete();
   else{mistakes++;round.wrong.push(choice);feedback='다시 한번 생각해 보세요.';if(round.wrong.length>=2)feedback+=' 힌트: '+round.question.explanation;}
   return view();
  }
 };
}
