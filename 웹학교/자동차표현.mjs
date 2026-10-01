import * as THREE from './외부도구/three.module.js';
import {mergeGeometries} from './외부도구/BufferGeometryUtils.js';
import {PARKED_CARS,CAR_DIMENSIONS} from './주차장.mjs';

// Photo-guided generic road cars, not scans or exact branded models.
export function parkedCarDetails(){
  const group=new THREE.Group();group.name='정문 운동장 및 후문 차량';
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d'),sky=ctx.createLinearGradient(0,0,0,256);
  sky.addColorStop(0,'#8cabba');sky.addColorStop(.48,'#e8eee8');sky.addColorStop(.52,'#919b91');sky.addColorStop(1,'#596158');ctx.fillStyle=sky;ctx.fillRect(0,0,512,256);
  for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#a7b6b9':'#d8ddda';ctx.fillRect(i*47,78+(i%3)*8,24,50);}
  const env=new THREE.CanvasTexture(canvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;
  const mat=(color,metalness=0,roughness=.7)=>new THREE.MeshStandardMaterial({color,metalness,roughness,envMap:env,envMapIntensity:.7});
  const rubber=mat('#161b1d',0,.91),trim=mat('#242a2d',.2,.5),chrome=mat('#aeb9bd',.9,.22),glass=mat('#243942',.48,.17),lamp=mat('#c7d9dc',.45,.17),red=mat('#861f23',.3,.22);
  glass.transparent=true;glass.opacity=.32;glass.depthWrite=false;
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  function mesh(root,g,m,p=[0,0,0]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
  function box(root,m,p,s){const o=mesh(root,boxGeometry,m,p);o.scale.set(...s);return o;}
  function quad(root,m,points){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const o=mesh(root,g,m);o.material.side=THREE.DoubleSide;return o;}
  function tube(root,a,b,r,m){const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const o=mesh(root,new THREE.CylinderGeometry(r,r,d.length(),7),m,new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
  function loft(root,rings,m,rounded=false,doorCut=null){
    if(rounded){
      const curve=new THREE.CatmullRomCurve3(rings.map(([z,w,lo,hi])=>new THREE.Vector3(w,lo,hi)),false,'catmullrom',.25);
      const sections=rings;
      rings=Array.from({length:81},(_,i)=>{const t=i/80,p=curve.getPoint(t),v=t*(sections.length-1),j=Math.min(sections.length-2,Math.floor(v));return [THREE.MathUtils.lerp(sections[j][0],sections[j+1][0],v-j),p.x,p.y,p.z];});
    }
    const points=[],indices=[],N=12;
    for(const [z,width,low,top] of rings){
      const h=top-low;
      for(const [x,y] of [[-1,.18],[-.96,.04],[-.7,0],[.7,0],[.96,.04],[1,.18],[1,.70],[.93,.92],[.7,1],[-.7,1],[-.93,.92],[-1,.70]])points.push(x*width,low+y*h,z);
    }
    for(let r=0;r<rings.length-1;r++)for(let i=0;i<N;i++){
      const z=(rings[r][0]+rings[r+1][0])/2;
      if(doorCut&&i>=10&&z>doorCut[0]&&z<doorCut[1])continue;
      if(m===glass&&i>=1&&i<=3)continue;
      const a=r*N+i,b=r*N+(i+1)%N,c=b+N,d=a+N;indices.push(a,b,d,b,c,d);
    }
    for(let i=1;i<N-1;i++){indices.push(0,i+1,i);const s=(rings.length-1)*N;indices.push(s,s+i,s+i+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();return mesh(root,g,m);
  }
  for(const car of PARKED_CARS){
    const d=CAR_DIMENSIONS[car.type],suv=car.type==='suv',compact=car.type==='compact',root=new THREE.Group();root.name=car.id;root.userData={...car};group.add(root);
    root.position.set(car.x,car.z,-car.y);root.rotation.y=car.yaw;
    const L=d.length/2,W=d.width/2,H=d.height,axle=d.wheelbase/2,R=suv?.365:compact?.29:.325,shoulder=suv?.99:.86;
    const paint=new THREE.MeshPhysicalMaterial({color:car.color,metalness:.55,roughness:.28,clearcoat:1,clearcoatRoughness:.17,envMap:env,envMapIntensity:.8});
    const roofFront=compact?-.65:-.55,roofRear=suv?1.43:compact?.92:.80,windFront=compact?-1.15:-1.25,rearBottom=suv?1.85:compact?1.45:1.56;
    loft(root,[[-L,.77*W,.37,shoulder-.16],[-L+.14,.94*W,.30,shoulder-.07],[-L+.42,W,.32,shoulder],[-axle,W,.33,shoulder+.02],[0,W,.31,shoulder],[axle,W,.33,shoulder],[L-.16,.96*W,.33,shoulder-.08],[L,.80*W,.40,shoulder-.13]],paint,true,[windFront,.1]);
    box(root,trim,[0,.27,0],[d.width-.19,.15,d.length-.35]);
    loft(root,[[windFront,W*.90,shoulder-.01,shoulder+.02],[roofFront,W*.76,shoulder,H-.10],[.1,W*.77,shoulder,H-.08],[roofRear,W*.77,shoulder,H-.06],[rearBottom,W*.89,shoulder-.03,shoulder+.02]],glass,false,[windFront,.1]);
    loft(root,[[roofFront+.015,W*.765,H-.065,H-.04],[roofFront+.18,W*.79,H-.03,H],[roofRear-.14,W*.79,H-.025,H],[roofRear,W*.765,H-.075,H-.025]],paint,true);
    for(const x of [-.37,.37]){
      box(root,trim,[x,.49,.15],[.55,.13,.62]);box(root,trim,[x,.77,.43],[.55,.57,.14]);box(root,trim,[x,1.10,.43],[.26,.20,.12]);
    }
    box(root,trim,[0,shoulder-.06,-.93],[d.width*.8,.17,.32]);box(root,trim,[0,.49,1.02],[d.width*.76,.16,.48]);
    const steering=mesh(root,new THREE.TorusGeometry(.15,.018,8,24),trim,[-.36,.89,-.53]);steering.rotation.x=-.35;
    const door=new THREE.Group();door.position.set(-W,.39,windFront);root.add(door);root.userData.door=door;root.userData.wheels=[];
    const doorLength=.1-windFront;
    box(door,paint,[0,(shoulder-.39)/2,doorLength/2],[.047,shoulder-.39,doorLength]);
    quad(door,glass,[[W*.10,shoulder-.39,0],[W*.01,shoulder-.39,doorLength],[W*.23,H-.47,doorLength],[W*.24,H-.49,roofFront-windFront]]);
    tube(door,[W*.01,shoulder-.37,doorLength],[W*.23,H-.47,doorLength],.016,trim);
    box(door,chrome,[-.032,shoulder-.49,doorLength-.18],[.025,.038,.17]);
    for(const side of [-1,1]){
      for(const [i,[a,b]] of [[[side*W*.905,shoulder,windFront],[side*W*.765,H-.07,roofFront]],[[side*W*.99,shoulder,.10],[side*W*.79,H-.02,.10]],[[side*W*.9,shoulder,rearBottom],[side*W*.775,H-.06,roofRear]]].entries())tube(root,a,b,i===1?.025:.030,i===1?trim:paint);
      tube(root,[side*W*.99,shoulder,windFront],[side*W*.99,shoulder,rearBottom],.018,chrome);
      for(const z of [.10,rearBottom-.12])tube(root,[side*(W+.002),.43,z],[side*(W+.002),shoulder-.03,z],.005,trim);
      for(const z of [-.15,.92])if(side>0||z>0)box(root,chrome,[side*(W+.017),shoulder-.10,z],[.025,.038,.17]);
      const mirror=mesh(root,new THREE.SphereGeometry(1,12,8),paint,[side*(W+.10),shoulder+.12,windFront+.22]);mirror.scale.set(.155,.082,.115);
      box(root,glass,[side*(W+.12),shoulder+.12,windFront+.32],[.20,.105,.012]);
      for(const z of [-axle,axle]){
        const wheel=new THREE.Group();wheel.position.set(side*(W-.018),R,z);wheel.userData.front=z<0;wheel.rotation.order='YXZ';root.add(wheel);root.userData.wheels.push(wheel);
        const tyre=mesh(wheel,new THREE.CylinderGeometry(R,R,.235,32),rubber);tyre.rotation.z=Math.PI/2;
        const rim=mesh(wheel,new THREE.CylinderGeometry(R*.70,R*.70,.247,32),chrome);rim.rotation.z=Math.PI/2;
        const inner=mesh(wheel,new THREE.CylinderGeometry(R*.59,R*.59,.255,24),trim);inner.rotation.z=Math.PI/2;
        for(let i=0;i<5;i++)for(const offset of [-.035,.035]){
          const a=i*Math.PI*2/5+offset;
          tube(wheel,[side*.136,Math.cos(a)*R*.12,Math.sin(a)*R*.12],[side*.137,Math.cos(a+.16)*R*.64,Math.sin(a+.16)*R*.64],.018,chrome);
        }
        const hub=mesh(wheel,new THREE.CylinderGeometry(.057,.057,.275,16),chrome);hub.rotation.z=Math.PI/2;
        const arch=mesh(root,new THREE.TorusGeometry(R+.05,.035,6,24,Math.PI),suv?trim:paint,[side*(W+.012),R,z]);arch.rotation.set(0,Math.PI/2,0);
        for(let i=0;i<24;i++){const a=i*Math.PI/12;const tread=box(wheel,trim,[0,Math.cos(a)*(R+.002),Math.sin(a)*(R+.002)],[.19,.008,.023]);tread.rotation.x=-a;}
      }
      box(root,trim,[side*(W+.012),.36,0],[.04,.07,1.8]);
      const lightY=shoulder-.24;
      quad(root,trim,[[side*W*.38,lightY-.015,-L-.012],[side*W*.92,lightY+.025,-L+.095],[side*W*.89,lightY+.145,-L+.115],[side*W*.38,lightY+.11,-L-.01]]);
      quad(root,lamp,[[side*W*.41,lightY,-L-.018],[side*W*.88,lightY+.035,-L+.075],[side*W*.86,lightY+.125,-L+.087],[side*W*.41,lightY+.085,-L-.018]]);
      tube(root,[side*W*.42,lightY+.022,-L-.023],[side*W*.85,lightY+.055,-L+.059],.008,lamp);
      quad(root,red,[[side*W*.35,shoulder-.25,L+.012],[side*W*.92,shoulder-.22,L-.11],[side*W*.91,shoulder-.12,L-.115],[side*W*.35,shoulder-.15,L+.012]]);
    }
    box(root,trim,[0,.51,-L-.008],[d.width*.68,.19,.05]);
    for(let i=0;i<5;i++)box(root,chrome,[0,.44+i*.031,-L-.037],[d.width*.59,.008,.008]);
    for(const z of [-L-.042,L+.015]){box(root,trim,[0,.48,z],[.49,.135,.012]);box(root,lamp,[0,.48,z+(z<0?-.007:.007)],[.45,.10,.012]);}
    for(const x of [-.23,.23])tube(root,[x,shoulder+.02,windFront-.025],[x+.20,shoulder+.05,windFront+.04],.011,trim);
    if(suv)for(const x of [-W*.69,W*.69])tube(root,[x,H+.025,-.30],[x,H+.025,1.20],.022,chrome);
  }
  // Batch within each vehicle so detail does not add hundreds of draw calls.
  function batch(root){
    root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),batches=new Map();
    root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(g.getAttribute('uv'))g.deleteAttribute('uv');if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);});
    root.clear();
    for(const [material,parts] of batches){const joined=mergeGeometries(parts);mesh(root,joined,material);for(const g of parts)g.dispose();}
  }
  group.updateMatrixWorld(true);
  for(const car of group.children){
    const moving=[car.userData.door,...car.userData.wheels];
    for(const part of moving){batch(part);car.remove(part);}batch(car);for(const part of moving)car.add(part);
  }
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=256;
  const shadowContext=shadowCanvas.getContext('2d');shadowContext.scale(128,256);
  const shadow=shadowContext.createRadialGradient(.5,.5,.08,.5,.5,.5);
  shadow.addColorStop(0,'rgba(0,0,0,.44)');shadow.addColorStop(.65,'rgba(0,0,0,.27)');shadow.addColorStop(1,'rgba(0,0,0,0)');
  shadowContext.fillStyle=shadow;shadowContext.fillRect(0,0,1,1);
  const shadowMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  for(const car of group.children){
    const d=CAR_DIMENSIONS[car.userData.type],plane=new THREE.Mesh(new THREE.PlaneGeometry(d.width*1.35,d.length*1.12),shadowMaterial);
    plane.rotation.x=-Math.PI/2;plane.position.y=.012;car.add(plane);
  }
  return group;
}

const axisConversion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),inverseAxis=axisConversion.clone().invert();
export function updateDrivenCars(group,driving){
  for(const c of driving.cars){
    const root=group.children.find(o=>o.name===c.id),p=driving.point(c,0,0);if(!root)continue;
    root.position.set(p.x,p.z,-p.y);const q=c.body.quaternion;root.quaternion.copy(axisConversion).multiply(new THREE.Quaternion(q.x,q.y,q.z,q.w)).multiply(inverseAxis);
    root.userData.door.rotation.y=-c.door*1.1;
    for(const wheel of root.userData.wheels){wheel.rotation.y=wheel.userData.front?c.steering:0;wheel.rotation.x=-c.wheelSpin;}
  }
}
