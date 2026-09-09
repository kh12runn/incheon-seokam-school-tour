# 작업 흐름

최신 사용자 요청으로 범위가 학교 전체 재구축으로 확장되었다. 현재 생성 스크립트는 `blender/scripts/build_campus.py`, 보기 조작은 `campus_controls.py`다. 아래 단일층 단계 제한은 이전 프로토타입 기록이다. 최신 결과는 `STATE.md`와 `docs/PLAN_COMPARISON.md`를 기준으로 한다.

배치도 분석 → 공간 ID → 임시 치수 모델 → 눈높이 검토 → 실측·사진 보정 → PhotoPoint → 360/3D Hybrid → GLB/Web 순서로 진행한다.

현재는 학교 전체 1~4층 모델과 층별 걷기까지 구현했다. 다음은 교실 하나와 앞 복도의 시험 촬영 → 원본 확인 → 위치 추정·재구성 시험 → 모델 위치 맞춤이다. 가우시안 스플래팅 학습·360 투영·브라우저 실시간 3D는 미구현이다. 공개 웹 페이지는 모델 미리보기와 다운로드 안내다.

현재 생성 스크립트는 `blender/scripts/build_campus.py`이며, `build_prototype.py`는 제작 이력이다. 중요한 단계는 `blender/backups/`에 저장하고 메인 결과는 `blender/school_master.blend`에 저장한다. 현재 로컬 작업과 GitHub의 기준 폴더는 `school-tour`다. 새 원본은 `촬영사진_넣는곳`으로 받고 `data/capture-manifest.json`으로 모델 공간과 연결한다.
