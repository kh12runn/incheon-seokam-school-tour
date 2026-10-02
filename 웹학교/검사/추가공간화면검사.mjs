import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {EXTRA_PHOTO_ROOMS} from '../추가공간사진배치.mjs';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:750},deviceScaleFactor:1,hasTouch:true,isMobile:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8080';await page.goto(base+'/healthz');
 await page.evaluate(async()=>{
  const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{supportRoomDetails}=await import('/웹학교/지원실사진표현.mjs'),{nurseRoomDetails}=await import('/웹학교/보건실사진표현.mjs'),{finishMaterial,surfaceKind,softEnvironment}=await import('/웹학교/현실재질.mjs');
  const {recyclingShelterDetails}=await import('/웹학교/분리수거장사진표현.mjs');
  const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json());
  document.body.replaceChildren();document.body.style.margin='0';const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,750);document.body.append(renderer.domElement);renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b8d1de');scene.environment=softEnvironment(renderer);scene.add(new THREE.HemisphereLight(0xfff6e5,0xadb5a5,2));const light=new THREE.DirectionalLight(0xfff4de,1.7);light.position.set(20,80,50);scene.add(light);
  const camera=new THREE.PerspectiveCamera(85,1100/750,.025,200),geometry=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4();let root=null,active=null;
  window.showRoom=(id,side)=>{
   const outdoor=id==='recycling',c=outdoor?{...world.recyclingShelter,room:{bounds:[28,38,3.2,11,-.6,2.5]}}:world.specialInteriors.find(r=>r.roomId===id);
   if(active!==id){
    if(root){scene.remove(root);root.traverse(o=>{if(o.geometry&&o.geometry!==geometry)o.geometry.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}
    root=new THREE.Group();scene.add(root);active=id;
    const groups=new Map();for(const b of world.boxes.filter(b=>(outdoor?(b.recyclingShelter||b.name==='후문 철거부 연속 외벽'||(b.kind==='wall'&&b.bounds[0]>=37.8&&b.bounds[3]<=45.1&&b.bounds[1]>=2.8&&b.bounds[4]<=10.2&&b.bounds[2]<1)):(b.spaceId===id||b.name.includes('Window_'+id)))&&!b.renderInDetails)){const key=b.color.join(',')+'|'+surfaceKind(b);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);}
    for(const list of groups.values()){
     const mesh=new THREE.InstancedMesh(geometry,finishMaterial(list[0]),list.length);
     list.forEach((b,i)=>{const a=b.bounds;matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),new THREE.Quaternion(),new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
    }
    root.add(outdoor?recyclingShelterDetails(c):c.additionalRoom?supportRoomDetails(c):nurseRoomDetails(c));
   }
   const [x,X,y,Y,z]=c.room.bounds,pt=(a,b)=>({x:x+(X-x)*a,y:y+(Y-y)*b,z:z+1.68});
   const eye=outdoor?(side==='front'?{x:23,y:16,z:7}:{x:34.6,y:10.7,z:1.8}):side==='front'?pt(.88,.13):pt(.16,.83),target=outdoor?{x:35.5,y:6.6,z:.65}:side==='front'?pt(.25,.70):pt(.75,.25);
   camera.position.set(eye.x,eye.z,-eye.y);camera.lookAt(target.x,target.z-.15,-target.y);renderer.render(scene,camera);
   return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
  };
 });
 const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-extra-rooms-')),ids=process.env.PREVIEW_ROOMS?process.env.PREVIEW_ROOMS.split(','):[...Object.keys(EXTRA_PHOTO_ROOMS),'1F_NURSE','recycling'],renders=[];
 for(const id of ids)for(const side of ['front','back']){
  const stats=await page.evaluate(({id,side})=>window.showRoom(id,side),{id,side});assert(stats.triangles>100);await page.screenshot({path:path.join(output,id+'-'+side+'.png')});renders.push({id,side,...stats});
 }
 console.log(JSON.stringify({stage:'rendered',views:renders.length,output,maxCalls:Math.max(...renders.map(r=>r.calls))}));
 if(process.env.PREVIEW_ONLY){assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,views:renders.length,errors,output}));}else{
 await page.setViewportSize({width:390,height:750});await page.goto(base+'/?test=1');await page.waitForFunction(()=>window.schoolTour?.getState().ready,null,{timeout:180000});
 await page.locator('#시작').click();await page.locator('#캐릭터확인').click();
 for(const id of ids.filter(id=>id!=='recycling')){
  await page.evaluate(()=>document.getElementById('메뉴').click());await page.locator('#방선택').selectOption(id);await page.evaluate(()=>document.getElementById('방이동').click());
  await page.waitForFunction(()=>schoolTour.getState().mode==='walk',null,{timeout:15000});const state=await page.evaluate(()=>schoolTour.getState());assert.equal(state.position.z,(parseInt(id)-1)*3.4);
 }
 await page.setViewportSize({width:390,height:750});await page.screenshot({path:path.join(output,'game-mobile.png')});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,webglViews:renders.length,gameTeleports:ids,errors,output}));
 }
}finally{await browser.close();}
