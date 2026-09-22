/* ==========================================================================
   ZERO GRAU · teste de fumaça

   Sobe o site num servidor estático local e passa o Chromium por ele. Cobre o
   que já quebrou alguma vez: busca com acento, entrega fora do raio, o aviso
   de idade travando a página sem JavaScript, manchete estourando a coluna,
   números de catálogo divergindo do estoque, o aviso de rodapé aparecendo
   quando devia estar escondido e o pingue-pongue entre as duas lojas.

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
const LARGURAS = [320, 390, 600, 900, 1024, 1280, 1440, 1600, 1920];

/* Documentos de teste com dígito verificador correto. Não pertencem a
   ninguém: são os exemplos que todo mundo usa para exercitar o algoritmo. */
const CPF  = '11144477735';
const CNPJ = '11222333000181';

/* Os dois slogans que o sorteio pode trazer. O teste força os dois em vez de
   aceitar o da vez: medir só o sorteado escondia falha de layout em metade
   das rodadas — foi exatamente assim que uma passou na branch e falhou na
   main, no mesmo commit. */
const SLOGANS = [
  ['Sexta à noite não é', 'hora de encarar',    'fila de mercado'],
  ['O rolê não para',     'só porque a gelada', 'acabou']
];

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

/* A porta são duas perguntas: idade e documento. Quase todo teste começa
   passando por ela, então passa por aqui. */
async function entrar(p, doc = CPF){
  await p.click('#gateYes');
  await p.waitForTimeout(120);
  await p.fill('#docInput', doc);
  await p.click('#docBtn');
  await p.waitForTimeout(250);
}

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

  await entrar(p);
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
  await entrar(p);

  const n = await p.$$eval('.card', e => e.length);
  const anunciado = await p.$eval('[data-total="itens"]', e => +e.textContent);
  ok('o total anunciado é o número de cards', anunciado === n, `${anunciado} ≠ ${n}`);

    /* cada aba tem de mostrar exatamente os cards daquela categoria, e as abas
     juntas têm de cobrir o catálogo inteiro — nenhum item órfão de aba */
  const cats = await p.$$eval('.tab', e => e.map(x => x.dataset.cat).filter(c => c !== 'all'));
  ok('nenhuma aba repete a categoria', new Set(cats).size === cats.length);
  let somaAbas = 0;
  for(const cat of cats){
    await p.click(`.tab[data-cat="${cat}"]`);
    await p.waitForTimeout(120);
    const visiveis = (await p.$$('.card:not(.hide)')).length;
    const noEstoque = await p.$$eval(`.card[data-cat="${cat}"]`, e => e.length);
    somaAbas += visiveis;
    ok(`"${cat}": a aba mostra os ${noEstoque} do estoque`, visiveis === noEstoque, `${visiveis} ≠ ${noEstoque}`);
  }
  ok('as abas cobrem o catálogo inteiro', somaAbas === n, `${somaAbas} ≠ ${n}`);
  await p.click('.tab[data-cat="all"]');
  await ctx.close();
}

/* ====================================================================== */
secao('Busca');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  await entrar(p);
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
  await entrar(p);

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
  await entrar(p);
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
  await p.waitForTimeout(150);
  ok('e some ao confirmar', await p.$eval('#gate', e => getComputedStyle(e).display === 'none'));
  ok('a porta assume em seguida', await p.$eval('#porta', e => getComputedStyle(e).display !== 'none'));

  await p.fill('#docInput', CPF);
  await p.click('#docBtn');
  await p.waitForTimeout(250);
  ok('a porta fecha com CPF válido', await p.$eval('#porta', e => getComputedStyle(e).display === 'none'));

  await p.reload({ waitUntil:'networkidle' });
  await p.waitForTimeout(250);
  ok('não volta a perguntar na mesma aba', await p.$eval('#gate', e => getComputedStyle(e).display === 'none'));
  ok('nem pede o documento de novo', await p.$eval('#porta', e => getComputedStyle(e).display === 'none'));
  await ctx.close();
}

