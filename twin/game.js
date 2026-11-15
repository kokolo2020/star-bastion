/* Twin Hunt: shared level generator, renderer and session logic */
(function(root){
'use strict';
function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const RANGES=[[0x1F300,0x1F320],[0x1F32D,0x1F37F],[0x1F380,0x1F393],[0x1F3A0,0x1F3CA],[0x1F3E0,0x1F3F0],[0x1F400,0x1F43E],[0x1F442,0x1F4FC],[0x1F4FF,0x1F53D],[0x1F550,0x1F567],[0x1F5FB,0x1F5FF],[0x1F600,0x1F64F],[0x1F680,0x1F6C5],[0x1F910,0x1F93A]];
const POOL=[];RANGES.forEach(r=>{for(let c=r[0];c<=r[1];c++)POOL.push(String.fromCodePoint(c))});
const ROOMS=['KITCHEN','GARDEN','ATTIC','GARAGE','LIBRARY','TOY ROOM','LAB','MARKET','CELLAR','STUDIO','WORKSHOP','BAKERY'];
const WW0=2400,HH0=1500;
function params(lv){return{n:Math.min(420,Math.round(10+lv*9)),s:Math.max(34,Math.round(96-lv*2.2))}}
function genLevel(lv,seed,mode){
 if(mode==='find')return genScene(lv,seed);
 const R=rng((seed^(lv*7919))>>>0),P=params(lv);
 const dens=Math.sqrt(P.n*Math.pow(1.2*P.s,2)*2.4/(2400*1500)),f=Math.max(.4,Math.min(1,Math.max(dens,.4+lv*.025))),WW=Math.round(2400*f),HH=Math.round(1500*f);
 const cols=lv<3?2:lv<8?3:4,rows=lv<3?1:lv<8?2:3;
 const rw=(WW-24*(cols+1))/cols,rh=(HH-24*(rows+1))/rows;
 const rooms=[],items=[];
 // themed emoji order: shuffle chunks of 10 consecutive emoji
 const chunks=[];for(let i=0;i<POOL.length;i+=10)chunks.push(POOL.slice(i,i+10));
 for(let i=chunks.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[chunks[i],chunks[j]]=[chunks[j],chunks[i]]}
 const order=[].concat.apply([],chunks);
 const nr=cols*rows,per=[];let left=P.n;
 for(let r=0;r<nr;r++){const k=r===nr-1?left:Math.round(P.n/nr);per.push(k);left-=k}
 let oi=0,names=ROOMS.slice();for(let i=names.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[names[i],names[j]]=[names[j],names[i]]}
 for(let r=0;r<nr;r++){
  const cx=r%cols,cy=Math.floor(r/cols),x=24+cx*(rw+24),y=24+cy*(rh+24),h=Math.floor(R()*360);
  const room={x,y,w:rw,h:rh,hue:h,name:names[r%names.length],panels:[]};
  const np=2+Math.floor(R()*3);
  for(let i=0;i<np;i++){const pw=rw*(.25+R()*.3),ph=rh*(.25+R()*.3);room.panels.push({x:x+R()*(rw-pw),y:y+R()*(rh-ph),w:pw,h:ph})}
  rooms.push(room);
  const placed=[];let d=P.s*1.08;
  for(let i=0;i<per[r];i++){
   const sz=.9+R()*.2,rad=P.s*sz/2;let px,py,ok=false;
   for(let tr=0;tr<80&&!ok;tr++){
    px=x+rad+8+R()*(rw-2*rad-16);py=y+rad+34+R()*(rh-2*rad-44);ok=true;
    for(const q of placed){const dx=q.x-px,dy=q.y-py;if(dx*dx+dy*dy<d*d){ok=false;break}}
    if(!ok&&tr%20===19)d*=.92;
   }
   const it={id:items.length,e:order[oi++%order.length],x:px,y:py,sz,room:r};items.push(it);placed.push(it);
  }
 }
 // twin pair
 const a=items[Math.floor(R()*items.length)];
 const sameP=Math.min(.9,.2+lv*.08);
 let cand=items.filter(i=>i!==a&&(R()<sameP?i.room===a.room:i.room!==a.room));
 if(!cand.length)cand=items.filter(i=>i!==a);
 const b=cand[Math.floor(R()*cand.length)];
 b.e=a.e;b.sz=a.sz;
 // remove accidental duplicates of the twin emoji elsewhere
 const used=new Set([a.e]);
 for(const it of items){if(it===a||it===b)continue;if(used.has(it.e)){let k=0;while(used.has(order[(oi+k)%order.length]))k++;it.e=order[(oi+k)%order.length];oi+=k+1}used.add(it.e)}
 return{lv,seed,P,rooms,items,pair:[a.id,b.id],WW,HH};
}

function genFind(lv,seed){
 const R=rng((seed^(lv*104729))>>>0),s=56,n=Math.min(2200,Math.round(40+lv*80));
 const need=n*Math.pow(1.35*s,2)*2.2,asp=1.6,WW=Math.round(Math.sqrt(need*asp)),HH=Math.round(WW/asp);
 const cols=Math.max(2,Math.round(WW/1100)),rows=Math.max(1,Math.round(HH/900)),nr=cols*rows;
 const rw=(WW-24*(cols+1))/cols,rh=(HH-24*(rows+1))/rows,rooms=[],items=[];
 let names=ROOMS.slice();for(let i=names.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[names[i],names[j]]=[names[j],names[i]]}
 const ti=Math.floor(R()*POOL.length),te=POOL[ti],cb=ti-ti%10,K=Math.min(8,2+Math.floor(lv/2));
 const pick=()=>{if(R()<.25){let k;do{k=cb+Math.floor(R()*10)}while(k===ti||k>=POOL.length);return POOL[k]}let k;do{k=Math.floor(R()*POOL.length)}while(k===ti);return POOL[k]};
 let left=n;
 for(let r=0;r<nr;r++){
  const cx=r%cols,cy=Math.floor(r/cols),x=24+cx*(rw+24),y=24+cy*(rh+24),h=Math.floor(R()*360);
  const room={x,y,w:rw,h:rh,hue:h,name:names[r%names.length],panels:[]};
  const np=3+Math.floor(R()*4);
  for(let i=0;i<np;i++){const pw=rw*(.2+R()*.3),ph=rh*(.2+R()*.3);room.panels.push({x:x+R()*(rw-pw),y:y+R()*(rh-ph),w:pw,h:ph})}
  rooms.push(room);
  const k=r===nr-1?left:Math.round(n/nr);left-=k;const placed=[];let d=s*1.08;
  for(let i=0;i<k;i++){
   const sz=.85+R()*.3,rad=s*sz/2;let px,py,ok=false;
   for(let tr=0;tr<60&&!ok;tr++){px=x+rad+8+R()*(rw-2*rad-16);py=y+rad+40+R()*(rh-2*rad-50);ok=true;
    for(const q of placed){const dx=q.x-px,dy=q.y-py;if(dx*dx+dy*dy<d*d){ok=false;break}}if(!ok&&tr%15===14)d*=.9}
   const it={id:items.length,e:pick(),x:px,y:py,sz,room:r};items.push(it);placed.push(it);
  }
 }
 const targets=[],used=new Set();
 for(let i=0;i<K;i++){let it,g=0;do{it=items[Math.floor(R()*items.length)];g++}while((used.has(it.room)&&g<30)||targets.indexOf(it.id)>=0);used.add(it.room);it.e=te;it.sz=1;targets.push(it.id)}
 return{lv,seed,P:{n:n,s:s},rooms,items,targets,te,pair:null,mode:'find',WW,HH};
}

/* ---- themed scenes (garage, kitchen, restaurant, toy shop) ---- */
function cps(a){return a.split(' ').map(h=>String.fromCodePoint(parseInt(h,16)))}
const THEMES=[
 {name:'GARAGE',wall:'#2a2f3b',pat:'peg',shelf:'#6b4a2b',panel:'win',acc:'#f5b942',
  tg:cps('1F527 1F528 1F529 1F526 1F4A1 1F50C 1F50B 1F9F0 1F9F2 1F9EF 1F4CF 1F4D0 1F517 1F511 1F6B2 26FD 1F6A6 1F9E4 1F3A3 1F9E2 1F512 1F52D 1F514 1F6D2'),
  fl:cps('1F697 1F699 1F695 1F69C 1F6F4 1F6F5 1F9F1 1F4E6 1F96B 1F9F4 1F9FD 1F9F9 1F9FA 1F9EA 1F392 1F97E 1F462 1F9E6 1F455 1F456 1F9FB 1F4FB 1F4FA 23F0 1F4CE 1F4CC 1F4D3 1F4D2 1F4D5 1F4F7 1F3B8 1F3BA 1F4BF 1F4BE 1F5FF 1F3C6 1F6AA 1F4A3 1F4A5'),
  big:cps('1F697 1F699 1F69A 1F69C 1F68C')},
 {name:'KITCHEN',wall:'#d9e6e2',pat:'tile',shelf:'#8a5a34',panel:'cab',acc:'#e0735a',
  tg:cps('1F373 1F52A 1F944 1F374 1F9C2 1F95A 1F9C0 1F35E 1F955 1F33D 1F345 1F346 1F34E 1F34C 1F34B 1F349 1F347 2615 1F95B 1F36A 1F951 1F9C5 1F9C4 1F36F'),
  fl:cps('1F355 1F354 1F35F 1F32D 1F37F 1F953 1F95E 1F356 1F357 1F969 1F364 1F363 1F371 1F359 1F35A 1F35B 1F35C 1F35D 1F360 1F362 1F365 1F361 1F367 1F368 1F366 1F370 1F382 1F36E 1F36D 1F36C 1F36B 1F369 1F375 1F376 1F377 1F378 1F379 1F37A 1F37B 1F943 1F964 1F37E 1F942 1F96B 1F9F4 1F9FD 1F9F9 1F9FA 1F525 1F4A7 1F34A 1F34D 1F352 1F353 1F351 1F350 1F96D'),
  big:cps('1F34E 1F349 1F355 1F382 1F357')},
 {name:'RESTAURANT',wall:'#4a1f2a',pat:'stripe',shelf:'#3a2418',panel:'table',acc:'#ffd166',
  tg:cps('1F355 1F354 1F35F 1F32D 1F35D 1F35C 1F363 1F364 1F369 1F370 1F377 1F37A 2615 1F942 1F37E 1F366 1F368 1F36B 1F36C 1F32E 1F32F 1F957 1F372 1F35B'),
  fl:cps('1F468 1F469 1F474 1F475 1F46E 1F477 1F482 1F385 1F478 1F934 1F935 1F470 1F920 1F921 1F47B 1F47D 1F916 1F383 1F436 1F431 1F42D 1F439 1F430 1F98A 1F43B 1F43C 1F428 1F42F 1F981 1F42E 1F437 1F438 1F435 1F339 1F33B 1F337 1F3B6 1F3B5 1F374 1F96B 1F9C2 1F34E 1F34C 1F347 1F349 1F353 1F352 1F34B 1F951 1F955'),
  big:cps('1F468 1F469 1F385 1F478 1F916')},
 {name:'TOY SHOP',wall:'#3a2a6e',pat:'dots',shelf:'#c0568a',panel:'rain',acc:'#7ee8ff',
  tg:cps('1F9F8 1F3B2 1F3AE 1F3A8 1F3B8 1F3BA 1F941 1F3BB 1F682 1F681 1F680 26BD 1F3C0 1F3AF 1F388 1F381 1F3B9 1F9E9 1F52E 1F3AD 1F3AA 1F3A0 1F3A1 1F3C6'),
  fl:cps('1F436 1F431 1F42D 1F439 1F430 1F98A 1F43B 1F43C 1F428 1F42F 1F981 1F42E 1F437 1F438 1F435 1F984 1F995 1F996 1F40C 1F98B 1F41E 1F36D 1F36C 1F380 1F308 2B50 1F31F 1F48E 1F451 1F3A9 26BE 1F3C8 1F3BE 1F3D0 1F3D3 1F94A 1F3B7 1F4EF 1F3B3 1F3B1 1F4A5 1F389 1F38A 1F38D 1F3B6 1F6B2 1F697 1F699 1F68C 1F69C 1F6F4'),
  big:cps('1F9F8 1F984 1F995 1F680 1F3A0')}
];
function genScene(lv,seed){
 const R=rng((seed^(lv*2654435))>>>0),th=THEMES[(lv-1)%THEMES.length],f=Math.min(2,1+.11*(lv-1));
 const WW=Math.round(3200*f),HH=Math.round(2000*f),rowH=280,rows=Math.floor(HH/rowH);
 const n=Math.min(2800,900+lv*150),K=Math.min(20,10+Math.floor(lv/2)),items=[];
 const tgE=th.tg.slice();for(let i=tgE.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[tgE[i],tgE[j]]=[tgE[j],tgE[i]]}
 const tl=tgE.slice(0,K),skip=new Set(th.tg);
 const fill=th.fl.filter(e=>!skip.has(e));
 const panels=[];
 for(let r=0;r<rows;r++){let x=40;while(x<WW-200){const w=300+R()*420;panels.push({x:x,y:r*rowH+22,w:w,h:rowH-70,k:Math.floor(R()*3),hue:Math.floor(R()*360)});x+=w+30+R()*50}}
 // giants
 const ng=Math.round(8+lv*1.2);
 for(let i=0;i<ng;i++){const e=th.big[Math.floor(R()*th.big.length)];if(skip.has(e))continue;items.push({e:e,x:100+R()*(WW-200),y:100+R()*(HH-200),px:170+R()*170,rot:(R()-.5)*.5,fl:R()<.5?1:0,l:0})}
 for(let i=0;i<n;i++){
  const r=Math.floor(R()*rows),px=64*(.55+R()*.9);
  items.push({e:fill[Math.floor(R()*fill.length)],x:30+R()*(WW-60),y:r*rowH+44+R()*(rowH-84),px:px,rot:(R()-.5)*.9,fl:R()<.5?1:0,l:1});
 }
 const targets=[];
 for(let i=0;i<K;i++){const r=Math.floor((i*rows/K+R()*rows/K))%rows;
  items.push({e:tl[i],x:60+R()*(WW-120),y:r*rowH+50+R()*(rowH-100),px:50+R()*34,rot:(R()-.5)*.8,fl:R()<.5?1:0,l:2,t:1})}
 items.sort((a,b)=>a.l-b.l||a.y-b.y);
 const tlist=[];
 items.forEach((it,i)=>{it.id=i;it.sz=it.px/64;if(it.t){targets.push(i);tlist.push({id:i,e:it.e})}});
 return{lv,seed,P:{n:items.length,s:64},rooms:[],items,targets,tlist,theme:th,themeName:th.name,panels,rowH,rows,scene:true,te:null,pair:null,mode:'find',WW,HH};
}
/* ---- sprites & drawing ---- */
const spr={};
function sprite(e){
 if(spr[e])return spr[e];
 const c=document.createElement('canvas');c.width=c.height=80;const x=c.getContext('2d');
 x.font='62px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,40,44);
 return spr[e]=c;
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}

const patC={};
function pattern(c,th){
 if(patC[th.name])return patC[th.name];
 const k=document.createElement('canvas');k.width=k.height=90;const x=k.getContext('2d');
 x.fillStyle=th.wall;x.fillRect(0,0,90,90);
 if(th.pat==='peg'){x.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<3;i++)for(let j=0;j<3;j++){x.beginPath();x.arc(15+i*30,15+j*30,3,0,6.3);x.fill()}}
 else if(th.pat==='tile'){x.strokeStyle='rgba(0,0,0,.12)';x.lineWidth=3;x.strokeRect(1.5,1.5,87,87);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(6,6,30,6)}
 else if(th.pat==='stripe'){x.fillStyle='rgba(255,255,255,.06)';x.fillRect(0,0,45,90)}
 else{x.fillStyle='rgba(255,255,255,.08)';x.beginPath();x.arc(22,22,10,0,6.3);x.arc(67,67,10,0,6.3);x.fill()}
 return patC[th.name]=c.createPattern(k,'repeat');
}
function backdrop(c,L,x0,y0,x1,y1,z){
 const th=L.theme;c.fillStyle=pattern(c,th);c.fillRect(x0,y0,x1-x0,y1-y0);
 for(const p of L.panels){
  if(p.x>x1||p.x+p.w<x0||p.y>y1||p.y+p.h<y0)continue;
  if(th.panel==='win'||p.k===0&&th.panel!=='table'){c.fillStyle='hsl('+p.hue+',35%,22%)';rr(c,p.x,p.y,p.w,p.h,10);c.fill();c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=4;c.stroke();c.fillStyle='rgba(255,255,255,.06)';rr(c,p.x+14,p.y+14,p.w-28,p.h-28,8);c.fill()}
  else if(th.panel==='cab'){c.fillStyle='hsl('+(20+p.k*10)+',45%,'+(38+p.k*4)+'%)';rr(c,p.x,p.y,p.w,p.h,10);c.fill();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=4;c.stroke();c.strokeRect(p.x+16,p.y+16,p.w-32,p.h-32);c.fillStyle='#ddd';c.fillRect(p.x+p.w-34,p.y+p.h/2-20,8,40)}
  else if(th.panel==='table'){c.fillStyle='hsl(0,60%,'+(30+p.k*6)+'%)';c.beginPath();c.ellipse(p.x+p.w/2,p.y+p.h*.55,p.w/2,p.h*.42,0,0,6.3);c.fill();c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=4;c.setLineDash([14,10]);c.stroke();c.setLineDash([])}
  else{c.fillStyle='hsl('+p.hue+',55%,40%)';rr(c,p.x,p.y,p.w,p.h,26);c.fill();c.fillStyle='rgba(255,255,255,.18)';rr(c,p.x+10,p.y+10,p.w-20,p.h*.3,16);c.fill()}
 }
 for(let r=0;r<L.rows;r++){const y=r*L.rowH+L.rowH-44;if(y>y1||y+26<y0)continue;
  c.fillStyle=th.shelf;c.fillRect(0,y,L.WW,26);c.fillStyle='rgba(255,255,255,.22)';c.fillRect(0,y,L.WW,5);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,y+26,L.WW,8)}
}
function draw(c,L,cam,vw,vh,o){
 o=o||{};const z=cam.z,T=o.t||0;
 c.save();c.translate(vw/2-cam.cx*z,vh/2-cam.cy*z);c.scale(z,z);
 const x0=cam.cx-vw/2/z,x1=cam.cx+vw/2/z,y0=cam.cy-vh/2/z,y1=cam.cy+vh/2/z;
 if(L.scene)backdrop(c,L,x0,y0,x1,y1,z);
 for(const r of L.rooms){
  if(r.x>x1||r.x+r.w<x0||r.y>y1||r.y+r.h<y0)continue;
  c.fillStyle='hsl('+r.hue+',32%,15%)';rr(c,r.x,r.y,r.w,r.h,28);c.fill();
  c.strokeStyle='hsla('+r.hue+',50%,40%,.55)';c.lineWidth=3;c.stroke();
  for(const p of r.panels){c.fillStyle='hsla('+r.hue+',30%,26%,.55)';rr(c,p.x,p.y,p.w,p.h,18);c.fill()}
  c.fillStyle='hsla('+r.hue+',60%,75%,.45)';c.font='700 '+(L.mode==='find'?44:26)+'px Inter,Arial,sans-serif';c.textAlign='left';c.textBaseline='top';c.fillText(r.name,r.x+18,r.y+10);
 }
 const hide=o.hide;
 for(const it of L.items){
  const s=L.P.s*it.sz,h=s/2;
  if(it.x+h<x0||it.x-h>x1||it.y+h<y0||it.y-h>y1)continue;
  if(z>.12&&!L.scene){c.fillStyle='rgba(255,255,255,.09)';c.beginPath();c.arc(it.x,it.y,h*.92,0,6.2832);c.fill()}
  if(z>.14&&it.rot){c.save();c.translate(it.x,it.y);c.rotate(it.rot);if(it.fl)c.scale(-1,1);c.drawImage(sprite(it.e),-s*.55,-s*.55,s*1.1,s*1.1);c.restore()}else c.drawImage(sprite(it.e),it.x-s*.55,it.y-s*.55,s*1.1,s*1.1);
 }
 const I=L.items;
 if(o.tried){c.lineWidth=Math.max(3/z,3);c.strokeStyle='rgba(255,170,70,.6)';for(const id of o.tried){const it=I[id];c.beginPath();c.arc(it.x,it.y,L.P.s*it.sz*.62,0,6.2832);c.stroke()}}
 if(o.fd){c.lineWidth=Math.max(5/z,4);c.strokeStyle='rgba(93,255,122,.95)';for(const id of o.fd){const it=I[id];c.beginPath();c.arc(it.x,it.y,Math.max(L.P.s*.8,14/z),0,6.2832);c.stroke()}}
 if(o.hint){const hh=o.hint;c.save();c.setLineDash([16/z,12/z]);c.lineWidth=4/z;c.strokeStyle='rgba(255,224,61,'+(.55+.3*Math.sin(T*4))+')';c.beginPath();c.arc(hh[0],hh[1],hh[2],0,6.2832);c.stroke();c.fillStyle='rgba(255,224,61,.06)';c.fill();c.restore()}
 if(o.sel!=null){const it=I[o.sel];c.lineWidth=5/z;c.strokeStyle='#35e6ff';c.beginPath();c.arc(it.x,it.y,L.P.s*it.sz*.68,0,6.2832);c.stroke()}
 if(o.found){const A=I[o.found[0]],B=I[o.found[1]],p=.5+.5*Math.sin(T*8);c.lineWidth=6/z;c.strokeStyle='rgba(93,255,122,.9)';
  for(const it of [A,B]){c.beginPath();c.arc(it.x,it.y,L.P.s*it.sz*(.7+.15*p),0,6.2832);c.stroke()}
  c.setLineDash([14/z,10/z]);c.beginPath();c.moveTo(A.x,A.y);c.lineTo(B.x,B.y);c.stroke()}
 c.restore();
}
function fitCam(vw,vh,pad,L){const w=L?L.WW:WW0,h=L?L.HH:HH0;const z=Math.min((vw-(pad||0))/w,(vh-(pad||0))/h);return{cx:w/2,cy:h/2,z}}
function hit(L,wx,wy,minR){
 if(L.scene){for(let i=L.items.length-1;i>=0;i--){const it=L.items[i],dx=it.x-wx,dy=it.y-wy,r=Math.max(it.px*.5,minR);if(dx*dx+dy*dy<r*r)return it}return null}let best=null,bd=1e18;for(const it of L.items){const dx=it.x-wx,dy=it.y-wy,d=dx*dx+dy*dy,r=Math.max(L.P.s*it.sz*.6,minR);if(d<r*r&&d<bd){bd=d;best=it}}return best}
