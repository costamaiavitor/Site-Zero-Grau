import { test, expect, abrir, confirmarIdade, esperarLoja, irVista, adicionarAoCarrinho, CPF, SENHA } from './apoio.js';

const CATEGORIAS = [
  { id: 1, slug: 'cerveja', nome: 'Cervejas', detalhe: 'lata e long neck' },
  { id: 2, slug: 'destilado', nome: 'Destilados', detalhe: 'whisky, vodka, gin' }
];

const PRODUTOS = [
  { id: 10, categoria_id: 1, sku: 'heineken-350', marca: 'Heineken', nome: 'Lata 350 ml', volume: '350 ml', teor_alcoolico: '5%', embalagem: 'can', preco: '6.50', preco_promo: '5.99', unidades_caixa: 12, estoque: 48, gelada: true, alcoolica: true, retornavel: false, valor_casco: null, foto_url: null, ativo: true },
  { id: 11, categoria_id: 2, sku: 'absolut-1l', marca: 'Absolut', nome: 'Vodka Original 700 ml', volume: '700 ml', teor_alcoolico: '40%', embalagem: 'tall', preco: '69.90', preco_promo: null, unidades_caixa: 6, estoque: 12, gelada: false, alcoolica: true, retornavel: false, valor_casco: null, foto_url: 'absolut-1l', ativo: true },
  { id: 12, categoria_id: 1, sku: 'fora-de-linha', marca: 'Antiga', nome: 'Desativada 350 ml', volume: '350 ml', teor_alcoolico: '5%', embalagem: 'can', preco: '5.00', preco_promo: null, unidades_caixa: 12, estoque: 10, gelada: true, alcoolica: true, retornavel: false, valor_casco: null, foto_url: null, ativo: false }
];

const json = corpo => ({ status: 200, contentType: 'application/json', body: JSON.stringify(corpo) });

async function servirCatalogo(page, { produtos = PRODUTOS, falhar = 0 } = {}) {
  const chamadas = { produtos: 0 };
  await page.route('**/api/categorias', r => r.fulfill(json(CATEGORIAS)));
  await page.route('**/api/produtos', async r => {
    if (r.request().method() !== 'GET') return r.fallback();
    chamadas.produtos++;
    if (chamadas.produtos <= falhar) return r.fulfill({ status: 500, contentType: 'application/json', body: '{"erro":"Erro ao buscar produtos no banco de dados."}' });
    return r.fulfill(json(produtos));
  });
  return chamadas;
}

async function entrarComApi(page, caminho = '/index.html') {
  await page.route('**/api/auth/login', r => r.fulfill(json({
    token: 'jwt.cliente', usuario: { id: 5, nome: 'Cliente da API', email: 'api@exemplo.com', perfil: 'cliente', documento: '111.444.777-35', tipo_documento: 'cpf' }
  })));
  await abrir(page, caminho);
  await confirmarIdade(page);
  await page.fill('#emailInput', 'api@exemplo.com');
  await page.fill('#senhaInput', SENHA);
  await page.click('#docBtn');
  await esperarLoja(page);
}

