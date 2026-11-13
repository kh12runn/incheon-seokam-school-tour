import {SPORTS_STAMPS} from './차량성능.mjs';
import {COURSE_VERSION} from './레이싱코스.mjs';
export const PROGRESS_KEY='석암-RockOn-기록-v1';
export function createSchoolProgress(storage){
 let state={version:1,stamps:0,bestRound:0,wins:0,awards:[],bestTimes:{},courseVersion:COURSE_VERSION},saved=true;
 try{const p=JSON.parse(storage?.getItem(PROGRESS_KEY)??'null');
  if(p?.version===1){state={...state,bestTimes:p.bestTimes??{},courseVersion:p.courseVersion,stamps:Number.isSafeInteger(p.stamps)&&p.stamps>=0?Math.min(p.stamps,100000):0,bestRound:Number.isInteger(p.bestRound)?Math.max(0,Math.min(5,p.bestRound)):0,wins:Number.isSafeInteger(p.wins)&&p.wins>0?p.wins:0,awards:Array.isArray(p.awards)?p.awards.filter(x=>typeof x==='string').slice(-128):[]};}
  else{const old=JSON.parse(storage?.getItem('석암학교-스탬프최고기록-12단계-v2')??'null');if(old&&Number.isFinite(old.seconds)&&old.seconds>0)state.stamps=12;}
 }catch{}
 // Previously earned unlocks stay earned. Times belong to a specific course.
 if(state.courseVersion!==COURSE_VERSION){state.bestTimes={};state.courseVersion=COURSE_VERSION;}
 state.bestTimes=Object.fromEntries(Object.entries(state.bestTimes??{}).filter(([key,value])=>/^[1-5]$/.test(key)&&Number.isFinite(value)&&value>0));
 function save(){try{if(!storage)throw Error();storage.setItem(PROGRESS_KEY,JSON.stringify(state));saved=true;}catch{saved=false;}}
 function completeRace(round,rank){
  if(!Number.isInteger(round)||round<1||round>5||!Number.isInteger(rank)||rank<1||rank>3)return false;
  if(rank===1)state.wins++;
  state.bestRound=Math.max(state.bestRound,round);save();return true;
 }
 save();
 return {view:()=>({...state,awards:undefined,sportsUnlocked:state.stamps>=SPORTS_STAMPS,saved}),
  stamp(id){if(typeof id!=='string'||!id||state.awards.includes(id))return false;state.awards.push(id);state.awards=state.awards.slice(-128);state.stamps++;save();return true;},
  record(round,seconds){const old=state.bestTimes[round]??null;if(!Number.isInteger(round)||round<1||round>5||!Number.isFinite(seconds)||seconds<=0)return {improved:false,previous:old};const improved=old===null||seconds<old;if(improved){state.bestTimes[round]=seconds;save();}return {improved,previous:old,best:state.bestTimes[round]};},
  completeRace,win(round){return completeRace(round,1);}};
}
