export const OCT8_SPACE_REFERENCES={
  "2F_INDIVIDUAL_2": {
    "revision": "490d99cb-b156-43b7-9e01-884cd3679c3b",
    "count": 8,
    "imageIds": [
      "07266e2b-ecdc-47ac-9b05-66f3c07ee87e",
      "924d96dc-c110-449a-abe1-d3c6a6f41136",
      "99793ea9-1018-4d82-aa74-564a81f3bded",
      "1d2cf103-6eee-4726-8ec9-8c6627425c9e",
      "185d7e08-740a-4145-9364-b870bec76d51",
      "15e9b114-8331-4291-ae28-ea510e809802",
      "abe9ddba-b3f5-4f5d-8d8e-db65026631df",
      "7d8342db-a1ec-4b13-b3a2-2b1df1189f26"
    ],
    "reviewedAt": "2026-10-08",
    "kind": "individual2",
    "sourceRoomId": "2F_INDIVIDUAL_2",
    "features": [
      "ㄷ자 연결 목재 학습탁자",
      "파란 하부장과 연두 상부 띠",
      "전면 화면과 초록·흰 보드",
      "창가 여러 업무 PC와 목재장",
      "흰 벽면 수납장과 냉장고",
      "복도 책장·교구칸과 그림 블라인드"
    ]
  },
  "4F_GRADE2_RESEARCH": {
    "revision": "76cc6f3b-5fc2-43fe-b647-2229bba2bdcb",
    "count": 9,
    "imageIds": [
      "6a169dcb-1d45-4d5e-a6c3-aa1d34ff1865",
      "8e7c1f8a-e612-4932-8cce-73968983ff07",
      "c852e34a-6c39-44ea-93d6-c32de0ad12c2",
      "f03882e0-29e2-4ca8-b9cf-d727c1846c0c",
      "bcd1da01-24f2-473b-9b95-688c0e69ef38",
      "67549c88-a0e5-4d7e-babf-dba02a42b746",
      "08df1787-ed0a-4e5d-b406-5391efa69d68",
      "0df49ecf-5215-423a-9106-056a775c8aad",
      "ef118574-a0f3-40c9-ba1d-337fe51fd2b3"
    ],
    "reviewedAt": "2026-10-08",
    "kind": "research2",
    "sourceRoomId": "4F_GRADE2_RESEARCH",
    "features": [
      "유리 덮개 긴 타원 회의탁자",
      "벽면 목재·은색 유리 자료장",
      "검정 회의의자와 연두 회전의자",
      "맞은편 긴 업무탁자와 PC",
      "흰 대형 복합기와 냉장고",
      "붉은 외창틀과 회색 바닥"
    ]
  }
};

