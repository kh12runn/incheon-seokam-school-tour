import * as THREE from './외부도구/three.module.js';
// Re-drawn classroom displays, not photographs: no pupil faces, names or handwriting.
export function class34Details(config){
  const {frame,photoDetails}=config,group=new THREE.Group();group.name='3-4 사진 관찰 세부';
  group.userData.photoReference={roomId:config.roomId,count:6,method:'photo-guided-geometry-and-canvas'};
  function panel(name,w,h,x,y,z,angle,draw,transparent=false){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(128,Math.min(1024,Math.round(1024*h/w)));
    const c=canvas.getContext('2d');draw(c,canvas.width,canvas.height);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,roughness:.9,transparent})),p=frame.point(x,y,z);
    mesh.name=name;mesh.position.set(p.x,p.z,-p.y);mesh.rotation.y=angle;group.add(mesh);return mesh;
  }
  panel('중앙 흰 칠판과 양쪽 초록 시간표',4.55,1.34,.282,-3.385,1.66,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#294b40';c.fillRect(0,0,w,h);c.fillStyle='#eef0e8';c.fillRect(w*.19,0,w*.65,h);
    c.fillStyle='#54615a';c.font='22px "Malgun Gothic",sans-serif';c.fillText('3학년 4반',w*.25,36);
    c.textAlign='center';const colors=['#7294b9','#81b4bd','#9ec597','#ddcb84'];
    for(let i=0;i<6;i++){c.fillStyle=colors[i%4];c.fillRect(20,25+i*37,118,26);c.fillStyle='#f4f5e9';c.font='15px sans-serif';c.fillText((i+1)+'교시',79,44+i*37);}
    c.fillStyle='#a8c2ba';c.fillRect(w*.87,30,w*.105,h*.55);c.fillStyle='#f7f4e5';c.fillRect(w*.87,h*.69,w*.105,h*.24);
    c.fillStyle='#d8debf';for(let i=0;i<4;i++){c.beginPath();c.arc(245+i*23,h-20,5,0,Math.PI*2);c.fill();}
  });
  panel('마음 신호등 안내',.72,1.18,.28,-6.17,1.70,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#f0ecd7';c.fillRect(0,0,w,h);c.fillStyle='#536d59';c.textAlign='center';c.font='bold 96px sans-serif';c.fillText('마음 신호등',w/2,130);
    ['멈추기','생각하기','표현하기'].forEach((text,i)=>{c.fillStyle=['#bf7268','#d8bf62','#8bad7b'][i];c.beginPath();c.arc(160,330+i*265,100,0,Math.PI*2);c.fill();c.fillStyle='#4b5c50';c.font='80px sans-serif';c.fillText(text,630,360+i*265);});
  });
  panel('앞쪽 학급 안내판',.57,1.08,.28,-.61,1.72,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#e5e4d7';c.fillRect(0,0,w,h);c.textAlign='center';c.fillStyle='#536854';c.font='bold 124px sans-serif';c.fillText('3-4',w/2,145);
    for(let r=0;r<3;r++)for(let k=0;k<2;k++){const x=60+k*490,y=210+r*230;c.fillStyle='#f9f6e8';c.fillRect(x,y,410,184);c.fillStyle='#ae985d';c.beginPath();c.arc(x+100,y+82,39,0,Math.PI*2);c.fill();c.strokeStyle='#939b8a';c.lineWidth=8;c.beginPath();c.moveTo(x+170,y+68);c.lineTo(x+345,y+68);c.moveTo(x+170,y+109);c.lineTo(x+315,y+109);c.stroke();}
  });
  panel('하늘 잔디 배경 두 줄 작품 게시판',5.52,1.12,9.705,-3.52,1.98,-Math.PI/2,(c,w,h)=>{
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#8dbecb');sky.addColorStop(.74,'#c6e1de');sky.addColorStop(.75,'#b1c584');sky.addColorStop(1,'#90ab60');c.fillStyle=sky;c.fillRect(0,0,w,h);
    c.fillStyle='#f1f0df';for(let i=0;i<47;i++){c.beginPath();c.arc(i*23,0,13,0,Math.PI);c.fill();}
    // Approximate the arrangement, using non-identifying abstract pupil artwork.
    for(let row=0;row<2;row++)for(let col=0;col<10;col++){
      const x=106+col*87,y=34+row*64;c.fillStyle=['#ced7b8','#deb7bd','#d6cba7'][col%3];c.fillRect(x-3,y-3,72,53);c.fillStyle='#f7f4e8';c.fillRect(x,y,66,47);
      c.strokeStyle=['#789e87','#b77e83','#7093a5','#b3a165'][col%4];c.lineWidth=2;c.beginPath();c.moveTo(x+12,y+35);c.lineTo(x+27,y+13);c.lineTo(x+48,y+34);c.closePath();c.stroke();c.fillStyle='#a8b79d';c.beginPath();c.arc(x+48,y+12,4,0,Math.PI*2);c.fill();
    }
    for(let row=0;row<3;row++)for(let col=0;col<4;col++){const x=15+col*20,y=35+row*34;c.fillStyle=['#d0b965','#8da9bf','#b88a9f'][row];c.fillRect(x,y+10,10,17);c.fillStyle='#e5d4b7';c.beginPath();c.arc(x+5,y+5,6,0,Math.PI*2);c.fill();}
    c.fillStyle='#435c47';c.font='15px "Malgun Gothic",sans-serif';c.textAlign='right';c.fillText('3학년 4반 · 우리들의 작품',w-18,h-10);
  });
  panel('칠판 위 태극기',.62,.40,.28,-3.38,2.79,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#725b43';c.fillRect(0,0,w,h);c.fillStyle='#f3f1e7';c.fillRect(25,25,w-50,h-50);const x=w/2,y=h/2,r=h*.23;
    c.fillStyle='#b94f60';c.beginPath();c.arc(x,y,r,Math.PI,0);c.fill();c.fillStyle='#436599';c.beginPath();c.arc(x,y,r,0,Math.PI);c.fill();
    c.fillStyle='#b94f60';c.beginPath();c.arc(x-r/2,y,r/2,0,Math.PI*2);c.fill();c.fillStyle='#436599';c.beginPath();c.arc(x+r/2,y,r/2,0,Math.PI*2);c.fill();
    for(const [a,b,angle,split] of [[.24,.25,-.6,[0,0,0]],[.76,.75,-.6,[1,1,1]],[.76,.25,.6,[1,0,1]],[.24,.75,.6,[0,1,0]]]){c.save();c.translate(w*a,h*b);c.rotate(angle);c.fillStyle='#323a38';split.forEach((v,i)=>{if(v){c.fillRect(-57,i*23,49,14);c.fillRect(8,i*23,49,14);}else c.fillRect(-57,i*23,114,14);});c.restore();}
  });
  panel('창가 기둥의 둥근 시계',.38,.38,5,-6.78,2.24,Math.PI,(c,w,h)=>{
    c.fillStyle='#ae9876';c.beginPath();c.arc(w/2,h/2,w*.49,0,Math.PI*2);c.fill();c.fillStyle='#eeede0';c.beginPath();c.arc(w/2,h/2,w*.445,0,Math.PI*2);c.fill();c.fillStyle='#536057';c.font='78px sans-serif';c.textAlign='center';c.textBaseline='middle';
    for(let i=1;i<=12;i++){const a=i*Math.PI/6-Math.PI/2;c.fillText(i,w/2+Math.cos(a)*w*.35,h/2+Math.sin(a)*h*.35);}c.strokeStyle='#48544b';c.lineWidth=16;c.beginPath();c.moveTo(w*.50,h*.27);c.lineTo(w*.5,h*.5);c.lineTo(w*.72,h*.55);c.stroke();
  },true);
  const metal=new THREE.MeshStandardMaterial({color:'#d0d5ca',roughness:.65}),dark=new THREE.MeshStandardMaterial({color:'#535e5c',metalness:.6,roughness:.4});
  const matrices=[],matrix=new THREE.Matrix4(),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
  for(const p of photoDetails.latches){matrix.compose(new THREE.Vector3(p.x,p.z,-p.y),q,new THREE.Vector3(1,1,1));matrices.push(matrix.clone());}
  const handles=new THREE.InstancedMesh(new THREE.CylinderGeometry(.037,.037,.014,12),dark,matrices.length);matrices.forEach((m,i)=>handles.setMatrixAt(i,m));handles.instanceMatrix.needsUpdate=true;group.add(handles);
  // Four small guarded ceiling fans, using shared geometries/materials.
  const stemGeometry=new THREE.CylinderGeometry(.025,.025,.16,8),bladeGeometry=new THREE.BoxGeometry(.28,.02,.09),ringGeometry=new THREE.TorusGeometry(.25,.006,4,32),wireGeometry=new THREE.BoxGeometry(.50,.005,.005);
  for(const x of [2.8,7.3])for(const y of [-5.25,-1.85]){
    const p=frame.point(x,y,2.91),fan=new THREE.Group();fan.name='3-4 천장 보호망 선풍기';fan.position.set(p.x,p.z,-p.y);group.add(fan);
    const stem=new THREE.Mesh(stemGeometry,metal);stem.position.y=.08;fan.add(stem);
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3,blade=new THREE.Mesh(bladeGeometry,metal);blade.position.set(Math.cos(a)*.12,-.055,Math.sin(a)*.12);blade.rotation.y=-a;fan.add(blade);}
    const ring=new THREE.Mesh(ringGeometry,metal);ring.rotation.x=Math.PI/2;ring.position.y=-.08;fan.add(ring);
    for(let i=0;i<4;i++){const wire=new THREE.Mesh(wireGeometry,metal);wire.rotation.y=i*Math.PI/4;wire.position.y=-.085;fan.add(wire);}
  }
  return group;
}
