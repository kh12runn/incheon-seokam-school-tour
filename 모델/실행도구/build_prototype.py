"""Run inside Blender. Owned scene only; every rebuild first saves a checkpoint."""
import bpy
import json
import math
from datetime import datetime
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
CFG = json.loads((ROOT / '공간자료/settings.json').read_text(encoding='utf-8'))
D = {k: v['value'] for k,v in CFG['dimensions'].items()}
stamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'모델/백업'/f'before_prototype_{stamp}.blend'), copy=True)
name = 'Harness_Seokam_3F'
old = bpy.data.scenes.get(name)
if old:
    for ob in list(old.objects):
        if ob.get('seokam_owned'): bpy.data.objects.remove(ob, do_unlink=True)
    bpy.data.scenes.remove(old)
scene = bpy.data.scenes.new(name)
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene['dimensionsStatus'] = 'estimated'
scene['scope'] = '3F MAIN ONLY / layout-based prototype / not 3DGS reconstruction'

def collection(name, parent):
    c = bpy.data.collections.new(name)
    parent.children.link(c)
    return c
school = collection('SCHOOL', scene.collection)
floors = {i: collection('FLOOR_'+str(i),school) for i in range(1,5)}
collection('EXTERIOR',school)
cats = {n:collection(n,floors[3]) for n in ['Walls','Floors','Ceilings','Doors','Windows','Corridors','Stairs','Rooms','PhotoPoints','Labels','Cameras']}

def link(ob,cat):
    cats[cat].objects.link(ob)
    ob['seokam_owned'] = True
    ob['dimensionsStatus'] = 'estimated'
    return ob

