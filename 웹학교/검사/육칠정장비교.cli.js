async page=>{
 await page.setViewportSize({width:1400,height:900});await page.goto('http://127.0.0.1:8080/healthz');
 return await page.evaluate(async()=>{
  const T=await import('/웹학교/외부도구/three.module.js'),{GLTFLoader}=await import('/웹학교/외부도구/GLTFLoader.js'),{normalizePrincipalModel}=await import('/웹학교/교장실캐릭터.mjs');
  document.body.replaceChildren();document.body.style.margin='0';
  const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(1400,900);r.toneMapping=T.ACESFilmicToneMapping;document.body.append(r.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#d2d9df');scene.add(new T.HemisphereLight(0xffffff,0x9b9891,2));const light=new T.DirectionalLight(0xffffff,2);light.position.set(-3,5,5);scene.add(light);
  const camera=new T.PerspectiveCamera(34,1400/900,.01,40),loader=new GLTFLoader(),models=[];
  for(const file of ['6-7-담임선생님.glb','교장선생님-귀여운.glb']){const asset=(await loader.loadAsync('/웹학교/캐릭터모델/'+file)).scene,model=normalizePrincipalModel(asset,1.82),root=new T.Group();root.add(model);root.position.x=models.length? .65:-.65;scene.add(root);models.push({file,root,model});}
  window.suitProbe={T,r,scene,camera,models,light};window.suitView=(angle=0)=>{for(const m of suitProbe.models)m.root.rotation.y=angle;camera.position.set(0,1.6,4);camera.lookAt(0,1.0,0);r.render(scene,camera);};suitView();return models.map(m=>({file:m.file,box:new T.Box3().setFromObject(m.model)}));
 });
}
