import {shuffled} from './탐험문제.mjs';

// A bounded shuffle bag remembers only drawn IDs, never model or image data.
// Exhausted eligible options start a new cycle without discarding other pools.
export function createMissionDraws({random=Math.random,history}={}){
 const bags=new Map(),saved=history?.version===1&&history.bags&&typeof history.bags==='object'?history.bags:{};
 for(const [key,values] of Object.entries(saved))if(/^(grades|teachers|questions|rooms-[1-6])$/.test(key)&&Array.isArray(values))bags.set(key,new Set(values.slice(0,512).filter(value=>typeof value==='string'&&value.length<100)));
 return {
  pick(key,values,id=value=>String(value),excluded=new Set()){
   const ids=new Set(values.map(value=>String(id(value)))),blocked=new Set([...excluded].map(String));
   if(!bags.has(key))bags.set(key,new Set((Array.isArray(saved[key])?saved[key].slice(0,512):[]).filter(value=>typeof value==='string'&&ids.has(value))));
   const seen=bags.get(key),eligible=values.filter(value=>!blocked.has(String(id(value))));
   for(const value of seen)if(!ids.has(value))seen.delete(value);
   if(!eligible.length)throw Error('추첨할 미션 후보가 없습니다: '+key);
   let fresh=eligible.filter(value=>!seen.has(String(id(value))));
   if(!fresh.length){for(const value of eligible)seen.delete(String(id(value)));fresh=eligible;}
   const selected=shuffled(fresh,random)[0];seen.add(String(id(selected)));return selected;
  },
  snapshot(){return {version:1,bags:Object.fromEntries([...bags].map(([key,seen])=>[key,[...seen]]))};}
 };
}
