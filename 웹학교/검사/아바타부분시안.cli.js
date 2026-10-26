async page=>{
 const result=await page.evaluate(async()=>{
  const {models,T,r,scene,camera}=releaseProbe,{suitOnly,straightHairOnly}=await import('/웹학교/검사/아바타부분편집.mjs?rev=9');
  const {GLTFLoader}=await import('/웹학교/외부도구/GLTFLoader.js');const loader=new GLTFLoader();
  const newer66=(await loader.loadAsync('/웹학교/캐릭터모델/검토-20261025/teacher-6-6.glb')).scene,newer67=(await loader.loadAsync('/웹학교/캐릭터모델/검토-20261025/teacher-6-7.glb')).scene,older67=(await loader.loadAsync('/웹학교/캐릭터모델/검토-20261025/previous-6-7.glb')).scene;
  if(window.editedProbe){scene.remove(editedProbe.hair,editedProbe.suit);}const hair=straightHairOnly(newer66),suit=suitOnly(newer67,older67);for(const m of models)scene.remove(m.root);scene.add(hair,suit);hair.position.x=-.6;suit.position.x=.6;
  document.querySelectorAll('span').forEach(e=>e.remove());window.editedProbe={hair,suit};
  window.editedView=(a=0)=>{hair.rotation.y=a;suit.rotation.y=a;camera.position.set(0,1.7,4.4);camera.lookAt(0,.95,0);r.render(scene,camera);};editedView();return {hair:hair.userData,suit:suit.userData};
 });
 for(const [name,angle] of [['front',0],['back',Math.PI],['side',Math.PI/2]]){await page.evaluate(a=>editedView(a),angle);await page.screenshot({path:'output/edited-'+name+'.png'});}return result;
}