/* ====================================================================== */
secao('Sem JavaScript o site continua utilizável');
{
  const ctx = await contexto({ js:false });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  ok('o aviso de idade não tranca a página', await p.$eval('#gate', e => getComputedStyle(e).display === 'none'));
  ok('a identificação também não tranca', await p.$eval('#porta', e => getComputedStyle(e).display === 'none'));
  ok('o catálogo continua alcançável', await p.$eval('#grid', e => !!e));
  ok('a manchete tem texto', (await p.$eval('.manchete', e => e.textContent.trim())).length > 0);
  /* sem script não há abas para trocar de vista: as quatro têm de estar
     visíveis e empilhadas, senão três quartos do site somem para quem não tem
     JavaScript — e para o buscador */
  const vistas = await p.$$eval('.vista', e => e.map(v => getComputedStyle(v).display !== 'none'));
  ok('as quatro vistas ficam à mostra', vistas.length === 4 && vistas.every(Boolean), vistas.join(','));
  await ctx.close();
}

/* ====================================================================== */
secao('A porta separa as duas lojas');
{
  const ctx = await contexto();

  /* CPF fica no varejo */
  const p1 = await ctx.newPage();
  await p1.goto(BASE, { waitUntil:'networkidle' });
  await entrar(p1, CPF);
  ok('CPF entra na vitrine de varejo', new URL(p1.url()).pathname.endsWith('index.html') || new URL(p1.url()).pathname === '/');
  ok('e a vitrine tem cards', (await p1.$$('.card')).length > 0);

  /* número mal formado é recusado antes de qualquer navegação */
  const p2 = await ctx.newPage();
  await p2.goto(BASE, { waitUntil:'networkidle' });
  await p2.click('#gateYes');
  await p2.waitForTimeout(120);
  await p2.fill('#docInput', '11144477736');      /* último dígito trocado */
  await p2.click('#docBtn');
  await p2.waitForTimeout(200);
  ok('CPF com dígito errado é recusado', /dígito verificador/i.test(await p2.textContent('#docMsg')));
  ok('e a porta continua aberta', await p2.$eval('#porta', e => getComputedStyle(e).display !== 'none'));

  await p2.fill('#docInput', '11111111111');
  await p2.click('#docBtn');
  await p2.waitForTimeout(200);
  ok('repetido (111...) não passa', await p2.$eval('#porta', e => getComputedStyle(e).display !== 'none'));

  /* CNPJ atravessa para o atacado */
  const p3 = await ctx.newPage();
  await p3.goto(BASE, { waitUntil:'networkidle' });
  await entrar(p3, CNPJ);
  await p3.waitForTimeout(400);
  ok('CNPJ é levado ao atacado', new URL(p3.url()).pathname.endsWith('atacado.html'), p3.url());
  ok('o CNPJ aparece no topo do balcão', /11\.222\.333\/0001-81/.test(await p3.textContent('[data-doc]')));

  /* ida e volta entre as lojas não pode virar pingue-pongue */
  await p3.click('.bal-varejo');
  await p3.waitForTimeout(600);
  ok('do atacado dá para ver o varejo', new URL(p3.url()).pathname.endsWith('index.html'), p3.url());
  ok('e o varejo não devolve para o atacado', await p3.$eval('#porta', e => getComputedStyle(e).display === 'none'));

  await p3.click('.app-pe a[data-loja="atacado"]');
  await p3.waitForTimeout(600);
  ok('e o caminho de volta funciona', new URL(p3.url()).pathname.endsWith('atacado.html'), p3.url());

  /* quem tem CPF não entra no balcão sem trocar de documento */
  const p4 = await ctx.newPage();
  await p4.goto(BASE, { waitUntil:'networkidle' });
  await entrar(p4, CPF);
  await p4.click('.app-pe a[data-loja="atacado"]');
  await p4.waitForTimeout(600);
  ok('CPF no atacado esbarra na porta', /CNPJ/.test(await p4.textContent('#docMsg')), await p4.textContent('#docMsg'));
  await ctx.close();
}

