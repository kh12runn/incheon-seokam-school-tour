async page=>{
 const result=await page.evaluate(async()=>{
  const {T,scene,r,camera,models}=suitProbe,{GLTFLoader}=await import('/웹학교/외부도구/GLTFLoader.js'),{restoreTeacher67Suit}=await import('/웹학교/검사/육칠정장복구.mjs?rev=2');
  const loader=new GLTFLoader(),face=(await loader.loadAsync('/웹학교/캐릭터모델/검토-20261025/teacher-6-7.glb')).scene,body=(await loader.loadAsync('/웹학교/캐릭터모델/교장선생님-귀여운.glb')).scene;
  const combined=restoreTeacher67Suit(face,body);scene.remove(models[0].root);const root=new T.Group();root.add(combined);root.position.x=-.65;scene.add(root);models[0]={root,model:combined};window.suit67=combined;suitView();return {edit:combined.userData.edit,vertices:combined.children.map(m=>m.geometry.attributes.position.count)};
 });
 for(const [name,angle]of [['front',0],['back',Math.PI],['side',Math.PI/2]]){await page.evaluate(a=>suitView(a),angle);await page.screenshot({path:'output/suit67-'+name+'.png'});}
 const download=page.waitForEvent('download');
 const bytes=await page.evaluate(async()=>{const {editedGLB}=await import('/웹학교/검사/부분모델저장.mjs?multi=1'),b=await editedGLB(suit67,['/웹학교/캐릭터모델/검토-20261025/teacher-6-7.glb','/웹학교/캐릭터모델/교장선생님-귀여운.glb']);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([b],{type:'model/gltf-binary'}));a.download='teacher67-suit.glb';a.click();return b.byteLength;});
 await(await download).saveAs('C:/Users/user/Downloads/49_Visitor/석암초등학교/웹학교/캐릭터모델/검토-20261025/teacher67-suit.glb');return {...result,bytes};
}
