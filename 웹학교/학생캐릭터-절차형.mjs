import * as THREE from './외부도구/three.module.js';
import {RUN_SPEED,STRIDE,gaitFoot,phaseAdvance} from './달리기모션.mjs';
export {RUN_SPEED,gaitFoot} from './달리기모션.mjs';

// Archived procedural character for legacy motion comparisons; not used by the app.
// No external character model, copyrighted game asset, or photographic face is used.
export const CHARACTER_NAMES={boy:'남학생',girl:'여학생'};
const sphere=new THREE.SphereGeometry(1,24,18);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createStudent(variant='boy'){
  if(!CHARACTER_NAMES[variant])throw new Error('Unknown character');
  const girl=variant==='girl',root=new THREE.Group(),body=new THREE.Group();root.name=CHARACTER_NAMES[variant];root.add(body);
  const contactMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:'varying vec2 shadowUV; void main(){shadowUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 shadowUV; void main(){float a=(1.0-smoothstep(0.1,0.5,length(shadowUV-0.5)))*0.24;gl_FragColor=vec4(0.05,0.065,0.06,a);}'});
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(.75,.55),contactMaterial);contact.rotation.x=-Math.PI/2;contact.position.y=.016;root.add(contact);
  const materials=[];
  const mat=(color,roughness=.78)=>{const m=new THREE.MeshStandardMaterial({color,roughness,transparent:true});materials.push(m);return m;};
  const skin=mat('#ffdbbd'),cheek=mat('#efa6a1'),hair=mat(girl?'#51332e':'#684530',.72);
  const jacket=mat(girl?'#c7addf':'#79bcb4'),cuff=mat(girl?'#ebd9f3':'#c1e2d8'),shirt=mat('#fff3db');
  const pants=mat('#455775'),shoe=mat(girl?'#e99fab':'#72aaba'),sole=mat('#fff3e5'),bag=mat(girl?'#ebaaa8':'#e2b365');
  const bagEdge=mat(girl?'#8e595c':'#8b693e'),eyeWhite=mat('#fff7ee',.28),iris=mat('#352b29',.23),spark=mat('#ffffff',.1);
  const mesh=(parent,geometry,material,x=0,y=0,z=0,scale)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const oval=(p,m,x,y,z,s)=>mesh(p,sphere,m,x,y,z,s);
  const group=(p,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
  const capsule=(p,m,r,length,x,y,z)=>mesh(p,new THREE.CapsuleGeometry(r,length,6,12),m,x,y,z);
  // Continuous tapered fabric, overlapping at joints instead of exposed ball joints.
  const limb=(p,m,length,top,bottom)=>{
    const pts=[[0,.028],[top*.7,.018],[top,0],[top*.97,-length*.25],[bottom*1.06,-length*.75],[bottom,-length],[bottom*.65,-length-.02],[0,-length-.028]];
    return mesh(p,new THREE.LatheGeometry(pts.reverse().map(([r,y])=>new THREE.Vector2(r,y)),20),m);
  };
  const curve=(p,m,points,r=.009)=>mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),16,r,6,false),m);
  const torso=group(body,0,.85,0);
  oval(torso,jacket,0,.025,0,[.208,.232,.142]);
  // One soft sweatshirt silhouette, small collar, kangaroo pocket and stitched badge.
  oval(torso,cuff,0,.219,-.035,[.128,.052,.13]);
  oval(torso,shirt,0,.218,.055,[.074,.022,.058]);
  oval(torso,cuff,0,-.096,.129,[.125,.058,.027]);
  for(const side of [-1,1]){
    curve(torso,shirt,[[side*.047,.21,.113],[side*.052,.14,.145],[side*.045,.108,.145]],.006);
  }
  oval(torso,cuff,0,-.182,0,[.192,.032,.131]);
  oval(torso,shirt,.095,.072,.135,[.031,.033,.008]);
  capsule(body,skin,.072,.075,0,1.115,0);
  const head=group(body,0,1.375,.012);
  oval(head,skin,0,-.006,0,[.255,.252,.215]);
  for(const side of [-1,1]){
    oval(head,skin,side*.248,-.03,0,[.038,.05,.033]);
    oval(head,cheek,side*.268,-.03,.018,[.012,.024,.007]);
    oval(head,cheek,side*.159,-.074,.175,[.045,.023,.009]);
  }
  const eyes=[];
  for(const side of [-1,1]){
    const e=group(head,side*.095,-.011,.200);eyes.push(e);
    oval(e,eyeWhite,0,0,0,[.042,.051,.009]);oval(e,iris,0,-.002,.008,[.033,.044,.009]);
    oval(e,spark,-.012,.016,.017,[.01,.012,.003]);oval(e,spark,.01,-.02,.017,[.004,.005,.002]);
    curve(head,hair,[[side*.061,.063,.2],[side*.095,.07,.197],[side*.126,.061,.185]],.006);
  }
  oval(head,skin,0,-.071,.210,[.021,.018,.017]);
  curve(head,hair,[[-.038,-.12,.187],[0,-.131,.195],[.038,-.12,.187]],.0045);
  mesh(head,new THREE.SphereGeometry(1,32,24,0,Math.PI*2,0,1.63),hair,0,.027,-.018,[.263,.25,.231]);
  // A single swept fringe avoids the old cluster of bead-like hair pieces.
  const fringe=new THREE.Shape();fringe.moveTo(-.235,.08);fringe.bezierCurveTo(-.23,.28,.2,.3,.237,.085);
  fringe.quadraticCurveTo(.19,.105,.153,.047);fringe.quadraticCurveTo(.146,.114,.101,.13);
  fringe.quadraticCurveTo(.04,.059,-.008,.056);fringe.lineTo(.015,.119);
  fringe.quadraticCurveTo(-.076,.025,-.143,.03);fringe.quadraticCurveTo(-.13,.076,-.15,.114);
  fringe.quadraticCurveTo(-.197,.054,-.235,.015);fringe.closePath();
  mesh(head,new THREE.ExtrudeGeometry(fringe,{depth:.018,bevelEnabled:true,bevelThickness:.014,bevelSize:.012,bevelSegments:3,steps:1,curveSegments:20}),hair,0,0,.16);
  oval(head,hair,0,.024,-.171,[.249,.198,.066]);
  const tails=[];
  if(girl){
    for(const side of [-1,1]){
      const tail=group(head,side*.24,.03,-.065);tails.push(tail);
      oval(tail,hair,side*.043,-.07,-.018,[.082,.143,.081]).rotation.z=side*.28;
      oval(tail,cuff,0,.01,.019,[.066,.027,.038]);
      for(const a of [-1,1])oval(tail,cuff,a*.04,.032,.04,[.042,.022,.015]).rotation.z=a*.4;
    }
  }
  const backpack=group(torso,0,0,-.144);
  oval(backpack,bag,0,.017,-.045,[.17,.204,.075]);
  oval(backpack,bagEdge,0,-.076,-.108,[.13,.083,.031]);
  curve(backpack,cuff,[[-.07,.196,-.01],[-.055,.235,-.02],[.055,.235,-.02],[.07,.196,-.01]],.012);
  curve(backpack,cuff,[[-.11,-.036,-.137],[0,-.026,-.14],[.11,-.036,-.137]],.005);
  oval(backpack,shirt,.075,.039,-.117,[.023,.025,.004]);
  for(const side of [-1,1])curve(torso,bagEdge,[[side*.11,.23,-.105],[side*.139,.211,.036],[side*.15,.09,.128],[side*.15,-.16,.075]],.015);
  const arms=[];
  for(const side of [-1,1]){
    const shoulder=group(torso,side*.212,.163,0);arms.push({shoulder,side});
    limb(shoulder,jacket,.208,.075,.06);
    const elbow=group(shoulder,0,-.208,0);arms.at(-1).elbow=elbow;
    limb(elbow,jacket,.18,.061,.049);
    capsule(elbow,cuff,.056,.027,0,-.173,0);
    const wrist=group(elbow,0,-.207,0);arms.at(-1).wrist=wrist;
    oval(wrist,skin,0,-.025,.005,[.046,.049,.027]);
    oval(wrist,skin,-side*.039,-.012,.012,[.017,.029,.015]);
    for(let f=0;f<4;f++)capsule(wrist,skin,.010,.023+(f===1||f===2?.009:0),(f-1.5)*.021,-.069,0);
  }
  oval(body,pants,0,.65,0,[.173,.095,.109]);
  const legs=[];
  for(const side of [-1,1]){
    const hip=group(body,side*.094,.66,0);
    limb(hip,pants,.34,.08,.067);
    const knee=group(hip,0,-.34,0);
    limb(knee,pants,.29,.067,.053);
    const ankle=group(knee,0,-.32,0);
    oval(ankle,sole,0,-.024,.055,[.079,.043,.135]);
    oval(ankle,shoe,0,.017,.046,[.075,.06,.119]);
    oval(ankle,shirt,0,.013,.134,[.068,.034,.033]);
    for(const z of [.015,.046,.077])curve(ankle,shirt,[[-.039,.065,z],[0,.073,z+.002],[.039,.065,z]],.005);
    legs.push({hip,knee,ankle,side});
  }
  // Batch static details within each articulated joint; the rig remains independent.
  function batchDetails(parent){
    for(const child of [...parent.children])if(child.isGroup)batchDetails(child);
    const groups=new Map();
    for(const child of parent.children.filter(c=>c.isMesh&&c.geometry===sphere)){
      if(!groups.has(child.material))groups.set(child.material,[]);groups.get(child.material).push(child);
    }
    for(const [material,items] of groups){
      if(items.length<2)continue;
      const batch=new THREE.InstancedMesh(sphere,material,items.length);batch.castShadow=true;batch.receiveShadow=true;
      items.forEach((item,i)=>{item.updateMatrix();batch.setMatrixAt(i,item.matrix);parent.remove(item);});
      batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();parent.add(batch);
    }
  }
  batchDetails(root);
  let phase=0,blend=0,heading=0,opacity=1,speed=0,footHeights=[0,0],waveTime=0,waveBlend=0,waveHeading=0,airBlend=0,motion='대기';
  function update(dt,{distance=0,dx=0,dy=0,time=0,baseZ=0,groundHeight,airborne=false,verticalSpeed=0,landing=0}={}){
    const actualSpeed=dt>0?distance/dt:0,a=1-Math.exp(-dt*12);
    speed+=(actualSpeed-speed)*a;blend+=(clamp(actualSpeed/1.2,0,1)-blend)*a;
    const stride=STRIDE;
    if(!airborne)phase+=phaseAdvance(distance);
    airBlend+=((airborne?1:0)-airBlend)*(1-Math.exp(-dt*18));
    if(waveTime>0)waveTime=Math.max(0,waveTime-dt);
    waveBlend+=((waveTime>.22?1:0)-waveBlend)*(1-Math.exp(-dt*14));
    const runBlend=blend*(1-airBlend)*(1-waveBlend),airPose=clamp(verticalSpeed/5.6,-1,1);
    let turn=0;
    if(distance>.00001){const desired=Math.atan2(dx,-dy);turn=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading));heading+=turn*(1-Math.exp(-dt*10));}
    else if(waveTime>0)heading+=Math.atan2(Math.sin(waveHeading-heading),Math.cos(waveHeading-heading))*(1-Math.exp(-dt*8));
    root.rotation.y=heading;
    // Lower centre of mass with impact compression; no exaggerated marching bounce.
    const bounce=(-.038+.023*Math.sin(phase*2-.8))*runBlend;
    body.position.y=bounce+Math.sin(time*2.3)*.004*(1-blend)-landing*.065;
    body.rotation.z=clamp(-turn*.06,-.085,.085)*blend;
    torso.rotation.x=.17*runBlend+.09*airBlend;torso.rotation.z=Math.sin(phase)*.022*runBlend;
    torso.rotation.y=Math.cos(phase-.2)*.105*runBlend;
    head.rotation.x=-.07*runBlend;head.rotation.z=-.06*waveBlend;
    head.rotation.y=-torso.rotation.y*.5;head.rotation.z=-torso.rotation.z*.4-.06*waveBlend;
    const blink=time%4.6,eyeScale=blink<.14?.12+.88*Math.abs(Math.cos(blink/.14*Math.PI)):1;
    eyes.forEach(e=>e.scale.y=eyeScale);
    arms.forEach(({shoulder,elbow,wrist,side})=>{
      const p=phase+(side===1?Math.PI:0),swing=Math.cos(p-.2);
      shoulder.rotation.x=(.10+.72*swing)*runBlend+(-.55-.18*airPose)*airBlend;
      // Positive local Z on the right moves the arm OUT, not into the ribcage.
      shoulder.rotation.z=side*(.18+.035*runBlend+.022*Math.sin(p)*runBlend+.16*airBlend);
      shoulder.rotation.y=side*.06*runBlend;
      elbow.rotation.x=-.18-(.95+.30*Math.cos(p-.5))*runBlend-.70*airBlend;
      wrist.rotation.set(-.12*runBlend,0,0);
      if(side===1&&waveBlend>.001){
        shoulder.rotation.x=THREE.MathUtils.lerp(shoulder.rotation.x,-.15,waveBlend);
        shoulder.rotation.z=THREE.MathUtils.lerp(shoulder.rotation.z,2.0,waveBlend);
        shoulder.rotation.y=THREE.MathUtils.lerp(shoulder.rotation.y,-.25,waveBlend);
        elbow.rotation.x=THREE.MathUtils.lerp(elbow.rotation.x,-.25,waveBlend);
        elbow.rotation.z=.85*waveBlend;
        wrist.rotation.z=Math.sin((2.6-waveTime)*14)*.32*waveBlend;wrist.rotation.y=.45*waveBlend;
      }else elbow.rotation.z=0;
    });
    legs.forEach(({hip,knee,ankle,side},i)=>{
      const foot=gaitFoot(phase+(side===1?Math.PI:0),stride,runBlend);
      const sample=groundHeight?.(side*.094,foot.forward)??baseZ;
      const ground=clamp(sample-baseZ,-.24,.24),toeClearance=.10*Math.max(0,Math.sin(foot.roll));
      const targetY=.075+toeClearance+ground+foot.lift-body.position.y-.66;
      const d=clamp(Math.hypot(targetY,foot.forward),.1,.34+.32-.002);
      const bend=Math.acos(clamp((.34*.34+d*d-.32*.32)/(2*.34*d),-1,1));
      hip.rotation.x=Math.atan2(-foot.forward,-targetY)-bend;
      knee.rotation.x=Math.PI-Math.acos(clamp((.34*.34+.32*.32-d*d)/(2*.34*.32),-1,1));
      ankle.rotation.x=-hip.rotation.x-knee.rotation.x+foot.roll;
      if(airBlend>.001){
        hip.rotation.x=THREE.MathUtils.lerp(hip.rotation.x,-.35-(side===1?.22:0)*Math.max(0,airPose),airBlend);
        knee.rotation.x=THREE.MathUtils.lerp(knee.rotation.x,.65+.50*Math.max(0,airPose),airBlend);
        ankle.rotation.x=THREE.MathUtils.lerp(ankle.rotation.x,-.15,airBlend);
      }
      footHeights[i]=ground+foot.lift;
    });
    backpack.rotation.x=Math.sin(phase*2-.55)*.045*blend;backpack.position.y=Math.sin(phase*2-.5)*.012*blend;
    tails.forEach((t,i)=>{t.rotation.x=Math.sin(phase*2-.7)*.12*blend;t.rotation.z=Math.sin(time*2+i)*.018+Math.sin(phase-.3)*(i?1:-1)*.10*blend;});
    contact.visible=!airborne;
    motion=airborne?(verticalSpeed>0?'점프':'낙하'):waveTime>0?'인사':landing>.1?'착지':speed<.15?'대기':'달리기';
  }
  return {root,update,variant,
    wave(targetHeading=heading){waveHeading=targetHeading;waveTime=2.6;},cancelWave(){waveTime=0;},
    snapHeading(value){heading=value;root.rotation.y=value;},
    setOpacity(value){opacity=clamp(value,0,1);for(const m of materials){m.opacity=opacity;m.depthWrite=opacity>.95;}},
    getState:()=>({variant,name:CHARACTER_NAMES[variant],heading,phase,blend,speed,motion,waving:waveTime>0,waveBlend,airBlend,opacity,footHeights:[...footHeights],arms:arms.map(a=>({side:a.side,spread:a.shoulder.rotation.z,elbow:a.elbow.rotation.x,swing:a.shoulder.rotation.x,wrist:a.wrist.rotation.z}))}),
    dispose(){const geometries=new Set();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry&&o.geometry!==sphere)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());contactMaterial.dispose();}
  };
}
