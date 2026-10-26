async page => {
 await page.setViewportSize({width:1400,height:900});await page.goto('http://127.0.0.1:8080/healthz');
 const info=await page.evaluate(async()=>{
  const T=await import('/웹학교/외부도구/three.module.js'),{GLTFLoader}=await import('/웹학교/외부도구/GLTFLoader.js');
  const {normalizePrincipalModel}=await import('/웹학교/교장실캐릭터.mjs');
  document.body.replaceChildren();document.body.style.margin='0';
  const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(1400,900);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1;
  document.body.append(r.domElement);const scene=new T.Scene();scene.background=new T.Color('#d2d9df');scene.add(new T.HemisphereLight(0xffffff,0x9b9891,2));
  const light=new T.DirectionalLight(0xfff5ec,2);light.position.set(-3,5,5);scene.add(light);
  const camera=new T.PerspectiveCamera(34,1400/900,.01,40),models=[];
  for(const [id,file] of [['6-6 OLD','검토-20261025/previous-6-6.glb'],['6-6 NEW','검토-20261025/teacher-6-6.glb'],['6-7 OLD','검토-20261025/previous-6-7.glb'],['6-7 NEW','검토-20261025/teacher-6-7.glb']]){
   const asset=await new GLTFLoader().loadAsync('/웹학교/캐릭터모델/'+file),model=normalizePrincipalModel(asset.scene,1.82),root=new T.Group();root.add(model);root.position.x=(models.length-1.5)*1.05;scene.add(root);models.push({id,root,model});
   const label=document.createElement('span');label.textContent=id;Object.assign(label.style,{position:'absolute',top:'820px',left:(150+models.length*270-270)+'px',font:'24px sans-serif'});document.body.append(label);
  }
  window.releaseView=(angle=0,zoom=false)=>{for(const m of models)m.root.rotation.y=angle;camera.position.set(0,zoom?1.6:2.1,zoom?4.8:6.5);camera.lookAt(0,zoom?1.48:.95,0);r.render(scene,camera);};
  window.releaseProbe={models,T,r,scene,camera};window.releaseView();return models.map(m=>({id:m.id,box:new T.Box3().setFromObject(m.model)}));
 });
 await page.screenshot({path:'output/release-front.png'});await page.evaluate(()=>releaseView(Math.PI));await page.screenshot({path:'output/release-back.png'});await page.evaluate(()=>releaseView(Math.PI/2));await page.screenshot({path:'output/release-side.png'});return info;
}
