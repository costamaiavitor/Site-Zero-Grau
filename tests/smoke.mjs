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

/* Inventados, com a contagem certa e o dígito errado. Hoje a porta aceita os
   dois, porque CONFERE_DIGITO está desligada em js/porta.js. */
const CPF_QUALQUER  = '12345678900';
const CNPJ_QUALQUER = '12345678000100';

/* Conta de teste para o login. Não há servidor: a porta só confere o formato. */
const EMAIL = 'cliente@exemplo.com';
const SENHA = 'gelada123';

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
  '.png':'image/png', '.jpg':'image/jpeg', '.md':'text/markdown; charset=utf-8',
  '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8'
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

/* Os testes de comportamento rodam sobre o catálogo BASE de js/dados.js, com
   o js/ajustes.js publicado neutralizado. O painel muda cupom, raio e preço
   quando o dono quiser, e o teste de "cupom abaixo do mínimo" não pode quebrar
   porque o cupom mudou de nome. O arquivo publicado tem seção própria
   ("Ajustes publicados"), que abre com `publicado: true`. */
async function contexto({ js = true, largura = 1280, altura = 900, celular = false, publicado = false } = {}){
  const ctx = await navegador.newContext({
    viewport:{ width:largura, height:altura },
    javaScriptEnabled:js,
    isMobile:celular, hasTouch:celular
  });
  if(!publicado)
    await ctx.route(/\/js\/ajustes\.js/, r =>
      r.fulfill({ contentType:'text/javascript', body:'const AJUSTES_PUBLICADOS = null;' }));
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
   passando por ela, então passa por aqui.

   Depois da porta o varejo abre na vista de abertura, não no catálogo, e a
   grade fica escondida — por isso o padrão é seguir para o catálogo. Quem
   quiser testar a abertura passa `vista: null`. */
/* O login pede só e-mail e senha; o documento mora na conta, criada no
   cadastro. Sem servidor a conta fica registrada no navegador, então o teste
   registra a conta de teste com o documento que quer e entra com ela. */
const mascaraDoc = d => d.length === 14
  ? `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
  : `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;

async function registrarConta(p, doc, email = EMAIL){
  await p.evaluate(([email, doc, tipo]) => {
    const todas = JSON.parse(localStorage.getItem('zg-contas') || '{}');
    todas[email] = { email, nome: 'Cliente de Teste', doc, tipo };
    localStorage.setItem('zg-contas', JSON.stringify(todas));
  }, [email, mascaraDoc(doc), doc.length === 14 ? 'cnpj' : 'cpf']);
}

async function preencherLogin(p, doc, email = EMAIL, senha = SENHA){
  await registrarConta(p, doc, email);
  await p.fill('#emailInput', email);
  await p.fill('#senhaInput', senha);
}

async function entrar(p, doc = CPF, vista = 'catalogo'){
  await p.click('#gateYes');
  await p.waitForTimeout(120);
  await preencherLogin(p, doc);
  await p.click('#docBtn');
  await p.waitForTimeout(250);
  if(vista){
    const aba = await p.$(`.app-aba[data-vista="${vista}"]`);
    if(aba){ await aba.click(); await p.waitForTimeout(150); }
  }
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
  const zaps = await p.$$eval('a[data-contato="whatsapp"]', es => es.map(e => e.href));
  ok(`os ${zaps.length} links de WhatsApp vão para (85) 98149-4445`,
     zaps.length > 0 && zaps.every(h => h === 'https://wa.me/5585981494445'), zaps.join(' '));
  await ctx.close();

  /* As outras páginas também, logo aqui no começo. Os scripts são clássicos
     e dividem o escopo global: um nome repetido entre porta.js e atacado.js
     derruba a página inteira com "has already been declared", e sem esta
     checagem isso só aparecia lá na frente, como uma espera estourada. */
  for(const pag of ['atacado.html', 'creditos.html', 'admin.html']){
    const c2 = await contexto();
    const p2 = await c2.newPage();
    const e2 = [];
    p2.on('console', m => { if(m.type() === 'error' && !externo(m.text())) e2.push(m.text()); });
    p2.on('pageerror', e => e2.push('pageerror: ' + e.message));
    await p2.goto(`${BASE}/${pag}`, { waitUntil:'networkidle' });
    ok(`${pag}: sem erro de console`, e2.length === 0, e2[0]);
    await c2.close();
  }
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
  ok('"feldschlösschen" com trema encontra a cerveja', await buscar('feldschlösschen') === 1);
  ok('"feldschlosschen" sem trema encontra também',     await buscar('feldschlosschen') === 1);
  ok('"FELDSCHLOSSCHEN" em caixa alta também',          await buscar('FELDSCHLOSSCHEN') === 1);
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
  /* O CEP agora vai ao ViaCEP. Aqui a resposta é forjada: o teste é da regra
     de distância e do que o site faz com ela, não da disponibilidade de um
     serviço de terceiro — e um teste que depende de rede alheia falha no dia
     em que ela pisca, sem nada de errado no código. */
  const resposta = corpo => async rota =>
    rota.fulfill({ contentType:'application/json', body:JSON.stringify(corpo) });

  const comCep = async (viacep, cep = '60150000') => {
    const ctx = await contexto();
    const p = await ctx.newPage();
    await ctx.route('**://viacep.com.br/**', viacep);
    await p.goto(BASE, { waitUntil:'networkidle' });
    await entrar(p, CPF, null);
    /* acima do pedido mínimo de propósito: abaixo dele o aviso do carrinho
       fala do mínimo, que é a informação certa a dar primeiro */
    await p.evaluate(() => { for(let i=0;i<6;i++) document.querySelector('.card:not(.hide) .add').click(); });
    await p.fill('#cepInput', cep);
    await p.click('#cepBtn');
    await p.waitForTimeout(500);
    return { p, ctx };
  };

  /* oito dígitos é o mínimo, e isso nem chega a consultar */
  {
    const { p, ctx } = await comCep(resposta({ erro:true }), '123');
    ok('CEP curto é recusado', /8 dígitos/.test(await p.textContent('#cepMsg')));
    await ctx.close();
  }

  /* bairro conhecido, dentro do raio */
  {
    const { p, ctx } = await comCep(resposta({ cep:'60150-000', localidade:'Fortaleza', bairro:'Meireles', uf:'CE' }));
    const msg = await p.textContent('#cepMsg');
    ok('bairro dentro do raio cobra taxa', /Entregamos em Meireles/.test(msg), msg);
    ok('e o resumo do carrinho mostra o bairro', /Meireles/.test(await p.textContent('#rCepInfo')));
    ok('a entrega entra no resumo', /^R\$/.test((await p.textContent('#rEntrega')).trim()));
    await ctx.close();
  }

  /* bairro que não está na tabela cai no padrão da cidade, e não em erro */
  {
    const { p, ctx } = await comCep(resposta({ cep:'60000-000', localidade:'Fortaleza', bairro:'Bairro Inventado', uf:'CE' }));
    ok('bairro fora da tabela ainda entrega', /Entregamos em/.test(await p.textContent('#cepMsg')));
    await ctx.close();
  }

  /* cidade da região metropolitana, além do raio: é retirada, não frete grátis */
  {
    const { p, ctx } = await comCep(resposta({ cep:'61700-000', localidade:'Aquiraz', bairro:'Centro', uf:'CE' }));
    const fora = await p.textContent('#rEntrega');
    ok('fora do raio NÃO diz "grátis"', !/grátis/i.test(fora), fora);
    ok('fora do raio diz retirar no balcão', /balcão/i.test(fora), fora);
    ok('o aviso do carrinho explica a retirada', /balcão/i.test(await p.textContent('#cartAviso')));
    await ctx.close();
  }

  /* cidade que não atendemos */
  {
    const { p, ctx } = await comCep(resposta({ cep:'01001-000', localidade:'São Paulo', bairro:'Sé', uf:'SP' }));
    ok('cidade fora da área vira retirada', /fora do raio/.test(await p.textContent('#cepMsg')));
    await ctx.close();
  }

  /* CEP que não existe */
  {
    const { p, ctx } = await comCep(resposta({ erro:true }), '99999999');
    ok('CEP inexistente é recusado', /não existe/.test(await p.textContent('#cepMsg')));
    await ctx.close();
  }

  /* rede fora do ar: dizer que não deu, nunca voltar a chutar um número */
  {
    const { p, ctx } = await comCep(rota => rota.abort());
    const msg = await p.textContent('#cepMsg');
    ok('rede fora do ar avisa em vez de inventar', /Não deu para consultar/.test(msg), msg);
    ok('e nenhuma entrega é gravada', (await p.textContent('#rEntrega')).trim() === '—');
    ok('o botão volta a funcionar', !(await p.$eval('#cepBtn', e => e.disabled)));
    await ctx.close();
  }
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

  await preencherLogin(p, CPF);
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
  /* sem script não há abas para trocar de vista: todas têm de estar visíveis e
     empilhadas, senão a maior parte do site some para quem não tem JavaScript
     — e para o buscador */
  const vistas = await p.$$eval('.vista', e => e.map(v => getComputedStyle(v).display !== 'none'));
  ok(`as ${vistas.length} vistas ficam à mostra`,
     vistas.length === 5 && vistas.every(Boolean), vistas.join(','));
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

  /* O documento é conferido no cadastro. Com a chave desligada, o que a porta
     exige é a contagem: número curto é barrado antes de qualquer navegação. */
  const p2 = await ctx.newPage();
  await p2.goto(BASE, { waitUntil:'networkidle' });
  await p2.click('#gateYes');
  await p2.waitForTimeout(120);
  await p2.click('#painelEntrar [data-painel="criar"]');
  const criarCom = async doc => {
    await p2.fill('#cDocInput', doc);          await p2.fill('#nomeInput', 'Maria da Silva');
    await p2.fill('#cEmailInput', 'contagem@teste.com');
    await p2.fill('#cSenhaInput', SENHA);      await p2.fill('#cConfInput', SENHA);
    await p2.click('#criarBtn');
    await p2.waitForTimeout(250);
  };
  await criarCom('1114447773');                    /* 10 dígitos */
  ok('número com dígitos a menos é recusado', /11 dígitos/.test(await p2.textContent('#criarMsg')));
  ok('e a porta continua aberta', await p2.$eval('#porta', e => getComputedStyle(e).display !== 'none'));

  await criarCom('111444777351');                  /* 12: nem CPF nem CNPJ */
  ok('12 dígitos não é CPF nem CNPJ', await p2.$eval('#porta', e => getComputedStyle(e).display !== 'none'));

  await criarCom(CPF_QUALQUER);
  ok('com a chave desligada, 11 dígitos quaisquer entram',
     await p2.$eval('#porta', e => getComputedStyle(e).display === 'none'));

  /* quem entra não cai na prateleira: a abertura vem primeiro */
  ok('o varejo abre na vista de abertura',
     await p2.$eval('#v-inicio', e => e.classList.contains('ativa')));
  ok('e o catálogo começa escondido',
     await p2.$eval('#v-catalogo', e => getComputedStyle(e).display === 'none'));
  await p2.click('.abertura-btns [data-vista="catalogo"]');
  await p2.waitForTimeout(200);
  ok('o botão da abertura leva ao catálogo',
     await p2.$eval('#v-catalogo', e => e.classList.contains('ativa')));
  ok('e a grade aparece', await p2.$eval('#grid', e => getComputedStyle(e).display !== 'none'));

  /* A chave está desligada na porta, mas o algoritmo continua no arquivo e
     volta a valer com uma linha. Testar aqui é o que impede de ele apodrecer
     sem ninguém perceber. */
  const digito = await p2.evaluate(() => ({
    cpfBom:   cpfValido('11144477735'),
    cpfRuim:  cpfValido('11144477736'),
    cpfIgual: cpfValido('11111111111'),
    cnpjBom:  cnpjValido('11222333000181'),
    cnpjRuim: cnpjValido('11222333000182'),
    chave:    CONFERE_DIGITO
  }));
  ok('a chave do dígito está desligada', digito.chave === false);
  ok('o algoritmo do CPF continua correto',  digito.cpfBom && !digito.cpfRuim && !digito.cpfIgual);
  ok('o algoritmo do CNPJ continua correto', digito.cnpjBom && !digito.cnpjRuim);

  /* CNPJ atravessa para o atacado — inclusive um inventado, com a chave
     desligada: o que decide a loja é a contagem de dígitos */
  const p5 = await ctx.newPage();
  await p5.goto(BASE, { waitUntil:'networkidle' });
  await entrar(p5, CNPJ_QUALQUER);
  await p5.waitForTimeout(400);
  ok('14 dígitos quaisquer vão para o atacado', new URL(p5.url()).pathname.endsWith('atacado.html'), p5.url());

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

  /* o botão de trocar conta existe nas duas lojas e devolve para a porta */
  for(const [pag, doc, nome] of [['index.html', CPF, 'varejo'], ['atacado.html', CNPJ, 'atacado']]){
    const pt = await ctx.newPage();
    await pt.goto(`${BASE}/${pag}`, { waitUntil:'networkidle' });
    await entrar(pt, doc, null);
    await pt.waitForTimeout(250);
    const botao = await pt.$('.conta-btn[data-trocar]');
    ok(`${nome}: tem botão de trocar conta`, !!botao);
    if(!botao) continue;
    await botao.click();
    await pt.waitForTimeout(250);
    ok(`${nome}: trocar conta reabre a porta`,
       await pt.$eval('#porta', e => getComputedStyle(e).display !== 'none'));
    ok(`${nome}: e o campo volta vazio`, (await pt.inputValue('#emailInput')) === '');
  }
  await ctx.close();
}

/* ====================================================================== */
secao('Login');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  await p.click('#gateYes');
  await p.waitForTimeout(120);

  ok('o login pede só e-mail e senha',
     !!(await p.$('#emailInput')) && !!(await p.$('#senhaInput')) && !(await p.$('#painelEntrar input[inputmode="numeric"]')));
  ok('a senha nasce escondida', (await p.getAttribute('#senhaInput', 'type')) === 'password');
  ok('o foco começa no e-mail', await p.evaluate(() => document.activeElement?.id === 'emailInput'));

  await registrarConta(p, CPF);
  const tentar = async (email, senha) => {
    await p.fill('#emailInput', email); await p.fill('#senhaInput', senha);
    await p.click('#docBtn'); await p.waitForTimeout(150);
    return { msg: await p.textContent('#docMsg'),
             foco: await p.evaluate(() => document.activeElement?.id),
             aberta: await p.$eval('#porta', e => getComputedStyle(e).display !== 'none') };
  };

  let r = await tentar('', SENHA);
  ok('sem e-mail não entra', r.aberta && /e-mail/i.test(r.msg), r.msg);
  ok('e o foco vai para o e-mail', r.foco === 'emailInput', r.foco);
  ok('que fica marcado como inválido', (await p.getAttribute('#emailInput', 'aria-invalid')) === 'true');

  r = await tentar('cliente@exemplo', SENHA);
  ok('e-mail sem domínio completo é recusado', r.aberta && /domínio/.test(r.msg), r.msg);

  r = await tentar(EMAIL, '');
  ok('sem senha não entra', r.aberta && /senha/i.test(r.msg) && r.foco === 'senhaInput', r.msg);
  ok('e o e-mail deixa de estar marcado', (await p.getAttribute('#emailInput', 'aria-invalid')) === null);

  r = await tentar(EMAIL, '12345');
  ok('senha com menos de 6 caracteres é recusada', r.aberta && /6 caracteres/.test(r.msg), r.msg);

  await p.fill('#senhaInput', '1234567');
  ok('corrigir o campo apaga a queixa', (await p.textContent('#docMsg')) === '');

  r = await tentar('ninguem@exemplo.com', SENHA);
  ok('e-mail sem conta é recusado, sugerindo criar uma',
     r.aberta && /Não encontramos/.test(r.msg) && /crie uma conta/.test(r.msg) && r.foco === 'emailInput', r.msg);

  await p.click('#senhaVer');
  ok('"Mostrar" revela a senha', (await p.getAttribute('#senhaInput', 'type')) === 'text'
     && (await p.getAttribute('#senhaVer', 'aria-pressed')) === 'true');
  await p.click('#senhaVer');
  ok('e "Ocultar" esconde de novo', (await p.getAttribute('#senhaInput', 'type')) === 'password');

  /* Enter em qualquer campo envia, como em todo formulário de login */
  await p.fill('#emailInput', EMAIL); await p.fill('#senhaInput', SENHA);
  await p.press('#senhaInput', 'Enter');
  await p.waitForTimeout(250);
  ok('Enter entra', await p.$eval('#porta', e => getComputedStyle(e).display === 'none'));

  const guardado = await p.evaluate(() => JSON.stringify({...sessionStorage, ...localStorage}));
  ok('a conta guarda o e-mail', JSON.parse(await p.evaluate(() => sessionStorage.getItem('zg-perfil'))).email === EMAIL);
  ok('a senha não é guardada em lugar nenhum', !guardado.includes(SENHA));
  ok('nem fica no campo', (await p.inputValue('#senhaInput')) === '');
  ok('o botão de conta diz quem está conectado',
     (await p.getAttribute('.conta-btn', 'title')).includes(EMAIL));

  ok('o documento vem da conta, sem ter sido digitado', /111\.444\.777-35/.test(await p.textContent('[data-doc]')));

  /* conta de CPF no atacado: a porta volta pedindo uma conta de CNPJ */
  await p.click('.app-pe a[data-loja="atacado"]');
  await p.waitForTimeout(600);
  ok('conta de CPF no atacado reabre a porta pedindo CNPJ', /conta de CNPJ/.test(await p.textContent('#docMsg')),
     await p.textContent('#docMsg'));
  ok('com o foco no e-mail', await p.evaluate(() => document.activeElement?.id === 'emailInput'));
  await preencherLogin(p, CNPJ, 'compras@empresa.com.br');
  await p.click('#docBtn');
  await p.waitForTimeout(300);
  ok('e uma conta de CNPJ entra ali mesmo', await p.$eval('#porta', e => getComputedStyle(e).display === 'none'));
  await ctx.close();

  /* celular pequeno: o cartão cresceu, e tem de dar para chegar ao botão */
  const cel = await contexto({ largura:360, altura:640, celular:true });
  const pc = await cel.newPage();
  await pc.goto(BASE, { waitUntil:'networkidle' });
  await pc.click('#gateYes');
  await pc.waitForTimeout(150);
  ok('360×640: o topo do cartão de login não fica cortado',
     await pc.$eval('#porta .gate-card', e => e.getBoundingClientRect().top >= 0));
  await preencherLogin(pc, CPF);
  await pc.click('#docBtn');
  await pc.waitForTimeout(250);
  ok('360×640: e o botão Entrar é alcançável',
     await pc.$eval('#porta', e => getComputedStyle(e).display === 'none'));
  await cel.close();
}

