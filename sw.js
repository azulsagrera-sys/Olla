const CACHE='olla-v2';
const FILES=['./','./index.html','./config.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
const LIBS='https://www.gstatic.com/firebasejs/';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=req.url;
  if(url.startsWith(LIBS)){
    // Librerías versionadas: primero la copia guardada
    e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r&&r.ok)c.put(req,r.clone());return r}));
    return;
  }
  if(new URL(url).origin!==location.origin)return;
  // Archivos de la app: primero internet (para tomar las actualizaciones), si no hay señal, la copia guardada
  e.respondWith(caches.open(CACHE).then(async c=>{
    try{const r=await Promise.race([fetch(req),timeout(3500)]);if(r&&r.ok)c.put(req,r.clone());return r}
    catch(err){const hit=await c.match(req,{ignoreSearch:true})||(req.mode==='navigate'?await c.match('./index.html'):null);if(hit)return hit;throw err}
  }));
});
