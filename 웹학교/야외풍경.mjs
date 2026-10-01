import * as THREE from './외부도구/three.module.js';
import {EXTRA_TREES} from './운동장환경.mjs';

// A seamless, locally generated sky bitmap. No school images leave the device.
export function clearDaySky(){
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=768;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(canvas.width,canvas.height),grid=new Float32Array(32768);
  let seed=91843;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<grid.length;i++)grid[i]=random();
  const at=(x,y,z)=>grid[(x&31)+((y&31)<<5)+((z&31)<<10)];
  const mix=(a,b,t)=>a+(b-a)*t;
  function noise(x,y,z){
    const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z);x-=X;y-=Y;z-=Z;x=x*x*(3-2*x);y=y*y*(3-2*y);z=z*z*(3-2*z);
    return mix(mix(mix(at(X,Y,Z),at(X+1,Y,Z),x),mix(at(X,Y+1,Z),at(X+1,Y+1,Z),x),y),mix(mix(at(X,Y,Z+1),at(X+1,Y,Z+1),x),mix(at(X,Y+1,Z+1),at(X+1,Y+1,Z+1),x),y),z);
  }
  function fbm(x,y,z){let n=0,a=.57;for(let i=0;i<5;i++){n+=a*noise(x,y,z);x=x*2.03+3.1;y=y*2.03+5.7;z=z*2.03+1.4;a*=.48;}return n;}
  for(let y=0;y<canvas.height;y++){
    const theta=y/(canvas.height-1)*Math.PI,up=Math.cos(theta),ring=Math.sin(theta),alt=Math.pow(Math.max(0,up),.48);
    for(let x=0;x<canvas.width;x++){
      const angle=x/canvas.width*Math.PI*2,dx=Math.cos(angle)*ring,dz=Math.sin(angle)*ring;
      const base=[mix(205,65,alt),mix(226,146,alt),mix(237,215,alt)];
      if(up>.015){
        const scale=5.6,cloud=fbm(dx*scale+7,up*scale*.85+11,dz*scale+3),mask=THREE.MathUtils.smoothstep(cloud,.49,.66)*THREE.MathUtils.smoothstep(up,.015,.15);
        const light=THREE.MathUtils.clamp((cloud-fbm(dx*scale+7.09,up*scale*.85+11.14,dz*scale+2.9))*.8+.96,.88,1);
        for(let c=0;c<3;c++)base[c]=mix(base[c],[253,254,253][c]*light,mask);
      }
      const index=(y*canvas.width+x)*4;image.data.set([...base,255],index);
    }
  }
  ctx.putImageData(image,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.mapping=THREE.EquirectangularReflectionMapping;
  return texture;
}

export function playgroundTrees(){
  const group=new THREE.Group();group.name='운동장 추가 수목';
  const bark=new THREE.MeshStandardMaterial({color:'#655c43',roughness:.95}),leafMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.93});
  const branches=[],leaves=[];let seed=8401;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(const [i,t] of EXTRA_TREES.entries()){
    const origin=new THREE.Vector3(t.x,-.6,-t.y),h=(3.5+random()*.8)*t.scale;
    branches.push({a:origin,b:origin.clone().add(new THREE.Vector3(.12,h,0)),r:.16*t.scale});
    for(let j=0;j<9;j++){
      const angle=j*2.4+i,spread=(.7+random()*.7)*t.scale,start=origin.clone().add(new THREE.Vector3(.05,h*(.48+j*.025),0));
      const tip=origin.clone().add(new THREE.Vector3(Math.cos(angle)*spread,h*(.73+random()*.29),Math.sin(angle)*spread));
      branches.push({a:start,b:tip,r:.046*t.scale});
      for(let k=0;k<10;k++){
        const p=tip.clone().add(new THREE.Vector3((random()-.5)*1.35,(random()-.5)*1.15,(random()-.5)*1.35).multiplyScalar(t.scale));
        leaves.push({p,s:new THREE.Vector3(.36+random()*.30,.22+random()*.3,.3+random()*.35).multiplyScalar(t.scale),color:new THREE.Color().setHSL(.24+random()*.07,.26+random()*.20,.22+random()*.16).convertSRGBToLinear()});
      }
    }
  }
  const branchMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.45,1,1,7),bark,branches.length),leafMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),leafMaterial,leaves.length);
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
  branches.forEach((b,i)=>{const d=b.b.clone().sub(b.a);matrix.compose(b.a.clone().add(b.b).multiplyScalar(.5),q.setFromUnitVectors(up,d.clone().normalize()),new THREE.Vector3(b.r,d.length(),b.r));branchMesh.setMatrixAt(i,matrix);});
  leaves.forEach((l,i)=>{q.setFromEuler(new THREE.Euler(random()*3,random()*6,random()*3));matrix.compose(l.p,q,l.s);leafMesh.setMatrixAt(i,matrix);leafMesh.setColorAt(i,l.color);});
  for(const mesh of [branchMesh,leafMesh]){mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);}
  group.userData.treeCount=EXTRA_TREES.length;return group;
}
