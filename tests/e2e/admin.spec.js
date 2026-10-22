import { test, expect, abrir, pronto, semRolagemLateral, esperarLoja, irVista } from './apoio.js';

const ABAS = ['produtos', 'varejo', 'atacado', 'loja', 'publicacao'];

test.describe('painel do dono', () => {
  test.use({ admin: 'simulado' });
  for (const aba of ABAS) {
    test(`aba ${aba}`, async ({ page }) => {
      await abrir(page, '/admin.html');
      await page.click(`#t-${aba}`);
      await expect(page.locator(`#a-${aba}`)).toBeVisible();
      await expect(page.locator(`#t-${aba}`)).toHaveAttribute('aria-selected', 'true');
      await pronto(page);
      await semRolagemLateral(page);
      await expect(page).toHaveScreenshot(`admin-${aba}.png`);
    });
  }

  test('a tabela de produtos lista o catálogo publicado', async ({ page }) => {
    await abrir(page, '/admin.html');
    await expect(page.locator('#linhasProdutos tr')).toHaveCount(15);
    await expect(page.locator('#estado')).toHaveText('Sem alterações · igual ao que está no ar');
    await expect(page.locator('[data-regra="varejo.cupom.codigo"]')).toHaveValue('ZEROGRAU10');
  });

  test('setas trocam de aba', async ({ page }) => {
    await abrir(page, '/admin.html');
    await page.focus('#t-produtos');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#t-varejo')).toBeFocused();
    await expect(page.locator('#a-varejo')).toBeVisible();
  });

  test('mudar o preço vira rascunho e a loja mostra a prévia', async ({ page }) => {
    await abrir(page, '/admin.html');
    const preco = page.locator('#linhasProdutos tr[data-sku="red-bull-250"] input[data-campo="preco"]');
    await preco.fill('10,50');
    await preco.blur();
    await expect(page.locator('#estado')).toHaveText('Rascunho · 1 alteração · só neste navegador');
    await expect.poll(() => page.evaluate(() => !!localStorage.getItem('zg-admin-rascunho'))).toBe(true);
    await abrir(page, '/index.html');
    await esperarLoja(page);
    await expect(page.locator('.previa')).toBeVisible();
    await irVista(page, 'catalogo');
    await expect(page.locator('.card', { hasText: 'Red Bull' }).locator('.price s')).toHaveText('R$ 10,50');
  });

  test('descartar o rascunho volta ao publicado', async ({ page }) => {
    await abrir(page, '/admin.html');
    const preco = page.locator('#linhasProdutos tr[data-sku="red-bull-250"] input[data-campo="preco"]');
    await preco.fill('10,50');
    await preco.blur();
    page.once('dialog', d => d.accept());
    await page.click('#descartar');
    await expect(page.locator('#estado')).toHaveText('Sem alterações · igual ao que está no ar');
  });

  test('publicar sem chave do GitHub pergunta antes', async ({ page }) => {
    await abrir(page, '/admin.html');
    const preco = page.locator('#linhasProdutos tr[data-sku="red-bull-250"] input[data-campo="preco"]');
    await preco.fill('10,50');
    await preco.blur();
    await page.click('#publicar');
    await expect(page.locator('#dlgSemChave')).toBeVisible();
  });
});
