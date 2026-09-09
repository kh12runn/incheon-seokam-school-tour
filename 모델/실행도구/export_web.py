"""Extract the saved Blender campus (not a separately invented building).
All current mesh primitives are verified axis-aligned boxes; font labels retain
their world transform. The browser builds playable stairs in the same footprints.
The .blend is read-only in this exporter.
"""
import bpy, json, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
scene=bpy.data.scenes['Harness_Seokam_Campus']
bpy.context.window.scene=scene
bpy.context.view_layer.update()
boxes=[];labels=[]
for ob in scene.objects:
    if ob.get('owner')!='campus_v2': continue
    if any('Basement' in c.name for c in ob.users_collection): continue
    sid=ob.get('spaceId','')
    floor=int(ob.get('floor',0))
    collections=[c.name for c in ob.users_collection]
    if ob.type=='MESH':
        pts=[ob.matrix_world@Vector(v) for v in ob.bound_box]
        bounds=[min(p[i] for p in pts) for i in range(3)]+[max(p[i] for p in pts) for i in range(3)]
        assert len(ob.data.vertices)==8, ('Non-box mesh requires mesh export',ob.name)
        for vertex in ob.data.vertices:
            p=ob.matrix_world@vertex.co
            assert all(min(abs(p[i]-bounds[i]),abs(p[i]-bounds[i+3]))<.001 for i in range(3)),ob.name
        color=list(ob.active_material.diffuse_color[:3]) if ob.active_material else list(ob.color[:3])
        kind='box'
        if any(c.endswith('_Walls') or c.endswith('_Windows') or c.endswith('_Doors') for c in collections):kind='wall'
        if any(c.endswith('_Floors') or c.endswith('_Corridors') for c in collections):kind='floor'
        if any(c.endswith('_Stairs') for c in collections):kind='old_stair'
        if any('Roof' in c for c in collections):kind='roof'
        boxes.append({'name':ob.name,'spaceId':sid,'floor':floor,'kind':kind,
                      'bounds':[round(v,5) for v in bounds],'color':[round(v,4) for v in color],
                      'collision':bool(ob.get('collision',False))})
    elif ob.type=='FONT':
        pts=[Vector(v) for v in ob.bound_box]
        center=sum(pts,Vector())/8
        pos=ob.matrix_world@center
        q=ob.matrix_world.to_quaternion()
        labels.append({'name':ob.name,'spaceId':sid,'floor':floor,'text':ob.data.body,
                       'position':[round(v,5) for v in pos], 'quaternion':[q.x,q.y,q.z,q.w],
                       'width':max(p.x for p in pts)-min(p.x for p in pts),
                       'height':max(p.y for p in pts)-min(p.y for p in pts)})
spaces=json.loads((ROOT/'공간자료/spaces.json').read_text(encoding='utf-8'))['spaces']
captures=json.loads((ROOT/'공간자료/capture-manifest.json').read_text(encoding='utf-8'))['folders']
alias={r['spaceId']:r['label'] for r in captures if r['kind']=='stair'}
rooms=[]
for s in spaces:
    if not s.get('bounds'):continue
    rooms.append({k:s[k] for k in ['id','name','floor','building','type','bounds']})
    if s['id'] in alias:rooms[-1]['captureName']=alias[s['id']]
result={'schemaVersion':1,'source':'모델/school_master.blend','sourceHash':hashlib.sha256((ROOT/'모델/school_master.blend').read_bytes()).hexdigest(),
        'coordinateSystem':'Blender Z-up; meters; estimated dimensions','floorHeight':3.4,
        'boxes':boxes,'labels':labels,'rooms':rooms}
out=ROOT/'웹학교/학교구조.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('WEB_EXPORT_OK',len(boxes),'boxes',len(labels),'labels',len(rooms),'spaces')
