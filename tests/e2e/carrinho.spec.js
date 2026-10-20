import { test, expect, entrarVarejo, irVista, pronto, adicionarAoCarrinho, abrirCarrinho, calcularCep, abertos, textoZap, semRolagemLateral, PIX_TESTE } from './apoio.js';

const ABSOLUT = 'Absolut Vodka Original 700 ml';
const RED_BULL = 'Red Bull Energy Drink 250 ml';
const NO3 = 'No. 3 London Dry Gin 700 ml';

async function lojaComItens(page) {
  await entrarVarejo(page);
  await irVista(page, 'catalogo');
  await adicionarAoCarrinho(page, ABSOLUT, 2);
}

async function irParaCheckout(page) {
  await abrirCarrinho(page);
  await page.click('#finalizar');
  await expect(page.locator('[data-etapa="dados"]')).toBeVisible();
  await calcularCep(page, '#ckCep', '#ckCepBtn', '60160000');
  await expect(page.locator('#ckCepMsg')).toHaveClass(/ok/);
  await expect(page.locator('#ckRua')).toHaveValue('Rua Silva Paulet');
  await page.fill('#ckNumero', '100');
}

test.describe('carrinho', () => {
  test('adicionar, aumentar, diminuir e remover', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, RED_BULL);
    await expect(page.locator('#cartCount')).toHaveText('1');
    await expect(page.locator('#toastMsg')).toHaveText(`${RED_BULL} no carrinho`);
    await abrirCarrinho(page);
    const linha = page.locator('.cart-item[data-sku="red-bull-250"]');
    await linha.locator('[data-acao="mais"]').click();
    await linha.locator('[data-acao="mais"]').click();
    await expect(linha.locator('.qtd span')).toHaveText('3');
    await expect(page.locator('#rSub')).toHaveText('R$ 23,70');
    await linha.locator('[data-acao="menos"]').click();
    await expect(linha.locator('.qtd span')).toHaveText('2');
    await expect(page.locator('#cartCount')).toHaveText('2');
    await linha.locator('[data-acao="tirar"]').click();
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await expect(page.locator('#cartVazio')).toBeVisible();
    await expect(page.locator('#cartCount')).toHaveText('0');
  });

  test('o estoque limita a quantidade', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, NO3, 9);
    await expect(page.locator('#cartCount')).toHaveText('8');
    await expect(page.locator('#toastMsg')).toHaveText('No. 3: só há 8 em estoque');
  });

  test('pedido mínimo bloqueia o Continuar', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, RED_BULL);
    await abrirCarrinho(page);
    await expect(page.locator('#cartAviso')).toHaveText('Faltam R$ 22,10 para o pedido mínimo de R$ 30,00.');
    await expect(page.locator('#finalizar')).toBeDisabled();
  });

  test('carrinho aberto com itens, cupom e entrega', async ({ page }) => {
    await lojaComItens(page);
    await irVista(page, 'inicio');
    await calcularCep(page);
    await expect(page.locator('#cepMsg')).toHaveClass(/ok/);
    await abrirCarrinho(page);
    await page.fill('#cupomInput', 'dangatinho');
    await page.click('#cupomBtn');
    await expect(page.locator('#cupomMsg')).toHaveText('Cupom aplicado: 67% de desconto.');
    await expect(page.locator('#rSub')).toHaveText('R$ 119,80');
    await expect(page.locator('#rDesc')).toHaveText('− R$ 80,27');
    await expect(page.locator('#rEntrega')).toHaveText('R$ 6,82');
    await expect(page.locator('#rTotal')).toHaveText('R$ 46,35');
    await pronto(page);
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('carrinho-itens.png');
  });

  test('cupom errado e cupom abaixo do mínimo', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, ABSOLUT);
    await abrirCarrinho(page);
    await page.fill('#cupomInput', 'NAOEXISTE');
    await page.click('#cupomBtn');
    await expect(page.locator('#cupomMsg')).toHaveText('Cupom inválido.');
    await page.fill('#cupomInput', 'DANGATINHO');
    await page.press('#cupomInput', 'Enter');
    await expect(page.locator('#cupomMsg')).toHaveText('O cupom vale a partir de R$ 100,00 em produtos.');
  });

  test('carrinho vazio', async ({ page }) => {
    await entrarVarejo(page);
    await abrirCarrinho(page);
    await expect(page.locator('#cartVazio')).toBeVisible();
    await pronto(page);
    await expect(page).toHaveScreenshot('carrinho-vazio.png');
  });

  test('teclado: foco preso no carrinho e Esc fecha', async ({ page }) => {
    await lojaComItens(page);
    await abrirCarrinho(page);
    await expect(page.locator('#cartClose')).toBeFocused();
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.getElementById('cart').contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('#cart')).not.toHaveClass(/aberto/);
    await expect(page.locator('#cartBtn')).toBeFocused();
  });

  test('o carrinho volta depois de recarregar', async ({ page }) => {
    await lojaComItens(page);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#cartCount')).toHaveText('2');
  });
});

