// Authored contact / push-off / heel recovery / passing / landing cycle.
// Reference-informed original animation, not extracted GTA animation data.
export const RUN_SPEED=4.8,STANCE=.34,STRIDE=.37;
const TAU=Math.PI*2;
const keys=[
  // phase, foot forward, foot lift, foot pitch
  [0,.32,0,-.13], [.17,-.05,0,.06], [.34,-.42,.015,.45],
  [.47,-.36,.22,.72], [.61,-.05,.27,.22], [.79,.28,.11,-.16], [1,.32,0,-.13]
];
function sample(t,column){
  let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;
  const a=keys[i],b=keys[i+1],u=(t-a[0])/(b[0]-a[0]),span=b[0]-a[0];
  const prev=i?keys[i-1]:[keys[keys.length-2][0]-1,...keys[keys.length-2].slice(1)];
  const next=i+2<keys.length?keys[i+2]:[1+keys[1][0],...keys[1].slice(1)];
  const m0=(b[column]-prev[column])/(b[0]-prev[0]),m1=(next[column]-a[column])/(next[0]-a[0]);
  return (2*u**3-3*u*u+1)*a[column]+(u**3-2*u*u+u)*span*m0+(-2*u**3+3*u*u)*b[column]+(u**3-u*u)*span*m1;
}
export function gaitFoot(phase,stride=STRIDE,blend=1){
  const p=((phase/TAU)%1+1)%1,scale=stride/STRIDE;
  // Exact stance travel speed prevents planted feet skating along the ground.
  const forward=p<STANCE?.32-.74*p/STANCE:sample(p,1);
  return {forward:forward*scale*blend,lift:Math.max(0,sample(p,2))*blend,roll:sample(p,3)*blend,planted:p<STANCE};
}
export function phaseAdvance(distance){return distance*TAU*STANCE/(2*STRIDE);}
