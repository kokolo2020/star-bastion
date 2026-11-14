/* Shared desktop/phone battle artwork. Rendering only; no damage or game authority. */
(function(root){'use strict';
const TYPES=[{n:'PULSE',col:'#35e6ff'},{n:'CANNON',col:'#ffa63d'},{n:'LASER',col:'#5dff7a'},{n:'FROST',col:'#8aa8ff'},{n:'RAIL',col:'#ff5de0'}];
function camera(station,count=10,focus=false){const width=focus?512:1280;const center=(Math.max(0,station)+.5)*1280/count;return{width,height:656,x:Math.max(0,Math.min(1280-width,center-width/2)),y:64}}
function create(ctx,TIMG=[]){
const TY=TYPES;let T=0,bullets=[],beams=[],parts=[],floats=[],nova=null,towers=[],FW=1280,FH=720,WALL=540;
function rgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
function rgba(h,a){const c=rgb(h);return'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'}
function light(h,t){const c=rgb(h);return'rgb('+Math.round(c[0]+(255-c[0])*t)+','+Math.round(c[1]+(255-c[1])*t)+','+Math.round(c[2]+(255-c[2])*t)+')'}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function txt(s,x,y,size,col,al,wt,blur){ctx.font=(wt||'700')+' '+size+'px system-ui,sans-serif';ctx.fillStyle=col;ctx.textAlign=al||'left';ctx.textBaseline='middle';if(blur){ctx.shadowColor=col;ctx.shadowBlur=blur}ctx.fillText(s,x,y);if(blur)ctx.shadowBlur=0}
function glow(on){ctx.globalCompositeOperation=on?'lighter':'source-over'}
function radial(x,y,r,col,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,a));g.addColorStop(1,rgba(col,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.28);ctx.fill()}
function drawEnemy(e,lod){
 ctx.save();ctx.translate(e.x,e.y);
 const r=e.r,col=e.col,fl=e.fl>0;
 if(!lod){
  glow(true);
  const tg=ctx.createLinearGradient(0,-r*3.4,0,0);tg.addColorStop(0,rgba(col,0));tg.addColorStop(1,rgba(col,.4));
  ctx.fillStyle=tg;ctx.fillRect(-r*.55,-r*3.4,r*1.1,r*3.4);
  radial(0,0,r*2.4,col,e.k==='boss'?.5:.3);
  glow(false);
 }
 const g=ctx.createRadialGradient(-r*.3,-r*.35,1,0,0,r*1.25);g.addColorStop(0,fl?'#ffffff':light(col,.65));g.addColorStop(1,fl?'#ffffff':col);
 ctx.fillStyle=g;ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.2;
 ctx.beginPath();
 switch(e.k){
  case'scout':ctx.moveTo(0,r);ctx.lineTo(-r,-r);ctx.lineTo(0,-r*.4);ctx.lineTo(r,-r);ctx.closePath();break;
  case'swarm':ctx.moveTo(0,r);ctx.lineTo(-r,-r*.8);ctx.lineTo(r,-r*.8);ctx.closePath();break;
  case'splitter':ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();break;
  case'tank':rr(-r,-r,r*2,r*2,5);break;
  case'boss':{for(let i=0;i<20;i++){const a=i/20*6.28+T*.4,rad=i%2?r*.7:r;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)}ctx.closePath();break}
  default:{for(let i=0;i<6;i++){const a=i/6*6.28+.52;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath()}
 }
 ctx.fill();ctx.stroke();ctx.fillStyle=fl?'#fff':'#101526';ctx.beginPath();ctx.moveTo(0,r*.5);ctx.lineTo(-r*.32,-r*.25);ctx.lineTo(r*.32,-r*.25);ctx.closePath();ctx.fill();
 if(e.k==='boss'){ctx.fillStyle='#240008';ctx.beginPath();ctx.arc(0,0,r*.38,0,6.28);ctx.fill();glow(true);radial(0,0,r*.5,'#ffe03d',.7+.3*Math.sin(T*6));glow(false)}
 if(e.sh>0){ctx.strokeStyle='rgba(64,224,255,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r+3.5,0,6.28);ctx.stroke()}
 if(e.st>0){ctx.strokeStyle='rgba(160,190,255,.95)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r+1.5,0,6.28);ctx.stroke()}
 if(r>=10&&e.hp<e.mhp){const w=r*2;ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(-r,-r-9,w,3.5);ctx.fillStyle=e.k==='boss'?'#ff3050':'#5dff7a';ctx.fillRect(-r,-r-9,w*Math.max(0,e.hp/e.mhp),3.5)}
 ctx.restore();
}
function drawTower(t,ownerColor){
 const b=TY[t.k],sc=ownerColor||b.col;
 glow(true);radial(t.x,t.y,24+t.l*3,b.col,.10+t.l*.04);glow(false);
 ctx.save();ctx.translate(t.x,t.y);
 ctx.fillStyle='#0b1228';ctx.strokeStyle=b.col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,13,0,6.28);ctx.fill();ctx.stroke();
 ctx.strokeStyle=rgba(sc,.9);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,17,0,6.28);ctx.stroke();
 if(t.l>=5){ctx.save();ctx.rotate(T*1.5);ctx.setLineDash([5,5]);ctx.strokeStyle=rgba('#ffe03d',.85);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,21,0,6.28);ctx.stroke();ctx.restore()}
 ctx.rotate(t.ang==null?-1.57:t.ang);
 if(TIMG[t.k]._ok){ctx.rotate(1.57);ctx.drawImage(TIMG[t.k],-25,-25,50,50);if(t.fl>0){glow(true);radial(0,-21,10,'#ffffff',.8);glow(false)}ctx.restore();for(let i=0;i<t.l;i++){ctx.fillStyle='#ffe03d';ctx.fillRect(t.x-t.l*3.5+i*7,t.y-25,5,3)}return}
 ctx.fillStyle=light(b.col,.2);ctx.shadowColor=b.col;ctx.shadowBlur=9;
 let len=20;
 switch(t.k){
  case 0:len=20;ctx.fillStyle=light(b.col,.25);ctx.fillRect(2,-8,len-2,4.5);ctx.fillRect(2,3.5,len-2,4.5);ctx.fillStyle='#fff';ctx.fillRect(len-3,-8,3,4.5);ctx.fillRect(len-3,3.5,3,4.5);break;
  case 1:len=21;ctx.fillStyle=light(b.col,.15);ctx.fillRect(0,-6.5,len,13);ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(len-5,-9,5,18);ctx.fillStyle=b.col;ctx.fillRect(5,-6.5,3,13);break;
  case 2:len=27;ctx.fillStyle=light(b.col,.3);ctx.fillRect(0,-1.8,len-7,3.6);ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(len-9,-5.5);ctx.lineTo(len-9,5.5);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();break;
  case 3:len=19;ctx.fillStyle=light(b.col,.2);ctx.fillRect(0,-4.5,len-4,9);ctx.beginPath();ctx.arc(len-2,0,6.5,0,6.28);ctx.fillStyle='#e8eeff';ctx.fill();break;
  case 4:len=31;ctx.fillStyle=light(b.col,.2);ctx.fillRect(0,-3.2,len,6.4);ctx.fillStyle='#fff';for(let i=7;i<len-2;i+=7)ctx.fillRect(i,-6,2.2,12);break;
 }
 ctx.shadowBlur=0;ctx.fillStyle=b.col;ctx.beginPath();ctx.arc(0,0,7.5,0,6.28);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,2.6,0,6.28);ctx.fill();
 if(t.fl>0){glow(true);radial(len+3,0,16,'#ffffff',.9);radial(len+3,0,24,b.col,.7);glow(false)}
 ctx.restore();
 for(let i=0;i<t.l;i++){ctx.fillStyle='#ffe03d';ctx.fillRect(t.x-t.l*3.5+i*7,t.y-23,5,3)}
 txt(b.n,t.x,t.y+21,8,b.col,'center','800');
}
function drawFx(){
 glow(true);
 for(const b of bullets){
  const col=TY[b.k].col;
  if(b.k===1){radial(b.x,b.y,12,col,.7);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,3,0,6.28);ctx.fill()}
  else if(b.k===3){radial(b.x,b.y,10,col,.7);ctx.strokeStyle='#e8eeff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(b.x,b.y,3.5,0,6.28);ctx.stroke()}
  else{ctx.strokeStyle=col;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-b.vx*.035,b.y-b.vy*.035);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(b.x-b.vx*.015,b.y-b.vy*.015);ctx.lineTo(b.x,b.y);ctx.stroke()}
 }
 for(const b of beams){
  const a=Math.max(0,b.t/b.m);ctx.lineCap='round';
  ctx.globalAlpha=a*.45;ctx.strokeStyle=b.col;ctx.lineWidth=b.w*3.5;ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
  ctx.globalAlpha=a;ctx.strokeStyle='#ffffff';ctx.lineWidth=b.w*.8;ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
  ctx.globalAlpha=1;
 }
 for(const p of parts){
  const a=Math.max(0,p.life/p.max);
  if(p.fl){radial(p.x,p.y,p.r*(1.1-.4*a),'#ffffff',a*.8);radial(p.x,p.y,p.r*1.3,p.col,a*.7)}
  else if(p.ring){ctx.globalAlpha=a;ctx.strokeStyle=p.col;ctx.lineWidth=3*a+1;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1.05-a*.65),0,6.28);ctx.stroke();ctx.globalAlpha=1}
  else{ctx.globalAlpha=a;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,6.28);ctx.fill();ctx.globalAlpha=1}
 }
 glow(false);
 for(const f of floats){ctx.globalAlpha=Math.min(1,f.t*2.2);txt(f.s,f.x,f.y,f.c?17:12,f.c?'#ffe03d':(f.s[0]==='+'?'#5dff7a':'#ffffff'),'center','800',f.c?8:0);ctx.globalAlpha=1}
}
function drawNova(){
 if(!nova)return;
 glow(true);
 if(nova.ph==='charge'){
  const k=Math.min(1,nova.t/.8);
  for(const t of towers){
   ctx.strokeStyle=rgba(TY[t.k].col,.2+.6*k);ctx.lineWidth=1+3*k;ctx.lineCap='round';
   ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(FW/2,WALL-26);ctx.stroke();
   radial(t.x,t.y,24+18*k,'#ffffff',.5*k);
  }
  radial(FW/2,WALL-26,40+160*k,'#ffe03d',.5+.4*k);
  radial(FW/2,WALL-26,20+60*k,'#ffffff',.9*k);
  glow(false);
  ctx.fillStyle='rgba(2,4,14,'+(.3*k)+')';ctx.fillRect(0,0,FW,FH);
 }else{
  const y=nova.y,tail=Math.min(WALL-y,420);
  const g=ctx.createLinearGradient(0,y,0,y+tail);g.addColorStop(0,'rgba(255,240,170,.5)');g.addColorStop(1,'rgba(255,200,60,0)');
  ctx.fillStyle=g;ctx.fillRect(0,y,FW,tail);
  const g2=ctx.createLinearGradient(0,y-50,0,y+10);g2.addColorStop(0,'rgba(255,255,255,0)');g2.addColorStop(.8,'rgba(255,255,255,.95)');g2.addColorStop(1,'rgba(255,224,61,0)');
  ctx.fillStyle=g2;ctx.fillRect(0,y-50,FW,60);
  ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.shadowColor='#ffe03d';ctx.shadowBlur=22;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(FW,y);ctx.stroke();ctx.shadowBlur=0;
  glow(false);
 }
 glow(false);
}
return{
 enemy(e,time,lod=false){T=time;drawEnemy(e,lod)},
 tower(t,time,ownerColor){T=time;drawTower(t,ownerColor)},
 effects(frame,time){T=time;bullets=frame.bullets||[];beams=frame.beams||[];parts=frame.parts||[];floats=frame.floats||[];drawFx()},
 nova(n,tx,time){T=time;nova=n;towers=tx||[];drawNova()}
};}
const api={create,camera,TYPES};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BattleRender=api;
})(typeof window!=='undefined'?window:globalThis);
