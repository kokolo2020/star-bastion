/* Twin Hunt: shared level generator, renderer and session logic */
(function(root){
'use strict';
function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const RANGES=[[0x1F300,0x1F320],[0x1F32D,0x1F37F],[0x1F380,0x1F393],[0x1F3A0,0x1F3CA],[0x1F3E0,0x1F3F0],[0x1F400,0x1F43E],[0x1F442,0x1F4FC],[0x1F4FF,0x1F53D],[0x1F550,0x1F567],[0x1F5FB,0x1F5FF],[0x1F600,0x1F64F],[0x1F680,0x1F6C5],[0x1F910,0x1F93A]];
const POOL=[];RANGES.forEach(r=>{for(let c=r[0];c<=r[1];c++)POOL.push(String.fromCodePoint(c))});
const ROOMS=['KITCHEN','GARDEN','ATTIC','GARAGE','LIBRARY','TOY ROOM','LAB','MARKET','CELLAR','STUDIO','WORKSHOP','BAKERY'];
const WW0=2400,HH0=1500;
function params(lv){return{n:Math.min(420,Math.round(10+lv*9)),s:Math.max(34,Math.round(96-lv*2.2))}}
function genLevel(lv,seed){
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
/* ---- sprites & drawing ---- */
const spr={};
function sprite(e){
 if(spr[e])return spr[e];
 const c=document.createElement('canvas');c.width=c.height=80;const x=c.getContext('2d');
 x.font='62px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,40,44);
 return spr[e]=c;
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function draw(c,L,cam,vw,vh,o){
 o=o||{};const z=cam.z,T=o.t||0;
 c.save();c.translate(vw/2-cam.cx*z,vh/2-cam.cy*z);c.scale(z,z);
 const x0=cam.cx-vw/2/z,x1=cam.cx+vw/2/z,y0=cam.cy-vh/2/z,y1=cam.cy+vh/2/z;
 for(const r of L.rooms){
  if(r.x>x1||r.x+r.w<x0||r.y>y1||r.y+r.h<y0)continue;
  c.fillStyle='hsl('+r.hue+',32%,15%)';rr(c,r.x,r.y,r.w,r.h,28);c.fill();
  c.strokeStyle='hsla('+r.hue+',50%,40%,.55)';c.lineWidth=3;c.stroke();
  for(const p of r.panels){c.fillStyle='hsla('+r.hue+',30%,26%,.55)';rr(c,p.x,p.y,p.w,p.h,18);c.fill()}
  c.fillStyle='hsla('+r.hue+',60%,75%,.45)';c.font='700 26px Inter,Arial,sans-serif';c.textAlign='left';c.textBaseline='top';c.fillText(r.name,r.x+18,r.y+10);
 }
 const hide=o.hide;
 for(const it of L.items){
  const s=L.P.s*it.sz,h=s/2;
  if(it.x+h<x0||it.x-h>x1||it.y+h<y0||it.y-h>y1)continue;
  c.fillStyle='rgba(255,255,255,.09)';c.beginPath();c.arc(it.x,it.y,h*.92,0,6.2832);c.fill();
  c.drawImage(sprite(it.e),it.x-s*.55,it.y-s*.55,s*1.1,s*1.1);
 }
 const I=L.items;
 if(o.tried){c.lineWidth=3/z;c.strokeStyle='rgba(255,170,70,.6)';for(const id of o.tried){const it=I[id];c.beginPath();c.arc(it.x,it.y,L.P.s*it.sz*.62,0,6.2832);c.stroke()}}
 if(o.hint){const hh=o.hint;c.save();c.setLineDash([16/z,12/z]);c.lineWidth=4/z;c.strokeStyle='rgba(255,224,61,'+(.55+.3*Math.sin(T*4))+')';c.beginPath();c.arc(hh[0],hh[1],hh[2],0,6.2832);c.stroke();c.fillStyle='rgba(255,224,61,.06)';c.fill();c.restore()}
 if(o.sel!=null){const it=I[o.sel];c.lineWidth=5/z;c.strokeStyle='#35e6ff';c.beginPath();c.arc(it.x,it.y,L.P.s*it.sz*.68,0,6.2832);c.stroke()}
 if(o.found){const A=I[o.found[0]],B=I[o.found[1]],p=.5+.5*Math.sin(T*8);c.lineWidth=6/z;c.strokeStyle='rgba(93,255,122,.9)';
  for(const it of [A,B]){c.beginPath();c.arc(it.x,it.y,L.P.s*it.sz*(.7+.15*p),0,6.2832);c.stroke()}
  c.setLineDash([14/z,10/z]);c.beginPath();c.moveTo(A.x,A.y);c.lineTo(B.x,B.y);c.stroke()}
 c.restore();
}
function fitCam(vw,vh,pad,L){const w=L?L.WW:WW0,h=L?L.HH:HH0;const z=Math.min((vw-(pad||0))/w,(vh-(pad||0))/h);return{cx:w/2,cy:h/2,z}}
function hit(L,wx,wy,minR){let best=null,bd=1e18;for(const it of L.items){const dx=it.x-wx,dy=it.y-wy,d=dx*dx+dy*dy,r=Math.max(L.P.s*it.sz*.6,minR);if(d<r*r&&d<bd){bd=d;best=it}}return best}
/* ---- session (host-side logic, no DOM) ---- */
function Session(){
 this.ph='lobby';this.lv=0;this.players={};this.clk=0;this.el=0;this.sc=0;this.tried=[];this.lastFind=null;this.L=null;this.clearT=0;this.autoT=null;this.seed=0;this.hn=null;this.version=0;this.feed=[];
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
 start(){if(this.ph!=='lobby')return;this.lv=0;this.sc=0;this.autoT=null;this.next()},
 next(){
  this.lv++;this.seed=Math.floor(Math.random()*1e9);this.L=genLevel(this.lv,this.seed);this.el=0;this.ph='play';this.tried=[];this.lastFind=null;this.hn=null;
  const R=rng(this.seed+5);this.hOff=[Math.cos(R()*6.28),Math.sin(R()*6.28),.25+R()*.5];this.version++;
 },
 hintOf(){
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
  return{t:'st',ph:this.ph,lv:this.lv,seed:this.seed,el:Math.round(this.el),sc:this.sc,pl:pl,tr:tr,hn:this.hintOf(),lf:this.lastFind,cd:this.ph==='lobby'&&this.autoT!=null?Math.ceil(this.autoT):null,ct:this.ph==='clear'?Math.ceil(this.clearT):null};
 }
};
root.TH={rng,POOL,WW:WW0,HH:HH0,params,genLevel,draw,fitCam,hit,sprite,Session,rr};
if(typeof module!=='undefined')module.exports=root.TH;
})(typeof window!=='undefined'?window:globalThis);
