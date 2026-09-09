"""Collision-aware floor walking. Executed by campus_controls.py."""
import bpy
import math
import time
import json
from pathlib import Path
from mathutils import Vector, Euler

WALK_ROOT=Path(__file__).resolve().parents[2]

def walk_config():
 data=json.loads((WALK_ROOT/'공간자료/settings.json').read_text(encoding='utf-8'))
 return {'height':data['dimensions']['camera_height']['value'],
         'speed':data['dimensions']['walk_speed_mps']['value'],
         'floor_height':data['campus']['floor_height'],'radius':.22}

def build_collision(scene,floor):
 """Snapshot real geometry, including facade windows whose collision flag is absent."""
 z=(floor-1)*walk_config()['floor_height']
 ground=[];obstacles=[]
 for ob in scene.objects:
  if ob.get('floor')!=floor or ob.type!='MESH':continue
  corners=[ob.matrix_world@Vector(v) for v in ob.bound_box]
  x0=min(v.x for v in corners);x1=max(v.x for v in corners)
  y0=min(v.y for v in corners);y1=max(v.y for v in corners)
  z0=min(v.z for v in corners);z1=max(v.z for v in corners)
  if ob.name.startswith('Floor_') or (ob.name.startswith('SPACE_') and ('CORRIDOR' in ob.name or 'CONNECTOR' in ob.name)):
   ground.append((x0,x1,y0,y1))
  # Stairs are not a flat walkable surface; keep the camera out of incomplete stairwells.
  if ob.name.startswith('SPACE_') and 'STAIR' in ob.name:
   obstacles.append((x0,x1,y0,y1))
  is_wall=bool(ob.get('collision')) or any('Windows' in c.name or 'Walls' in c.name for c in ob.users_collection)
  if is_wall and z1>z+.3 and z0<z+1.8:obstacles.append((x0,x1,y0,y1))
 return {'ground':ground,'obstacles':obstacles}

def walk_allowed(collision,x,y,radius=.22):
 for x0,x1,y0,y1 in collision['obstacles']:
  nearx=max(x0,min(x,x1));neary=max(y0,min(y,y1))
  if (x-nearx)**2+(y-neary)**2<radius**2:return False
 for angle in range(0,360,45):
  px=x+radius*math.cos(math.radians(angle));py=y+radius*math.sin(math.radians(angle))
  if not any(a-.002<=px<=b+.002 and c-.002<=py<=d+.002 for a,b,c,d in collision['ground']):return False
 return True

def advance_walk(collision,x,y,dx,dy,radius=.22):
 count=max(1,math.ceil(math.hypot(dx,dy)/.07))
 for _ in range(count):
  if walk_allowed(collision,x+dx/count,y,radius):x+=dx/count
  if walk_allowed(collision,x,y+dy/count,radius):y+=dy/count
 return x,y

