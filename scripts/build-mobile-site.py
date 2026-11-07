"""Prepare a static, self-contained phone version; does not publish anything."""
from pathlib import Path
import hashlib,json,re,shutil
from PIL import Image
root=Path(__file__).resolve().parents[1];site=root/'site';site.mkdir(exist_ok=True)
html=(root/'artifacts/Freekick-Battle.html').read_text()
html,count=re.subn(r'<a href="(?:docs/VIDEOANALYSE\.md|README\.md)">[^<]*</a>','',html)
assert count==3,'Unexpected footer: inspect before creating a public build'
html=html.replace('Video-based reconstruction · Training reference · local AI','Freekick Battle · Draai je telefoon voor een groter speelveld')
startup=(root/'scripts/mobile-startup.js').read_text()
head='<link rel="manifest" href="./manifest.webmanifest"><meta name="theme-color" content="#050505"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="apple-touch-icon" href="./icon192.png">'
head += '<style>#startup-overlay{position:fixed;z-index:99999;left:50%;top:50%;transform:translate(-50%,-50%);width:420px;max-width:90vw;padding:24px;border:1px solid #426183;border-radius:14px;background:#102138;color:#fff;font-family:Arial,sans-serif;box-sizing:border-box}#startup-overlay h1{font-size:24px;margin:0 0 16px}#startup-message{font-size:16px;line-height:1.6}#startup-retry{display:none;min-height:44px;padding:12px 18px;border:0;border-radius:8px;background:#205ed9;color:white;font-size:16px}#startup-details{display:none;margin-top:16px;font-size:12px}#startup-detail{white-space:pre-wrap;overflow-wrap:anywhere;color:#b9cde4}</style><script>'+startup+'</script>'
html=html.replace('</head>',head+'</head>',1)
loader='<aside id="startup-overlay" data-state="loading" role="status"><h1>Freekick Battle</h1><p id="startup-message">Spel wordt geladen…</p><button id="startup-retry">Opnieuw laden</button><details id="startup-details"><summary>Foutdetails</summary><pre id="startup-detail"></pre></details><noscript>Open het spel in Safari of Chrome met JavaScript ingeschakeld.</noscript></aside>'
html=html.replace('<body>','<body>'+loader,1)
registration='<script>if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}</script>'
html=re.sub(r'</body>\s*</html>\s*$',lambda _:registration+'</body></html>',html)
(site/'index.html').write_text(html)
for size in [192,512]:Image.open(root/'public/reference/life.png').convert('RGBA').resize((size,size),Image.Resampling.LANCZOS).save(site/f'icon{size}.png')
manifest={'id':'./','name':'Freekick Battle','short_name':'Freekick','lang':'nl','start_url':'./','scope':'./','display':'standalone','orientation':'landscape','background_color':'#050505','theme_color':'#050505','icons':[{'src':f'./icon{s}.png','sizes':f'{s}x{s}','type':'image/png'}for s in [192,512]]}
(site/'manifest.webmanifest').write_text(json.dumps(manifest,indent=2)+'\n')
version='freekick-'+hashlib.sha256(html.encode()).hexdigest()[:16]
(site/'release.json').write_text(json.dumps({'id':version,'startup':'classic-es2018','mobileLayoutFallbacks':True})+'\n')
worker="""const VERSION=__VERSION__;
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(['./','./manifest.webmanifest','./icon192.png','./icon512.png','./release.json'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('freekick-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).then(async response=>{if(response.ok){try{const cache=await caches.open(VERSION);await cache.put('./',response.clone());}catch{}}return response;}).catch(()=>caches.match('./')));return;}
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
});
""".replace('__VERSION__',json.dumps(version))
(site/'sw.js').write_text(worker)
shutil.copyfile(root/'docs/THIRD_PARTY_NOTICES.txt',site/'THIRD_PARTY_NOTICES.txt')
print(json.dumps({'path':str(site),'bytes':len(html.encode()),'version':version,'published':False}))