test.describe('Etapa 3: catálogo vindo da API (GET /api/produtos)', () => {
  test.use({ api: true });

  test('a vitrine mostra os produtos ativos do banco com as categorias do banco', async ({ page }) => {
    await servirCatalogo(page);
    await entrarComApi(page);
    await irVista(page, 'catalogo');
    await expect(page.locator('.card')).toHaveCount(2);
    await expect(page.locator('.tab[data-cat]')).toHaveText(['Tudo', 'Cervejas', 'Destilados']);
    const heineken = page.locator('.card', { hasText: 'Heineken' });
    await expect(heineken.locator('.price b')).toContainText('5,99');
    await expect(heineken.locator('.price s')).toHaveText('R$ 6,50');
    await expect(page.locator('.card', { hasText: 'Desativada' })).toHaveCount(0);
    await page.click('.tab[data-cat="destilado"]');
    await expect(page.locator('.card:not(.hide)')).toHaveCount(1);
    await page.fill('#buscaInput', 'heineken');
    await page.click('.tab[data-cat="all"]');
    await expect(page.locator('.card:not(.hide)')).toHaveCount(1);
  });

  test('o carrinho usa o preço do banco', async ({ page }) => {
    await servirCatalogo(page);
    await entrarComApi(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, 'Heineken Lata 350 ml', 2);
    await page.click('#cartBtn');
    await expect(page.locator('#rSub')).toHaveText('R$ 11,98');
  });

  test('erro no servidor mostra a mensagem e o tentar de novo', async ({ page }) => {
    const chamadas = await servirCatalogo(page, { falhar: 1 });
    await entrarComApi(page);
    await irVista(page, 'catalogo');
    await expect(page.locator('#grid .estado-catalogo')).toContainText('Não deu para carregar o catálogo agora.');
    await page.click('[data-tentar-catalogo]');
    await expect(page.locator('.card')).toHaveCount(2);
    expect(chamadas.produtos).toBe(2);
  });

  test('catálogo vazio avisa', async ({ page }) => {
    await servirCatalogo(page, { produtos: [] });
    await entrarComApi(page);
    await irVista(page, 'catalogo');
    await expect(page.locator('#grid .estado-catalogo')).toContainText('Nenhum produto disponível no momento.');
  });

  test('enquanto carrega aparece o aviso de carregando', async ({ page }) => {
    let liberar;
    const espera = new Promise(r => { liberar = r; });
    await page.route('**/api/categorias', r => r.fulfill(json(CATEGORIAS)));
    await page.route('**/api/produtos', async r => { await espera; await r.fulfill(json(PRODUTOS)); });
    await page.goto('/index.html');
    await expect(page.locator('#grid .estado-catalogo')).toHaveText('Carregando o catálogo…');
    liberar();
    await expect(page.locator('#grid .card')).toHaveCount(2);
  });

  test('o carrinho salvo não se perde se o catálogo falhar', async ({ page }) => {
    await page.route('**/api/categorias', r => r.fulfill(json(CATEGORIAS)));
    await page.route('**/api/produtos', r => r.fulfill({ status: 500, body: '{}' }));
    await page.addInitScript(() => localStorage.setItem('zg-carrinho:id-5', JSON.stringify([['heineken-350', 3]])));
    await entrarComApi(page);
    await page.fill('#cepInput', '60160000');
    await page.click('#cepBtn');
    await expect(page.locator('#cepMsg')).toHaveClass(/ok/);
    expect(await page.evaluate(() => localStorage.getItem('zg-carrinho:id-5'))).toBe('[["heineken-350",3]]');
  });
});

test.describe('Etapa 3: atacado com o catálogo da API', () => {
  test.use({ api: true });
  test('a tabela usa o preço e as unidades por caixa do banco', async ({ page }) => {
    await servirCatalogo(page);
    await page.route('**/api/auth/login', r => r.fulfill(json({
      token: 'jwt.bar', usuario: { id: 6, nome: 'Bar da API', email: 'bar@exemplo.com', perfil: 'cliente', documento: '11.222.333/0001-81', tipo_documento: 'cnpj' }
    })));
    await abrir(page, '/atacado.html');
    await confirmarIdade(page);
    await page.fill('#emailInput', 'bar@exemplo.com');
    await page.fill('#senhaInput', SENHA);
    await page.click('#docBtn');
    await esperarLoja(page);
    await expect(page.locator('tr.item')).toHaveCount(2);
    const linha = page.locator('tr.item[data-sku="heineken-350"]');
    await expect(linha.locator('td').nth(0)).toHaveText('12 un.');
    await expect(linha.locator('td').nth(1)).toHaveText('R$ 4,68');
    await expect(linha.locator('td').nth(3)).toHaveText('4 cx');
  });
});

