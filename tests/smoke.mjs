/* ==========================================================================
   ZERO GRAU · teste de fumaça
//
   Sobe o site num servidor estático local e passa o Chromium por ele. Cobre o
   que já quebrou alguma vez: busca com acento, entrega fora do raio, o aviso
   de idade travando a página sem JavaScript, manchete estourando a coluna e
   números de catálogo divergindo do estoque.

   Uso:  node tests/smoke.mjs
   Fontes: em rede aberta vêm do Google. Sem rede, aponte FONTES_DIR para uma
   pasta com google.css e os .woff2 e o teste serve dali.
   ========================================================================== */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ    = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'ZeroGrau');
const FONTES  = process.env.FONTES_DIR || '';
const LARGURAS = [320, 390, 600, 900, 1280, 1600];

const TIPOS = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.webp':'image/webp', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.md':'text/markdown; charset=utf-8'
};

/* ---------- servidor estático mínimo, sem dependência ---------- */
const servidor = createServer(async (req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const arq = path.join(RAIZ, rel);
  if(!arq.startsWith(RAIZ)){ res.writeHead(403).end(); return; }
  try{
    await stat(arq);
    res.writeHead(200, {'content-type': TIPOS[path.extname(arq)] || 'application/octet-stream'});
    res.end(await readFile(arq));
  }catch{ res.writeHead(404).end('nao encontrado'); }
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;

/* ---------- placar ---------- */
const falhas = [];
let passou = 0;
const ok = (nome, cond, detalhe = '') => {
  if(cond){ passou++; console.log(`  ✓ ${nome}`); }
  else { falhas.push(`${nome}${detalhe ? ' — ' + detalhe : ''}`); console.log(`  ✗ ${nome}${detalhe ? ' — ' + detalhe : ''}`); }
};
const secao = t => console.log(`\n${t}`);

const navegador = await chromium.launch();

async function contexto({ js = true, largura = 1280 } = {}){
  const ctx = await navegador.newContext({ viewport:{ width:largura, height:900 }, javaScriptEnabled:js });
  if(FONTES && existsSync(path.join(FONTES,'google.css'))){
    await ctx.route('**://fonts.googleapis.com/**', r =>
      r.fulfill({ contentType:'text/css', body:readFileSync(path.join(FONTES,'google.css'),'utf8') }));
    await ctx.route(/f\d+\.woff2$/, r =>
      r.fulfill({ contentType:'font/woff2', body:readFileSync(path.join(FONTES, path.basename(r.request().url()))) }));
    await ctx.route('**://fonts.gstatic.com/**', r => r.abort());
  }
  return ctx;
}

/* ruído externo (Google Fonts atrás de proxy) não é falha do site */
const externo = t => /fonts\.(googleapis|gstatic)\.com|ERR_CERT_AUTHORITY_INVALID/.test(t);

/* ====================================================================== */
secao('Carga limpa');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  const erros = [], quebrados = [];
  p.on('console', m => { if(m.type() === 'error' && !externo(m.text())) erros.push(m.text()); });
  p.on('pageerror', e => erros.push('pageerror: ' + e.message));
  p.on('response', r => { if(r.status() === 404) quebrados.push(r.url()); });

  await p.goto(BASE, { waitUntil:'networkidle' });
  ok('sem erro de console', erros.length === 0, erros[0]);
  ok('sem recurso 404', quebrados.length === 0, quebrados[0]);

  await p.click('#gateYes');
  const fotos = await p.$$eval('.card-art.com-foto', e => e.length);
  const cards = await p.$$eval('.card', e => e.length);
  ok(`as ${cards} fotos de produto carregam`, fotos === cards, `${fotos}/${cards}`);
  await ctx.close();
}

/* ====================================================================== */
secao('Números do catálogo saem do estoque');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  await p.click('#gateYes');

  const n = await p.$$eval('.card', e => e.length);
  const anunciado = await p.$eval('[data-total="itens"]', e => +e.textContent);
  ok('o total anunciado é o número de cards', anunciado === n, `${anunciado} ≠ ${n}`);

  const soma = await p.$$eval('[data-conta]', e => e.reduce((t,x) => t + parseInt(x.textContent,10), 0));
  ok('as contagens por categoria somam o catálogo', soma === n, `${soma} ≠ ${n}`);

  /* cada card de categoria tem de levar a uma aba que existe e traz aquele número */
  const cats = await p.$$eval('.cat', e => e.map(x => x.dataset.ir));
  ok('nenhum card de categoria repete o destino', new Set(cats).size === cats.length);
  for(const cat of cats){
    const aba = await p.$(`.tab[data-cat="${cat}"]`);
    if(!aba){ ok(`aba existe para "${cat}"`, false); continue; }
    await aba.click();
    await p.waitForTimeout(120);
    const visiveis = (await p.$$('.card:not(.hide)')).length;
    const diz = +(await p.$eval(`[data-conta="${cat}"]`, e => parseInt(e.textContent,10)));
    ok(`"${cat}": o card promete ${diz} e a aba mostra ${visiveis}`, visiveis === diz);
  }
  await ctx.close();
}

