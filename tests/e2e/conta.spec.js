import { test, expect, abrir, entrarVarejo, entrarAtacado, irVista, adicionarAoCarrinho, abrirCarrinho, calcularCep, pronto, semRolagemLateral, esperarLoja } from './apoio.js';

const ABSOLUT = 'Absolut Vodka Original 700 ml';

async function enviarUmPedido(page) {
  await irVista(page, 'catalogo');
  await adicionarAoCarrinho(page, ABSOLUT, 2);
  await abrirCarrinho(page);
  await page.click('#finalizar');
  await calcularCep(page, '#ckCep', '#ckCepBtn', '60160000');
  await expect(page.locator('#ckCepMsg')).toHaveClass(/ok/);
  await page.fill('#ckNumero', '100');
  await page.check('input[name="fechar"][value="entrega"]');
  await page.check('input[name="forma"][value="cartao"]');
  await page.click('#ckEnviar');
  await expect(page.locator('[data-etapa="feito"]')).toBeVisible();
}

test.describe('Minha conta (React + Bootstrap)', () => {
  test('sem conta pede para entrar na loja', async ({ page }) => {
    await abrir(page, '/conta/');
    await expect(page.locator('#tituloSemConta')).toHaveText('Entre na loja para ver sua conta');
    await expect(page.getByRole('link', { name: 'Ir para a loja' })).toHaveAttribute('href', '../index.html');
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('conta-sem-login.png');
  });

  test('mostra a conta e o histórico, e pedir de novo volta ao carrinho', async ({ page }) => {
    const conta = await entrarVarejo(page, { email: 'cliente.conta@exemplo.com' });
    await enviarUmPedido(page);
    await abrir(page, '/conta/');
    await expect(page.locator('#tituloPerfil')).toHaveText(conta.nome);
    await expect(page.getByText(conta.email)).toBeVisible();
    await expect(page.locator('.zg-badge-varejo')).toHaveText('Varejo · por unidade');
    await expect(page.locator('.zg-pedido')).toHaveCount(1);
    await expect(page.locator('.zg-pedido')).toContainText('2x Absolut Vodka Original 700 ml');
    await expect(page.locator('.zg-total')).toContainText('R$ 126,62');
    await semRolagemLateral(page);
    await pronto(page);
    await expect(page).toHaveScreenshot('conta-historico.png');
    await page.getByRole('button', { name: 'Pedir de novo' }).click();
    await page.waitForURL(/index\.html$/);
    await esperarLoja(page);
    await expect(page.locator('#cartCount')).toHaveText('2');
  });

  test('conta sem pedidos mostra o estado vazio', async ({ page }) => {
    await entrarVarejo(page);
    await abrir(page, '/conta/');
    await expect(page.locator('.zg-vazio')).toContainText('Nenhum pedido ainda.');
  });

  test('conta de CNPJ explica o histórico do atacado', async ({ page }) => {
    await entrarAtacado(page);
    await abrir(page, '/conta/');
    await expect(page.locator('.zg-badge-atacado')).toHaveText('Atacado · caixa fechada');
    await expect(page.getByRole('heading', { name: 'Pedidos de atacado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voltar à loja', exact: true })).toHaveAttribute('href', '../atacado.html');
  });

  test('sair encerra a sessão da aba', async ({ page }) => {
    await entrarVarejo(page);
    await abrir(page, '/conta/');
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.locator('#tituloSemConta')).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('zg-perfil'))).toBeNull();
  });
});