test.describe('Etapa 2: CRUD de produtos pelo painel (POST, PUT, DELETE /api/produtos)', () => {
  test.use({ api: true, admin: 'api' });

  test('o painel lista os produtos do banco', async ({ page }) => {
    await servirCatalogo(page);
    await abrir(page, '/admin.html');
    await expect(page.locator('#linhasProdutos tr')).toHaveCount(2);
    await expect(page.locator('#linhasProdutos tr[data-sku="heineken-350"] input[data-campo="preco"]')).toHaveValue('6,50');
    await expect(page.locator('#estado')).toHaveText('Sem alterações · igual ao que está no ar');
  });

  test('editar, criar e remover gravam na API com o token', async ({ page }) => {
    await servirCatalogo(page);
    const pedidos = [];
    await page.route(/\/api\/produtos(\/.*)?$/, async r => {
      const req = r.request();
      if (req.method() === 'GET') return r.fallback();
      pedidos.push({ metodo: req.method(), url: new URL(req.url()).pathname, corpo: req.postDataJSON(), auth: req.headers().authorization });
      return r.fulfill(json({ mensagem: 'ok', produto: { id: 99 } }));
    });
    page.on('dialog', d => d.accept());
    await abrir(page, '/admin.html');
    await expect(page.locator('#linhasProdutos tr')).toHaveCount(2);

    const preco = page.locator('#linhasProdutos tr[data-sku="heineken-350"] input[data-campo="preco"]');
    await preco.fill('7,20');
    await preco.blur();
    await page.locator('#linhasProdutos tr[data-sku="absolut-1l"] [data-acao="tirar"]').click();
    await expect(page.locator('#linhasProdutos tr[data-sku="absolut-1l"]')).toHaveCount(0);
    await expect(page.locator('#estado')).toHaveText(/^Rascunho · 2 alterações/);

    await page.click('#publicar');
    await expect.poll(() => pedidos.length).toBe(2);
    const put = pedidos.find(p => p.metodo === 'PUT');
    expect(put.url).toBe('/api/produtos/heineken-350');
    expect(put.corpo).toMatchObject({ preco: 7.2, categoria_id: 1, embalagem: 'can', unidades_caixa: 12, estoque: 48, ativo: true });
    expect(put.corpo).not.toHaveProperty('sku');
    expect(put.auth).toMatch(/^Bearer /);
    const del = pedidos.find(p => p.metodo === 'DELETE');
    expect(del.url).toBe('/api/produtos/absolut-1l');
  });

  test('produto novo vai por POST com a categoria do banco', async ({ page }) => {
    await servirCatalogo(page);
    const pedidos = [];
    await page.route(/\/api\/produtos(\/.*)?$/, async r => {
      const req = r.request();
      if (req.method() === 'GET') return r.fallback();
      pedidos.push({ metodo: req.method(), corpo: req.postDataJSON() });
      return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ produto: { id: 77 } }) });
    });
    page.on('dialog', d => d.accept());
    await abrir(page, '/admin.html');
    await expect(page.locator('#linhasProdutos tr')).toHaveCount(2);
    await page.click('#novoProduto');
    const nova = page.locator('#linhasProdutos tr.nova').first();
    await nova.locator('input[data-campo="marca"]').fill('Brahma');
    await nova.locator('input[data-campo="nome"]').fill('Duplo Malte 350 ml');
    await nova.locator('input[data-campo="vol"]').fill('350 ml');
    await nova.locator('input[data-campo="teor"]').fill('4,7%');
    await nova.locator('input[data-campo="preco"]').fill('4,99');
    await nova.locator('input[data-campo="estoque"]').fill('60');
    await nova.locator('input[data-campo="estoque"]').blur();
    await page.click('#publicar');
    await expect.poll(() => pedidos.length).toBe(1);
    expect(pedidos[0].metodo).toBe('POST');
    expect(pedidos[0].corpo).toMatchObject({ marca: 'Brahma', nome: 'Duplo Malte 350 ml', preco: 4.99, estoque: 60, ativo: true });
    expect(pedidos[0].corpo.categoria_id).toBeGreaterThan(0);
    expect(pedidos[0].corpo.cat).toBeTruthy();
  });

  test('servidor fora do ar avisa no topo do painel', async ({ page }) => {
    await page.route('**/api/categorias', r => r.abort());
    await page.route('**/api/produtos', r => r.abort());
    await abrir(page, '/admin.html');
    await expect(page.locator('#estado')).toContainText('Não deu para carregar os produtos do servidor');
  });
});
