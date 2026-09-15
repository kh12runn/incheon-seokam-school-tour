import * as THREE from './외부도구/three.module.js';
import {classroomTVPose} from './교실영상기기.mjs';
// Code-native reinterpretation of the photographed displays. No faces, names,
// class photograph, handwriting or other personal details are copied to assets.
export function class66Details(config){
  const {frame,photoDetails}=config,group=new THREE.Group();group.name='6-6 사진 관찰 세부';
  group.userData.photoReference={roomId:config.roomId,count:6,method:'photo-guided-geometry-and-canvas'};
  const paperColors=['#e8d576','#b9d4cd','#c5b4d6','#c88f9e','#a8c5d4','#e5c2a7'];
  function panel(name,w,h,x,y,z,angle,draw,transparent=false){
    const canvas=document.createElement('canvas'),dw=1024,dh=Math.max(128,Math.round(1024*h/w)),scale=Math.min(1,1024/dh);
    canvas.width=Math.round(dw*scale);canvas.height=Math.round(dh*scale);
    const context=canvas.getContext('2d');context.scale(scale,scale);draw(context,dw,dh);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
    const p=frame.point(x,y,z),mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,roughness:.9,transparent}));
    mesh.name=name;mesh.position.set(p.x,p.z,-p.y);mesh.rotation.y=angle;group.add(mesh);return mesh;
  }
  function bear(c,x,y,size,color){
    c.save();c.translate(x,y);c.fillStyle=color;
    for(const [a,b,r] of [[-.24,-.28,.14],[.24,-.28,.14],[0,-.12,.3],[0,.28,.3],[-.3,.23,.13],[.3,.23,.13],[-.2,.55,.14],[.2,.55,.14]]){c.beginPath();c.arc(a*size,b*size,r*size,0,Math.PI*2);c.fill();}
    c.fillStyle='#e6d5b4';c.beginPath();c.ellipse(0,size*.3,size*.17,size*.20,0,0,Math.PI*2);c.fill();
    c.fillStyle='#41443c';for(const x of [-.105,.105]){c.beginPath();c.arc(x*size,-.16*size,size*.025,0,Math.PI*2);c.fill();}c.fillRect(-size*.032,-size*.07,size*.064,size*.035);c.restore();
  }
  panel('두 줄 곰 그림 게시판',5.50,1.12,9.705,-3.52,1.98,-Math.PI/2,(c,w,h)=>{
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#aac9cc');sky.addColorStop(.8,'#e0e8cb');sky.addColorStop(1,'#97b677');c.fillStyle=sky;c.fillRect(0,0,w,h);
    c.fillStyle='#345942';c.textAlign='center';c.font='bold 26px "Malgun Gothic",sans-serif';c.fillText('즐 거 운 교 실',w/2,27);
    c.strokeStyle='#686c57';c.lineWidth=1.5;c.beginPath();c.moveTo(12,12);c.quadraticCurveTo(w/2,40,w-12,12);c.stroke();
    for(let i=0;i<26;i++){if(i>=10&&i<=16)continue;const x=18+i*38;c.fillStyle='#eeeee3';c.fillRect(x,24+(i%3)*2,21,17);c.fillStyle='#a1ada3';c.fillRect(x+8,26+(i%3)*2,5,8);}
    const colors=['#589e9d','#b78e4f','#8c7759','#547da1','#866790','#4b8566'];
    for(let row=0;row<2;row++)for(let col=0;col<12;col++){
      const x=24+col*82,y=55+row*70;c.fillStyle=paperColors[(row+col)%6];c.fillRect(x,y,62,62);c.fillStyle='#faf6e9';c.fillRect(x+8,y+5,46,53);
      if(!(row===1&&col===4)&&col!==11)bear(c,x+31,y+27,37,colors[(col+row*2)%6]);
    }
  });
  panel('복도 쪽 파스텔 꽃 게시판',1.65,.76,5.95,-.255,1.84,0,(c,w,h)=>{
    c.fillStyle='#ad8f5d';c.fillRect(0,0,w,h);
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      const x=110+col*195,y=83+row*132;c.fillStyle=paperColors[(row+col)%6];
      for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.arc(x+Math.cos(a)*25,y+Math.sin(a)*25,26,0,Math.PI*2);c.fill();}c.beginPath();c.arc(x,y,26,0,Math.PI*2);c.fill();
    }
  });
  panel('앞 노란 일정 게시판',.57,1.08,.267,-.61,1.72,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#e3ebd4';c.fillRect(0,0,w,h);c.fillStyle='#688667';c.fillRect(0,0,w,170);c.fillStyle='#faf8e7';c.textAlign='center';c.font='bold 170px sans-serif';c.fillText('6-6',w/2,150);
    for(let row=0;row<9;row++)for(let col=0;col<5;col++){c.fillStyle=row%2?'#f3df7e':'#e6c74c';c.fillRect(48+col*187,300+row*154,170,137);}
    c.fillStyle='#f8f5e9';c.fillRect(85,1750,840,90);
  });
  panel('왼쪽 수업 순서',.38,1.16,.268,-6.10,1.73,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#344e44';c.fillRect(0,0,w,h);for(let i=0;i<7;i++){c.fillStyle=i%2?'#dcd6bd':'#f0eee0';c.fillRect(100,160+i*395,w-200,240);}
  });
  panel('이름 없는 칠판 세부',4.55,1.34,.271,-3.385,1.66,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#315e52';c.fillRect(0,0,w,h);
    for(let i=0;i<320;i++){const x=(i*83.13)%w,y=(i*41.79)%h;c.strokeStyle='rgba(220,224,199,.025)';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x+20+(i%8)*8,y+2);c.stroke();}
    c.fillStyle='#d8dece';c.font='24px "Malgun Gothic",sans-serif';c.fillText('6학년 6반',w-180,30);
    for(let i=0;i<6;i++){c.fillStyle=i%2?'#d7d8c5':'#b2c6ab';c.fillRect(22,42+i*27,64,19);}
    for(let i=0;i<4;i++){c.fillStyle=['#b7a169','#bb6671','#91b1bb','#b6bd9f'][i];c.beginPath();c.arc(106+i*15,h-25,4,0,Math.PI*2);c.fill();}
  });
  panel('칠판 위 태극기',.60,.40,.275,-3.40,2.79,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#775840';c.fillRect(0,0,w,h);c.fillStyle='#f1f0e7';c.fillRect(22,22,w-44,h-44);
    const cx=w/2,cy=h/2,r=h*.23;c.fillStyle='#b43f53';c.beginPath();c.arc(cx,cy,r,Math.PI,0);c.fill();c.fillStyle='#345a91';c.beginPath();c.arc(cx,cy,r,0,Math.PI);c.fill();
    c.fillStyle='#b43f53';c.beginPath();c.arc(cx-r/2,cy,r/2,0,Math.PI*2);c.fill();c.fillStyle='#345a91';c.beginPath();c.arc(cx+r/2,cy,r/2,0,Math.PI*2);c.fill();
    for(const [x,y,a,broken] of [[.24,.27,-.6,[false,false,false]],[.76,.73,-.6,[true,true,true]],[.76,.27,.6,[true,false,true]],[.24,.73,.6,[false,true,false]]]){
      c.save();c.translate(w*x,h*y);c.rotate(a);c.fillStyle='#343839';
      broken.forEach((split,i)=>{const yy=(i-1)*25;if(split){c.fillRect(-62,yy,54,15);c.fillRect(8,yy,54,15);}else c.fillRect(-62,yy,124,15);});c.restore();
    }
  });
  const tv=panel('개인사진 없는 교실 화면',1.22,.68,1.665,-6.528,2.25,Math.PI,(c,w,h)=>{
    c.fillStyle='#689bba';c.fillRect(0,0,w,h);c.fillStyle='#c5d9ce';c.fillRect(0,h*.7,w,h*.3);c.fillStyle='#f4eee0';c.textAlign='center';c.font='bold 84px "Malgun Gothic",sans-serif';c.fillText('6-6 교실',w/2,h*.47);
  });
  const tvPose=classroomTVPose(config.room);
  tv.position.set(tvPose.x+tvPose.normal[0]*.098,tvPose.z,-tvPose.y-tvPose.normal[1]*.098);
  tv.rotation.y=Math.atan2(tvPose.normal[0],-tvPose.normal[1]);
  panel('창가 흰 시계',.38,.38,4.95,-6.69,2.62,Math.PI,(c,w,h)=>{
    c.fillStyle='#999d95';c.beginPath();c.arc(w/2,h/2,w*.49,0,Math.PI*2);c.fill();c.fillStyle='#efeee4';c.beginPath();c.arc(w/2,h/2,w*.46,0,Math.PI*2);c.fill();
    c.fillStyle='#52594f';c.textAlign='center';c.textBaseline='middle';c.font='95px sans-serif';
    for(let i=1;i<=12;i++){const a=i*Math.PI/6-Math.PI/2;c.fillText(i,w/2+Math.cos(a)*w*.36,h/2+Math.sin(a)*h*.36);}
    c.strokeStyle='#454c43';c.lineWidth=17;c.beginPath();c.moveTo(w*.30,h*.27);c.lineTo(w/2,h/2);c.lineTo(w*.75,h*.37);c.stroke();
  },true);
  // Four guarded ceiling fans, observed across the six photographs.
  const white=new THREE.MeshStandardMaterial({color:'#d6d8d0',roughness:.75});
  for(const x of [2.8,7.25])for(const y of [-5.15,-1.85]){
    const p=frame.point(x,y,2.88),fan=new THREE.Group();fan.name='천장 보호망 선풍기';fan.position.set(p.x,p.z,-p.y);group.add(fan);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.19,10),white);stem.position.y=.10;fan.add(stem);
    const hub=new THREE.Mesh(new THREE.SphereGeometry(.085,12,8),white);hub.scale.y=.6;fan.add(hub);
    for(let i=0;i<4;i++){const a=i*Math.PI/2,blade=new THREE.Mesh(new THREE.BoxGeometry(.30,.018,.11),white);blade.rotation.y=-a;blade.position.set(Math.cos(a)*.16,0,Math.sin(a)*.16);fan.add(blade);}
    for(const r of [.19,.31]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.005,4,40),white);ring.rotation.x=Math.PI/2;ring.position.y=-.07;fan.add(ring);}
    for(let i=0;i<6;i++){const wire=new THREE.Mesh(new THREE.BoxGeometry(.62,.006,.006),white);wire.rotation.y=i*Math.PI/6;wire.position.y=-.07;fan.add(wire);}
  }
  // Batch identical fan components: four fans need six draw calls, not 56.
  group.updateMatrixWorld(true);
  const batches=new Map();
  group.traverse(mesh=>{if(!mesh.isMesh||mesh.material!==white)return;
    const key=mesh.geometry.type+JSON.stringify(mesh.geometry.parameters);
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);
  });
  for(const meshes of batches.values()){
    const instanced=new THREE.InstancedMesh(meshes[0].geometry,white,meshes.length);instanced.name='6-6 선풍기 반복 부품';
    meshes.forEach((mesh,i)=>{instanced.setMatrixAt(i,mesh.matrixWorld);mesh.removeFromParent();if(i)mesh.geometry.dispose();});
    instanced.instanceMatrix.needsUpdate=true;instanced.computeBoundingSphere();group.add(instanced);
  }
  const latch=new THREE.InstancedMesh(new THREE.CylinderGeometry(.041,.041,.015,12),new THREE.MeshStandardMaterial({color:'#464a42',metalness:.65,roughness:.3}),photoDetails.latches.length);
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
  photoDetails.latches.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.x,p.z,-p.y),q,new THREE.Vector3(1,1,1));latch.setMatrixAt(i,matrix);});latch.instanceMatrix.needsUpdate=true;group.add(latch);
  return group;
}
