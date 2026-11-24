import AxeBuilder from '@axe-core/playwright';
import { test, expect, entrarVarejo, entrarAtacado, abrir, pronto, semRolagemLateral } from './apoio.js';

const REGRAS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('guia do site (botão ?)', () => {
  test('varejo: setas percorrem os passos, trocam a aba e Esc devolve o foco', async ({ page }) => {
    await entrarVarejo(page);
    const botao = page.getByRole('button', { name: 'Como usar o site' });
    await expect(botao).toBeVisible();
    await semRolagemLateral(page);

    await botao.click();
    const guia = page.getByRole('dialog', { name: 'Um minuto para conhecer a loja' });
    await expect(guia).toBeVisible();
    await expect(page.locator('.tour-contagem')).toHaveText('Passo 1 de 12');
    await expect(page.locator('.tour-grau')).toHaveText('11°');
    await expect(page.getByRole('button', { name: 'Passo anterior' })).toBeDisabled();

    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Próximo' }).click();
    await expect(page.locator('.tour-contagem')).toHaveText('Passo 4 de 12');
    await expect(page.locator('#v-catalogo')).toHaveClass(/ativa/);
    await expect(page.locator('.tour-camada')).toHaveClass(/com-alvo/);
    await semRolagemLateral(page);

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.tour-contagem')).toHaveText('Passo 3 de 12');
    await expect(page.locator('#v-inicio')).toHaveClass(/ativa/);

    await page.keyboard.press('Escape');
    await expect(page.locator('.tour-camada')).toBeHidden();
    await expect(botao).toBeFocused();
    await expect(page.locator('#v-inicio')).toHaveClass(/ativa/);
  });

  test('varejo: o último passo leva ao catálogo', async ({ page }) => {
    await entrarVarejo(page);
    await page.getByRole('button', { name: 'Como usar o site' }).click();
    for (let i = 0; i < 11; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('.tour-grau')).toHaveText('0°');
    await page.locator('.tour-cartao').getByRole('button', { name: 'Ver o catálogo' }).click();
    await expect(page.locator('.tour-camada')).toBeHidden();
    await expect(page.locator('#v-catalogo')).toHaveClass(/ativa/);
  });

  test('varejo: guia aberto passa no axe', async ({ page }) => {
    await entrarVarejo(page);
    await page.getByRole('button', { name: 'Como usar o site' }).click();
    await page.keyboard.press('ArrowRight');
    await pronto(page);
    const resultado = await new AxeBuilder({ page }).include('.tour-cartao').withTags(REGRAS_WCAG).analyze();
    expect(resultado.violations.map(v => v.id)).toEqual([]);
  });

  test('atacado: guia com seis passos e sem rolagem lateral', async ({ page }) => {
    await entrarAtacado(page);
    await page.getByRole('button', { name: 'Como usar o site' }).click();
    await expect(page.locator('.tour-contagem')).toHaveText('Passo 1 de 6');
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('.tour-grau')).toHaveText('0°');
    await semRolagemLateral(page);
    await page.getByRole('button', { name: 'Fechar o guia' }).first().click();
    await expect(page.locator('.tour-camada')).toBeHidden();
  });
});

test.describe('guia do painel (botão ?)', () => {
  test.use({ admin: 'simulado' });

  test('painel: treze passos que trocam de aba, e Esc volta à aba em que estava', async ({ page }) => {
    await abrir(page, '/admin.html');
    const botao = page.getByRole('button', { name: 'Como usar o painel' });
    await expect(botao).toBeVisible();
    await page.click('#t-loja');

    await botao.click();
    await expect(page.getByRole('dialog', { name: 'Um minuto para conhecer o painel' })).toBeVisible();
    await expect(page.locator('.tour-contagem')).toHaveText('Passo 1 de 13');
    await expect(page.locator('.tour-grau')).toHaveText('12°');
    await expect(page.locator('#a-produtos')).toBeVisible();

    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('.tour-contagem')).toHaveText('Passo 7 de 13');
    await expect(page.locator('#a-varejo')).toBeVisible();
    await expect(page.locator('.tour-camada')).toHaveClass(/com-alvo/);
    await semRolagemLateral(page);

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#a-atacado')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.tour-camada')).toBeHidden();
    await expect(botao).toBeFocused();
    await expect(page.locator('#a-loja')).toBeVisible();
  });

  test('painel: o passo da foto destaca o botão Subir foto, mesmo em tela estreita', async ({ page }) => {
    await abrir(page, '/admin.html');
    await page.getByRole('button', { name: 'Como usar o painel' }).click();
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tourTitulo')).toHaveText('A foto já sai no padrão da loja');
    await expect(page.locator('.tour-camada')).toHaveClass(/com-alvo/);
    const botaoFoto = page.locator('#linhasProdutos .adm-foto-btn').first();
    await expect(botaoFoto).toBeInViewport();
    await semRolagemLateral(page);
  });

  test('painel: o último passo volta para Produtos', async ({ page }) => {
    await abrir(page, '/admin.html');
    await page.getByRole('button', { name: 'Como usar o painel' }).click();
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('.tour-grau')).toHaveText('0°');
    await expect(page.locator('#a-publicacao')).toBeHidden();
    await page.locator('.tour-cartao').getByRole('button', { name: 'Começar a editar' }).click();
    await expect(page.locator('.tour-camada')).toBeHidden();
    await expect(page.locator('#a-produtos')).toBeVisible();
  });

  test('painel: guia aberto passa no axe', async ({ page }) => {
    await abrir(page, '/admin.html');
    await page.getByRole('button', { name: 'Como usar o painel' }).click();
    await page.keyboard.press('ArrowRight');
    await pronto(page);
    const resultado = await new AxeBuilder({ page }).include('.tour-cartao').withTags(REGRAS_WCAG).analyze();
    expect(resultado.violations.map(v => v.id)).toEqual([]);
  });
});
