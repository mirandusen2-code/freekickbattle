const VERSION="freekick-e4666b79d561c03a";
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(['./','./manifest.webmanifest','./icon192.png','./icon512.png'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('freekick-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(VERSION).then(cache=>cache.put('./',copy)));}return response;}).catch(()=>caches.match('./')));return;}
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
});
