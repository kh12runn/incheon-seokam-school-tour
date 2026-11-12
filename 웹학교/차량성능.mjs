// Game balance, not the specifications of real road cars. Shared by the garage,
// school parking and race simulation; sports is better in every measured axis.
export const SPORTS_STAMPS=24;
export const VEHICLE_PROFILES=Object.freeze({
 sedan:{name:'클래식 세단',specialty:'균형 잡힌 주행',speed:20,accel:8,launch:10,handling:5.6,grip:16,brake:24,resilience:.52,boost:1.15},
 compact:{name:'시티 경차',specialty:'가벼운 몸놀림 · 빠른 출발',speed:19,accel:10,launch:15,handling:7,grip:17,brake:25,resilience:.46,boost:1.15},
 suv:{name:'투어링 SUV',specialty:'충돌에 강한 안정감',speed:20.5,accel:7.5,launch:10,handling:5.2,grip:16.5,brake:25,resilience:.73,boost:1.15},
 morning:{name:'모닝 스타일 경차',specialty:'출발과 좁은 코너에 강해요',speed:19.5,accel:11,launch:17,handling:7.6,grip:18,brake:27,resilience:.50,boost:1.17},
 tucson:{name:'투싼 스타일 SUV',specialty:'좋은 접지력 · 충돌 후 빠른 회복',speed:21,accel:9,launch:12,handling:6.2,grip:18.5,brake:28,resilience:.78,boost:1.18},
 electric:{name:'일렉트릭 GT',specialty:'힘찬 가속 · 빠른 출발',speed:21.5,accel:13,launch:18,handling:6,grip:17.2,brake:27,resilience:.60,boost:1.18},
 rally:{name:'랠리 세단',specialty:'빠른 직선 · 경쾌한 코너링',speed:22,accel:10.5,launch:14,handling:7.2,grip:18,brake:29,resilience:.67,boost:1.20},
 sports:{name:'Rock On 슈퍼카',specialty:'최고 속도 · 가속 · 코너링 · 회복력',speed:27.5,accel:18,launch:24,handling:9,grip:24,brake:36,resilience:.88,boost:1.25},
 touring:{name:'스포츠 투어러',specialty:'긴 직선과 연속 코너를 위한 GT',speed:28.5,accel:19,launch:25,handling:9.3,grip:25,brake:38,resilience:.90,boost:1.26},
 hyper:{name:'오로라 하이퍼카',specialty:'강력한 가속 · 뛰어난 접지력',speed:30,accel:21,launch:28,handling:10,grip:27,brake:40,resilience:.92,boost:1.28},
 champion:{name:'석암 챔피언 에디션',specialty:'모든 성능의 정점 · 최종 수집 보상',speed:33,accel:24,launch:32,handling:11,grip:30,brake:44,resilience:.95,boost:1.30},
});
export const UNLOCK_STAMPS=Object.freeze({sedan:0,compact:0,suv:3,morning:6,tucson:10,electric:14,rally:18,sports:24,touring:30,hyper:36,champion:48});
export const stampsFor=car=>UNLOCK_STAMPS[car.variant??car.type]??0;
export const canUseCar=(car,stamps)=>stamps>=stampsFor(car);
export const profileFor=car=>VEHICLE_PROFILES[car.variant??car.type]??VEHICLE_PROFILES.sedan;
export const carName=car=>car.label??profileFor(car).name+' · '+({'#23272a':'블랙','#555b5d':'스톤','#42474b':'그래파이트','#e5e8e5':'아이보리','#dfe3e3':'펄화이트','#c0c6c6':'실버','#30373b':'차콜','#727a7c':'스틸','#e1e5e3':'크림'}[car.color]??'스페셜');
