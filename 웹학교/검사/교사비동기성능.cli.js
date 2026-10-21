async page=>{
 await page.goto('http://127.0.0.1:8080/healthz');
 return await page.evaluate(async()=>{
  const {GLTFLoader}=await import('/웹학교/외부도구/GLTFLoader.js');
  const {CLASS_TEACHERS}=await import('/웹학교/담임선생님.mjs');
  const {normalizePrincipalModel}=await import('/웹학교/교장실캐릭터.mjs');
  const {finishTeacherMaterials,finishTeacherMaterialsAsync}=await import('/웹학교/선생님재질.mjs');
  const {createPrincipalWalkRig,createPrincipalWalkRigAsync}=await import('/웹학교/교장보행리그.mjs');
  const config=CLASS_TEACHERS.at(-1),bytes=await (await fetch(config.url)).arrayBuffer(),loader=new GLTFLoader();
  const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  async function signatures(rig){
   const meshes=[];rig.root.traverse(o=>{if(o.isMesh)meshes.push(o);});
   return await Promise.all(meshes.map(async o=>({
    attributes:await Promise.all(['position','normal','skinIndex','skinWeight'].map(k=>hash(o.geometry.attributes[k].array))),
    textures:await Promise.all([].concat(o.material).map(async m=>Promise.all((m.map?.mipmaps??[]).map(async image=>{
     const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
     return {width:image.width,height:image.height,hash:await hash(ctx.getImageData(0,0,image.width,image.height).data)};
    }))))
   })));
  }
  const before=normalizePrincipalModel((await loader.parseAsync(bytes.slice(0),'')).scene,config.height);
  const start=performance.now();finishTeacherMaterials(before);const materialBeforeMs=performance.now()-start;
  const rigBefore=createPrincipalWalkRig(before,{height:config.height,receiveShadow:false});
  const reference=await signatures(rigBefore);
  const model=normalizePrincipalModel((await loader.parseAsync(bytes.slice(0),'')).scene,config.height);
  await new Promise(r=>setTimeout(r,100));const longTasks=[];
  const observer=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>e.duration)));observer.observe({type:'longtask'});
  let last=performance.now(),maxGapMs=0;const timer=setInterval(()=>{const now=performance.now();maxGapMs=Math.max(maxGapMs,now-last);last=now;},16);
  const started=performance.now(),result=await finishTeacherMaterialsAsync(model);
  const materialAfterMs=performance.now()-started;
  const rig=await createPrincipalWalkRigAsync(model,{height:config.height,receiveShadow:false});
  await new Promise(r=>setTimeout(r,100));clearInterval(timer);observer.disconnect();
  const actual=await signatures(rig),exact=JSON.stringify(reference)===JSON.stringify(actual);
  if(!exact)throw Error('Worker changed texture pixels or rig vertices/weights: '+JSON.stringify({reference,actual}));
  if(result.processing!=='worker'||maxGapMs>1000)throw Error('Long main-thread freeze: '+JSON.stringify({result,maxGapMs,longTasks}));
  // A restricted browser must remain playable, not run the old synchronous filter.
  const OriginalWorker=window.Worker;let fallback;
  try{window.Worker=class{constructor(){throw Error('Test blocked worker');}};
   fallback=await finishTeacherMaterialsAsync(model);
  }finally{window.Worker=OriginalWorker;}
  if(fallback.processing!=='original-fallback')throw Error('Worker fallback failed');
  return {ok:true,model:config.id,materialBeforeMs,materialAfterMs,maxGapMs,longTasks,exactPixelsAndRig:exact,vertices:rig.vertexCount,worker:result.processing,fallback:fallback.processing};
 });
}
