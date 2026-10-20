import { test, expect, abrir, criarConta, esperarLoja, irVista, adicionarAoCarrinho, abrirCarrinho, entrarAtacado, CPF } from './apoio.js';

const RED_BULL = 'Red Bull Energy Drink 250 ml';

async function trocarPara(page, conta) {
  await page.click('.conta-btn[data-trocar]');
  await expect(page.locator('#porta')).toHaveClass(/aberto/);
  if (conta.nova) {
    await page.click('#painelEntrar [data-painel="criar"]');
    await page.fill('#cDocInput', conta.doc);
    await page.fill('#nomeInput', conta.nome);
    await page.fill('#cEmailInput', conta.email);
    await page.fill('#cSenhaInput', conta.senha);
    await page.fill('#cConfInput', conta.senha);
    await page.click('#criarBtn');
  } else {
    await page.fill('#emailInput', conta.email);
    await page.fill('#senhaInput', conta.senha);
    await page.click('#docBtn');
  }
  await esperarLoja(page);
}

test.describe('carrinho por conta', () => {
  test('conta nova não herda o carrinho de outra e o carrinho volta com a conta', async ({ page }) => {
    await abrir(page);
    const ana = await criarConta(page, { doc: CPF, nome: 'Ana de Teste' });
    await esperarLoja(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, RED_BULL, 3);
    await expect(page.locator('#cartCount')).toHaveText('3');

    const bia = { nova: true, doc: CPF, nome: 'Bia de Teste', email: `bia.${Date.now()}@exemplo.com`, senha: 'gelada456' };
    await trocarPara(page, bia);
    await expect(page.locator('#cartCount')).toHaveText('0');
    await abrirCarrinho(page);
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await trocarPara(page, ana);
    await expect(page.locator('#cartCount')).toHaveText('3');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#cartCount')).toHaveText('3');
  });

  test('a chave antiga sem conta não vaza para quem entra', async ({ page }) => {
    await abrir(page);
    await page.evaluate(() => localStorage.setItem('zg-carrinho', JSON.stringify([['red-bull-250', 4]])));
    await criarConta(page, { doc: CPF });
    await esperarLoja(page);
    await expect(page.locator('#cartCount')).toHaveText('0');
  });

  test('os últimos pedidos são de cada conta', async ({ page }) => {
    await abrir(page);
    await page.evaluate(() => localStorage.setItem('zg-pedidos', JSON.stringify([{ em: Date.now(), total: 30, itens: [['red-bull-250', 3, 'Red Bull Energy Drink 250 ml']] }])));
    await criarConta(page, { doc: CPF });
    await esperarLoja(page);
    await abrirCarrinho(page);
    await expect(page.locator('#pedidosAntigos')).toBeHidden();
  });

  test('o pedido de atacado também é de cada conta', async ({ page }) => {
    await entrarAtacado(page);
    await page.locator('tr.item[data-sku="absolut-1l"] [data-acao="mais"]').click();
    await expect(page.locator('#barraCaixas')).toHaveText('1');
    await page.click('.conta-btn[data-trocar]');
    await page.click('#painelEntrar [data-painel="criar"]');
    await page.fill('#cDocInput', '11444777000161');
    await page.fill('#nomeInput', 'Outro Bar Ltda');
    await page.fill('#cEmailInput', `outro.${Date.now()}@exemplo.com`);
    await page.fill('#cSenhaInput', 'gelada789');
    await page.fill('#cConfInput', 'gelada789');
    await page.click('#criarBtn');
    await esperarLoja(page);
    await expect(page.locator('#barraCaixas')).toHaveText('0');
  });
});
