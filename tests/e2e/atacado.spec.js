import { test, expect, entrarAtacado, abrir, confirmarIdade, pronto, abertos, textoZap, semRolagemLateral } from './apoio.js';

const linha = (page, sku) => page.locator(`tr.item[data-sku="${sku}"]`);

async function abrirPedidoSeGaveta(page) {
  const largura = page.viewportSize().width;
  if (largura <= 1080) {
    await page.click('#barra');
    await expect(page.locator('#pedido')).toHaveClass(/aberto/);
    await page.waitForTimeout(350);
  }
}

test.describe('balcão de atacado', () => {
  test('tabela por caixa fechada', async ({ page }) => {
    await entrarAtacado(page);
    await expect(page.locator('tr.item')).toHaveCount(15);
    await expect(linha(page, 'absolut-1l').locator('td').nth(0)).toHaveText('6 un.');
    await expect(linha(page, 'absolut-1l').locator('td').nth(1)).toHaveText('R$ 50,33');
    await expect(linha(page, 'absolut-1l').locator('td').nth(2)).toHaveText('R$ 301,97');
    await expect(linha(page, 'absolut-1l').locator('td').nth(3)).toHaveText('8 cx');
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('atacado-tabela.png');
  });

  test('montar pedido, desconto por volume e enviar pelo WhatsApp', async ({ page }) => {
    await entrarAtacado(page);
    const mais = linha(page, 'absolut-1l').locator('[data-acao="mais"]');
    await mais.click();
    await expect(page.locator('#pedidoAviso')).toHaveText('Faltam R$ 198,03 para o pedido mínimo de R$ 500,00.');
    await expect(page.locator('#enviar')).toBeDisabled();
    await mais.click();
    await expect(linha(page, 'absolut-1l').locator('[data-qtd]')).toHaveText('2');
    await expect(page.locator('#barraCaixas')).toHaveText('2');
    await abrirPedidoSeGaveta(page);
    await expect(page.locator('#rSub')).toHaveText('R$ 603,94');
    await expect(page.locator('#rFrete')).toHaveText('R$ 40,90');
    await expect(page.locator('#rTotal')).toHaveText('R$ 644,84');
    await expect(page.locator('#pedidoAviso')).toHaveText('Faltam 8 caixas para 4% de desconto por volume.');
    await pronto(page);
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('atacado-pedido.png');
    await page.click('#enviar');
    const texto = textoZap((await abertos(page))[0]);
    expect(texto).toContain('*Pedido de atacado · Zero Grau*');
    expect(texto).toContain('CNPJ: 11.222.333/0001-81');
    expect(texto).toContain('• 2 cx (12 un.) Absolut Vodka Original 700 ml — R$ 603,94');
    expect(texto).toContain('*Total: R$ 644,84*');
  });

  test('faixa de volume a partir de 10 caixas', async ({ page }) => {
    await entrarAtacado(page);
    const mais = linha(page, 'red-bull-250').locator('[data-acao="mais"]');
    for (let i = 0; i < 10; i++) await mais.click();
    await abrirPedidoSeGaveta(page);
    await expect(page.locator('#linhaFaixa')).toBeVisible();
    await expect(page.locator('#rFaixaNome')).toHaveText('(4%)');
  });

  test('estoque em caixas limita o +', async ({ page }) => {
    await entrarAtacado(page);
    const mais = linha(page, 'no3-gin-700').locator('[data-acao="mais"]');
    await mais.click();
    await expect(mais).toBeDisabled();
    await expect(linha(page, 'feldschlosschen-500').locator('[data-acao="mais"]')).toBeDisabled();
  });

  test('abas e busca filtram a tabela', async ({ page }) => {
    await entrarAtacado(page);
    await page.click('.tab[data-cat="energetico"]');
    await expect(page.locator('tr.item:not(.hide)')).toHaveCount(2);
    await page.click('.tab[data-cat="all"]');
    await page.fill('#buscaInput', 'guinness');
    await expect(page.locator('tr.item:not(.hide)')).toHaveCount(1);
  });

  test('conta de CPF não entra no balcão', async ({ page }) => {
    await abrir(page, '/atacado.html');
    await confirmarIdade(page);
    await page.evaluate(() => {
      const todas = { 'pessoa@exemplo.com': { email: 'pessoa@exemplo.com', nome: 'Pessoa', doc: '111.444.777-35', tipo: 'cpf' } };
      localStorage.setItem('zg-contas', JSON.stringify(todas));
    });
    await page.fill('#emailInput', 'pessoa@exemplo.com');
    await page.fill('#senhaInput', 'gelada123');
    await page.click('#docBtn');
    await page.waitForURL(/index\.html/);
  });

  test('o pedido de atacado volta depois de recarregar', async ({ page }) => {
    await entrarAtacado(page);
    await linha(page, 'absolut-1l').locator('[data-acao="mais"]').click();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(linha(page, 'absolut-1l').locator('[data-qtd]')).toHaveText('1');
  });
});
