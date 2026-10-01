import * as THREE from './외부도구/three.module.js';
export function supportRoomDetails(c){
  const g=new THREE.Group(),steel=new THREE.MeshStandardMaterial({color:'#8c9b95',metalness:.65,roughness:.4}),dark=new THREE.MeshStandardMaterial({color:'#293d38',roughness:.7});
  function box(root,size,p,m){const b=new THREE.Mesh(new THREE.BoxGeometry(...size),m);b.position.set(...p);root.add(b);return b;}
  for(const chair of c.chairs){
    const root=new THREE.Group();root.position.set(chair.x,chair.z,-chair.y);root.rotation.y=chair.angle;g.add(root);
    const fabric=new THREE.MeshStandardMaterial({color:chair.color,roughness:.9});
    box(root,[.48,.07,.45],[0,.45,0],fabric);box(root,[.46,.44,.065],[0,.72,.21],fabric);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.033,.038,.34,10),steel);pole.position.y=.25;root.add(pole);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5,leg=box(root,[.03,.04,.31],[Math.sin(a)*.13,.07,Math.cos(a)*.13],dark);leg.rotation.y=a;const wheel=new THREE.Mesh(new THREE.SphereGeometry(.052,8,6),dark);wheel.scale.x=.65;wheel.position.set(Math.sin(a)*.26,.05,Math.cos(a)*.26);root.add(wheel);}
    if(chair.office)for(const x of [-.28,.28]){box(root,[.035,.20,.035],[x,.55,.1],dark);box(root,[.06,.035,.31],[x,.65,-.015],dark);}
  }
  for(const f of c.wallFans??[]){
    const root=new THREE.Group();root.position.set(f.x,f.z,-f.y);root.rotation.y=Math.PI/2;g.add(root);
    for(const r of [.10,.17,.24])root.add(new THREE.Mesh(new THREE.TorusGeometry(r,.008,5,32),steel));
    for(let i=0;i<12;i++){const spoke=box(root,[.006,.48,.008],[0,0,.005],steel);spoke.rotation.z=i*Math.PI/12;}
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3,b=new THREE.Mesh(new THREE.SphereGeometry(1,10,7),dark);b.scale.set(.075,.17,.017);b.rotation.z=-a;b.position.set(Math.sin(a)*.09,Math.cos(a)*.09,-.02);root.add(b);}
  }
  return g;
}
