import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('참고자료/업로드점검-20261002/catalog.json',root)));
const aliases={'custom_2e406f7fc9c04811a92910bac20efbb8':'2F_SCIENCE','custom_852e6a5c10904a9ca5e29816f603f6be':'2F_INTELLIGENT_SCIENCE'};
const ids=['4F_6-3','3F_4-6','3F_4-5','3F_5-4','2F_3-5','3F_5-5','4F_GRADE6_RESEARCH','4F_COMPUTER','2F_CARE_DREAM_HOPE','2F_CARE_DREAM_WISH','2F_CARE_DREAM_LOVE','1F_PRINTING','1F_MEAL_CART_STORAGE','3F_GRADE1_RESEARCH','3F_INDIVIDUAL_3','2F_INDIVIDUAL_1','4F_KINDERGARTEN',...Object.keys(aliases),'1F_NURSE'];
ids.push('1F_MAIN_STAIR_A','2F_MAIN_STAIR_A','3F_MAIN_STAIR_A','4F_MAIN_STAIR_A');
const references=Object.fromEntries(ids.map(id=>{const r=catalog.rooms[id];return [aliases[id]??id,{sourceRoomId:id,revision:r.revision,count:r.images.length,imageIds:r.images.map(i=>i.id),approximateDimensions:true,peopleExcluded:true}];}));
fs.writeFileSync(new URL('웹학교/추가사진근거.mjs',root),'// Generated provenance only: no original photos or personal metadata.\nexport const PHOTO_REFERENCES='+JSON.stringify(references,null,2)+';\n');
console.log({spaces:ids.length,photos:Object.values(references).reduce((n,r)=>n+r.count,0)});
