import * as THREE from './외부도구/three.module.js';
export function staffRoomDetails(config){
  const group=new THREE.Group();group.name='교무실 사진 참고 의자·벽시계';group.userData.photoReference=config.reference;
  const red=new THREE.MeshStandardMaterial({color:'#8c343f',roughness:.78}),black=new THREE.MeshStandardMaterial({color:'#2f3736',roughness:.75}),metal=new THREE.MeshStandardMaterial({color:'#a9b4b0',metalness:.7,roughness:.38});
  const shell=new THREE.SphereGeometry(1,14,10),rod=new THREE.CylinderGeometry(.023,.025,1,7),chairSpoke=new THREE.BoxGeometry(.36,.04,.055);
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
    const seat=new THREE.Mesh(shell,c.red?red:black);seat.scale.set(.29,.055,.27);seat.position.y=.45;root.add(seat);
    const back=new THREE.Mesh(shell,c.red?red:black);back.scale.set(.28,.255,.047);back.position.set(0,.74,.23);back.rotation.x=-.09;root.add(back);
    for(const x of [-.24,.24]){
      const arm=new THREE.Mesh(shell,black);arm.scale.set(.032,.028,.25);arm.position.set(x,.64,0);root.add(arm);
      for(const z of [-.19,.19]){const leg=new THREE.Mesh(rod,metal);leg.scale.y=.42;leg.position.set(x,.21,z);root.add(leg);}
    }
  }
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');
  c.fillStyle='#e6e8df';c.fillRect(0,0,256,256);c.strokeStyle='#738578';c.lineWidth=12;c.beginPath();c.arc(128,128,117,0,Math.PI*2);c.stroke();c.fillStyle='#394b43';c.font='22px sans-serif';c.textAlign='center';
  for(let i=1;i<=12;i++){const a=i*Math.PI/6;c.fillText(String(i),128+Math.sin(a)*94,136-Math.cos(a)*94);}
  c.lineWidth=5;c.beginPath();c.moveTo(128,57);c.lineTo(128,128);c.lineTo(180,155);c.stroke();
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const clock=new THREE.Mesh(new THREE.PlaneGeometry(.44,.44),new THREE.MeshStandardMaterial({map}));clock.position.set(55.86,6.10,3.53);clock.rotation.y=-Math.PI/2;group.add(clock);
  return group;
}
