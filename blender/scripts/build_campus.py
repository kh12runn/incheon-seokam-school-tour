"""Whole-campus L plan. Run inside Blender; keep original prototype scene intact."""
import bpy, json, math, shutil
from pathlib import Path
from datetime import datetime
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
TAG='campus_v2'
stamp=datetime.now().strftime('%Y%m%d_%H%M%S_%f')
backup=ROOT/'blender/backups'/('campus_'+stamp);backup.mkdir(parents=True)
bpy.ops.wm.save_as_mainfile(filepath=str(backup/'before.blend'),copy=True)
for filename in ['spaces.json','photos.json','settings.json']:
 shutil.copy2(ROOT/'data'/filename,backup/filename)
settings=json.loads((ROOT/'data/settings.json').read_text(encoding='utf-8'))
settings['campus']={'shape':'L','floors':4,'main_length':103,'annex_room_depth':8,'annex_length':60,'corridor_width':3,'floor_height':3.4,'wall_height':3.15,'wall_thickness':.18,'status':'estimated','source':'attached 1F-4F architectural plans + 2026 classroom layout','basement':'partial outline, use and dimensions UNKNOWN'}
cfg=settings['campus'];fh=cfg['floor_height'];height=cfg['wall_height'];th=cfg['wall_thickness']
(ROOT/'data/settings.json').write_text(json.dumps(settings,ensure_ascii=False,indent=2),encoding='utf-8')
old=bpy.data.scenes.get('Harness_Seokam_Campus')
if old:
 for ob in list(old.objects):
  if ob.get('owner')==TAG:bpy.data.objects.remove(ob,do_unlink=True)
 bpy.data.scenes.remove(old)
scene=bpy.data.scenes.new('Harness_Seokam_Campus');bpy.context.window.scene=scene
scene.unit_settings.system='METRIC';scene['owner']=TAG;scene['active_floor']=0
scene['source_priority']='architectural geometry / 2026 current names / approximate dimensions'
def coll(name,parent):
 c=bpy.data.collections.new(name);parent.children.link(c);c['owner']=TAG;return c
root=coll('CAMPUS_SCHOOL',scene.collection)
site=coll('Campus_Exterior',root)
layers={f:coll(f'Campus_FLOOR_{f}',root) for f in range(1,5)}
for f,c in layers.items():c['floor']=f
cats={}
for f in layers:
 for cat in ['Rooms','Floors','Walls','Windows','Doors','Stairs','Corridors','Labels','PhotoPoints']:
  cats[f,cat]=coll(f'{f}F_{cat}',layers[f])
roof=coll('Campus_Roof',root);roof['roof']=True
base=coll('Campus_Basement_UNKNOWN',root)

def link(ob,c,f=0,sid=None):
 c.objects.link(ob);ob['owner']=TAG;ob['floor']=f;ob['dimensionsStatus']='estimated'
 if sid:ob['spaceId']=sid
 return ob

materials={}
def mat(color):
 key=tuple(color)
 if key not in materials:
  m=bpy.data.materials.new('Campus_Material_'+str(len(materials)));m.diffuse_color=(*color,1);materials[key]=m
 return materials[key]

def box(name,center,size,color,c,f=0,sid=None,collision=False):
 x,y,z=[v/2 for v in size]
 verts=[(-x,-y,-z),(-x,-y,z),(-x,y,-z),(-x,y,z),(x,-y,-z),(x,-y,z),(x,y,-z),(x,y,z)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]);mesh.update()
 ob=link(bpy.data.objects.new(name,mesh),c,f,sid);ob.location=center;ob.color=(*color,1);ob.data.materials.append(mat(color));ob['collision']=collision
 return ob

font=bpy.data.fonts.load('C:/Windows/Fonts/malgun.ttf')
def text(name,body,loc,size,c,f=0,sid=None,rotation=None):
 data=bpy.data.curves.new(name,'FONT');data.body=body;data.size=size;data.align_x='CENTER';data.align_y='CENTER';data.font=font
 ob=link(bpy.data.objects.new(name,data),c,f,sid);ob.location=loc;ob.color=(.025,.07,.10,1);data.materials.append(mat((.025,.07,.10)))
 if rotation:ob.rotation_euler=rotation
 return ob

