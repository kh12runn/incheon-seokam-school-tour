"""Run in background Blender with school_master.blend already loaded.
Updates embedded scripts and capture metadata; validates and saves this copy only.
"""
import bpy, json, runpy
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
model = ROOT / '모델/school_master.blend'
assert Path(bpy.data.filepath).resolve() == model.resolve(), 'Open this project model first'
for script in (ROOT / '모델/실행도구').glob('*.py'):
    compile(script.read_text(encoding='utf-8'), str(script), 'exec')
for text in bpy.data.texts:
    source = ROOT / '모델/실행도구' / text.name
    if source.is_file():
        text.clear()
        text.write(source.read_text(encoding='utf-8'))
        text.filepath = '//실행도구/' + source.name
spaces = json.loads((ROOT/'공간자료/spaces.json').read_text(encoding='utf-8'))['spaces']
scene = bpy.data.scenes['Harness_Seokam_Campus']
bpy.context.window.scene = scene
scene['walking'] = False
scene['project_folder'] = '석암초등학교'
for s in spaces:
    for name in [s.get('blenderObject'), 'PHOTOPOINT_' + s['id']]:
        ob = scene.objects.get(name) if name else None
        if ob:
            ob['intake_folder'] = s['intakeFolder']
            if s['type'] == 'stair':
                ob['capture_alias'] = Path(s['intakeFolder'].rstrip('/')).name
env = runpy.run_path(str(ROOT/'모델/실행도구/campus_controls.py'))
assert env['WALK_ROOT'] == ROOT
tests = env['verify_campus_walk'](scene)
assert len(tests) == 4 and sum(t['path_samples'] for t in tests) == 3020
runpy.run_path(str(ROOT/'모델/실행도구/campus_report.py'))
report = {'scene':scene.name,'objects':len(scene.objects),'walkTests':tests,
          'captureMappings':len(spaces),'projectRelativeScripts':True,
          'note':'Background geometry/registration tests, not new GUI keyboard input tests.'}
(ROOT/'공간자료/release-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(model))
print('RELEASE_CHECK_OK',json.dumps(report,ensure_ascii=False))
