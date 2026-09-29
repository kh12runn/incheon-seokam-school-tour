import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {fixture} from './휴대폰사진검사.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=spawn(process.execPath,[fileURLToPath(new URL('./관리자검사.mjs',import.meta.url)),'--serve'],{env:process.env,windowsHide:true,stdio:['ignore','pipe','pipe']});
// Never print ephemeral test credentials.
let browser;
try{
  const config=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Test server startup timeout')),15000);
    const lines=createInterface({input:server.stdout});lines.once('line',line=>{clearTimeout(timer);lines.close();resolve(JSON.parse(line));});server.once('exit',code=>{clearTimeout(timer);reject(new Error('Test server exited: '+code));});
  });
  browser=await chromium.launch({headless:true,...(process.env.QUIZ_BROWSER?{executablePath:process.env.QUIZ_BROWSER}:{})});
  const files=[{name:'Galaxy.jpg',mimeType:'image/jpeg',buffer:await fixture('JPEG')},{name:'iPhone.HEIC',mimeType:'image/heic',buffer:await fixture('HEIC')},{name:'photo.png',mimeType:'',buffer:await fixture('PNG')}];
  for(const mobile of [false,true]){
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(config.origin+'/admin');await page.locator('#관리자암호').fill(config.adminPassword);await page.locator('#로그인 button').click();
    await page.locator('#건물선택').getByRole('button',{name:'별관',exact:true}).click();await page.locator('#층선택').getByRole('button',{name:'4층',exact:true}).click();
    await page.locator('#공간목록 button').filter({hasText:'2-1'}).first().click();
    await page.locator('#파일선택').setInputFiles([...files,{name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')}]);
    await page.locator('#업로드').filter({hasText:'3장 업로드'}).waitFor();await page.locator('#업로드').click();
    await page.locator('#업로드결과').filter({hasText:'사진 3장이 업로드되었습니다.'}).waitFor({timeout:90000});
    assert.equal(await page.locator('#선택사진 .photo').count(),4);assert.equal(await page.locator('#선택사진').getByText('저장 완료 · 승인 대기',{exact:true}).count(),3);
    await page.locator('#건물선택').getByRole('button',{name:'기타',exact:true}).click();
    await page.locator('#기타위치구역').waitFor({state:'visible'});
    assert.equal(await page.locator('#층선택').isVisible(),false);assert.equal(await page.locator('#경로').innerText(),'관리자 > 기타');
    assert((await page.locator('#기타위치구역').innerText()).includes('촬영한 위치가 어디인지 설명해주세요'));
    await page.locator('#파일선택').setInputFiles([files[0]]);await page.locator('#업로드').filter({hasText:'1장 업로드'}).waitFor();
    let requests=0;page.on('request',req=>{if(req.url().includes('/api/admin/upload'))requests++;});
    await page.locator('#업로드').click();await page.locator('#알림').filter({hasText:'촬영한 위치가 어디인지 설명해주세요'}).waitFor();assert.equal(requests,0);
    const place='3학년 4반 앞 계단';await page.locator('#촬영위치설명').fill(place);await page.locator('#업로드').click();
    await page.locator('#업로드결과').filter({hasText:'사진 1장이 업로드되었습니다.'}).waitFor({timeout:90000});
    await page.locator('#저장사진 .location-note').filter({hasText:place}).first().waitFor();
    await page.locator('#건물선택').getByRole('button',{name:'기타',exact:true}).click();
    const second='별관쪽 운동장 <img src=x onerror=alert(1)>';
    await page.locator('#촬영위치설명').fill(second);await page.locator('#파일선택').setInputFiles([files[2]]);
    await page.locator('#업로드').filter({hasText:'1장 업로드'}).waitFor();await page.locator('#업로드').click();
    await page.locator('#저장사진 .location-note').filter({hasText:second}).first().waitFor({timeout:90000});
    assert.equal(await page.locator('#저장사진 .location-note img').count(),0,'Location description is text, never executable markup');
    await page.reload();await page.locator('#건물선택').getByRole('button',{name:'기타',exact:true}).click();
    await page.locator('#저장사진 .location-note').filter({hasText:place}).first().waitFor();await page.locator('#저장사진 .location-note').filter({hasText:second}).first().waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
    await context.close();
  }
  console.log(JSON.stringify({ok:true,checks:['desktop and mobile viewport','building/floor/room selection','mixed JPEG HEIC PNG upload','Other category and location prompt','required location before upload','distinct descriptions persist per photo after reload','location description XSS blocked','invalid file isolated','no horizontal overflow or page errors']}));
}finally{await browser?.close();server.kill();}