/* ====================================================================== */
secao('Criar conta');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  await p.click('#gateYes');
  await p.waitForTimeout(120);
  const visivel = sel => p.$eval(sel, e => !e.hidden && getComputedStyle(e).display !== 'none');

  ok('a porta abre no painel de entrar', await visivel('#painelEntrar') && !(await visivel('#painelCriar')));
  await p.fill('#emailInput', EMAIL);
  await p.click('#painelEntrar [data-painel="criar"]');
  await p.waitForTimeout(100);
  ok('"Criar conta" troca de painel', await visivel('#painelCriar') && !(await visivel('#painelEntrar')));
  ok('o diálogo passa a se chamar "Criar conta"',
     (await p.getAttribute('#porta', 'aria-labelledby')) === 'criarTitle');
  ok('o e-mail digitado no login vem junto', (await p.inputValue('#cEmailInput')) === EMAIL);
  ok('e o foco vai para o primeiro campo vazio',
     await p.evaluate(() => document.activeElement?.id === 'cDocInput'));

  await p.fill('#cDocInput', CNPJ);
  ok('com CNPJ o nome vira "Razão social"', (await p.textContent('#nomeTag')) === 'Razão social');
  await p.fill('#cDocInput', CPF);
  ok('com CPF volta a "Nome completo"', (await p.textContent('#nomeTag')) === 'Nome completo');

  const criar = async ({ doc = CPF, nome = 'Maria da Silva', email = EMAIL, senha = SENHA, conf = senha } = {}) => {
    await p.fill('#cDocInput', doc); await p.fill('#nomeInput', nome); await p.fill('#cEmailInput', email);
    await p.fill('#cSenhaInput', senha); await p.fill('#cConfInput', conf);
    await p.click('#criarBtn'); await p.waitForTimeout(150);
    return { msg: await p.textContent('#criarMsg'), foco: await p.evaluate(() => document.activeElement?.id),
             aberta: await p.$eval('#porta', e => getComputedStyle(e).display !== 'none') };
  };

  let r = await criar({ doc: '123' });
  ok('documento curto é recusado', r.aberta && /11 dígitos/.test(r.msg) && r.foco === 'cDocInput', r.msg);
  r = await criar({ nome: '' });
  ok('sem nome não cria', r.aberta && /seu nome/.test(r.msg) && r.foco === 'nomeInput', r.msg);
  r = await criar({ doc: CNPJ, nome: 'AB' });
  ok('razão social curta pede "completa"', /razão social completa/.test(r.msg), r.msg);
  r = await criar({ email: 'maria@' });
  ok('e-mail incompleto é recusado', r.aberta && /domínio/.test(r.msg) && r.foco === 'cEmailInput', r.msg);
  r = await criar({ senha: '123', conf: '123' });
  ok('senha curta é recusada', r.aberta && /6 caracteres/.test(r.msg) && r.foco === 'cSenhaInput', r.msg);
  r = await criar({ conf: '' });
  ok('sem confirmação não cria', r.aberta && /Repita/.test(r.msg) && r.foco === 'cConfInput', r.msg);
  r = await criar({ conf: SENHA + 'x' });
  ok('senhas diferentes são recusadas', r.aberta && /não são iguais/.test(r.msg) && r.foco === 'cConfInput', r.msg);
  ok('o erro fica só no cadastro', (await p.textContent('#docMsg')) === '');

  await p.click('#cSenhaVer');
  ok('"Mostrar" revela as duas senhas',
     (await p.getAttribute('#cSenhaInput', 'type')) === 'text' && (await p.getAttribute('#cConfInput', 'type')) === 'text');
  await p.click('#cSenhaVer');

  await p.click('#painelCriar [data-painel="entrar"]');
  await p.waitForTimeout(100);
  ok('"Entrar" volta ao login', await visivel('#painelEntrar') && !(await visivel('#painelCriar')));
  ok('e o diálogo volta a se chamar "Entrar"', (await p.getAttribute('#porta', 'aria-labelledby')) === 'portaTitle');
  await p.click('#painelEntrar [data-painel="criar"]');
  await p.waitForTimeout(100);

  r = await criar({ nome: '  Maria   da Silva ' });
  ok('conta criada com CPF entra no varejo', !r.aberta);
  ok('ainda no varejo', !new URL(p.url()).pathname.endsWith('atacado.html'));
  const perfil = JSON.parse(await p.evaluate(() => sessionStorage.getItem('zg-perfil')));
  ok('o perfil guarda nome e e-mail', perfil.nome === 'Maria da Silva' && perfil.email === EMAIL, JSON.stringify(perfil));
  ok('a senha nova não é guardada', !(await p.evaluate(() => JSON.stringify({...sessionStorage, ...localStorage}))).includes(SENHA));
  ok('o botão de conta diz o nome', (await p.getAttribute('.conta-btn', 'title')).includes('Maria da Silva'));

  /* trocar conta volta sempre para o login, não para o cadastro */
  await p.click('.conta-btn[data-trocar]');
  await p.waitForTimeout(200);
  ok('trocar conta reabre no painel de entrar', await visivel('#painelEntrar') && !(await visivel('#painelCriar')));
  ok('com o cadastro limpo', (await p.inputValue('#nomeInput')) === '' && (await p.inputValue('#cSenhaInput')) === '');

  /* conta com CNPJ criada no varejo vai para o atacado e entra direto */
  await p.click('#painelEntrar [data-painel="criar"]');
  await criar({ doc: CNPJ, nome: 'Mercadinho Boa Esquina Ltda', email: 'compras@boaesquina.com.br' });
  await p.waitForTimeout(600);
  ok('conta criada com CNPJ vai para o atacado', new URL(p.url()).pathname.endsWith('atacado.html'), p.url());
  ok('e o balcão abre sem pedir login de novo', await p.$eval('#porta', e => getComputedStyle(e).display === 'none'));

  /* depois, só e-mail e senha: a conta lembra o CNPJ e a loja */
  const pl = await ctx.newPage();
  await pl.goto(BASE, { waitUntil:'networkidle' });
  await pl.click('#gateYes');
  await pl.waitForTimeout(120);
  await pl.fill('#emailInput', 'compras@boaesquina.com.br');
  await pl.fill('#senhaInput', SENHA);
  await pl.click('#docBtn');
  await pl.waitForTimeout(600);
  ok('entrando só com e-mail e senha, a conta de CNPJ vai ao atacado', new URL(pl.url()).pathname.endsWith('atacado.html'), pl.url());
  ok('com a razão social no botão de conta', (await pl.getAttribute('.conta-btn', 'title')).includes('Mercadinho Boa Esquina'));

  /* o mesmo e-mail não abre segunda conta */
  const pdup = await ctx.newPage();
  await pdup.goto(BASE, { waitUntil:'networkidle' });
  await pdup.click('#gateYes');
  await pdup.waitForTimeout(120);
  await pdup.click('#painelEntrar [data-painel="criar"]');
  await pdup.fill('#cDocInput', CPF); await pdup.fill('#nomeInput', 'Outra Pessoa');
  await pdup.fill('#cEmailInput', 'COMPRAS@boaesquina.com.br');
  await pdup.fill('#cSenhaInput', SENHA); await pdup.fill('#cConfInput', SENHA);
  await pdup.click('#criarBtn');
  await pdup.waitForTimeout(250);
  ok('e-mail já cadastrado não cria outra conta, nem com maiúsculas', /Já existe uma conta/.test(await pdup.textContent('#criarMsg')),
     await pdup.textContent('#criarMsg'));
  ok('o registro de contas não guarda senha', !(await pdup.evaluate(() => localStorage.getItem('zg-contas'))).includes(SENHA));
  await ctx.close();

  /* celular pequeno: o cadastro é o cartão mais alto do site */
  const cel = await contexto({ largura:360, altura:640, celular:true });
  const pc = await cel.newPage();
  await pc.goto(BASE, { waitUntil:'networkidle' });
  await pc.click('#gateYes');
  await pc.waitForTimeout(150);
  await pc.click('#painelEntrar [data-painel="criar"]');
  await pc.waitForTimeout(100);
  ok('360×640: o topo do cadastro não fica cortado',
     await pc.$eval('#porta .gate-card', e => e.getBoundingClientRect().top >= 0));
  const alvo = await pc.$eval('#painelEntrar [data-painel="criar"]', e => e.getBoundingClientRect().height).catch(() => 0);
  await pc.fill('#cDocInput', CPF); await pc.fill('#nomeInput', 'Maria da Silva'); await pc.fill('#cEmailInput', EMAIL);
  await pc.fill('#cSenhaInput', SENHA); await pc.fill('#cConfInput', SENHA);
  await pc.click('#criarBtn');
  await pc.waitForTimeout(250);
  ok('360×640: e o botão Criar conta é alcançável', await pc.$eval('#porta', e => getComputedStyle(e).display === 'none'));
  await cel.close();

  const cel2 = await contexto({ largura:360, altura:640, celular:true });
  const pd = await cel2.newPage();
  await pd.goto(BASE, { waitUntil:'networkidle' });
  await pd.click('#gateYes'); await pd.waitForTimeout(150);
  const h = await pd.$eval('#painelEntrar [data-painel="criar"]', e => e.getBoundingClientRect().height);
  ok('o link "Criar conta" tem altura de dedo', h >= 44, `${h}px`);
  await cel2.close();
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
secao('Painel de administração');
{
  const ctx = await contexto({ largura:1366, altura:900 });
  const adm = await ctx.newPage();
  adm.on('dialog', d => d.accept());
  await adm.goto(`${BASE}/admin.html`, { waitUntil:'networkidle' });

  const rascunho = () => adm.evaluate(() => JSON.parse(localStorage.getItem('zg-admin-rascunho') || 'null'));
  const estadoTxt = () => adm.textContent('#estado');
  const esperar = () => adm.waitForTimeout(400);          /* o rascunho salva com 250 ms de folga */
  const linha = sku => `#linhasProdutos tr[data-sku="${sku}"]`;

  const total = await adm.evaluate(() => BEBIDAS.length);
  ok('o painel lista todos os produtos', (await adm.$$('#linhasProdutos tr')).length === total, String(total));
  ok('abre sem alterações', /Sem alterações/.test(await estadoTxt()));
  ok('e com Publicar desligado', await adm.$eval('#publicar', e => e.disabled));
  ok('sem rascunho guardado', (await rascunho()) === null);

  /* preço: vira rascunho e a célula fica marcada */
  await adm.fill(`${linha('estrella-galicia-330')} [data-campo="preco"]`, '9,90');
  await esperar();
  ok('mudar o preço conta uma alteração', /1 alteração/.test(await estadoTxt()), await estadoTxt());
  ok('e marca a célula', await adm.$eval(`${linha('estrella-galicia-330')} [data-campo="preco"]`, e => e.classList.contains('mudou')));
  ok('e salva o rascunho', (await rascunho())?.bebidas.find(b => b.sku === 'estrella-galicia-330').preco === 9.9);
  ok('a coluna Atacado acompanha', /7,13/.test(await adm.textContent(`${linha('estrella-galicia-330')} [data-calc]`)),
     await adm.textContent(`${linha('estrella-galicia-330')} [data-calc]`));

  /* erro: promoção acima do preço não chega ao rascunho */
  await adm.fill(`${linha('estrella-galicia-330')} [data-campo="promo"]`, '12');
  await esperar();
  ok('promoção maior que o preço é recusada', /Menor que o preço/.test(await adm.textContent(linha('estrella-galicia-330'))));
  ok('o topo avisa o erro', /campo com erro/.test(await estadoTxt()));
  ok('e Publicar desliga', await adm.$eval('#publicar', e => e.disabled));
  ok('o rascunho guarda o último valor válido', (await rascunho()).bebidas.find(b => b.sku === 'estrella-galicia-330').promo === 6.9);
  await adm.fill(`${linha('estrella-galicia-330')} [data-campo="promo"]`, '7,50');

  /* regras do varejo e do atacado */
  await adm.click('#t-varejo');
  await adm.fill('[data-regra="varejo.freteGratis"]', '150');
  await adm.fill('[data-regra="varejo.cupom.codigo"]', 'geladinha10');
  await adm.fill('[data-regra="varejo.cupom.desconto"]', '95');
  ok('cupom acima de 90% é recusado', /90%/.test(await adm.textContent('#a-varejo')));
  await adm.fill('[data-regra="varejo.cupom.desconto"]', '10');
  await adm.click('#t-atacado');
  await adm.fill('[data-regra="atacado.desconto"]', '30');
  await esperar();
  ok('o desconto de revenda muda a coluna Atacado', /6,93/.test(await adm.textContent(`${linha('estrella-galicia-330')} [data-calc]`)));
  ok('Publicar liga com alterações válidas', !(await adm.$eval('#publicar', e => e.disabled)));

  /* remover e adicionar produto */
  await adm.click('#t-produtos');
  await adm.click(`${linha('no3-gin-700')} [data-acao="tirar"]`);
  await adm.click('#novoProduto');
  const novo = await adm.$eval('#linhasProdutos tr:last-child', e => e.dataset.sku);
  ok('produto novo nasce com os obrigatórios marcados', /4 campos com erro/.test(await estadoTxt()), await estadoTxt());
  const nl = linha(novo);
  await adm.fill(`${nl} [data-campo="marca"]`, 'Itaipava');
  await adm.fill(`${nl} [data-campo="nome"]`, 'Pilsen lata 350 ml');
  await adm.fill(`${nl} [data-campo="vol"]`, '350 ml');
  await adm.fill(`${nl} [data-campo="teor"]`, '4,5%');
  await adm.fill(`${nl} [data-campo="preco"]`, '4,29');
  await adm.fill(`${nl} [data-campo="estoque"]`, '480');
  await esperar();
  ok('preenchido, o produto novo entra no rascunho',
     (await rascunho()).bebidas.some(b => b.marca === 'Itaipava') && !(await rascunho()).bebidas.some(b => b.sku === 'no3-gin-700'));

  /* a loja, no mesmo navegador, mostra a prévia */
  const loja = await ctx.newPage();
  const errosLoja = [];
  loja.on('pageerror', e => errosLoja.push(e.message));
  await loja.goto(BASE, { waitUntil:'networkidle' });
  await entrar(loja, CPF);
  ok('a loja avisa que é prévia', !!(await loja.$('.previa')));
  ok('o preço novo aparece no card', /7,50/.test(await loja.$eval('.card[data-cat="cerveja"]', e => e.innerText)));
  ok('o produto removido some', !(await loja.evaluate(() => BEBIDAS.some(b => b.sku === 'no3-gin-700'))));
  ok('o produto novo aparece', /Itaipava/.test(await loja.textContent('#grid')));
  ok('e cai na silhueta, sem foto quebrada', await loja.$$eval('.card', cs => {
    const c = cs.find(x => /Itaipava/.test(x.textContent)); return !!c && !c.querySelector('.card-art.com-foto') && !!c.querySelector('.silhueta');
  }));
  ok('o texto da página segue a regra nova', /150/.test(await loja.textContent('.info-row b.hl')));
  ok('o cupom novo é o que o botão copia', (await loja.textContent('#code')).trim() === 'GELADINHA10');
  ok('e é o que o carrinho aceita', await loja.evaluate(() => REGRAS.cupom.codigo === 'GELADINHA10' && REGRAS.cupom.desconto === 0.1));
  ok('a loja em prévia não tem erro', errosLoja.length === 0, errosLoja[0]);

  const bal = await ctx.newPage();
  await bal.goto(`${BASE}/atacado.html`, { waitUntil:'networkidle' });
  await entrar(bal, CNPJ);
  ok('o atacado usa o desconto novo', await bal.evaluate(() => ATACADO.desconto === 0.3));
  ok('e também avisa a prévia', !!(await bal.$('.previa')));

  /* publicar baixa o arquivo; servido no lugar do ajustes.js, vale para todos */
  let baixouSozinho = false;
  const ouvir = () => { baixouSozinho = true; };
  adm.on('download', ouvir);
  await adm.click('#publicar');
  await adm.waitForTimeout(300);
  adm.off('download', ouvir);
  ok('sem chave, Publicar não baixa nada sozinho', !baixouSozinho);
  ok('e avisa que falta conectar o GitHub', await adm.$eval('#dlgSemChave', e => e.open));
  await adm.click('#irConectar');
  ok('"Conectar o GitHub" leva à aba Publicação',
     await adm.$eval('#a-publicacao', e => !e.hidden) && await adm.evaluate(() => document.activeElement?.id === 'ghChave'));
  await adm.click('#t-produtos');
  await adm.click('#publicar');
  const [baixa] = await Promise.all([adm.waitForEvent('download'), adm.click('#baixarMesmo')]);
  ok('"Baixar o arquivo" baixa ajustes.js', baixa.suggestedFilename() === 'ajustes.js');
  const arquivo = readFileSync(await baixa.path(), 'utf8');
  ok('o arquivo define AJUSTES_PUBLICADOS', /const AJUSTES_PUBLICADOS = \{/.test(arquivo));
  ok('e mostra como subir', await adm.$eval('#dlgPublicar', e => e.open));
  await adm.click('#dlgPublicar button');

  const outro = await contexto();                 /* um cliente: sem rascunho nenhum */
  await outro.route(/\/js\/ajustes\.js/, r => r.fulfill({ contentType:'text/javascript', body: arquivo }));
  const cli = await outro.newPage();
  await cli.goto(BASE, { waitUntil:'networkidle' });
  await entrar(cli, CPF);
  ok('publicado, o cliente vê o preço novo', /7,50/.test(await cli.$eval('.card[data-cat="cerveja"]', e => e.innerText)));
  ok('sem aviso de prévia', !(await cli.$('.previa')));
  ok('e com o produto novo', /Itaipava/.test(await cli.textContent('#grid')));

  /* no ar, o painel vê que o rascunho é igual ao publicado e o apaga */
  await outro.addInitScript(r => localStorage.setItem('zg-admin-rascunho', r), JSON.stringify(await rascunho()));
  const adm2 = await outro.newPage();
  await adm2.goto(`${BASE}/admin.html`, { waitUntil:'networkidle' });
  await adm2.waitForTimeout(400);
  ok('publicado, o painel mostra "sem alterações"', /Sem alterações/.test(await adm2.textContent('#estado')));
  ok('e apaga o rascunho sozinho', await adm2.evaluate(() => localStorage.getItem('zg-admin-rascunho')) === null);
  await outro.close();

  /* descartar volta ao que está no ar, e a loja sai da prévia */
  await adm.click('#descartar');
  await esperar();
  ok('descartar apaga o rascunho', (await rascunho()) === null);
  ok('e o painel volta ao publicado', /Sem alterações/.test(await estadoTxt()));
  await loja.reload({ waitUntil:'networkidle' });
  await loja.waitForTimeout(250);
  ok('a loja sai da prévia', !(await loja.$('.previa')));

  /* rascunho estragado não derruba a loja */
  await loja.evaluate(() => localStorage.setItem('zg-admin-rascunho',
    JSON.stringify({ versao:1, bebidas:[{ sku:'x', marca:'X', nome:'Y', cat:'nada', forma:'can', preco:'abc', estoque:-1 }],
                     varejo:{ minimo:'muito', freteGratis:-5 }, atacado:{ desconto: 7 } })));
  errosLoja.length = 0;
  await loja.reload({ waitUntil:'networkidle' });
  await loja.waitForTimeout(250);
  ok('rascunho torto é ignorado, sem erro', errosLoja.length === 0, errosLoja[0]);
  ok('e a loja segue com o catálogo inteiro', await loja.evaluate(() => BEBIDAS.length) === total);
  ok('e com as regras de antes', await loja.evaluate(() => REGRAS.freteGratis === 120 && ATACADO.desconto === 0.28));
  await loja.evaluate(() => localStorage.setItem('zg-admin-rascunho', '{isto não é json'));
  errosLoja.length = 0;
  await loja.reload({ waitUntil:'networkidle' });
  ok('nem com lixo no lugar do rascunho', errosLoja.length === 0, errosLoja[0]);
  await ctx.close();

  /* celular: o painel é usável — sem barra lateral na página, a tabela rola na caixa dela */
  const cel = await contexto({ largura:390, altura:844, celular:true });
  const pc = await cel.newPage();
  await pc.goto(`${BASE}/admin.html`, { waitUntil:'networkidle' });
  ok('390px: a página do painel não vaza para os lados',
     await pc.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const alvos = await pc.$$eval('.adm-acoes .btn, .adm-aba, #novoProduto', es => es.map(e => e.getBoundingClientRect().height));
  ok('390px: botões do painel com altura de dedo', alvos.every(h => h >= 44), alvos.join(','));
  await cel.close();
}

/* Publicação direta no GitHub, com a API simulada: o teste nunca grava no
   repositório de verdade. */
{
  const ctx = await contexto({ largura:1366, altura:900 });
  const pedidos = [];
  let respostaPut = [201];                         /* fila de status para os PUT */
  let statusRepo = 200;
  await ctx.route('https://api.github.com/**', async r => {
    const req = r.request();
    pedidos.push({ metodo: req.method(), url: req.url(), auth: req.headers()['authorization'],
                   corpo: req.postData() ? JSON.parse(req.postData()) : null });
    const url = new URL(req.url());
    if(url.pathname === '/repos/costamaiavitor/Site-Zero-Grau')
      return r.fulfill({ status: statusRepo, contentType:'application/json', body:'{}' });
    if(req.method() === 'GET')
      return r.fulfill({ status:200, contentType:'application/json',
                         body: JSON.stringify({ sha: 'sha-' + pedidos.filter(p => p.metodo === 'GET').length }) });
    const st = respostaPut.shift() ?? 201;
    return r.fulfill({ status: st, contentType:'application/json',
                       body: st < 300 ? JSON.stringify({ commit:{ sha:'novo' } }) : '{}' });
  });
  const adm = await ctx.newPage();
  adm.on('dialog', d => d.accept());
  await adm.goto(`${BASE}/admin.html`, { waitUntil:'networkidle' });
  await adm.click('#t-publicacao');
  ok('a aba Publicação começa desconectada', /Não conectado/.test(await adm.textContent('#ghEstado')));

  await adm.fill('#ghChave', 'isto-nao-e-chave');
  await adm.click('#ghConectar');
  ok('texto que não é chave é recusado sem ir ao GitHub',
     /github_pat_/.test(await adm.textContent('#ghMsg')) && pedidos.length === 0);

  statusRepo = 401;
  await adm.fill('#ghChave', 'github_pat_CHAVEVENCIDA1234');
  await adm.click('#ghConectar');
  await adm.waitForTimeout(200);
  ok('chave recusada pelo GitHub não é guardada',
     /recusou/.test(await adm.textContent('#ghMsg')) && !(await adm.evaluate(() => localStorage.getItem('zg-admin-github'))));

  statusRepo = 200;
  await adm.fill('#ghChave', 'github_pat_CHAVEDETESTE9876');
  await adm.click('#ghConectar');
  await adm.waitForTimeout(200);
  ok('chave aceita conecta', /Conectado.*…9876/.test(await adm.textContent('#ghEstado')), await adm.textContent('#ghEstado'));
  ok('e mostra só o fim dela', !(await adm.textContent('#a-publicacao')).includes('CHAVEDETESTE'));

  /* publica: lê o sha, grava com ele, sem baixar nada */
  await adm.click('#t-produtos');
  await adm.fill('tr[data-sku="red-bull-250"] [data-campo="preco"]', '10,50');
  await adm.waitForTimeout(400);
  let baixou = false;
  adm.on('download', () => { baixou = true; });
  pedidos.length = 0;
  await adm.click('#publicar');
  await adm.waitForTimeout(500);
  const put = pedidos.find(p => p.metodo === 'PUT');
  ok('Publicar grava no GitHub em vez de baixar', !!put && !baixou);
  ok('com a chave no cabeçalho', put?.auth === 'Bearer github_pat_CHAVEDETESTE9876');
  ok('no arquivo certo, na main', /\/contents\/ZeroGrau\/js\/ajustes\.js$/.test(new URL(put.url).pathname) && put.corpo.branch === 'main');
  ok('usando o sha lido antes, que protege o trabalho alheio', put.corpo.sha === 'sha-1');
  const conteudo = Buffer.from(put.corpo.content, 'base64').toString('utf8');
  ok('o conteúdo é o ajustes.js com o preço novo',
     /const AJUSTES_PUBLICADOS = /.test(conteudo) && /"sku": "red-bull-250"[\s\S]*?"preco": 10\.5/.test(conteudo));
  ok('e acentos chegam inteiros', conteudo.includes('Feldschlösschen'));
  ok('a mensagem do commit diz o que é', /^Painel: publica 1 alteração/.test(put.corpo.message), put.corpo.message);
  ok('o topo avisa que foi publicado', /Publicado às/.test(await adm.textContent('#estado')));
  ok('e Publicar desliga até haver mudança nova', await adm.$eval('#publicar', e => e.disabled));

  /* alguém gravou no meio: a segunda volta relê o sha */
  await adm.fill('tr[data-sku="red-bull-250"] [data-campo="preco"]', '10,90');
  await adm.waitForTimeout(400);
  pedidos.length = 0;
  respostaPut = [409, 201];
  await adm.click('#publicar');
  await adm.waitForTimeout(600);
  const puts = pedidos.filter(p => p.metodo === 'PUT');
  ok('conflito: tenta de novo com o sha novo', puts.length === 2 && puts[1].corpo.sha !== puts[0].corpo.sha,
     puts.map(p => p.corpo.sha).join(','));
  ok('e publica', /Publicado às/.test(await adm.textContent('#estado')));

  /* sem permissão: não publica, diz o porquê, e o rascunho fica */
  await adm.fill('tr[data-sku="red-bull-250"] [data-campo="preco"]', '11,90');
  await adm.waitForTimeout(400);
  respostaPut = [403];
  await adm.click('#publicar');
  await adm.waitForTimeout(500);
  ok('sem permissão, o topo explica', /Não publicou.*Contents: Read and write/.test(await adm.textContent('#estado')),
     await adm.textContent('#estado'));
  ok('e Publicar volta a valer, para tentar de novo', !(await adm.$eval('#publicar', e => e.disabled)));
  ok('e o rascunho continua salvo',
     await adm.evaluate(() => JSON.parse(localStorage.getItem('zg-admin-rascunho')).bebidas.find(b => b.sku === 'red-bull-250').preco === 11.9));

  /* esquecer a chave volta ao download */
  await adm.click('#t-publicacao');
  await adm.click('#ghEsquecer');
  ok('esquecer apaga a chave', !(await adm.evaluate(() => localStorage.getItem('zg-admin-github'))));
  await adm.click('#publicar');
  ok('e Publicar volta a pedir a chave', await adm.$eval('#dlgSemChave', e => e.open));
  const [d] = await Promise.all([adm.waitForEvent('download'), adm.click('#baixarMesmo')]);
  ok('com a opção de baixar', d.suggestedFilename() === 'ajustes.js');
  await ctx.close();
}

/* ====================================================================== */
secao('Ajustes publicados');
{
  /* O js/ajustes.js que está no repositório, do jeito que o cliente recebe.
     Roda a cada push — inclusive os que o painel faz ao publicar —, então é
     aqui que uma publicação torta aparece antes de alguém reclamar. */
  const texto = readFileSync(path.join(RAIZ, 'js', 'ajustes.js'), 'utf8');
  const ctx = await contexto({ publicado: true });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  p.on('console', m => { if(m.type() === 'error' && !externo(m.text())) erros.push(m.text()); });
  await p.goto(BASE, { waitUntil:'networkidle' });
  ok('a loja abre com o publicado, sem erro', erros.length === 0, erros[0]);
  const pub = await p.evaluate(() => typeof AJUSTES_PUBLICADOS === 'undefined' ? 'ausente' : AJUSTES_PUBLICADOS);
  ok('ajustes.js define AJUSTES_PUBLICADOS', pub !== 'ausente');
  if(pub && pub !== 'ausente'){
    ok('é da versão que as lojas entendem', pub.versao === 1, String(pub.versao));
    const validos = await p.evaluate(() => AJUSTES_PUBLICADOS.bebidas.map(produtoDe).filter(Boolean).length);
    ok(`os ${pub.bebidas.length} produtos publicados são todos válidos`, validos === pub.bebidas.length, `${validos}/${pub.bebidas.length}`);
    ok('e são o catálogo que a loja mostra', await p.evaluate(() => BEBIDAS.length) === pub.bebidas.length);
    ok('as regras publicadas valem na loja', await p.evaluate(() =>
      REGRAS.cupom.codigo === AJUSTES_PUBLICADOS.varejo.cupom.codigo &&
      REGRAS.freteGratis === AJUSTES_PUBLICADOS.varejo.freteGratis && RAIO_MAX === AJUSTES_PUBLICADOS.varejo.raioMax &&
      ATACADO.desconto === AJUSTES_PUBLICADOS.atacado.desconto));
    const semFoto = await p.evaluate(() => BEBIDAS.filter(b => b.foto).map(b => b.foto));
    const faltando = semFoto.filter(f => !existsSync(path.join(RAIZ, 'img', `${f}-400.webp`)));
    ok('toda foto citada existe em img/', faltando.length === 0, faltando.join(', '));
    await entrar(p, CPF);
    ok('e a vitrine desenha um card por produto', (await p.$$('.card')).length === pub.bebidas.length);
  }else{
    ok('nada publicado pelo painel: vale o dados.js', /AJUSTES_PUBLICADOS = null/.test(texto));
  }
  await ctx.close();
}

/* ====================================================================== */
secao('Estrutura do documento');
{
  const ctx = await contexto();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  await entrar(p, CPF, null);

  /* Um h1, e ele vem antes de qualquer outro título. Os dois diálogos ficavam
     no começo do documento e colocavam dois h3 na frente do h1 — leitor de
     tela e buscador leem isso como um documento que começa no meio. */
  const titulos = await p.$$eval('h1,h2,h3,h4', hs => hs.map(h => +h.tagName[1]));
  ok('existe exatamente um h1', titulos.filter(n => n === 1).length === 1);
  ok('o h1 vem antes de todo o resto', titulos.indexOf(1) === 0, titulos.join(','));
  ok('nenhum título pula nível', titulos.every((n, i) => i === 0 || n <= Math.max(...titulos.slice(0, i)) + 1),
     titulos.join(','));

  /* toda vista precisa de um título próprio, visível ou só para leitor */
  const semTitulo = await p.$$eval('.vista', vs =>
    vs.filter(v => !v.querySelector('h1,h2')).map(v => v.id));
  ok('toda vista tem h1 ou h2', semTitulo.length === 0, semTitulo.join(','));

  /* o mapa de zonas saiu */
  ok('o diagrama de zonas não existe mais', (await p.$$('.zones')).length === 0);

  await ctx.close();
}

/* ====================================================================== */
secao('Arquivos de indexação');
{
  const ctx = await contexto();
  const p = await ctx.newPage();

  /* request.get em vez de goto: um .txt faz o Chromium baixar em vez de
     navegar, e o teste morria antes de ler uma linha */
  const robots = await p.request.get(BASE + '/robots.txt');
  ok('robots.txt é servido', robots.status() === 200);
  const txt = await robots.text();
  ok('robots barra o atacado', /Disallow:\s*\/atacado\.html/.test(txt), txt.slice(0,80));
  ok('robots barra o painel', /Disallow:\s*\/admin\.html/.test(txt));
  ok('robots aponta o sitemap', /Sitemap:/.test(txt));

  const mapa = await p.request.get(BASE + '/sitemap.xml');
  ok('sitemap.xml é servido', mapa.status() === 200);
  const xml = await mapa.text();
  ok('o sitemap não lista o atacado', !/atacado\.html/.test(xml));

  /* a página órfã de estudo saiu do que vai ao ar */
  const orfa = await p.request.get(BASE + '/identidade.html');
  ok('identidade.html não vai mais ao ar', orfa.status() === 404, String(orfa.status()));

  await ctx.close();
}

/* ====================================================================== */
secao('Conforto no celular');
for(const [largura, altura] of [[390, 844], [360, 740]]){
  const ctx = await contexto({ largura, altura, celular:true });

  /* ---- varejo ---- */
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil:'networkidle' });
  await entrar(p, CPF, null);
  await p.waitForTimeout(250);

  const tela = `${largura}×${altura}`;

  /* A navegação fica no pé, ao alcance do polegar, e encostada na borda de
     baixo — se ela sobra para fora da tela, metade das abas some. */
  const barra = await p.evaluate(() => {
    const b = document.querySelector('.app-abas').getBoundingClientRect();
    return { base:Math.round(b.bottom), topo:Math.round(b.top), tela:innerHeight };
  });
  ok(`${tela}: a navegação encosta no pé da tela`,
     Math.abs(barra.base - barra.tela) <= 1, `${barra.base} ≠ ${barra.tela}`);
  ok(`${tela}: e não come a tela toda`, barra.topo > barra.tela * 0.85);
  ok(`${tela}: a faixa do rodapé sai de cena`,
     await p.$eval('.app-pe', e => getComputedStyle(e).display === 'none'));

  /* Alvo de toque: abaixo de 44 px o dedo erra. Percorre as vistas, porque o
     que encolhe costuma ser o botão que só existe numa delas. */
  const pequenos = async () => p.evaluate(() => {
    const out = [];
    for(const el of document.querySelectorAll('button,a[href],input,[role="tab"]')){
      const b = el.getBoundingClientRect();
      if(b.width === 0 || b.height === 0) continue;
      if(b.bottom < 0 || b.top > innerHeight) continue;
      if(b.height < 43) out.push(`${String(el.className) || el.tagName}:${Math.round(b.width)}×${Math.round(b.height)}`);
    }
    return out;
  });

  for(const vista of ['inicio', 'catalogo', 'pedir', 'cupom', 'entrega']){
    await p.click(`.app-aba[data-vista="${vista}"]`);
    await p.waitForTimeout(220);
    const ruins = await pequenos();
    ok(`${tela} · ${vista}: todo alvo de toque tem 44 px`, ruins.length === 0, ruins.slice(0,3).join(', '));
  }

  /* o carrinho é onde se aperta mais: + , − e remover */
  await p.click('.app-aba[data-vista="catalogo"]');
  await p.waitForTimeout(200);
  await p.evaluate(() => { for(let i = 0; i < 2; i++) document.querySelector('.card:not(.hide) .add').click(); });
  await p.click('#cartBtn');
  await p.waitForTimeout(400);
  const ruinsCart = await pequenos();
  ok(`${tela} · carrinho: todo alvo de toque tem 44 px`, ruinsCart.length === 0, ruinsCart.slice(0,3).join(', '));

  /* ---- atacado ---- */
  const pa = await ctx.newPage();
  await pa.goto(BASE + '/atacado.html', { waitUntil:'networkidle' });
  await entrar(pa, CNPJ, null);
  await pa.waitForTimeout(250);
  const ruinsBal = await pa.evaluate(() => {
    const out = [];
    for(const el of document.querySelectorAll('button,a[href],input')){
      const b = el.getBoundingClientRect();
      if(b.width === 0 || b.height === 0 || b.bottom < 0 || b.top > innerHeight) continue;
      if(b.height < 43) out.push(`${String(el.className) || el.tagName}:${Math.round(b.width)}×${Math.round(b.height)}`);
    }
    return out;
  });
  ok(`${tela} · balcão: todo alvo de toque tem 44 px`, ruinsBal.length === 0, ruinsBal.slice(0,3).join(', '));

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
    if(js) await entrar(p, CPF, null);
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
