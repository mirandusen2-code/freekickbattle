"""Prepare a static, self-contained phone version; does not publish anything."""
from pathlib import Path
import hashlib,json,re,shutil
from PIL import Image
root=Path(__file__).resolve().parents[1];site=root/'site';site.mkdir(exist_ok=True)
html=(root/'artifacts/Freekick-Battle.html').read_text()
html,count=re.subn(r'<a href="(?:docs/VIDEOANALYSE\.md|README\.md)">[^<]*</a>','',html)
assert count==3,'Unexpected footer: inspect before creating a public build'
html=html.replace('Video-based reconstruction · Training reference · local AI','Freekick Battle · Draai je telefoon voor een groter speelveld')
head='<link rel="manifest" href="./manifest.webmanifest"><meta name="theme-color" content="#050505"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="apple-touch-icon" href="./icon192.png">'
html=html.replace('</head>',head+'</head>',1)
registration='<script>if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}</script>'
html=re.sub(r'</body>\s*</html>\s*$',lambda _:registration+'</body></html>',html)
(site/'index.html').write_text(html)
for size in [192,512]:Image.open(root/'public/reference/life.png').convert('RGBA').resize((size,size),Image.Resampling.LANCZOS).save(site/f'icon{size}.png')
manifest={'id':'./','name':'Freekick Battle','short_name':'Freekick','lang':'nl','start_url':'./','scope':'./','display':'standalone','orientation':'landscape','background_color':'#050505','theme_color':'#050505','icons':[{'src':f'./icon{s}.png','sizes':f'{s}x{s}','type':'image/png'}for s in [192,512]]}
(site/'manifest.webmanifest').write_text(json.dumps(manifest,indent=2)+'\n')
version='freekick-'+hashlib.sha256(html.encode()).hexdigest()[:16]
worker="""const VERSION=__VERSION__;
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(['./','./manifest.webmanifest','./icon192.png','./icon512.png'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('freekick-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(VERSION).then(cache=>cache.put('./',copy)));}return response;}).catch(()=>caches.match('./')));return;}
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
});
""".replace('__VERSION__',json.dumps(version))
(site/'sw.js').write_text(worker)
shutil.copyfile(root/'docs/THIRD_PARTY_NOTICES.txt',site/'THIRD_PARTY_NOTICES.txt')
print(json.dumps({'path':str(site),'bytes':len(html.encode()),'version':version,'published':False}))
