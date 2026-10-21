async page => {
 await page.setViewportSize({width:1100,height:850});await page.goto('http://127.0.0.1:8080/healthz');
 await page.evaluate(async()=>{
  const T=await import('/웹학교/외부도구/three.module.js'),{GLTFLoader}=await import('/웹학교/외부도구/GLTFLoader.js');
  const {normalizePrincipalModel}=await import('/웹학교/교장실캐릭터.mjs'),{finishTeacherMaterialsAsync}=await import('/웹학교/선생님재질.mjs');
  document.body.replaceChildren();document.body.style.margin='0';const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,850);renderer.toneMapping=T.ACESFilmicToneMapping;document.body.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#c2cbd2');scene.add(new T.HemisphereLight(0xffffff,0x777777,2));const light=new T.DirectionalLight(0xffffff,2);light.position.set(-3,5,6);scene.add(light);
  const model=normalizePrincipalModel((await new GLTFLoader().loadAsync('/웹학교/캐릭터모델/과학선생님.glb')).scene,1.68);scene.add(model);await finishTeacherMaterialsAsync(model);
  const camera=new T.PerspectiveCamera(30,1100/850,.01,20);window.scienceProbe={T,model,scene,renderer,camera};
  window.scienceView=(side=false,close=false)=>{camera.position.set(side?3:0,close?1.48:.95,side?0:close?.8:3.6);camera.lookAt(0,close?1.48:.85,0);renderer.render(scene,camera);};window.scienceView();
 });
 for(const [name,side,close] of [['front',false,false],['side',true,false],['face',false,true]]){await page.evaluate(a=>window.scienceView(...a),[side,close]);await page.screenshot({path:'output/science-before-'+name+'.png'});}
 await page.evaluate(async()=>{const {correctScienceRestPose}=await import('/웹학교/과학교사자세.mjs');await correctScienceRestPose(scienceProbe.model);});
 for(const [name,side,close] of [['front',false,false],['side',true,false],['face',false,true]]){await page.evaluate(a=>window.scienceView(...a),[side,close]);await page.screenshot({path:'output/science-after-'+name+'.png'});}
 return await page.evaluate(()=>{const {T,model}=window.scienceProbe;const bands=[];model.updateMatrixWorld(true);for(let y=0;y<1.7;y+=.1){const b=new T.Box3(),v=new T.Vector3();let n=0;model.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(v.y>=y&&v.y<y+.1){b.expandByPoint(v);n++;}}}});bands.push({y:+y.toFixed(2),n,min:b.min.toArray(),max:b.max.toArray()});}return bands;});
}
