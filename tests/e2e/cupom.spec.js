import { test, expect, abrir, entrarVarejo, irVista, adicionarAoCarrinho, abrirCarrinho, calcularCep, esperarLoja } from './apoio.js';

const ABSOLUT = 'Absolut Vodka Original 700 ml';

async function aplicar(page, codigo = 'ZEROGRAU10') {
  await page.fill('#cupomInput', codigo);
  await page.click('#cupomBtn');
}

async function enviarPedido(page) {
  await page.click('#finalizar');
  await calcularCep(page, '#ckCep', '#ckCepBtn', '60160000');
  await expect(page.locator('#ckCepMsg')).toHaveClass(/ok/);
  await page.fill('#ckNumero', '100');
  await page.check('input[name="fechar"][value="entrega"]');
  await page.check('input[name="forma"][value="cartao"]');
  await page.click('#ckEnviar');
  await expect(page.locator('[data-etapa="feito"]')).toBeVisible();
}

test.describe('RF09 cupom configurável', () => {
  test('o teto limita o desconto', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, ABSOLUT, 6);
    await abrirCarrinho(page);
    await aplicar(page);
    await expect(page.locator('#rSub')).toHaveText('R$ 359,40');
    await expect(page.locator('#rDesc')).toHaveText('− R$ 30,00');
  });

  test('abaixo do teto vale o percentual', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, ABSOLUT, 2);
    await abrirCarrinho(page);
    await aplicar(page);
    await expect(page.locator('#rDesc')).toHaveText('− R$ 11,98');
  });

  test('um uso por CPF', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, ABSOLUT, 2);
    await abrirCarrinho(page);
    await aplicar(page);
    await expect(page.locator('#cupomMsg')).toHaveClass(/ok/);
    await enviarPedido(page);
    await page.click('#feitoFechar');
    await adicionarAoCarrinho(page, ABSOLUT, 2);
    await abrirCarrinho(page);
    await aplicar(page);
    await expect(page.locator('#cupomMsg')).toHaveText('Este cupom já foi usado neste CPF.');
    await expect(page.locator('#linhaDesconto')).toBeHidden();
  });

  test('pedido sem cupom não gasta o uso', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, ABSOLUT, 2);
    await abrirCarrinho(page);
    await enviarPedido(page);
    await page.click('#feitoFechar');
    await adicionarAoCarrinho(page, ABSOLUT, 2);
    await abrirCarrinho(page);
    await aplicar(page);
    await expect(page.locator('#cupomMsg')).toHaveClass(/ok/);
  });
});

test.describe('RF09 cupom vencido', () => {
  test.use({ hora: '2027-01-02T20:00:00-03:00' });
  test('depois da validade o cupom é recusado e a página avisa', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'cupom');
    await expect(page.locator('#v-cupom [data-regra="cupomValidadeTexto"]')).toHaveText('Venceu em 31/12/2026');
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, ABSOLUT, 2);
    await abrirCarrinho(page);
    await aplicar(page);
    await expect(page.locator('#cupomMsg')).toHaveText('Este cupom venceu em 31/12/2026.');
  });
});

test.describe('RF09 cupom no painel', () => {
  test.use({ admin: 'simulado' });
  test('teto e validade editados no painel valem na loja', async ({ page }) => {
    await abrir(page, '/admin.html');
    await page.click('#t-varejo');
    await expect(page.locator('[data-regra="varejo.cupom.teto"]')).toHaveValue('30,00');
    await expect(page.locator('[data-regra="varejo.cupom.validade"]')).toHaveValue('31/12/2026');
    await page.fill('[data-regra="varejo.cupom.codigo"]', 'gelou20');
    await page.fill('[data-regra="varejo.cupom.desconto"]', '20');
    await page.fill('[data-regra="varejo.cupom.teto"]', '0');
    await page.fill('[data-regra="varejo.cupom.validade"]', '');
    await page.fill('[data-regra="varejo.cupom.minimo"]', '50');
    await expect(page.locator('#estado')).toHaveText(/^Rascunho · 5 alterações/);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('zg-admin-rascunho') || 'null')?.varejo?.cupom)).toEqual({ codigo: 'GELOU20', desconto: 0.2, teto: 0, minimo: 50, validade: '' });
    await abrir(page, '/index.html');
    await esperarLoja(page);
    await irVista(page, 'cupom');
    await expect(page.locator('#code')).toHaveText('GELOU20');
    await expect(page.locator('#v-cupom [data-regra="cupomTetoTexto"]')).toHaveText('Sem teto de desconto');
    await expect(page.locator('#v-cupom [data-regra="cupomValidadeTexto"]')).toHaveText('Sem prazo de validade');
  });

  test('data inválida no painel é recusada', async ({ page }) => {
    await abrir(page, '/admin.html');
    await page.click('#t-varejo');
    await page.fill('[data-regra="varejo.cupom.validade"]', '31/02/26');
    await expect(page.locator('#a-varejo .adm-erro')).toHaveText('Data como 31/12/2026, ou vazio.');
  });
});