/* ---- session (host-side logic, no DOM) ---- */
function Session(){
 this.ph='lobby';this.lv=0;this.players={};this.clk=0;this.el=0;this.sc=0;this.tried=[];this.lastFind=null;this.L=null;this.clearT=0;this.autoT=null;this.seed=0;this.hn=null;this.version=0;this.feed=[];this.mode='find';this.fd=[];this.lastProg=0;this.flash=null;
}
Session.prototype={
 join(id,nm){
  nm=String(nm||'Player').replace(/[^\w \-.!?]/g,'').trim().slice(0,12)||'Player';
  let p=this.players[id];
  if(!p){p=this.players[id]={id:id,nm:nm,pts:0,finds:0,seen:this.clk};this.feed.unshift(nm+' joined');this.feed.length=Math.min(this.feed.length,6);if(this.ph==='lobby'&&this.autoT==null)this.autoT=15}
  else p.nm=nm;
  p.seen=this.clk;this.version++;return p;
 },
 seen(id){const p=this.players[id];if(p)p.seen=this.clk},
 leave(id){const p=this.players[id];if(p){delete this.players[id];this.feed.unshift(p.nm+' left');this.feed.length=Math.min(this.feed.length,6);this.version++}},
 setMode(m){if(this.ph==='lobby'){this.mode=m;this.version++}},
 start(){if(this.ph!=='lobby')return;this.lv=0;this.sc=0;this.autoT=null;this.next()},
 next(){
  this.lv++;this.seed=Math.floor(Math.random()*1e9);this.L=genLevel(this.lv,this.seed,this.mode);this.fd=[];this.lastProg=0;this.flash=null;this.el=0;this.ph='play';this.tried=[];this.lastFind=null;this.hn=null;
  const R=rng(this.seed+5);this.hOff=[Math.cos(R()*6.28),Math.sin(R()*6.28),.25+R()*.5];this.version++;
 },
 hintOf(){
  if(this.mode==='find'){
   if(this.ph!=='play'||this.el-this.lastProg<40)return null;
   const id=this.L.targets.find(t=>this.fd.indexOf(t)<0);if(id==null)return null;const k=Math.floor((this.el-this.lastProg-40)/25),r=Math.max(180,900*Math.pow(.65,k)),A=this.L.items[id];
   return[Math.round(A.x+this.hOff[0]*r*this.hOff[2]),Math.round(A.y+this.hOff[1]*r*this.hOff[2]),Math.round(r)];
  }
  if(this.ph!=='play'||this.el<40)return null;
  const k=Math.floor((this.el-40)/25),r=Math.max(130,650*Math.pow(.65,k)),A=this.L.items[this.L.pair[0]];
  return[Math.round(A.x+this.hOff[0]*r*this.hOff[2]),Math.round(A.y+this.hOff[1]*r*this.hOff[2]),Math.round(r)];
 },
 tick(dt){
  this.clk+=dt;
  if(this.ph==='play'){this.el+=dt}
  else if(this.ph==='clear'){this.clearT-=dt;if(this.clearT<=0)this.next()}
  else if(this.ph==='lobby'&&this.autoT!=null){if(!Object.keys(this.players).length)this.autoT=null;else{this.autoT-=dt;if(this.autoT<=0)this.start()}}
  for(const id in this.players){if(this.clk-this.players[id].seen>90)this.leave(id)}
  this.tried=this.tried.filter(t=>this.clk-t.t<40);
 },
 tap(id,itemId){
  const p=this.players[id];if(!p)return{ok:false,m:'Join first'};this.seen(id);
  if(this.ph!=='play'||this.mode!=='find')return{ok:false,m:'Wait for the next level'};
  const L=this.L,it=L.items[itemId];if(!it)return{ok:false,m:'Missed'};
  if(L.targets.indexOf(itemId)>=0&&this.fd.indexOf(itemId)<0){
   const pts=Math.round(40+this.lv*8+Math.max(0,60-(this.el-this.lastProg)));this.fd.push(itemId);this.lastProg=this.el;p.pts+=pts;p.finds++;this.sc+=pts;
   const left=L.targets.length-this.fd.length;this.lastFind={nm:p.nm,a:itemId,b:itemId,pts:pts,el:Math.round(this.el),left:left};this.flash={id:itemId,t:this.clk};
   this.feed.unshift(p.nm+' found one! +'+pts);this.feed.length=Math.min(this.feed.length,6);
   if(!left){this.ph='clear';this.clearT=6}
   this.hOff[0]=Math.cos(this.clk*3.1);this.hOff[1]=Math.sin(this.clk*3.1);this.version++;return{ok:true,m:left?'Found! '+left+' left':'All found! +'+pts,found:true};
  }
  if(this.fd.indexOf(itemId)>=0)return{ok:false,m:'Already found'};
  this.tried.push({a:itemId,b:itemId,t:this.clk});this.version++;return{ok:false,m:'Not it'};
 },
 sel(id,a,b){
  const p=this.players[id];if(!p)return{ok:false,m:'Join first'};
  this.seen(id);
  if(this.ph!=='play')return{ok:false,m:'Wait for the next level'};
  if(a===b||!this.L.items[a]||!this.L.items[b])return{ok:false,m:'Pick two different items'};
  const pr=this.L.pair;
  if((a===pr[0]&&b===pr[1])||(a===pr[1]&&b===pr[0])){
   const pts=Math.round(100+this.lv*20+Math.max(0,150-this.el));
   p.pts+=pts;p.finds++;this.sc+=pts;this.ph='clear';this.clearT=6;this.lastFind={nm:p.nm,a:pr[0],b:pr[1],pts:pts,el:Math.round(this.el)};
   this.feed.unshift(p.nm+' found the twins! +'+pts);this.feed.length=Math.min(this.feed.length,6);this.version++;
   return{ok:true,m:'Twins found! +'+pts,found:true};
  }
  this.tried.push({a:a,b:b,t:this.clk});this.version++;
  return{ok:false,m:'Not a match'};
 },
 snap(){
  const pl=Object.values(this.players).sort((x,y)=>y.pts-x.pts).map(p=>[p.id,p.nm,p.pts,p.finds,this.clk-p.seen>20?1:0]);
  const tr=this.tried.slice(-30).map(t=>[t.a,t.b]);
  return{t:'st',md:this.mode,fd:this.fd.slice(),tn:this.L&&this.L.targets?this.L.targets.length:0,ph:this.ph,lv:this.lv,seed:this.seed,el:Math.round(this.el),sc:this.sc,pl:pl,tr:tr,hn:this.hintOf(),lf:this.lastFind,cd:this.ph==='lobby'&&this.autoT!=null?Math.ceil(this.autoT):null,ct:this.ph==='clear'?Math.ceil(this.clearT):null};
 }
};
root.TH={rng,POOL,WW:WW0,HH:HH0,params,genLevel,draw,fitCam,hit,sprite,Session,rr};
if(typeof module!=='undefined')module.exports=root.TH;
})(typeof window!=='undefined'?window:globalThis);