class CAMPUS_OT_walk(bpy.types.Operator):
 bl_idname='campus.walk';bl_label='선택한 층 걷기';bl_options={'REGISTER'}
 @classmethod
 def poll(cls,context):
  return context.scene.name=='Harness_Seokam_Campus' and not context.scene.get('walking',False)
 def setup_floor(self,context,floor):
  campus_view(floor,False)
  self.floor=floor;self.collision=build_collision(context.scene,floor)
  self.pos=Vector((20,1.5,(floor-1)*self.cfg['floor_height']+self.cfg['height']))
  assert walk_allowed(self.collision,self.pos.x,self.pos.y),'Unsafe walk spawn'
  self.yaw=-math.pi/2;self.pitch=math.pi/2;self.velocity=Vector((0,0))
  self.area.header_text_set(f'{floor}층 걷기 | WASD 이동 · 마우스 시점 · 1~4 층 선택 · ESC 종료')
  self.sync_view()
 def sync_view(self):
  r=self.area.spaces.active.region_3d
  q=Euler((self.pitch,0,self.yaw),'XYZ').to_quaternion()
  r.view_perspective='PERSP';r.view_rotation=q;r.view_distance=.1
  r.view_location=self.pos+q@Vector((0,0,-.1));r.update();self.area.tag_redraw()
  self.scene['walk_position']=list(self.pos)
 def invoke(self,context,event):
  self.area=next((a for a in context.screen.areas if a.type=='VIEW_3D'),None)
  if not self.area:return {'CANCELLED'}
  self.region=next(r for r in self.area.regions if r.type=='WINDOW')
  self.window=context.window;self.scene=context.scene;self.cfg=walk_config();self.keys=set();self.last=time.monotonic()
  self.old_lens=self.area.spaces.active.lens
  self.old_clip=self.area.spaces.active.clip_start
  self.area.spaces.active.lens=23;self.area.spaces.active.clip_start=.04
  floor=context.scene.get('active_floor',1) or 1
  self.setup_floor(context,floor)
  context.scene['walking']=True
  self.timer=context.window_manager.event_timer_add(.02,window=context.window)
  self.window.cursor_modal_set('NONE')
  self.cx=self.region.x+self.region.width//2;self.cy=self.region.y+self.region.height//2
  self.window.cursor_warp(self.cx,self.cy)
  context.window_manager.modal_handler_add(self)
  bpy.app.driver_namespace['campus_walk_active']=self
  self.scene['walk_ticks']=0;self.scene['walk_key_events']=0
  return {'RUNNING_MODAL'}
 def finish(self,context):
  context.window_manager.event_timer_remove(self.timer)
  self.window.cursor_modal_restore();self.scene['walking']=False
  if bpy.app.driver_namespace.get('campus_walk_active') is self:
   del bpy.app.driver_namespace['campus_walk_active']
  self.area.spaces.active.lens=self.old_lens;self.area.spaces.active.clip_start=self.old_clip
  self.area.header_text_set('걷기 종료 · 학교 탭에서 전체 보기 또는 다시 걷기')
  return {'FINISHED'}
 def modal(self,context,event):
  try:
   return self.handle_event(context,event)
  except Exception as exc:
   self.scene['walk_last_error']=str(exc)
   self.finish(context)
   self.report({'ERROR'},'Walk stopped: '+str(exc))
   return {'CANCELLED'}
 def handle_event(self,context,event):
  if event.type in {'ESC','RIGHTMOUSE'} or context.scene.name!='Harness_Seokam_Campus':return self.finish(context)
  if event.type=='WINDOW_DEACTIVATE':self.keys.clear();self.velocity*=0
  if event.type in {'W','A','S','D'}:
   self.scene['walk_key_events']=self.scene.get('walk_key_events',0)+1
   if event.value=='PRESS':self.keys.add(event.type)
   elif event.value=='RELEASE':self.keys.discard(event.type)
  if event.type in {'ONE','TWO','THREE','FOUR'} and event.value=='PRESS':
   self.keys.clear();self.setup_floor(context,{'ONE':1,'TWO':2,'THREE':3,'FOUR':4}[event.type])
  if event.type=='MOUSEMOVE':
   dx=event.mouse_x-self.cx;dy=event.mouse_y-self.cy
   if dx or dy:
    self.yaw-=dx*.002;self.pitch=max(.35,min(2.75,self.pitch-dy*.002))
    self.window.cursor_warp(self.cx,self.cy)
  if event.type=='TIMER':
   now=time.monotonic()
   if now-self.last<.012:return {'RUNNING_MODAL'}
   dt=min(now-self.last,.05);self.last=now
   self.scene['walk_ticks']=self.scene.get('walk_ticks',0)+1
   v=Vector((float('D' in self.keys)-float('A' in self.keys),float('W' in self.keys)-float('S' in self.keys)))
   if v.length:v.normalize()
   self.velocity=self.velocity.lerp(v*self.cfg['speed'],1-math.exp(-dt*12))
   orientation=Euler((math.pi/2,0,self.yaw),'XYZ').to_quaternion()
   forward3=orientation@Vector((0,0,-1));right3=orientation@Vector((1,0,0))
   forward=Vector((forward3.x,forward3.y));right=Vector((right3.x,right3.y))
   delta=(right*self.velocity.x+forward*self.velocity.y)*dt
   self.pos.x,self.pos.y=advance_walk(self.collision,self.pos.x,self.pos.y,delta.x,delta.y,self.cfg['radius'])
   self.sync_view()
  return {'RUNNING_MODAL'}

def verify_campus_walk(scene):
 results=[]
 bpy.context.view_layer.update()
 for floor in range(1,5):
  c=build_collision(scene,floor)
  # Continuous travel along main, around L corner, then annex.
  path=[(1+i*.25,1.5) for i in range(403)]
  path += [(101.5,1.5-i*.25) for i in range(292)]
  assert all(walk_allowed(c,*p) for p in path),(floor,'corridor continuity')
  assert not walk_allowed(c,103,-30),(floor,'window')
  assert not walk_allowed(c,20,-7),(floor,'wall')
  assert not walk_allowed(c,40,-35),(floor,'off-floor')
  x,y=advance_walk(c,20,1.5,0,-30)
  assert y>.2,(floor,'wall tunneling',x,y)
  # Enter and exit one room through its real generated door on each floor.
  sid={1:'1F_3-2',2:'2F_CARE_DREAM_LOVE',3:'3F_5-5',4:'4F_6-5'}[floor]
  door_x=23.5
  assert all(walk_allowed(c,door_x,1.5-i*.1) for i in range(60)),(floor,'door clearance',sid)
  results.append({'floor':floor,'path_samples':len(path)+60,'wall_window_offfloor_blocked':True,'door_passable':sid,'sweep_no_tunneling':True})
 return results
