import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.QUIZ_BROWSER?{executablePath:process.env.QUIZ_BROWSER}:{}),args:['--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1100,height:760},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.SCHOOL_TEST_URL??'http://127.0.0.1:8086')+'/healthz');
  const details=await page.evaluate(async()=>{
    const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{finishMaterial,surfaceKind}=await import('/웹학교/현실재질.mjs'),{createHallMirror,createGateTerrain}=await import('/웹학교/다목적실표현.mjs');
    const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json());
    document.body.style.margin='0';document.body.replaceChildren();const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,760);document.body.append(renderer.domElement);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#afbbc2');scene.add(new THREE.HemisphereLight(0xfff8e7,0x8c9a8c,2.2));
    const lamp=new THREE.PointLight(0xfff4df,12,20);scene.add(lamp);
    const boxes=world.boxes.filter(b=>b.shape!=='terrain'&&(b.basement||b.name.startsWith('MAIN_STAIR_A')||b.bounds[0]<40&&b.bounds[3]>-24&&b.bounds[1]<0&&b.bounds[4]>-44&&b.bounds[2]<3.5));
    scene.add(createGateTerrain(world.boxes));const mirror=createHallMirror();scene.add(mirror);mirror.visible=true;
    let reflections=0;const reflect=mirror.onBeforeRender;mirror.onBeforeRender=function(...args){reflections++;return reflect.apply(this,args);};
    const groups=new Map();for(const b of boxes){const key=b.color.join(',')+'|'+surfaceKind(b);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);}
    const geometry=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4();
    for(const items of groups.values()){
      const mesh=new THREE.InstancedMesh(geometry,finishMaterial(items[0]),items.length);
      items.forEach((b,i)=>{const a=b.bounds;matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),new THREE.Quaternion(),new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);
    }
    const camera=new THREE.PerspectiveCamera(76,1100/760,.03,60),toilet=world.data.rooms.find(r=>r.floor==='0F'&&r.sex==='male');
    const views={hall:[[-6,-1.8,-1.5],[-16,-1.85,-1.5]],mirror:[[-7,-1.8,5],[-12,-1.8,-9.8]],outside:[[-11,-1.75,18],[-11,-1.7,0]],uphill:[[-11,-1.75,13.5],[34,.6,11]],foyer:[[1.25,-1.8,-1.5],[-5,-1.8,-2.1]],stairs:[[3.75,1.6,-4.1],[3.75,-1.8,-8.6]],toilet:[[toilet.entry.x,-1.8,-(toilet.entry.y+.35)],[toilet.interiorRoute[1].x,-1.8,-toilet.interiorRoute[1].y]]};
    window.showBasement=name=>{const [from,to]=views[name];camera.position.set(...from);camera.lookAt(...to);lamp.position.copy(camera.position);lamp.position.y+=.65;renderer.render(scene,camera);return {drawCalls:renderer.info.render.calls,reflections};};
    return {boxCount:boxes.length,basementRooms:world.data.rooms.filter(r=>r.floor==='0F').map(r=>r.name)};
  });
  const output=await fs.mkdtemp(path.join(os.tmpdir(),'school-basement-preview-'));let drawCalls;
  for(const name of ['hall','mirror','outside','uphill','foyer','stairs','toilet']){drawCalls=await page.evaluate(name=>window.showBasement(name),name);await page.screenshot({path:path.join(output,name+'.png')});}
  assert.equal(details.basementRooms.length,5);assert(details.boxCount>100);assert(drawCalls.reflections>0,'Real reflection pass ran');assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,actualWebGL:true,...details,drawCalls,output}));
}finally{await browser.close();}
