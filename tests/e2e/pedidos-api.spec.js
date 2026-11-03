import { test, expect, abrir, confirmarIdade, esperarLoja, entrarVarejo, irVista, adicionarAoCarrinho, abrirCarrinho, calcularCep, abertos, semRolagemLateral, SENHA } from './apoio.js';

const json = (corpo, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(corpo) });

const PEDIDOS = [
  {
    id: 41, criado_em: '2026-10-15T23:00:00Z', status: 'recebido', total: '126.62', canal: 'varejo', modalidade: 'entrega',
    usuario: { nome: 'Ana Cliente', email: 'ana@exemplo.com' },
    itens: [{ quantidade: 2, unidade: 'un', produto: { sku: 'absolut-1l', marca: 'Absolut', nome: 'Vodka Original 700 ml' } }]
  },
  {
    id: 42, criado_em: '2026-10-16T20:00:00Z', status: 'em_preparo', total: '644.84', canal: 'atacado', modalidade: 'entrega',
    usuario: { nome: 'Bar do Zé Ltda', email: 'bar@exemplo.com' },
    itens: [{ quantidade: 2, unidade: 'cx', produto: { sku: 'absolut-1l', marca: 'Absolut', nome: 'Vodka Original 700 ml' } }]
  }
];

test.describe('links novos', () => {
  test('a loja leva à Minha conta', async ({ page }) => {
    await entrarVarejo(page);
    await expect(page.getByRole('link', { name: 'Minha conta' })).toHaveAttribute('href', 'conta/');
    await semRolagemLateral(page);
  });
});

