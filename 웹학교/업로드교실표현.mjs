import * as THREE from './외부도구/three.module.js';
const paperColors=['#d9b5b1','#c6d5ae','#bbcfd8','#e2d295','#bcb0cd'];
export function uploadedClassroomDetails(config){
  const {profile,frame,room,photoDetails}=config,group=new THREE.Group();group.name=room.name+' 업로드 사진별 특징';
  group.userData.photoReference={roomId:room.id,revision:profile.sourceRevision,count:profile.photoCount,observed:profile.observedFeatures};
  const origin=frame.point(0,0),u=frame.point(1,0),v=frame.point(0,1);
  const uNormal=[u.x-origin.x,u.y-origin.y],vNormal=[v.x-origin.x,v.y-origin.y];
  const yaw=(normal,sign)=>Math.atan2(normal[0]*sign,-normal[1]*sign);
  const widthScale=Math.hypot(vNormal[0],vNormal[1]);
  const panel=(name,w,h,x,y,z,axis,sign,draw,transparent=false)=>{
    const c=document.createElement('canvas');c.width=1024;c.height=Math.max(128,Math.min(1536,Math.round(1024*h/w)));
    draw(c.getContext('2d'),c.width,c.height);
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    const normal=axis==='u'?uNormal:vNormal,scale=axis==='u'?widthScale:Math.hypot(...uNormal);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w*scale,h),new THREE.MeshStandardMaterial({map,roughness:.86,side:THREE.DoubleSide,transparent}));
    const p=frame.point(x,y,z);mesh.position.set(p.x,p.z,-p.y);mesh.rotation.y=yaw(normal,sign);mesh.name=name;group.add(mesh);return mesh;
  };
  function flower(c,x,y,r,color){c.fillStyle=color;for(let k=0;k<7;k++){const a=k*Math.PI*2/7;c.beginPath();c.ellipse(x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,r*.45,r*.30,a,0,Math.PI*2);c.fill();}c.fillStyle='#d3b15c';c.beginPath();c.arc(x,y,r*.31,0,Math.PI*2);c.fill();}
  function artwork(c,x,y,w,h,type,index){
    c.fillStyle=paperColors[index%paperColors.length];c.fillRect(x-2,y-2,w+4,h+4);c.fillStyle='#f3f0df';c.fillRect(x,y,w,h);
    if(type==='dark'){c.fillStyle='#253842';c.fillRect(x+3,y+3,w-6,h-6);c.strokeStyle=paperColors[(index+2)%5];c.lineWidth=2;for(let j=0;j<5;j++){c.beginPath();c.moveTo(x+4,y+5+j*6);c.lineTo(x+w*.65,y+h-6-j*4);c.stroke();}}
    else if(type==='gradient'){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,paperColors[index%5]);g.addColorStop(.6,'#e3d3a9');g.addColorStop(1,'#748d7c');c.fillStyle=g;c.fillRect(x+3,y+3,w-6,h-6);}
    else if(type==='flower')flower(c,x+w*.5,y+h*.5,Math.min(w,h)*.32,paperColors[(index+1)%5]);
    else{c.strokeStyle=['#749c9a','#a68571','#879b71','#a8859e'][index%4];c.lineWidth=2;c.beginPath();c.moveTo(x+w*.12,y+h*.78);c.lineTo(x+w*.36,y+h*.31);c.lineTo(x+w*.64,y+h*.73);c.lineTo(x+w*.88,y+h*.46);c.stroke();c.fillStyle='#c3ad67';c.beginPath();c.arc(x+w*.72,y+h*.25,Math.min(w,h)*.09,0,Math.PI*2);c.fill();}
  }
  panel('사진 참고 뒤 게시판',5.64,1.19,9.706,-3.51,2.0,'u',-1,(c,w,h)=>{
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#9cbfc9');sky.addColorStop(.78,'#d4e2d4');sky.addColorStop(.8,'#a1b574');sky.addColorStop(1,'#91a263');c.fillStyle=sky;c.fillRect(0,0,w,h);
    const style=profile.back;
    if(style==='three-part-drops'){
      for(let row=0;row<3;row++)for(let col=0;col<5;col++)artwork(c,22+col*57,16+row*62,43,52,'sketch',col);
      for(let row=0;row<3;row++)for(let col=0;col<8;col++){const x=335+col*42,y=24+row*55;c.fillStyle=paperColors[(row+col)%5];c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-24,y+34,x,y+35);c.quadraticCurveTo(x+24,y+34,x,y);c.fill();}
      for(let row=0;row<3;row++)for(let col=0;col<5;col++)artwork(c,720+col*54,16+row*60,44,48,'dark',col+row);
    }else if(style==='right-paper-cluster'){
      for(let row=0;row<3;row++)for(let col=0;col<6;col++)artwork(c,550+col*69,24+row*53,53,43,'sketch',col+row);
    }else if(style==='green-framed-grid'){
      for(let row=0;row<3;row++)for(let col=0;col<10;col++){const x=28+col*80,y=15+row*60;c.fillStyle='#abc671';c.fillRect(x-4,y-4,72,58);artwork(c,x,y,64,50,'sketch',col+row);}
      c.fillStyle='#eef0db';c.fillRect(855,24,140,156);c.strokeStyle='#97ae7c';for(let i=0;i<6;i++){c.beginPath();c.moveTo(860,50+i*20);c.lineTo(990,50+i*20);c.stroke();}
    }else if(['news-collage','postcard-gallery','striped-landscapes'].includes(style)){
      const cols=style==='news-collage'?12:10;
      for(let row=0;row<2;row++)for(let j=0;j<cols;j++){
        const x=30+j*(960/cols),y=30+row*80,ww=style==='postcard-gallery'?65:49;
        artwork(c,x,y,ww,58,style==='striped-landscapes'?'gradient':style==='postcard-gallery'?'sketch':'dark',j+row);
        if(style==='news-collage'){c.fillStyle='#e7e6db';c.fillRect(x,y+36,ww,22);c.fillStyle='#8e978d';for(let k=0;k<4;k++)c.fillRect(x+4,y+40+k*4,ww-8-(k%2)*10,1);}
      }
    }else if(style==='white-papers'){
      for(let row=0;row<2;row++)for(let j=0;j<11;j++){
        const x=35+j*87,y=25+row*89;c.fillStyle='#f0f0e8';c.fillRect(x,y,64,70);
        c.strokeStyle='#bdc3b9';c.lineWidth=1.5;
        if(row===0){c.beginPath();c.moveTo(x+18,y+9);c.lineTo(x+7,y+22);c.lineTo(x+15,y+30);c.lineTo(x+19,y+26);c.lineTo(x+19,y+57);c.lineTo(x+46,y+57);c.lineTo(x+46,y+26);c.lineTo(x+51,y+30);c.lineTo(x+58,y+22);c.lineTo(x+46,y+9);c.closePath();c.stroke();}
        else for(let k=0;k<7;k++)c.strokeRect(x+8,y+9+k*7,47-(k%3)*6,1);
      }
    }else if(style==='sunflower-autumn'){
      for(let i=0;i<2;i++)artwork(c,24+i*81,22,67,89,'gradient',i);
      for(let row=0;row<2;row++)for(let j=0;j<7-row;j++){
        const x=232+j*74+row*35,y=19+row*66;c.fillStyle='#f1efdf';c.fillRect(x,y,61,59);flower(c,x+30,y+28,23,'#ddbb36');c.fillStyle='#6a6535';c.beginPath();c.arc(x+30,y+28,8,0,Math.PI*2);c.fill();
      }
      for(let i=0;i<30;i++){c.fillStyle=paperColors[i%5];c.fillRect(801+(i%6)*31,20+Math.floor(i/6)*24,27,21);}
      for(let j=0;j<15;j++){const x=28+j*65;c.fillStyle='#f0f0e8';c.fillRect(x,157,51,40);c.strokeStyle='#9fa8a0';c.strokeRect(x+9,164,33,25);}
    }else if(style==='flower-collage'){
      for(let i=0;i<6;i++){const x=490+(i%3)*115,y=40+Math.floor(i/3)*78;c.fillStyle=['#a64646','#436e71','#bf9553'][i%3];c.fillRect(x,y,108,72);for(let j=0;j<6;j++)flower(c,x+17+(j%3)*34,y+18+Math.floor(j/3)*33,14,paperColors[(i+j)%5]);}
      for(let i=0;i<15;i++){c.fillStyle=paperColors[i%5];c.fillRect(210+(i%5)*46,60+Math.floor(i/5)*40,35,29);}
      artwork(c,862,55,135,133,'sketch',3);
    }else if(style==='shirt-lines'){
      for(let row=0;row<2;row++){c.strokeStyle='#657366';c.lineWidth=2;c.beginPath();c.moveTo(85,40+row*80);c.quadraticCurveTo(530,66+row*80,977,37+row*80);c.stroke();for(let j=0;j<11;j++){const x=100+j*78,y=44+row*80;c.fillStyle=paperColors[j%5];c.beginPath();c.moveTo(x,y);c.lineTo(x-8,y+13);c.lineTo(x+2,y+23);c.lineTo(x+8,y+18);c.lineTo(x+8,y+57);c.lineTo(x+43,y+57);c.lineTo(x+43,y+18);c.lineTo(x+49,y+23);c.lineTo(x+58,y+13);c.lineTo(x+50,y);c.closePath();c.fill();}}
    }else if(style==='black-grid'||style==='dark-art'){
      const cols=style==='black-grid'?8:10;
      for(let row=0;row<3;row++)for(let j=0;j<cols;j++)artwork(c,180+j*74,26+row*55,51,44,style==='black-grid'&&j<3?'sketch':'dark',j+row);
      for(let i=0;i<7;i++)flower(c,35+(i%2)*65,37+Math.floor(i/2)*47,18,paperColors[i%5]);
    }else if(style==='gradient-art'){
      for(let row=0;row<2;row++)for(let j=0;j<10;j++)artwork(c,30+j*74,29+row*79,37,58,'gradient',j+row);
      for(let i=0;i<45;i++){c.fillStyle=paperColors[i%5];c.fillRect(824+(i%9)*20,23+Math.floor(i/9)*29,15,22);}
    }else if(style==='orange-art'){
      for(let row=0;row<2;row++)for(let j=0;j<10;j++){if(j===4||j===5)continue;c.fillStyle='#c57747';c.fillRect(32+j*95,30+row*83,52,63);flower(c,58+j*95,49+row*83,15,'#cad6d2');}
      for(let i=0;i<18;i++)flower(c,436+(i%3)*45,40+Math.floor(i/3)*23,15,paperColors[i%5]);
    }else{
      const cols=style==='flower-rings'?11:10;
      for(let row=0;row<2;row++)for(let j=0;j<cols;j++){
        const x=145+j*75,y=42+row*74;
        artwork(c,x,y,54,53,style==='flower-rings'?'flower':'sketch',j+row);
        if(style==='yellow-clipboards'){c.fillStyle='#dbc36d';c.fillRect(x-4,y-4,62,4);}
      }
      if(style==='bunting-papers')for(let i=0;i<23;i++){c.fillStyle=paperColors[i%5];c.beginPath();c.moveTo(i*45,4);c.lineTo(i*45+20,27);c.lineTo(i*45+39,4);c.closePath();c.fill();}
      if(style==='sunflower-tree'||style==='yellow-clipboards'){
        c.fillStyle='#8d7551';c.fillRect(955,84,15,100);for(let j=0;j<7;j++){c.fillStyle=['#8fac77','#b8bd69','#719775'][j%3];c.beginPath();c.arc(958+Math.cos(j)*29,74+Math.sin(j)*30,24,0,Math.PI*2);c.fill();}
        if(style==='sunflower-tree')for(let i=0;i<7;i++)flower(c,28+(i%2)*50,33+Math.floor(i/2)*45,22,'#d5b85b');
      }
      if(style==='map-art')artwork(c,21,44,96,126,'sketch',2);
      if(style==='picture-frames')for(let i=0;i<22;i++){c.fillStyle=paperColors[i%5];c.fillRect(160+i*32,h-28,24,19);}
    }
    c.fillStyle='#355548';c.font='bold 17px "Malgun Gothic",sans-serif';c.textAlign='left';c.fillText(room.name+' · 우리들의 작품',16,h-9);
  });
  panel('칠판 수업 안내',4.55,1.34,room.building==='ANNEX'?.40:.285,-3.39,1.68,'u',1,(c,w,h)=>{
    c.fillStyle='#294d42';c.fillRect(0,0,w,h);
    if(profile.board.startsWith('white')){c.fillStyle='#ecefe5';c.fillRect(profile.board==='white-wide'?w*.12:profile.board==='white-narrow'?w*.46:w*.33,0,profile.board==='white-wide'?w*.72:profile.board==='white-narrow'?w*.3:w*.43,h);}
    c.fillStyle='#e4e9d4';c.font='23px "Malgun Gothic",sans-serif';c.fillText(room.name,21,35);
    for(let i=0;i<6;i++){c.fillStyle=paperColors[i%5];c.fillRect(18,65+i*29,70,21);}
    c.fillStyle='#d8dbc5';c.font='18px sans-serif';c.fillText('함께 배우고 서로 도와요',w*.24,h-22);
    if(profile.extras.includes('yellow-schedule'))for(let i=0;i<24;i++){c.fillStyle='#d2b64b';c.fillRect(w-185+(i%4)*38,50+Math.floor(i/4)*28,33,23);}
  });
  panel('태극기',.58,.37,.28,-3.4,2.79,'u',1,(c,w,h)=>{
    c.fillStyle='#8c765b';c.fillRect(0,0,w,h);c.fillStyle='#eeeedd';c.fillRect(15,15,w-30,h-30);const x=w/2,y=h/2,r=h*.23;
    c.fillStyle='#b8585e';c.beginPath();c.arc(x,y,r,Math.PI,0);c.fill();c.fillStyle='#47779e';c.beginPath();c.arc(x,y,r,0,Math.PI);c.fill();
    c.fillStyle='#b8585e';c.beginPath();c.arc(x-r/2,y,r/2,0,Math.PI*2);c.fill();c.fillStyle='#47779e';c.beginPath();c.arc(x+r/2,y,r/2,0,Math.PI*2);c.fill();
    for(const [a,b,split] of [[.24,.25,[0,0,0]],[.76,.75,[1,1,1]],[.76,.25,[1,0,1]],[.24,.75,[0,1,0]]]){c.save();c.translate(w*a,h*b);c.rotate(a===b?-.6:.6);c.fillStyle='#354441';split.forEach((s,i)=>{if(s){c.fillRect(-50,i*20,43,12);c.fillRect(7,i*20,43,12);}else c.fillRect(-50,i*20,100,12);});c.restore();}
  });
  // Generic non-identifying illustrations reproduce the placement and shape,
  // not the pupils' faces/names or legible private documents in the originals.
  for(const extra of profile.extras){
    if(extra==='autumn-posters')for(let i=0;i<4;i++)panel('복도창 가을 그림 '+i,.36,.49,5.5+i*.82,-.28,1.84,'v',-1,(c,w,h)=>{c.fillStyle='#efeee2';c.fillRect(0,0,w,h);for(let j=0;j<10;j++)flower(c,w*.2+(j%3)*w*.3,h*.15+Math.floor(j/3)*h*.22,w*.16,['#b58545','#a5513f','#ccae56'][j%3]);});
    if(extra==='window-rect-mirror')panel('창가 세로 거울',.3,.86,6.97,-6.79,1.73,'v',1,(c,w,h)=>{c.fillStyle='#303c39';c.fillRect(0,0,w,h);c.fillStyle='#b7c9c7';c.fillRect(14,14,w-28,h-28);});
    if(extra==='window-butterflies')for(const x of [2.8,4.1,7.3])panel('창문 나비 작품',.65,.65,x,-6.77,1.93,'v',1,(c,w,h)=>{for(let i=0;i<4;i++){const xx=w*.25+(i%2)*w*.5,yy=h*.25+Math.floor(i/2)*h*.5;c.fillStyle=paperColors[i];for(const s of [-1,1]){c.beginPath();c.ellipse(xx+s*60,yy,65,100,s*.4,0,Math.PI*2);c.fill();}c.fillStyle='#706b51';c.fillRect(xx-9,yy-65,18,145);}},true);
    if(extra==='sunflowers')panel('창가 해바라기 장식',1.4,.28,5,-6.78,2.38,'v',1,(c,w,h)=>{for(let i=0;i<6;i++)flower(c,75+i*175,h/2,56,'#d6b34d');},true);
    if(extra==='corridor-globes')for(const x of [5.8,7.9])panel('복도창 동그란 작품',1.35,.7,x,-.27,1.74,'v',-1,(c,w,h)=>{for(let i=0;i<8;i++){const xx=90+(i%4)*250,yy=100+Math.floor(i/4)*260;c.strokeStyle='#6e8993';c.lineWidth=8;c.beginPath();c.arc(xx,yy,75,0,Math.PI*2);c.stroke();flower(c,xx,yy,43,paperColors[i%5]);}},true);
    if(extra==='corridor-banner')panel('복도창 위 종이 띠',5.8,.24,6.5,-.28,2.40,'v',-1,(c,w,h)=>{c.fillStyle='#e8e5d5';c.fillRect(0,0,w,h);c.fillStyle='#6f8582';c.font='bold 47px "Malgun Gothic",sans-serif';c.textAlign='center';c.fillText('함께 배우고 서로 존중하는 우리 반',w/2,h*.68);});
    if(extra==='locker-stickers')for(let j=0;j<9;j++)panel('사물함 작은 꾸밈 '+j,.31,.63,9.283,-6.03+j*.625,.65,'u',-1,(c,w,h)=>{for(let i=0;i<4;i++)artwork(c,90+(i%2)*460,120+Math.floor(i/2)*620,340,400,'sketch',i+j);},true);
    if(extra==='clipboards')panel('뒤쪽 클립보드 전시',4.9,.25,9.69,-3.5,1.38,'u',-1,(c,w,h)=>{for(let i=0;i<15;i++){c.fillStyle=paperColors[i%5];c.fillRect(i*68,2,59,h-4);c.fillStyle='#f1f0e4';c.fillRect(i*68+4,10,51,h-16);c.fillStyle='#657472';c.fillRect(i*68+22,2,18,12);}},true);
    if(extra.includes('mirror')&&extra!=='window-rect-mirror')panel('복도쪽 '+extra,.42,extra==='corridor-mirror'?1.2:.6,6.85,-.31,1.79,'v',-1,(c,w,h)=>{c.fillStyle='#8f7864';c.beginPath();c.ellipse(w/2,h/2,w*.48,h*.48,0,0,Math.PI*2);c.fill();const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#e6e7d8');g.addColorStop(.5,'#a5c6c5');g.addColorStop(1,'#c9d4c8');c.fillStyle=g;c.beginPath();c.ellipse(w/2,h/2,w*.42,h*.44,0,0,Math.PI*2);c.fill();},true);
  }
  if(profile.shelf==='purple')panel('별빛 가림천',1.5,.9,5.9,-.713,.64,'v',-1,(c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#594185');g.addColorStop(1,'#9276ac');c.fillStyle=g;c.fillRect(0,0,w,h);for(let i=0;i<22;i++){const x=(i*149)%w,y=20+Math.sin(i*2)*18;c.strokeStyle='#d7cde6';c.lineWidth=2;c.beginPath();c.moveTo(x-6,y);c.lineTo(x+6,y);c.moveTo(x,y-6);c.lineTo(x,y+6);c.stroke();}});
  panel('학급 시계',.34,.34,profile.clockSide==='corridor'?6.85:5,profile.clockSide==='corridor'?-.3:-6.76,2.55,'v',profile.clockSide==='corridor'?-1:1,(c,w,h)=>{c.fillStyle=profile.roomId==='4F_6-7'?'#885c48':'#828b80';c.beginPath();c.arc(w/2,h/2,w*.49,0,Math.PI*2);c.fill();c.fillStyle='#eeeeDF';c.beginPath();c.arc(w/2,h/2,w*.44,0,Math.PI*2);c.fill();c.strokeStyle='#506059';c.lineWidth=12;for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(w/2+Math.sin(a)*w*.36,h/2-Math.cos(a)*h*.36);c.lineTo(w/2+Math.sin(a)*w*.40,h/2-Math.cos(a)*h*.40);c.stroke();}c.lineWidth=18;c.beginPath();c.moveTo(w*.34,h*.32);c.lineTo(w*.5,h*.5);c.lineTo(w*.70,h*.27);c.stroke();},true);
  const dark=new THREE.MeshStandardMaterial({color:'#515d57',metalness:.45,roughness:.55}),metal=new THREE.MeshStandardMaterial({color:'#c4cec5',roughness:.7});
  const handles=new THREE.InstancedMesh(new THREE.CylinderGeometry(.033,.033,.012,10),dark,photoDetails.handles.length),matrix=new THREE.Matrix4();
  const normal=new THREE.Vector3(uNormal[0],0,-uNormal[1]).normalize(),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
  photoDetails.handles.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.x,p.z,-p.y),q,new THREE.Vector3(1,1,1));handles.setMatrixAt(i,matrix);});handles.instanceMatrix.needsUpdate=true;group.add(handles);
  const ring=new THREE.TorusGeometry(.22,.006,4,24),blade=new THREE.BoxGeometry(.27,.015,.08),stem=new THREE.CylinderGeometry(.023,.023,.14,6);
  for(const x of [2.8,7.3])for(const y of [-5.25,-1.85]){
    const p=frame.point(x,y,2.92),fan=new THREE.Group();fan.name='천장 보호망 선풍기';fan.position.set(p.x,p.z,-p.y);group.add(fan);
    const s=new THREE.Mesh(stem,metal);s.position.y=.06;fan.add(s);
    for(let k=0;k<3;k++){const m=new THREE.Mesh(blade,metal),a=k*Math.PI*2/3;m.rotation.y=a;m.position.set(Math.cos(a)*.10,-.05,Math.sin(a)*.10);fan.add(m);}
    const r=new THREE.Mesh(ring,metal);r.rotation.x=Math.PI/2;r.position.y=-.06;fan.add(r);
  }
  if(profile.extras.includes('hoop')){const p=frame.point(9.69,-.37,1.92),m=new THREE.Mesh(new THREE.TorusGeometry(.29,.015,6,36),dark);m.position.set(p.x,p.z,-p.y);m.rotation.y=yaw(uNormal,-1);group.add(m);}
  return group;
}
