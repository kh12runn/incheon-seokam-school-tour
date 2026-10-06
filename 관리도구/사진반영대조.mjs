// Compare local runtime provenance to the read-only private catalog snapshot.
// Writes only a public-safe audit (room names, counts and implementation links).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {buildWorld} from '../웹학교/이동물리.mjs';
import {CONTROL_REFERENCE} from '../웹학교/방송조정실배치.mjs';
import {OUTDOOR_PHOTO_IDS} from '../웹학교/야외사진세부.mjs';
import {PHOTO_REFERENCES} from '../웹학교/추가사진근거.mjs';
import {HALL_PHOTO_REFERENCE} from '../웹학교/다목적실사진배치.mjs';
const auditDate=process.argv[2]??'20261006';
if(!/^\d{8}(?:-[a-z0-9]+)?$/.test(auditDate))throw new Error('Use YYYYMMDD or YYYYMMDD-label audit date');
const root=new URL('../',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('참고자료/업로드점검-'+auditDate+'/catalog.json',root)));
const world=buildWorld(JSON.parse(fs.readFileSync(new URL('웹학교/학교구조.json',root))));
const aliases={'custom_2e406f7fc9c04811a92910bac20efbb8':'2F_SCIENCE','custom_852e6a5c10904a9ca5e29816f603f6be':'2F_INTELLIGENT_SCIENCE'};
const rooms=Object.values(catalog.rooms).filter(r=>r.images.length).map(r=>{
 const id=r.roomId,target=aliases[id]??id,special=world.specialInteriors.find(c=>c.roomId===target),ordinary=world.classroomInteriors.find(c=>c.roomId===target);
 let ref=special?.reference??ordinary?.profile,count=ref?.count??ref?.photoCount,imageIds=ref?.imageIds??ref?.sourceImageIds,type=special?'special-room':'classroom';
 if(PHOTO_REFERENCES[target]){count=PHOTO_REFERENCES[target].count;imageIds=PHOTO_REFERENCES[target].imageIds;}
 if(id.endsWith('MAIN_STAIR_A')){ref=world.centralStairFinish.reference;count=PHOTO_REFERENCES[id].count;imageIds=PHOTO_REFERENCES[id].imageIds;type='central-stair';}
 if(id==='2F_KOREAN_CLASS'){ref=CONTROL_REFERENCE;count=ref.count;imageIds=ref.imageIds;type='broadcast-control';}
 if(id==='OTHER_MISC'){count=OUTDOOR_PHOTO_IDS.length;imageIds=OUTDOOR_PHOTO_IDS;type='outdoor';}
 if(id==='1F_MULTIPURPOSE'){ref=HALL_PHOTO_REFERENCE;count=ref.count;imageIds=ref.imageIds;type='multipurpose-hall';}
 if(id===world.recyclingShelter.reference.sourceRoomId){ref=world.recyclingShelter.reference;count=ref.count;imageIds=ref.imageIds;type='recycling';}
 const known=new Set(imageIds??[]),missing=imageIds?r.images.filter(i=>!known.has(i.id)):count===r.images.length?[]:r.images;
 const confirmed=imageIds?r.images.length-missing.length:count===r.images.length?count:0;
 const pendingLocations=[...new Set(missing.map(i=>i.locationDescription??r.roomName))];
 return {sourceRoomId:id,name:r.roomName,targetRoomId:type==='central-stair'?'MAIN_STAIR_B':type==='broadcast-control'?'2F_BROADCAST':type==='multipurpose-hall'?'B1_MAIN_HALL':target,photos:r.images.length,coveredPhotos:confirmed,pendingPhotos:missing.length,pendingLocations,type,verification:imageIds?'image-id-set-and-runtime':'photo-count-and-existing-runtime',localImplementation:special?.entryNeedsConfirmation?'interior-ready-entry-needs-owner-confirmation':missing.length?(id==='OTHER_MISC'?'partial-deferred-by-owner':'partial-needs-location-confirmation'):'photo-guided-3d'};
});
const photos=rooms.reduce((n,r)=>n+r.photos,0),pendingPhotos=rooms.reduce((n,r)=>n+r.pendingPhotos,0);
assert.equal(photos,Object.values(catalog.rooms).reduce((n,r)=>n+r.images.length,0));
const report={checkedAt:auditDate,baseCommit:execFileSync('git',['rev-parse','--short','HEAD'],{encoding:'utf8'}).trim(),spaces:rooms.length,photos,coveredPhotos:photos-pendingPhotos,pendingPhotos,remoteCatalogStatusUsedAsProof:false,originalPhotosPublished:false,deployed:false,notes:['근사 치수의 사진 참고 모델. 실측/자동 복원이 아님.','기존 사진 ID 기록이 없는 방은 개수와 런타임 연결로 대조.','관리자 서버 상태 및 원격 파일은 변경하지 않음.','위치 확인이 필요한 사진은 완료로 표시하거나 임의 배치하지 않음.'],rooms};
fs.writeFileSync(new URL('공간자료/사진반영점검-'+auditDate+'.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({ok:pendingPhotos===0,spaces:rooms.length,photos,coveredPhotos:photos-pendingPhotos,pendingPhotos,pending:rooms.filter(r=>r.pendingPhotos).map(r=>({room:r.name,photos:r.pendingPhotos,locations:r.pendingLocations})),exactImageSetChecks:rooms.filter(r=>r.verification.startsWith('image')).length}));
