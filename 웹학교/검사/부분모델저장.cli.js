async page=>{
 const results=[];
 for(const [key,n] of [['hair',6],['suit',7]]){
  const download=page.waitForEvent('download');
  const result=await page.evaluate(async({key,n})=>{const {editedGLB}=await import('/웹학교/검사/부분모델저장.mjs'),b=await editedGLB(editedProbe[key],'/웹학교/캐릭터모델/검토-20261025/teacher-6-'+n+'.glb');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([b],{type:'model/gltf-binary'}));a.download='teacher-6-'+n+'-edited.glb';a.click();return {n,bytes:b.byteLength};},{key,n});
  await (await download).saveAs('C:/Users/user/Downloads/49_Visitor/석암초등학교/웹학교/캐릭터모델/검토-20261025/teacher-6-'+n+'-edited.glb');results.push(result);
 }return results;
}
