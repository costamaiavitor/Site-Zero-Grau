import { test, expect, abrir, confirmarIdade, preencherCadastro, esperarLoja, CPF, CNPJ, SENHA } from './apoio.js';

test.describe('RF02 cadastro com a API', () => {
  test.use({ api: true });

  test('POST /api/auth/cadastro e entra com o token', async ({ page }) => {
    let cadastro = null;
    let login = null;
    await page.route('**/api/auth/cadastro', async r => {
      cadastro = r.request().postDataJSON();
      await r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ mensagem: 'ok', usuario: { id: 12 } }) });
    });
    await page.route('**/api/auth/login', async r => {
      login = r.request().postDataJSON();
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        token: 'jwt.novo',
        usuario: { id: 12, nome: 'Cliente Nova', email: 'nova@exemplo.com', perfil: 'cliente', documento: '111.444.777-35', tipo_documento: 'cpf' }
      }) });
    });
    await abrir(page);
    await confirmarIdade(page);
    await preencherCadastro(page, { doc: CPF, nome: 'Cliente Nova', email: 'Nova@Exemplo.com' });
    await page.click('#criarBtn');
    await esperarLoja(page);
    expect(cadastro).toEqual({ nome: 'Cliente Nova', email: 'nova@exemplo.com', senha: SENHA, documento: '111.444.777-35', tipo_documento: 'cpf' });
    expect(login).toEqual({ email: 'nova@exemplo.com', senha: SENHA });
    expect(await page.evaluate(() => sessionStorage.getItem('zg-token'))).toBe('jwt.novo');
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('zg-perfil')))).toMatchObject({ id: 12, tipo: 'cpf' });
    expect(await page.evaluate(() => localStorage.getItem('zg-contas'))).toBeNull();
  });

  test('CNPJ cadastrado pela API vai para o atacado', async ({ page }) => {
    await page.route('**/api/auth/cadastro', r => r.fulfill({ status: 201, contentType: 'application/json', body: '{"usuario":{"id":13}}' }));
    await page.route('**/api/auth/login', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      token: 'jwt.cnpj', usuario: { id: 13, nome: 'Bar Novo Ltda', email: 'bar@exemplo.com', perfil: 'cliente', documento: '11.222.333/0001-81', tipo_documento: 'cnpj' }
    }) }));
    await abrir(page);
    await confirmarIdade(page);
    await preencherCadastro(page, { doc: CNPJ, nome: 'Bar Novo Ltda', email: 'bar@exemplo.com' });
    await page.click('#criarBtn');
    await page.waitForURL(/atacado\.html/);
  });

  test('e-mail já cadastrado mostra a mensagem do site', async ({ page }) => {
    await page.route('**/api/auth/cadastro', r => r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ erro: 'E-mail já cadastrado.' }) }));
    await abrir(page);
    await confirmarIdade(page);
    await preencherCadastro(page, { doc: CPF, nome: 'Cliente', email: 'repetido@exemplo.com' });
    await page.click('#criarBtn');
    await expect(page.locator('#criarMsg')).toHaveText('Já existe uma conta com esse e-mail. Entre com ela.');
    await expect(page.locator('#cEmailInput')).toBeFocused();
  });

  test('servidor fora do ar no cadastro avisa e libera o botão', async ({ page }) => {
    await page.route('**/api/auth/cadastro', r => r.abort());
    await abrir(page);
    await confirmarIdade(page);
    await preencherCadastro(page, { doc: CPF, nome: 'Cliente', email: 'fora@exemplo.com' });
    await page.click('#criarBtn');
    await expect(page.locator('#criarMsg')).toHaveText('Não deu para falar com o servidor da loja. Confira a internet e tente de novo.');
    await expect(page.locator('#criarBtn')).toBeEnabled();
  });
});