export const OCT8_BUILDERS={
 research2({c,add,table,cabinet,seat,monitor,copier,fridge,panel}){
  for(let i=0;i<8;i++){
   const x=.35+i*1.05;cabinet('목재 유리 자료장 '+i,x,.17,1.0,.56,2.93,'#bca27b',true);
   add('자료장 유리 '+i,[x+.04,.738,.82,x+.96,.753,2.34],'#a8beb5','clear_glass');
   for(const [h,H] of [[.08,.78],[2.4,2.90]]){
    add('자료장 목재 여닫이문 '+i+h,[x+.025,.74,h,x+.975,.763,H],'#bca27b','wood');
    for(const u of [x+.45,x+.53])add('자료장 문 손잡이 '+i+h+u,[u,.764,(h+H)/2-.08,u+.021,.79,(h+H)/2+.08],'#aebdb7','metal');
   }
   for(const u of [x+.02,x+.48,x+.94])add('자료장 은색 세로틀 '+i+u,[u,.757,.79,u+.025,.78,2.39],'#bdc9c3','metal');
   for(const h of [.79,2.36])add('자료장 은색 가로틀 '+i+h,[x,.757,h,x+1,.78,h+.03],'#bdc9c3','metal');
   for(let j=0;j<4;j++)add('자료장 교구 '+i+j,[x+.07+j*.2,.66,1.12,x+.21+j*.2,.735,1.4],['#a9b863','#d6bc7b','#77a89c'][j%3]);
  }
  table('긴 회의탁자',2.3,2.3,5.7,1.88,.74,'#bda57c');
  c.props.push({type:'roundedTable',x:5.15,y:3.24,z:.80,w:5.7,d:1.88,color:'#c8b48c'});
  add('회의탁자 유리 덮개',[2.9,2.38,.829,7.4,4.10,.836],'#c3d5cd','clear_glass');
  for(let i=0;i<4;i++){seat('검정 회의 의자',2.8+i*1.22,1.78,Math.PI,'#293c39');seat('검정 회의 의자',2.8+i*1.22,4.72,0,'#293c39');}
  seat('창가 연두 회전의자',1.65,3.2,-Math.PI/2,'#91b44d',true);
  table('긴 업무탁자',2.7,6.1,4.1,.67,.73,'#c0a985');monitor('업무 PC',4.2,6.40,.79);
  for(const x of [3.5,5.7])seat('업무 검정 의자',x,5.48,Math.PI,'#293b3a',true);
  copier(1.35,5.9);fridge(.2,5.9);cabinet('복도 서류 책장',8.65,5.9,.92,.6,2.02,'#b89f7e',true);
  panel('보라 업무 게시판',5.1,6.81,1.87,2.2,.85,'y','papers','#b8a5b6');
  for(let i=0;i<3;i++)add('붉은 외창 세로틀',[.13,.4+i*1.65,.99,.18,.45+i*1.65,2.5],'#a64d3e','metal');
 },
 individual2({add,table,cabinet,cubbies,seat,monitor,fridge,screen,panel,toys}){
  // U-shaped working group, with a continuous corridor-side aisle.
  table('ㄷ자 연결 학습탁자',3.0,1.65,4.65,.7,.70,'#b89472');
  for(const x of [3.0,6.2])for(const y of [2.38,3.8])table('ㄷ자 옆 학습탁자',x,y,1.45,1.1,.70,'#b89472');
  for(const x of [3.65,6.9])for(const y of [1.12,3.15,5.45])seat('목재 학생 의자',x,y,y>5?0:Math.PI,'#ad8d55');
  seat('초록 학습 회전의자',5.32,3.55,Math.PI,'#356d59',true);
  for(let i=0;i<5;i++)cabinet('파란 전면 하부장',3.2+i*1.11,6.26,1.05,.53,.86,'#4e81b0');
  add('연두 전면 상부 띠',[3.12,6.77,2.45,9.1,6.83,2.96],'#b0c33e');
  add('초록 전면 칠판',[3.15,6.77,1.08,6.25,6.82,2.41],'#356256');screen(6.3,6.69,1.75,1.10);
  panel('전면 학습 활동지',4.67,6.758,1.83,2.9,1.13,'y','papers','#376052');
  for(let i=0;i<3;i++)cabinet('흰 벽 수납장',.23+i*.9,.2,.85,.54,2.91,'#e4e7df');
  fridge(.25,1.10);
  for(const y of [2.05,4.15]){
   table('창가 업무탁자',.26,y,1.47,1.1,.73,'#b8a17c');monitor('창가 업무 PC',.4,y+.67,.79);monitor('창가 두번째 PC',1.02,y+.67,.79);
   seat('업무 의자',1.02,y-.43,Math.PI,'#2f3f39',true);
  }
  cubbies('복도 교구 책장',8.7,4.5,1.05,1.25,'#c2a97f',true);
  cabinet('복도 낮은 책장',8.7,.2,1.05,.52,1.18,'#c0a77f',true);
  panel('창가 그림 블라인드',.2,3.6,2.1,4.8,.7,'x','landscape');
  panel('복도 그림 블라인드',9.8,5.15,2.13,2.1,.68,'x','landscape');
  toys(3.3,1.77,.76,3.8);
 }
};
