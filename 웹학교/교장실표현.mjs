import * as THREE from './외부도구/three.module.js';
import {OFFICE_FURNITURE,OFFICE_ORIGIN} from './교장실배치.mjs';
const boxGeometry=new THREE.BoxGeometry(1,1,1),ballGeometry=new THREE.SphereGeometry(1,16,12),rodGeometry=new THREE.CylinderGeometry(1,1,1,10),roundedCache=new Map();
const metal=new THREE.MeshStandardMaterial({color:'#a7acad',metalness:.82,roughness:.28});
function paint(color,roughness=.68,extra={}){return new THREE.MeshStandardMaterial({color,roughness,...extra});}
function canvasMap(draw,w=1024,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function mesh(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const cube=(p,m,x,y,z,w,h,d)=>mesh(p,boxGeometry,m,x,y,z,w,h,d);
const ball=(p,m,x,y,z,w,h,d)=>mesh(p,ballGeometry,m,x,y,z,w,h,d);
function rod(p,m,a,b,r=.018){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const o=mesh(p,rodGeometry,m,...av.clone().add(bv).multiplyScalar(.5).toArray(),r,delta.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
function panel(p,x,y,z,w,h,angle,draw){const mat=paint('#ffffff',.78,{map:canvasMap(draw)});const o=mesh(p,new THREE.PlaneGeometry(w,h),mat,x,y,z);o.rotation.y=angle;return o;}
function text(c,value,x,y,size,color='#33474b',align='left'){c.fillStyle=color;c.font=`600 ${size}px "Malgun Gothic",sans-serif`;c.textAlign=align;c.fillText(value,x,y);}
function roundedGeometry(w,h,d,r=.04){
  r=Math.min(r,w/2-.001,h/2-.001);
  const key=[w,h,d,r].join(',');if(roundedCache.has(key))return roundedCache.get(key);
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-.014),bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.007,bevelThickness:.007,curveSegments:5});g.translate(0,0,-d/2+.007);roundedCache.set(key,g);return g;
}
function batchStatic(group){
  group.updateMatrixWorld(true);const byKey=new Map(),remove=[];
  group.traverse(o=>{if(!o.isMesh||o.material.transparent||o.geometry.type==='PlaneGeometry')return;const key=o.geometry.uuid+o.material.uuid;if(!byKey.has(key))byKey.set(key,[]);byKey.get(key).push(o);});
  const inverse=group.matrixWorld.clone().invert();
  for(const items of byKey.values())if(items.length>2){const batch=new THREE.InstancedMesh(items[0].geometry,items[0].material,items.length);batch.name='교장실 반복 부품 묶음';items.forEach((o,i)=>{batch.setMatrixAt(i,inverse.clone().multiply(o.matrixWorld));remove.push(o);});batch.castShadow=true;batch.receiveShadow=true;batch.computeBoundingSphere();group.add(batch);}
  remove.forEach(o=>o.removeFromParent());
}

export function createPrincipalOffice(){
  const group=new THREE.Group();group.name='사진 참고 교장실';group.position.set(OFFICE_ORIGIN.x,OFFICE_ORIGIN.z,-OFFICE_ORIGIN.y);
  const white=paint('#e6e7e2',.48),wall=paint('#e3e2dd'),black=paint('#242b2b'),wood=paint('#b78c64'),glass=paint('#bdd0c9',.15,{metalness:.24,transparent:true,opacity:.64,depthWrite:false});
  const darkGlass=paint('#203537',.28),fabric=paint('#dedfda',.9),gold=paint('#c2a456',.26,{metalness:.83});
  const floorMat=paint('#e0e1d7',.46);floorMat.map=canvasMap((c,w,h)=>{
    c.fillStyle='#e5e6dd';c.fillRect(0,0,w,h);let seed=91;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    for(let i=0;i<40000;i++){const x=rand()*w,y=rand()*h;c.fillStyle=rand()>.5?'#babfb329':'#fbfcf660';c.fillRect(x,y,rand()*3+.5,rand()*1.5+.5);}c.strokeStyle='#b4bab070';c.lineWidth=2;c.strokeRect(1,1,w-2,h-2);
  },512,512);floorMat.map.wrapS=floorMat.map.wrapT=THREE.RepeatWrapping;floorMat.map.repeat.set(14,14);
  cube(group,floorMat,3.5,.011,3.5,6.78,.016,6.78);
  // Only inward-facing thin finishes: door and existing window openings remain usable.
  cube(group,wall,.115,1.55,3.5,.025,3.1,6.78);cube(group,wall,6.885,1.55,3.5,.025,3.1,6.78);
  cube(group,wall,.98,1.55,.115,1.69,3.1,.025);cube(group,wall,4.98,1.55,.115,3.79,3.1,.025);
  cube(group,wall,2.45,2.70,.115,1.2,.85,.025);
  cube(group,wall,3.5,.43,6.88,6.78,.82,.025);cube(group,wall,3.5,2.82,6.88,6.78,.54,.025);
  for(const x of [.14,6.86])cube(group,black,x,.075,3.5,.035,.15,6.72);
  cube(group,black,3.5,.075,6.855,6.72,.15,.045);
  for(const [x,w] of [[.98,1.69],[4.98,3.79]])cube(group,black,x,.075,.14,w,.15,.035);
  const ceiling=paint('#e6e5df');ceiling.map=canvasMap((c,w,h)=>{c.fillStyle='#e5e4df';c.fillRect(0,0,w,h);for(let i=0;i<1800;i++){const x=(i*97%w),y=(i*193%h);c.fillStyle='#9c9b9250';c.fillRect(x,y,1+(i%3),1);}c.strokeStyle='#adada4';c.strokeRect(0,0,w,h);},256,256);ceiling.map.wrapS=ceiling.map.wrapT=THREE.RepeatWrapping;ceiling.map.repeat.set(12,12);
  cube(group,ceiling,3.5,3.12,3.5,6.78,.035,6.78);
  const lamp=paint('#edf5ed',.4,{emissive:'#e5efe7',emissiveIntensity:.75});
  for(const x of [1.6,4.8])for(const v of [1.85,4.8]){cube(group,white,x,3.075,v,.64,.055,1.28);cube(group,lamp,x,3.043,v,.57,.014,1.18);}
  // Open timber entrance leaf, swung against the west side of the doorway.
  const door=new THREE.Group();door.position.set(1.86,0,.19);door.rotation.y=-1.37;group.add(door);
  cube(door,wood,.54,1.06,0,1.08,2.10,.044);cube(door,darkGlass,.54,1.59,-.029,.81,.20,.012);cube(door,darkGlass,.54,1.92,-.029,.81,.15,.012);
  for(let i=0;i<5;i++)cube(door,paint('#957250'),.54,.22+i*.22,-.026,.89,.016,.012);
  rod(door,metal,[.94,.94,-.05],[.81,.94,-.05],.021);
  // The panorama has a white frosted corridor-facing interior window beside the entrance.
  cube(group,white,4.64,1.94,.14,2.32,1.23,.035);
  for(const x of [4.08,5.20])for(const h of [1.68,2.22])cube(group,paint('#9eafad',.26),x,h,.165,1.04,.46,.024);
  // Existing exterior glazing remains underneath the physical blind slats.
  for(let i=0;i<3;i++){
    const x=1.2+i*2.30;cube(group,white,x,2.67,6.79,2.19,.12,.15);
    for(let j=0;j<5;j++)cube(group,paint(j%2?'#d5d3c2':'#e7e4d5',.8),x,2.57-j*.115,6.755,2.16,.074,.025);
    rod(group,white,[x+1.01,1.35,6.7],[x+1.01,2.63,6.7],.007);
  }
  rod(group,metal,[.3,1.35,6.72],[6.70,1.35,6.72],.021);
  // Education board follows the photographed green/pink/yellow/blue/purple sequence.
  cube(group,metal,.153,2.10,3.28,.052,1.55,5.88);
  panel(group,.183,2.10,3.28,5.79,1.46,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#d5eced';c.fillRect(0,0,w,h);text(c,'존중하며 어울리는 행복배움터 석암',w/2,52,34,'#286471','center');
    const colors=['#a7c861','#d88c9c','#d8b34e','#68b5d4','#b19ac9'],titles=['학교 상징','교육 목표','학교 교육','함께 배우기','행복한 학교'];
    colors.forEach((color,i)=>{const x=17+i*201;c.fillStyle=color;c.fillRect(x,85,187,350);c.fillStyle='#f6f4eb';c.fillRect(x+10,131,167,289);text(c,titles[i],x+93,116,23,'#37494a','center');for(let row=0;row<4;row++){c.fillStyle=color;c.beginPath();c.arc(x+39,178+row*62,18,0,Math.PI*2);c.fill();text(c,['배움','존중','함께','성장'][row],x+72,185+row*62,20);c.fillStyle='#c6cbc6';c.fillRect(x+73,199+row*62,76,3);}});
    c.fillStyle='#869b60';c.fillRect(0,h-37,w,37);for(let i=0;i<170;i++){c.strokeStyle=i%2?'#adc16b':'#59764f';c.beginPath();c.moveTo(i*7,h);c.quadraticCurveTo(i*7-8,h-42,i*7+6,h-30-i%17);c.stroke();}
  });
  cube(group,metal,.25,1.32,3.3,.23,.045,5.9);
  // Framed Korean flag near the working desk; canvas geometry, not an invented photo.
  cube(group,wood,.15,2.63,6.27,.035,.49,.80);
  panel(group,.177,2.63,6.27,.75,.44,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#f6f5ee';c.fillRect(0,0,w,h);c.save();c.translate(w/2,h/2);c.rotate(-.3);c.fillStyle='#ca4750';c.beginPath();c.arc(0,0,105,Math.PI,0);c.arc(52.5,0,52.5,0,Math.PI);c.arc(-52.5,0,52.5,0,Math.PI,true);c.fill();c.fillStyle='#35618e';c.beginPath();c.arc(0,0,105,0,Math.PI);c.arc(-52.5,0,52.5,Math.PI,0);c.arc(52.5,0,52.5,Math.PI,0,true);c.fill();c.restore();
    [[220,110,0],[804,110,1],[220,400,2],[804,400,3]].forEach(([x,y,n])=>{c.save();c.translate(x,y);c.rotate(x<w/2?-.55:.55);c.fillStyle='#263033';for(let i=0;i<3;i++){c.fillRect(-57,-35+i*24,114,15);if((n===1&&i!==1)||(n===2&&i===1)||n===3){c.fillStyle='#f6f5ee';c.fillRect(-7,-35+i*24,14,15);c.fillStyle='#263033';}}c.restore();});
  });
  function chair(f,executive=false){
    const g=new THREE.Group();g.position.set(f.u,0,f.v);g.rotation.y=f.angle;group.add(g);
    const upholstery=executive?black:fabric;
    mesh(g,roundedGeometry(executive?.61:.48,.075,.47,.065),upholstery,0,.46,0);
    mesh(g,roundedGeometry(executive?.61:.48,executive?.72:.43,.075,.06),upholstery,0,executive?.89:.73,-.205).rotation.x=-.10;
    if(executive){
      rod(g,metal,[0,.12,0],[0,.43,0],.045);
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod(g,black,[0,.12,0],[Math.sin(a)*.33,.085,Math.cos(a)*.33],.025);ball(g,black,Math.sin(a)*.33,.05,Math.cos(a)*.33,.049,.045,.04);}
      for(const s of [-1,1]){rod(g,black,[s*.30,.49,.05],[s*.30,.70,-.08],.022);cube(g,black,s*.30,.71,0,.07,.044,.33);}
      const cover=paint('#d9c5ab',.95,{map:canvasMap((c,w,h)=>{c.fillStyle='#c9b6a1';c.fillRect(0,0,w,h);for(let i=0;i<12;i++){const x=(i*269)%w,y=(i*177)%h;c.strokeStyle='#8e5550';for(let j=0;j<10;j++){c.beginPath();c.ellipse(x,y,30+j*2,30+j*2,0,0,Math.PI*2);c.stroke();}}})});
      cube(g,cover,0,.48,.015,.52,.025,.40);cube(g,cover,0,.87,-.15,.51,.63,.019);
    }else for(const x of [-.19,.19])for(const z of [-.17,.17])rod(g,metal,[x,.04,z],[x,.43,z],.018);
  }
  function trophy(u,h,v,i){
    cube(group,black,u,h+.028,v,.12,.055,.12);
    const profile=[new THREE.Vector2(.022,0),new THREE.Vector2(.018,.12),new THREE.Vector2(.072,.18),new THREE.Vector2(.084,.25)];
    mesh(group,new THREE.LatheGeometry(profile,16),i%2?metal:gold,u,h+.06,v);
    for(const s of [-1,1]){const arc=new THREE.Mesh(new THREE.TorusGeometry(.062,.008,6,12,Math.PI),gold);arc.position.set(u+s*.07,h+.235,v);arc.rotation.z=s>0?-Math.PI/2:Math.PI/2;group.add(arc);}
  }
  for(const f of OFFICE_FURNITURE){
    const {u,v,w,d}=f;
    if(f.type==='chair'||f.type==='executive'){chair(f,f.type==='executive');continue;}
    if(f.type==='table'){
      mesh(group,roundedGeometry(w,.038,d,.1),glass,u,.76,v);
      cube(group,white,u,.704,v,w-.1,.055,d-.1);
      for(const x of [-.51,.51])for(const z of [-1.24,1.24])rod(group,metal,[u+x,.04,v+z],[u+x,.70,v+z],.032);
      cube(group,black,u,.83,v+.80,.37,.12,.22);cube(group,white,u,.90,v+.80,.16,.012,.07);
    }else if(f.type==='display'||f.type==='cabinet'){
      cube(group,white,u,.46,v,w,.9,d);const count=f.type==='display'?5:3;
      for(let j=0;j<count;j++){const z=v-d/2+(j+.5)*d/count;cube(group,paint('#d9dcd5',.53),u-w/2-.008,.46,z,.012,.82,d/count-.018);rod(group,metal,[u-w/2-.026,.53,z+.07],[u-w/2-.026,.67,z+.07],.009);}
      if(f.type==='display'){
        cube(group,white,u+w/2-.028,1.6,v,.04,1.38,d);
        for(const z of [v-d/2,v+d/2,v-.47,v+.47])cube(group,white,u,1.6,z,w,1.38,.038);
        for(const h of [.95,1.4,1.85,2.30])cube(group,white,u,h,v,w,.038,d);
        // One solid end cupboard, with open and glazed trophy bays next to it.
        cube(group,white,u-w/2-.01,1.64,v-.94,.022,1.3,.88);
        for(const z of [v-.13,v+.34,v+.82,v+1.1]){trophy(u-.07,1.43,z,Math.round(z*3));trophy(u-.08,1.88,z,Math.round(z*4));}
        for(const z of [v-.31,v+.62]){const g=cube(group,glass,u-w/2-.02,1.64,z,.008,1.3,.86);g.castShadow=false;}
        for(let i=0;i<4;i++){
          const z=v-1.05+i*.65;cube(group,paint('#377caa'),u,2.46,z,.04,.30,.55);
          panel(group,u-.023,2.46,z,.50,.26,-Math.PI/2,(c,W,H)=>{c.fillStyle='#f7f8ef';c.fillRect(0,0,W,H);text(c,i===2?'대 상':'교육활동 우수',W/2,H*.63,90,'#397fa2','center');});
        }
        trophy(u,2.32,v+1.06,0);
      }else{
        mesh(group,new THREE.CylinderGeometry(.07,.05,.18,14),paint('#b58b76'),u-.09,1.02,v-.30);
        for(let i=0;i<6;i++){const a=i*2.4;rod(group,paint('#637b4e'),[u-.09,.99,v-.30],[u-.09+Math.sin(a)*.08,1.32+i%2*.04,v-.30+Math.cos(a)*.08],.005);ball(group,paint('#a66b75'),u-.09+Math.sin(a)*.08,1.32+i%2*.04,v-.30+Math.cos(a)*.08,.052,.042,.047);}
        mesh(group,new THREE.CylinderGeometry(.065,.065,.11,16),white,u-.1,.98,v+.31);
      }
    }else if(f.type==='desk'){
      cube(group,paint('#454b49'),u,.40,v,w-.08,.72,d-.12);cube(group,glass,u,.78,v,w,.04,d);cube(group,black,u+.12,.807,v,.71,.012,1.30);
      for(const z of [v-.43,v+.23]){
        cube(group,black,u-.12,1.17,z,.075,.46,.65);cube(group,metal,u-.12,.91,z,.035,.23,.05);cube(group,black,u-.05,.823,z,.27,.025,.33);
        panel(group,u-.075,1.17,z,.60,.405,Math.PI/2,(c,W,H)=>{c.fillStyle='#d4dee0';c.fillRect(0,0,W,H);c.fillStyle='#718e96';c.fillRect(0,0,W,60);c.fillStyle='#fbfcf6';c.fillRect(90,90,W-180,H-130);for(let i=0;i<8;i++){c.fillStyle='#b7c1c0';c.fillRect(130,130+i*36,600-i%3*75,9);}});
      }
      cube(group,paint('#c7ceca'),u+.39,.824,v+.04,.20,.023,.55);for(let r=0;r<4;r++)for(let j=0;j<11;j++)cube(group,white,u+.325+r*.044,.839,v-.20+j*.044,.029,.008,.032);
      ball(group,white,u+.39,.847,v-.49,.05,.025,.077);
      cube(group,black,u+.15,.86,v-.81,.32,.06,.24);rod(group,black,[u+.06,.918,v-.91],[u+.25,.918,v-.91],.029);
      mesh(group,new THREE.CylinderGeometry(.052,.045,.12,16),white,u+.27,.864,v+.76);
    }else if(f.type==='drawer'){
      cube(group,white,u,.35,v,w,.67,d);for(let j=0;j<3;j++){cube(group,paint('#b9c0ba'),u+w/2+.01,.16+j*.20,v,.015,.006,d-.06);rod(group,metal,[u+w/2+.03,.25+j*.19,v-.09],[u+w/2+.03,.25+j*.19,v+.09],.011);}
    }else if(f.type==='purifier'){
      mesh(group,roundedGeometry(w,.78,d,.05),white,u,.40,v);cube(group,black,u,.80,v,w-.07,.017,d-.035);
      for(let i=0;i<24;i++)cube(group,paint('#b5bcb6'),u-w/2+.04+i*(w-.08)/24,.41,v-d/2-.003,.007,.59,.008);
      cube(group,paint('#718d9e'),u+.07,.821,v+.018,.41,.026,.32);
    }else if(f.type==='plant'){
      mesh(group,new THREE.CylinderGeometry(.23,.16,.43,22),white,u,.23,v);mesh(group,new THREE.CylinderGeometry(.215,.215,.018,20),paint('#504a3d'),u,.45,v);
      rod(group,wood,[u,.44,v],[u+.035,1.32,v],.027);
      for(let i=0;i<15;i++){const a=i*2.399,h=.93+i%5*.105;const leaf=ball(group,paint(i%2?'#48633b':'#65834a'),u+Math.sin(a)*.24,h,v+Math.cos(a)*.24,.075,.018,.22);leaf.rotation.set(.4*Math.sin(a),a,.22);rod(group,paint('#6b7852'),[u,h-.08,v],leaf.position.toArray(),.006);}
    }
  }
  // Closed side door from the reference; decorative only, no invented accessible room.
  cube(group,wood,6.85,1.06,5.59,.04,2.12,1.10);rod(group,metal,[6.80,.99,5.95],[6.80,.99,5.82],.018);
  for(const [x,z] of [[1.6,3.4],[5.2,3.7]]){const l=new THREE.PointLight('#f1f2e8',7,8,2);l.position.set(x,2.77,z);group.add(l);}
  batchStatic(group);return group;
}

