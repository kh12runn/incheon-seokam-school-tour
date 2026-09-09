@echo off
setlocal
if defined BLENDER_EXE if exist "%BLENDER_EXE%" goto launch
set "BLENDER_EXE=C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
if exist "%BLENDER_EXE%" goto launch
for /f "delims=" %%B in ('where blender.exe 2^>nul') do set "BLENDER_EXE=%%B"
if exist "%BLENDER_EXE%" goto launch
echo Blender was not found. Install Blender 5.2 or set BLENDER_EXE.
pause
exit /b 1
:launch
start "" "%BLENDER_EXE%" "%~dp0blender\school_master.blend" --python "%~dp0blender\scripts\campus_controls.py"
