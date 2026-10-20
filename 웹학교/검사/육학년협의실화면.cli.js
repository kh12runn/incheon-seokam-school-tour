async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1100,height:760});
 await page.goto('http://127.0.0.1:8080/healthz');
 const result=await page.evaluate(async()=>{
  const THREE=await import('/웹학교/외부도구/three.module.js');
  const {buildWorld}=await import('/웹학교/이동물리.mjs');
  const {additionalRoomDetails}=await import('/웹학교/추가공간사진표현.mjs');
  const {finishMaterial,softEnvironment}=await import('/웹학교/현실재질.mjs');
  const w=buildWorld(await(await fetch('/웹학교/학교구조.json')).json()),id='4F_GRADE6_RESEARCH',c=w.specialInteriors.find(q=>q.roomId===id);
  document.body.replaceChildren();document.body.style.margin='0';
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,760);renderer.toneMapping=THREE.ACESFilmicToneMapping;document.body.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#c9dfef');scene.environment=softEnvironment(renderer);scene.add(new THREE.HemisphereLight(0xfff6e5,0xadb5a5,2));
  const light=new THREE.DirectionalLight(0xfff4de,1.7);light.position.set(20,80,50);scene.add(light);
  const geometry=new THREE.BoxGeometry(1,1,1);
  for(const b of w.boxes.filter(b=>(b.spaceId===id||b.name.includes('Window_'+id))&&!b.renderInDetails)){
   const a=b.bounds,mesh=new THREE.Mesh(geometry,finishMaterial(b));
   mesh.position.set((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2);mesh.scale.set(a[3]-a[0],a[5]-a[2],a[4]-a[1]);scene.add(mesh);
  }
  scene.add(additionalRoomDetails(c));
  const camera=new THREE.PerspectiveCamera(83,1100/760,.025,200);
  window.researchView=side=>{
   const eye=side==='entry'?[46.1,3.65,11.9]:side==='left'?[46.1,7.8,11.9]:[48.6,8.7,11.9];
   const aim=side==='entry'?[47.2,7,11.5]:side==='left'?[44.8,5.8,11.3]:[46.5,5.0,11.5];
   camera.position.set(eye[0],eye[2],-eye[1]);camera.lookAt(aim[0],aim[2],-aim[1]);renderer.render(scene,camera);
  };
  return {room:c.room.name,entry:c.entry,reviewedAt:c.reference.reviewedAt};
 });
 for(const side of ['entry','left','back']){
  await page.evaluate(side=>window.researchView(side),side);
  await page.screenshot({path:'output/research6-oct19-'+side+'.png'});
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
 return {ok:true,...result,views:3};
}
