import * as THREE from './외부도구/three.module.js';
const yieldWork=()=>new Promise(resolve=>setTimeout(resolve,0));
// Three r180 compileAsync waits for currentProgram only. A shared material may
// have regular, instanced, double-sided and skinned programs. Finish ALL of them
// and their first-use uniform reflection before exposing a newly loaded room.
export function createRenderPreparation(renderer,camera,scene){
  const depths=new WeakMap(),shadowScene=new THREE.Scene(),target=new THREE.WebGLRenderTarget(1,1);
  const warmed=new WeakSet();
  let queue=Promise.resolve();
  function depthMaterial(material){
    if(depths.has(material))return depths.get(material);
    const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
    depth.side=material.shadowSide??[THREE.BackSide,THREE.FrontSide,THREE.DoubleSide][material.side];
    for(const key of ['map','alphaMap','alphaTest','displacementMap','displacementScale','displacementBias','wireframe','clippingPlanes','clipIntersection','clipShadows'])depth[key]=material[key];
    if(material.alphaToCoverage)depth.alphaTest=.5;
    depths.set(material,depth);material.addEventListener('dispose',()=>depth.dispose());return depth;
  }
  async function finishPrograms(root){
    if(!renderer.properties)return;
    const programs=new Set();
    root.traverse(o=>{for(const material of [].concat(o.material??[]))for(const program of renderer.properties.get(material).programs?.values()??[])if(!warmed.has(program))programs.add(program);});
    for(const program of programs){
      while(!program.isReady())await new Promise(resolve=>setTimeout(resolve,10));
      await yieldWork();program.getUniforms();program.getAttributes();warmed.add(program);
    }
  }
  async function prepare(root,{textures=true}={}){
    await yieldWork();await renderer.compileAsync(root,camera,scene);
    await finishPrograms(root);
    if(renderer.shadowMap.enabled){
      const group=new THREE.Group(),seen=new Set();
      // Shadow draws inherit the main render state's light/shadow counts even
      // though they use an empty scene for fog/environment. Match those keys.
      shadowScene.clear();scene.traverseVisible(o=>{if(o.isLight)shadowScene.add(o.clone(false));});
      root.traverse(object=>{
        if(!object.isMesh||!object.castShadow)return;
        for(const material of [].concat(object.material)){
          const key=[material.uuid,object.isSkinnedMesh,object.isInstancedMesh,!!object.instanceColor,Object.keys(object.geometry.morphAttributes).join(',')].join('/');
          if(seen.has(key))continue;seen.add(key);
          const clone=object.clone(false);clone.material=object.customDepthMaterial??depthMaterial(material);clone.visible=true;group.add(clone);
        }
      });
      await yieldWork();const previous=renderer.getRenderTarget();let pending;
      try{renderer.setRenderTarget(target);pending=renderer.compileAsync(group,camera,shadowScene);}finally{renderer.setRenderTarget(previous);}
      await pending;
      await finishPrograms(group);
    }
    if(textures){
      const maps=new Set();root.traverse(o=>{for(const m of [].concat(o.material??[]))for(const value of Object.values(m))if(value?.isTexture)maps.add(value);});
      for(const map of maps){await yieldWork();renderer.initTexture(map);}
    }
  }
  return (root,options)=>{const work=queue.catch(()=>{}).then(()=>prepare(root,options));queue=work;return work;};
}
