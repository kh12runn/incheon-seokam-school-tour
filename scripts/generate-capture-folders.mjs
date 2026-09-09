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
const registry = read('data/spaces.json'), spaces = registry.spaces, records = [];
const clean = name => name.replace(/[<>:"/\\|?*]/g, '_').trim();
const building = s => ({MAIN:'본관', EAST_WING:'본관_동쪽', ANNEX:'별관', CONNECTOR:'본관-별관_연결부', EXTERIOR:'외부'}[s.building] ?? s.building);
const floorName = s => s.floor === 'EXTERIOR' ? '외부' : s.floor.replace('F', '층');
const names = ids => ids.map(id => spaces.find(s => s.id === id)?.name ?? id).join('·');
// Approximate modeled adjacency, not surveyed or official stair names.
const stairLandmarks = {
  '1F_MAIN_STAIR_A':['1F_3-4'], '1F_MAIN_STAIR_B':['1F_ADMIN'],
  '2F_MAIN_STAIR_A':['2F_CARE_DREAM_HOPE'], '2F_MAIN_STAIR_B':['2F_STAFF'],
  '3F_MAIN_STAIR_A':['3F_5-7'], '3F_MAIN_STAIR_B':['3F_5-2'],
  '4F_MAIN_STAIR_A':['4F_6-7'], '4F_MAIN_STAIR_B':['4F_6-2'],
  '1F_ANNEX_STAIR_D':['1F_1-6'], '1F_ANNEX_STAIR_E':['1F_INDIVIDUAL_5','1F_INDIVIDUAL_4'],
  '2F_ANNEX_STAIR_D':['2F_INDIVIDUAL_2'], '2F_ANNEX_STAIR_E':['2F_3-7','2F_2-6'],
  '3F_ANNEX_STAIR_D':['3F_4-7'], '3F_ANNEX_STAIR_E':['3F_2-5','3F_2-4'],
  '4F_ANNEX_STAIR_D':['4F_4-4'], '4F_ANNEX_STAIR_E':['4F_2-2','4F_2-1'],
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
};
function addFolder(s, folder, kind, label, extra={}) {
  if (records.some(r => r.folder === folder)) throw new Error('Duplicate folder: '+folder);
  const r = {captureId: extra.captureId ?? s.id, spaceId:s.id, floor:s.floor,
    building:s.building, kind, label, folder, positionStatus:'estimated_needs_field_confirmation', ...extra};
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
    const bank=s.id.includes('_MAIN_') ? (s.id.endsWith('_A')?'본관_서쪽_A':'본관_중앙_B') : (s.id.endsWith('_D')?'별관_북쪽_D':'별관_중간_E');
    leaf=`${bank}__${names(landmarks)}_${landmarks.length>1?'사이':'앞'}_계단_위치확인필요`;
    note='앞/사이는 현재 근사 모델에서 붙인 촬영용 별칭이며 학교의 공식 명칭이 아닙니다. 현장에서 확인하세요. A/B/D/E는 층이 바뀌어도 동일한 계단입니다.';
  } else if (s.type === 'corridor') {
    category='복도'; landmarks=corridorLandmarks[s.id] ?? [];
    leaf=landmarks.length ? `${building(s)}__${names(landmarks)}_구간` : '본관-별관_연결복도';
    note='구간 전체를 여러 촬영 지점으로 나누고 인접 구간의 끝부분과 겹치게 촬영하세요. 구간 이름은 모델 기준 별칭입니다.';
  } else {
    category=({classroom:'교실',special_room:'특별실_지원실',entrance:'출입구_현관',toilet:'기타_촬영전허가필요',exterior:'외부공간'})[s.type];
    if (!category) throw new Error('Unknown type: '+s.type);
    leaf=`${building(s)}__${s.name}`;
  }
  const folder=`촬영사진_넣는곳/${floorName(s)}/${category}/${clean(leaf)}`;
  s.intakeFolder=folder+'/';
  const record=addFolder(s,folder,s.type,s.type==='stair'||s.type==='corridor'?leaf:s.name,{landmarkSpaceIds:landmarks,note});
  if (s.type === 'stair') {
    const f=Number.parseInt(s.floor,10);
    record.stairShaft=s.id.replace(/^\dF_/, '');
    record.connectsTo=f<4 ? `${f+1}F_${record.stairShaft}` : null;
    addFolder(s,folder+'/01_해당층_계단입구와참','stair_landing',`${floorName(s)} ${leaf} 입구와 계단참`,{captureId:s.id+'_LANDING',note});
    if (f<4) addFolder(s,folder+`/02_${f}층에서_${f+1}층으로_올라가는구간`,'stair_flight',`${f}층→${f+1}층 ${leaf}`,{
      captureId:s.id+'_UP', connectsTo:record.connectsTo,
      note:'아래층 폴더에 올라가는 구간 전체(하단·디딤판·중간참·상단)를 넣습니다. 위층에 같은 사진을 중복 저장할 필요는 없습니다. 옥상·지하는 확인 전 촬영 대상으로 추정하지 않았습니다.'});
  }
}
// Room-front subfolders help divide otherwise very long corridors into shoots.
for (const room of spaces.filter(s=>['classroom','special_room','entrance'].includes(s.type)&&s.bounds&&s.floor!=='EXTERIOR')) {
  const b=room.bounds, x=(b[0]+b[1])/2;
  const cid=room.building==='ANNEX' ? `${room.floor}_ANNEX_CORRIDOR_01` : `${room.floor}_MAIN_CORRIDOR_${x<50?'01':'02'}`;
  const corridor=spaces.find(s=>s.id===cid);
  addFolder(corridor, corridor.intakeFolder+clean(room.name+'_앞_복도'), 'corridor_doorway', room.name+' 앞 복도',{
    captureId:room.id+'_FRONT_CORRIDOR', landmarkSpaceIds:[room.id],
    note:'해당 실 출입문 앞에서 복도 양방향과 문 안쪽이 겹쳐 보이도록 촬영합니다. 도면상 복도 끝에 붙은 실은 실제 출입 동선을 현장에서 확인하세요.'});
}
addFolder({id:'TODO_UNASSIGNED',floor:'UNKNOWN',building:'UNKNOWN',type:'unknown'},'촬영사진_넣는곳/미분류_촬영위치확인필요','unassigned','촬영 위치 미확인',{
  note:'기존 INSP 한 장은 photos/raw/TODO_unassigned에 원본 그대로 보관했습니다. 위치를 확인하면 해당 실 폴더로 분류합니다.'});
const bySpace=new Map(spaces.map(s=>[s.id,s]));
for (const r of records) for (const id of r.landmarkSpaceIds ?? []) if(!bySpace.has(id)) throw new Error('Unknown landmark '+id);
const counts=Object.fromEntries([...new Set(records.map(r=>r.kind))].map(kind=>[kind,records.filter(r=>r.kind===kind).length]));
write('data/spaces.json',JSON.stringify(registry,null,2)+'\n');
const photos=read('data/photos.json');
for (const p of photos.photoPoints) p.intakeFolder=bySpace.get(p.spaceId)?.intakeFolder ?? null;
write('data/photos.json',JSON.stringify(photos,null,2)+'\n');
write('data/capture-manifest.json',JSON.stringify({schemaVersion:1,source:'data/spaces.json',note:'Landmarks are approximate; verify on site. Raw photos are not public.',counts,folders:records},null,2)+'\n');
const csvCell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
write('data/촬영폴더_목록.csv','\uFEFF'+[['촬영ID','공간ID','층','종류','이름','폴더','현장확인'],...records.map(r=>[r.captureId,r.spaceId,r.floor,r.kind,r.label,r.folder,'필요'])].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n');
write('docs/STAIR_PHOTO_MAP.md','# 계단 촬영 위치표\n\n현재 근사 모델 기준의 별칭입니다. 앞/사이 관계를 현장에서 확인해 주세요. 같은 A/B/D/E는 같은 수직 계단입니다. 올라가는 구간은 아래층에 저장하며, 4층 위·1층 아래는 확인 전 생성하지 않았습니다.\n\n| 층 | 계단 ID | 촬영용 위치 이름 |\n|---|---|---|\n'+records.filter(r=>r.kind==='stair').map(r=>`| ${r.floor} | ${r.spaceId} | ${r.label} |`).join('\n')+'\n');
write('data/capture-check.json',JSON.stringify({spaces:spaces.length,mappedSpaces:spaces.filter(s=>s.intakeFolder).length,folders:records.length,counts,uniqueFolders:new Set(records.map(r=>r.folder)).size,uniqueCaptureIds:new Set(records.map(r=>r.captureId)).size,allFoldersExist:records.every(r=>fs.existsSync(path.join(root,r.folder,'촬영안내.md')))},null,2)+'\n');
console.log(JSON.stringify({folders:records.length,counts},null,2));
