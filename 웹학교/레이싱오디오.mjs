// Original, procedural race soundtrack. No downloads, recordings or music files.
// Audio is unlocked only by the race/start/resume buttons (a user gesture).
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const note=midi=>440*2**((midi-69)/12);
export function createRaceAudio({contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()}={}){
 let ctx=null,master,compressor,analyser,engine,body,engineGain,bodyGain,filter,gravel,gravelGain,noise;
 let enabled=true,available=true,active=false,lastPhase='',lastCount=-1,lastLap=1,lastHits=0,lastBoost=false,lastGear=0;
 let nextBeat=0,beat=0,nextUpdate=0,lastEffect=-10,frequency=0,peakVoices=0;
 const voices=new Set(),events={countdown:0,start:0,lap:0,collision:0,boost:0,finish:0};
 function build(){
  if(ctx)return;
  ctx=contextFactory();master=ctx.createGain();master.gain.value=0;
  compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-14;compressor.knee.value=12;compressor.ratio.value=5;compressor.attack.value=.004;compressor.release.value=.15;
  analyser=ctx.createAnalyser();analyser.fftSize=256;
  master.connect(compressor);compressor.connect(analyser);analyser.connect(ctx.destination);
  noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const samples=noise.getChannelData(0);let seed=1741;
  for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=seed/2147483648-1;}
  engine=ctx.createOscillator();const real=new Float32Array(10),imag=new Float32Array(10);
  for(let i=1;i<10;i++)imag[i]=(i%2?.8:.35)/i;
  engine.setPeriodicWave(ctx.createPeriodicWave(real,imag));engine.frequency.value=45;
  filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=600;filter.Q.value=.7;
  engineGain=ctx.createGain();engineGain.gain.value=0;engine.connect(filter);filter.connect(engineGain);engineGain.connect(master);engine.start();
  body=ctx.createOscillator();body.type='sine';body.frequency.value=23;bodyGain=ctx.createGain();bodyGain.gain.value=0;body.connect(bodyGain);bodyGain.connect(master);body.start();
  gravel=ctx.createBufferSource();gravel.buffer=noise;gravel.loop=true;const roadFilter=ctx.createBiquadFilter();roadFilter.type='bandpass';roadFilter.frequency.value=900;roadFilter.Q.value=.55;
  gravelGain=ctx.createGain();gravelGain.gain.value=0;gravel.connect(roadFilter);roadFilter.connect(gravelGain);gravelGain.connect(master);gravel.start();
 }
 function unlock(){
  if(!enabled)return;
  try{build();if(ctx.state!=='running')void ctx.resume().catch(()=>{available=false;});available=true;}catch{available=false;}
 }
 function ramp(param,value,time=.04){param.setTargetAtTime(value,ctx.currentTime,time);}
 function clearVoices(){for(const voice of [...voices]){try{voice.source.stop();}catch{}voice.cleanup();}}
 function voice({at=ctx.currentTime,duration=.15,freq=440,endFreq,type='sine',volume=.06,noisy=false,cutoff=1200}){
  if(!enabled||!active||ctx.state!=='running'||voices.size>=40)return;
  const source=noisy?ctx.createBufferSource():ctx.createOscillator(),gain=ctx.createGain(),nodes=[source,gain];
  if(noisy){source.buffer=noise;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=cutoff;source.connect(f);f.connect(gain);nodes.push(f);}else{source.type=type;source.frequency.setValueAtTime(freq,at);if(endFreq)source.frequency.exponentialRampToValueAtTime(endFreq,at+duration);source.connect(gain);}
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);gain.connect(master);
  const entry={source,cleanup(){for(const node of nodes)node.disconnect();voices.delete(entry);}};voices.add(entry);peakVoices=Math.max(peakVoices,voices.size);source.onended=entry.cleanup;
  source.start(at);source.stop(at+duration+.02);
 }
 function cue(name,won=true){
  events[name]++;const t=ctx.currentTime;
  if(name==='countdown'||name==='start')voice({freq:name==='start'?1046:660,duration:name==='start'?.35:.10,volume:.12});
  if(name==='collision'){voice({noisy:true,cutoff:450,duration:.17,volume:.2});voice({freq:95,endFreq:28,duration:.19,volume:.16});}
  if(name==='boost')voice({noisy:true,cutoff:2200,duration:.45,volume:.08});
  if(name==='lap'||name==='finish'){
   const notes=name==='lap'?[72,76,79]:(won?[60,64,67,72,76]:[67,65,60]);
   notes.forEach((m,i)=>voice({at:t+i*.11,freq:note(m),type:'triangle',duration:.32,volume:.11}));
  }
 }
 function music(now,finalLap){
  const step=60/(finalLap?148:140)/4;
  if(nextBeat<now-.2)nextBeat=now; // No catch-up burst after a slow/background frame.
  while(nextBeat<now+.14){
   const n=beat%16,root=[45,41,48,43][Math.floor(beat/64)%4],at=nextBeat;
   if(n%4===0){voice({at,freq:100,endFreq:35,duration:.14,volume:.19});voice({at,freq:note(root),type:'triangle',duration:.19,volume:.13});}
   if(n===4||n===12)voice({at,noisy:true,cutoff:2800,duration:.09,volume:.075});
   if(n%2===0)voice({at,noisy:true,cutoff:6500,duration:.025,volume:.035});
   const pattern=[0,7,12,15,7,12,19,12];
   if(n%2===0)voice({at,freq:note(root+12+pattern[n/2]),type:'triangle',duration:.10,volume:.045});
   beat++;nextBeat+=step;
  }
 }
 function stop({suspend=true}={}){
  active=false;lastPhase='';lastCount=-1;nextBeat=0;nextUpdate=0;
  if(!ctx)return;clearVoices();master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(0,ctx.currentTime);
  engineGain.gain.setValueAtTime(0,ctx.currentTime);bodyGain.gain.setValueAtTime(0,ctx.currentTime);gravelGain.gain.setValueAtTime(0,ctx.currentTime);
  if(suspend&&ctx.state==='running')void ctx.suspend().catch(()=>{});
 }
 function start(){stop({suspend:false});lastLap=1;lastHits=0;lastBoost=false;lastGear=0;beat=0;unlock();}
 function update(state,car,controls){
  if(!ctx||!enabled||!available)return;
  if(state.paused){if(active)stop();return;}
  if(ctx.state!=='running')return;
  if(!active){active=true;ramp(master.gain,.38);nextBeat=ctx.currentTime;}
  const now=ctx.currentTime,phase=state.phase;
  if(phase==='countdown'){const count=Math.ceil(state.countdown);if(count>0&&count!==lastCount){cue('countdown');lastCount=count;}}
  if(phase==='racing'){
   if(lastPhase==='countdown')cue('start');
   if(state.lap>lastLap)cue('lap');
   if(state.hits>lastHits&&now-lastEffect>.20){cue('collision');lastEffect=now;}
   if(car.boosting&&!lastBoost)cue('boost');
   music(now,state.lap===state.laps);
  }
  if(phase==='finished'&&lastPhase!=='finished'){clearVoices();cue('finish',state.won);}
  lastPhase=phase;lastLap=state.lap;lastHits=state.hits;lastBoost=!!car.boosting;
  if(now<nextUpdate)return;nextUpdate=now+1/30;
  const running=phase==='racing'||phase==='countdown',speed=Math.abs(car.speed),throttle=Math.max(0,controls.throttle??0),gear=Math.min(5,Math.floor(speed/6));
  frequency=43+(speed%6)*9+gear*4+throttle*13;
  // A short pitch drop at each virtual upshift, without changing vehicle physics.
  if(gear>lastGear)frequency*=.82;lastGear=gear;
  ramp(engine.frequency,frequency,.065);ramp(body.frequency,frequency*.5,.065);ramp(filter.frequency,450+speed*40+throttle*500,.08);
  ramp(engineGain.gain,running?.12+throttle*.07:0);ramp(bodyGain.gain,running?.08:0);
  const skid=Math.abs(car.steering??0)*speed*.006+(controls.brake&&speed>2?.05:0);
  ramp(gravelGain.gain,phase==='racing'?Math.min(.15,speed*.0015+skid):0,.06);
 }
 return {unlock,start,stop,update,setEnabled(value){enabled=!!value;if(enabled)unlock();else stop();return enabled;},
  getState(){let rms=0;if(analyser){const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);rms=Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length);}return {enabled,available,active,context:ctx?.state??'not-created',voices:voices.size,peakVoices,frequency,rms,events:{...events}};},
  dispose(){stop();if(ctx){engine.stop();body.stop();gravel.stop();void ctx.close().catch(()=>{});ctx=null;}}
 };
}
