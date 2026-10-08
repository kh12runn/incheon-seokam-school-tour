async page => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1000,height:700});
  await page.goto('http://127.0.0.1:8080/healthz');
  await page.evaluate(async()=>{
    const {additionalRoomDetails}=await import('/웹학교/추가공간사진표현.mjs');
    const THREE=await import('/웹학교/외부도구/three.module.js'),{buildWorld}=await import('/웹학교/이동물리.mjs'),{uploadedClassroomDetails}=await import('/웹학교/업로드교실표현.mjs'),{finishMaterial,surfaceKind,softEnvironment}=await import('/웹학교/현실재질.mjs');
    const world=buildWorld(await(await fetch('/웹학교/학교구조.json')).json());
    document.body.replaceChildren();document.body.style.margin='0';const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,700);document.body.append(renderer.domElement);renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#b8d1de');scene.environment=softEnvironment(renderer);scene.add(new THREE.HemisphereLight(0xfff6e5,0xadb5a5,2.0));const light=new THREE.DirectionalLight(0xfff4de,1.7);light.position.set(20,80,50);scene.add(light);
    const camera=new THREE.PerspectiveCamera(82,1000/700,.025,200),geometry=new THREE.BoxGeometry(1,1,1),matrix=new THREE.Matrix4();let root=null,active=null;
    window.showClassroom=(id,side)=>{
      const config=[...world.classroomInteriors,...world.specialInteriors].find(r=>r.roomId===id);
      if(active!==id){
        if(root){scene.remove(root);root.traverse(o=>{if(o.geometry&&o.geometry!==geometry)o.geometry.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}
        root=new THREE.Group();scene.add(root);active=id;
        const groups=new Map();for(const b of world.boxes.filter(b=>(b.spaceId===id||b.name.includes('Window_'+id))&&!b.renderInDetails)){const key=b.color.join(',')+'|'+surfaceKind(b);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);}
        for(const list of groups.values()){
          const mesh=new THREE.InstancedMesh(geometry,finishMaterial(list[0]),list.length);
          list.forEach((b,i)=>{const a=b.bounds,q=new THREE.Quaternion();if(b.rotation){const up=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);q.copy(up).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...b.rotation))).multiply(up.clone().invert());}matrix.compose(new THREE.Vector3((a[0]+a[3])/2,(a[2]+a[5])/2,-(a[1]+a[4])/2),q,new THREE.Vector3(a[3]-a[0],a[5]-a[2],a[4]-a[1]));mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);
        }
        root.add(config.additionalRoom?additionalRoomDetails(config):uploadedClassroomDetails(config));
      }
      const [x,X,y,Y,z]=config.room.bounds;const f=config.frame??{point:(u,v,h=0)=>({x:x+(X-x)*(1+v/7),y:Y-u*(Y-y)/10,z:z+h})},eye=side==='front'?f.point(7.8,-3.5,1.72):f.point(2.7,-3.8,1.72),target=side==='front'?f.point(.3,-3.5,1.57):f.point(9.7,-3.6,1.5);
      camera.position.set(eye.x,eye.z,-eye.y);camera.lookAt(target.x,target.z,-target.y);renderer.render(scene,camera);
      if(['4F_GRADE6_RESEARCH','4F_COMPUTER'].includes(id)){
        const near=side==='front';camera.position.set(x+(X-x)*.42,z+1.77,-(near?y+.58:Y-.52));camera.lookAt(x+(X-x)*.52,z+1.4,-(near?Y-.65:y+.4));renderer.render(scene,camera);
      }
      return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,revision:config.profile?.sourceRevision??config.reference.revision};
    };
  });

  const renders=[];
  for(const id of ['2F_2-6','1F_1-5','1F_1-4','1F_1-6','2F_1-1','3F_4-7','3F_4-8','2F_INDIVIDUAL_2','4F_GRADE2_RESEARCH','4F_GRADE6_RESEARCH','4F_COMPUTER','3F_4-6','4F_4-2'])for(const side of ['front','back']){
    const stats=await page.evaluate(({id,side})=>window.showClassroom(id,side),{id,side});
    await page.screenshot({path:'output/oct8-'+id+'-'+side+'.png'});
    renders.push({id,side,...stats});
  }
  if(errors.length)throw new Error(JSON.stringify(errors));
  return {ok:true,renders};
}
