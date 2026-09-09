"""Whole school / floor cutaway controls for the current Blender session."""
import bpy
from pathlib import Path
from mathutils import Vector

def campus_view(floor=0, top=False):
 s=bpy.data.scenes['Harness_Seokam_Campus'];bpy.context.window.scene=s
 s['active_floor']=floor
 for c in s.collection.children_recursive:
  if c.get('owner')!='campus_v2':continue
  if c.get('floor'):
   hide=floor!=0 and c['floor']!=floor;c.hide_viewport=hide;c.hide_render=hide
  if c.get('roof'):c.hide_viewport=floor!=0;c.hide_render=floor!=0
  if c.name.startswith('Campus_Exterior'):c.hide_viewport=floor!=0;c.hide_render=floor!=0
 for ob in s.objects:
  if 'F_Heading' in ob.name:ob.hide_viewport=floor==0;ob.hide_render=floor==0
 z=max(floor-1,0)*3.4
 target=Vector((44,-27,z));eye=Vector((175,-180,z+142))
 for area in bpy.context.screen.areas:
  if area.type=='VIEW_3D':
   sp=area.spaces.active;r=sp.region_3d
   r.view_perspective='ORTHO' if top else 'PERSP'
   r.view_rotation=(Vector((0,0,-1)).to_track_quat('-Z','Y') if top else (target-eye).to_track_quat('-Z','Y'))
   r.view_location=target;r.view_distance=155 if top else 195
   if not bpy.app.background:r.update()
   sp.overlay.show_overlays=False;sp.show_region_ui=True;sp.shading.color_type='MATERIAL'
   area.header_text_set('학교 전체 · 휠 누르고 드래그: 회전 | 학교 탭: 층별 교실명 확인' if not floor else f'{floor}층 교실 배치 · 이름은 2026학년도 배치도 기준')
   area.tag_redraw()
 cam=s.objects['Campus_Camera'];s.camera=cam
 if top:
  cam.location=(44,-27,z+180);cam.rotation_euler=(0,0,0);cam.data.type='ORTHO';cam.data.ortho_scale=146
 else:
  cam.location=(190,-190,150);cam.rotation_euler=(Vector((43,-26,2))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=175

class CAMPUS_OT_view(bpy.types.Operator):
 bl_idname='campus.view';bl_label='학교 보기'
 floor:bpy.props.IntProperty(default=0)
 top:bpy.props.BoolProperty(default=False)
 def execute(self,context):campus_view(self.floor,self.top);return {'FINISHED'}

class CAMPUS_PT_controls(bpy.types.Panel):
 bl_idname='CAMPUS_PT_controls';bl_label='석암초 전체 학교';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='학교'
 def draw(self,context):
  layout=self.layout
  layout.operator('campus.walk',text='선택한 층 걷기 시작',icon='PLAY')
  layout.label(text='WASD · 마우스 시점 · ESC 종료')
  layout.label(text='걷는 중 1~4: 층 바꾸기')
  layout.label(text='계단 내부는 보행 미지원')
  layout.separator()
  layout.operator('campus.view',text='학교 전체 입체 보기',icon='HOME').floor=0
  layout.label(text='각 층의 교실명 확인')
  for f in range(1,5):
   row=layout.row()
   op=row.operator('campus.view',text=f'{f}층 입체');op.floor=f
   op=row.operator('campus.view',text=f'{f}층 배치도');op.floor=f;op.top=True
  layout.label(text='휠 누르고 드래그: 회전')
  layout.label(text='치수는 유사 비율로 단순화')

# Remove obsolete prototype controls that target the old camera names.
walk_script=Path(__file__).resolve().with_name('campus_walk.py')
exec(compile(walk_script.read_text(encoding='utf-8'),str(walk_script),'exec'),globals())
for name in ['SEOKAM_PT_preview','SEOKAM_OT_walk','SEOKAM_OT_overview','CAMPUS_PT_controls','CAMPUS_OT_view','CAMPUS_OT_walk']:
 cls=getattr(bpy.types,name,None)
 if cls:bpy.utils.unregister_class(cls)
for cls in [CAMPUS_OT_view,CAMPUS_OT_walk,CAMPUS_PT_controls]:bpy.utils.register_class(cls)
campus_view()
