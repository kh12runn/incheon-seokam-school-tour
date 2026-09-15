import * as THREE from './외부도구/three.module.js';
import {class66Details} from './육학년육반표현.mjs';
// Original code-native bulletin artwork: no invented student names or copied photos.
function motif(ctx,type,x,y,size,color){
  ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=size*.09;
  if(type==='별'){
    ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=size*(i%2?.22:.48);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();
  }else if(type==='물결'){
    for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-size*.45,i*size*.22);ctx.bezierCurveTo(-size*.15,-size*.27+i*size*.22,size*.15,size*.27+i*size*.22,size*.45,i*size*.22);ctx.stroke();}
  }else if(type==='산'){
    ctx.beginPath();ctx.moveTo(-size*.5,size*.35);ctx.lineTo(-size*.06,-size*.4);ctx.lineTo(size*.2,size*.12);ctx.lineTo(size*.35,-size*.12);ctx.lineTo(size*.6,size*.35);ctx.closePath();ctx.fill();
  }else if(type==='무지개'){
    ['#cda39b',color,'#b1c4b0'].forEach((c,i)=>{ctx.strokeStyle=c;ctx.beginPath();ctx.arc(0,size*.3,size*(.45-i*.12),Math.PI,Math.PI*2);ctx.stroke();});
  }else if(type==='잎'){
    ctx.rotate(-.4);ctx.beginPath();ctx.ellipse(0,0,size*.23,size*.48,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f5f2e5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,size*.4);ctx.lineTo(0,-size*.28);ctx.stroke();
  }else if(type==='나비'){
    for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*size*.21,-size*.06,size*.22,size*.32,s*.4,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#796956';ctx.fillRect(-size*.03,-size*.22,size*.06,size*.55);
  }else{
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*size*.26,Math.sin(a)*size*.26,size*.2,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#efd994';ctx.beginPath();ctx.arc(0,0,size*.14,0,Math.PI*2);ctx.fill();
  }ctx.restore();
}
export function mainClassroomDetails(config){
  if(config.roomId==='4F_6-6'&&config.photoDetails)return class66Details(config);
  const {room,profile}=config,frame=config.architecturalFrame??config.frame,group=new THREE.Group();group.name=room.name+' 개별 게시판';
  const className=room.name.replace(' 교실',''),floor=room.bounds[4];
  function panel(w,h,x,y,z,angle,draw){
    const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d');draw(ctx,c.width,c.height);
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map}));
    mesh.position.set(x,z,-y);mesh.rotation.y=angle;group.add(mesh);return mesh;
  }
  const center=frame.point(5,-3.52);
  // A large class-specific title, illustration and differently organized work display.
  panel(5.5,1.12,room.bounds[1]-.30,center.y,floor+1.98,-Math.PI/2,(c,w,h)=>{
    c.fillStyle='#ecebdf';c.fillRect(0,0,w,h);c.fillStyle=profile.accent;c.fillRect(0,0,w,12);
    c.fillStyle='#364c45';c.font='bold 43px "Malgun Gothic",sans-serif';c.fillText(className+' · '+profile.theme,28,61);
    motif(c,profile.motif,105,h*.66,91,profile.accent);
    const cols=profile.boardLayout===0?6:profile.boardLayout===1?5:4;
    for(let i=0;i<cols;i++){
      const x=210+i*(w-245)/cols,y=82+(profile.boardLayout===2&&i%2?12:0),cw=(w-265)/cols-12;
      c.fillStyle=profile.lowerWall;c.fillRect(x-4,y-4,cw+8,84);c.fillStyle='#fffdf4';c.fillRect(x,y,cw,76);
      motif(c,profile.motif,x+cw/2,y+29,34,profile.accent);
      c.strokeStyle='#b5b9ab';c.lineWidth=2;c.beginPath();c.moveTo(x+10,y+55);c.lineTo(x+cw-10,y+55);c.stroke();
    }
    c.fillStyle='#647466';c.font='12px "Malgun Gothic",sans-serif';c.fillText('사진 반영 전 · 학급 구분용 임시 구성',210,h-10);
  });
  panel(.57,1.08,room.bounds[0]+.27,frame.point(0,-.61).y,floor+1.72,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#eeecde';c.fillRect(0,0,w,h);c.fillStyle=profile.accent;c.fillRect(0,0,w,40);
    c.fillStyle='#314c40';c.textAlign='center';c.font='bold 225px "Malgun Gothic",sans-serif';c.fillText(className,w/2,360);
    motif(c,profile.motif,w/2,760,390,profile.accent);
    c.font='80px "Malgun Gothic",sans-serif';c.fillText('우리 반',w/2,1190);
    c.fillStyle=profile.lowerWall;c.fillRect(130,1360,w-260,200);
  });
  // Small chalkboard corner identifier: visible when looking at the teaching wall.
  panel(1.65,.46,room.bounds[0]+.27,frame.point(0,-4.7).y,floor+2.02,Math.PI/2,(c,w,h)=>{
    c.fillStyle='#315e52';c.fillRect(0,0,w,h);c.fillStyle='#efeddb';c.font='bold 110px "Malgun Gothic",sans-serif';c.fillText(className+' 교실',36,h*.68);
  });
  const latch=new THREE.InstancedMesh(new THREE.CylinderGeometry(.044,.044,.013,12),new THREE.MeshStandardMaterial({color:'#474c49',metalness:.65,roughness:.3}),24);
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
  for(let row=0;row<3;row++)for(let col=0;col<8;col++){
    const p=frame.point(9.26,-6.36+col*.705+.34,.23+row*.35);
    if(frame.width>10)p.x=room.bounds[1]-.74;
    matrix.compose(new THREE.Vector3(p.x,p.z,-p.y),q,new THREE.Vector3(1,1,1));latch.setMatrixAt(row*8+col,matrix);
  }
  latch.instanceMatrix.needsUpdate=true;group.add(latch);
  if(config.layoutRotation===Math.PI){
    group.rotation.y=Math.PI;group.position.set(room.bounds[0]+room.bounds[1],0,-room.bounds[2]-room.bounds[3]);
  }
  return group;
}
