import * as THREE from './외부도구/three.module.js';

export function utilityRoomDetails(c){
  const g=new THREE.Group();g.name=c.roomId+' 사진 소품';
  const materials=new Map();
  function mat(color,metal=false){
    const key=color+metal;
    if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,metalness:metal?.65:0,roughness:metal?.36:.75,side:THREE.DoubleSide}));
    return materials.get(key);
  }
  const steel=mat('#a9b6b0',true),dark=mat('#303b38'),green=mat('#36766a'),rubber=mat('#31414b');
  function mesh(root,geometry,m,p){const o=new THREE.Mesh(geometry,m);o.position.set(...p);root.add(o);return o;}
  function box(root,size,p,m){return mesh(root,new THREE.BoxGeometry(...size),m,p);}
  function rod(root,a,b,r,m){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const o=mesh(root,new THREE.CylinderGeometry(r,r,delta.length(),8),m,start.add(end).multiplyScalar(.5).toArray());
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;
  }
  if(c.photoUtility==='admin'){
    const [x,,y]=c.room.bounds,clock=new THREE.Group();clock.position.set(x+.18,2.65,-(y+2.1));clock.rotation.y=Math.PI/2;g.add(clock);
    mesh(clock,new THREE.CylinderGeometry(.205,.205,.032,40),dark,[0,0,0]).rotation.x=Math.PI/2;
    mesh(clock,new THREE.CircleGeometry(.183,40),mat('#dbd5a5'),[0,0,.018]);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,t=box(clock,[.008,i%3?.018:.029,.007],[Math.sin(a)*.159,Math.cos(a)*.159,.022],dark);t.rotation.z=-a;
    }
    rod(clock,[0,0,.031],[.075,.035,.031],.006,dark);rod(clock,[0,0,.030],[-.028,.127,.030],.004,dark);
    const extinguisher=new THREE.Group();extinguisher.position.set(x+.48,0,-(y+.34));g.add(extinguisher);
    mesh(extinguisher,new THREE.CylinderGeometry(.10,.10,.38,16),mat('#a8322c'),[0,.24,0]);
    mesh(extinguisher,new THREE.SphereGeometry(.10,12,8),mat('#a8322c'),[0,.43,0]).scale.y=.5;
    box(extinguisher,[.13,.025,.04],[0,.50,0],dark);rod(extinguisher,[.06,.46,0],[.14,.15,0],.015,dark);
  }
  for(const p of c.utilityProps??[]){
    const root=new THREE.Group();root.name=p.type;root.position.set(p.x,p.z,-p.y);g.add(root);
    if(p.type==='ladder'){
      const h=p.height;
      for(const side of [-1,1])for(const z of [-.30,.30])rod(root,[side*.28,.035,z],[side*.28,h,0],.026,steel);
      for(let i=0;i<Math.floor(h/.27);i++){
        const height=.17+i*.27;
        for(const side of [-1,1])box(root,[.54,.033,.066],[0,height,side*.30*(1-height/h)],steel);
      }
      for(const side of [-1,1])rod(root,[side*.28,.9,-.17],[side*.28,.9,.17],.013,steel);
      box(root,[.62,.045,.17],[0,h,0],steel);
    }else if(p.type==='wheelbarrow'){
      // A hollow tapered steel tray, not a solid green box.
      const lower=[[-.28,.52,-.48],[.28,.52,-.48],[.28,.52,.40],[-.28,.52,.40]];
      const upper=[[-.45,.87,-.70],[.45,.87,-.70],[.45,.87,.61],[-.45,.87,.61]];
      const vertices=[];
      for(let i=0;i<4;i++){
        const n=(i+1)%4;vertices.push(...lower[i],...lower[n],...upper[n],...lower[i],...upper[n],...upper[i]);
        rod(root,upper[i],upper[n],.019,green);
      }
      vertices.push(...lower[0],...lower[2],...lower[1],...lower[0],...lower[3],...lower[2]);
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();mesh(root,geometry,green,[0,0,0]);
      for(const x of [-.33,.33]){
        rod(root,[x,.30,-.55],[x,.55,1.03],.021,steel);
        rod(root,[x,.55,.83],[x,.55,1.10],.032,dark);
        rod(root,[x,.48,.27],[x,.055,.38],.021,steel);
        rod(root,[x,.055,.38],[x,.07,.02],.021,steel);
      }
      const tire=mesh(root,new THREE.TorusGeometry(.215,.062,10,28),rubber,[0,.277,-.51]);tire.rotation.y=Math.PI/2;
      const hub=mesh(root,new THREE.CylinderGeometry(.165,.165,.08,20),mat('#c3a947'),[0,.277,-.51]);hub.rotation.z=Math.PI/2;
      rod(root,[-.37,.277,-.51],[.37,.277,-.51],.035,steel);
    }else if(p.type==='bucket'){
      mesh(root,new THREE.CylinderGeometry(.19,.14,.36,20,1,true),mat(p.color),[0,.20,0]);
      mesh(root,new THREE.CylinderGeometry(.145,.145,.015,20),mat(p.color),[0,.025,0]);
      const rim=mesh(root,new THREE.TorusGeometry(.19,.012,6,24),mat(p.color),[0,.38,0]);rim.rotation.x=Math.PI/2;
      const handle=mesh(root,new THREE.TorusGeometry(.17,.009,5,20,Math.PI),steel,[0,.32,0]);handle.rotation.y=Math.PI/2;
    }else if(p.type==='sprayer'){
      mesh(root,new THREE.CylinderGeometry(.13,.13,.55,16),mat('#d3c751'),[0,.30,0]);
      box(root,[.12,.05,.09],[0,.61,0],dark);rod(root,[0,.62,0],[.23,.62,0],.021,dark);
      const hose=mesh(root,new THREE.TorusGeometry(.21,.014,6,28,Math.PI*1.7),dark,[.09,.18,.1]);hose.rotation.z=.4;
    }else if(p.type==='hose'){
      for(let i=0;i<4;i++)mesh(root,new THREE.TorusGeometry(.26+i*.018,.012,6,32),mat('#767e70'),[0,0,i*.016]);
    }else if(p.type==='roll'){
      rod(root,[0,0,0],[0,p.height,0],.052,mat('#e0e0d2'));
      mesh(root,new THREE.CylinderGeometry(.030,.030,.003,12),dark,[0,p.height+.002,0]);
    }else if(p.type==='caution'){
      for(const side of [-1,1]){
        const panel=box(root,[.42,.64,.026],[0,.35,side*.09],mat('#e1bf36'));panel.rotation.x=side*-.25;
      }
      const ring=mesh(root,new THREE.TorusGeometry(.09,.008,5,24),dark,[0,.43,.13]);ring.rotation.x=-.25;
      box(root,[.017,.10,.012],[0,.44,.16],dark);box(root,[.018,.018,.012],[0,.36,.18],dark);
    }
  }
  return g;
}
