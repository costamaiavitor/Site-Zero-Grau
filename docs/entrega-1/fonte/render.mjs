import { chromium } from '/home/user/Site-Zero-Grau/node_modules/playwright/index.mjs';
import { readFileSync } from 'fs'; import path from 'path';
const [,,dir,...nomes]=process.argv, F='/tmp/fontes';
const nav=await chromium.launch(); const c=await nav.newContext({deviceScaleFactor:2,viewport:{width:1900,height:1400}});
await c.route('**://fonts.googleapis.com/**', r=>r.fulfill({contentType:'text/css', body:readFileSync(F+'/google.css','utf8')}));
await c.route(/f\d+\.woff2$/, r=>r.fulfill({contentType:'font/woff2', body:readFileSync(path.join(F,path.basename(r.request().url())))}));
const p=await c.newPage();
for(const n of nomes){ await p.goto((n==='er'||n==='arq'?'http://127.0.0.1:8098/'+n+'.html':'file://'+dir+'/'+n+'.html')); await p.waitForSelector('body[data-pronto]'); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(200);
  await (await p.$('#cv')).screenshot({path:dir+'/../../imagens/'+n+'.png'}); console.log(n); }
await nav.close();
