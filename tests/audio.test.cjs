const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function fixture(){
 const events=[],timers=[],handlers={};let contexts=0;
 const param={setValueAtTime(v){assert(Number.isFinite(v));events.push(v)},exponentialRampToValueAtTime(v){assert(v>0&&Number.isFinite(v))},setTargetAtTime(v){assert(Number.isFinite(v));events.push(v)}};
 const node=()=>({connect(){},gain:{...param},frequency:{...param},threshold:{},ratio:{},start(){events.push('start')},stop(){}});
 class Context{constructor(){contexts++;this.currentTime=0;this.sampleRate=48000;this.state='suspended';this.destination={}}createGain(){return node()}createDynamicsCompressor(){return node()}createOscillator(){return node()}createBufferSource(){return node()}createBiquadFilter(){return node()}createBuffer(){return{getChannelData:()=>new Float32Array(48000)}}async resume(){this.state='running'}}
 const panel={className:'',innerHTML:'',querySelector(){return{value:0,addEventListener(){}}},addEventListener(t,f){handlers[t]=f}};
 const doc={hidden:false,readyState:'complete',body:{append(){}},createElement:()=>panel,querySelectorAll:()=>[],addEventListener(t,f){handlers[t]=f}};
 const box={window:{AudioContext:Context},document:doc,localStorage:{getItem(){return null},setItem(){}},setInterval(f){timers.push(f)},console};vm.createContext(box);vm.runInContext(fs.readFileSync('audio.js','utf8'),box);return{a:box.window.SBAudio,events,timers,doc,handlers,get contexts(){return contexts}};
}
test('no autoplay context before host gesture; repeated unlock has one scheduler',async()=>{const f=fixture();assert.equal(f.contexts,0);assert.equal(f.a.status.context,'locked');await f.a.unlock();await f.a.unlock();assert.equal(f.contexts,1);assert.equal(f.timers.length,1);assert.equal(f.a.status.context,'running')});
test('battle score and all arcade effects schedule finite bounded signals',async()=>{const f=fixture();await f.a.unlock();f.a.setScene('wave',true);f.timers[0]();for(const name of ['shot','nova','boss','over','clear','upgrade','hit'])f.a.fx(name,1);assert(f.events.filter(x=>x==='start').length>10)});
test('hidden host silences master and schedules no new sounds',async()=>{const f=fixture();await f.a.unlock();f.doc.hidden=true;f.handlers.visibilitychange();const count=f.events.filter(x=>x==='start').length;f.timers[0]();f.a.fx('nova');assert.equal(f.events.filter(x=>x==='start').length,count);assert.equal(f.events.at(-1),0)});
