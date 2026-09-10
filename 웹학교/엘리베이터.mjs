export const ELEVATOR={x:78.5,y:1.5};
export const ELEVATOR_SPAN=[77.04,80.16];
export function elevatorDestination(floor,height){
  return Number.isInteger(floor)&&floor>=1&&floor<=4?{...ELEVATOR,z:(floor-1)*height}:null;
}
export function nearElevator(p,height){
  const floor=Math.round(p.z/height)+1;
  return floor>=1&&floor<=4&&Math.abs(p.z-(floor-1)*height)<.15&&Math.hypot(p.x-ELEVATOR.x,p.y-ELEVATOR.y)<2.2;
}
export function addElevator(data,addBox){
  // Supplied plan: ELEV sits just west of the kitchen/preparation block.
  // Closed landing doors stay solid; E opens a simulated floor-selection ride.
  const metal=[.42,.46,.47],stone=[.59,.6,.57],dark=[.035,.045,.045];
  for(let floor=1;floor<=4;floor++){
    const z=(floor-1)*data.floorHeight;
    const box=(name,b,c=metal,kind='wall')=>{const moved=[...b];moved[0]+=ELEVATOR.x-101.5;moved[3]+=ELEVATOR.x-101.5;return addBox(`${floor}층 엘리베이터 `+name,moved,c,kind,floor);};
    box('승강로 오른벽',[102.94,3,z,103.16,6.2,z+data.floorHeight],stone);
    box('승강로 왼벽',[100.04,3,z,100.22,6.2,z+data.floorHeight],stone);
    box('승강로 뒷벽',[100.04,6.02,z,103.16,6.2,z+data.floorHeight],stone);
    box('승강로 상부',[100.04,3,z+3.1,103.16,6.2,z+data.floorHeight],stone,'ceiling');
    box('전면 왼벽',[100.04,2.86,z,100.72,3.12,z+3.1],stone);
    box('전면 오른벽',[102.28,2.86,z,103.16,3.12,z+3.1],stone);
    box('전면 상부',[100.72,2.86,z+2.35,102.28,3.12,z+3.1],stone);
    for(const [a,b] of [[100.72,101.49],[101.51,102.28]])box('스테인리스 문 '+a,[a,2.88,z+.035,b,2.97,z+2.35]);
    box('문 중앙 틈',[101.49,2.9,z+.035,101.51,2.98,z+2.35],dark);
    for(const x of [100.66,102.28])box('문틀 '+x,[x,2.82,z,x+.06,3,z+2.41]);
    box('문틀 위',[100.66,2.82,z+2.35,102.34,3,z+2.41]);
    box('문턱',[100.66,2.69,z+.005,102.34,3,z+.035]);
    box('호출 패널',[102.48,2.81,z+.96,102.65,2.86,z+1.36],dark,'finish');
    box('호출 버튼',[102.53,2.79,z+1.08,102.6,2.81,z+1.17],[.69,.74,.71],'finish');
    box('층 표시판',[101.15,2.81,z+2.49,101.85,2.86,z+2.78],dark,'finish');
  }
}
