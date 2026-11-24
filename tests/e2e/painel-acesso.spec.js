import { test, expect, abrir, criarConta, esperarLoja, confirmarIdade, tokenDeTeste, CPF, CNPJ, SENHA, EMAIL_ADMIN, HORA_ABERTA } from './apoio.js';

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

test.describe('RF21 dono entra direto no painel', () => {
  test.use({ admin: 'simulado' });

  test('ao criar a conta com o e-mail de administrador, vai para o painel e não para a vitrine', async ({ page }) => {
    await abrir(page);
    await criarConta(page, { doc: CPF, email: EMAIL_ADMIN });
    await page.waitForURL(/admin\.html$/);
    await expect(page.locator('#a-produtos')).toBeVisible();
  });

  test('com CNPJ também vai para o painel, e não para o atacado', async ({ page }) => {
    await abrir(page, '/atacado.html');
    await criarConta(page, { doc: CNPJ, nome: 'Zero Grau Ltda', email: EMAIL_ADMIN });
    await page.waitForURL(/admin\.html$/);
    await expect(page.locator('#a-produtos')).toBeVisible();
  });

  test('sem a sessão da aba (aba nova), o painel manda para a porta e o login leva de volta ao painel', async ({ page }) => {
    await abrir(page);
    await criarConta(page, { doc: CPF, email: EMAIL_ADMIN });
    await page.waitForURL(/admin\.html$/);

    // Uma aba nova começa sem o sessionStorage; a conta continua no localStorage.
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('/index.html');
    await confirmarIdade(page);
    await page.fill('#emailInput', EMAIL_ADMIN);
    await page.fill('#senhaInput', SENHA);
    await page.click('#docBtn');
    await page.waitForURL(/admin\.html$/);
    await expect(page.locator('#a-produtos')).toBeVisible();
  });

  const entrarComoDono = async page => {
    await confirmarIdade(page);
    await page.fill('#emailInput', EMAIL_ADMIN);
    await page.fill('#senhaInput', SENHA);
    await page.click('#docBtn');
  };

  const ficaNaVitrine = async (page, url) => {
    await esperarLoja(page);
    await expect(page).toHaveURL(url);
    await expect(page.locator('#a-produtos')).toHaveCount(0);
  };

  test('os botões "Ver varejo" e "Ver atacado" do painel abrem as lojas em prévia', async ({ page }) => {
    await abrir(page, '/admin.html');
    await expect(page.getByRole('link', { name: 'Ver varejo' })).toHaveAttribute('href', 'index.html?previa');
    await expect(page.getByRole('link', { name: 'Ver atacado' })).toHaveAttribute('href', 'atacado.html?previa');
  });

  test('pelo botão "Ver varejo" do painel, a aba nova pede o login e fica na vitrine', async ({ page }) => {
    await page.context().route(/\/js\/config\.js/, r => r.fulfill({
      contentType: 'text/javascript; charset=utf-8',
      body: `const ZG_CONFIG = Object.assign(${JSON.stringify({ usarMock: true, adminsSimulados: [EMAIL_ADMIN] })}, { apiBase: location.origin + "/api" });`
    }));
    await abrir(page);
    await criarConta(page, { doc: CPF, email: EMAIL_ADMIN });
    await page.waitForURL(/admin\.html$/);

    const [aba] = await Promise.all([page.waitForEvent('popup'), page.getByRole('link', { name: 'Ver varejo' }).click()]);
    await aba.waitForURL(/index\.html\?previa$/);
    await entrarComoDono(aba);
    await ficaNaVitrine(aba, /index\.html\?previa$/);
  });

  test('na prévia do varejo (aba nova), o login do dono fica na vitrine e não volta ao painel', async ({ page }) => {
    await abrir(page);
    await criarConta(page, { doc: CPF, email: EMAIL_ADMIN });
    await page.waitForURL(/admin\.html$/);

    await page.evaluate(() => sessionStorage.clear());
    await abrir(page, '/index.html?previa');
    await entrarComoDono(page);
    await ficaNaVitrine(page, /index\.html\?previa$/);

    await page.reload();
    await ficaNaVitrine(page, /index\.html\?previa$/);
  });

  test('na prévia do atacado, o dono com conta de CPF vê o atacado', async ({ page }) => {
    await abrir(page);
    await criarConta(page, { doc: CPF, email: EMAIL_ADMIN });
    await page.waitForURL(/admin\.html$/);

    await page.evaluate(() => sessionStorage.clear());
    await abrir(page, '/atacado.html?previa');
    await entrarComoDono(page);
    await ficaNaVitrine(page, /atacado\.html\?previa$/);
    await expect(page.locator('#docMsg')).toHaveText('');
  });

  test('criando a conta na prévia do atacado, o dono fica no atacado e pode passar ao varejo', async ({ page }) => {
    await abrir(page, '/atacado.html?previa');
    await criarConta(page, { doc: CPF, email: EMAIL_ADMIN });
    await ficaNaVitrine(page, /atacado\.html\?previa$/);

    await abrir(page, '/index.html');
    await ficaNaVitrine(page, /index\.html$/);
    await abrir(page, '/atacado.html');
    await ficaNaVitrine(page, /atacado\.html$/);
  });

  test('cliente comum na prévia segue as regras de sempre', async ({ page }) => {
    await abrir(page, '/atacado.html?previa');
    await criarConta(page, { doc: CPF });
    await page.waitForURL(/index\.html$/);
    await esperarLoja(page);
  });
});

test.describe('RF21 dono entra direto no painel pela API', () => {
  test.use({ api: true });
  const entrarComPerfil = async (page, perfil, caminho = '/index.html') => {
    await page.route('**/api/auth/login', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      token: tokenDeTeste(perfil, 3600, Date.parse(HORA_ABERTA)),
      usuario: { id: 1, nome: 'Dono', email: EMAIL_ADMIN, perfil, documento: '111.444.777-35', tipo_documento: 'cpf' }
    }) }));
    await abrir(page, caminho);
    await confirmarIdade(page);
    await page.fill('#emailInput', EMAIL_ADMIN);
    await page.fill('#senhaInput', SENHA);
    await page.click('#docBtn');
  };

  test('perfil admin vai para o painel', async ({ page }) => {
    await entrarComPerfil(page, 'admin');
    await page.waitForURL(/admin\.html$/);
    await expect(page.locator('#a-produtos')).toBeVisible();
  });

  test('perfil cliente fica na loja, mesmo com o e-mail da lista do modo simulado', async ({ page }) => {
    await entrarComPerfil(page, 'cliente');
    await esperarLoja(page);
    await expect(page).toHaveURL(/index\.html$/);
  });

  test('perfil admin na prévia do varejo fica na vitrine', async ({ page }) => {
    await entrarComPerfil(page, 'admin', '/index.html?previa');
    await esperarLoja(page);
    await expect(page).toHaveURL(/index\.html\?previa$/);
  });

  test('perfil admin com conta de CPF na prévia do atacado fica no atacado', async ({ page }) => {
    await entrarComPerfil(page, 'admin', '/atacado.html?previa');
    await esperarLoja(page);
    await expect(page).toHaveURL(/atacado\.html\?previa$/);
  });

  test('perfil cliente na prévia do atacado com conta de CPF vai para o varejo, como sempre', async ({ page }) => {
    await entrarComPerfil(page, 'cliente', '/atacado.html?previa');
    await page.waitForURL(/index\.html$/);
    await esperarLoja(page);
  });
});
