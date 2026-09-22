import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.QUIZ_BROWSER?{executablePath:process.env.QUIZ_BROWSER}:{}),args:['--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:800,height:640},deviceScaleFactor:1});page.setDefaultTimeout(60000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.QUIZ_BASE_URL??'http://127.0.0.1:8085')+'/healthz');
  console.log('Loading isolated principal render');
  const details=await page.evaluate(async()=>{
    const THREE=await import('/웹학교/외부도구/three.module.js');
    const {GLTFLoader}=await import('/웹학교/외부도구/GLTFLoader.js');
    const {OFFICE_CHARACTERS,normalizePrincipalModel}=await import('/웹학교/교장실캐릭터.mjs');
    const {createPrincipalWalkRig}=await import('/웹학교/교장보행리그.mjs');
    document.body.style.margin='0';const canvas=document.createElement('canvas');document.body.replaceChildren(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setSize(800,640);renderer.setPixelRatio(1);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#dbe5e6');scene.add(new THREE.HemisphereLight(0xffffff,0x829295,2));
    const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(2,5,4);scene.add(light);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(15,15),new THREE.MeshStandardMaterial({color:'#c4ced0'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;scene.add(floor);
    const grid=new THREE.GridHelper(8,32,0x9fa9ab,0xb5bfc1);scene.add(grid);
    const camera=new THREE.PerspectiveCamera(38,800/640,.01,30),rigs=[];
    for(const config of OFFICE_CHARACTERS){
      const gltf=await new GLTFLoader().loadAsync(config.url.href),rig=createPrincipalWalkRig(normalizePrincipalModel(gltf.scene,config.height),{cute:config.id==='cute'});
      const holder=new THREE.Group();holder.position.x=(rigs.length-(OFFICE_CHARACTERS.length-1)/2)*1.2;holder.add(rig.root);scene.add(holder);rigs.push(rig);
    }
    window.renderWalk=(phase,side=false)=>{
      for(const rig of rigs)for(let i=0;i<80;i++)rig.update(.02,{moving:true,speed:.48,phase});
      camera.position.set(side?4:0,1.4,side?1.7:4.6);camera.lookAt(0,.94,0);renderer.render(scene,camera);
    };
    window.renderWalk(Math.PI/2);
    return rigs.map(r=>({vertices:r.vertexCount,bones:r.bones.length}));
  });
  await fs.mkdir('결과물/퀴즈검사',{recursive:true});
  for(const [name,phase,side] of [['보행정면',Math.PI/2,false],['보행측면',Math.PI/2,true],['반대발',Math.PI*1.5,true]]){
    await page.evaluate(([phase,side])=>window.renderWalk(phase,side),[phase,side]);
    await page.screenshot({path:`결과물/퀴즈검사/${name}.png`});
  }
  if(errors.length)throw Error(errors.join(';'));console.log(JSON.stringify({ok:true,actualWebGL:true,details,errors}));
}finally{await browser.close();}