export function createPrincipalNPC(){
  const root=new THREE.Group();root.name='교장선생님 NPC';
  const navy=paint('#263347',.85),navyDark=paint('#192639',.9),shirt=paint('#ecece5'),skin=paint('#d5a486',.84),shoe=paint('#24282b',.4);
  const weave=canvasMap((c,w,h)=>{c.fillStyle='#b7c0cc';c.fillRect(0,0,w,h);for(let i=0;i<w;i+=3){c.fillStyle='#68778e50';c.fillRect(i,0,1,h);c.fillStyle='#eef0f02b';c.fillRect(0,i,w,1);}},128,128);weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(7,7);navy.map=weave;navyDark.map=weave;
  const body=new THREE.Group();body.position.y=.93;root.add(body);
  mesh(body,new THREE.CylinderGeometry(.225,.174,.55,16),navy,0,.295,0,1,1,.62);
  ball(body,navy,0,.065,0,.183,.14,.116);
  // White shirt opening and shaped overlapping navy lapels.
  function polygon(parent,points,material){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return mesh(parent,new THREE.ShapeGeometry(s),material,0,0,.149);}
  polygon(body,[[-.105,.58],[.105,.58],[.035,.23],[-.035,.23]],shirt);
  for(const s of [-1,1])polygon(body,[[s*.105,.58],[s*.177,.53],[s*.115,.39],[s*.143,.355],[s*.027,.22]],navyDark);
  const tie=paint('#404f66',.77);tie.map=canvasMap((c,w,h)=>{c.fillStyle='#36465c';c.fillRect(0,0,w,h);for(let i=0;i<18;i++)for(let j=0;j<7;j++){c.strokeStyle='#bead85';c.beginPath();c.ellipse(j*150+i%2*70,i*31,16,10,.6,0,Math.PI*2);c.stroke();}},512,512);
  polygon(body,[[0,.56],[.037,.49],[.020,.25],[0,.22],[-.021,.25],[-.033,.49]],tie);
  for(const y of [.20,.31])ball(body,navyDark,.04,y,.141,.011,.011,.004);
  cube(body,navyDark,-.145,.425,.132,.083,.011,.012);
  mesh(body,new THREE.CylinderGeometry(.047,.052,.105,14),skin,0,.616,0);
  const head=new THREE.Group();head.position.set(0,.64,.002);body.add(head);
  // Volumetric head. Frontal UV projection preserves the supplied portrait's features;
  // side/back skull and hair are an approximation, not a facial scan.
  const headMap=new THREE.TextureLoader().load(new URL('./사진마감/교장실/교장선생님-얼굴.png',import.meta.url).href,()=>{faceState='ready';},undefined,()=>{faceState='failed';});headMap.colorSpace=THREE.SRGBColorSpace;
  let faceState='loading';
  const positions=[],uvs=[],indices=[],rows=32,cols=40;
  const widths=[[0,.015],[.04,.073],[.09,.110],[.16,.128],[.23,.123],[.28,.104],[.325,.008]];
  const widthAt=h=>{let i=1;while(i<widths.length-1&&h>widths[i][0])i++;const a=widths[i-1],b=widths[i],t=(h-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;};
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const h=j/rows*.325,a=-Math.PI/2+i/cols*Math.PI,x=widthAt(h)*Math.sin(a);
    let z=.095*Math.cos(a)*Math.pow(Math.sin(Math.PI*j/rows),.35);
    const nose=Math.exp(-((x/.027)**2)-(((h-.127)/.045)**2))*.037;
    z+=nose;positions.push(x,h,z);uvs.push(.5+x/.128*.335,.039+h/.325*.947);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,a+1,b,a+1,b+1,b);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
  const face=mesh(head,geo,paint('#ffffff',.88,{map:headMap,side:THREE.DoubleSide}),0,0,.017);face.name='사진 참고 입체 얼굴';
  ball(head,skin,0,.157,-.021,.115,.154,.097);
  const hair=paint('#292825',.96);ball(head,hair,0,.215,-.047,.12,.112,.093);
  for(const s of [-1,1])ball(head,skin,s*.12,.132,-.005,.017,.038,.016);
  for(let i=0;i<15;i++){const a=-1.25+i*.175;const curl=ball(head,i%5===0?paint('#5a5750'):hair,Math.sin(a)*.085,.29+Math.cos(a)*.01,-.012,.025,.029,.055);curl.rotation.z=-.35;}
  const arms=[],legs=[];
  for(const s of [-1,1]){
    const arm=new THREE.Group();arm.position.set(s*.218,.51,0);arm.rotation.z=s*.07;body.add(arm);arms.push(arm);
    ball(arm,navy,0,-.025,0,.074,.077,.073);mesh(arm,new THREE.CylinderGeometry(.071,.054,.245,14),navy,0,-.14,0);
    const elbow=new THREE.Group();elbow.position.y=-.265;arm.add(elbow);arm.userData.elbow=elbow;
    ball(elbow,navy,0,0,0,.055,.059,.055);mesh(elbow,new THREE.CylinderGeometry(.055,.044,.224,14),navy,0,-.106,.006);cube(elbow,shirt,0,-.224,.008,.082,.043,.08);
    ball(elbow,skin,0,-.283,.014,.044,.067,.034);
    for(let k=0;k<4;k++)ball(elbow,skin,-.028+k*.018,-.328,.022,.010,.034,.012);
    ball(elbow,skin,-s*.046,-.278,.025,.013,.031,.016);
    const leg=new THREE.Group();leg.position.set(s*.095,.93,0);root.add(leg);legs.push(leg);
    mesh(leg,new THREE.CylinderGeometry(.093,.072,.43,12),navyDark,0,-.21,0,1,1,.95);
    const knee=new THREE.Group();knee.position.y=-.42;leg.add(knee);leg.userData.knee=knee;
    mesh(knee,new THREE.CylinderGeometry(.073,.051,.42,12),navyDark,0,-.20,0);
    const foot=ball(knee,shoe,0,-.45,.049,.074,.056,.147);cube(knee,shoe,0,-.479,.052,.136,.023,.25);leg.userData.foot=foot;
  }
  // Soft local contact shadow, no billboard substitute for the actual articulated body.
  const shadowMap=canvasMap((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w*.48);g.addColorStop(0,'#00000065');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,w,h);},128,128);
  const shadow=mesh(root,new THREE.PlaneGeometry(.75,.64),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}),0,.018,0);shadow.rotation.x=-Math.PI/2;
  let stride=0,breath=0;
  function update(dt,state){
    root.position.set(state.position.x,state.position.z,-state.position.y);root.rotation.y=state.heading;
    stride+=(Number(state.moving)-stride)*(1-Math.exp(-dt*9));breath+=dt;const p=state.phase;
    body.position.y=.93+Math.sin(p*2)*.011*stride+Math.sin(breath*1.7)*.002;
    body.rotation.z=Math.sin(p)*.018*stride;body.rotation.y=Math.sin(p)*.035*stride;
    legs.forEach((leg,i)=>{const q=p+i*Math.PI;leg.rotation.x=Math.sin(q)*.39*stride;leg.userData.knee.rotation.x=Math.max(0,-Math.sin(q))*.58*stride;});
    arms.forEach((arm,i)=>{const q=p+i*Math.PI;arm.rotation.x=-Math.sin(q)*.25*stride;arm.userData.elbow.rotation.x=-.16-Math.max(0,Math.sin(q))*.10*stride;});
    head.rotation.y=state.yielding?Math.sin(breath*.7)*.045:Math.sin(breath*.5)*.055;head.rotation.x=Math.sin(breath*.8)*.015;
  }
  return {root,update,getState:()=>({faceTexture:faceState,height:1.895,photoInspired:true})};
}
