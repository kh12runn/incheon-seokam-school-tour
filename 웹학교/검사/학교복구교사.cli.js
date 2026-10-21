async page => {
 const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push({url:r.url(),status:r.status()});});
 await page.setViewportSize({width:1100,height:760});await page.goto('http://127.0.0.1:8080/?test=1');
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,{},{timeout:90000});
 const initial=await page.evaluate(()=>schoolTour.getClassTeacherStates());
 if(initial.some(s=>s.modelStatus!=='not-requested'))throw Error('Teachers downloaded on start screen');
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 await page.waitForFunction(()=>schoolTour.getState().character.modelStatus==='ready',{},{timeout:45000});
 const visited=[];
 for(const id of ['4F_6-4','2F_SCIENCE','4F_6-6','4F_GRADE6_RESEARCH','1F_NURSE','2F_STAFF']){
  const option=await page.locator('#방선택 option[value="'+id+'"]').count();if(!option)throw Error('Missing room '+id);
  await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption(id);await page.locator('#방이동').click();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  if(['4F_6-4','2F_SCIENCE','4F_6-6'].includes(id)){
   await page.waitForFunction(id=>schoolTour.getClassTeacherStates().some(t=>t.roomId===id&&t.modelStatus==='ready'),id,{timeout:45000});
   await page.evaluate(id=>{const w=schoolTour.test.world,b=w.data.rooms.find(r=>r.id===id).bounds,t=schoolTour.getClassTeacherStates().find(t=>t.roomId===id).position,candidates=[];for(let x=b[0]+.6;x<b[1]-.5;x+=.4)for(let y=b[2]+.6;y<b[3]-.5;y+=.4)if(w.candidate(x,y,b[4]))candidates.push({x,y,z:b[4]});candidates.sort((a,c)=>Math.hypot(c.x-t.x,c.y-t.y)-Math.hypot(a.x-t.x,a.y-t.y));schoolTour.test.setPosition(candidates[0]);},id);
   const before=await page.evaluate(id=>schoolTour.getClassTeacherStates().find(t=>t.roomId===id),id);
   await page.waitForFunction(({id,distance})=>schoolTour.getClassTeacherStates().find(t=>t.roomId===id).distance>distance+.5,{id,distance:before.distance},{timeout:20000});
   await page.evaluate(id=>{const p=schoolTour.getState().position,t=schoolTour.getClassTeacherStates().find(t=>t.roomId===id).position;schoolTour.test.setYaw(Math.atan2(-(t.x-p.x),t.y-p.y));},id);
  }
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const state=await page.evaluate(()=>({game:schoolTour.getState(),teachers:schoolTour.getClassTeacherStates(),performance:schoolTour.getPerformanceState()}));
  visited.push({id,position:state.game.position,loadedTeachers:state.teachers.filter(t=>t.modelStatus==='ready').length,teachers:state.teachers.filter(t=>t.visible),performance:state.performance});
  if(visited.at(-1).loadedTeachers>2)throw Error('Teacher cache exceeded');
  await page.screenshot({path:'output/restored-'+id+'.png'});
 }
 if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));
 return {ok:true,noTeacherDownloadsAtStart:true,visited,errors,failed};
}
