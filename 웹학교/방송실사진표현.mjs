import * as THREE from './외부도구/three.module.js';
import {controlRoomDetails} from './방송조정실표현.mjs';
export function broadcastRoomDetails(config){
  const group=new THREE.Group();group.name='사진참고 방송실 원탁과 방송장비';
  const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.65,...extra});
  const wood=material('#c6af85'),metal=material('#a9b7b8',{metalness:.75,roughness:.28}),black=material('#242e32'),red=material('#9e5264'),burgundy=material('#743343'),dark=material('#41464a');
  const sphere=new THREE.SphereGeometry(1,16,10),box=new THREE.BoxGeometry(1,1,1);
  const scaleX=config.studioTransform?.scaleX??1,originX=config.studioTransform?.originX??56;
  const mapX=x=>originX+(x-56)*scaleX;
  const put=(geometry,mat,x,v,z,sx=1,sy=1,sz=1,parent=group)=>{const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(mapX(56+x),3.4+z,v);mesh.scale.set(sx*scaleX,sy,sz);parent.add(mesh);return mesh;};
  const cylinder=(r,h,mat,x,v,z)=>put(new THREE.CylinderGeometry(r,r,h,48),mat,x,v,z,1/scaleX);
  const rounded=(w,h,d,r)=>{const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,steps:1,curveSegments:6});g.translate(0,0,-d/2);return g;};
  const seatShape=rounded(.50,.47,.062,.075),backShape=rounded(.49,.41,.035,.08),frameShape=rounded(.53,.45,.045,.08),chairFrame=material('#778183',{roughness:.66});
  const rod=(a,b,r,mat=metal,parent=group)=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);if(parent===group){start.x=mapX(start.x);end.x=mapX(end.x);}const d=end.clone().sub(start),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),8),mat);
    mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(mesh);return mesh;
  };
  const {table}=config;
  const unmapX=x=>56+(x-originX)/scaleX;
  cylinder(table.radius,.055,wood,unmapX(table.x)-56,-table.y,.765);
  // Foldable round table: centre join and crossed metal underframe from the photo.
  put(box,material('#b6a17d'),unmapX(table.x)-56,-table.y,.794,.010/scaleX,.003,table.radius*1.98);
  const leg=table.radius*.6;
  for(const dx of [-leg,leg])for(const dv of [-leg,leg])rod([unmapX(table.x+dx),3.43,-table.y+dv],[unmapX(table.x+dx*.45),4.13,-table.y+dv*.45],.027,black);
  rod([unmapX(table.x-leg),3.60,-table.y-leg],[unmapX(table.x+leg),3.60,-table.y+leg],.025,black);
  for(const c of [...config.chairs,...(config.control?.chairs??[])]){
    const root=new THREE.Group();root.position.set(c.x,c.z,-c.y);root.rotation.y=c.angle;group.add(root);
    const shell=c.color==='#41464a'?dark:c.color==='#984a5d'?burgundy:red;
    const seat=new THREE.Mesh(seatShape,shell);seat.position.y=.45;seat.rotation.x=-Math.PI/2;root.add(seat);
    const frame=new THREE.Mesh(frameShape,chairFrame);frame.position.set(0,.715,.21);frame.rotation.x=-.08;root.add(frame);
    const back=new THREE.Mesh(backShape,shell);back.position.set(0,.72,.177);back.rotation.x=-.08;root.add(back);
    for(const x of [-.225,.225]){
      rod([x,.03,-.22],[x,.43,-.16],.020,metal,root);
      rod([x,.03,.25],[x,.69,.20],.020,metal,root);
      rod([x,.43,-.16],[x,.43,.20],.023,metal,root);
    }
  }
  const acrylic=material('#cbdcdb',{transparent:true,opacity:.38,roughness:.15,metalness:.15});
  put(box,acrylic,7.375,.79,.07,.57,.07,.57);
  for(const x of [7.19,7.56])put(box,acrylic,x,.79,.64,.065,1.10,.27);
  const top=put(box,acrylic,7.375,.79,1.20,.60,.055,.44);top.rotation.x=-.13;
  // Desktop gooseneck mic and small base; no photo billboard on any 3D object.
  const base=cylinder(.10,.026,black,5.05,1.17,.878);base.scale.z=.8;
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(mapX(61.05),4.29,1.17),new THREE.Vector3(mapX(61.05),4.54,1.12),new THREE.Vector3(mapX(61.04),4.73,.94),new THREE.Vector3(mapX(61.04),4.91,.87)]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,18,.011,6,false),black));
  put(sphere,black,5.04,.87,1.53,.035,.065,.035);
  const canvasPlane=(w,h,x,v,z,draw)=>{
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;draw(canvas.getContext('2d'));
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w*scaleX,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));mesh.position.set(mapX(56+x),3.4+z,v);group.add(mesh);return mesh;
  };
  canvasPlane(2.78,1.53,5.255,.239,1.79,ctx=>{
    ctx.fillStyle='#81b9d9';ctx.fillRect(0,0,1024,512);
    ctx.fillStyle='#e5eff0';for(const [x,y,r] of [[60,445,90],[140,465,105],[890,470,100],[990,448,90]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<18;i++){ctx.fillStyle=i%2?'#78a14e':'#548749';ctx.beginPath();ctx.ellipse(30+i*57,24+(i%3)*10,38,12,(i%2?1:-1)*.65,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#faf8e1';ctx.font='bold 43px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillText('즐겁게 어울리는 행복배움터 석암',512,160);
    ctx.fillStyle='#bcba52';ctx.beginPath();ctx.arc(512,248,47,0,Math.PI*2);ctx.fill();ctx.fillStyle='#655187';ctx.font='bold 30px "Malgun Gothic",sans-serif';ctx.fillText('석암',512,259);
  });
  canvasPlane(3.10,.30,5.255,.245,2.85,ctx=>{ctx.fillStyle='#b7ab94';ctx.fillRect(0,0,1024,512);ctx.fillStyle='#294f3b';ctx.font='bold 64px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.save();ctx.scale(1,4);ctx.fillText('석암에서 배워서 세계로 나가자!',512,89);ctx.restore();});
  canvasPlane(1.45,.36,5.235,1.47,.50,ctx=>{ctx.fillStyle='#dad8bf';ctx.fillRect(0,0,1024,512);ctx.fillStyle='#3c544b';ctx.font='bold 94px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.save();ctx.scale(1,2);ctx.fillText('인천석암초등학교',512,165);ctx.restore();});
  for(const x of [3.73,6.84]){
    cylinder(.17,.035,metal,x,.52,.043);cylinder(.095,.07,metal,x,.52,.09);cylinder(.015,2.39,metal,x,.52,1.30);put(sphere,wood,x,.52,2.54,.037,.054,.037);
  }
  canvasPlane(.58,1.02,3.73,.545,1.93,ctx=>{
    ctx.fillStyle='#eeeadd';ctx.fillRect(0,0,1024,512);ctx.save();ctx.translate(512,256);ctx.rotate(-.5);
    ctx.fillStyle='#c55350';ctx.beginPath();ctx.arc(0,0,104,Math.PI,0);ctx.arc(52,0,52,0,Math.PI);ctx.arc(-52,0,52,0,Math.PI,true);ctx.fill();
    ctx.fillStyle='#487ba5';ctx.beginPath();ctx.arc(0,0,104,0,Math.PI);ctx.arc(-52,0,52,Math.PI,0);ctx.arc(52,0,52,Math.PI,0,true);ctx.fill();ctx.restore();
    const bars=[[290,113,-.5,[0,0,0]],[733,113,.5,[1,0,1]],[290,400,.5,[0,1,0]],[733,400,-.5,[1,1,1]]];
    ctx.fillStyle='#2c3435';for(const [x,y,a,pattern] of bars){ctx.save();ctx.translate(x,y);ctx.rotate(a);for(let i=0;i<3;i++){if(pattern[i]){ctx.fillRect(-55,i*21-27,48,13);ctx.fillRect(7,i*21-27,48,13);}else ctx.fillRect(-55,i*21-27,110,13);}ctx.restore();}
  });
  canvasPlane(.54,1.05,6.84,.545,1.915,ctx=>{ctx.fillStyle='#273b34';ctx.fillRect(0,0,1024,512);ctx.strokeStyle='#c5ad5f';ctx.lineWidth=20;ctx.strokeRect(12,12,1000,488);ctx.fillStyle='#bdae55';ctx.beginPath();ctx.arc(512,210,96,0,Math.PI*2);ctx.fill();ctx.fillStyle='#736180';ctx.font='bold 66px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.fillText('석암',512,232);ctx.fillStyle='#dfce83';ctx.font='bold 43px "Malgun Gothic",sans-serif';ctx.fillText('인천석암초등학교',512,391);});
  group.add(controlRoomDetails(config));group.userData.photoReference=config.reference;return group;
}
