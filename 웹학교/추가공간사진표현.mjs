import * as THREE from './외부도구/three.module.js';
import {magpieRoomDetails} from './까치방사진표현.mjs';
// Small code-native textures, not private source photographs.
export function additionalRoomDetails(c){
 const group=new THREE.Group(),materials=new Map(),textures=new Map();
 if(c.magpieRoom)group.add(magpieRoomDetails(c));
 const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.65}));return materials.get(color);};
 const box=(parent,w,h,d,x,y,z,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);parent.add(m);return m;};
 for(const chair of c.chairs.filter(q=>!q.magpieStudent)){
  const g=new THREE.Group();g.position.set(chair.x,chair.z,-chair.y);g.rotation.y=chair.angle;g.scale.setScalar(chair.scale??1);group.add(g);
  box(g,.46,.065,.43,0,.43,0,chair.color);box(g,.44,.31,.06,0,.65,.20,chair.color);
  if(chair.office){
   box(g,.06,.34,.06,0,.23,0,'#7f9287');
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leg=box(g,.03,.035,.29,Math.sin(a)*.13,.08,Math.cos(a)*.13,'#344740');leg.rotation.y=a;const wheel=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),mat('#283832'));wheel.position.set(Math.sin(a)*.25,.05,Math.cos(a)*.25);g.add(wheel);}
   for(const x of [-.25,.25]){box(g,.035,.20,.035,x,.53,.12,'#3e4d45');box(g,.055,.04,.30,x,.63,0,'#3e4d45');}
  }else for(const x of [-.18,.18])for(const z of [-.16,.16])box(g,.035,.43,.035,x,.215,z,chair.color);
 }
 for(const prop of c.props){
  const g=new THREE.Group();g.position.set(prop.x,prop.z,-prop.y);group.add(g);
  if(prop.type==='roundedTable'){
   const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.055,32),mat(prop.color));mesh.scale.set(prop.w*prop.sx,1,prop.d*prop.sy);g.add(mesh);
   if(!prop.noLegs)for(const x of [-prop.w*.28,prop.w*.28])box(g,.07,Math.max(.12,prop.z-c.room.bounds[4]-.06),.07,x*prop.sx,-(prop.z-c.room.bounds[4])*.5,0,'#a99674');
  }else if(prop.type==='flag'){
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-.14,0,0,.14,0,0,0,-.24,0],3));geo.computeVertexNormals();const material=mat(prop.color).clone();material.side=THREE.DoubleSide;g.add(new THREE.Mesh(geo,material));
  }else if(prop.type==='balloon'){
   const b=new THREE.Mesh(new THREE.SphereGeometry(.14,12,9),mat(prop.color));b.scale.y=1.2;g.add(b);box(g,.005,.22,.005,0,-.23,0,'#c6b99d');
  }else if(prop.type==='hose'){
   for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(.24+i*.025,.018,7,24),mat(prop.color));m.position.y=i*.015;g.add(m);}
  }
 }
 const palette=['#e2b850','#7cacb7','#9fba70','#c593ac','#d79669'];
 for(const p of c.panels){
  const key=p.style+'|'+p.color;
  if(!textures.has(key)){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle=p.color??'#d8ddd0';ctx.fillRect(0,0,512,256);
   if(p.style==='screen'){
    ctx.fillStyle='#d7e7df';ctx.fillRect(0,0,512,256);ctx.fillStyle='#376a76';ctx.fillRect(0,0,512,37);
    for(let row=0;row<4;row++)for(let col=0;col<9;col++){ctx.fillStyle=palette[(row+col)%5];ctx.fillRect(12+col*55,48+row*48,44,34);ctx.fillStyle='#eff0de';ctx.fillRect(18+col*55,54+row*48,23,9);}
   }else if(p.style==='landscape'){
    ctx.fillStyle='#c4ded6';ctx.fillRect(0,0,512,256);ctx.fillStyle='#a6bf7d';ctx.beginPath();ctx.ellipse(260,255,320,110,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bdab8a';ctx.fillRect(325,94,86,114);ctx.fillStyle='#91ae71';ctx.beginPath();ctx.arc(150,92,70,0,Math.PI*2);ctx.fill();
   }else{
    for(let row=0;row<3;row++)for(let col=0;col<7;col++){
     const x=14+col*71,y=16+row*71;ctx.fillStyle=palette[(row+col)%5];ctx.fillRect(x,y,59,59);ctx.fillStyle='#f1eee0';ctx.fillRect(x+4,y+5,51,48);
     ctx.fillStyle=palette[(row+col+2)%5];if(p.style==='flowers'){ctx.beginPath();ctx.arc(x+29,y+26,13,0,Math.PI*2);ctx.fill();}else for(let i=0;i<4;i++)ctx.fillRect(x+9,y+12+i*8,36-i%2*10,3);
    }
    if(p.style==='computer-posters'){ctx.fillStyle='#284652';ctx.fillRect(0,220,512,36);ctx.fillStyle='#f6f1dc';ctx.font='bold 22px sans-serif';ctx.fillText('컴퓨터부 · 함께 배우는 디지털 세상',30,245);}
   }
   const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;textures.set(key,new THREE.MeshStandardMaterial({map:t,roughness:.9,side:THREE.DoubleSide}));
  }
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.width,p.height),textures.get(key));mesh.position.set(p.x,p.z,-p.y);if(p.axis==='x')mesh.rotation.y=Math.PI/2;mesh.name=p.name;group.add(mesh);
 }
 return group;
}
