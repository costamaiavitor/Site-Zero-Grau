import { test, expect, abrir, pronto, semRolagemLateral, entrarVarejo, entrarAtacado, irVista } from './apoio.js';

test.describe('créditos e app instalável', () => {
  test('página de créditos', async ({ page }) => {
    await abrir(page, '/creditos.html');
    await expect(page.locator('h1')).toHaveText('Créditos das imagens');
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('creditos.png', { fullPage: true });
  });

  test('manifest com nome, ícones e modo app', async ({ page, request }) => {
    await abrir(page);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', 'manifest.webmanifest');
    const resposta = await request.get('/manifest.webmanifest');
    expect(resposta.ok()).toBe(true);
    const manifest = await resposta.json();
    expect(manifest.short_name).toBe('Zero Grau');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map(i => i.sizes)).toEqual(['192x192', '512x512', '512x512']);
    for (const icone of manifest.icons) expect((await request.get('/' + icone.src)).ok()).toBe(true);
  });
});

test.describe('service worker', () => {
  test.use({ serviceWorkers: 'allow' });
  test('registra o sw.js e guarda o essencial', async ({ page }) => {
    await abrir(page);
    const escopo = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(escopo).toMatch(/\/$/);
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).includes('zg-v1'))).toBe(true);
  });
});

test.describe('carga limpa do painel', () => {
  test.use({ admin: 'simulado' });
  test('sem erro de console e sem 404 no painel', async ({ page }) => {
    const erros = [];
    const quebrados = [];
    page.on('pageerror', e => erros.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) erros.push(m.text()); });
    page.on('response', r => { if (r.status() === 404) quebrados.push(r.url()); });
    await abrir(page, '/admin.html');
    await expect(page.locator('#a-produtos')).toBeVisible();
    expect(erros).toEqual([]);
    expect(quebrados).toEqual([]);
  });
});

test.describe('carga limpa', () => {
  test('sem erro de console e sem 404 nas três páginas', async ({ page }) => {
    const erros = [];
    const quebrados = [];
    page.on('pageerror', e => erros.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) erros.push(m.text()); });
    page.on('response', r => { if (r.status() === 404) quebrados.push(r.url()); });
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await pronto(page);
    await page.evaluate(() => sessionStorage.clear());
    await entrarAtacado(page);
    await abrir(page, '/creditos.html');
    expect(erros).toEqual([]);
    expect(quebrados).toEqual([]);
  });
});
