export async function verifyMonthQuiz(page,baseURL='http://127.0.0.1:8085',{touch=false,denyLock=true}={}){
  const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL+'/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready);
  if(denyLock)await page.evaluate(()=>{HTMLCanvasElement.prototype.requestPointerLock=()=>Promise.reject(new DOMException('Test free look','NotAllowedError'));});
  await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
  await page.waitForFunction(()=>schoolTour.getState().mode==='walk'&&schoolTour.getState().character.modelStatus==='ready');
  if(!denyLock&&!touch)await page.waitForFunction(()=>schoolTour.getState().locked);
  if(touch)await page.evaluate(()=>{const el=document.getElementById('터치조작사용');el.checked=true;el.dispatchEvent(new Event('change'));});
  const move=async p=>page.evaluate(p=>{schoolTour.test.setPosition(p);schoolTour.test.setYaw(-Math.PI/2);},p);
  const bubble=page.locator('#월퀴즈말풍선');
  const near={x:45,y:-2.8,z:0},far={x:41,y:-2.8,z:0};
  await move(near);await bubble.waitFor({state:'visible'});
  assert(await page.locator('#월퀴즈창').count()===0,'No quiz modal');
  assert(!await page.locator('#시작안내').isVisible(),'Exploration not paused');
  assert(await page.locator('#월퀴즈보기 button').count()===4,'Four choices');
  assert(await page.locator('#월퀴즈문제').evaluate(el=>getComputedStyle(el).color)==='rgb(38, 63, 73)','Readable question contrast');
  if(!denyLock&&!touch)assert(await page.evaluate(()=>schoolTour.getState().locked),'Pointer lock retained');
  const q=await page.evaluate(()=>schoolTour.getMonthQuizState());
  const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
  const correct=q.question.choices.indexOf(months[q.question.month-1]),wrong=(correct+1)%4;
  const answer=async index=>touch?page.locator(`#월퀴즈보기 button[data-index="${index}"]`).tap():page.keyboard.press(String(index+1));
  await answer(wrong);assert(await page.locator('#월퀴즈결과').innerText()==='다시한번 생각해보세요','Wrong feedback');
  await answer(correct);assert(await page.locator('#월퀴즈결과').innerText()==='참 잘했어요~','Correct feedback');
  const before=await page.evaluate(()=>schoolTour.getState().position);
  await page.keyboard.down('s');await page.waitForTimeout(150);await page.keyboard.up('s');
  assert(JSON.stringify(await page.evaluate(()=>schoolTour.getState().position))!==JSON.stringify(before),'Movement remains enabled');
  await move(far);await bubble.waitFor({state:'hidden'});await page.waitForTimeout(100);await move(near);await bubble.waitFor({state:'visible'});
  assert((await page.evaluate(()=>schoolTour.getMonthQuizState())).question.month!==q.question.month,'New question on return');
  // Menus remain usable during an encounter; same question resumes afterwards.
  const visit=await page.evaluate(()=>schoolTour.getMonthQuizState().visit);
  await page.evaluate(()=>document.getElementById('메뉴').click());await bubble.waitFor({state:'hidden'});
  await page.locator('#메뉴닫기').click();await bubble.waitFor({state:'visible'});
  assert(await page.evaluate(()=>schoolTour.getMonthQuizState().visit)===visit,'Menu does not reroll');
  if(!touch){
    await move({x:40,y:1.5,z:3.4});await page.waitForTimeout(150);
    await page.evaluate(()=>{schoolTour.test.setPosition({x:32.2,y:-3.35,z:3.4});schoolTour.test.setYaw(Math.PI/2);});
    await bubble.waitFor({state:'visible',timeout:60000});
    assert((await page.evaluate(()=>schoolTour.getMonthQuizState())).question.npcId==='office-cute','Office NPC bubble');
    await page.waitForFunction(()=>schoolTour.getOfficePrincipalStates().length===1&&schoolTour.getOfficePrincipalStates()[0].modelStatus==='ready');
  }
  assert(errors.length===0,errors.join(';'));
  return {ok:true,touch,denyLock,nonModal:true,movement:true,wrongRetry:true,correct:true,reentry:true,menuResume:true,errors};
}
