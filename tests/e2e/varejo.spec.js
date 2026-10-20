import { test, expect, entrarVarejo, irVista, pronto, semRolagemLateral, calcularCep } from './apoio.js';

test.describe('vitrine de varejo', () => {
  test.beforeEach(async ({ page }) => {
    await entrarVarejo(page);
  });

  test('aba Início', async ({ page }) => {
    await expect(page.locator('#v-inicio')).toHaveClass(/ativa/);
    await expect(page.locator('.manchete')).toContainText('Sexta à noite não é');
    await expect(page.locator('[data-horario="agora"]')).toContainText('Aberto até 03h00');
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('varejo-inicio.png');
  });

  test('aba Catálogo', async ({ page }) => {
    await irVista(page, 'catalogo');
    await expect(page.locator('.card')).toHaveCount(15);
    await expect(page.locator('.card.esgotado')).toHaveCount(1);
    await page.waitForFunction(() => [...document.querySelectorAll('.card .foto')].every(i => i.complete && i.naturalWidth > 0));
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('varejo-catalogo.png');
  });

  test('aba Como pedir', async ({ page }) => {
    await irVista(page, 'pedir');
    await expect(page.locator('#v-pedir .step')).toHaveCount(4);
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('varejo-como-pedir.png');
  });

  test('aba Cupom', async ({ page }) => {
    await irVista(page, 'cupom');
    await expect(page.locator('#code')).toHaveText('ZEROGRAU10');
    await expect(page.locator('#v-cupom [data-regra="cupomDesconto"]')).toHaveText('10');
    await expect(page.locator('#v-cupom [data-regra="cupomTetoTexto"]')).toHaveText('Desconto de até R$ 30,00');
    await expect(page.locator('#v-cupom [data-regra="cupomMinimo"]')).toHaveText('100,00');
    await expect(page.locator('#v-cupom [data-regra="cupomValidadeTexto"]')).toHaveText('Válido até 31/12/2026');
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('varejo-cupom.png');
  });

  test('aba Entrega', async ({ page }) => {
    await irVista(page, 'entrega');
    await expect(page.locator('#v-entrega .pay')).toHaveCount(4);
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('varejo-entrega.png');
  });

  test('abas de categoria filtram o catálogo', async ({ page }) => {
    await irVista(page, 'catalogo');
    const visiveis = () => page.locator('.card:not(.hide)');
    await page.click('.tab[data-cat="destilado"]');
    await expect(page.locator('.tab[data-cat="destilado"]')).toHaveAttribute('aria-selected', 'true');
    await expect(visiveis()).toHaveCount(6);
    await page.click('.tab[data-cat="cerveja"]');
    await expect(visiveis()).toHaveCount(3);
    await page.click('.tab[data-cat="all"]');
    await expect(visiveis()).toHaveCount(15);
  });

  test('busca ignora acento e casa no início da palavra', async ({ page }) => {
    await irVista(page, 'catalogo');
    const visiveis = () => page.locator('.card:not(.hide)');
    await page.fill('#buscaInput', 'feldschlosschen');
    await expect(visiveis()).toHaveCount(1);
    await page.fill('#buscaInput', 'gin');
    await expect(visiveis()).toHaveCount(3);
    await page.fill('#buscaInput', 'xyzzy');
    await expect(page.locator('#semResultado')).toBeVisible();
    await pronto(page);
    await expect(page).toHaveScreenshot('varejo-busca-vazia.png');
    await page.click('#limparBusca');
    await expect(visiveis()).toHaveCount(15);
  });

  test('categoria com busca juntas', async ({ page }) => {
    await irVista(page, 'catalogo');
    await page.click('.tab[data-cat="destilado"]');
    await page.fill('#buscaInput', 'absolut');
    await expect(page.locator('.card:not(.hide)')).toHaveCount(2);
  });

  test('copiar o cupom deixa o código pronto no carrinho', async ({ page }) => {
    await irVista(page, 'cupom');
    await page.click('#code');
    await expect(page.locator('#codeHint')).toHaveText('Copiado');
    await expect(page.locator('#cupomInput')).toHaveValue('ZEROGRAU10');
  });

  test('CEP na aba Início calcula a taxa pelo ViaCEP', async ({ page }) => {
    await calcularCep(page);
    await expect(page.locator('#cepMsg')).toHaveText('Entregamos em Meireles, Fortaleza. 1,6 km · taxa R$ 6,82 · cerca de 22 minutos.');
    await expect(page.locator('#cepMsg')).toHaveClass(/ok/);
  });

  test('CEP com menos de 8 dígitos é recusado', async ({ page }) => {
    await calcularCep(page, '#cepInput', '#cepBtn', '6016');
    await expect(page.locator('#cepMsg')).toHaveText('O CEP precisa ter 8 dígitos. Confira e calcule de novo.');
  });

  test('o link do WhatsApp aponta para a loja', async ({ page }) => {
    await expect(page.locator('.abertura-btns a[data-contato="whatsapp"]')).toHaveAttribute('href', 'https://wa.me/5585981494445');
  });
});

test.describe('vitrine com CEP de fora', () => {
  test.use({ cep: 'longe' });
  test('cidade fora da tabela vira retirada no balcão', async ({ page }) => {
    await entrarVarejo(page);
    await calcularCep(page, '#cepInput', '#cepBtn', '62010000');
    await expect(page.locator('#cepMsg')).toHaveText('Centro, Sobral fica fora do raio de 30 km. Você pode retirar no balcão, sem taxa.');
  });
});

test.describe('vitrine com CEP inexistente', () => {
  test.use({ cep: 'inexistente' });
  test('CEP que não existe é avisado', async ({ page }) => {
    await entrarVarejo(page);
    await calcularCep(page, '#cepInput', '#cepBtn', '99999999');
    await expect(page.locator('#cepMsg')).toHaveText('Esse CEP não existe na base dos Correios. Confira os oito dígitos.');
  });
});

test.describe('vitrine com a loja fechada', () => {
  test.use({ hora: '2026-10-17T05:00:00-03:00' });
  test('fora do horário mostra fechado', async ({ page }) => {
    await entrarVarejo(page);
    await expect(page.locator('[data-horario="agora"]')).toContainText('Fechado · abre hoje às 10h');
  });
});