/* ====================================================================== */
secao('Balcão de atacado');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  p.on('console', m => { if(m.type() === 'error' && !externo(m.text())) erros.push(m.text()); });

  await p.goto(BASE + '/atacado.html', { waitUntil:'networkidle' });
  await entrar(p, CNPJ);
  ok('sem erro de console no balcão', erros.length === 0, erros[0]);

  const linhas = await p.$$eval('#linhas .item', e => e.length);
  const cards  = await p.$eval('[data-total="itens"]', e => +e.textContent);
  ok('a tabela lista o catálogo inteiro', linhas === cards, `${linhas} ≠ ${cards}`);

  /* o preço de atacado tem de ser menor que o de varejo, sempre */
  const comparado = await p.evaluate(() =>
    BEBIDAS.every(b => precoAtacado(b) < b.preco));
  ok('a unidade no atacado sai abaixo do preço cheio', comparado);

  /* e a venda é por caixa: o estoque em caixas nunca passa o de unidades */
  const caixasOk = await p.evaluate(() =>
    BEBIDAS.every(b => caixasDe(b) * caixaDe(b) <= b.estoque));
  ok('o estoque em caixas cabe no estoque em unidades', caixasOk);

  /* pedido abaixo do mínimo não fecha */
  await p.click('#linhas .item:not(.esgotado) [data-acao="mais"]');
  await p.waitForTimeout(150);
  ok('uma caixa só não atinge o pedido mínimo', await p.$eval('#enviar', e => e.disabled));
  ok('e o aviso diz quanto falta', /pedido mínimo/i.test(await p.textContent('#pedidoAviso')));

  await p.evaluate(() => {
    const b = document.querySelector('#linhas .item:not(.esgotado) [data-acao="mais"]');
    for(let i = 0; i < 4; i++) b.click();
  });
  await p.waitForTimeout(200);
  const caixas = +(await p.textContent('#rCaixas'));
  ok('a contagem de caixas acompanha', caixas === 5, String(caixas));

  /* nenhuma quantidade pode passar do estoque */
  await p.evaluate(() => {
    const b = document.querySelector('#linhas .item:not(.esgotado) [data-acao="mais"]');
    for(let i = 0; i < 200; i++) b.click();
  });
  await p.waitForTimeout(250);
  const passou = await p.evaluate(() => {
    const tr = document.querySelector('#linhas .item:not(.esgotado)');
    const b  = BEBIDAS.find(x => x.sku === tr.dataset.sku);
    return +tr.querySelector('[data-qtd]').textContent <= caixasDe(b);
  });
  ok('a quantidade trava no estoque em caixas', passou);

  /* item esgotado não aceita clique */
  const esgotadoTravado = await p.$eval('#linhas .item.esgotado [data-acao="mais"]', e => e.disabled).catch(() => true);
  ok('item esgotado não entra no pedido', esgotadoTravado);
  await ctx.close();
}

/* ====================================================================== */
secao('Layout do balcão em todas as larguras');
for(const largura of LARGURAS){
  const ctx = await contexto({ largura });
  const p = await ctx.newPage();
  await p.goto(BASE + '/atacado.html', { waitUntil:'networkidle' });
  await entrar(p, CNPJ);
  await p.waitForTimeout(200);
  const m = await p.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    alto:   document.documentElement.scrollHeight,
    tela:   innerHeight
  }));
  ok(`balcão ${largura}px: sem barra horizontal`, m.scroll <= m.client + 1, `${m.scroll} > ${m.client}`);
  ok(`balcão ${largura}px: a página não rola`, m.alto <= m.tela + 1, `${m.alto} > ${m.tela}`);
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
    if(js) await entrar(p);
    await p.waitForTimeout(250);

    const medir = async slogan => p.evaluate(s => {
      /* com JS, força o slogan e remede; sem JS, sobra a reserva do CSS */
      if(s && typeof ajustarManchete === 'function'){
        document.querySelectorAll('.manchete span').forEach((el,i) => el.textContent = s[i]);
        ajustarManchete();
      }
      const col = document.querySelector('.manchete');
      const cs = getComputedStyle(col);
      const util = col.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const larguras = [...document.querySelectorAll('.manchete span')].map(el => {
        const rg = document.createRange(); rg.selectNodeContents(el);
        return rg.getBoundingClientRect().width;
      });
      return { util, larguras,
               scroll: document.documentElement.scrollWidth,
               client: document.documentElement.clientWidth,
               alto:  document.documentElement.scrollHeight,
               tela:  innerHeight };
    }, slogan);

    const sufixo = `${largura}px ${js ? 'com' : 'sem'} JS`;
    const base = await medir(null);
    ok(`${sufixo}: sem barra horizontal`, base.scroll <= base.client + 1, `${base.scroll} > ${base.client}`);
    /* o ponto da casca de uma tela: com script, a página não rola */
    if(js) ok(`${sufixo}: a página não rola`, base.alto <= base.tela + 1, `${base.alto} > ${base.tela}`);

    for(const slogan of (js ? SLOGANS : [null])){
      const r = await medir(slogan);
      const nome = js ? `${sufixo}: manchete "${slogan[0]}…" cabe` : `${sufixo}: manchete cabe`;
      ok(nome, r.larguras.every(w => w <= r.util + 1),
         `${Math.max(...r.larguras).toFixed(1)}px em ${r.util.toFixed(0)}px`);
    }
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
