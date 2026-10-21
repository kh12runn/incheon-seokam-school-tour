async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:960,height:640});
 // Test-only A/B override: keep scene, resolution and assets identical.
 await page.route('**/*',async route=>{
  if(!decodeURI(new URL(route.request().url()).pathname).endsWith('/웹학교/게임.mjs'))return route.continue();
  const response=await route.fetch(),source=await response.text();
  await route.fulfill({response,body:source.replace("renderer.shadowMap.autoUpdate=mode==='walk';","renderer.shadowMap.autoUpdate=mode==='walk'||window.testDynamicShadows===true;")});
 });
 await page.goto('http://127.0.0.1:8080/?test=1');
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:90000});
 const result=await page.evaluate(async()=>{
  const sample=async dynamic=>{window.testDynamicShadows=dynamic;const times=[];let prev=await new Promise(requestAnimationFrame);
   for(let i=0;i<90;i++){const next=await new Promise(requestAnimationFrame);if(i>=20)times.push(next-prev);prev=next;}
   const state=schoolTour.getPerformanceState();if(state.shadowAutoUpdate!==dynamic)throw Error('Shadow A/B override not applied');
   times.sort((a,b)=>a-b);return {dynamic,meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[Math.floor(times.length*.95)],state};
  };
  const samples=[];for(const dynamic of [true,false,true,false])samples.push(await sample(dynamic));
  const state=schoolTour.getState();
  if(state.mode!=='overview'||!state.overview.autoOrbit)throw Error('Aerial rotation stopped');
  if(schoolTour.getClassTeacherStates().some(t=>t.modelStatus!=='not-requested'))throw Error('Aerial view downloaded teachers');
  return {samples,autoOrbit:true,teacherDownloads:0};
 });
 await page.screenshot({path:'output/optimized-aerial.png'});
 await page.unroute('**/*');
 if(errors.length)throw Error(errors.join('\n'));
 return {ok:true,...result,errors};
}
