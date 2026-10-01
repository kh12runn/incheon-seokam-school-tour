// Local coordinates are metres from the room's west/south corner. These helpers
// describe photo-observed furnishings; they do not change the original plan.
export function photoRoom(room,worldBoxes,reference){
  const [x,X,y,Y,z]=room.bounds,boxes=[],colliders=[],chairs=[];
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
  const bounds=b=>[x+b[0],y+b[1],z+b[2],x+b[3],y+b[4],z+b[5]];
  const add=(name,b,color,material='paint',solid=false)=>{
    const item={name:room.name+' '+name,spaceId:room.id,interiorRoom:room.id,floor:parseInt(room.floor),kind:'detail',bounds:bounds(b),color:rgb(color),material};
    boxes.push(item);if(solid)colliders.push({...item,kind:'furniture'});return item;
  };
  for(let i=0;i<worldBoxes.length;i++){
    const b=worldBoxes[i];
    if(b.spaceId===room.id&&/^(Wall_|Lintel_)/.test(b.name))worldBoxes[i]={...b,color:rgb('#e3e3da'),material:'staff_wall'};
  }
  const config={roomId:room.id,room,boxes,colliders,chairs,reference,photoSupport:true,spawn:{x:(x+X)/2,y:(y+Y)/2,z},entryYaw:0};
  function table(name,a,b,w,d,h=.74,color='#baa982'){
    add(name+' 상판',[a,b,h,a+w,b+d,h+.05],color,'wood',true);
    for(const i of [a+.05,a+w-.10])for(const j of [b+.05,b+d-.10])add(name+' 다리',[i,j,.02,i+.045,j+.045,h],'#8f9a94','metal',true);
  }
  function cabinet(name,a,b,w,d,h=2,color='#beaa89',open=false,facing='south'){
    const firstBox=boxes.length,firstCollider=colliders.length;
    if(facing==='west')[w,d]=[d,w];
    add(name+' 뒷판',[a,b+d-.04,.03,a+w,b+d,h],color,'wood');
    for(const u of [a,a+w-.035])add(name+' 측판',[u,b,.03,u+.035,b+d,h],color,'wood');
    for(let level=0;level<=4;level++)add(name+' 선반',[a,b,.05+level*(h-.08)/4,a+w,b+d,.08+level*(h-.08)/4],color,'wood');
    colliders.push({name:room.name+' '+name+' 충돌',kind:'furniture',bounds:bounds([a,b,0,a+w,b+d,h])});
    if(!open)for(let i=0;i<2;i++){
      const u=a+.03+i*w/2;
      add(name+' 문',[u,b-.025,.1,u+w/2-.05,b-.005,h-.04],color,'wood');
      add(name+' 손잡이',[u+(i?.06:w/2-.10),b-.045,h*.43,u+(i?.08:w/2-.08),b-.025,h*.43+.13],'#7e8985','metal');
    }
    if(facing==='west')for(const item of [...boxes.slice(firstBox),...colliders.slice(firstCollider)]){
      const [u,v,k,U,V,K]=item.bounds;item.bounds=[x+a+v-y-b,y+b+u-x-a,k,x+a+V-y-b,y+b+U-x-a,K];
    }
  }
  function chair(name,a,b,angle=0,color='#293b39',office=true){
    chairs.push({name,x:x+a,y:y+b,z,angle,color,office});
    colliders.push({name:room.name+' '+name,kind:'furniture',bounds:bounds([a-.25,b-.25,0,a+.25,b+.25,.94])});
  }
  function monitor(name,a,b,height=.8){
    add(name+' 받침',[a+.1,b-.12,height,a+.46,b+.1,height+.035],'#303d37');
    add(name+' 기둥',[a+.26,b,height,a+.3,b+.035,height+.22],'#303d37');
    add(name+' 화면틀',[a,b,height+.17,a+.57,b+.055,height+.52],'#263330');
    add(name+' 화면',[a+.025,b-.007,height+.194,a+.545,b-.001,height+.496],'#50636b','glass');
  }
  function finish(floor='wood',color='#c5bda0'){
    add('사진 바닥',[.10,.10,.001,X-x-.10,Y-y-.10,.009],color,floor);
    add('사진 천장',[.10,.10,3.09,X-x-.10,Y-y-.10,3.12],'#e4e5df','staff_ceiling').kind='ceiling';
    for(const u of [X-x>7?2:1.2,X-x>7?X-x-2:X-x-1.2])for(const v of [1.6,Y-y-1.6])add('형광등',[u-.47,v-.16,3.02,u+.47,v+.16,3.065],'#f3f3e9','lamp');
  }
  return {config,add,bounds,table,cabinet,chair,monitor,finish,width:X-x,depth:Y-y};
}
