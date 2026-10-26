async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const result=await page.evaluate(async()=>{
  const {T,scene,models}=suitProbe,{GLTFLoader}=await import('/웹학교/외부도구/GLTFLoader.js'),{normalizePrincipalModel}=await import('/웹학교/교장실캐릭터.mjs'),{createPrincipalWalkRigAsync}=await import('/웹학교/교장보행리그.mjs?cuff=2');
  const asset=(await new GLTFLoader().loadAsync('/웹학교/캐릭터모델/6-7-담임선생님.glb?continuous-suit=1')).scene;
  const rig=await createPrincipalWalkRigAsync(normalizePrincipalModel(asset,1.82),{height:1.82,continuousSleeves:true});
  let hands=0;rig.root.traverse(o=>{if(!o.isSkinnedMesh)return;const g=o.geometry,p=g.attributes.position,w=g.attributes.skinWeight;
   for(let i=0;i<p.count;i++){if(!Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)))throw Error('Nonfinite vertex');if(Math.abs(p.getX(i))>.26&&p.getY(i)>.68&&p.getY(i)<.82){hands++;if(w.getX(i)>.001)throw Error('Hand still bound to torso');}}
  });if(hands<100)throw Error('Missing hands');
  scene.remove(models[0].root);const root=new T.Group();root.add(rig.root);root.position.x=-.65;scene.add(root);models[0]={root,model:rig.root};window.suitRig=rig;return {handsChecked:hands,vertices:rig.vertexCount};
 });
 for(const [name,angle,phase]of [['walk-front',0,Math.PI/2],['walk-side',Math.PI/2,Math.PI/2],['walk-back',Math.PI,Math.PI*1.5]]){await page.evaluate(({angle,phase})=>{for(let i=0;i<30;i++)suitRig.update(1/60,{moving:true,speed:.4,phase});suitView(angle);},{angle,phase});await page.screenshot({path:'output/suit67-'+name+'.png'});}
 if(errors.length)throw Error(JSON.stringify(errors));return {...result,errors};
}
