import{readFile}from'node:fs/promises';import{setTimeout as delay}from'node:timers/promises';
const expected=JSON.parse(await readFile('site/release.json','utf8')).id,base='https://mirandusen2-code.github.io/freekickbattle/';
for(let i=0;i<90;i++){try{const response=await fetch(base+'release.json?v='+encodeURIComponent(expected),{cache:'no-store'});if(response.ok&&(await response.json()).id===expected){console.log('Published mobile release available:',expected);process.exit(0);}}catch{}await delay(2000);}
throw new Error('The expected mobile release did not appear on GitHub Pages within three minutes.');