test.describe('RF19 página de pedidos do painel (React + Bootstrap)', () => {
  test('quem não é administrador não vê os pedidos', async ({ page }) => {
    await abrir(page, '/conta/pedidos.html');
    await expect(page.getByRole('heading', { name: 'Só administradores veem os pedidos' })).toBeVisible();
    await semRolagemLateral(page);
  });

  test.describe('modo simulado', () => {
    test.use({ admin: 'simulado' });
    test('o administrador vê a explicação de como os pedidos chegam', async ({ page }) => {
      await abrir(page, '/conta/pedidos.html');
      await expect(page.getByRole('heading', { name: 'Os pedidos aparecem aqui com a API ligada' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Voltar ao painel' }).first()).toHaveAttribute('href', '../admin.html');
      await semRolagemLateral(page);
    });

    test('o painel tem o atalho para os pedidos', async ({ page }) => {
      await abrir(page, '/admin.html');
      await expect(page.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('href', 'conta/pedidos.html');
    });
  });

  test.describe('com a API', () => {
    test.use({ api: true, admin: 'api' });

    test('lista, conta por status, filtra e busca', async ({ page }) => {
      await page.route('**/api/pedidos', r => r.fulfill(json(PEDIDOS)));
      await abrir(page, '/conta/pedidos.html');
      await expect(page.locator('tr[data-pedido]')).toHaveCount(2);
      await expect(page.locator('tr[data-pedido]').first()).toContainText('Bar do Zé Ltda');
      await expect(page.locator('tr[data-pedido="41"]')).toContainText('R$ 126,62');
      await expect(page.locator('tr[data-pedido="42"]')).toContainText('2 cx Absolut Vodka Original 700 ml');
      await expect(page.getByRole('button', { name: /Em preparo/ })).toContainText('1');
      await page.selectOption('#filtroStatus', 'recebido');
      await expect(page.locator('tr[data-pedido]')).toHaveCount(1);
      await page.selectOption('#filtroStatus', 'todos');
      await page.fill('#buscaPedido', 'ze');
      await expect(page.locator('tr[data-pedido]')).toHaveCount(1);
      await expect(page.locator('tr[data-pedido="42"]')).toBeVisible();
      await semRolagemLateral(page);
    });

    test('mudar o status manda PATCH com o token', async ({ page }) => {
      let pedido = null;
      await page.route('**/api/pedidos', r => r.fulfill(json(PEDIDOS)));
      await page.route('**/api/pedidos/41/status', async r => {
        pedido = { metodo: r.request().method(), corpo: r.request().postDataJSON(), auth: r.request().headers().authorization };
        await r.fulfill(json({ id: 41, status: 'confirmado' }));
      });
      await abrir(page, '/conta/pedidos.html');
      await page.selectOption('tr[data-pedido="41"] select', 'confirmado');
      await expect(page.locator('.zg-aviso')).toHaveText('Pedido nº 41: Confirmado.');
      expect(pedido).toMatchObject({ metodo: 'PATCH', corpo: { status: 'confirmado' } });
      expect(pedido.auth).toMatch(/^Bearer /);
    });

    test('se o servidor recusar, o status volta ao que era', async ({ page }) => {
      await page.route('**/api/pedidos', r => r.fulfill(json(PEDIDOS)));
      await page.route('**/api/pedidos/41/status', r => r.fulfill(json({ erro: 'Status inválido.' }, 400)));
      await abrir(page, '/conta/pedidos.html');
      await page.selectOption('tr[data-pedido="41"] select', 'entregue');
      await expect(page.locator('.zg-aviso')).toHaveText('Não mudou o status do pedido nº 41: Status inválido.');
      await expect(page.locator('tr[data-pedido="41"] select')).toHaveValue('recebido');
    });

    test('rota que ainda não existe avisa e deixa tentar de novo', async ({ page }) => {
      let chamadas = 0;
      await page.route('**/api/pedidos', r => { chamadas++; return r.fulfill({ status: 404, contentType: 'text/html', body: 'Cannot GET' }); });
      await abrir(page, '/conta/pedidos.html');
      await expect(page.getByRole('alert')).toContainText('O servidor ainda não tem essa função.');
      await page.getByRole('button', { name: 'Tentar de novo' }).click();
      await expect.poll(() => chamadas).toBe(2);
    });
  });
});

test.describe('RF14 Minha conta com o histórico do servidor', () => {
  test.use({ api: true });
  test('mostra número e status dos pedidos de /api/pedidos/meus', async ({ page }) => {
    await page.route('**/api/auth/login', r => r.fulfill(json({
      token: 'jwt.cliente', usuario: { id: 5, nome: 'Ana Cliente', email: 'ana@exemplo.com', perfil: 'cliente', documento: '111.444.777-35', tipo_documento: 'cpf' }
    })));
    await page.route('**/api/categorias', r => r.fulfill(json([])));
    await page.route('**/api/produtos', r => r.fulfill(json([])));
    await page.route('**/api/pedidos/meus', r => r.fulfill(json([PEDIDOS[0]])));
    await abrir(page);
    await confirmarIdade(page);
    await page.fill('#emailInput', 'ana@exemplo.com');
    await page.fill('#senhaInput', SENHA);
    await page.click('#docBtn');
    await esperarLoja(page);
    await abrir(page, '/conta/');
    await expect(page.locator('.zg-pedido')).toHaveCount(1);
    await expect(page.locator('.zg-pedido')).toContainText('Nº 41');
    await expect(page.locator('.zg-pedido .zg-badge-status')).toHaveText('Recebido');
    await expect(page.getByText('Os pedidos registrados na loja')).toBeVisible();
  });
});

test.describe('RF10 checkout grava o pedido na API', () => {
  test.use({ api: true });

  async function lojaComPedido(page, respostaPedido) {
    const recebidos = [];
    await page.route('**/api/auth/login', r => r.fulfill(json({
      token: 'jwt.cliente', usuario: { id: 5, nome: 'Ana Cliente', email: 'ana@exemplo.com', perfil: 'cliente', documento: '111.444.777-35', tipo_documento: 'cpf' }
    })));
    await page.route('**/api/categorias', r => r.fulfill(json([{ id: 2, slug: 'destilado', nome: 'Destilados' }])));
    await page.route('**/api/produtos', r => r.fulfill(json([
      { id: 11, categoria_id: 2, sku: 'absolut-1l', marca: 'Absolut', nome: 'Vodka Original 700 ml', volume: '700 ml', teor_alcoolico: '40%', embalagem: 'tall', preco: '69.90', preco_promo: '59.90', unidades_caixa: 6, estoque: 52, gelada: true, alcoolica: true, retornavel: false, valor_casco: null, foto_url: 'absolut-1l', ativo: true }
    ])));
    await page.route('**/api/pedidos', async r => {
      recebidos.push({ corpo: r.request().postDataJSON(), auth: r.request().headers().authorization });
      await r.fulfill(respostaPedido);
    });
    await abrir(page);
    await confirmarIdade(page);
    await page.fill('#emailInput', 'ana@exemplo.com');
    await page.fill('#senhaInput', SENHA);
    await page.click('#docBtn');
    await esperarLoja(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, 'Absolut Vodka Original 700 ml', 2);
    await abrirCarrinho(page);
    await page.click('#finalizar');
    await calcularCep(page, '#ckCep', '#ckCepBtn', '60160000');
    await expect(page.locator('#ckCepMsg')).toHaveClass(/ok/);
    await page.fill('#ckNumero', '100');
    await page.fill('#ckObs', 'portão azul');
    await page.check('input[name="fechar"][value="entrega"]');
    await page.check('input[name="forma"][value="dinheiro"]');
    await page.fill('#ckTroco', '200');
    await page.click('#ckEnviar');
    return recebidos;
  }

  test('manda o pedido com itens, entrega e pagamento e mostra o número', async ({ page }) => {
    const recebidos = await lojaComPedido(page, json({ pedido: { id: 77 } }, 201));
    await expect(page.locator('#feitoServidor')).toHaveText('Pedido nº 77 registrado na loja.');
    expect(await abertos(page)).toHaveLength(1);
    expect(recebidos).toHaveLength(1);
    expect(recebidos[0].auth).toBe('Bearer jwt.cliente');
    expect(recebidos[0].corpo).toMatchObject({
      canal: 'varejo',
      itens: [{ sku: 'absolut-1l', quantidade: 2, unidade: 'un' }],
      cupom: null,
      entrega: { modalidade: 'entrega', cep: '60160000', logradouro: 'Rua Silva Paulet', numero: '100', destinatario: 'Ana Cliente' },
      pagamento: { momento: 'entrega', forma: 'dinheiro', troco_para: 200, txid: null },
      observacao: 'portão azul',
      agendado: false
    });
  });

  test('sem a rota no servidor o pedido segue pelo WhatsApp e avisa', async ({ page }) => {
    await lojaComPedido(page, { status: 404, contentType: 'text/html', body: 'Cannot POST' });
    await expect(page.locator('#feitoServidor')).toContainText('O pedido seguiu pelo WhatsApp, mas não foi registrado no sistema da loja');
    expect(await abertos(page)).toHaveLength(1);
    await expect(page.locator('[data-etapa="feito"]')).toBeVisible();
  });
});

test.describe('modo simulado não chama a API no checkout', () => {
  test('o aviso de registro fica escondido', async ({ page }) => {
    let chamou = false;
    await page.route('**/api/**', r => { chamou = true; return r.abort(); });
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, 'Absolut Vodka Original 700 ml', 2);
    await abrirCarrinho(page);
    await page.click('#finalizar');
    await calcularCep(page, '#ckCep', '#ckCepBtn', '60160000');
    await expect(page.locator('#ckCepMsg')).toHaveClass(/ok/);
    await page.fill('#ckNumero', '100');
    await page.check('input[name="fechar"][value="entrega"]');
    await page.check('input[name="forma"][value="cartao"]');
    await page.click('#ckEnviar');
    await expect(page.locator('[data-etapa="feito"]')).toBeVisible();
    await expect(page.locator('#feitoServidor')).toBeHidden();
    expect(chamou).toBe(false);
  });
});
