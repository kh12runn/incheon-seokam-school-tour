// Explicit read-only integration point. Never automatically projects new uploads
// onto meshes or guesses camera poses, UVs, furniture or hotspot locations.
export async function getApprovedAssets(roomId,{signal}={}){
  if(!/^[A-Za-z0-9_-]{1,90}$/.test(roomId))throw new Error('잘못된 공간 ID');
  const response=await fetch('/api/rooms/'+encodeURIComponent(roomId)+'/assets',{signal});
  if(!response.ok)throw new Error('승인 사진 목록을 불러오지 못했습니다.');
  return response.json();
}
