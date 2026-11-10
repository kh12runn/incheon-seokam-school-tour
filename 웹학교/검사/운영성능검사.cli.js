async page=>{
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
 await page.setViewportSize({width:1100,height:800});await page.goto('http://127.0.0.1:8081/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:90000});
 const initial=await page.evaluate(()=>({readyMS:performance.now(),domMS:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,requests:performance.getEntriesByType('resource').length,modules:performance.getEntriesByType('resource').filter(r=>/\.(mjs|js)$/.test(new URL(r.name).pathname)).map(r=>({file:decodeURI(new URL(r.name).pathname.split('/').pop()),transfer:r.encodedBodySize})),render:schoolTour.getPerformanceState()}));
 if(initial.render.details.loaded!==0)throw Error('Eager classroom detail generation');if(initial.modules.length!==1)throw Error('Production code is not bundled');
 await page.screenshot({path:'output/performance-production-start.png'});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click({timeout:120000});await page.waitForFunction(()=>schoolTour.getState().mode==='walk');
 const targets=await page.evaluate(()=>{const w=schoolTour.test.world;return [{roomId:'4F_6-4',spawn:{x:33.3,y:-3.5,z:10.2}},...w.specialInteriors.filter(c=>/교무실|보건실|연수실|협의실|도서관/.test(c.room.name))].map(c=>({roomId:c.roomId,room:c.room,spawn:c.spawn}));});
 const checked=[];
 for(const config of targets){
  await page.evaluate(c=>{const w=schoolTour.test.world,r=w.data.rooms.find(r=>r.id===c.roomId),b=r.bounds;let p=c.spawn&&w.candidate(c.spawn.x,c.spawn.y,c.spawn.z);for(let x=b[0]+.6;!p&&x<b[1]-.6;x+=.5)for(let y=b[2]+.6;!p&&y<b[3]-.6;y+=.5)p=w.candidate(x,y,b[4]);if(!p)throw Error('No room entry '+c.roomId);schoolTour.test.setPosition(p);},config);
  await page.waitForFunction(id=>schoolTour.getPerformanceState().details.rooms.includes(id),config.roomId,{timeout:60000});
  const state=await page.evaluate(()=>schoolTour.getPerformanceState().details);if(state.errors.length)throw Error(JSON.stringify(state.errors));checked.push(config.roomId);
 }
 await page.screenshot({path:'output/performance-production-room.png'});
 await page.keyboard.press('Escape');await page.locator('#게임메뉴').waitFor({state:'visible'});await page.locator('#전체').click();await page.locator('#퀴즈시작').click();await page.waitForFunction(()=>schoolTour.getMissionState().phase==='search',null,{timeout:60000});
 if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));
 return {ok:true,initial,roomDetailsRestored:checked,missionStarts:true,errors,failed};
}
