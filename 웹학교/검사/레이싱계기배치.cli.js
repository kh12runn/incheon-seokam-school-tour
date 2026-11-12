async main=>{
 await main.goto('about:blank');const layouts=[];
 for(const touch of [false,true]){
  const context=await main.context().browser().newContext({viewport:{width:1280,height:800},hasTouch:touch,isMobile:touch}),page=await context.newPage();
  try{
   await page.goto('http://127.0.0.1:8080/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:240000});await page.locator('#레이싱시작').click();await page.locator('#레이스출발').click();
   for(const [width,height] of touch?[[320,720],[390,844],[844,390]]:[[701,600],[800,600],[1280,800]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    const result=await page.evaluate(()=>{
     const selectors=['.레이스계기','.레이스키안내','#레이스트랙지도',...(matchMedia('(pointer:coarse)').matches?['.레이스터치']:[])];
     const rects=selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {selector:s,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}),overlaps=[];
     for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y)overlaps.push([a.selector,b.selector]);}
     return {width:innerWidth,height:innerHeight,overlaps,overflow:rects.some(r=>r.x<0||r.y<0||r.right>innerWidth+.1||r.bottom>innerHeight+.1),shiftVisible:!!document.querySelector('.부스트키 kbd').getClientRects().length};
    });if(result.overflow||result.overlaps.length||!touch&&!result.shiftVisible)throw Error(JSON.stringify(result));layouts.push(result);
   }
  }finally{await context.close();}
 }return {ok:true,layouts};
}
