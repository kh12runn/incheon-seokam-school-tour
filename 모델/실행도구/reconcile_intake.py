"""Correct physical floor assignments after visually reading annex column bands."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
path=ROOT/'공간자료/spaces.json'
data=json.loads(path.read_text(encoding='utf-8'))
annex={
 '1-1':'2F','1-2':'2F','1-3':'1F','1-4':'1F','1-5':'1F','1-6':'1F',
 '2-1':'4F','2-2':'4F','2-3':'4F','2-4':'3F','2-5':'3F','2-6':'2F',
 '3-7':'2F','4-4':'4F','4-7':'3F','4-8':'3F',
 'GRADE1_RESEARCH':'3F','GRADE2_RESEARCH':'4F','KINDERGARTEN':'4F','COMPUTER':'4F',
 'INDIVIDUAL_1':'2F','INDIVIDUAL_2':'2F','INDIVIDUAL_3':'3F','INDIVIDUAL_4':'1F','INDIVIDUAL_5':'1F',
}
corrected=[]
for s in data['spaces']:
    if s['type']=='stair' and '_MAIN_STAIR_C' in s['id']:
        continue  # Grey east band is a FLOOR LABEL, not a third staircase.
    if s['building']=='ANNEX':
        code=s['id'].split('_',1)[1]
        if code in annex:
            floor=annex[code];previous=s['floor'];s['floor']=floor;s['id']=floor+'_'+code
            s['blenderObject']=('ROOM_' if s['type']=='classroom' else 'SPECIAL_')+s['id']
            category='classrooms' if s['type']=='classroom' else 'special_rooms'
            s['photoFolder']=f'사진보관/원본/{floor}/{category}/{code if category=="classrooms" else code.lower()}/'
            s['layoutStatus']='observed_composite_column';s['notes']='별관 도식의 1~4층 열에 따라 물리 층 지정; 현장 확인 대기'
    corrected.append(s)
if not any(s['id']=='2F_GRADE3_RESEARCH' for s in corrected):
    corrected.append({'id':'2F_GRADE3_RESEARCH','name':'3학년 연수실','type':'special_room','floor':'2F','building':'MAIN','blenderObject':'SPECIAL_2F_GRADE3_RESEARCH','photoFolder':'사진보관/원본/2F/special_rooms/grade3_research/','displayMode':'hybrid','dimensionsStatus':'estimated','layoutStatus':'observed'})
data['spaces']=corrected
data['prototypeFloor']='3F_MAIN'
for s in corrected:
    (ROOT/s['photoFolder']).mkdir(parents=True,exist_ok=True)
    (ROOT/s['photoFolder'].replace('/raw/','/processed/')).mkdir(parents=True,exist_ok=True)
assert len({s['id'] for s in corrected})==len(corrected)
path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'spaces':len(corrected),'note':'legacy empty photo directories retained; spaces.json is authoritative'}))
