const V='abismo-v15',T3='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',F=['./','index.html','manifest.json','icon-192.png','icon-512.png','musica.mp3',T3];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(F.map(f=>c.add(f).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!=V).map(n=>caches.delete(n)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!='GET')return;
if(e.request.url.indexOf('three.min.js')>-1){e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{if(r.status==200||r.type=='opaque'){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r})));return}
if(new URL(e.request.url).origin!==location.origin)return;
if(e.request.url.indexOf('musica.mp3')>-1){e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{if(r.status==200){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r})));return}
e.respondWith(fetch(e.request).then(r=>{if(r.status==200){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(m=>m||(e.request.mode=='navigate'?caches.match('index.html'):Response.error()))))});
