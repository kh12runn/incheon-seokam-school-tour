async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:900,height:650});
 await page.goto('http://127.0.0.1:8080/?test=1',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 await page.waitForFunction(()=>schoolTour.getState().mode==='walk'&&schoolTour.getState().character.modelStatus==='ready',null,{timeout:150000});
 await page.waitForTimeout(400);
 const initial=await page.evaluate(()=>schoolTour.getDoorState());
 if(initial.filter(d=>d.kind==='sliding').some(d=>d.amount!==1))throw Error('initial classroom door is closed');
 const place=async(id,side=1)=>page.evaluate(({id,side})=>{
  const d=schoolTour.test.world.roomDoors.doors.find(d=>d.id===id),u=d.width/2,v=side*.8;
  schoolTour.test.setPosition({x:d.x+d.tx*u-d.ty*v,y:d.y+d.ty*u+d.tx*v,z:d.z});schoolTour.test.setYaw(Math.atan2(-d.ty*side,-d.tx*side));return {id,kind:d.kind};
 },{id,side});
 await place('4F_6-4');await page.waitForTimeout(400);
 await page.keyboard.press('f');await page.waitForFunction(()=>schoolTour.getDoorState().find(d=>d.id==='4F_6-4').amount===0,null,{timeout:20000});
 let state=await page.evaluate(()=>schoolTour.getDoorState().find(d=>d.id==='4F_6-4'));
 if(state.amount!==0)throw Error('F close failed '+JSON.stringify({state,game:await page.evaluate(()=>schoolTour.getState())}));
 await page.screenshot({path:'output/doors-classroom-closed.png'});
 await page.keyboard.press('f');await page.waitForFunction(()=>schoolTour.getDoorState().find(d=>d.id==='4F_6-4').amount===1,null,{timeout:20000});
 state=await page.evaluate(()=>schoolTour.getDoorState().find(d=>d.id==='4F_6-4'));
 if(state.amount!==1)throw Error('F open failed');
 await page.screenshot({path:'output/doors-classroom-open.png'});
 const passages=[];
 for(const [id,side] of [['2F_STAFF',1],['3F_COUNSELING',-1],['B1_MAIN_HALL_GATE',-1]]){
  await place(id,side);await page.waitForTimeout(250);
  if(id==='B1_MAIN_HALL_GATE')await page.screenshot({path:'output/doors-'+id+'-closed.png',timeout:60000});
  await page.keyboard.down('w');
  try{await page.waitForFunction(({id,side})=>{const d=schoolTour.test.world.roomDoors.doors.find(d=>d.id===id),p=schoolTour.getState().position;return ((p.x-d.x)*(-d.ty)+(p.y-d.y)*d.tx)*side<-.4;},{id,side},{timeout:20000});}finally{await page.keyboard.up('w');}
  const result=await page.evaluate(({id,side})=>{const d=schoolTour.test.world.roomDoors.doors.find(d=>d.id===id),p=schoolTour.getState().position;return {id,amount:d.amount,progress:((p.x-d.x)*(-d.ty)+(p.y-d.y)*d.tx)*side,position:p};},{id,side});
  if(result.progress>-.35)throw Error('body pushing failed '+JSON.stringify(result));
  passages.push(result);
 }
 await page.evaluate(()=>document.getElementById('메뉴').click());
 await page.locator('summary').filter({hasText:'조작 방법'}).click();await page.locator('#터치조작사용').check();await page.locator('#메뉴닫기').click();
 await page.setViewportSize({width:390,height:844});await place('2F_1-2',-1);await page.waitForTimeout(300);
 const button=page.locator('#출입문조작');await button.click();await page.waitForFunction(()=>schoolTour.getDoorState().find(d=>d.id==='2F_1-2').amount===0,null,{timeout:20000});
 const touch=await page.evaluate(()=>({door:schoolTour.getDoorState().find(d=>d.id==='2F_1-2'),label:document.getElementById('출입문조작').textContent}));
 if(touch.door.amount!==0)throw Error('door button failed');
 await page.screenshot({path:'output/doors-mobile-button.png'});
 await button.click();await page.waitForFunction(()=>schoolTour.getDoorState().find(d=>d.id==='2F_1-2').amount===1,null,{timeout:20000});
 if((await page.evaluate(()=>schoolTour.getDoorState().find(d=>d.id==='2F_1-2').amount))!==1)throw Error('button reopen failed');
 if(errors.length)throw Error(JSON.stringify(errors));
 return {ok:true,classrooms:initial.filter(d=>d.kind==='sliding').length,doors:initial.length,passages,touch,errors};
}
