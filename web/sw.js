/* App-shell assets only. Personal Craft responses and HTML are always network-only. */
const CACHE='atlas-vivo-uct20-shell-v18';
const STATIC=['/style.css','/clinical-lab.css','/clinical-lab.js','/knowledge-panels.js','/app.js','/model3d.js','/webgl3d.js','/craft-sync.js','/maneuver-engine.js','/unified-data.js','/mechanism-workbench.js','/favicon.svg','/manifest.webmanifest','/apple-touch-icon.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('atlas-vivo-uct20-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!STATIC.includes(url.pathname))return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}
    return response;
  }).catch(()=>caches.match(request)));
});
