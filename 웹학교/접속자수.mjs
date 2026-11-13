const counter=document.getElementById('접속자수');
if(counter){
 const format=new Intl.NumberFormat('ko-KR'),day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});
 let countedDay=null,busy=false;
 async function refresh(){
  if(busy||document.hidden)return;busy=true;
  try{
   const visit=countedDay!==day.format(Date.now());
   const response=await fetch(visit?'/api/visitors/visit':'/api/visitors',{method:visit?'POST':'GET',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(6000)});
   if(!response.ok)throw new Error('unavailable');
   const data=await response.json();
   if(!Number.isSafeInteger(data.today)||!Number.isSafeInteger(data.total)||data.today<0||data.total<data.today)throw new Error('invalid counts');
   if(visit)countedDay=data.date;
   counter.querySelector('[data-visitors=today]').textContent=format.format(data.today);
   counter.querySelector('[data-visitors=total]').textContent=format.format(data.total);
   counter.title='오늘: 한국 시각 기준 · 전체: 누적 브라우저 수 · 같은 브라우저의 새로고침은 중복 집계하지 않아요.';
   counter.setAttribute('aria-label',`오늘 접속 ${format.format(data.today)}명, 전체 접속 ${format.format(data.total)}명. 브라우저 기준`);
  }catch{counter.title='접속 수를 잠시 확인할 수 없습니다. 잠시 후 자동으로 다시 확인합니다.';}
  finally{busy=false;}
 }
 refresh();setInterval(refresh,60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
}
