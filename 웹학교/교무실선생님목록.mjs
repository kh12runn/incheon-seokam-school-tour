// One roster for school placement, mission names and racing identities.
// Keep this module independent of Three.js so server-side race tools can read it.
export const OFFICE_STAFF=Object.freeze([
  {id:'vice-hwang',roomId:'2F_STAFF',label:'황 교감선생님',badge:'교감',position:{x:45.3,y:-1.55,z:3.4},heading:2.25,height:1.80,url:new URL('./캐릭터모델/hwang-chaho.glb',import.meta.url)},
  {id:'vice-yun',roomId:'2F_STAFF',label:'윤 교감선생님',badge:'교감',position:{x:48.2,y:-3.35,z:3.4},heading:-2.95,height:1.68,url:new URL('./캐릭터모델/yun-hyojin.glb',import.meta.url)},
  {id:'staff-lee',roomId:'2F_STAFF',label:'교무부장님',badge:'교무',position:{x:45.4,y:-5.45,z:3.4},heading:2.75,height:1.75,url:new URL('./캐릭터모델/lee-changseong.glb',import.meta.url)}
]);
