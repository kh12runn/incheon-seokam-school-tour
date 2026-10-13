// Photo-observed arrangement, with invented drawings instead of pupil records.
export function drawOct13Board(c,w,h,style){
 const types=['vertical-collage-oct13','folded-paper-oct13','flower-cards-oct13','pink-yellow-oct13'];
 if(!types.includes(style))return false;
 const kind=types.indexOf(style),cols=kind===0?13:kind===1?12:14,rows=kind===0?3:2;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const x=w*(.04+col*.91/cols),y=h*(.13+row*.76/rows),cw=w*.68/cols,ch=h*.60/rows;
  c.fillStyle=kind===3?['#d9a8bd','#e7d776','#bed899'][row%3]:'#f0eee2';c.fillRect(x,y,cw,ch);
  if(kind===0){c.fillStyle=['#677674','#b69d81','#76835d','#9c7891'][col%4];c.fillRect(x+cw*.17,y+ch*.1,cw*.65,ch*.8);c.fillStyle='#dbceba';for(let k=0;k<3;k++)c.fillRect(x+cw*.22,y+ch*(.17+k*.23),cw*.47,ch*.12);}
  else if(kind===1){c.fillStyle=['#c8b5be','#becab4','#c9d8df'][col%3];c.beginPath();c.moveTo(x,y+ch*.3);c.lineTo(x+cw*.5,y);c.lineTo(x+cw,y+ch*.3);c.lineTo(x+cw*.8,y+ch);c.lineTo(x+cw*.2,y+ch);c.closePath();c.fill();c.strokeStyle='#929b94';c.beginPath();c.moveTo(x+cw*.5,y);c.lineTo(x+cw*.5,y+ch);c.stroke();}
  else{c.strokeStyle='#869d94';for(let k=0;k<3;k++){c.beginPath();c.moveTo(x+cw*.15,y+ch*(.4+k*.17));c.lineTo(x+cw*.82,y+ch*(.4+k*.17));c.stroke();}c.fillStyle=['#a67d9a','#81a189','#d6b34e'][col%3];c.beginPath();c.arc(x+cw*.5,y+ch*.2,ch*.13,0,Math.PI*2);c.fill();}
 }
 if(kind===2)for(let i=0;i<25;i++){c.fillStyle=['#dcadbd','#d5bf60','#99bb8d'][i%3];c.beginPath();c.arc(w*(.02+i*.04),h*.055,h*.035,0,Math.PI*2);c.fill();}
 return true;
}
