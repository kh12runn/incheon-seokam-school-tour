"""Session-local Blender sidebar and collision-aware prototype walk controls."""
import bpy
import math
import time
import json
from pathlib import Path
from mathutils import Vector, Euler

ROOT=Path(__file__).resolve().parents[2]
SETTINGS=json.loads((ROOT/'data/settings.json').read_text(encoding='utf-8'))['dimensions']

def allowed(scene, x, y, radius=.18):
    floor_ok=False
    for ob in scene.objects:
        if ob.type!='MESH': continue
        if ob.name.startswith(('Floor_', 'CORRIDOR_3F_MAIN')):
            a,b=ob.location,ob.dimensions/2
            if a.x-b.x+radius <= x <= a.x+b.x-radius and a.y-b.y+radius <= y <= a.y+b.y-radius: floor_ok=True
        if ob.get('collision'):
            a,b=ob.location,ob.dimensions/2
            if a.z+b.z < .2 or a.z-b.z>1.85: continue
            if a.x-b.x-radius<x<a.x+b.x+radius and a.y-b.y-radius<y<a.y+b.y+radius: return False
    # Door thresholds bridge the small safety margins between floor rectangles.
    if not floor_ok:
        for ob in scene.objects:
            if ob.name.startswith('DoorframeTop_'):
                if abs(x-ob.location.x)<ob.dimensions.x/2-radius and abs(y-ob.location.y)<.4: floor_ok=True
    return floor_ok

class SEOKAM_OT_overview(bpy.types.Operator):
    bl_idname='seokam.overview'; bl_label='전체 배치 보기'
    def execute(self,context):
        context.scene.camera=context.scene.objects['CAM_Overview']
        for c in context.scene.collection.children_recursive:
            if c.name.startswith('Ceilings'): c.hide_viewport=True;c.hide_render=True
        context.space_data.region_3d.view_perspective='CAMERA'
        return {'FINISHED'}

class SEOKAM_OT_walk(bpy.types.Operator):
    bl_idname='seokam.walk';bl_label='복도 걷기 (WASD / 마우스)'
    def invoke(self,context,event):
        self.camera=context.scene.objects['CAM_Walk'];context.scene.camera=self.camera
        self.camera.location=(SETTINGS['classroom_width']['value']*1.5,0,SETTINGS['camera_height']['value'])
        self.yaw=math.pi/2;self.pitch=math.pi/2;self.keys=set();self.last=time.monotonic()
        self.mx=event.mouse_x;self.my=event.mouse_y;self.area=context.area
        for c in context.scene.collection.children_recursive:
            if c.name.startswith('Ceilings'):c.hide_viewport=False;c.hide_render=False
        context.space_data.region_3d.view_perspective='CAMERA'
        self.timer=context.window_manager.event_timer_add(.025,window=context.window)
        context.window_manager.modal_handler_add(self)
        self.area.header_text_set('WASD 이동 · 마우스 시점 · ESC 종료 | 임시 치수 / 계단은 위치 표시만')
        return {'RUNNING_MODAL'}
    def modal(self,context,event):
        if event.type in {'ESC','RIGHTMOUSE'}:
            context.window_manager.event_timer_remove(self.timer);self.area.header_text_set(None)
            return {'FINISHED'}
        if event.type in {'W','A','S','D'}:
            if event.value=='PRESS':self.keys.add(event.type)
            elif event.value=='RELEASE':self.keys.discard(event.type)
        if event.type=='MOUSEMOVE':
            self.yaw-=(event.mouse_x-self.mx)*.0025
            self.pitch=max(.3,min(2.8,self.pitch-(event.mouse_y-self.my)*.0025))
            self.mx=event.mouse_x;self.my=event.mouse_y
        if event.type=='TIMER':
            now=time.monotonic();dt=min(now-self.last,.05);self.last=now
            v=Vector((float('D' in self.keys)-float('A' in self.keys),float('W' in self.keys)-float('S' in self.keys)))
            if v.length:
                v.normalize();right=Vector((math.cos(self.yaw),math.sin(self.yaw)))
                forward=Vector((math.sin(self.yaw),-math.cos(self.yaw)))
                delta=(right*v.x+forward*v.y)*SETTINGS['walk_speed_mps']['value']*dt
                p=self.camera.location
                if allowed(context.scene,p.x+delta.x,p.y):p.x+=delta.x
                if allowed(context.scene,p.x,p.y+delta.y):p.y+=delta.y
            self.camera.rotation_euler=(self.pitch,0,self.yaw)
            self.area.tag_redraw()
        return {'RUNNING_MODAL'}

class SEOKAM_PT_preview(bpy.types.Panel):
    bl_label='석암학교 미리보기';bl_idname='SEOKAM_PT_preview'
    bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='학교'
    def draw(self,context):
        self.layout.label(text='3층 본관 · 임시 추정 치수')
        self.layout.operator('seokam.overview')
        self.layout.operator('seokam.walk')
        self.layout.label(text='ESC: 걷기 종료')

for cls in [SEOKAM_OT_overview,SEOKAM_OT_walk,SEOKAM_PT_preview]:
    old=getattr(bpy.types,cls.__name__,None)
    if old:bpy.utils.unregister_class(old)
    bpy.utils.register_class(cls)

def verify_walk(scene):
    # Full corridor, threshold into classroom 5-6, and blocking walls/windows.
    path=[(12+i*.2,0) for i in range(370)]
    door=16+8*.22
    path += [(door,-i*.1) for i in range(50)]
    failed=[p for p in path if not allowed(scene,*p)]
    checks={'corridor_and_door_samples':len(path),'blocked_path_samples':failed,
            'wall_blocked':not allowed(scene,20,-1.4),
            'window_blocked':not allowed(scene,25,1.4),
            'off_floor_blocked':not allowed(scene,25,30)}
    assert not failed and all(checks[k] for k in ['wall_blocked','window_blocked','off_floor_blocked']), checks
    return checks
