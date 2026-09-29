/* Capturas extras do protótipo para os slides e a seção 6: todas as vistas do
   varejo, o atacado com pedido montado, cada aba do painel e o site no celular.
   Uso: site servido em 127.0.0.1:8099 (ZeroGrau/) e node telas2.mjs ../imagens */
import { chromium } from '/home/user/Site-Zero-Grau/node_modules/playwright/index.mjs';
import { readFileSync } from 'fs';
import path from 'path';
const BASE='http://127.0.0.1:8099', OUT=process.argv[2], F='/tmp/fontes';
const nav = await chromium.launch();
const LONGE={cep:'62010-000',logradouro:'Rua Coronel Joaquim Ribeiro',bairro:'Centro',localidade:'Sobral',uf:'CE'};
const PERTO={cep:'60160-000',logradouro:'Rua Silva Paulet',bairro:'Meireles',localidade:'Fortaleza',uf:'CE'};
async function ctx({cel=false,pix=false,cep=PERTO}={}){
  const c = await nav.newContext(cel?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'}
                                   :{viewport:{width:1280,height:800},deviceScaleFactor:1.5,serviceWorkers:'block'});
  await c.route('**://fonts.googleapis.com/**', r=>r.fulfill({contentType:'text/css', body:readFileSync(F+'/google.css','utf8')}));
  await c.route(/f\d+\.woff2$/, r=>r.fulfill({contentType:'font/woff2', body:readFileSync(path.join(F,path.basename(r.request().url())))}));
  await c.route('**://viacep.com.br/**', r=>r.fulfill({contentType:'application/json', body:JSON.stringify(cep)}));
  await c.addInitScript(()=>{ window.open=()=>null; });
  if(pix) await c.route(/\/js\/ajustes\.js/, async r=>{ const t=await (await fetch(BASE+'/js/ajustes.js')).text();
    r.fulfill({contentType:'text/javascript', body: t + '\nAJUSTES_PUBLICADOS.pix={chave:"loja@exemplo.com",nome:"ZERO GRAU",cidade:"FORTALEZA"};'}); });
  const p = await c.newPage(); await p.clock.setFixedTime(new Date('2026-09-25T23:30:00Z')); return {c,p};
}
async function entrar(p, doc){
  await p.click('#gateYes'); await p.waitForTimeout(150);
  await p.evaluate(([doc])=>{ const t=JSON.parse(localStorage.getItem('zg-contas')||'{}');
    t['cliente@exemplo.com']={email:'cliente@exemplo.com',nome:'Cliente de Teste',doc,tipo:doc.length>14?'cnpj':'cpf'};
    localStorage.setItem('zg-contas',JSON.stringify(t)); }, [doc]);
  await p.fill('#emailInput','cliente@exemplo.com'); await p.fill('#senhaInput','gelada123');
  await p.click('#docBtn'); await p.waitForTimeout(500);
}
const CPF='111.444.777-35', CNPJ='11.222.333/0001-81';
const shot=(p,n)=>p.screenshot({path:`${OUT}/${n}.png`});
const vista=async(p,v)=>{ await p.click(`.app-aba[data-vista="${v}"]`); await p.waitForTimeout(400); };
const encher=async(p,n=6)=>p.evaluate(n=>{ for(let i=0;i<n;i++) document.querySelector('.card:not(.hide) .add:not([disabled])').click(); },n);

