# 학교 3D 웹 배포

- 공개 주소: https://school-tour-production.up.railway.app/
- 저장소: https://github.com/kh12runn/incheon-seokam-school-tour
- Railway 프로젝트: incheon-seokam-school-tour
- 서비스: school-tour / production
- main 브랜치 푸시 시 Dockerfile을 사용해 자동 배포합니다.
- 서버 상태 확인: `/healthz`

프로덕션에서는 Railway가 제공하는 `PORT`로 외부 연결을 받습니다. 로컬에서는 `학교_웹_열기.cmd`로 기존 127.0.0.1 서버를 실행합니다.

배포에는 코드, 3D 구조, Blender 모델, 미리보기, 웹용 편집 사진 9장을 포함합니다. 원본 INSP·영상·배치도·변환 중간파일·비밀키는 제외합니다. Docker 빌드 파일과 웹 서버는 허용된 파일만 사용/제공합니다. GitHub Pages는 수동 실행용으로만 남겨둡니다.

확인한 기능: 초기 전체보기 자동 회전, 층 이동 메뉴, 360도 사진 표시. HTTP 검사에서 편집 사진 9장 성공, `/healthz` 정상, 비공개 경로 차단. 로컬 검사에서 41개 교실 출입·네 계단 왕복·창 충돌·골대/주차장 배치 통과.

기존 건물은 사진을 참고한 근사 모델이며, 360도 사진 보기는 촬영 지점 사이를 이동하는 방식입니다. 자유 시점 3DGS는 아닙니다. 조작은 PC 키보드·마우스 기준입니다.
