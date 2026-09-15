import assert from 'node:assert/strict';
import {joystickVector} from '../모바일조작.mjs';
assert.deepEqual(joystickVector(0,0,40),{right:0,forward:0,x:0,y:0});
assert.equal(joystickVector(3,2,40).forward,0,'손떨림 데드존');
for(const [dx,dy] of [[0,-40],[0,40],[40,0],[-40,0],[100,-100]]){
  const v=joystickVector(dx,dy,40);assert(Math.abs(Math.hypot(v.right,v.forward)-1)<1e-9,'항상 달리기, 대각선 가속 없음');
  assert(Math.hypot(v.x,v.y)<=40+1e-9,'패드 범위 제한');
  assert.equal(Math.sign(v.right),Math.sign(dx));assert.equal(Math.sign(v.forward),Math.sign(-dy));
}
console.log({ok:true,deadZone:true,direction:true,diagonalSpeedNormalized:true,knobClamped:true});
