// O site inteiro com a API e o banco de verdade (sem nenhuma resposta simulada,
// só o ViaCEP do navegador). Ver playwright.real.config.js.
import { test, expect, abrir, confirmarIdade, preencherCadastro, esperarLoja, irVista, adicionarAoCarrinho, abrirCarrinho, calcularCep, emailNovo, pronto } from '../e2e/apoio.js';
import { ADMIN } from '../../playwright.real.config.js';

const SENHA = 'gelada123';
let numero = 0;
const documento = tamanho => String(Date.now() * 100 + (++numero)).slice(-tamanho);
const reais = texto => Number(texto.replace(/[^\d,]/g, '').replace(',', '.'));

async function cadastrar(page, caminho, { cnpj = false } = {}) {
  const conta = { email: emailNovo(cnpj ? 'bar' : 'cliente'), doc: documento(cnpj ? 14 : 11), nome: cnpj ? 'Bar de Teste Ltda' : 'Cliente de Teste' };
  await abrir(page, caminho);
  await confirmarIdade(page);
  await preencherCadastro(page, { ...conta, senha: SENHA });
  await page.click('#criarBtn');
  await esperarLoja(page);
  return conta;
}

async function entrar(page, caminho, email, senha = SENHA) {
  await abrir(page, caminho);
  await confirmarIdade(page);
  await page.fill('#emailInput', email);
  await page.fill('#senhaInput', senha);
  await page.click('#docBtn');
}

async function tokenDe(request, email, senha = SENHA) {
  const resposta = await request.post('/api/auth/login', { data: { email, senha } });
  expect(resposta.ok()).toBeTruthy();
  return (await resposta.json()).token;
}

test.describe.configure({ mode: 'serial' });

test('conta criada num navegador entra em outro', async ({ page, browser }) => {
  const conta = await cadastrar(page, '/index.html');
  await irVista(page, 'catalogo');
  await expect(page.locator('.add[data-sku="guinness-draught-500"]')).toBeVisible();

  const outro = await browser.newContext({ baseURL: test.info().project.use.baseURL, serviceWorkers: 'block' });
  const outraPagina = await outro.newPage();
  await entrar(outraPagina, '/index.html', conta.email);
  await esperarLoja(outraPagina);
  await irVista(outraPagina, 'catalogo');
  await expect(outraPagina.locator('.add[data-sku="guinness-draught-500"]')).toBeVisible();
  await outro.close();
});

test('varejo: o total do carrinho é o mesmo que o servidor grava, e o pedido aparece na Minha conta', async ({ page, request }) => {
  const conta = await cadastrar(page, '/index.html');
  await irVista(page, 'catalogo');
  await adicionarAoCarrinho(page, 'Guinness Draught Stout 500 ml', 2);
  await abrirCarrinho(page);
  await page.click('#finalizar');
  await calcularCep(page, '#ckCep', '#ckCepBtn', '60160000');
  await expect(page.locator('#ckCepMsg')).toHaveClass(/ok/);
  await page.fill('#ckNumero', '100');
  await page.fill('#ckObs', 'portão azul');
  await page.check('input[name="fechar"][value="entrega"]');
  await page.check('input[name="forma"][value="pix"]');
  const totalNaTela = reais(await page.locator('#ckTotal').textContent());
  await page.click('#ckEnviar');
  await expect(page.locator('#feitoServidor')).toHaveText(/^Pedido nº \d+ registrado na loja\.$/);
  const id = Number((await page.locator('#feitoServidor').textContent()).match(/\d+/)[0]);

  const meus = await (await request.get('/api/pedidos/meus', { headers: { Authorization: `Bearer ${await tokenDe(request, conta.email)}` } })).json();
  expect(meus).toHaveLength(1);
  expect(meus[0]).toMatchObject({ id, canal: 'varejo', modalidade: 'entrega', status: 'recebido', observacao: 'portão azul', destinatario: 'Cliente de Teste' });
  expect(meus[0].itens).toMatchObject([{ quantidade: 2, unidade: 'un', produto: { sku: 'guinness-draught-500' } }]);
  expect(meus[0].endereco).toMatchObject({ cep: '60160000', bairro: 'Meireles', cidade: 'Fortaleza', numero: '100' });
  expect(Number(meus[0].total)).toBe(totalNaTela);

  await abrir(page, '/conta/');
  await expect(page.locator('.zg-pedido')).toHaveCount(1);
  await expect(page.locator('.zg-pedido')).toContainText(`Nº ${id}`);
  await expect(page.locator('.zg-pedido .zg-badge-status')).toHaveText('Recebido');
});

