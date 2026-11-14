/* Deterministic decorative sectors shared by the host and phone battlefield. */
(function(root){
'use strict';
const all=Object.freeze([
 {id:'aurora',name:'Aurora Reach',sky:['#07051d','#111c46','#040a17'],cloud:['#7244d4','#238cc3'],accent:'#81caff',kind:'ringed'},
 {id:'ember',name:'Ember Nebula',sky:['#1d080e','#35101b','#090712'],cloud:['#dd4827','#9b2457'],accent:'#ffb76b',kind:'sun'},
 {id:'glacial',name:'Glacial Drift',sky:['#031627','#103b52','#040c1d'],cloud:['#238bc2','#41b2ac'],accent:'#a1eeff',kind:'ice'},
 {id:'belt',name:'Shattered Belt',sky:['#141323','#282238','#070b18'],cloud:['#68607f','#86573b'],accent:'#d5b38b',kind:'asteroids'},
 {id:'verdant',name:'Verdant Rift',sky:['#041b1d','#10362f','#050c1b'],cloud:['#29835c','#297b9a'],accent:'#94efc0',kind:'binary'},
 {id:'horizon',name:'Eventide Horizon',sky:['#10051e','#25103e','#050916'],cloud:['#9a3d98','#423d9a'],accent:'#e4a5ff',kind:'blackhole'}
].map(Object.freeze));
const byId=id=>all.find(r=>r.id===id)||all[0];
function forWave(wave){const n=Number.isFinite(wave)?Math.max(1,Math.floor(wave)):1;return all[Math.floor((n-1)/5)%all.length]}
const cache=new Map(),states=new WeakMap();
function rng(seed){let n=seed>>>0;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296}}
function glow(g,x,y,r,color,opacity){g.save();g.globalAlpha=opacity;const f=g.createRadialGradient(x,y,0,x,y,r);f.addColorStop(0,color);f.addColorStop(1,color+'00');g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.restore()}
function ellipse(g,x,y,rx,ry,angle,color,line){g.strokeStyle=color;g.lineWidth=line;g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);g.stroke()}
function planet(g,x,y,r,colors,ring=false){
 glow(g,x,y,r*1.3,colors[0],.15);
 if(ring){ellipse(g,x,y,r*1.8,r*.42,-.35,colors[0]+'44',8);ellipse(g,x,y,r*1.9,r*.46,-.35,colors[0]+'66',2)}
 g.save();g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.clip();
 const f=g.createRadialGradient(x-r*.4,y-r*.5,r*.05,x+r*.1,y+r*.1,r*1.2);f.addColorStop(0,colors[0]);f.addColorStop(.5,colors[1]);f.addColorStop(1,colors[2]);g.fillStyle=f;g.fillRect(x-r,y-r,r*2,r*2);
 for(let i=-3;i<4;i++){g.strokeStyle=i%2?'#ffffff13':'#00000015';g.lineWidth=r*.09;g.beginPath();g.ellipse(x,y+i*r*.25,r*1.2,r*.12,-.26,0,Math.PI*2);g.stroke()}
 const shade=g.createLinearGradient(x-r,y-r,x+r,y+r);shade.addColorStop(0,'#00000000');shade.addColorStop(.65,'#02051422');shade.addColorStop(1,'#010312e6');g.fillStyle=shade;g.fillRect(x-r,y-r,r*2,r*2);g.restore();
 ellipse(g,x,y,r,r,0,colors[0]+'55',1);
}
function rock(g,x,y,r,random,tint){
 g.save();g.translate(x,y);g.rotate(random()*6.28);g.beginPath();
 for(let i=0;i<8;i++){const a=i/8*6.28,n=r*(.66+random()*.34);g.lineTo(Math.cos(a)*n,Math.sin(a)*n)}g.closePath();
 const f=g.createLinearGradient(-r,-r,r,r);f.addColorStop(0,tint);f.addColorStop(.5,'#30303d');f.addColorStop(1,'#0b0d1b');g.fillStyle=f;g.fill();g.strokeStyle='#c6a99b33';g.lineWidth=1;g.stroke();g.fillStyle='#070c1844';g.beginPath();g.arc(-r*.2,r*.05,r*.22,0,6.28);g.fill();g.restore();
}
function paint(g,w,h,region){
 const random=rng((all.indexOf(region)+1)*912741),X=v=>v*w,Y=v=>v*h;
 const bg=g.createLinearGradient(0,0,w*.4,h);region.sky.forEach((c,i)=>bg.addColorStop(i/2,c));g.fillStyle=bg;g.fillRect(0,0,w,h);
 g.save();g.globalCompositeOperation='lighter';
 for(let i=0;i<12;i++)glow(g,X(random()),Y(random()*.8),w*(.16+random()*.24),region.cloud[i%2],.08+random()*.08);
 g.restore();
 for(let i=0;i<190;i++){const x=X(random()),y=Y(random()),r=random();g.globalAlpha=.2+r*.65;g.fillStyle=i%7===0?region.accent:'#d8e6ff';g.fillRect(x,y,r>.96?2:1,r>.96?2:1)}g.globalAlpha=1;
 switch(region.kind){
  case'ringed':planet(g,X(.79),Y(.25),h*.18,['#a09aff','#49458e','#101933'],true);planet(g,X(.15),Y(.16),h*.035,['#c7d3e5','#707d9a','#1b273c']);break;
  case'sun':{
   const x=X(.78),y=Y(.20),r=h*.16;glow(g,x,y,r*2.8,'#ed6c24',.22);glow(g,x,y,r*1.7,'#ffbb54',.4);
   planet(g,x,y,r,['#ffedb4','#e68839','#8d3030']);g.save();g.globalCompositeOperation='lighter';for(let i=0;i<7;i++)ellipse(g,x,y,r*(1.06+i*.07),r*(.85+i*.05),i*.15,'#ff95552b',2);g.restore();
   planet(g,X(.21),Y(.38),h*.06,['#d98e79','#6e3147','#211329']);break;
  }
  case'ice':{
   planet(g,X(.77),Y(.23),h*.19,['#c9f6ff','#419ab6','#122b52'],true);
   g.save();g.globalAlpha=.4;for(let i=0;i<14;i++){const x=X(.05+random()*.9),y=Y(.13+random()*.54),r=5+random()*16;g.beginPath();g.moveTo(x,y-r*1.8);g.lineTo(x+r*.65,y);g.lineTo(x,y+r);g.lineTo(x-r*.65,y);g.closePath();const f=g.createLinearGradient(x-r,y-r,x+r,y+r);f.addColorStop(0,'#a4f1ff');f.addColorStop(1,'#184566');g.fillStyle=f;g.fill();g.strokeStyle='#b3e7ff77';g.stroke()}g.restore();break;
  }
  case'asteroids':{
   planet(g,X(.84),Y(.19),h*.13,['#a6a0ba','#575166','#171d33']);
   g.save();g.globalAlpha=.65;for(let i=0;i<34;i++){const x=(i/33)*w,y=h*(.16+(i/33)*.4)+(random()-.5)*h*.22;rock(g,x,y,8+random()*26,random,'#847e8f')}g.restore();break;
  }
  case'binary':{
   planet(g,X(.78),Y(.28),h*.14,['#b5f6ce','#398879','#113447']);planet(g,X(.57),Y(.18),h*.07,['#bae5ff','#5586b4','#172e51']);
   g.save();g.globalAlpha=.24;for(let i=0;i<5;i++){g.beginPath();g.moveTo(0,Y(.18+i*.08));g.bezierCurveTo(X(.28),Y(.44+i*.03),X(.66),Y(-.08+i*.08),w,Y(.32+i*.06));g.strokeStyle=i%2?'#67e2ba':'#489b9a';g.lineWidth=2+i*.8;g.stroke()}g.restore();break;
  }
  case'blackhole':{
   const x=X(.70),y=Y(.29),r=h*.105;glow(g,x,y,r*3,'#a957df',.25);g.save();g.translate(x,y);g.rotate(-.25);
   for(let i=15;i>0;i--){g.globalAlpha=.06+i*.02;ellipse(g,0,0,r*(1.8+i*.052),r*(.36+i*.018),0,i%2?'#eda0ff':'#ffc794',2+i*.3)}g.globalAlpha=1;
   glow(g,0,0,r*1.35,'#dd9dff',.52);g.fillStyle='#01020b';g.beginPath();g.arc(0,0,r,0,6.28);g.fill();ellipse(g,0,0,r*1.04,r*1.04,0,'#f5d8ffbb',2);
   g.restore();break;
  }
 }
 // Keep the central combat area dark enough for every enemy/weapon color.
 const veil=g.createLinearGradient(0,0,0,h);veil.addColorStop(0,'#02061300');veil.addColorStop(.55,'#02061330');veil.addColorStop(1,'#020613a8');g.fillStyle=veil;g.fillRect(0,0,w,h);
 const v=g.createRadialGradient(w*.5,h*.42,h*.1,w*.5,h*.45,w*.7);v.addColorStop(0,'#00000000');v.addColorStop(1,'#00020a99');g.fillStyle=v;g.fillRect(0,0,w,h);
}
function scene(ctx,w,h,region,quality){
 const key=[region.id,w,h,quality].join(':');if(cache.has(key))return cache.get(key);
 const c=ctx.canvas.ownerDocument.createElement('canvas');c.width=Math.round(w*quality);c.height=Math.round(h*quality);const g=c.getContext('2d');g.setTransform(quality,0,0,quality,0,0);paint(g,w,h,region);cache.set(key,c);
 if(cache.size>8)cache.delete(cache.keys().next().value);return c;
}
function draw(ctx,w,h,id,time,options={}){
 const region=byId(id),quality=options.quality===.5?.5:1,t=Number.isFinite(time)?time:0;
 let s=states.get(ctx);if(!s){s={from:region,to:region,start:t};states.set(ctx,s)}
 if(s.to!==region){s.from=s.to;s.to=region;s.start=t}
 const progress=options.reducedMotion?1:Math.max(0,Math.min(1,(t-s.start)/2.4));
 ctx.save();ctx.globalAlpha=1;ctx.drawImage(scene(ctx,w,h,s.from,quality),0,0,w,h);
 if(s.from!==s.to){ctx.globalAlpha=progress;ctx.drawImage(scene(ctx,w,h,s.to,quality),0,0,w,h);if(progress===1)s.from=s.to}
 ctx.restore();return region;
}
const api={all,byId,forWave,draw};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SpaceRegions=api;
})(typeof window!=='undefined'?window:globalThis);
