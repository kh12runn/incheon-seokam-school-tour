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
console.log({ok:true,removedControls:4,floorDestinations:8,allSelectorsPresent:true});
