import { test, expect, abrir, confirmarIdade, preencherCadastro, criarConta, esperarLoja, emailNovo, semRolagemLateral, CPF, CNPJ, SENHA } from './apoio.js';

test.describe('aviso 18+ e porta', () => {
  test('o aviso de idade abre antes de tudo e prende o foco', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('#gate')).toHaveClass(/aberto/);
    await expect(page.locator('#gateYes')).toBeFocused();
    await expect(page.locator('#gate a', { hasText: 'Sou menor' })).toHaveAttribute('href', 'https://www.gov.br');
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('porta-idade.png');
  });

  test('confirmar a idade abre o login e fica lembrado na sessão', async ({ page }) => {
    await abrir(page);
    await confirmarIdade(page);
    await expect(page.locator('#emailInput')).toBeFocused();
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('porta-entrar.png');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#gate')).not.toHaveClass(/aberto/);
    await expect(page.locator('#porta')).toHaveClass(/aberto/);
  });

  test('tela de criar conta muda o rótulo conforme o documento', async ({ page }) => {
    await abrir(page);
    await confirmarIdade(page);
    await page.click('#painelEntrar [data-painel="criar"]');
    await expect(page.locator('#criarTitle')).toBeVisible();
    await page.fill('#cDocInput', CPF);
    await expect(page.locator('#cDocInput')).toHaveValue('111.444.777-35');
    await expect(page.locator('#cDocTipo')).toHaveText('CPF · você compra no varejo');
    await expect(page.locator('#nomeTag')).toHaveText('Nome completo');
    await page.fill('#cDocInput', CNPJ);
    await expect(page.locator('#cDocInput')).toHaveValue('11.222.333/0001-81');
    await expect(page.locator('#cDocTipo')).toHaveText('CNPJ · você compra no atacado, por caixa fechada');
    await expect(page.locator('#nomeTag')).toHaveText('Razão social');
    await page.fill('#cDocInput', '');
    await page.locator('#cDocInput').blur();
    await semRolagemLateral(page);
    await expect(page).toHaveScreenshot('porta-criar.png');
  });

  test('cadastro recusa campo faltando, um erro de cada vez', async ({ page }) => {
    await abrir(page);
    await confirmarIdade(page);
    await page.click('#painelEntrar [data-painel="criar"]');
    await page.click('#criarBtn');
    await expect(page.locator('#criarMsg')).toHaveText('Digite um CPF (11 dígitos) ou um CNPJ (14).');
    await expect(page.locator('#cDocInput')).toHaveAttribute('aria-invalid', 'true');
    await preencherCadastro(page, { doc: CPF, nome: 'Cliente', email: emailNovo(), senha: SENHA, confirmacao: 'outra123' });
    await page.click('#criarBtn');
    await expect(page.locator('#criarMsg')).toHaveText('As duas senhas não são iguais.');
  });

  test('criar conta com CPF entra no varejo', async ({ page }) => {
    await abrir(page);
    await criarConta(page, { doc: CPF });
    await esperarLoja(page);
    await expect(page).toHaveURL(/index\.html$/);
    await expect(page.locator('.conta-btn [data-doc]')).toHaveText('111.444.777-35');
  });

  test('criar conta com CNPJ no varejo leva ao atacado', async ({ page }) => {
    await abrir(page);
    await criarConta(page, { doc: CNPJ, nome: 'Bar de Teste Ltda' });
    await page.waitForURL(/atacado\.html/);
    await esperarLoja(page);
    await expect(page.locator('[data-doc]')).toHaveText('11.222.333/0001-81');
  });

  test('trocar de conta e entrar de novo com e-mail e senha', async ({ page }) => {
    await abrir(page);
    const conta = await criarConta(page, { doc: CPF });
    await esperarLoja(page);
    await page.click('.conta-btn[data-trocar]');
    await expect(page.locator('#porta')).toHaveClass(/aberto/);
    await page.fill('#emailInput', conta.email);
    await page.fill('#senhaInput', conta.senha);
    await page.click('#docBtn');
    await esperarLoja(page);
    await expect(page.locator('.conta-btn [data-doc]')).toHaveText('111.444.777-35');
  });

  test('login com e-mail sem conta mostra a mensagem', async ({ page }) => {
    await abrir(page);
    await confirmarIdade(page);
    await page.fill('#emailInput', emailNovo('ninguem'));
    await page.fill('#senhaInput', SENHA);
    await page.click('#docBtn');
    await expect(page.locator('#docMsg')).toHaveText('Não encontramos uma conta com esse e-mail. Confira o endereço ou crie uma conta.');
    await expect(page.locator('#porta')).toHaveClass(/aberto/);
  });

  test('a porta prende o foco do teclado', async ({ page }) => {
    await abrir(page);
    await confirmarIdade(page);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const dentro = await page.evaluate(() => document.getElementById('porta').contains(document.activeElement));
      expect(dentro).toBe(true);
    }
  });
});
