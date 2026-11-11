// Continue the photographed annex corridor palette into the adjacent toilet
// stair. Visual finishes only: original walk ramps, landings and guards stay.
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
export function finishAnnexToiletStair(boxes,stairs){
  const id='ANNEX_STAIR_D',stair=stairs.find(s=>s.id===id);if(!stair)return null;
  const {frame:f,L,T,height:FH}=stair,W=f.width,D=f.depth,rods=[],panels=[],signs=[],added=[];
  const point=(u,v,z)=>[f.origin[0]+f.right[0]*u+f.inward[0]*v,f.origin[1]+f.right[1]*u+f.inward[1]*v,z];
  const add=(name,u0,u1,v0,v1,z0,z1,color,material='paint',floor=1)=>{
    const a=point(u0,v0,z0),b=point(u1,v1,z1),box={name:'별관 화장실 옆 계단 '+name,bounds:[Math.min(a[0],b[0]),Math.min(a[1],b[1]),z0,Math.max(a[0],b[0]),Math.max(a[1],b[1]),z1],color:rgb(color),material,kind:'finish',floor,annexStairFinish:true};boxes.push(box);added.push(box);
  };
  const panel=(u,v0,v1,z0,z1,lo,hi,color)=>panels.push({color,points:[point(u,v0,z0+lo),point(u,v1,z1+lo),point(u,v1,z1+hi),point(u,v0,z0+hi)]});
  const rod=(name,a,b,r=.024)=>rods.push({name,a,b,r,material:'metal'});
  for(const box of [...boxes]){
    if(!box.name.startsWith(id+' '))continue;
    if(/중앙벽|최상층 막음/.test(box.name)){boxes.splice(boxes.indexOf(box),1);continue;}
    if(box.kind==='step'){
      box.color=rgb('#bcb7a6');box.material='terrazzo';box.bounds=[...box.bounds];box.bounds[2]=box.bounds[5]-.17;
    }else if(/입구|중간참/.test(box.name)){box.color=rgb('#bcb7a6');box.material='terrazzo';}
    else {box.color=rgb('#e5e2d8');box.material=/지붕/.test(box.name)?'staff_ceiling':'paint';}
  }
  for(let level=0;level<4;level++){
    const z=level*FH,floor=level+1;
    signs.push({text:floor+'층 · 별관 계단',position:point(.095,.45,z+1.75),rotation:[0,0,0]});
    for(const u of [.091,W-.091]){
      panel(u,0,L,z,z,0,.13,'#292e2c');panel(u,0,L,z,z,.13,1.03,'#aebed0');
    }
    for(let u=.6;u<W;u+=.6)add('계단참 줄눈 '+level+' '+u,u,u+.008,0,L,z+.001,z+.003,'#89887c','paint',floor);
    for(const [u0,u1] of [[.25,W/2-.25],[W/2+.25,W-.25]])add('입구 점자블록 '+level+' '+u0,u0,u1,.76,1.06,z+.003,z+.009,'#d6c254','tactile_mat',floor);
    if(level===3){
      rod('4층 끝 안전 난간',point(.1,L,z+1.07),point(W/2-.1,L,z+1.07));
      for(let i=0;i<=14;i++){const u=.1+(W/2-.2)*i/14;rod('4층 세로 난간',point(u,L,z),point(u,L,z+1.07),.013);}continue;
    }
    for(const lane of [0,1]){
      const a=z+(lane?FH:0),b=z+FH/2,uWall=lane?W-.091:.091,uRail=W/2+(lane?.06:-.06),u0=lane?W/2+.1:.08,u1=lane?W-.08:W/2-.1;
      panel(uWall,L,T,a,b,0,.13,'#292e2c');panel(uWall,L,T,a,b,.13,1.03,'#aebed0');
      rod('벽면 손잡이',point(lane?W-.18:.18,L,a+.93),point(lane?W-.18:.18,T,b+.93));
      rod('경사 난간',point(uRail,L,a+1),point(uRail,T,b+1));
      for(let i=0;i<=20;i++){const t=i/20,v=L+(T-L)*t,h=a+(b-a)*t;rod('세로 난간',point(uRail,v,h-.02),point(uRail,v,h+1),.013);}
      panels.push({color:'#e5e2d8',points:[point(u0,L,a-.17),point(u1,L,a-.17),point(u1,T,b-.17),point(u0,T,b-.17)]});
      for(let i=0;i<12;i++){
        const top=z+(lane?FH/2+(1-i/12)*FH/2:(i+1)/12*FH/2),v=L+(i+(lane?1:0))*(T-L)/12-(lane?.035:0);
        add('미끄럼방지 모서리 '+level+' '+lane+' '+i,u0,u1,v,v+.035,top+.001,top+.006,'#89887c','rubber_mat',floor);
      }
    }
    for(const u of [.091,W-.091]){
      panel(u,T,D-.09,z+FH/2,z+FH/2,0,.13,'#292e2c');panel(u,T,D-.09,z+FH/2,z+FH/2,.13,1.03,'#aebed0');
    }
    for(const [lo,hi,color] of [[0,.13,'#292e2c'],[.13,1.03,'#aebed0']])panels.push({color,points:[point(.09,D-.091,z+FH/2+lo),point(W-.09,D-.091,z+FH/2+lo),point(W-.09,D-.091,z+FH/2+hi),point(.09,D-.091,z+FH/2+hi)]});
    add('계단참 조명 '+floor,W/2-.35,W/2+.35,T+.24,D-.24,z+FH+1.3,z+FH+1.34,'#fff8e7','lamp',floor);
  }
  return {label:'별관 화장실 옆 계단',reference:{target:id,styleFrom:'ANNEX_CORRIDOR',inferred:true,requestedByUser:true,floors:[1,2,3,4]},rods,panels,signs,artworks:[],boxes:added};
}
