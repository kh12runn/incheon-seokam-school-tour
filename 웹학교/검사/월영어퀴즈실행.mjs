// Optional browser runner; does not add dependencies to the production app.
// PLAYWRIGHT_MODULE can point to an existing Playwright installation's index.mjs.
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import {verifyMonthQuiz} from './월영어퀴즈브라우저검사.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.QUIZ_BROWSER?{executablePath:process.env.QUIZ_BROWSER}:{}),args:['--enable-unsafe-swiftshader']});
const base=process.env.QUIZ_BASE_URL??'http://127.0.0.1:8085';
try{
  for(const {touch,denyLock} of [{touch:false,denyLock:true},{touch:true,denyLock:true},{touch:false,denyLock:false}]){
    const context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1280,height:900},hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
    const page=await context.newPage();page.setDefaultTimeout(60000);
    if(process.env.QUIZ_LIGHTWEIGHT==='1'){
      // Input/UI integration only on GPU-less CI; production source is untouched.
      await page.route(url=>decodeURIComponent(url.pathname).endsWith('/게임.mjs'),async route=>{
        const response=await route.fetch();const source=await response.text();
        console.log('GPU-less input/UI mode: game module intercepted');
        await route.fulfill({response,body:source.replace('renderer.render(scene,camera);','/* GPU-less input/UI test: skip scene draw */').replace('scene.environment=softEnvironment(renderer);','scene.environment=null;')});
      });
    }
    try{
      console.log(touch?'Testing mobile quiz':`Testing desktop quiz (denyLock=${denyLock})`);
      console.log(JSON.stringify(await verifyMonthQuiz(page,base,{touch,denyLock})));
      await page.evaluate(()=>schoolTour.test.setPosition({x:41,y:-2.8,z:0}));await page.waitForTimeout(150);
      await page.evaluate(()=>{schoolTour.test.setPosition({x:45,y:-2.8,z:0});schoolTour.test.setYaw(-Math.PI/2);});await page.locator('#월퀴즈말풍선').waitFor({state:'visible'});
      const box=await page.locator('#월퀴즈말풍선').boundingBox();
      if(!box||box.x<0||box.y<0||box.x+box.width>page.viewportSize().width||box.y+box.height>page.viewportSize().height)throw Error('Quiz dialog outside viewport');
      await fs.mkdir('결과물/퀴즈검사',{recursive:true});await page.screenshot({path:`결과물/퀴즈검사/${touch?'모바일':'PC'}.png`});
      if(touch){
        await page.setViewportSize({width:844,height:390});
        await page.waitForTimeout(200);
        const landscape=await page.locator('#월퀴즈말풍선').boundingBox();
        if(!landscape||landscape.y<0||landscape.y+landscape.height>390)throw Error('Landscape quiz outside viewport');
        await page.locator('#월퀴즈보기 button').first().tap();
        await page.waitForFunction(()=>schoolTour.getMonthQuizState().attempts===1&&schoolTour.getState().touch.active);
      }
    }catch(error){
      console.error(JSON.stringify({touch,error:String(error),state:await page.evaluate(()=>({game:window.schoolTour?.getState(),quiz:window.schoolTour?.getMonthQuizState(),text:document.body.innerText.slice(-2000)}))}));
      throw error;
    }finally{await context.close();}
  }
}finally{await browser.close();}
