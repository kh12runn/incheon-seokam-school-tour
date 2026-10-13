async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(!page.url().includes('127.0.0.1:8080/?test=1'))await page.goto('http://127.0.0.1:8080/?test=1',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
 if(await page.evaluate(()=>schoolTour.getState().mode!=='walk')){await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();}
 await page.waitForFunction(()=>schoolTour.getState().mode==='walk'&&schoolTour.getState().character.modelStatus==='ready',null,{timeout:120000});
 const touch=await page.evaluate(()=>schoolTour.getState().touch.active),results=[];
 for(const id of ['4F_6-4','3F_4-6','2F_1-2']){
  await page.evaluate(id=>{const d=schoolTour.test.world.roomDoors.doors.find(d=>d.id===id),v=d.tx&&d.y<1?.5:-.5;schoolTour.test.setPosition({x:d.x+d.tx*d.width/2-d.ty*v,y:d.y+d.ty*d.width/2+d.tx*v,z:d.z});schoolTour.test.setYaw(Math.atan2(-d.ty*Math.sign(v),-d.tx*Math.sign(v)));},id);
  await page.locator('#출입문조작').waitFor({state:'visible'});
  if(touch)await page.locator('#출입문조작').tap();else{await page.locator('#출입문조작').focus();await page.keyboard.press('f');}
  await page.waitForFunction(id=>schoolTour.getDoorState().find(d=>d.id===id).amount===0,id,{timeout:20000});
  const closed=await page.evaluate(id=>schoolTour.getDoorState().find(d=>d.id===id),id);results.push({id,closed});
  if(id==='4F_6-4')await page.screenshot({path:'output/door-fixed-'+(touch?'mobile':'desktop')+'.png',timeout:30000});
  if(touch)await page.locator('#출입문조작').tap();else await page.keyboard.press('f');
  await page.waitForFunction(id=>schoolTour.getDoorState().find(d=>d.id===id).amount===1,id,{timeout:20000});
 }
 // Settle/wait state is observed in the real game, not a mocked physics world.
 await page.waitForFunction(()=>schoolTour.getFootballState().every(b=>b.sleeping),null,{timeout:90000});
 const before=await page.evaluate(()=>schoolTour.getPerformanceState());await page.waitForTimeout(1000);const after=await page.evaluate(()=>schoolTour.getPerformanceState());
 if(before.physics.physicsSteps!==after.physics.physicsSteps||after.physics.idleFrames<=before.physics.idleFrames)throw Error('idle physics still active '+JSON.stringify({before,after}));
 if(errors.length)throw Error(JSON.stringify(errors));
 return {ok:true,touch,results,performance:after,errors};
}
