import { test, expect, entrarVarejo, irVista } from './apoio.js';

const LOJA = {
  whatsapp: 'https://wa.me/5585999990000',
  telefone: '(85) 3111-2222',
  email: 'contato@lojateste.com.br',
  cnpj: '11.222.333/0001-81',
  endereco: 'Rua de Teste, 100',
  bairro: 'Meireles · Fortaleza / CE',
  instagram: '#',
  facebook: '#'
};

test.describe('dados da loja e indicadores', () => {
  test('sem indicador inventado nas páginas', async ({ page }) => {
    await entrarVarejo(page);
    const texto = await page.evaluate(() => document.body.innerText);
    expect(texto).not.toMatch(/últimas 500 entregas/i);
    expect(texto).not.toMatch(/Em rota/);
    expect(texto).not.toMatch(/°C/);
    await irVista(page, 'entrega');
    expect(await page.locator('#v-entrega').innerText()).not.toMatch(/Tempo médio/);
    await expect(page.locator('#t1')).toHaveCount(0);
    await expect(page.locator('#rotas')).toHaveCount(0);
  });

  test('o lugar do tempo médio mostra o frete grátis da regra', async ({ page }) => {
    await entrarVarejo(page);
    await expect(page.locator('.hstat').first()).toContainText('Frete grátis');
    await expect(page.locator('.hstat').first().locator('[data-regra="freteGratis"]')).toHaveText('120');
  });
});

test.describe('dados da loja vindos do painel', () => {
  test.use({ ajustes: { contato: LOJA } });
  test('CNPJ, telefone, e-mail, endereço e bairro saem dos dados da loja', async ({ page }) => {
    await entrarVarejo(page);
    await irVista(page, 'cupom');
    await expect(page.locator('#v-cupom [data-contato="tel"]')).toHaveText(LOJA.telefone);
    await expect(page.locator('#v-cupom [data-contato="tel"]')).toHaveAttribute('href', 'tel:8531112222');
    await expect(page.locator('#v-cupom [data-contato="mailto"]')).toHaveText(LOJA.email);
    await expect(page.locator('#v-cupom [data-contato="cnpj"]')).toHaveText(LOJA.cnpj);
    await expect(page.locator('#v-cupom [data-contato="endereco"]')).toHaveText(LOJA.endereco);
    await irVista(page, 'entrega');
    await expect(page.locator('#v-entrega .srule-v [data-contato="bairro"]')).toHaveText(LOJA.bairro);
    await expect(page.locator('#v-entrega .lead [data-contato="endereco"]')).toHaveText(LOJA.endereco);
    const texto = await page.evaluate(() => document.body.innerText);
    expect(texto).not.toContain('Santos Dumont');
    expect(texto).not.toContain('00.000.000/0001-00');
    expect(texto).not.toContain('3000-0000');
    await expect(page.locator('.abertura-btns a[data-contato="whatsapp"]')).toHaveAttribute('href', LOJA.whatsapp);
  });
});
