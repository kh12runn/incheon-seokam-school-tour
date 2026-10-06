import * as THREE from './외부도구/three.module.js';
import {Reflector} from './외부도구/Reflector.js';
import {HALL_MIRROR} from './지하층배치.mjs';
import {finishMaterial} from './현실재질.mjs';

export function hallPhotoDetails(config){
  const root=new THREE.Group();root.name='다목적실 사진 참고 체육용품';
  if(!config)return root;
  const geometry=new THREE.TorusGeometry(.31,.018,6,32),materials=new Map();
  for(const hoop of config.hoops){
    if(!materials.has(hoop.color))materials.set(hoop.color,new THREE.MeshStandardMaterial({color:hoop.color,roughness:.45}));
    const mesh=new THREE.Mesh(geometry,materials.get(hoop.color));mesh.position.set(hoop.x,hoop.z,-hoop.y);mesh.rotation.x=Math.PI/2;root.add(mesh);
  }
  return root;
}

export function createHallMirror(floorHeight=3.4,mobile=false){
  const m=HALL_MIRROR;
  const mirror=new Reflector(new THREE.PlaneGeometry(m.width,m.height),{color:0x7f7f7f,textureWidth:mobile?512:1024,textureHeight:mobile?128:256,multisample:0,clipBias:.003});
  mirror.name='다목적실 입구 오른쪽 전면 거울';
  mirror.position.set(m.x,-floorHeight+m.bottom+m.height/2,-m.y);
  mirror.visible=false;
  return mirror;
}

export function createGateTerrain(boxes){
  const root=new THREE.Group();root.name='정문에서 구령대 방향 오르막 지형';
  const groups=new Map();
  for(const b of boxes.filter(b=>b.shape==='terrain')){
    const key=b.material+'|'+b.color.join(',');if(!groups.has(key))groups.set(key,{example:b,vertices:[]});
    const a=b.bounds,h=b.heights,v=[[a[0],h[0],-a[1]],[a[3],h[1],-a[1]],[a[3],h[2],-a[4]],[a[0],h[3],-a[4]]];
    const vertices=groups.get(key).vertices;
    for(const index of [0,1,2,0,2,3])vertices.push(...v[index]);
    // Close cell edges down to the foundation: no exposed gaps at the yard seam.
    for(let i=0;i<4;i++){
      const p=v[i],q=v[(i+1)%4],lowP=[p[0],a[2],p[2]],lowQ=[q[0],a[2],q[2]];
      for(const point of [p,lowP,q,q,lowP,lowQ])vertices.push(...point);
    }
  }
  for(const {example,vertices} of groups.values()){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,finishMaterial(example));mesh.receiveShadow=true;root.add(mesh);
  }
  return root;
}
