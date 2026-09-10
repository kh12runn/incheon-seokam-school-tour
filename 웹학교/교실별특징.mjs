// These are explicitly provisional identification themes, NOT observed school facts.
// When photos arrive, edit only that room's profile and its room-specific override.
// Never propagate a photographed classroom's distinguishing details to other rooms.
const themes=[
  ['1F_3-1','햇살 정원','꽃','#d3ac59','#c4d1b5'],
  ['1F_3-2','파도 이야기','물결','#709fae','#bdd0d0'],
  ['1F_3-3','무지개 꿈','무지개','#b491b8','#cfc4ce'],
  ['1F_3-4','초록 새싹','잎','#7d9d73','#c2cfb9'],
  ['2F_3-5','별빛 우체국','별','#9296b7','#c8ccdb'],
  ['2F_3-6','나비 여행','나비','#c99580','#d8c8bd'],
  ['3F_5-1','숲속 기록','잎','#719984','#bdcec3'],
  ['3F_5-2','우주 탐험','별','#878eaf','#c2c9d5'],
  ['3F_5-3','바다 연구소','물결','#669da5','#b9ced0'],
  ['3F_5-4','꽃피는 생각','꽃','#b98697','#d4c2c6'],
  ['3F_5-5','산책 지도','산','#96a576','#cbd0b9'],
  ['3F_5-6','꿈의 날개','나비','#b49bba','#d0c5d3'],
  ['3F_5-7','색연필 공방','무지개','#c7a571','#d6cbb8'],
  ['3F_4-5','푸른 능선','산','#8b9f99','#c6d2ca'],
  ['3F_4-6','우리의 항해','물결','#7294b0','#bfcddd'],
  ['4F_6-1','별의 지도','별','#a491bc','#cfc8da'],
  ['4F_6-2','함께 자라는 숲','잎','#77997d','#c2cfbb'],
  ['4F_6-3','생각의 물결','물결','#73a3ad','#c1d3d3'],
  ['4F_6-5','꿈꾸는 능선','산','#b09a72','#d4cdbb'],
  ['4F_6-6','빛의 스펙트럼','무지개','#bc9393','#d6c5c3'],
  ['4F_6-7','내일의 날개','나비','#b097b6','#ccc4d3'],
  ['4F_4-1','책 속의 꽃','꽃','#c3a27b','#d5cabb'],
  ['4F_4-2','달빛 탐사','별','#859eb1','#c4cfda'],
  ['4F_4-3','산들바람','잎','#8ea577','#c9d2bd'],
];
export const CLASSROOM_PROFILES=Object.fromEntries(themes.map(([roomId,theme,motif,accent,lowerWall],index)=>[roomId,{
  roomId,referenceRoom:'4F_6-4',photoStatus:'awaiting',observedFeatures:[],
  theme,motif,accent,lowerWall,boardLayout:index%3,lockerPattern:index%3,
  trayColor:accent,seatCountIsApproximate:true,
}]));
