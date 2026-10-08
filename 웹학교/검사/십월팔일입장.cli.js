async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1100,height:750});
 await page.goto('http://127.0.0.1:8080/?test=1');
 await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:150000});
 await page.locator('#시작').click();await page.locator('#걸어서선택').click();await page.locator('#캐릭터확인').click();
 const reports=[];
 for(const id of ['2F_2-6','1F_1-5','1F_1-4','1F_1-6','2F_1-1','3F_4-7','3F_4-8','2F_INDIVIDUAL_2','4F_GRADE2_RESEARCH','4F_GRADE6_RESEARCH','4F_COMPUTER','3F_4-6','4F_4-2']){
  await page.evaluate(()=>document.getElementById('메뉴').click());
  await page.locator('#방선택').selectOption(id);await page.locator('#방이동').click({noWaitAfter:true});
  await page.waitForFunction(()=>schoolTour.getState().mode==='walk');
  const report=await page.evaluate(id=>{
   const s=schoolTour.getState(),w=schoolTour.test.world,c=[...w.classroomInteriors,...w.specialInteriors].find(c=>c.roomId===id);
   return {id,position:s.position,valid:!!w.candidate(s.position.x,s.position.y,s.position.z),photos:c.profile?.photoCount??c.reference.count};
  },id);
  if(!report.valid||Math.abs(report.position.z-(parseInt(id)-1)*3.4)>.001)throw new Error(JSON.stringify(report));
  await page.screenshot({path:'output/oct8-game-'+id+'.png'});reports.push(report);
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
 return {ok:true,reports,errors};
}
