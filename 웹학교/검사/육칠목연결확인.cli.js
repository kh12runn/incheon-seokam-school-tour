async page=>{
 for(const [name,angle]of [['front',0],['left',Math.PI/2],['back',Math.PI],['right',-Math.PI/2]]){
  await page.evaluate(a=>{const {models,camera,r,scene}=suitProbe;models[0].root.rotation.y=a;models[1].root.visible=false;camera.position.set(-.65,1.56,1.15);camera.lookAt(-.65,1.48,0);r.render(scene,camera);},angle);
  await page.screenshot({path:'output/6-7-neck-'+name+'.png'});
 }
 return await page.evaluate(()=>suit67.userData);
}
