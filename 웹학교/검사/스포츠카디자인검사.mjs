import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_BROWSER,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1000,height:650}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8080')+'/healthz');
 await page.evaluate(async()=>{
  const THREE=await import('/웹학교/외부도구/three.module.js'),{parkedCarDetails}=await import('/웹학교/자동차표현.mjs');
  document.body.replaceChildren();document.body.style.margin='0';
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,650);renderer.toneMapping=THREE.ACESFilmicToneMapping;document.body.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b8ced8');scene.add(new THREE.HemisphereLight(0xe9f7ff,0x63645c,2));
  const sun=new THREE.DirectionalLight(0xfff4db,3);sun.position.set(-5,8,-4);scene.add(sun);
  const cars=parkedCarDetails();scene.add(cars);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:'#727d83',roughness:.9}));ground.rotation.x=-Math.PI/2;ground.position.y=-.025;scene.add(ground);
  const camera=new THREE.PerspectiveCamera(40,1000/650,.05,100);
  window.previewCar=(id,back)=>{
   for(const car of cars.children){car.visible=car.name===id;if(car.visible){car.position.set(0,0,0);car.rotation.set(0,0,0);}}
   camera.position.set(back?-5:5,back?2.7:2.5,back?6:-6);camera.lookAt(0,.60,0);renderer.render(scene,camera);
   return {cars:cars.children.length,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
  };
 });
 const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-sports-design-'));
 for(const id of ['field-lamborghini','rear-lamborghini'])for(const back of [false,true]){
  const stats=await page.evaluate(({id,back})=>previewCar(id,back),{id,back});assert.equal(stats.cars,11);assert(stats.triangles>1000);
  await page.screenshot({path:path.join(output,id+(back?'-rear':'-front')+'.png')});
 }
 assert.deepEqual(errors,[]);console.log({ok:true,views:4,errors,output});
}finally{await browser.close();}