test('atacado: CNPJ monta o pedido por caixa e o servidor grava o mesmo total', async ({ page, request }) => {
  const conta = await cadastrar(page, '/atacado.html', { cnpj: true });
  await expect(page).toHaveURL(/atacado\.html/);
  const linha = page.locator('tr.item[data-sku="absolut-1l"]');
  await linha.locator('[data-acao="mais"]').click();
  await linha.locator('[data-acao="mais"]').click();
  await expect(page.locator('#enviar')).toBeEnabled();
  const totalNaTela = reais(await page.locator('#rTotal').textContent());
  await page.click('#enviar');
  await expect(page.locator('#toastMsg')).toHaveText(/^Pedido nº \d+ registrado na loja$/);

  const meus = await (await request.get('/api/pedidos/meus', { headers: { Authorization: `Bearer ${await tokenDe(request, conta.email)}` } })).json();
  expect(meus).toHaveLength(1);
  expect(meus[0]).toMatchObject({ canal: 'atacado', status: 'recebido' });
  expect(meus[0].itens).toMatchObject([{ quantidade: 2, unidade: 'cx', produto: { sku: 'absolut-1l' } }]);
  expect(Number(meus[0].total)).toBe(totalNaTela);
});

test('painel: o admin entra direto, muda um preço no banco e a loja mostra o preço novo', async ({ page, browser }) => {
  page.on('dialog', dialogo => dialogo.accept());
  await entrar(page, '/index.html', ADMIN.email, ADMIN.senha);
  await page.waitForURL(/admin\.html/);
  await pronto(page);
  const preco = page.locator('#linhasProdutos tr[data-sku="guinness-draught-500"] input[data-campo="preco"]');
  await expect(preco).toBeVisible();
  await preco.fill('23,45');
  await preco.blur();
  await page.click('#publicar');
  await expect(page.locator('#estado')).not.toHaveText(/Rascunho/, { timeout: 15_000 });

  const cliente = await browser.newContext({ baseURL: test.info().project.use.baseURL, serviceWorkers: 'block' });
  const loja = await cliente.newPage();
  const resposta = await loja.request.get('/api/produtos/guinness-draught-500');
  expect(Number((await resposta.json()).preco)).toBe(23.45);
  await cliente.close();
});

test('pedidos do painel: o admin vê os pedidos do banco e cancela um, devolvendo o estoque', async ({ page, request }) => {
  const token = await tokenDe(request, ADMIN.email, ADMIN.senha);
  const antes = (await (await request.get('/api/produtos/absolut-1l')).json()).estoque;
  await entrar(page, '/index.html', ADMIN.email, ADMIN.senha);
  await page.waitForURL(/admin\.html/);
  await abrir(page, '/conta/pedidos.html');
  const linhas = page.locator('tr[data-pedido]');
  await expect(linhas).toHaveCount(2);
  const atacado = linhas.filter({ hasText: 'Bar de Teste Ltda' });
  await expect(atacado).toContainText('2 cx');
  const id = await atacado.getAttribute('data-pedido');
  await atacado.locator('select').selectOption('cancelado');
  await expect(page.locator('.zg-aviso')).toHaveText(`Pedido nº ${id}: Cancelado.`);

  const pedido = await (await request.get(`/api/pedidos/${id}`, { headers: { Authorization: `Bearer ${token}` } })).json();
  expect(pedido.status).toBe('cancelado');
  const depois = (await (await request.get('/api/produtos/absolut-1l')).json()).estoque;
  expect(depois).toBeGreaterThan(antes);
});

test('cliente comum não abre o painel nem a lista de pedidos', async ({ page, request }) => {
  const conta = await cadastrar(page, '/index.html');
  await abrir(page, '/admin.html');
  await expect(page).not.toHaveURL(/admin\.html/);
  const resposta = await request.get('/api/pedidos', { headers: { Authorization: `Bearer ${await tokenDe(request, conta.email)}` } });
  expect(resposta.status()).toBe(403);
});
