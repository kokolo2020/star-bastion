const C='sb-sectors-v3',F=['./','index.html','play.html','net.js','config.js','manifest.webmanifest','premium.css','audio.js','regions.js','assets/art/icon-192-v2.png','assets/art/icon-512-v2.png','assets/art/star-bastion-thumbnail-1280x720.jpg',...Array.from({length:5},(_,i)=>'img/tower'+i+'.png')];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('sb-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
