import { test, expect, abrir, entrarVarejo, entrarAtacado, irVista, abrirCarrinho, semRolagemLateral } from './apoio.js';

test.describe('sem rolagem lateral', () => {
  for (const vista of ['inicio', 'catalogo', 'pedir', 'cupom', 'entrega']) {
    test(`varejo, aba ${vista}`, async ({ page }) => {
      await entrarVarejo(page);
      await irVista(page, vista);
      await semRolagemLateral(page);
    });
  }

  test('varejo, carrinho aberto', async ({ page }) => {
    await entrarVarejo(page);
    await abrirCarrinho(page);
    await semRolagemLateral(page);
    const caixa = await page.locator('#cart').boundingBox();
    expect(caixa.x + caixa.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
  });

  test('atacado', async ({ page }) => {
    await entrarAtacado(page);
    await semRolagemLateral(page);
  });

  test('página /creditos.html', async ({ page }) => {
    await abrir(page, '/creditos.html');
    await semRolagemLateral(page);
  });
});

test.describe('sem rolagem lateral no painel', () => {
  test.use({ admin: 'simulado' });
  test('página /admin.html', async ({ page }) => {
    await abrir(page, '/admin.html');
    await expect(page.locator('#a-produtos')).toBeVisible();
    await semRolagemLateral(page);
  });
});
