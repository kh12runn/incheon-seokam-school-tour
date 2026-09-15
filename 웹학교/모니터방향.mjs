// Teaching walls normally face low X; the rotated 4-3 layout marks high X.
// Move only each desktop display face to the chalkboard side of its casing.
// Keep furniture positions, collision, frozen layouts and wall-mounted TVs intact.
export function faceMonitorsTowardBoard(boxes){
  const byName=new Map(boxes.map(b=>[b.name,b]));
  return boxes.map(screen=>{
    if(!screen.name.endsWith('모니터 화면'))return screen;
    const casingName=screen.name.includes('추가 모니터 화면')
      ?screen.name.replace('추가 모니터 화면','두 번째 검정 모니터')
      :screen.name.replace('모니터 화면','컴퓨터 모니터');
    const casing=byName.get(casingName);if(!casing)return screen;
    // Idempotent: a screen already on the board side needs no change.
    const positive=screen.boardDirection===1;
    if(positive?screen.bounds[0]>=casing.bounds[3]:screen.bounds[3]<=casing.bounds[0])return screen;
    const centerSum=casing.bounds[0]+casing.bounds[3],bounds=[...screen.bounds];
    bounds[0]=centerSum-screen.bounds[3];bounds[3]=centerSum-screen.bounds[0];
    return {...screen,bounds};
  });
}
