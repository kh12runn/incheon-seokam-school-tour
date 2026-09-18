import * as THREE from './외부도구/three.module.js';
import {COMPUTER_GATE} from './이학년일반.mjs';
// Recreated artwork, not photographs: no people, pupil names or mirror portraits.
export function class21Details(config){
  const group=new THREE.Group();group.name='2-1 사진 참고 게시물 및 소품';
  function panel(name,u,v,h,w,height,angle,draw){
    const c=document.createElement('canvas');c.width=1536;c.height=Math.round(1536*height/w);
    const ctx=c.getContext('2d');draw(ctx,c.width,c.height);
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,height),new THREE.MeshStandardMaterial({map,roughness:.85}));
    const p=config.point(u,v,h);mesh.position.set(p.x,p.z,-p.y);mesh.rotation.y=angle;mesh.name=name;group.add(mesh);return mesh;
  }
  const text=(c,s,x,y,size,color='#334940')=>{c.fillStyle=color;c.font=`bold ${size}px "Malgun Gothic",sans-serif`;c.textAlign='center';c.fillText(s,x,y);};
  panel('해바라기 사계절 뒤 게시판',6.52,4,2.055,6.88,1.36,Math.PI,(c,w,h)=>{
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#a2cedf');g.addColorStop(.8,'#d9e6de');g.addColorStop(1,'#98b176');c.fillStyle=g;c.fillRect(0,0,w,h);
    ['봄','여름','가을','겨울'].forEach((s,i)=>{c.fillStyle=['#e4bdd2','#a8c698','#dfa776','#b3c4e5'][i];c.fillRect(18+(i%2)*112,60+Math.floor(i/2)*96,104,80);text(c,s,70+(i%2)*112,116+Math.floor(i/2)*96,32);});
    for(let i=0;i<18;i++){
      const x=282+i%9*108,y=58+Math.floor(i/9)*128;
      c.fillStyle=['#f1dbd6','#e3e6ad','#d3e4de','#e2d5e9'][i%4];c.fillRect(x,y,94,118);
      c.strokeStyle='#689257';c.lineWidth=4;c.beginPath();c.moveTo(x+47,y+67);c.lineTo(x+47,y+108);c.stroke();
      c.fillStyle='#69985e';c.beginPath();c.ellipse(x+59,y+91,14,5,-.6,0,Math.PI*2);c.fill();
      for(let p=0;p<12;p++){const a=p*Math.PI/6;c.fillStyle=i%5===0?'#f0e8c7':'#ddbd49';c.beginPath();c.ellipse(x+47+Math.cos(a)*23,y+44+Math.sin(a)*23,16,6,a,0,Math.PI*2);c.fill();}
      c.fillStyle=i%3?'#73583b':'#b38b60';c.beginPath();c.arc(x+47,y+44,15,0,Math.PI*2);c.fill();
    }
    for(let i=0;i<20;i++){
      const x=w-230+(i%4)*53,y=65+Math.floor(i/4)*48;c.fillStyle='#f1eadb';c.fillRect(x,y,47,42);c.strokeStyle=['#ab8380','#829aaf','#a69c74'][i%3];c.lineWidth=3;c.strokeRect(x+11,y+10,24,24);c.strokeRect(x+17,y+5,12,6);
    }
    for(let i=0;i<24;i++){const x=i*w/24;c.fillStyle=['#e9c4c3','#dbcda4','#b6c8d6'][i%3];c.beginPath();c.moveTo(x,5);c.lineTo(x+48,5);c.lineTo(x+24,32);c.fill();}
  });
  panel('학급 약속',.257,1.8,1.74,1.02,1.27,0,(c,w,h)=>{
    c.fillStyle='#bcdce5';c.fillRect(0,0,w,h);c.fillStyle='#9bb67d';c.fillRect(0,h*.82,w,h*.18);
    text(c,'학급 약속',w/2,h*.15,140);['서로 배려해요','바르게 인사해요','함께 도와요','안전하게 지내요'].forEach((s,i)=>{const y=h*(.24+i*.125);c.fillStyle=['#ebd0d0','#eee1ac','#d1ded0','#ded0e3'][i];c.fillRect(w*.08,y,w*.84,h*.1);text(c,s,w/2,y+h*.073,80);});
    text(c,'2학년 1반',w/2,h*.92,108);
  });
  panel('화이트보드 수업 표식',.25,4.1,1.72,2.95,1.18,0,(c,w,h)=>{
    c.fillStyle='#efefea';c.fillRect(0,0,w,h);text(c,'함께 배우는 2학년 1반',w/2,80,52,'#71848b');
    ['단원','학습 문제','활동'].forEach((s,i)=>{c.fillStyle=['#ddd0e7','#acd4ce','#e9d4b0'][i];c.fillRect(38,135+i*110,210,75);text(c,s,143,186+i*110,38);});
  });
  panel('복도쪽 시계',2.93,.245,2.66,.39,.39,-Math.PI/2,(c,w,h)=>{
    c.clearRect(0,0,w,h);c.fillStyle='#b19671';c.beginPath();c.arc(w/2,h/2,w*.49,0,Math.PI*2);c.fill();c.fillStyle='#efe8d9';c.beginPath();c.arc(w/2,h/2,w*.44,0,Math.PI*2);c.fill();
    for(let i=1;i<=12;i++){const a=i*Math.PI/6;text(c,String(i),w/2+Math.sin(a)*w*.34,h/2-Math.cos(a)*h*.34+35,105);}
    c.strokeStyle='#343b38';c.lineWidth=18;c.beginPath();c.moveTo(w*.5,h*.18);c.lineTo(w*.5,h*.5);c.lineTo(w*.72,h*.61);c.stroke();
  }).material.transparent=true;
  panel('인물 없는 벽거울',3.23,.245,1.62,.26,.78,-Math.PI/2,(c,w,h)=>{c.fillStyle='#353c37';c.fillRect(0,0,w,h);const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#cad8d6');g.addColorStop(.5,'#eff0e5');g.addColorStop(1,'#a8b8af');c.fillStyle=g;c.fillRect(25,25,w-50,h-50);});
  // TV body and display now come from the shared classroom device builder.
  const metal=new THREE.MeshStandardMaterial({color:'#d0d4cd',roughness:.45,metalness:.35});
  for(const u of [1.5,5.1])for(const v of [2,6]){
    const p=config.point(u,v,2.91),fan=new THREE.Group();fan.position.set(p.x,p.z,-p.y);fan.name='2-1 안전망 천장 선풍기';
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.26,.012,5,32),metal);ring.rotation.x=Math.PI/2;fan.add(ring);
    for(let i=0;i<8;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.52,.01,.007),metal);bar.rotation.y=i*Math.PI/8;fan.add(bar);}
    for(let i=0;i<3;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.20,.012,.055),metal);const a=i*Math.PI*2/3;blade.position.set(Math.cos(a)*.1,.018,Math.sin(a)*.1);blade.rotation.y=-a;fan.add(blade);}
    const motor=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.11,12),metal);motor.position.y=.08;fan.add(motor);group.add(fan);
  }
  return group;
}