def box(name,xyz,size,color,cat='Walls',collision=False):
    x,y,z = [v/2 for v in size]
    verts=[(-x,-y,-z),(-x,-y,z),(-x,y,-z),(-x,y,z),(x,-y,-z),(x,-y,z),(x,y,-z),(x,y,z)]
    faces=[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    ob=link(bpy.data.objects.new(name,mesh),cat); ob.location=xyz; ob.color=(*color,1)
    ob['collision']=collision
    return ob

fontpath=Path('C:/Windows/Fonts/malgun.ttf')
font=bpy.data.fonts.load(str(fontpath)) if fontpath.exists() else None
def label(name,body,loc,size=.7,rotation=None):
    curve=bpy.data.curves.new(name,'FONT'); curve.body=body; curve.size=size; curve.align_x='CENTER'
    if font: curve.font=font
    ob=link(bpy.data.objects.new(name,curve),'Labels'); ob.location=loc; ob.color=(.035,.065,.09,1)
    if rotation: ob.rotation_euler=rotation
    return ob

w=D['classroom_width']; dep=D['classroom_depth']; cw=D['corridor_width']; h=D['clear_height']; t=D['wall_thickness']
L=11*w; south=-cw/2; north=cw/2
wall=(.82,.84,.81); mint=(.42,.70,.61); gold=(.85,.69,.33); blue=(.51,.67,.74)
box('CORRIDOR_3F_MAIN', (L/2,0,-.12),(L,cw,.24),(.68,.71,.69),'Corridors')
box('Corridor_ceiling',(L/2,0,h+.08),(L,cw,.16),(.87,.88,.86),'Ceilings')
cats['Ceilings'].hide_render=True
cats['Ceilings'].hide_viewport=True

# South classroom row exactly follows the order of the supplied plan.
room_specs=[('3F_5-'+str(k),str(5)+'-'+str(k), (8-k)*w,w,dep,mint) for k in range(7,0,-1)]
room_specs += [('3F_4-5','4-5',8*w,w,dep,gold),('3F_4-6','4-6',9*w,2*w,dep,gold)]
room_positions={}
door_centers=[]
def room(sid,title,x,width,depth,color,side=-1):
    yy=side*(cw/2+depth/2); boundary=side*cw/2
    anchor=link(bpy.data.objects.new('ROOM_'+sid,None),'Rooms'); anchor.location=(x+width/2,yy,0); anchor['spaceId']=sid
    room_positions[sid]=(x+width/2,yy,0)
    box('Floor_'+sid,(x+width/2,yy,-.1),(width,depth,.2),color,'Floors')
    box('Outer_'+sid,(x+width/2,side*(cw/2+depth),h/2),(width,t,h),wall,collision=True)
    for xx in (x,x+width): box('Partition_'+sid,(xx,yy,h/2),(t,depth,h),wall,collision=True)
    door=x+width*.22; dw=D['door_width']; dh=D['door_height']; door_centers.append((door,boundary))
    for a,b in [(x,door-dw/2),(door+dw/2,x+width)]:
        if b>a: box('Wall_'+sid,((a+b)/2,boundary,h/2),(b-a,t,h),wall,collision=True)
    box('Lintel_'+sid,(door,boundary,(h+dh)/2),(dw,t,h-dh),wall,collision=True)
    for dx in [-dw/2,dw/2]: box('Doorframe_'+sid,(door+dx,boundary,dh/2),(.045,t+.03,dh),(.47,.31,.17),'Doors')
    box('DoorframeTop_'+sid,(door,boundary,dh),(dw+.08,t+.03,.055),(.47,.31,.17),'Doors')
    label('RoomLabel_'+sid,title,(x+width/2,yy,.025),min(1.05,width/7))
    # Corridor-facing signage, facing into corridor.
    label('DoorSign_'+sid,title,(door,boundary-side*.12,2.35),.28,(math.pi/2,0,math.pi if side==-1 else 0))
    point=link(bpy.data.objects.new('PHOTOPOINT_'+sid,None),'PhotoPoints');point.location=(x+width/2,yy,D['camera_height']);point.empty_display_size=.3
    point['spaceId']=sid;point['positionStatus']='estimated_unassigned_capture'

for r in room_specs: room(*r)
room('3F_COUNSELING','상담실',0,w*.6,dep,blue)
# The remainder of the west-end bay marks stair A, without inventing stair flights.
box('STAIR_3F_MAIN_STAIR_A',(.8*w,-cw/2-dep/2,.02),(.4*w,dep,.04),(.79,.46,.28),'Stairs')
label('StairA_label','계단 A\n위치만 표시',(.8*w,-cw/2-dep/2,.08),.43)

# Northern service bays and eastern library retain the plan's relative alignment.
for sid,title,x,width,color in [('3F_MAIN_TOILET_A','화장실 A',w,w,blue),('3F_GRADE5_RESEARCH','5학년 연수실',4.65*w,.65*w,blue),('3F_MAIN_TOILET_B','화장실 B',6*w,.8*w,blue),('3F_BOOK_LIBRARY','책터 도서관',9*w,2*w,gold)]:
    room(sid,title,x,width,dep*.65,color,1)
box('STAIR_3F_MAIN_STAIR_B',(5.65*w,north+dep*.325,.02),(.7*w,dep*.65,.04),(.79,.46,.28),'Stairs')
label('StairB_label','계단 B\n위치만 표시',(5.65*w,north+dep*.28,.08),.55)

# Northern corridor windows occupy the remaining intervals; all openings estimated.
occupied=[(w,2*w),(4.65*w,6.8*w),(9*w,11*w)]
for a,b in [(0,w),(2*w,4.65*w),(6.8*w,9*w)]:
    box('Window_sill',((a+b)/2,north,.45),(b-a,t,.9),(.51,.65,.72),collision=True)
    box('Window_header',((a+b)/2,north,2.8),(b-a,t,.4),wall,collision=True)
    box('Window_glass',((a+b)/2,north,1.8),(b-a,.035,1.8),(.69,.84,.87),'Windows',True)
    for i in range(math.ceil((b-a)/1.5)+1):
        xx=min(b,a+i*1.5);box('Window_mullion',(xx,north,1.8),(.06,.14,1.8),(.80,.83,.82),'Windows')
for xx in [0,L]: box('Corridor_end',(xx,0,h/2),(t,cw,h),wall,collision=True)
label('Header','인천석암초등학교  |  본관 3층',(L/2,11,.1),1.6)
label('Disclaimer','배치도 기반 공간 검토 · 모든 치수 임시 추정 · 다른 층 미제작',(L/2,8.5,.1),.8)
label('South_hint','운동장 쪽 (배치도 하단)',(L/2,-11,.1),.8)
label('Connector_hint','별관 연결복도 → 위치·형태 TODO',(L-2,-11,.1),.55)
for i,xx in enumerate([w*2,w*5,w*8],1):
    ob=link(bpy.data.objects.new(f'PHOTOPOINT_3F_MAIN_CORRIDOR_{i:02}',None),'PhotoPoints');ob.location=(xx,0,D['camera_height']);ob['positionStatus']='estimated'

def camera(name,loc,target,ortho=None):
    data=bpy.data.cameras.new(name);ob=link(bpy.data.objects.new(name,data),'Cameras');ob.location=loc
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    data.clip_end=500;data.clip_start=.05
    if ortho: data.type='ORTHO';data.ortho_scale=ortho
    else: data.angle=math.radians(D['camera_fov_degrees'])
    return ob
overview=camera('CAM_Overview',(L/2,-60,78),(L/2,0,0),L*1.1)
walk=camera('CAM_Walk',(w*1.5,0,D['camera_height']),(w*5,0,D['camera_height']))
scene.camera=overview
scene.render.engine='BLENDER_WORKBENCH'
scene.render.resolution_x=1400;scene.render.resolution_y=620;scene.render.resolution_percentage=100
sh=scene.display.shading;sh.light='STUDIO';sh.color_type='OBJECT';sh.show_shadows=True;sh.show_cavity=True
sh.studio_light='paint.sl'
sh.cavity_type='BOTH';sh.background_type='WORLD';sh.background_color=(.92,.94,.95)
scene.world=bpy.data.worlds.new('Harness_School_World');scene.world.color=(.85,.88,.90)
scene.view_settings.view_transform='Standard'
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.shading.color_type='OBJECT'
        area.spaces.active.overlay.show_overlays=False

# Save metadata only for actual modeled IDs. Actual photo coordinates remain null.
photos=json.loads((ROOT/'공간자료/photos.json').read_text(encoding='utf-8'))
spaces=json.loads((ROOT/'공간자료/spaces.json').read_text(encoding='utf-8'))
byid={s['id']:s for s in spaces['spaces']}
points=[]
for sid,xyz in room_positions.items():
    s=byid.get(sid)
    if s:
        s['modelStatus']='prototype';s['blenderObject']='ROOM_'+sid
        points.append({'photoPointId':'PHOTOPOINT_'+sid,'spaceId':sid,'type':'panorama','rawFolder':s['photoFolder'],'processedFolder':s['photoFolder'].replace('/raw/','/processed/'),'panorama':None,'position':{'x':None,'y':None,'z':None},'prototypePosition':list(xyz[:2])+[D['camera_height']],'positionStatus':'estimated'})
photos['photoPoints']=points
(ROOT/'공간자료/photos.json').write_text(json.dumps(photos,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'공간자료/spaces.json').write_text(json.dumps(spaces,ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'모델/school_master.blend'))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'모델/백업'/f'school_phase04_{stamp}.blend'),copy=True)
print(json.dumps({'scene':scene.name,'objects':len(scene.objects),'rooms':len(room_positions),'file':str(ROOT/'모델/school_master.blend'),'dimensions':'estimated'},ensure_ascii=False))