test.describe('fechamento pelo WhatsApp', () => {
  test('entrega com dinheiro, troco e observação', async ({ page }) => {
    await lojaComItens(page);
    await irParaCheckout(page);
    await expect(page.locator('#ckOpPix')).toBeHidden();
    await page.check('input[name="fechar"][value="entrega"]');
    await page.check('input[name="forma"][value="dinheiro"]');
    await expect(page.locator('#ckTrocoBloco')).toBeVisible();
    await page.fill('#ckTroco', '200');
    await page.fill('#ckObs', 'interfone quebrado');
    await expect(page.locator('#ckTotal')).toHaveText('R$ 126,62');
    await pronto(page);
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('checkout-dados.png');
    await page.click('#ckEnviar');
    await expect(page.locator('[data-etapa="feito"]')).toBeVisible();
    const urls = await abertos(page);
    expect(urls).toHaveLength(1);
    expect(urls[0].startsWith('https://wa.me/5585981494445?text=')).toBe(true);
    const texto = textoZap(urls[0]);
    expect(texto).toContain('*Pedido Zero Grau*');
    expect(texto).toContain(`• 2x ${ABSOLUT} — R$ 119,80`);
    expect(texto).toContain('*Total: R$ 126,62*');
    expect(texto).toContain('Rua Silva Paulet, 100');
    expect(texto).toContain('*Pagamento:* Dinheiro na entrega — troco para R$ 200,00 (levar R$ 73,38)');
    expect(texto).toContain('*Observação:* interfone quebrado');
    await expect(page.locator('#cartCount')).toHaveText('0');
    await pronto(page);
    await expect(page).toHaveScreenshot('checkout-feito.png');
  });

  test('troco menor que o total é recusado', async ({ page }) => {
    await lojaComItens(page);
    await irParaCheckout(page);
    await page.check('input[name="fechar"][value="entrega"]');
    await page.check('input[name="forma"][value="dinheiro"]');
    await page.fill('#ckTroco', '50');
    await page.click('#ckEnviar');
    await expect(page.locator('#ckMsg')).toContainText('O troco tem de ser para um valor acima do total');
    expect(await abertos(page)).toHaveLength(0);
  });

  test('sem número o pedido não sai', async ({ page }) => {
    await lojaComItens(page);
    await irParaCheckout(page);
    await page.fill('#ckNumero', '');
    await page.check('input[name="fechar"][value="entrega"]');
    await page.check('input[name="forma"][value="cartao"]');
    await page.click('#ckEnviar');
    await expect(page.locator('#ckMsg')).toHaveText('Falta o número. Sem número, escreva s/n.');
    await expect(page.locator('#ckNumero')).toBeFocused();
  });

  test('pedir de novo devolve os itens ao carrinho', async ({ page }) => {
    await lojaComItens(page);
    await irParaCheckout(page);
    await page.check('input[name="fechar"][value="entrega"]');
    await page.check('input[name="forma"][value="cartao"]');
    await page.click('#ckEnviar');
    await page.click('#feitoFechar');
    await abrirCarrinho(page);
    await expect(page.locator('#pedidosAntigos')).toBeVisible();
    await pronto(page);
    await expect(page).toHaveScreenshot('carrinho-pedir-de-novo.png');
    await page.click('[data-denovo="0"]');
    await expect(page.locator('.cart-item[data-sku="absolut-1l"] .qtd span')).toHaveText('2');
  });
});

test.describe('loja fechada', () => {
  test.use({ hora: '2026-10-17T05:00:00-03:00' });
  test('o pedido sai marcado como agendado', async ({ page }) => {
    await lojaComItens(page);
    await irParaCheckout(page);
    await expect(page.locator('#ckFechada')).toHaveText('A loja está fechada agora (abre hoje às 10h). Seu pedido fica agendado para quando ela abrir.');
    await page.check('input[name="fechar"][value="entrega"]');
    await page.check('input[name="forma"][value="pix"]');
    await page.click('#ckEnviar');
    const texto = textoZap((await abertos(page))[0]);
    expect(texto).toContain('_Pedido feito com a loja fechada — entregar quando abrir (abre hoje às 10h)._');
  });
});

test.describe('Pix pelo site', () => {
  test.use({ pix: PIX_TESTE });
  test('gera copia e cola e QR code com o valor e manda a referência', async ({ page }) => {
    await lojaComItens(page);
    await irParaCheckout(page);
    await expect(page.locator('#ckOpPix')).toBeVisible();
    await expect(page.locator('input[name="fechar"][value="pix-site"]')).toBeChecked();
    await expect(page.locator('#ckEnviar')).toHaveText('Ir para o Pix');
    await page.click('#ckEnviar');
    await expect(page.locator('[data-etapa="pix"]')).toBeVisible();
    await expect(page.locator('#pixQr svg')).toBeVisible();
    const codigo = await page.inputValue('#pixCodigo');
    expect(codigo.startsWith('000201')).toBe(true);
    expect(codigo).toContain('br.gov.bcb.pix0114' + PIX_TESTE.chave);
    expect(codigo).toContain('5406126.62');
    expect(codigo).toMatch(/6304[0-9A-F]{4}$/);
    await expect(page.locator('#pixValor')).toHaveText('R$ 126,62');
    await pronto(page);
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('checkout-pix.png');
    await page.click('#pixCopiar');
    expect(await page.evaluate(() => window.__copiado)).toBe(codigo);
    await page.click('#pixPaguei');
    const texto = textoZap((await abertos(page))[0]);
    const ref = await page.evaluate(() => document.getElementById('pixRef').textContent);
    expect(texto).toContain(`*Pagamento:* Pix pago pelo site — R$ 126,62 — referência ${ref}.`);
    await expect(page.locator('[data-etapa="feito"]')).toBeVisible();
  });
});
