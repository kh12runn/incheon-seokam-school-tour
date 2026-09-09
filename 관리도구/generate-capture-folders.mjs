/** Generate Korean photo folders from the current registry; never delete media. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const write = (p, body) => {
  const dest = path.resolve(root, p);
  if (!dest.startsWith(root + path.sep)) throw new Error('Unsafe output path');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, body, 'utf8');
};
const registry = read('공간자료/spaces.json'), spaces = registry.spaces, records = [];
const clean = name => name.replace(/[<>:"/\\|?*]/g, '_').trim();
const building = s => ({MAIN:'본관', EAST_WING:'본관 동쪽', ANNEX:'별관', CONNECTOR:'본관과 별관 연결부', EXTERIOR:'외부', UNKNOWN:'위치 미확인'}[s.building] ?? s.building);
const floorName = s => s.floor === 'EXTERIOR' ? '외부' : s.floor==='UNKNOWN'?'위치 미확인':s.floor.replace('F', '층');
const pdfName = s => ({'1F_MAIN_LOBBY':'본관 출입구','2F_OPERATIONS_MEETING':'학교운영위원회의실','2F_CARE_DREAM_HOPE':'돌봄교실(꿈희망)','2F_CARE_DREAM_WISH':'돌봄교실(꿈소망)','2F_CARE_DREAM_LOVE':'돌봄교실(꿈사랑)'}[s.id] ?? s.name);
const names = ids => ids.map(id => pdfName(spaces.find(s => s.id === id))).join('·');
// Direct visual reading of the user's one-page 2026 classroom allocation PDF.
const stairLandmarks = {
  '1F_MAIN_STAIR_A':['1F_3-4'], '1F_MAIN_STAIR_B':['1F_MAIN_LOBBY','1F_NIGHT_DUTY'],
  '2F_MAIN_STAIR_A':['2F_CARE_DREAM_HOPE'], '2F_MAIN_STAIR_B':['2F_STAFF'],
  '3F_MAIN_STAIR_A':['3F_5-7'], '3F_MAIN_STAIR_B':['3F_5-3','3F_GRADE5_RESEARCH'],
  '4F_MAIN_STAIR_A':['4F_6-7'], '4F_MAIN_STAIR_B':['4F_6-3','4F_GRADE6_RESEARCH'],
  '1F_ANNEX_STAIR_D':['1F_1-6'], '1F_ANNEX_STAIR_E':['1F_INDIVIDUAL_5','1F_INDIVIDUAL_4'],
  '2F_ANNEX_STAIR_D':['2F_INDIVIDUAL_2'], '2F_ANNEX_STAIR_E':['2F_3-7','2F_2-6'],
  '3F_ANNEX_STAIR_D':['3F_4-7'], '3F_ANNEX_STAIR_E':['3F_2-5','3F_2-4'],
  '4F_ANNEX_STAIR_D':['4F_4-4'], '4F_ANNEX_STAIR_E':['4F_2-2','4F_2-1'],
};
const stairLabels={
  '1F_MAIN_STAIR_A':'3-4 교실 옆 다목적실 쪽 계단',
  '1F_MAIN_STAIR_B':'본관 출입구 뒤 숙직실 옆 계단',
  '2F_MAIN_STAIR_A':'돌봄교실(꿈희망) 옆 한국어학급 쪽 계단',
  '2F_MAIN_STAIR_B':'교무실 앞 3학년 연수실 옆 계단',
  '3F_MAIN_STAIR_A':'5-7 교실 옆 상담실 쪽 계단',
  '3F_MAIN_STAIR_B':'5-3 교실 앞 5학년 연수실 옆 계단',
  '4F_MAIN_STAIR_A':'6-7 교실 옆 계단',
  '4F_MAIN_STAIR_B':'6-3 교실 앞 6학년 연수실 옆 계단',
  '1F_ANNEX_STAIR_D':'1-6 교실 옆 별관 출입구 쪽 계단 위치 확인',
  '1F_ANNEX_STAIR_E':'개별학습실5와 개별학습실4 사이 별관 출입구 쪽 계단 위치 확인',
  '2F_ANNEX_STAIR_D':'개별학습실2 옆 연결복도 쪽 계단',
  '2F_ANNEX_STAIR_E':'3-7 교실과 2-6 교실 사이 계단',
  '3F_ANNEX_STAIR_D':'4-7 교실 옆 연결복도 쪽 계단',
  '3F_ANNEX_STAIR_E':'2-5 교실과 2-4 교실 사이 계단',
  '4F_ANNEX_STAIR_D':'4-4 교실 옆 연결복도 쪽 계단',
  '4F_ANNEX_STAIR_E':'2-2 교실과 2-1 교실 사이 계단',
};
const corridorLandmarks = {
  '1F_MAIN_CORRIDOR_01':['1F_3-4','1F_MAIN_LOBBY'],
  '1F_MAIN_CORRIDOR_02':['1F_ADMIN','1F_CAFETERIA'],
  '2F_MAIN_CORRIDOR_01':['2F_CARE_DREAM_HOPE','2F_STAFF'],
  '2F_MAIN_CORRIDOR_02':['2F_STAFF','2F_SCIENCE'],
  '3F_MAIN_CORRIDOR_01':['3F_5-7','3F_5-3'],
  '3F_MAIN_CORRIDOR_02':['3F_5-2','3F_4-6'],
  '4F_MAIN_CORRIDOR_01':['4F_6-7','4F_6-3'],
  '4F_MAIN_CORRIDOR_02':['4F_6-2','4F_4-2'],
  '1F_ANNEX_CORRIDOR_01':['1F_1-6','1F_1-3'],
  '2F_ANNEX_CORRIDOR_01':['2F_INDIVIDUAL_2','2F_1-1'],
  '3F_ANNEX_CORRIDOR_01':['3F_4-7','3F_INDIVIDUAL_3'],
  '4F_ANNEX_CORRIDOR_01':['4F_4-4','4F_COMPUTER'],
  '2F_CONNECTOR':['2F_SCIENCE','2F_INDIVIDUAL_2'],
  '3F_CONNECTOR':['3F_4-6','3F_4-7'],
  '4F_CONNECTOR':['4F_4-2','4F_4-4'],
};
function addFolder(s, folder, kind, label, extra={}) {
  if (records.some(r => r.folder === folder)) throw new Error('Duplicate folder: '+folder);
  const r = {captureId: extra.captureId ?? s.id, spaceId:s.id, floor:s.floor,
    building:s.building, kind, label, folder, positionStatus:'pdf_relative_location', source:'2026학년도 교실배치도.pdf', ...extra};
  records.push(r);
  const privacy = s.type === 'toilet'
    ? '화장실은 기본 촬영 제외입니다. 이용자가 없는 상태와 학교의 허가가 확인되기 전에는 촬영하지 마세요.'
    : '학생·교직원 얼굴, 이름표, 명단, 게시물의 개인정보가 담기지 않도록 해주세요.';
  write(folder+'/촬영안내.md', `# ${label}\n\n- 공간 ID: \`${s.id}\`\n- 촬영 ID: \`${r.captureId}\`\n- 위치: ${floorName(s)} / ${building(s)}\n- 위치는 근사값입니다. 현장과 다르면 알려주세요.\n\n${extra.note ?? ''}\n\n원본 360 사진(INSP/JPG 등)이나 영상을 여러 장 이 폴더에 그대로 넣어주세요. 원본을 덮어쓰지 말고 촬영 날짜별 하위 폴더를 만들어도 됩니다. 같은 자리에서 회전만 하지 말고 위치를 옮겨 같은 벽·문·가구가 여러 사진에 겹치게 촬영하세요. 문 안팎과 복도가 함께 보이는 사진도 필요합니다.\n\n${privacy}\n\n사진을 넣는 것만으로 자동 학습·모델 반영되지는 않습니다. 촬영이 끝나면 폴더명을 알려주세요. 사진과 영상은 Git 업로드 제외 대상이며 이 안내문만 공개 저장소에 포함됩니다. GitHub 웹 화면에 직접 업로드하면 이 보호 규칙이 적용되지 않습니다.\n`);
  return r;
}
for (const s of spaces) {
  let category, leaf, note='', landmarks=[];
  if (s.type === 'stair') {
    category='계단'; landmarks=stairLandmarks[s.id];
    if (!landmarks) throw new Error('Missing stair landmark: '+s.id);
    leaf=stairLabels[s.id];
    note='2026학년도 교실배치도의 계단 표시와 인접 실을 기준으로 붙인 촬영용 이름입니다. 실제 거리·문 위치는 현장에서 확인하세요.';
    if(s.floor==='1F'&&s.building==='ANNEX') note='배치도 1층 해당 자리는 별관 출입구로 표시되어 있고 계단 표시는 2~4층에 있습니다. 기존 모델의 계단 연결 위치에 대응하는 임시 촬영 폴더이므로 1층 계단 실재 위치와 연결 동선을 먼저 확인하세요.';
  } else if (s.type === 'corridor') {
    category='복도'; landmarks=corridorLandmarks[s.id] ?? [];
    if(!landmarks.length)throw new Error('Missing PDF corridor landmarks: '+s.id);
    leaf=`${pdfName(spaces.find(r=>r.id===landmarks[0]))}에서 ${pdfName(spaces.find(r=>r.id===landmarks[1]))}까지 ${s.building==='CONNECTOR'?'연결복도':'복도'}`;
    note=`2026학년도 배치도에서 ${names(landmarks)}의 상대 위치를 기준으로 나눈 촬영 구간입니다. 양 끝 실의 문 앞과 인접 복도 구간이 겹치도록 촬영하세요. 연결복도는 두 실 사이 방향을 뜻하며 두 출입문이 바로 마주한다는 뜻은 아닙니다.`;
  } else {
    category=({classroom:'교실',special_room:'특별실_지원실',entrance:'출입구_현관',toilet:'기타_촬영전허가필요',exterior:'외부공간'})[s.type];
    if (!category) throw new Error('Unknown type: '+s.type);
    leaf=pdfName(s);
    if(s.type==='toilet') {
      const f=Number.parseInt(s.floor,10);
      const near=s.building==='ANNEX'?['1-6 교실','개별학습실2','4-7 교실','4-4 교실'][f-1]:s.id.endsWith('_A')?['3-4 교실','돌봄교실(꿈희망)','5-7 교실','6-7 교실'][f-1]:['행정실','방송실(교원회의실)','5-2 교실','6-2 교실'][f-1];
      leaf=near+' 쪽 화장실';
    }
  }
  const folder=`촬영사진_넣는곳/${floorName(s)}/${category}/${clean(leaf)}`;
  s.intakeFolder=folder+'/';
  s.photoFolder=`사진보관/원본/${floorName(s)}/${category}/${clean(leaf)}/`;
  const record=addFolder(s,folder,s.type,leaf,{landmarkSpaceIds:landmarks,note});
  if (s.type === 'stair') {
    const f=Number.parseInt(s.floor,10);
    record.stairShaft=s.id.replace(/^\dF_/, '');
    record.connectsTo=f<4 ? `${f+1}F_${record.stairShaft}` : null;
    addFolder(s,folder+'/01_해당층_계단입구와참','stair_landing',`${floorName(s)} ${leaf} 입구와 계단참`,{captureId:s.id+'_LANDING',note});
    if (f<4) addFolder(s,folder+`/02_${f}층에서_${f+1}층으로_올라가는구간`,'stair_flight',`${f}층→${f+1}층 ${leaf}`,{
      captureId:s.id+'_UP', connectsTo:record.connectsTo,
      note:note+' 아래층 폴더에 올라가는 구간 전체(하단·디딤판·중간참·상단)를 넣습니다. 위층에 같은 사진을 중복 저장할 필요는 없습니다. 옥상·지하는 확인 전 촬영 대상으로 추정하지 않았습니다.'});
  }
}
// Room-front subfolders help divide otherwise very long corridors into shoots.
for (const room of spaces.filter(s=>['classroom','special_room','entrance'].includes(s.type)&&s.bounds&&s.floor!=='EXTERIOR')) {
  const b=room.bounds, x=(b[0]+b[1])/2;
  const cid=room.building==='ANNEX' ? `${room.floor}_ANNEX_CORRIDOR_01` : `${room.floor}_MAIN_CORRIDOR_${x<50?'01':'02'}`;
  const corridor=spaces.find(s=>s.id===cid);
  addFolder(corridor, corridor.intakeFolder+clean(pdfName(room)+' 앞 복도'), 'corridor_doorway', pdfName(room)+' 앞 복도',{
    captureId:room.id+'_FRONT_CORRIDOR', landmarkSpaceIds:[room.id],
    note:'해당 실 출입문 앞에서 복도 양방향과 문 안쪽이 겹쳐 보이도록 촬영합니다. 도면상 복도 끝에 붙은 실은 실제 출입 동선을 현장에서 확인하세요.'});
}
addFolder({id:'EXT_MAIN_CLASSROOM_STEPS',floor:'EXTERIOR',building:'MAIN',type:'stair'},'촬영사진_넣는곳/외부/계단/3-4·3-3·3-2 교실 앞 운동장 쪽 야외계단','exterior_stair','3-4·3-3·3-2 교실 앞 운동장 쪽 야외계단',{
  landmarkSpaceIds:['1F_3-4','1F_3-3','1F_3-2'],note:'배치도에서 본관 1층 교실 앞 화단 아래에 계단과 언덕이 표시되어 있습니다. 야외계단의 위·아래와 교실 쪽 출입 동선을 촬영하세요. 층간 실내계단과 구분되는 촬영 지점이며 모델 공간에는 아직 별도로 등록되지 않았습니다.'});
addFolder({id:'TODO_UNASSIGNED',floor:'UNKNOWN',building:'UNKNOWN',type:'unknown'},'촬영사진_넣는곳/미분류_촬영위치확인필요','unassigned','촬영 위치 미확인',{
  note:'기존 INSP 한 장은 사진보관/원본/촬영위치미확인에 원본 그대로 보관했습니다. 위치를 확인하면 해당 실 폴더로 분류합니다.'});
const bySpace=new Map(spaces.map(s=>[s.id,s]));
for (const r of records) for (const id of r.landmarkSpaceIds ?? []) if(!bySpace.has(id)) throw new Error('Unknown landmark '+id);
const counts=Object.fromEntries([...new Set(records.map(r=>r.kind))].map(kind=>[kind,records.filter(r=>r.kind===kind).length]));
write('공간자료/spaces.json',JSON.stringify(registry,null,2)+'\n');
const photos=read('공간자료/photos.json');
for (const p of photos.photoPoints) {
  const s=bySpace.get(p.spaceId);
  p.intakeFolder=s?.intakeFolder ?? null;
  if(s){p.rawFolder=s.photoFolder;p.processedFolder=s.photoFolder.replace('/원본/','/변환본/');}
}
write('공간자료/photos.json',JSON.stringify(photos,null,2)+'\n');
write('공간자료/capture-manifest.json',JSON.stringify({schemaVersion:2,source:'참고자료/배치도/2026학년도 교실배치도.pdf',note:'Names and relative landmarks visually checked against the allocation PDF; 1F annex stairs need on-site confirmation. Raw photos are not public.',counts,folders:records},null,2)+'\n');
const csvCell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
write('공간자료/촬영폴더_목록.csv','\uFEFF'+[['촬영ID','공간ID','층','종류','이름','폴더','현장확인'],...records.map(r=>[r.captureId,r.spaceId,r.floor,r.kind,r.label,r.folder,'필요'])].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n');
write('안내문서/계단과 복도 위치 안내.md','# 계단과 복도 촬영 위치\n\n사용자가 제공한 2026학년도 교실배치도 한 쪽을 직접 확인해 인접 실명으로 이름을 붙였습니다. 본관 중앙 계단은 4층 6-3 교실 앞, 3층 5-3 교실 앞, 2층 교무실 앞, 1층 본관 출입구 뒤입니다. 이전 근사 모델의 6-2·5-2 기준 별칭은 폐기했습니다.\n\n별관 1층 두 지점은 배치도에 계단이 아닌 출입구로 표시되어 있습니다. 이 두 지점의 계단 연결은 현장에서 확인해야 합니다. 올라가는 구간은 아래층 폴더에 저장하며, 4층 위·1층 아래는 확인 전 생성하지 않았습니다.\n\n| 층 | 구분 | 인접 실 기준 설명 |\n|---|---|---|\n'+records.filter(r=>['stair','corridor','exterior_stair'].includes(r.kind)).map(r=>`| ${floorName(r)} | ${r.kind==='corridor'?'복도':'계단'} | ${r.label} |`).join('\n')+'\n');
write('공간자료/capture-check.json',JSON.stringify({spaces:spaces.length,mappedSpaces:spaces.filter(s=>s.intakeFolder).length,folders:records.length,counts,uniqueFolders:new Set(records.map(r=>r.folder)).size,uniqueCaptureIds:new Set(records.map(r=>r.captureId)).size,allFoldersExist:records.every(r=>fs.existsSync(path.join(root,r.folder,'촬영안내.md')))},null,2)+'\n');
console.log(JSON.stringify({folders:records.length,counts},null,2));
