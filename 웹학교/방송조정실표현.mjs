import * as THREE from './외부도구/three.module.js';
// Generated teaching decoration: no faces, handwriting or private paperwork
// from the reference photographs are embedded in the public runtime.
export function controlRoomDetails(config){
  const group=new THREE.Group();group.name='방송 조정실 안내와 학습 보드';
  if(!config.control)return group;
  const plane=(name,w,h,x,v,z,rotation,draw)=>{
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=384;draw(canvas.getContext('2d'));
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));
    mesh.name=name;mesh.position.set(x,3.4+z,v);mesh.rotation.y=rotation;group.add(mesh);return mesh;
  };
  const title=(ctx,text,bg='#e1e8dc',fg='#354b4c')=>{ctx.fillStyle=bg;ctx.fillRect(0,0,768,384);ctx.fillStyle=fg;ctx.font='bold 84px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillText(text,384,218);};
  plane('조정실 입구 안내',1.1,.23,58.8,.16,2.59,0,ctx=>title(ctx,'방송 조정실'));
  plane('스튜디오 연결 안내',.85,.21,60.20,1.025,2.56,-Math.PI/2,ctx=>title(ctx,'스튜디오 →'));
  plane('조정실 보드 작품',1.1,.77,56.235,4.42,1.83,Math.PI/2,ctx=>{
    ctx.fillStyle='#e9eedf';ctx.fillRect(0,0,768,384);
    for(let i=0;i<8;i++){
      const x=30+(i%4)*185,y=20+Math.floor(i/4)*180;
      ctx.fillStyle='#f8f6e8';ctx.fillRect(x,y,163,155);ctx.strokeStyle='#aab3a8';ctx.strokeRect(x,y,163,155);
      ctx.fillStyle=['#aabfd3','#c7ae7e','#a9be90','#cfb2b2'][i%4];
      ctx.beginPath();ctx.arc(x+82,y+72,43,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#566b6b';ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle='#53656a';ctx.font='24px sans-serif';ctx.textAlign='center';ctx.fillText(['가','나','다','라','마','바','사','아'][i],x+82,y+81);
    }
  });
  plane('입구 보드 안내',1.32,.70,57.03,.222,1.72,0,ctx=>{
    title(ctx,'함께 배우는 방송','#e5ebdd','#5b7472');ctx.font='40px "Malgun Gothic",sans-serif';ctx.fillText('듣고 · 생각하고 · 이야기해요',384,300);
  });
  const clockCanvas=document.createElement('canvas');clockCanvas.width=clockCanvas.height=256;
  const ctx=clockCanvas.getContext('2d');ctx.fillStyle='#4e8597';ctx.beginPath();ctx.arc(128,128,124,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d8e5db';ctx.beginPath();ctx.arc(128,128,105,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#3d5965';ctx.lineWidth=5;for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(128+Math.sin(a)*91,128-Math.cos(a)*91);ctx.lineTo(128+Math.sin(a)*99,128-Math.cos(a)*99);ctx.stroke();}
  ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(90,99);ctx.lineTo(128,128);ctx.lineTo(175,79);ctx.stroke();
  const map=new THREE.CanvasTexture(clockCanvas);map.colorSpace=THREE.SRGBColorSpace;
  const clock=new THREE.Mesh(new THREE.CircleGeometry(.17,40),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));clock.rotation.y=Math.PI/2;clock.position.set(56.23,5.63,1.42);group.add(clock);
  group.userData.photoReference=config.control.reference;return group;
}
