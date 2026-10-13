async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/?test=1',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 await page.waitForFunction(()=>schoolTour.getState().character.modelStatus==='ready',null,{timeout:150000});
 const place=async(id,side)=>page.evaluate(({id,side})=>{
  const d=schoolTour.test.world.roomDoors.doors.find(d=>d.id===id),u=d.width/2,v=side*.8;
  schoolTour.test.setPosition({x:d.x+d.tx*u-d.ty*v,y:d.y+d.ty*u+d.tx*v,z:d.z});schoolTour.test.setYaw(Math.atan2(-d.ty*side,-d.tx*side));
 },{id,side});
 const passages=[];
 for(const [id,side] of [['2F_STAFF',1],['3F_COUNSELING',-1],['B1_MAIN_HALL_GATE',-1]]){
  await place(id,side);await page.keyboard.down('w');
  try{await page.waitForFunction(({id,side})=>{const d=schoolTour.test.world.roomDoors.doors.find(d=>d.id===id),p=schoolTour.getState().position;return ((p.x-d.x)*(-d.ty)+(p.y-d.y)*d.tx)*side<-.4;},{id,side},{timeout:30000});}finally{await page.keyboard.up('w');}
  passages.push(await page.evaluate(id=>({door:schoolTour.getDoorState().find(d=>d.id===id),position:schoolTour.getState().position}),id));
 }
 await place('2F_1-2',-1);
 const button=page.locator('#출입문조작');await button.waitFor({state:'visible'});await button.tap();
 await page.waitForFunction(()=>schoolTour.getDoorState().find(d=>d.id==='2F_1-2').amount===0,null,{timeout:20000});
 await button.tap();await page.waitForFunction(()=>schoolTour.getDoorState().find(d=>d.id==='2F_1-2').amount===1,null,{timeout:20000});
 const screen=await page.evaluate(()=>{const b=document.getElementById('출입문조작'),r=b.getBoundingClientRect();return {touch:schoolTour.getState().touch.active,label:b.textContent,inside:r.left>=0&&r.right<=innerWidth&&r.bottom<innerHeight,width:innerWidth};});
 if(!screen.touch||!screen.inside)throw Error(JSON.stringify(screen));
 if(errors.length)throw Error(JSON.stringify(errors));
 return {ok:true,passages,screen,errors};
}