/* ---- varejo ---- */
let {c,p}=await ctx(); await p.goto(BASE,{waitUntil:'networkidle'}); await p.waitForTimeout(400);
await shot(p,'v01-idade');
await entrar(p,CPF);
await vista(p,'catalogo'); await p.click('.tab[data-cat="destilado"]'); await p.waitForTimeout(400); await shot(p,'v02-categoria');
await p.click('.tab[data-cat="all"]'); await p.fill('#buscaInput','gin'); await p.waitForTimeout(500); await shot(p,'v03-busca');
await p.fill('#buscaInput',''); 
await vista(p,'pedir'); await shot(p,'v04-como-pedir');
await vista(p,'cupom'); await shot(p,'v05-cupom');
await vista(p,'entrega'); await shot(p,'v06-entrega');
/* pedido pelo WhatsApp, pago em dinheiro na entrega */
await vista(p,'catalogo'); await encher(p);
await p.click('#cartBtn'); await p.waitForTimeout(400); await p.click('#finalizar'); await p.waitForTimeout(300);
await p.fill('#ckCep','60160000'); await p.click('#ckCepBtn'); await p.waitForTimeout(500);
await p.fill('#ckNumero','1580'); await p.check('input[name="forma"][value="dinheiro"]'); await p.fill('#ckTroco','100');
await p.waitForTimeout(200); await shot(p,'v07-pagamento-entrega');
await p.click('#ckEnviar'); await p.waitForTimeout(700); await shot(p,'v08-pedido-enviado');
await p.click('#feitoFechar'); await p.click('#cartBtn'); await p.waitForTimeout(500); await shot(p,'v09-pedir-de-novo');
await c.close();
/* fora do raio: retirada no balcão */
({c,p}=await ctx({cep:LONGE})); await p.goto(BASE,{waitUntil:'networkidle'}); await entrar(p,CPF); await vista(p,'catalogo'); await encher(p);
await p.click('#cartBtn'); await p.waitForTimeout(400); await p.click('#finalizar'); await p.waitForTimeout(300);
await p.fill('#ckCep','62010000'); await p.click('#ckCepBtn'); await p.waitForTimeout(600); await shot(p,'v10-retirada'); await c.close();

/* ---- atacado ---- */
({c,p}=await ctx()); await p.goto(BASE+'/atacado.html',{waitUntil:'networkidle'}); await entrar(p,CNPJ);
await p.evaluate(()=>{ const bs=[...document.querySelectorAll('#linhas .item:not(.esgotado) [data-acao="mais"]')];
  [6,4,3,2].forEach((n,i)=>{ for(let k=0;k<n;k++) bs[i].click(); }); });
await p.waitForTimeout(400); await shot(p,'a01-atacado-pedido');
await p.click('.tab[data-cat="destilado"]'); await p.waitForTimeout(400); await shot(p,'a02-atacado-categoria'); await c.close();

/* ---- painel ---- */
({c,p}=await ctx()); await p.goto(BASE+'/admin.html',{waitUntil:'networkidle'}); await p.waitForTimeout(400);
await p.fill('#linhasProdutos tr[data-sku="estrella-galicia-330"] [data-campo="preco"]','9,90');
await p.fill('#linhasProdutos tr[data-sku="estrella-galicia-330"] [data-campo="promo"]','7,50');
await p.waitForTimeout(500); await shot(p,'p01-painel-edicao');
for(const [aba,n] of [['varejo','p02-painel-varejo'],['atacado','p03-painel-atacado'],['loja','p04-painel-loja'],['publicacao','p05-painel-publicacao']]){
  await p.click('#t-'+aba); await p.waitForTimeout(500); await shot(p,n); }
/* a loja no mesmo navegador mostra o rascunho, com o aviso de prévia */
const q=await c.newPage(); await q.clock.setFixedTime(new Date('2026-09-25T23:30:00Z'));
await q.goto(BASE,{waitUntil:'networkidle'}); await entrar(q,CPF); await q.click('.app-aba[data-vista="catalogo"]'); await q.waitForTimeout(500); await shot(q,'p06-previa-loja');
await c.close();

/* ---- celular ---- */
({c,p}=await ctx({cel:true})); await p.goto(BASE,{waitUntil:'networkidle'}); await entrar(p,CPF); await shot(p,'m01-inicio');
await vista(p,'catalogo'); await shot(p,'m02-catalogo');
await encher(p,4); await p.click('#cartBtn'); await p.waitForTimeout(500); await shot(p,'m03-carrinho'); await c.close();
({c,p}=await ctx({cel:true})); await p.goto(BASE+'/atacado.html',{waitUntil:'networkidle'}); await entrar(p,CNPJ); await shot(p,'m04-atacado'); await c.close();
await nav.close(); console.log('ok');
