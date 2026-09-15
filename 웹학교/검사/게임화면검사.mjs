import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const game=readFileSync(new URL('../게임.mjs',import.meta.url),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'중복 ID 없음');
for(const id of ['실사보기','교실사진','층보기','항공회전']){
  assert.ok(!ids.includes(id),id+' UI 제거');
  assert.ok(!game.includes("$('"+id+"')"),id+' 이벤트 참조 제거');
}
// Include runtime-generated speech bubble; all other literal selectors belong in HTML.
for(const [,id] of game.matchAll(/\$\('([^']+)'\)/g)){
  assert.ok(ids.includes(id),id+' DOM 요소 존재');
}
assert.ok(!game.includes('photoTour'),'실사 뷰어 런타임 연결 제거');
assert.equal([...html.matchAll(/value="(?:MAIN|ANNEX):[1-4]"/g)].length,8);
assert.ok(html.includes('aria-labelledby="메뉴제목"'));
assert.ok(game.includes("!$('게임메뉴').open"),'메뉴 중 이동 차단');
assert.ok(game.includes('orbit.yaw+=dt*.12'),'자동 항공뷰 유지');
assert.ok(game.includes("$('메뉴닫기').addEventListener('click',dismissMenu)"),'X 닫기와 탐험 재개 연결');
assert.ok(game.includes("addEventListener('cancel',e=>{e.preventDefault();dismissMenu();})"),'기본 Esc 닫기도 재개');
assert.ok(game.includes("if(mode==='walk')startWalk();"),'탐험 중 메뉴 닫기는 일반 마우스 시점 재개');
assert.ok(game.includes("e.preventDefault();if(!e.repeat)dismissMenu();return;"),'Esc 반복 입력과 기본 닫기 중복 방지');
assert.ok(game.includes("if(!locked&&!freeLook)startWalk();"),'메뉴를 직접 닫아도 자동 시점 복구');
assert.ok(!game.includes('dragMode=fallback'),'메뉴 재개에서 드래그 모드 금지');
assert.ok(!game.includes('else if(dragMode)'),'탐험 시점에 마우스 버튼을 요구하지 않음');
assert.ok(game.includes("addEventListener('mousemove',e=>"),'잠금 없는 마우스 시점도 문서 전체에서 처리');
assert.ok(game.includes('locked||dragMode||freeLook'),'잠금 거절 시 버튼 없는 마우스 시점 지원');
console.log({ok:true,removedControls:4,floorDestinations:8,allSelectorsPresent:true});
