import * as THREE from './외부도구/three.module.js';
import {finishMaterial} from './현실재질.mjs';

function roundedPanel(width,height,radius,depth){
  const s=new THREE.Shape(),x=-width/2,y=-height/2,w=width,h=height,r=radius;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:6});
}
export function staffRoomDetails(config){
  const group=new THREE.Group();group.name='교무실 사진 참고 의자·벽시계';group.userData.photoReference=config.reference;
  const red=new THREE.MeshStandardMaterial({color:'#8c343f',roughness:.78}),black=new THREE.MeshStandardMaterial({color:'#2f3736',roughness:.75}),metal=new THREE.MeshStandardMaterial({color:'#a9b4b0',metalness:.7,roughness:.38});
  const shell=new THREE.SphereGeometry(1,14,10),rod=new THREE.CylinderGeometry(.023,.025,1,7),chairSpoke=new THREE.BoxGeometry(.36,.04,.055);
  const weave=document.createElement('canvas');weave.width=weave.height=32;const wc=weave.getContext('2d');
  wc.fillStyle='#7e2937';wc.fillRect(0,0,32,32);wc.fillStyle='#b76370';
  for(let x=0;x<32;x+=4)wc.fillRect(x,0,1,32);for(let y=0;y<32;y+=4)wc.fillRect(0,y,32,1);
  const meshMap=new THREE.CanvasTexture(weave);meshMap.colorSpace=THREE.SRGBColorSpace;meshMap.wrapS=meshMap.wrapT=THREE.RepeatWrapping;meshMap.repeat.set(14,12);
  const meshRed=new THREE.MeshStandardMaterial({map:meshMap,roughness:.9});
  const backFrame=roundedPanel(.57,.49,.085,.045),backMesh=roundedPanel(.48,.39,.055,.009),seatShape=roundedPanel(.57,.53,.11,.065);
  const tube=(root,a,b,material=metal,radius=.019)=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),7),material);
    mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());root.add(mesh);return mesh;
  };
  for(const c of config.chairs){
    const root=new THREE.Group();root.position.set(c.x,c.z,-c.y);root.rotation.y=c.angle;group.add(root);
    if(c.office){
      const seat=new THREE.Mesh(shell,black);seat.scale.set(.31,.07,.30);seat.position.y=.53;root.add(seat);
      const back=new THREE.Mesh(shell,black);back.scale.set(.31,.39,.075);back.position.set(0,.91,.23);root.add(back);
      const lift=new THREE.Mesh(rod,metal);lift.scale.y=.30;lift.position.y=.31;root.add(lift);
      for(let i=0;i<5;i++){
        const angle=i*Math.PI*2/5,spoke=new THREE.Mesh(chairSpoke,metal);spoke.position.set(Math.cos(angle)*.16,.14,Math.sin(angle)*.16);spoke.rotation.y=-angle;root.add(spoke);
        const wheel=new THREE.Mesh(shell,black);wheel.scale.set(.07,.055,.09);wheel.position.set(Math.cos(angle)*.33,.07,Math.sin(angle)*.33);root.add(wheel);
      }
      for(const x of [-.25,.25]){
        const post=new THREE.Mesh(rod,metal);post.scale.y=.22;post.position.set(x,.68,0);root.add(post);
        const arm=new THREE.Mesh(shell,black);arm.scale.set(.045,.035,.25);arm.position.set(x,.78,0);root.add(arm);
      }
      continue;
    }
    const seat=new THREE.Mesh(seatShape,black);seat.rotation.x=-Math.PI/2;seat.position.y=.425;root.add(seat);
    const back=new THREE.Mesh(backFrame,black);back.position.set(0,.76,.23);back.rotation.x=-.09;root.add(back);
    for(const z of [.222,.28]){const inset=new THREE.Mesh(backMesh,meshRed);inset.position.set(0,.77,z);inset.rotation.x=-.09;root.add(inset);}
    for(const x of [-.24,.24]){
      const arm=new THREE.Mesh(shell,black);arm.scale.set(.032,.028,.25);arm.position.set(x,.64,0);root.add(arm);
      for(const z of [-.26,.26]){
        tube(root,[x,.05,z],[x,.40,z*.6]);
        tube(root,[x,.01,z],[x,.065,z],black,.023);
      }
      tube(root,[x,.40,.15],[x,.63,.17]);
      tube(root,[x,.40,-.15],[x,.63,-.17]);
    }
  }
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');
  c.fillStyle='#e6e8df';c.fillRect(0,0,256,256);c.strokeStyle='#738578';c.lineWidth=12;c.beginPath();c.arc(128,128,117,0,Math.PI*2);c.stroke();c.fillStyle='#394b43';c.font='22px sans-serif';c.textAlign='center';
  for(let i=1;i<=12;i++){const a=i*Math.PI/6;c.fillText(String(i),128+Math.sin(a)*94,136-Math.cos(a)*94);}
  c.lineWidth=5;c.beginPath();c.moveTo(128,57);c.lineTo(128,128);c.lineTo(180,155);c.stroke();
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const clock=new THREE.Mesh(new THREE.CircleGeometry(.22,48),new THREE.MeshStandardMaterial({map}));clock.position.set(55.86,6.10,3.53);clock.rotation.y=-Math.PI/2;group.add(clock);
  for(const b of config.boxes.filter(b=>b.renderInDetails&&b.name.includes('회의탁자'))){
    const a=b.bounds,w=a[3]-a[0],d=a[4]-a[1],cx=(a[0]+a[3])/2,cz=-(a[1]+a[4])/2;
    const rim=new THREE.Mesh(roundedPanel(w+.026,d+.026,.15,.06),black);rim.rotation.x=-Math.PI/2;rim.position.set(cx,a[2]-.012,cz);group.add(rim);
    const top=new THREE.Mesh(roundedPanel(w,d,.14,.012),finishMaterial(b));top.rotation.x=-Math.PI/2;top.position.set(cx,a[5]-.012,cz);group.add(top);
  }
  const white=new THREE.MeshStandardMaterial({color:'#e8e9e3',roughness:.33});
  const soil=new THREE.MeshStandardMaterial({color:'#534839',roughness:1});
  const bark=new THREE.MeshStandardMaterial({color:'#8a8068',roughness:.95});
  const leafMaterial=new THREE.MeshStandardMaterial({color:'#4d7042',roughness:.72});
  for(const b of config.boxes.filter(b=>b.renderInDetails&&b.name.includes('화분'))){
    const a=b.bounds,x=(a[0]+a[3])/2,z=-(a[1]+a[4])/2,y=a[2];
    const root=new THREE.Group();root.position.set(x,y,z);group.add(root);
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.22,.19,.65,28),white);pot.position.y=.34;root.add(pot);
    const dirt=new THREE.Mesh(new THREE.CylinderGeometry(.197,.197,.015,24),soil);dirt.position.y=.672;root.add(dirt);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(.212,.013,6,28),white);lip.rotation.x=Math.PI/2;lip.position.y=.672;root.add(lip);
    tube(root,[0,.67,0],[.02,1.57,.02],bark,.034);
    const leaves=new THREE.InstancedMesh(shell,leafMaterial,64),matrix=new THREE.Matrix4();
    for(let i=0;i<8;i++){
      const angle=i*2.399,h=1.13+i*.075,tip=[Math.cos(angle)*.36,h+.12,Math.sin(angle)*.36];
      tube(root,[0,h-.14,0],tip,bark,.009);
      for(let j=0;j<8;j++){
        const t=.28+j*.09,spin=angle+(j%2?-.8:.8),pos=new THREE.Vector3(tip[0]*t+Math.cos(spin)*.07,h-.12+t*.22,tip[2]*t+Math.sin(spin)*.07);
        matrix.compose(pos,new THREE.Quaternion().setFromEuler(new THREE.Euler(.25,spin,.28)),new THREE.Vector3(.15,.012,.054));leaves.setMatrixAt(i*8+j,matrix);
      }
    }
    root.add(leaves);
  }
  // Unreadable paper props preserve the scene without reproducing private records.
  const paper=new THREE.MeshStandardMaterial({color:'#f1efe7',roughness:.92});
  for(let i=0;i<8;i++){
    const x=49.28+Math.floor(i/4)*1.9+(i%4)*.34,z=3.22;
    for(let k=0;k<4;k++){
      const page=new THREE.Mesh(new THREE.BoxGeometry(.28,.003,.43),paper);page.position.set(x+.14,4.222+k*.008,z+.215);page.rotation.y=(i%3-1)*.035;group.add(page);
    }
    const cover=new THREE.Mesh(new THREE.BoxGeometry(.283,.004,.433),new THREE.MeshStandardMaterial({color:['#d7aabf','#b8b3d7','#58727d','#bbc9b2'][i%4],roughness:.65}));cover.position.set(x+.14,4.251,z+.215);cover.rotation.y=(i%3-1)*.035;group.add(cover);
    const label=new THREE.Mesh(new THREE.BoxGeometry(.17,.002,.12),paper);label.position.set(x+.14,4.254,z+.215);group.add(label);
  }
  const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.045,.057,.20,16),white);bottle.position.set(52.05,4.30,3.30);group.add(bottle);
  tube(group,[52.05,4.39,3.30],[52.05,4.46,3.30],white,.016);tube(group,[52.05,4.46,3.30],[52.10,4.46,3.30],white,.014);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.055,.045,.13,16),new THREE.MeshStandardMaterial({color:'#927050'}));cup.position.set(52.43,4.32,3.76);group.add(cup);
  for(let i=0;i<7;i++)tube(group,[52.40+(i%3)*.022,4.33,3.73+Math.floor(i/3)*.022],[52.39+(i%3)*.025,4.57+(i%2)*.04,3.73+Math.floor(i/3)*.025],i%2?red:black,.006);
  return group;
}
