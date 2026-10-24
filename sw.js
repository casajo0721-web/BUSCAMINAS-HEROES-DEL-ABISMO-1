// sw.js - la red manda y el caché solo es respaldo sin conexión.
// Los archivos del juego se piden siempre frescos, así que ya NO hace falta
// subir de versión para ver los cambios. V solo sirve para vaciar el caché
// viejo una vez (cámbialo si algún día quieres empezar de cero).
const V='abismo-v18';
const PRE=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
const ESPERA=6000; // si la red tarda más y hay copia guardada, se usa la copia
const LIB='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

const buena=r=>!!r&&r.ok&&r.type!=='opaque'&&r.type!=='error';
const limpia=r=>r.redirected?new Response(r.body,{status:r.status,statusText:r.statusText,headers:r.headers}):r;
const guardar=(k,r)=>caches.open(V).then(c=>c.put(k,r)).catch(()=>{});

// Archivos del juego: red primero, caché solo si no hay conexión o tarda demasiado.
async function redPrimero(e,q){
  const k=q.url;
  let pend=Promise.resolve();
  const red=fetch(k,{cache:'no-store'}).then(r=>{if(buena(r))pend=guardar(k,r.clone());return r});
  e.waitUntil(red.then(()=>pend,()=>{}));
  let t;
  const o=await Promise.race([red.then(r=>({r}),()=>({err:1})),new Promise(ok=>{t=setTimeout(()=>ok({lento:1}),ESPERA)})]);
  clearTimeout(t);
  if(o.r&&o.r.ok)return limpia(o.r);
  const c=await caches.open(V);
  const hit=(await c.match(k,{ignoreSearch:true}))||(q.mode==='navigate'?await c.match('index.html'):null);
  if(hit)return hit;
  if(o.lento)return red.then(limpia); // sin copia guardada: se espera a la red
  if(o.r)return o.r;                   // por ejemplo un 404 real
  return Response.error();
}

// Música: caché primero (pesa mucho), y se vuelve a bajar solo si cambió de tamaño.
async function musica(e,q){
  const c=await caches.open(V),k=q.url,hit=await c.match(k);
  if(hit){e.waitUntil(revisar(c,k,hit));return hit}
  const r=await fetch(k);
  if(r.status===200)e.waitUntil(c.put(k,r.clone()).catch(()=>{}));
  return r;
}
async function revisar(c,k,hit){
  try{
    const h=await fetch(k,{method:'HEAD',cache:'no-store'});
    const a=h.headers.get('content-length'),b=hit.headers.get('content-length');
    if(h.ok&&a&&b&&a!==b){const r=await fetch(k,{cache:'no-store'});if(r.status===200)await c.put(k,r)}
  }catch(_){}
}

// three.js: versión fija, caché primero; solo se guarda una respuesta buena (nunca una opaca/rota).
async function libreria(e,q){
  const c=await caches.open(V),k=q.url,hit=await c.match(k);
  if(hit)return hit;
  try{
    const r=await fetch(k,{mode:'cors',cache:'no-store'});
    if(r.ok){e.waitUntil(c.put(k,r.clone()).catch(()=>{}));return r}
  }catch(_){}
  return fetch(q);
}

self.addEventListener('install',e=>{
  self.skipWaiting();
  const pre=Promise.all(PRE.map(f=>fetch(new Request(f,{cache:'reload'})).then(r=>buena(r)?guardar(f,r):0).catch(()=>{})));
  // nunca se queda esperando: máximo 8 s
  e.waitUntil(Promise.race([pre,new Promise(ok=>setTimeout(ok,8000))]));
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const n of await caches.keys())if(n!==V)await caches.delete(n);
    await self.clients.claim();
  })());
});

// Salida de emergencia: postMessage('limpiar') borra todo el caché.
self.addEventListener('message',e=>{
  if(e.data==='limpiar')e.waitUntil(caches.keys().then(k=>Promise.all(k.map(n=>caches.delete(n)))));
});

self.addEventListener('fetch',e=>{
  const q=e.request;
  if(q.method!=='GET')return;
  const u=new URL(q.url);
  if(u.href===LIB||(u.hostname==='cdnjs.cloudflare.com'&&u.pathname.endsWith('three.min.js'))){e.respondWith(libreria(e,q));return}
  if(u.origin!==self.location.origin)return;
  if(q.headers.has('range'))return;
  if(u.pathname.endsWith('/musica.mp3')){e.respondWith(musica(e,q));return}
  e.respondWith(redPrimero(e,q));
});
