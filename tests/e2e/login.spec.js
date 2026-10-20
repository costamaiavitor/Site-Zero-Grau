import { test, expect, abrir, confirmarIdade, criarConta, esperarLoja, emailNovo, CPF, CNPJ, SENHA } from './apoio.js';

async function sair(page) {
  await page.click('.conta-btn[data-trocar]');
  await expect(page.locator('#porta')).toHaveClass(/aberto/);
}

async function tentarEntrar(page, email, senha) {
  await page.fill('#emailInput', email);
  await page.fill('#senhaInput', senha);
  await page.click('#docBtn');
}

test.describe('RF03 login no modo simulado', () => {
  test('senha errada não entra e senha certa entra', async ({ page }) => {
    await abrir(page);
    const conta = await criarConta(page, { doc: CPF });
    await esperarLoja(page);
    await sair(page);
    await tentarEntrar(page, conta.email, 'errada123');
    await expect(page.locator('#docMsg')).toHaveText('Senha incorreta. Confira e tente de novo.');
    await expect(page.locator('#senhaInput')).toBeFocused();
    await expect(page.locator('#senhaInput')).toHaveValue('');
    await expect(page.locator('#porta')).toHaveClass(/aberto/);
    await tentarEntrar(page, conta.email, conta.senha);
    await esperarLoja(page);
    await expect(page.locator('.conta-btn [data-doc]')).toHaveText('111.444.777-35');
  });

  test('a senha fica só como hash SHA-256, nunca em texto', async ({ page }) => {
    await abrir(page);
    const conta = await criarConta(page, { doc: CPF });
    await esperarLoja(page);
    const guardado = await page.evaluate(() => ({ local: JSON.stringify(localStorage), sessao: JSON.stringify(sessionStorage) }));
    expect(guardado.local).not.toContain(conta.senha);
    expect(guardado.sessao).not.toContain(conta.senha);
    const salva = await page.evaluate(e => JSON.parse(localStorage.getItem('zg-contas'))[e], conta.email);
    expect(salva.senhaHash).toMatch(/^[0-9a-f]{64}$/);
    expect(salva).not.toHaveProperty('senha');
  });

  test('conta antiga sem hash adota a senha do primeiro login', async ({ page }) => {
    await abrir(page);
    await confirmarIdade(page);
    const email = emailNovo('antiga');
    await page.evaluate(e => localStorage.setItem('zg-contas', JSON.stringify({ [e]: { email: e, nome: 'Conta Antiga', doc: '111.444.777-35', tipo: 'cpf' } })), email);
    await tentarEntrar(page, email, SENHA);
    await esperarLoja(page);
    await sair(page);
    await tentarEntrar(page, email, 'outra1234');
    await expect(page.locator('#docMsg')).toHaveText('Senha incorreta. Confira e tente de novo.');
  });

  test('o aviso da porta diz como a senha é guardada', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('#porta .gate-legal')).toContainText('a senha é guardada só como hash, nunca como texto');
  });
});

test.describe('RF03 login com a API', () => {
  test.use({ api: true });

  test('POST /api/auth/login guarda o JWT e entra na loja do documento', async ({ page }) => {
    let corpo = null;
    await page.route('**/api/auth/login', async r => {
      corpo = r.request().postDataJSON();
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        token: 'jwt.de.teste',
        usuario: { id: 7, nome: 'Bar de Teste Ltda', email: 'bar@exemplo.com', perfil: 'cliente', documento: '11.222.333/0001-81', tipo_documento: 'cnpj', loja: 'atacado' }
      }) });
    });
    await abrir(page);
    await confirmarIdade(page);
    await tentarEntrar(page, 'Bar@Exemplo.com', SENHA);
    await page.waitForURL(/atacado\.html/);
    await esperarLoja(page);
    expect(corpo).toEqual({ email: 'bar@exemplo.com', senha: SENHA });
    expect(await page.evaluate(() => sessionStorage.getItem('zg-token'))).toBe('jwt.de.teste');
    const perfil = await page.evaluate(() => JSON.parse(sessionStorage.getItem('zg-perfil')));
    expect(perfil).toMatchObject({ id: 7, perfil: 'cliente', tipo: 'cnpj', doc: '11.222.333/0001-81' });
    expect(await page.evaluate(() => localStorage.getItem('zg-contas'))).toBeNull();
  });

  test('401 mostra e-mail ou senha incorretos', async ({ page }) => {
    await page.route('**/api/auth/login', r => r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ erro: 'Credenciais inválidas.' }) }));
    await abrir(page);
    await confirmarIdade(page);
    await tentarEntrar(page, 'cliente@exemplo.com', SENHA);
    await expect(page.locator('#docMsg')).toHaveText('E-mail ou senha incorretos.');
    expect(await page.evaluate(() => sessionStorage.getItem('zg-token'))).toBeNull();
  });

  test('servidor fora do ar avisa sem travar a porta', async ({ page }) => {
    await page.route('**/api/auth/login', r => r.abort());
    await abrir(page);
    await confirmarIdade(page);
    await tentarEntrar(page, 'cliente@exemplo.com', SENHA);
    await expect(page.locator('#docMsg')).toHaveText('Não deu para falar com o servidor da loja. Confira a internet e tente de novo.');
    await expect(page.locator('#docBtn')).toBeEnabled();
  });

  test('trocar de conta apaga o token', async ({ page }) => {
    await page.route('**/api/auth/login', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      token: 'jwt.de.teste', usuario: { id: 3, nome: 'Cliente', email: 'c@exemplo.com', perfil: 'cliente', documento: '111.444.777-35', tipo_documento: 'cpf' }
    }) }));
    await abrir(page);
    await confirmarIdade(page);
    await tentarEntrar(page, 'c@exemplo.com', SENHA);
    await esperarLoja(page);
    await sair(page);
    expect(await page.evaluate(() => sessionStorage.getItem('zg-token'))).toBeNull();
  });
});
