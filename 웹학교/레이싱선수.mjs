import {OFFICE_STAFF} from './교무실선생님목록.mjs';
// IDs and display names mirror CLASS_TEACHERS / OFFICE_CHARACTERS. Keeping this
// small registry independent of the 3D loaders lets physics run in Node as well.
export const RACE_DRIVERS=Object.freeze([
 ...Array.from({length:7},(_,i)=>Object.freeze({id:`teacher-6-${i+1}`,name:`6-${i+1} 담임선생님`})),
 Object.freeze({id:'teacher-science',name:'과학선생님'}),
 Object.freeze({id:'office-cute',name:'교장선생님'}),
 ...OFFICE_STAFF.map(t=>Object.freeze({id:t.id,name:t.label})),
]);

// A new shuffled roster is drawn for every start/retry, with no duplicate teacher
// in one race. Injected randomness keeps simulation and roster tests repeatable.
export function pickRaceDrivers(count,random=Math.random){
 const pool=[...RACE_DRIVERS];
 for(let i=pool.length-1;i>0;i--){
  const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));
  [pool[i],pool[j]]=[pool[j],pool[i]];
 }
 return pool.slice(0,Math.max(0,Math.floor(count)));
}

export function resultDriverBadge(id){
 if(id==='player')return '나';
 if(id==='office-cute')return '교장';
 if(id==='teacher-science')return '과학';
 const staff=OFFICE_STAFF.find(t=>t.id===id);if(staff)return staff.badge;
 return /^teacher-6-[1-7]$/.test(id)?id.slice('teacher-'.length):'선생님';
}