data=json.loads((ROOT/'data/spaces.json').read_text(encoding='utf-8'));byid={s['id']:s for s in data['spaces']}
modeled={};positions={};rects=[];photo_points=[]
palette={1:(.89,.71,.49),2:(.73,.65,.83),3:(.45,.73,.64),4:(.83,.75,.38)}
wall=(.83,.85,.83);frame=(.43,.48,.47);glass=(.35,.59,.69)

def ensure(sid,name,f,kind='special_room',building='MAIN'):
 if sid not in byid:
  byid[sid]={'id':sid,'name':name,'floor':f'{f}F','type':kind,'building':building,'photoFolder':f'photos/raw/{f}F/{kind}s/{sid}/','displayMode':'hybrid','dimensionsStatus':'estimated','layoutStatus':'architectural_plan_matched'}
 return byid[sid]

def wallpart(name,a,b,z,c,f,sid):
 if abs(a[0]-b[0])<.001:
  return box(name,((a[0]+b[0])/2,(a[1]+b[1])/2,z+height/2),(th,abs(b[1]-a[1]),height),wall,c,f,sid,True)
 return box(name,((a[0]+b[0])/2,(a[1]+b[1])/2,z+height/2),(abs(b[0]-a[0]),th,height),wall,c,f,sid,True)

