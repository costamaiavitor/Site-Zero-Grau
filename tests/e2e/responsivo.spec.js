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

  for (const caminho of ['/admin.html', '/creditos.html']) {
    test(`página ${caminho}`, async ({ page }) => {
      await abrir(page, caminho);
      await semRolagemLateral(page);
    });
  }
});
