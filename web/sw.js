/* Public PWA app-shell cache only; exclude all Craft APIs and user data. */
const CACHE='atlas-vivo-uct20-shell-v23';
const ASSETS=['/','/index.html','/style.css','/clinical-lab.css','/clinical-lab.js','/knowledge-panels.js','/app.js','/model3d.js','/webgl3d.js','/craft-sync.js','/maneuver-engine.js','/unified-data.js','/mechanism-workbench.js','/progress-transfer.js','/visual-summaries.css','/visual-summaries.js','/favicon.svg','/manifest.webmanifest','/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('atlas-vivo-uct20-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
    try{const res=await fetch(req);if(res.ok){const cache=await caches.open(CACHE);await cache.put('/index.html',res.clone())}return res}
    catch{return (await caches.match('/index.html'))||new Response('Atlas Vivo offline. Conecte-se uma vez para instalar o conteúdo.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}})}
  })());return;
 }
 if(!ASSETS.includes(url.pathname))return;
 event.respondWith((async()=>{
  const found=await caches.match(url.pathname);if(found)return found;
  const res=await fetch(req);if(res.ok){const cache=await caches.open(CACHE);await cache.put(url.pathname,res.clone())}return res;
 })());
});