def room(sid,f,x0,x1,y0,y1,door='N',name=None):
 s=byid[sid] if sid in byid else ensure(sid,name or 'UNKNOWN',f)
 name=name or s['name'];z=(f-1)*fh
 s['name']=name;s['blenderObject']='SPACE_'+sid;s['modelStatus']='modeled';s['positionStatus']='estimated_plan_aligned'
 s['bounds']=[x0,x1,y0,y1,z,z+height];s['nameSource']='2026 classroom layout' if 'UNKNOWN' not in name else 'unknown'
 anchor=link(bpy.data.objects.new('SPACE_'+sid,None),cats[f,'Rooms'],f,sid);anchor.location=((x0+x1)/2,(y0+y1)/2,z)
 color=palette[f] if s['type']=='classroom' else (.60,.75,.81)
 if 'TOILET' in sid:color=(.55,.71,.78)
 box('Floor_'+sid,((x0+x1)/2,(y0+y1)/2,z-.10),(x1-x0,y1-y0,.20),color,cats[f,'Floors'],f,sid)
 rects.append((sid,f,x0,x1,y0,y1))
 sides={'N':((x0,y1),(x1,y1)),'S':((x0,y0),(x1,y0)),'E':((x1,y0),(x1,y1)),'W':((x0,y0),(x0,y1))}
 doorxy=None
 for side,(a,b) in sides.items():
  if side==door:
   along=Vector((b[0]-a[0],b[1]-a[1]));length=along.length;along.normalize();opening=min(1.2,length*.35)
   mid=Vector(a)+along*length*.35;left=mid-along*opening/2;right=mid+along*opening/2
   wallpart('Wall_'+sid,a,left,z,cats[f,'Walls'],f,sid);wallpart('Wall_'+sid,right,b,z,cats[f,'Walls'],f,sid)
   dims=(opening,th,height-2.25) if side in ['N','S'] else (th,opening,height-2.25)
   box('Lintel_'+sid,(*mid,z+2.25+(height-2.25)/2),dims,wall,cats[f,'Walls'],f,sid)
   for p in [left,right]:box('Doorframe_'+sid,(*p,z+1.1),(.075,.075,2.2),(.54,.38,.23),cats[f,'Doors'],f,sid)
   rot={'N':(math.pi/2,0,math.pi),'S':(math.pi/2,0,0),'E':(math.pi/2,0,math.pi/2),'W':(math.pi/2,0,-math.pi/2)}[side]
   offset={'N':(0,.13),'S':(0,-.13),'E':(.13,0),'W':(-.13,0)}[side]
   text('Sign_'+sid,name,(mid.x+offset[0],mid.y+offset[1],z+2.6),min(.27,2.8/max(len(name),1)),cats[f,'Labels'],f,sid,rot)
   doorxy=list(mid)
  else:
   wallpart('Wall_'+sid,a,b,z,cats[f,'Walls'],f,sid)
 # Exterior inset blue window strips give a readable school facade.
 side='S' if door=='N' else 'N' if door=='S' else 'W' if door=='E' else 'E'
 if side in ['N','S']:
  yy=y1+.105 if side=='N' else y0-.105
  n=max(1,int((x1-x0)/2.2))
  for i in range(n):
   xx=x0+(i+.5)*(x1-x0)/n
   box('Window_'+sid,(xx,yy,z+1.65),((x1-x0)/n-.25,.06,1.35),glass,cats[f,'Windows'],f,sid)
 else:
  xx=x0-.105 if side=='W' else x1+.105;n=max(1,int((y1-y0)/2.2))
  for i in range(n):box('Window_'+sid,(xx,y0+(i+.5)*(y1-y0)/n,z+1.65),(.06,(y1-y0)/n-.25,1.35),glass,cats[f,'Windows'],f,sid)
 # Floor text is revealed in cutaway mode; exterior signage stays attached to walls.
 display=name
 if len(display)>9:
  if '(' in display:display=display.replace('(','\n(')
  else:display=display[:len(display)//2]+'\n'+display[len(display)//2:]
 size=min(1.05,(x1-x0)*.85/max(max(map(len,display.splitlines()))*.55,1))
 text('Label_'+sid,display,((x0+x1)/2,(y0+y1)/2,z+.025),size,cats[f,'Labels'],f,sid)
 point=link(bpy.data.objects.new('PHOTOPOINT_'+sid,None),cats[f,'PhotoPoints'],f,sid);point.location=((x0+x1)/2,(y0+y1)/2,z+1.6);point.empty_display_size=.2
 photo_points.append({'photoPointId':point.name,'spaceId':sid,'rawFolder':s['photoFolder'],'processedFolder':s['photoFolder'].replace('/raw/','/processed/'),'panorama':None,'position':None,'prototypePosition':list(point.location),'positionStatus':'estimated'})
 modeled[sid]=anchor.name;positions[sid]=list(anchor.location)

def corridor(sid,f,bounds,name):
 x0,x1,y0,y1=bounds;z=(f-1)*fh
 box('SPACE_'+sid,((x0+x1)/2,(y0+y1)/2,z-.1),(x1-x0,y1-y0,.2),(.77,.79,.75),cats[f,'Corridors'],f,sid)
 s=ensure(sid,name,f,'corridor');s['bounds']=[x0,x1,y0,y1,z,z+height];s['blenderObject']='SPACE_'+sid;s['modelStatus']='modeled';modeled[sid]='SPACE_'+sid

def stair(sid,f,bounds,name):
 x0,x1,y0,y1=bounds;z=(f-1)*fh
 corridor(sid,f,bounds,name);s=byid[sid];s['type']='stair';s['geometryStatus']='simplified_switchback'
 # Landings remain explicit. Flights are representative, not measured geometry.
 width=(x1-x0)*.42;run=(y1-y0)*.7;n=10
 for i in range(n):
  box('Step_'+sid,(x0+width/2,y0+(i+.5)*run/n,z+(i+1)*fh/2/n-.06),(width,run/n,.12),(.63,.67,.65),cats[f,'Stairs'],f,sid)
  if f<4:box('StepReturn_'+sid,(x1-width/2,y1-(i+.5)*run/n,z+fh/2+(i+1)*fh/2/n-.06),(width,run/n,.12),(.63,.67,.65),cats[f,'Stairs'],f,sid)
 box('Landing_'+sid,((x0+x1)/2,y0+run+.5,z+fh/2-.08),(x1-x0,1,.16),(.65,.69,.67),cats[f,'Stairs'],f,sid)
 text('Label_'+sid,name,((x0+x1)/2,y0+.3,z+.03),.55,cats[f,'Labels'],f,sid)

# Main block: current labels in west-to-east order.
rows={
 1:[('3-4',10),('3-3',10),('3-2',10),('3-1',10),('MAIN_LOBBY',10),('ADMIN',9),('NURSE',6),('PRINTING',6),('MEAL_CART_STORAGE',9)],
 2:[('CARE_DREAM_HOPE',10),('CARE_DREAM_WISH',10),('CARE_DREAM_LOVE',10),('PRINCIPAL',7),('OPERATIONS_MEETING',6),('STAFF',13),('BROADCAST',8),('3-5',8),('3-6',8)],
 3:[('5-7',10),('5-6',10),('5-5',10),('5-4',10),('5-3',10),('5-2',10),('5-1',10),('4-5',10)],
 4:[('6-7',10),('6-6',10),('6-5',10),('6-4',10),('6-3',10),('6-2',10),('6-1',10),('4-1',10)]}
annex={
 1:['1-6','1-5','INDIVIDUAL_5','INDIVIDUAL_4','1-4','1-3'],
 2:['INDIVIDUAL_2','INDIVIDUAL_1','3-7','2-6','1-2','1-1'],
 3:['4-7','4-8','2-5','2-4','GRADE1_RESEARCH','INDIVIDUAL_3'],
 4:['4-4','2-3','2-2','2-1','KINDERGARTEN','GRADE2_RESEARCH','COMPUTER']}
ensure('1F_MAIN_LOBBY','본관 현관',1,'entrance')
for f in range(1,5):
 z=(f-1)*fh
 corridor(f'{f}F_MAIN_CORRIDOR_01',f,(0,50,0,3),'본관 서쪽 복도')
 corridor(f'{f}F_MAIN_CORRIDOR_02',f,(50,103,0,3),'본관 동쪽 복도')
 corridor(f'{f}F_ANNEX_CORRIDOR_01',f,(100,103,-73,0),'별관 복도')
 if f>1:corridor(f'{f}F_CONNECTOR',f,(100,103,-13,-7),f'{f}층 연결복도')
 xx=0
 for code,width in rows[f]:room(f'{f}F_{code}',f,xx,xx+width,-7,0);xx+=width
 stair(f'{f}F_MAIN_STAIR_A',f,(0,5,3,10),'본관 계단 A')
 room(f'{f}F_MAIN_TOILET_A',f,5,10,3,10,'S')
 stair(f'{f}F_MAIN_STAIR_B',f,(50,55,3,10),'본관 계단 B')
 room(f'{f}F_MAIN_TOILET_B',f,55,61,3,10,'S')
 if f==1:
  room('1F_STORAGE_1',f,38,45,3,10,'S');room('1F_NIGHT_DUTY',f,45,50,3,10,'S')
  room('1F_STORAGE_2',f,-12,0,2,10,'E');room('1F_MULTIPURPOSE',f,-12,0,-7,2,'E')
  room('1F_CAFETERIA',f,80,100,-7,0)
  room('1F_NUTRITION',f,80,87,3,10,'S');room('1F_COOKING',f,87,100,3,10,'S')
 elif f==2:
  room('2F_GRADE3_RESEARCH',f,44,50,3,10,'S')
  room('2F_AUDIO_VISUAL',f,-14,-3,-7,10,'E');room('2F_KOREAN_CLASS',f,-3,0,-7,10,'E')
  room('2F_SCIENCE',f,80,100,-7,0)
  room('2F_SCIENCE_PREP',f,80,87,3,10,'S');room('2F_INTELLIGENT_SCIENCE',f,87,100,3,10,'S')
 elif f==3:
  room('3F_COUNSELING',f,-10,0,-7,0,'E');room('3F_GRADE5_RESEARCH',f,44,50,3,10,'S')
  room('3F_4-6',f,80,100,-7,0);room('3F_BOOK_LIBRARY',f,80,100,3,10,'S')
 else:
  room('4F_GRADE6_RESEARCH',f,44,50,3,10,'S')
  room('4F_4-2',f,80,100,-7,0);room('4F_GRADE4_RESEARCH',f,80,88,3,10,'S');room('4F_4-3',f,88,100,3,10,'S')
 # Annex starts at its north stair/toilet bay and runs southwards.
 room(f'{f}F_ANNEX_TOILET_A',f,92,100,-13,-7,'E')
 stair(f'{f}F_ANNEX_STAIR_D',f,(92,100,-19,-13),'별관 계단 D')
 ensure(f'{f}F_ANNEX_STAIR_E','별관 계단 E',f,'stair','ANNEX')
 stair(f'{f}F_ANNEX_STAIR_E',f,(92,100,-46,-40),'별관 계단 E')
 y=-19
 for i,code in enumerate(annex[f]):
  if i==3:y=-46
  length=7 if i<3 else (27/(len(annex[f])-3))
  room(f'{f}F_{code}',f,92,100,y-length,y,'E');y-=length
 # Narrow outer corridor facade and repeating strip windows.
 box(f'{f}F_EastSill',(103,-35,z+.45),(.18,76,.9),wall,cats[f,'Walls'],f,collision=True)
 box(f'{f}F_EastHeader',(103,-35,z+2.9),(.18,76,.5),wall,cats[f,'Walls'],f,collision=True)
 for i in range(38):box(f'{f}F_EastGlass',(103.01,-72+i*2,z+1.8),(.05,1.86,1.7),glass,cats[f,'Windows'],f)
 for a,b in [(10,38 if f==1 else 44),(61,80)]:
  box(f'{f}F_NorthSill',((a+b)/2,3,z+.45),(b-a,.18,.9),wall,cats[f,'Walls'],f)
  for i in range(math.ceil((b-a)/2)):
   x=a+(i+.5)*(b-a)/math.ceil((b-a)/2)
   box(f'{f}F_NorthGlass',(x,3.01,z+1.8),((b-a)/math.ceil((b-a)/2)-.08,.05,1.7),glass,cats[f,'Windows'],f)
 # Floors/cornice bands identify four storeys in the assembled view.
 box(f'{f}F_SouthBand',(40,-7.12,z+.1),(80,.22,.25),palette[f],cats[f,'Walls'],f)
 text(f'{f}F_BuildingMark',f'{f}층',(-.15,-7.18,z+2),.9,cats[f,'Labels'],f,rotation=(math.pi/2,0,0))
 text(f'{f}F_Heading',f'{f}층  |  본관 + 별관', (38,16,z),1.7,cats[f,'Labels'],f)

# Roof pieces cover only actual spaces, with a roof over the two L corridors.
for sid,f,x0,x1,y0,y1 in rects:
 if f==4:box('Roof_'+sid,((x0+x1)/2,(y0+y1)/2,4*fh),(x1-x0,y1-y0,.22),(.44,.51,.54),roof)
for center,size in [((51.5,1.5,4*fh),(103,3,.22)),((101.5,-36.5,4*fh),(3,73,.22))]:box('Roof_Corridor',center,size,(.44,.51,.54),roof)
box('Auditorium_roof',(-8.5,1.5,2*fh),(11,17,.22),(.48,.53,.55),roof)

# Playground and named exterior zones: diagram-relative, approximate outlines.
box('SPACE_EXT_PLAYGROUND',(38,-40,-.45),(95,58,.3),(.74,.65,.47),site,sid='EXT_PLAYGROUND')
box('SiteGround',(44,-30,-.7),(135,113,.2),(.60,.70,.57),site)
for sid,title,center,size in [
 ('EXT_PLAY_AREA','놀이터 및 모래터',(-8,-57,-.24),(8,18,.12)),
 ('EXT_SCHOOL_GARDEN','학교텃밭',(35,-76,-.24),(24,5,.12)),
 ('EXT_MEDITATION_GROVE','명상숲',(76,-76,-.24),(18,5,.12)),
 ('EXT_ROSTRUM','구령대',(44,-11,.1),(12,3,.8))]:
 box('SPACE_'+sid,center,size,(.55,.65,.50),site,sid=sid);text('Label_'+sid,title,(center[0],center[1],center[2]+size[2]/2+.03),.95,site,sid=sid)
text('PlaygroundLabel','운  동  장',(37,-39,-.25),3.5,site,sid='EXT_PLAYGROUND')
for sid,title,x,y in [('EXT_MAIN_GATE','정문',-16,-27),('EXT_REAR_GATE','후문',48,21),('EXT_MAIN_ENTRANCE','본관 출입구',45,-10),('EXT_ANNEX_ENTRANCE','별관 출입구',89,-16),('EXT_GUARD_POST','배움터지킴이실',-17,-15)]:
 ob=link(bpy.data.objects.new('SPACE_'+sid,None),site,sid=sid);ob.location=(x,y,.1)
 text('Label_'+sid,title,(x,y,.1),.9,site,sid=sid)
# Basement/PIT inferred from supplied basement page; no invented named classrooms.
box('Basement_UNKNOWN',(-8,1,-1.8),(12,16,2.4),(.45,.47,.48),base)
text('Basement_label','지하 / PIT · 용도 확인 필요',(-8,1,-.5),.55,base)
base.hide_viewport=True;base.hide_render=True

def camera(name,loc,target,ortho=None):
 d=bpy.data.cameras.new(name);ob=link(bpy.data.objects.new(name,d),root);ob.location=loc;ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler();d.clip_end=1000
 if ortho:d.type='ORTHO';d.ortho_scale=ortho
 else:d.lens=43
 return ob
cam=camera('Campus_Camera',(190,-190,150),(43,-26,2),175)
scene.camera=cam
scene.render.engine='BLENDER_WORKBENCH';scene.render.resolution_x=1450;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
sh=scene.display.shading;sh.light='STUDIO';sh.studio_light='paint.sl';sh.color_type='MATERIAL';sh.show_shadows=True;sh.show_cavity=True;sh.cavity_type='BOTH'
scene.world=bpy.data.worlds.new('Campus_World');scene.world.color=(.85,.89,.92)
sh.background_type='WORLD';scene.view_settings.view_transform='Standard'
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':
  sp=area.spaces.active;target=Vector((44,-28,3));eye=Vector((175,-180,142))
  sp.region_3d.view_perspective='PERSP';sp.region_3d.view_rotation=(target-eye).to_track_quat('-Z','Y');sp.region_3d.view_location=target;sp.region_3d.view_distance=205;sp.region_3d.update()
  sp.shading.color_type='MATERIAL';sp.shading.studio_light='paint.sl';sp.overlay.show_overlays=False
  sp.show_region_ui=True;area.header_text_set(None)

# Registry is the authoritative mapping; old unattached media remains untouched.
for sid,obname in modeled.items():
 byid[sid]['blenderObject']=obname
for s in byid.values():
 if s['floor']=='EXTERIOR' and 'SPACE_'+s['id'] in scene.objects:s['blenderObject']='SPACE_'+s['id'];s['modelStatus']='modeled'
 for p in [s['photoFolder'],s['photoFolder'].replace('/raw/','/processed/')]: (ROOT/p).mkdir(parents=True,exist_ok=True)
data['spaces']=list(byid.values());data['prototypeFloor']=None;data['scope']='whole_campus_1F_4F';data['sourceRole']='2026 names + attached architectural L-plan geometry, approximate size'
(ROOT/'data/spaces.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
photos=json.loads((ROOT/'data/photos.json').read_text(encoding='utf-8'));photos['photoPoints']=photo_points
(ROOT/'data/photos.json').write_text(json.dumps(photos,ensure_ascii=False,indent=2),encoding='utf-8')
# Validate each class appears exactly once and every room has a real name label.
classrooms=[s for s in byid.values() if s['type']=='classroom'];missing=[s['id'] for s in classrooms if s['id'] not in modeled]
overlaps=[]
for i,a in enumerate(rects):
 for b in rects[i+1:]:
  if a[1]==b[1] and min(a[3],b[3])-max(a[2],b[2])>.01 and min(a[5],b[5])-max(a[4],b[4])>.01:overlaps.append([a[0],b[0]])
assert not missing,("missing classrooms",missing)
assert not overlaps,("room overlaps",overlaps)
report={'scene':scene.name,'floors':4,'classrooms':len(classrooms),'rooms_and_specials':len(rects),'modeled_spaces':len(modeled),'objects':len(scene.objects),'missing_classrooms':missing,'room_overlaps':overlaps,'dimensions':'estimated','basement':'partial UNKNOWN; hidden','old_prototype_preserved':True}
(ROOT/'data/campus-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
txt=bpy.data.texts.get('build_campus.py') or bpy.data.texts.new('build_campus.py');txt.clear();txt.write((ROOT/'blender/scripts/build_campus.py').read_text(encoding='utf-8'))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/school_master.blend'))
bpy.ops.wm.save_as_mainfile(filepath=str(backup/'campus_completed.blend'),copy=True)
print(json.dumps(report,ensure_ascii=False))
