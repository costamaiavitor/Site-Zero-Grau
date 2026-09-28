import { chromium } from '/home/user/Site-Zero-Grau/node_modules/playwright/index.mjs';
import { readFileSync } from 'fs';
import path from 'path';
const BASE='http://127.0.0.1:8099', OUT=process.argv[2], F='/tmp/fontes';
const nav = await chromium.launch();
async function ctx(extra={}){
  const c = await nav.newContext({viewport:{width:1280,height:800}, deviceScaleFactor:1.5, serviceWorkers:'block'});
  await c.route('**://fonts.googleapis.com/**', r=>r.fulfill({contentType:'text/css', body:readFileSync(F+'/google.css','utf8')}));
  await c.route(/f\d+\.woff2$/, r=>r.fulfill({contentType:'font/woff2', body:readFileSync(path.join(F,path.basename(r.request().url())))}));
  await c.route('**://viacep.com.br/**', r=>r.fulfill({contentType:'application/json', body:JSON.stringify({cep:'60160-000',logradouro:'Rua Silva Paulet',bairro:'Meireles',localidade:'Fortaleza',uf:'CE'})}));
  await c.addInitScript(()=>{ window.open=()=>null; });
  if(extra.pix) await c.route(/\/js\/ajustes\.js/, async r=>{ const t=await (await fetch(BASE+'/js/ajustes.js')).text();
    r.fulfill({contentType:'text/javascript', body: t + '\nAJUSTES_PUBLICADOS.pix={chave:"loja@exemplo.com",nome:"ZERO GRAU",cidade:"FORTALEZA"};'}); });
  const p = await c.newPage(); await p.clock.setFixedTime(new Date('2026-09-25T23:30:00Z')); return {c,p};
}
async function entrar(p, doc){
  await p.click('#gateYes'); await p.waitForTimeout(150);
  await p.evaluate(([doc])=>{ const t=JSON.parse(localStorage.getItem('zg-contas')||'{}');
    t['cliente@exemplo.com']={email:'cliente@exemplo.com',nome:'Cliente de Teste',doc,tipo:doc.length>14?'cnpj':'cpf'};
    localStorage.setItem('zg-contas',JSON.stringify(t)); }, [doc]);
  await p.fill('#emailInput','cliente@exemplo.com'); await p.fill('#senhaInput','gelada123');
}
const shot = (p,n)=>p.screenshot({path:`${OUT}/${n}.png`});
let {c,p}=await ctx(); await p.goto(BASE,{waitUntil:'networkidle'});
await p.click('#gateYes'); await p.waitForTimeout(300); await p.fill('#emailInput','cliente@exemplo.com'); await shot(p,'t1-login');
await p.click('#painelEntrar [data-painel="criar"]'); await p.waitForTimeout(300); await shot(p,'t2-criar-conta'); await c.close();
({c,p}=await ctx()); await p.goto(BASE,{waitUntil:'networkidle'}); await entrar(p,'111.444.777-35'); await p.click('#docBtn'); await p.waitForTimeout(500);
await shot(p,'t3-inicio');
await p.click('.app-aba[data-vista="catalogo"]'); await p.waitForTimeout(400); await shot(p,'t4-catalogo'); await c.close();
({c,p}=await ctx({pix:true})); await p.goto(BASE,{waitUntil:'networkidle'}); await entrar(p,'111.444.777-35'); await p.click('#docBtn'); await p.waitForTimeout(400);
await p.click('.app-aba[data-vista="catalogo"]');
await p.evaluate(()=>{ for(let i=0;i<6;i++) document.querySelector('.card:not(.hide) .add:not([disabled])').click(); });
await p.click('#cartBtn'); await p.waitForTimeout(500); await shot(p,'t5-carrinho');
await p.click('#finalizar'); await p.waitForTimeout(300);
await p.fill('#ckCep','60160000'); await p.click('#ckCepBtn'); await p.waitForTimeout(500); await p.fill('#ckNumero','1580');
await shot(p,'t6-fechamento');
await p.click('#ckEnviar'); await p.waitForTimeout(1200); await shot(p,'t7-pix'); await c.close();
({c,p}=await ctx()); await p.goto(BASE+'/atacado.html',{waitUntil:'networkidle'}); await entrar(p,'11.222.333/0001-81'); await p.click('#docBtn'); await p.waitForTimeout(600); await shot(p,'t8-atacado'); await c.close();
({c,p}=await ctx()); await p.goto(BASE+'/admin.html',{waitUntil:'networkidle'}); await p.waitForTimeout(400); await shot(p,'t9-painel'); await c.close();
await nav.close();