export function computerEntranceDetails(){
  const group=new THREE.Group();group.name='4층 컴퓨터실 입구 사진 안내';
  function sign(name,w,h,x,y,z,angle,draw){
    const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d');draw(ctx,c.width,c.height);
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,roughness:.85}));mesh.position.set(x,z,-y);mesh.rotation.y=angle;mesh.name=name;group.add(mesh);
  }
  sign('신나는 컴퓨터실 끝벽',2.42,.68,101.5,-72.70,12.63,Math.PI,(c,w,h)=>{
    c.fillStyle='#eeeae0';c.fillRect(0,0,w,h);c.textAlign='center';c.font='bold 82px "Malgun Gothic"';
    [...'신나는컴퓨터실'].forEach((s,i)=>{const x=30+i*140;c.fillStyle=['#7ca25b','#d09f49','#729bb6','#aa7d9c'][i%4];c.beginPath();c.moveTo(x,24);c.lineTo(x+126,24);c.lineTo(x+126,h*.68);c.lineTo(x+63,h-14);c.lineTo(x,h*.68);c.fill();c.fillStyle='#fff';c.fillText(s,x+63,132);});
  });
  sign('컴퓨터실 입간판',.53,1.72,102.47,-72.265,11.15,Math.PI,(c,w,h)=>{
    c.fillStyle='#ece0b9';c.fillRect(0,0,w,h);c.textAlign='center';c.fillStyle='#78546b';c.font='bold 118px "Malgun Gothic"';c.fillText('방과후',w/2,210);c.fillText('컴퓨터교실',w/2,360);
    ['즐겁게 배우는 컴퓨터','생각을 키우는 코딩','나만의 작품 만들기','함께하는 디지털 교실'].forEach((s,i)=>{const y=700+i*540;c.fillStyle=['#bdcdb2','#d6c5dc','#bed4de','#dfc4b6'][i];c.fillRect(45,y,w-90,390);c.fillStyle='#3c5458';c.font='bold 62px "Malgun Gothic"';c.fillText(s,w/2,y+220);});
  });
  const door=-73+6.75*.35;
  sign('컴퓨터실 문 위 표지',1.20,.24,100.285,door,12.69,Math.PI/2,(c,w,h)=>{c.fillStyle='#56755a';c.fillRect(0,0,w,h);c.fillStyle='white';c.textAlign='center';c.font='bold 125px "Malgun Gothic"';c.fillText('컴퓨터실',w/2,145);});
  const gate=COMPUTER_GATE;
  sign('유리문 위 컴퓨터실 환영',2.34,.45,101.5,gate.y+.07,gate.base+2.67,Math.PI,(c,w,h)=>{
    c.fillStyle='#f0ebdf';c.fillRect(0,0,w,h);c.textAlign='center';c.textBaseline='middle';c.font='bold 91px "Malgun Gothic"';
    [...'신나는컴퓨터실'].forEach((s,i)=>{const x=26+i*141;c.fillStyle=['#6fa988','#dc9873','#e5bd59','#70a9c2','#aa8ab6'][i%5];c.beginPath();c.arc(x+65,h/2,62,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.fillText(s,x+65,h/2+3);});
  });
  function pamphlet(c,w,h,theme){
    c.fillStyle=theme;c.fillRect(0,0,w,h);c.fillStyle='#fff9e6';c.fillRect(w*.05,h*.035,w*.9,h*.93);
    c.textAlign='center';c.textBaseline='middle';c.fillStyle='#385c71';c.font=`bold ${w*.13}px "Malgun Gothic"`;c.fillText('컴퓨터부 모집',w/2,h*.14);
    c.fillStyle=theme;c.fillRect(w*.13,h*.26,w*.74,h*.25);c.fillStyle='#fff';c.fillRect(w*.17,h*.29,w*.66,h*.18);
    c.fillStyle='#406c7e';c.font=`bold ${w*.10}px sans-serif`;c.fillText('</>  ABC',w/2,h*.38);
    c.fillStyle='#416157';c.font=`bold ${w*.082}px "Malgun Gothic"`;['코딩 · 디지털 그림','발표 자료 만들기','처음 배우는 친구도 함께!'].forEach((s,i)=>c.fillText(s,w/2,h*(.60+i*.09)));
    c.font=`${w*.06}px "Malgun Gothic"`;c.fillText('자세한 안내는 학교에 문의하세요',w/2,h*.9);
  }
  // Posters on both faces of the open glass doors remain readable, not mirrored.
  for(const [x,theme] of [[gate.left+.07,'#e4b96a'],[gate.right-.07,'#aa93c7']])for(const side of [-1,1]){
    sign('유리문 컴퓨터부 모집 '+x+' '+side,.65,1.04,x+side*.016,gate.y+.49,gate.base+1.54,side*Math.PI/2,(c,w,h)=>pamphlet(c,w,h,theme));
  }
  sign('컴퓨터부 활동 안내 끝벽',1.24,1.48,101.44,-72.70,11.6,Math.PI,(c,w,h)=>pamphlet(c,w,h,'#7eafba'));
  const bunting=new THREE.Group();bunting.name='유리문 알록달록 가랜드';
  for(let i=0;i<10;i++){
    const shape=new THREE.Shape();shape.moveTo(-.105,0);shape.lineTo(.105,0);shape.lineTo(0,-.20);shape.closePath();
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:['#e9bc55','#dd827b','#75b498','#76abd3','#aa8fcb'][i%5],side:THREE.DoubleSide}));
    mesh.position.set(100.42+i*.24,gate.base+2.30-Math.sin(i/9*Math.PI)*.08,-gate.y-.1);bunting.add(mesh);
  }
  group.add(bunting);
  return group;
}
