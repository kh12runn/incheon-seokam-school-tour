import {getRaceCourse,COURSE_VERSION} from './레이싱코스.mjs';
export const raceTime=s=>{const ticks=Math.round(s*100);return Math.floor(ticks/6000)+':'+((ticks%6000)/100).toFixed(2).padStart(5,'0');};
export async function raceRequest(path,data){
 const response=await fetch('/api/racing/'+path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(12000),...(data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
 const body=await response.json();if(!response.ok)throw Error(body.error??'기록을 불러올 수 없습니다.');return body;
}
export function createRecordBoard({host,startRound=1,onChallenge,compact=false}){
 let selected=startRound,serial=0,visible=true;
 const root=document.createElement('section');root.className='공용기록표';root.setAttribute('aria-label','라운드별 공용 기록 TOP 10');
 root.innerHTML=`<div class="기록표제목"><div><small>ROCK ON · HALL OF FAME</small><h2>다음 기록의 주인공은?</h2></div>${compact?'<button class="기록접기" aria-expanded="true">접기</button>':''}</div><div class="기록내용"><div class="기록라운드" role="tablist" aria-label="기록 라운드"></div><p class="기록코스"></p><div class="기록목록" aria-live="polite"></div><p class="기록도움">3바퀴 완주 기록 · 라운드별 TOP 10</p><button class="기록새로고침">새로고침</button>${onChallenge?'<button class="기록도전">이 기록에 도전하기 →</button>':''}</div>`;
 host.append(root);const tabs=root.querySelector('.기록라운드'),list=root.querySelector('.기록목록');
 for(let i=1;i<=5;i++){const b=document.createElement('button');b.type='button';b.role='tab';b.textContent=String(i);b.setAttribute('aria-label',`라운드 ${i} 기록`);b.onclick=()=>select(i);tabs.append(b);}
 async function select(round=selected){selected=round;const seq=++serial;[...tabs.children].forEach((b,i)=>b.setAttribute('aria-selected',String(i+1===round)));root.querySelector('.기록코스').textContent=getRaceCourse(round).name;list.textContent='기록을 불러오는 중…';try{
   const data=await raceRequest('records?round='+round);if(seq!==serial)return;renderRecords(list,data.records);
  }catch(e){if(seq===serial)list.textContent=e.name==='TimeoutError'?'연결이 느립니다. 새로고침으로 다시 확인해주세요.':e.message;}}
 root.querySelector('.기록새로고침').onclick=()=>select();root.querySelector('.기록도전')?.addEventListener('click',()=>onChallenge(selected));
 const toggle=root.querySelector('.기록접기');if(toggle){if(matchMedia('(max-width:900px)').matches){root.classList.add('접힘');toggle.textContent='기록 펼치기';toggle.setAttribute('aria-expanded','false');}toggle.onclick=()=>{const closed=root.classList.toggle('접힘');toggle.textContent=closed?'기록 펼치기':'접기';toggle.setAttribute('aria-expanded',String(!closed));};}
 const timer=setInterval(()=>{if(visible&&!document.hidden&&root.getClientRects().length&&!root.classList.contains('접힘'))select();},30000);select();
 return {root,select,show(value){visible=value;root.hidden=!value;if(value)select();},dispose(){clearInterval(timer);serial++;root.remove();}};
}
function renderRecords(host,records){
 host.replaceChildren();if(!records.length){const p=document.createElement('p');p.className='첫기록';p.textContent='아직 기록이 없어요. 첫 번째 이름을 남겨보세요!';host.append(p);return;}
 const table=document.createElement('table');table.innerHTML='<thead><tr><th scope="col">순위</th><th scope="col">도전자 / 사용 차량</th><th scope="col">기록</th></tr></thead><tbody></tbody>';const body=table.lastChild;
 for(const record of records){const row=document.createElement('tr'),rank=document.createElement('td'),name=document.createElement('td'),time=document.createElement('td'),detail=document.createElement('small'),icon=document.createElement('span');rank.textContent=record.rank===1?'🏆':record.rank;name.textContent=`${record.grade}-${record.class} ${record.nickname}`;detail.className='기록사용차량';icon.textContent='🚘';icon.setAttribute('aria-hidden','true');detail.append(icon,document.createTextNode(' 사용 차량: '+(record.carName||'차량 정보 없음')));name.append(detail);time.textContent=raceTime(record.milliseconds/1000);row.append(rank,name,time);body.append(row);}host.append(table);
}
export function createRaceRecordRun(round,carId){
 const token=raceRequest('start',{round,carId,version:COURSE_VERSION}).then(r=>r.token).catch(()=>null),proof=[];
 let sampled=-2,finished=null;
 return {sample(race,state,force=false){if(state.phase!=='racing'&&state.phase!=='finished')return;if(!force&&state.time-sampled<1.5)return;if(state.time<=sampled)return;sampled=state.time;const p=race.player;proof.push([+state.time.toFixed(3),+(p.finish!==null?race.course.length*3:p.s).toFixed(3),+p.x.toFixed(3),+p.z.toFixed(3)]);},
  async finish(state){if(finished)return finished;finished=(async()=>{const id=await token;if(!id)throw Error('서버 연결이 없어 개인 기록만 저장했어요. 다음 레이스에서 공용 기록에 도전해주세요.');return {...await raceRequest('finish',{token:id,time:state.time,proof}),token:id};})();try{return await finished;}catch(e){finished=null;throw e;}}};
}
export function createRecordEntry(host){
 let serial=0,current=null,profile=null;try{profile=JSON.parse(localStorage.getItem('석암-레이싱-참가자'));}catch{}
 const root=document.createElement('section');root.className='기록등록';root.hidden=true;
 root.innerHTML='<strong class="기록결과문구"></strong><p class="기록저장상태" role="status"></p><form hidden><label>학년<select name="grade" aria-label="학년"></select></label><label>반<input name="classNumber" type="number" min="1" max="20" value="1" required></label><label class="별명입력">별명<input name="nickname" minlength="2" maxlength="12" placeholder="실명 대신 별명" required></label><button type="submit">TOP 10에 내 기록 남기기</button></form><button class="기록다시저장" hidden>기록 저장 다시 시도</button>';host.append(root);
 const summary=host.querySelector('#레이스결과설명');if(summary)summary.after(root);
 const form=root.querySelector('form'),status=root.querySelector('.기록저장상태'),grade=form.elements.grade;
 for(let i=1;i<=6;i++){const option=document.createElement('option');option.value=i;option.textContent=i+'학년';grade.append(option);}if(profile){grade.value=profile.grade;form.elements.classNumber.value=profile.classNumber;form.elements.nickname.value=profile.nickname;}
 async function submit(values){const seq=serial;form.querySelector('button').disabled=true;status.textContent='기록을 저장하고 있어요…';try{const result=await raceRequest('submit',{token:current.token,...values});if(seq!==serial)return;status.textContent=result.rank?`공용 기록 ${result.rank}위! 친구들이 볼 수 있도록 저장했어요.`:'그사이 더 빠른 기록이 올라왔어요. 다시 TOP 10에 도전해보세요!';form.hidden=true;root.querySelector('.기록다시저장').hidden=true;profile=values;try{localStorage.setItem('석암-레이싱-참가자',JSON.stringify(values));}catch{}}catch(e){if(seq===serial){status.textContent=e.message;form.hidden=false;}}finally{form.querySelector('button').disabled=false;}}
 form.onsubmit=e=>{e.preventDefault();submit({grade:Number(grade.value),classNumber:Number(form.elements.classNumber.value),nickname:form.elements.nickname.value.trim()});};
 let retry;root.querySelector('.기록다시저장').onclick=()=>retry?.();
 return {clearProfile(){profile=null;try{localStorage.removeItem('석암-레이싱-참가자');}catch{}form.reset();},hide(){serial++;root.hidden=true;},async show({run,state,best}){
  const seq=++serial;root.hidden=false;form.hidden=true;root.querySelector('.기록다시저장').hidden=true;
  root.querySelector('.기록결과문구').textContent=best.improved?'PERSONAL BEST · 개인 최고 기록!':`내 최고 기록까지 ${Math.max(0,state.time-best.best).toFixed(2)}초!`;
  status.textContent='공용 순위를 확인하고 있어요…';
  retry=async()=>{try{const result=await run.finish(state);if(seq!==serial)return;current=result;if(!result.qualifies){status.textContent='개인 기록을 저장했어요. 더 빠르게 달려 TOP 10에 도전하세요!';return;}status.textContent='TOP 10에 들어갈 기록이에요! 학년·반과 별명을 남겨주세요.';if(profile)await submit(profile);else form.hidden=false;}catch(e){if(seq===serial){status.textContent=e.message;root.querySelector('.기록다시저장').hidden=false;}}};await retry();
 }};
}
