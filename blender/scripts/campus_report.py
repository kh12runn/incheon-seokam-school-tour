"""Produce the human-readable current room registry from the model data."""
import json,csv
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spaces=json.loads((ROOT/'data/spaces.json').read_text(encoding='utf-8'))['spaces']
lines=['# 인천석암초등학교 현재 공간명','', '명칭: 2026학년도 교실배치도 / 형태: 제공 설계도면 / 치수: 근사값','']
for floor in ['1F','2F','3F','4F']:
 lines.extend([f'## {floor}','', '| 건물 | 공간명 | 공간 ID |','|---|---|---|'])
 for s in spaces:
  if s['floor']==floor and s['type'] in ['classroom','special_room','toilet','stair','entrance']:
   building={'MAIN':'본관','EAST_WING':'본관 동쪽','ANNEX':'별관'}.get(s['building'],s['building'])
   lines.append(f"| {building} | {s['name']} | {s['id']} |")
 lines.append('')
lines+=['지하/PIT는 현행 실명이 확인되지 않아 UNKNOWN으로 처리했다. 이전 도면의 교실 번호를 현재 학급명으로 사용하지 않았다.','']
(ROOT/'docs/ROOM_NAMES.md').write_text('\n'.join(lines),encoding='utf-8')
with (ROOT/'data/room_names.csv').open('w',encoding='utf-8-sig',newline='') as stream:
 writer=csv.writer(stream);writer.writerow(['층','건물','공간명','공간ID','Blender Object','촬영사진 넣는 폴더','내부 처리용 기존 폴더'])
 for s in spaces:writer.writerow([s['floor'],s['building'],s['name'],s['id'],s.get('blenderObject',''),s.get('intakeFolder',''),s['photoFolder']])
print({'space_records':len(spaces),'classrooms':sum(s['type']=='classroom' for s in spaces)})
