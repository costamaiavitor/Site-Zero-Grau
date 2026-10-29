import AxeBuilder from '@axe-core/playwright';
import { test, expect, abrir, confirmarIdade, entrarVarejo, entrarAtacado, irVista, adicionarAoCarrinho, abrirCarrinho, calcularCep, pronto, PIX_TESTE } from './apoio.js';

const REGRAS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function auditar(page, tela) {
  await pronto(page);
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getTiming().iterations !== Infinity)
    .map(a => a.finished.catch(() => null))));
  const resultado = await new AxeBuilder({ page }).withTags(REGRAS_WCAG).analyze();
  const problemas = resultado.violations.map(v => ({
    regra: v.id,
    impacto: v.impact,
    alvos: v.nodes.slice(0, 6).map(n => n.target.join(' ')),
    total: v.nodes.length
  }));
  expect(problemas, `${tela}: ${JSON.stringify(problemas, null, 1)}`).toEqual([]);
}

const ABSOLUT = 'Absolut Vodka Original 700 ml';

test.describe('RNF02 acessibilidade (axe, WCAG 2.1 AA)', () => {
  test('aviso de idade', async ({ page }) => {
    await abrir(page);
    await auditar(page, 'idade');
  });

  test('porta: entrar e criar conta', async ({ page }) => {
    await abrir(page);
    await confirmarIdade(page);
    await auditar(page, 'entrar');
    await page.click('#painelEntrar [data-painel="criar"]');
    await auditar(page, 'criar');
  });

  for (const vista of ['inicio', 'catalogo', 'pedir', 'cupom', 'entrega']) {
    test(`varejo, aba ${vista}`, async ({ page }) => {
      await entrarVarejo(page);
      await irVista(page, vista);
      await auditar(page, vista);
    });
  }

  test('carrinho e entrega e pagamento', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, ABSOLUT, 2);
    await abrirCarrinho(page);
    await auditar(page, 'carrinho');
    await page.click('#finalizar');
    await calcularCep(page, '#ckCep', '#ckCepBtn', '60160000');
    await expect(page.locator('#ckCepMsg')).toHaveClass(/ok/);
    await auditar(page, 'checkout');
  });

  test('atacado', async ({ page }) => {
    await entrarAtacado(page);
    await page.locator('tr.item[data-sku="absolut-1l"] [data-acao="mais"]').click();
    await auditar(page, 'atacado');
  });

  test('créditos', async ({ page }) => {
    await abrir(page, '/creditos.html');
    await auditar(page, 'creditos');
  });

  test('minha conta', async ({ page }) => {
    await entrarVarejo(page);
    await abrir(page, '/conta/');
    await auditar(page, 'conta');
  });
});

test.describe('RNF02 acessibilidade do Pix', () => {
  test.use({ pix: PIX_TESTE });
  test('etapa do Pix', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await adicionarAoCarrinho(page, ABSOLUT, 2);
    await abrirCarrinho(page);
    await page.click('#finalizar');
    await calcularCep(page, '#ckCep', '#ckCepBtn', '60160000');
    await expect(page.locator('#ckCepMsg')).toHaveClass(/ok/);
    await page.fill('#ckNumero', '100');
    await page.click('#ckEnviar');
    await expect(page.locator('#pixQr svg')).toBeVisible();
    await auditar(page, 'pix');
  });
});

test.describe('RNF02 acessibilidade do painel', () => {
  test.use({ admin: 'simulado' });
  for (const aba of ['produtos', 'varejo', 'atacado', 'loja', 'publicacao']) {
    test(`painel, aba ${aba}`, async ({ page }) => {
      await abrir(page, '/admin.html');
      await page.click(`#t-${aba}`);
      await auditar(page, `painel-${aba}`);
    });
  }
});

test.describe('RNF02 teclado e leitor de tela', () => {
  test('fotos com texto alternativo de marca, nome e volume', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await expect(page.locator('.card .foto[alt="Absolut Vodka Original 700 ml"]')).toHaveCount(1);
    await expect(page.locator('.card .foto[alt="Coca-Cola Sabor Original 2 L"]')).toHaveCount(1);
    await expect(page.locator('.card .foto[alt=""]')).toHaveCount(0);
  });

  test('o carrinho fechado não recebe o foco do Tab', async ({ page }) => {
    await entrarVarejo(page);
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.getElementById('cart').contains(document.activeElement))).toBe(false);
    }
  });

  test('as áreas com rolagem recebem foco pelo teclado', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'entrega');
    await page.focus('#v-entrega .vista-rola');
    await expect(page.locator('#v-entrega .vista-rola')).toBeFocused();
  });

  test('busca sem resultado é anunciada', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'catalogo');
    await expect(page.locator('#semResultado')).toHaveAttribute('aria-live', 'polite');
  });

  test('no atacado em tela estreita o resumo fechado sai do Tab e o Esc fecha', async ({ page }) => {
    test.skip(page.viewportSize().width > 1080, 'acima de 1080 px o resumo é coluna fixa');
    await entrarAtacado(page);
    await expect(page.locator('#pedido')).toHaveJSProperty('inert', true);
    await page.locator('tr.item[data-sku="absolut-1l"] [data-acao="mais"]').click();
    await page.click('#barra');
    await expect(page.locator('#pedido')).toHaveJSProperty('inert', false);
    await expect(page.locator('#pedidoClose')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#pedido')).not.toHaveClass(/aberto/);
    await expect(page.locator('#pedido')).toHaveJSProperty('inert', true);
  });

  test('no atacado em tela larga o resumo continua no Tab', async ({ page }) => {
    test.skip(page.viewportSize().width <= 1080, 'abaixo de 1080 px o resumo é gaveta');
    await entrarAtacado(page);
    await expect(page.locator('#pedido')).toHaveJSProperty('inert', false);
  });
});