/* ====================================================================== */
secao('Busca');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  await p.click('#gateYes');
  const buscar = async t => {
    await p.fill('#buscaInput', t);
    await p.waitForTimeout(220);
    return (await p.$$('.card:not(.hide)')).length;
  };
  ok('"água" encontra a água mineral',  await buscar('água')  > 0);
  ok('"agua" sem acento encontra também', await buscar('agua') > 0);
  ok('"AGUA" em caixa alta também',     await buscar('AGUA')  > 0);
  ok('"gin" encontra os gins',          await buscar('gin')   === 3);
  ok('"gin" não traz "Original"',       await buscar('gin')   === 3);
  ok('termo inexistente não traz nada', await buscar('zzzz')  === 0);
  ok('aviso de vazio aparece',          await p.$eval('#semResultado', e => !e.hidden));
  await ctx.close();
}

/* ====================================================================== */
secao('Carrinho');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  await p.click('#gateYes');

  await p.evaluate(() => document.querySelector('.card:not(.hide) .add').click());
  await p.click('#cartBtn');
  await p.waitForTimeout(400);
  ok('item entra no carrinho', (await p.$$('.cart-item')).length === 1);

  await p.click('.cart-item [data-acao="mais"]');
  await p.waitForTimeout(150);
  ok('quantidade sobe', (await p.$eval('.cart-item .qtd span', e => e.textContent)) === '2');

  await p.click('.cart-item .tirar');
  await p.waitForTimeout(200);
  ok('botão de remover esvazia a linha', (await p.$$('.cart-item')).length === 0);
  ok('estado vazio reaparece', await p.$eval('#cartVazio', e => !e.hidden));

  /* cupom abaixo do mínimo é recusado, acima é aceito */
  await p.click('#cartClose');
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('.card:not(.hide) .add').click());
  await p.click('#cartBtn');
  await p.waitForTimeout(300);
  await p.fill('#cupomInput', 'PRIMEIRAGELADA');
  await p.click('#cupomBtn');
  ok('cupom abaixo do mínimo é recusado', /a partir de/.test(await p.textContent('#cupomMsg')));

  await p.evaluate(() => { for(let i=0;i<9;i++) document.querySelector('.card:not(.hide) .add').click(); });
  await p.click('#cupomBtn');
  await p.waitForTimeout(150);
  ok('cupom acima do mínimo é aceito', /aplicado/.test(await p.textContent('#cupomMsg')));
  ok('desconto aparece no resumo', await p.$eval('#linhaDesconto', e => !e.hidden));
  await ctx.close();
}

