// Small procedural artwork follows the photographed arrangement, not pupil data.
export function drawOctoberClassBoard(c,w,h,style){
 const styles=['tiny-collage-blocks','tree-and-timetable','flower-garlands','flower-activity-strips','fruit-gallery','flowers-and-ink','black-panels-heart'];
 if(!styles.includes(style))return false;
 const card=(x,y,width,height,kind,n)=>{
  c.fillStyle='#f2efdf';c.fillRect(x,y,width,height);const cx=x+width/2,cy=y+height/2;
  if(kind==='ink'){c.fillStyle='#303638';c.fillRect(x+3,y+3,width-6,height-6);c.strokeStyle='#dddccd';c.lineWidth=1.2;for(let j=0;j<6;j++){c.beginPath();c.moveTo(x+6+j*4,y+6);c.lineTo(x+width-6-j*3,y+height-6);c.stroke();}}
  else if(kind==='flower'){c.fillStyle=['#e1b349','#bc887d','#89a66a'][n%3];for(let j=0;j<6;j++){const a=j*Math.PI/3;c.beginPath();c.arc(cx+Math.cos(a)*width*.18,cy+Math.sin(a)*width*.18,width*.12,0,Math.PI*2);c.fill();}c.fillStyle='#826c41';c.beginPath();c.arc(cx,cy,width*.10,0,Math.PI*2);c.fill();}
  else if(kind==='fruit'){c.fillStyle=['#bd754f','#a8b469','#dcad52'][n%3];c.beginPath();c.arc(cx,cy,width*.25,0,Math.PI*2);c.fill();c.fillStyle='#719351';c.beginPath();c.ellipse(cx+4,cy-width*.28,7,3,-.4,0,Math.PI*2);c.fill();}
  else{c.strokeStyle='#9cafa3';c.lineWidth=1;for(let k=0;k<4;k++){c.beginPath();c.moveTo(x+5,y+8+k*(height-15)/4);c.lineTo(x+width-6-(k%2)*6,y+8+k*(height-15)/4);c.stroke();}}
 };
 const grid=(left,top,cols,rows,width,height,kind)=>{for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)card(left+col*width,top+row*height,width*.78,height*.80,kind,col+row);};
 const tree=()=>{c.fillStyle='#99805b';c.fillRect(w*.91,h*.38,w*.014,h*.45);for(let j=0;j<9;j++){c.fillStyle=['#6d9464','#8cac70','#adc288'][j%3];c.beginPath();c.arc(w*.92+Math.cos(j)*w*.04,h*.34+Math.sin(j)*h*.16,h*.12,0,Math.PI*2);c.fill();}};
 if(style==='tiny-collage-blocks'){grid(22,12,7,3,43,49,'paper');grid(355,35,13,3,48,48,'fruit');}
 if(style==='tree-and-timetable'){grid(20,22,6,3,49,51,'flower');c.fillStyle='#acc5d0';c.fillRect(350,12,185,h-37);grid(365,26,4,5,39,29,'paper');grid(570,15,6,3,48,51,'ink');tree();}
 if(style==='flower-garlands'){grid(60,52,13,2,67,57,'flower');for(let j=0;j<26;j++){const x=15+j*39,y=12+Math.sin(j*.48)*13;c.fillStyle=['#bb8da4','#83aaca','#b0bb5e','#d9a36f'][j%4];c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.fill();}grid(20,160,17,1,57,31,'paper');}
 if(style==='flower-activity-strips'){grid(24,12,5,3,48,50,'paper');grid(300,20,11,1,62,49,'flower');grid(280,85,12,2,57,45,'paper');c.fillStyle='#d6b951';for(let j=0;j<5;j++)c.fillRect(835+j*30,12,24,12);}
 if(style==='fruit-gallery'){grid(35,30,4,3,47,49,'flower');grid(260,15,10,3,62,52,'fruit');tree();}
 if(style==='flowers-and-ink'){grid(50,25,6,2,65,73,'flower');grid(500,16,10,3,47,50,'ink');}
 if(style==='black-panels-heart'){grid(20,25,6,3,43,51,'paper');grid(320,15,7,3,51,53,'ink');}
 return true;
}
