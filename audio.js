/* Original procedural arcade score. No audio downloads or third-party music. */
(()=>{
'use strict';
let ctx,master,musicBus,fxBus,noise,clock,next=0,step=0,phase='prep',boss=false;
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const prefs=store.get('sb_audio_v2',{music:true,fx:true,volume:.35});
prefs.volume=Math.max(0,Math.min(1,Number(prefs.volume)||0));
function tone(freq,time,duration,shape,gain,bus,end){
 if(!ctx||ctx.state!=='running')return;
 const o=ctx.createOscillator(),g=ctx.createGain();o.type=shape;o.frequency.setValueAtTime(freq,time);
 if(end)o.frequency.exponentialRampToValueAtTime(Math.max(15,end),time+duration);
 g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+duration);
 o.connect(g);g.connect(bus);o.start(time);o.stop(time+duration+.02);
}
function hiss(time,duration,gain,cut){
 if(!ctx||ctx.state!=='running')return;
 const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise;f.type='highpass';f.frequency.value=cut||4000;
 g.gain.setValueAtTime(gain,time);g.gain.exponentialRampToValueAtTime(.0001,time+duration);s.connect(f);f.connect(g);g.connect(musicBus);s.start(time);s.stop(time+duration);
}
const roots=[38,34,41,36],arp=[0,7,12,15,19,15,12,7],hz=n=>440*Math.pow(2,(n-69)/12);
function schedule(){
 if(!ctx||ctx.state!=='running')return;
 if(!prefs.music||document.hidden){next=ctx.currentTime+.06;return}
 if(next<ctx.currentTime)next=ctx.currentTime+.05;
 const active=phase==='wave',bpm=boss?136:active?120:88,beat=60/bpm/2;
 while(next<ctx.currentTime+.18){
  const n=step%32,root=roots[Math.floor(step/32)%roots.length];
  if(n%4===0){for(const v of [0,7,15])tone(hz(root+12+v),next,beat*3.8,'sine',.04,musicBus)}
  tone(hz(root+12+arp[n%8]),next,beat*.7,'triangle',active?.065:.035,musicBus);
  if(active){
   if(n%4===0)tone(125,next,.17,'sine',.45,musicBus,36);
   if(n%4===2){hiss(next,.09,.075,1200);tone(180,next,.06,'triangle',.06,musicBus,90)}
   hiss(next,.025,n%2?.025:.045,6500);
   if(n%2===0)tone(hz(root),next,beat*.85,'sawtooth',.045,musicBus);
  }
  next+=beat;step++;
 }
}
async function unlock(){
 try{
  if(!ctx){
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;ctx=new AC();
   const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=8;limiter.connect(ctx.destination);
   master=ctx.createGain();master.connect(limiter);musicBus=ctx.createGain();musicBus.gain.value=.55;musicBus.connect(master);fxBus=ctx.createGain();fxBus.connect(master);
   noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
   master.gain.value=prefs.volume;next=ctx.currentTime+.05;clock=setInterval(schedule,45);
  }
  await ctx.resume();update();return ctx.state==='running';
 }catch{return false}
}
const gates={};
function fx(name,k=0){
 if(!ctx||ctx.state!=='running'||!prefs.fx||document.hidden)return;
 const now=ctx.currentTime;if(now-(gates[name]??-10)<(name==='shot'?.1:.16))return;gates[name]=now;
 if(name==='shot'){const frequencies=[780,160,1200,620,1900];tone(frequencies[k]||780,now,k===1?.12:.065,'triangle',k===1?.17:.06,fxBus,k===1?38:180)}
 else if(name==='nova'){tone(80,now,.8,'sawtooth',.18,fxBus,1400);tone(500,now+.65,1,'sine',.18,fxBus,25)}
 else if(name==='boss'){[0,.2,.4].forEach(t=>tone(146,now+t,.15,'sawtooth',.1,fxBus,110))}
 else if(name==='over'){[440,330,220,110].forEach((f,i)=>tone(f,now+i*.18,.3,'triangle',.15,fxBus))}
 else if(name==='clear'||name==='upgrade'){[440,554,659,880].forEach((f,i)=>tone(f,now+i*.065,.18,'triangle',.12,fxBus))}
 else if(name==='hit')tone(100,now,.15,'triangle',.12,fxBus,30);
 else tone(660,now,.05,'sine',.1,fxBus,900);
}
function update(){
 if(master)master.gain.setTargetAtTime(prefs.volume,ctx.currentTime,.04);
 if(fxBus)fxBus.gain.setTargetAtTime(prefs.fx?1:0,ctx.currentTime,.04);
 if(musicBus)musicBus.gain.setTargetAtTime(prefs.music?.55:0,ctx.currentTime,.06);
 document.querySelectorAll('[data-audio-music]').forEach(b=>{b.textContent=prefs.music?'Music ON':'Music OFF';b.setAttribute('aria-pressed',String(prefs.music))});
 document.querySelectorAll('[data-audio-fx]').forEach(b=>{b.textContent=prefs.fx?'SFX ON':'SFX OFF';b.setAttribute('aria-pressed',String(prefs.fx))});
 document.querySelectorAll('[data-audio-enable]').forEach(b=>{b.hidden=ctx?.state==='running'});
}
function mount(){
 const panel=document.createElement('details');panel.className='audio-panel';panel.innerHTML='<summary aria-label="Sound controls">♫ SOUND</summary><div class="audio-options"><button data-audio-enable>Enable sound</button><button data-audio-music aria-pressed="true">Music ON</button><button data-audio-fx aria-pressed="true">SFX ON</button><label>Volume <input data-audio-volume type="range" min="0" max="100" aria-label="Sound volume"></label><small>Original arcade soundtrack</small></div>';document.body.append(panel);
 panel.querySelector('[data-audio-volume]').value=prefs.volume*100;
 panel.addEventListener('click',async e=>{if(e.target.closest('button'))await unlock();if(e.target.matches('[data-audio-music]'))prefs.music=!prefs.music;if(e.target.matches('[data-audio-fx]'))prefs.fx=!prefs.fx;store.set('sb_audio_v2',prefs);update()});
 panel.querySelector('input').addEventListener('input',e=>{prefs.volume=Number(e.target.value)/100;store.set('sb_audio_v2',prefs);update()});update();
}
document.addEventListener('visibilitychange',()=>{if(ctx)master.gain.setTargetAtTime(document.hidden?0:prefs.volume,ctx.currentTime,.06)});
window.SBAudio={unlock,fx,setScene(s,b=false){phase=s;boss=b},get status(){return{context:ctx?.state||'locked',...prefs}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
