// Field-side parking and the rear lot coexist. Dimensions and rear occupancy
// are estimates; field-side vehicle types follow the approved photograph.
export const PARKING={bounds:[-22,-76,-.6,-9,-42,-.58],firstX:13,spacing:2.75};
export const REAR_PARKING={bounds:[10,12,-.6,62,25,-.58],spaces:16,firstX:13,spacing:2.75};
export const PARKED_CARS=[
  ...[['field-sedan-black',-66.125,'sedan','#23272a'],['field-suv-grey',-60.625,'suv','#555b5d'],['field-sedan-grey',-55.125,'sedan','#42474b'],['field-compact-white',-50.125,'compact','#e5e8e5'],['field-sedan-white',-46.125,'sedan','#dfe3e3']].map(([id,y,type,color])=>({id,x:-18.5,y,z:-.58,yaw:-Math.PI/2,type,color,lot:'field',reference:'700af775-b3a6-4c79-9c43-129093467f19'})),
  ...[[2,'sedan','#c0c6c6'],[6,'suv','#30373b'],[10,'sedan','#727a7c'],[13,'compact','#e1e5e3']].map(([bay,type,color])=>({id:'rear-'+bay,x:13+(bay+.5)*2.75,y:21.4,z:-.58,yaw:Math.PI,type,color,lot:'rear',estimated:true})),
  {id:'field-lamborghini',x:-18.5,y:-71.625,z:-.58,yaw:-Math.PI/2,type:'sports',color:'#c3e52f',lot:'field',label:'람보르기니 스타일 스포츠카'},
  {id:'rear-lamborghini',x:14.375,y:21.4,z:-.58,yaw:Math.PI,type:'sports',color:'#f0b42a',lot:'rear',label:'람보르기니 스타일 스포츠카'},
];
export const CAR_DIMENSIONS={sports:{width:1.93,length:4.52,height:1.18,wheelbase:2.62},sedan:{width:1.83,length:4.72,height:1.46,wheelbase:2.76},suv:{width:1.9,length:4.72,height:1.72,wheelbase:2.76},compact:{width:1.62,length:3.6,height:1.5,wheelbase:2.38}};
export function addParking(addBox){
  const add=(name,bounds,color,solid=false)=>addBox(name,bounds,color,solid?'wall':'finish',0);
  add('주차장 흙 바닥',PARKING.bounds,[.61,.52,.41]).material='soil';
  add('주차장 뒤 경계석',[-22,-76,-.6,-21.85,-42,-.44],[.57,.58,.55],true);
  add('후문 주차장 아스팔트',REAR_PARKING.bounds,[.23,.245,.25]).material='asphalt';
  add('후문 주차장 진입로',[-22,12,-.6,10,18.3,-.58],[.23,.245,.25]).material='asphalt';
  for(let i=0;i<=REAR_PARKING.spaces;i++){
    const x=REAR_PARKING.firstX+i*REAR_PARKING.spacing;
    add('후문 주차선 '+i,[x,18.5,-.576,x+.09,24.5,-.566],[.89,.90,.87]);
  }
  add('후문 주차선 뒤',[13,24.41,-.576,57.09,24.5,-.566],[.89,.90,.87]);
  add('후문 주차장 경계석',[10,24.85,-.6,62,25,-.44],[.58,.60,.58],true);
  for(let i=0;i<REAR_PARKING.spaces;i++){
    const x=13+(i+.5)*2.75;
    add('후문 바퀴 멈춤턱 '+i,[x-.65,23.7,-.58,x+.65,23.88,-.45],[.21,.23,.23],true);
    for(const dx of [-.44,.22])add('후문 멈춤턱 반사띠 '+i+' '+dx,[x+dx,23.69,-.52,x+dx+.22,23.7,-.46],[.86,.71,.22]);
  }
  for(const car of PARKED_CARS){
    const d=CAR_DIMENSIONS[car.type],side=Math.abs(Math.sin(car.yaw))>.5;
    const x=(side?d.length:d.width)/2,y=(side?d.width:d.length)/2;
    const b=add((car.lot==='rear'?'후문 ':'')+'주차장 자동차 차체 '+car.id,[car.x-x,car.y-y,car.z+.1,car.x+x,car.y+y,car.z+d.height],[.3,.33,.34],true);
    b.renderInDetails=true;b.vehicleId=car.id;
  }
}
