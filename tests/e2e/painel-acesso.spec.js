import { test, expect, abrir, criarConta, esperarLoja, CPF } from './apoio.js';

test.describe('RF21 painel sem login', () => {
  test('sem conta vai para a loja e o painel nunca aparece', async ({ page }) => {
    const visto = [];
    await page.exposeFunction('__registrarPainel', v => visto.push(v));
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        if (!location.pathname.endsWith('/admin.html')) return;
        const corpo = document.body;
        window.__registrarPainel(corpo ? getComputedStyle(corpo).visibility : 'sem-corpo');
      });
    });
    await page.goto('/admin.html');
    await page.waitForURL(/index\.html$/);
    expect(visto.every(v => v !== 'visible')).toBe(true);
  });

  test('sem JavaScript o painel fica escondido', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/admin.html');
    await expect(page.locator('#a-produtos')).toBeHidden();
    await expect(page.locator('#publicar')).toBeHidden();
    await ctx.close();
  });
});

test.describe('RF21 cliente comum', () => {
  test.use({ admin: false, api: false });
  test('conta de cliente no modo simulado é mandada para a loja', async ({ page }) => {
    await abrir(page);
    await criarConta(page, { doc: CPF });
    await esperarLoja(page);
    await page.goto('/admin.html');
    await page.waitForURL(/index\.html$/);
  });
});

test.describe('RF21 dono no modo simulado', () => {
  test.use({ admin: 'simulado' });
  test('e-mail da lista de administradores abre o painel', async ({ page }) => {
    await abrir(page, '/admin.html');
    await expect(page).toHaveURL(/admin\.html$/);
    await expect(page.locator('#a-produtos')).toBeVisible();
  });
});

test.describe('RF21 com a API', () => {
  test.describe('token de administrador', () => {
    test.use({ api: true, admin: 'api' });
    test('abre o painel', async ({ page }) => {
      await abrir(page, '/admin.html');
      await expect(page.locator('#a-produtos')).toBeVisible();
    });
  });
  test.describe('token de cliente', () => {
    test.use({ api: true, admin: 'api-cliente' });
    test('vai para a loja', async ({ page }) => {
      await page.goto('/admin.html');
      await page.waitForURL(/index\.html$/);
    });
  });
  test.describe('token vencido', () => {
    test.use({ api: true, admin: 'api-vencido' });
    test('vai para a loja', async ({ page }) => {
      await page.goto('/admin.html');
      await page.waitForURL(/index\.html$/);
    });
  });
});
