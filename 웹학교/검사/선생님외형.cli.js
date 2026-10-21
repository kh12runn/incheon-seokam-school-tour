async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:8080/healthz');
 const result=await page.evaluate(async()=>{
  const T=await import('/웹학교/외부도구/three.module.js'),{GLTFLoader}=await import('/웹학교/외부도구/GLTFLoader.js');
  const {CLASS_TEACHERS}=await import('/웹학교/담임선생님.mjs'),{normalizePrincipalModel}=await import('/웹학교/교장실캐릭터.mjs');
  const {createPrincipalWalkRig}=await import('/웹학교/교장보행리그.mjs'),{finishTeacherMaterials}=await import('/웹학교/선생님재질.mjs'),{softEnvironment}=await import('/웹학교/현실재질.mjs');
  document.body.replaceChildren();document.body.style.margin='0';const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(1280,800);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;document.body.append(r.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#b8c6d0');scene.environment=softEnvironment(r);scene.add(new T.HemisphereLight(0xe4edfa,0xb4ac91,1.35));const light=new T.DirectionalLight(0xfff4dd,2.7);light.position.set(-3,9,6);scene.add(light);
  const c=new T.PerspectiveCamera(34,1280/800,.01,40),rigs=[],checks=[];
  for(const config of CLASS_TEACHERS){
   const asset=await new GLTFLoader().loadAsync(config.url.href),model=normalizePrincipalModel(asset.scene,config.height);let originalVertices=0;model.traverse(o=>{if(o.isMesh)originalVertices+=o.geometry.attributes.position.count;});
   finishTeacherMaterials(model);const rig=createPrincipalWalkRig(model,{height:config.height,receiveShadow:false});rig.root.position.x=(rigs.length-3.5)*1.05;scene.add(rig.root);rigs.push(rig);
   let valid=true;rig.root.traverse(o=>{if(o.isMesh){const w=o.geometry.attributes.skinWeight;for(let i=0;i<w.count;i++)if(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)>.0001)valid=false;for(const m of [].concat(o.material))if(!m.isMeshPhysicalMaterial||m.specularIntensity!==0||m.roughness!==1||m.metalness!==0||m.normalMap||m.envMap||m.flatShading||m.vertexColors)valid=false;}});
   checks.push({id:config.id,originalVertices,rigVertices:rig.vertexCount,weightsAndMaterials:valid});
  }
  window.teacherProbe={scene,rigs,r,c,T};
  window.teacherView=(phase,side=false,back=false)=>{for(const rig of rigs)for(let n=0;n<40;n++)rig.update(.05,{moving:phase!==null,speed:.48,phase:phase??0});for(const rig of rigs)rig.root.rotation.y=back?Math.PI:side?Math.PI/2:0;c.position.set(0,2.4,12.3);c.lookAt(0,.95,0);light.position.x=side?5:-3;r.render(scene,c);};
  window.teacherView(null);return checks;
 });
 for(const [name,phase,side,back] of [['idle',null,false,false],['walk',1.57,false,false],['side',4.71,true,false],['back',null,false,true]]){await page.evaluate(args=>window.teacherView(...args),[phase,side,back]);await page.screenshot({path:'output/teachers-'+name+'.png'});}
 if(errors.length||result.some(r=>!r.weightsAndMaterials||r.originalVertices!==r.rigVertices))throw new Error(JSON.stringify({errors,result}));return {ok:true,result,errors};
}
