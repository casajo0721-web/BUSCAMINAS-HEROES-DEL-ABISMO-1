const V='abismo-v17',T3='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',F=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
const nf=(u,ms)=>new Promise((ok,no)=>{const t=setTimeout(()=>no('timeout'),ms);fetch(u,{cache:'no-store'}).then(r=>{clearTimeout(t);ok(r)},e=>{clearTimeout(t);no(e)})});
const cf=e=>caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{if(r.status==200||r.type=='opaque'){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}));
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(F.map(f=>c.add(f).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!=V).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!='GET')return;
if(q.url.indexOf('three.min.js')>-1){e.respondWith(cf(e));return}
if(new URL(q.url).origin!==location.origin)return;
if(q.url.indexOf('musica.mp3')>-1){e.respondWith(cf(e));return}
e.respondWith(nf(q.url,4000).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(q,c))}return r}).catch(()=>caches.match(q,{ignoreSearch:true}).then(m=>m||(q.mode=='navigate'?caches.match('index.html'):Response.error()))))});
