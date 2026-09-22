import * as THREE from './외부도구/three.module.js';
import {GLTFLoader} from './외부도구/GLTFLoader.js';
import {createPrincipalWalkRig} from './교장보행리그.mjs';
import {createPrincipalWalk} from './교장선생님산책.mjs';

// World coordinates use x/y for the floor and z for height.
// The west-side display leaves the doorway and the furniture aisle open.
export const OFFICE_CHARACTERS=Object.freeze([
  {id:'cute',label:'교장선생님',position:{x:31.15,y:-3.35,z:3.4},height:1.83,url:new URL('./캐릭터모델/교장선생님-귀여운.glb',import.meta.url)}
]);

export function normalizePrincipalModel(asset,height){
  asset.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(asset),size=bounds.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)throw new Error('캐릭터 높이를 계산할 수 없습니다.');
  const model=new THREE.Group(),scale=height/size.y;
  model.add(asset);model.scale.setScalar(scale);
  model.position.set(-(bounds.min.x+bounds.max.x)*.5*scale,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*.5*scale);
  asset.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  return model;
}

function nameplate(label){
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=96;
  const context=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true,depthWrite:false}));
  sprite.position.y=2.10;sprite.scale.set(1.44,.216,1);
  function setText(text){
    context.clearRect(0,0,640,96);context.fillStyle='#173e38e8';context.fillRect(0,0,640,96);
    context.fillStyle='#ffffff';context.font='500 29px "Malgun Gothic",sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(text,320,48,612);texture.needsUpdate=true;
  }
  setText(label+' · 준비 중');return {sprite,setText};
}

export function createOfficePrincipalModels(world){
  const loader=new GLTFLoader();let loading=null;
  const characters=OFFICE_CHARACTERS.map(config=>{
    const root=new THREE.Group();root.name=config.label;root.position.set(config.position.x,config.position.z,-config.position.y);root.rotation.y=Math.PI/2;root.userData.greetingHeight=2.48;
    const label=nameplate(config.label);root.add(label.sprite);let status='not-requested',error=null,rig=null;
    const walk=createPrincipalWalk(world,config.id);
    return {root,
      getState:()=>({...walk.getState(),id:config.id,height:config.height,modelStatus:status,faceTexture:status,visible:root.visible,animation:'procedural-skinned-walk',error}),
      update(dt,player,options){
        const state=walk.update(dt,player,{...options,paused:options.paused||status!=='ready'});
        root.position.set(state.position.x,state.position.z,-state.position.y);root.rotation.y=state.heading;
        rig?.update(options.paused?0:dt,state);return state;
      },
      async load(attempt=0){
        if(status==='ready')return;
        status='loading';error=null;label.setText(config.label+' · 불러오는 중');
        try{
          const response=await fetch(config.url.href,{signal:AbortSignal.timeout(30000)});
          if(!response.ok)throw new Error('모델 다운로드 HTTP '+response.status);
          const gltf=await loader.parseAsync(await response.arrayBuffer(),new URL('.',config.url).href);
          rig=createPrincipalWalkRig(normalizePrincipalModel(gltf.scene,config.height));
          root.add(rig.root);status='ready';label.setText(config.label);
        }catch(reason){
          status='error';error=String(reason?.message??reason);label.setText(config.label+(attempt<2?' · 다시 불러오는 중':' · 재입장하면 다시 불러옵니다'));
          console.warn(config.label+' 모델 로드 실패',reason);
        }
      }
    };
  });
  return {characters,load(){
    if(!loading)loading=(async()=>{
      for(let attempt=0;attempt<3;attempt++){
        if(attempt)await new Promise(resolve=>setTimeout(resolve,2000));
        for(const character of characters)await character.load(attempt);
        if(characters.every(character=>character.getState().modelStatus==='ready'))break;
      }
    })().finally(()=>{loading=null;});
    return loading;
  }};
}
