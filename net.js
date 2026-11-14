/* Star Bastion networking: Supabase Realtime Broadcast, with same-browser fallback */
(function(){
'use strict';
var KEY='sb_cfg';
function fromHash(){
 try{var m=location.hash.match(/cfg=([^&]+)/);if(m)return JSON.parse(atob(decodeURIComponent(m[1])))}catch(e){}
 return null;
}
function getCfg(){
 var c=fromHash();
 if(c&&c.u&&c.k){try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}return c}
 try{c=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){c=null}
 if(c&&c.u&&c.k)return c;
 if(window.SB_CONFIG&&window.SB_CONFIG.url&&window.SB_CONFIG.key)return{u:window.SB_CONFIG.url,k:window.SB_CONFIG.key};
 return null;
}
function encodeCfg(c){return encodeURIComponent(btoa(JSON.stringify(c)))}
function setCfg(u,k){try{localStorage.setItem(KEY,JSON.stringify({u:u,k:k}))}catch(e){}}
function clearCfg(){try{localStorage.removeItem(KEY)}catch(e){}}
function open(room,onMsg,onStatus){
 var cfg=getCfg();
 if(cfg&&window.supabase&&window.supabase.createClient){
  var client=window.supabase.createClient(cfg.u,cfg.k,{realtime:{params:{eventsPerSecond:30}}});
  var ch=client.channel('starbastion-'+room,{config:{broadcast:{self:false,ack:false}}});
  ch.on('broadcast',{event:'m'},function(p){try{onMsg(p.payload)}catch(e){console.error(e)}});
  ch.subscribe(function(s){
   if(!onStatus)return;
   onStatus(s==='SUBSCRIBED'?'online':(s==='CLOSED'||s==='CHANNEL_ERROR'||s==='TIMED_OUT')?'error':'connecting');
  });
  return{mode:'supabase',send:function(m){ch.send({type:'broadcast',event:'m',payload:m})},close:function(){client.removeChannel(ch)}};
 }
 var bc=new BroadcastChannel('starbastion-'+room);
 bc.onmessage=function(e){try{onMsg(e.data)}catch(err){console.error(err)}};
 setTimeout(function(){if(onStatus)onStatus('local')},0);
 return{mode:'local',send:function(m){bc.postMessage(m)},close:function(){bc.close()}};
}
window.SBNet={getCfg:getCfg,setCfg:setCfg,clearCfg:clearCfg,encodeCfg:encodeCfg,open:open};
})();
