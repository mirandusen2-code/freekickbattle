import{build}from'vite';import{readFile,writeFile,mkdir,readdir,rm}from'node:fs/promises';import{resolve,join}from'node:path';
const root=resolve(import.meta.dirname,'..'),out=join(root,'artifacts'),temp=join(out,'.standalone-build');await mkdir(out,{recursive:true});
await build({configFile:false,root,base:'./',build:{outDir:temp,emptyOutDir:true,assetsInlineLimit:Infinity,cssCodeSplit:false,target:'es2018',cssTarget:'safari13',rollupOptions:{input:join(root,'index.html'),output:{format:'iife',inlineDynamicImports:true}}}});
let html=await readFile(join(temp,'index.html'),'utf8');const assets=await readdir(join(temp,'assets'));let js=await readFile(join(temp,'assets',assets.find(n=>n.endsWith('.js'))),'utf8'),css=await readFile(join(temp,'assets',assets.find(n=>n.endsWith('.css'))),'utf8');
// Keep readable fallbacks for iPhones without container query units or dvh.
css=css.replace(/([-\w]+):([^;{}]+)(;|(?=}))/g,(match,key,value)=>{if(!/cqw|dvh/.test(value))return match;const fallback=value.replace(/(-?(?:\d*\.)?\d+)cqw/g,(_,n)=>`calc(var(--battle-unit, 1vw) * ${n})`).replace(/dvh/g,'vh');return `${key}:${fallback};${match}`;});
const embedded={};
for(const name of await readdir(join(root,'public/reference'))){const mime=name.endsWith('.png')?'image/png':'image/jpeg',uri='data:'+mime+';base64,'+(await readFile(join(root,'public/reference',name))).toString('base64');embedded[name.replace(/\.[^.]+$/,'')]=uri;const path='/reference/'+name;js=js.split(path).join(uri);css=css.split(path).join(uri);}
// The life indicators use a template expression instead of a literal resource URL.
js=js.replace(/\/reference\/\$\{([^}]+)\}\.png/g,(_,expression)=>'${('+JSON.stringify({life:embedded.life,miss:embedded.miss})+')['+expression+']}');
if(js.includes('/reference/'))throw new Error('Niet-ingebedde referentie in standalone game');
js=js.replace('href="/review.html"','href="docs/VIDEOANALYSE.md"').replace('href="/reference.html"','href="docs/VIDEOANALYSE.md"').replace('href="/lab.html"','href="README.md"');
html=html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/,'').replace(/<link[^>]*rel="stylesheet"[^>]*>/,'').replace(/<link[^>]*rel="modulepreload"[^>]*>/g,'').replace('</head>',()=>`<style>${css}</style></head>`).replace('</body>',()=>`<script id="game-code">${js.replaceAll('</script','<\\/script')};if(window.__freekickBoot){window.__freekickBoot.ready();}</script></body>`);
await writeFile(join(out,'Freekick-Battle.html'),html);await rm(temp,{recursive:true,force:true});
console.log('Zelfstandige game:',join(out,'Freekick-Battle.html'),Buffer.byteLength(html),'bytes.');
