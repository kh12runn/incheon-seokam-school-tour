async page=>{
 await page.goto('http://127.0.0.1:8080/healthz');
 await page.evaluate(async()=>{const {createRaceAudio}=await import('/웹학교/레이싱오디오.mjs');window.soundCheck=createRaceAudio();const b=document.createElement('button');b.id='audio-test-start';b.textContent='Start';b.onclick=()=>soundCheck.start();document.body.append(b);});
 await page.locator('#audio-test-start').click();
 return await page.evaluate(async()=>{
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),a=soundCheck;
  try{
   await wait(100);let state={phase:'countdown',countdown:3,lap:1,laps:3,hits:0},car={speed:0,steering:0,boosting:false},controls={throttle:0};
   for(const count of [3,2,1]){state.countdown=count;a.update(state,car,controls);await wait(120);}
   state.phase='racing';a.update(state,car,controls);await wait(150);
   car.speed=16;controls.throttle=1;car.boosting=true;state.lap=2;state.hits=1;a.update(state,car,controls);await wait(220);
   const racing=a.getState();if(racing.rms<=.001)throw Error('No actual audio samples');
   state.phase='finished';state.won=true;a.update(state,car,controls);await wait(200);const finish=a.getState();
   for(const key of ['start','lap','collision','boost','finish'])if(finish.events[key]!==1)throw Error('Missing or repeated cue: '+key);
   if(finish.events.countdown!==3||finish.rms<=.001||finish.peakVoices>40)throw Error('Countdown, finish signal or bounded scheduling failed');
   for(let i=0;i<5;i++){a.stop();a.start();await wait(30);a.update({phase:'racing',lap:1,laps:3,hits:0},car,controls);await wait(30);}
   a.stop();if(a.getState().voices!==0)throw Error('Audio voices leak between rounds');
   return {ok:true,events:finish.events,peakVoices:finish.peakVoices,racingRms:racing.rms,finishRms:finish.rms,roundCleanup:true};
  }finally{a.dispose();}
 });
}
