import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/healthz');
 await page.evaluate(async()=>{
  const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{finishMaterial,surfaceKind,softEnvironment}=await import('/웹학교/현실재질.mjs'),{hallPhotoDetails,createHallMirror}=await import('/웹학교/다목적실표현.mjs');
  const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json());
  document.body.replaceChildren();document.body.style.margin='0';const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,750);document.body.append(renderer.domElement);renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#c6dce5');scene.environment=softEnvironment(renderer);scene.add(new THREE.HemisphereLight(0xfff6e5,0xaebac0,2));const light=new THREE.DirectionalLight(0xfff5e4,2);light.position.set(-11,20,0);scene.add(light);
  const grouped=new Map();for(const b of world.boxes.filter(b=>b.spaceId==='B1_MAIN_HALL')){const key=b.color.join(',')+'|'+surfaceKind(b)+'|'+b.shape;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(b);}
  const matrix=new THREE.Matrix4();
  for(const list of grouped.values()){
   const geometry=list[0].shape==='sphere'?new THREE.SphereGeometry(.5,12,8):new THREE.BoxGeometry(1,1,1),mesh=new THREE.InstancedMesh(geometry,finishMaterial(list[0]),list.length);
   list.forEach((b,i)=>{const a=b.bounds;matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),new THREE.Quaternion(),new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));mesh.setMatrixAt(i,matrix);});mesh.computeBoundingSphere();scene.add(mesh);
  }
  scene.add(hallPhotoDetails(world.hallPhotoFinish));const mirror=createHallMirror(3.4,true);mirror.visible=true;scene.add(mirror);
  const camera=new THREE.PerspectiveCamera(85,1100/750,.025,100);
  window.hallPreview=(eye,target)=>{camera.position.set(eye[0],eye[2],-eye[1]);camera.lookAt(target[0],target[2],-target[1]);renderer.render(scene,camera);return renderer.info.render.triangles;};
 });
 const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-hall-'));
 const views=[{name:'entry',eye:[-5.7,1.5,-1.78],target:[-14,3,-1.8]},{name:'mirror',eye:[-14,-3,-1.78],target:[-8,8,-1.8]},{name:'storage',eye:[-10,-4.2,-1.78],target:[-5.4,-5.0,-2.0]},{name:'inside-storage',eye:[-7,-4.4,-1.78],target:[-5.4,-5.8,-2.2]}];
 for(const v of views){assert(await page.evaluate(v=>hallPreview(v.eye,v.target),v)>100);await page.screenshot({path:path.join(output,v.name+'.png')});}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,views:views.length,errors,output}));
}finally{await browser.close();}