/* ====================================================================== */
secao('CEP e entrega');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  await p.click('#gateYes');
  /* acima do pedido mínimo de propósito: abaixo dele o aviso do carrinho fala
     do mínimo, que é a informação certa a dar primeiro — e não da entrega */
  await p.evaluate(() => { for(let i=0;i<6;i++) document.querySelector('.card:not(.hide) .add').click(); });

  const calcular = async cep => {
    await p.fill('#cepInput', cep);
    await p.click('#cepBtn');
    await p.waitForTimeout(200);
    return p.textContent('#rEntrega');
  };

  ok('CEP curto é recusado', /8 dígitos/.test(
    await (async () => { await p.fill('#cepInput','123'); await p.click('#cepBtn'); return p.textContent('#cepMsg'); })()));

  const dentro = await calcular('60000030');   /* 030 → 3,0 km */
  ok('dentro do raio cobra taxa', /^R\$/.test(dentro.trim()), dentro);

  /* 128 → 12,8 km, além dos 12 km de raio: é retirada no balcão, não frete grátis */
  const fora = await calcular('60000128');
  ok('fora do raio NÃO diz "grátis"', !/grátis/i.test(fora), fora);
  ok('fora do raio diz retirar no balcão', /balcão/i.test(fora), fora);
  ok('o aviso do carrinho explica a retirada', /balcão/i.test(await p.textContent('#cartAviso')));
  await ctx.close();
}

/* ====================================================================== */
secao('Aviso de idade');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  ok('o aviso aparece na primeira visita', await p.$eval('#gate', e => getComputedStyle(e).display !== 'none'));
  await p.click('#gateYes');
  ok('e some ao confirmar', await p.$eval('#gate', e => getComputedStyle(e).display === 'none'));

  await p.reload({ waitUntil:'networkidle' });
  ok('não volta a perguntar na mesma aba', await p.$eval('#gate', e => getComputedStyle(e).display === 'none'));
  await ctx.close();
}

/* ====================================================================== */
secao('Sem JavaScript o site continua utilizável');
{
  const ctx = await contexto({ js:false });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  ok('o aviso de idade não tranca a página', await p.$eval('#gate', e => getComputedStyle(e).display === 'none'));
  ok('o catálogo continua alcançável', await p.$eval('#catalogo', e => !!e));
  ok('a manchete tem texto', (await p.$eval('.hero-title', e => e.textContent.trim())).length > 0);
  await ctx.close();
}

/* ====================================================================== */
secao('Layout em todas as larguras');
for(const largura of LARGURAS){
  for(const js of [true, false]){
    const ctx = await contexto({ js, largura });
    const p = await ctx.newPage();
    await p.goto(BASE, { waitUntil:'networkidle' });
    await p.evaluate(() => document.fonts.ready).catch(() => {});
    if(js) await p.click('#gateYes');
    await p.waitForTimeout(250);

    const r = await p.evaluate(() => {
      const col = document.querySelector('.hero .wrap');
      const cs = getComputedStyle(col);
      const util = col.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const larguras = [...document.querySelectorAll('.hero-title span')].map(el => {
        const rg = document.createRange(); rg.selectNodeContents(el);
        return rg.getBoundingClientRect().width;
      });
      return { util, larguras,
               scroll: document.documentElement.scrollWidth,
               client: document.documentElement.clientWidth };
    });
    const sufixo = `${largura}px ${js ? 'com' : 'sem'} JS`;
    ok(`${sufixo}: sem barra horizontal`, r.scroll <= r.client + 1, `${r.scroll} > ${r.client}`);
    ok(`${sufixo}: manchete dentro da coluna`, r.larguras.every(w => w <= r.util + 1),
       `${Math.max(...r.larguras).toFixed(0)}px em ${r.util.toFixed(0)}px`);
    await ctx.close();
  }
}

/* ====================================================================== */
await navegador.close();
servidor.close();

console.log(`\n${'─'.repeat(52)}`);
if(falhas.length){
  console.log(`${passou} passaram · ${falhas.length} falharam\n`);
  falhas.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log(`${passou} verificações, todas passaram`);
