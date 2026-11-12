// Use starter cars so the first stamps never require an already-unlocked car.
// XYZ uses school coordinates (Z up), just like navigation and vehicle physics.
export const DELIVERY_COURSES=[
 {id:'rear',label:'후문 주차장',carId:'rear-2',
  launch:{x:12,y:16,z:-.6,yaw:-Math.PI/2},pickup:{x:14,y:13,z:-.6},drop:{x:56,y:13,z:-.6},
  checkpoints:[{x:45,y:16,z:-.6},{x:8,y:16,z:-.6}],park:{x:52,y:16,z:-.6},
  access:[{x:53.75,y:1.75,z:0},{x:53.75,y:3.7,z:0},{x:53.75,y:6.5,z:-.6},{x:53.75,y:11,z:-.6},{x:53.75,y:13,z:-.6}],
 },
 {id:'field',label:'정문 쪽 운동장',carId:'field-sedan-black',
  launch:{x:20,y:-55,z:-.3,yaw:0},pickup:{x:24,y:-55,z:-.3},drop:{x:24,y:-35,z:-.3},
  checkpoints:[{x:20,y:-32,z:-.3},{x:20,y:-58,z:-.3}],park:{x:20,y:-35,z:-.3},
  access:[{x:45,y:1.75,z:0},{x:45,y:-6,z:0},{x:45,y:-9,z:-.6},{x:44,y:-11.5,z:-.3},{x:44,y:-17.5,z:1.4},{x:36.5,y:-17.5,z:-.3},{x:20,y:-50,z:-.3},{x:24,y:-50,z:-.3}],
 },
];
export const DELIVERY_ITEMS=['도서 꾸러미','과학 실험 준비물','미술 도구 상자','체육 시간 준비물','학급 소식지'];
