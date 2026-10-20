import { test as base, expect } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontend');

export const HORA_ABERTA = '2026-10-16T20:00:00-03:00';
export const HORA_FECHADA = '2026-10-17T05:00:00-03:00';

export const CPF = '11144477735';
export const CNPJ = '11222333000181';
export const SENHA = 'gelada123';

export const VIACEP = {
  meireles: { cep: '60160-000', logradouro: 'Rua Silva Paulet', bairro: 'Meireles', localidade: 'Fortaleza', uf: 'CE' },
  longe: { cep: '62010-000', logradouro: 'Rua Coronel Jose Silvestre', bairro: 'Centro', localidade: 'Sobral', uf: 'CE' },
  inexistente: { erro: true }
};

export const PIX_TESTE = { chave: '11222333000181', nome: 'ZERO GRAU', cidade: 'FORTALEZA' };

const CACHE_FONTES = path.resolve(RAIZ, '..', 'node_modules', '.cache', 'fontes-teste');

async function servirFonte(rota) {
  const url = rota.request().url();
  const nome = createHash('sha1').update(url).digest('hex');
  const corpo = path.join(CACHE_FONTES, nome);
  const meta = corpo + '.json';
  if (existsSync(corpo) && existsSync(meta)) {
    const { tipo } = JSON.parse(readFileSync(meta, 'utf8'));
    return rota.fulfill({ body: readFileSync(corpo), contentType: tipo, headers: { 'access-control-allow-origin': '*' } });
  }
  const resposta = await rota.fetch();
  const tipo = resposta.headers()['content-type'] || 'application/octet-stream';
  const dados = await resposta.body();
  if (resposta.ok()) {
    mkdirSync(CACHE_FONTES, { recursive: true });
    writeFileSync(corpo, dados);
    writeFileSync(meta, JSON.stringify({ tipo }));
  }
  return rota.fulfill({ body: dados, status: resposta.status(), contentType: tipo, headers: { 'access-control-allow-origin': '*' } });
}

const AJUSTES_ORIGINAIS = readFileSync(path.join(RAIZ, 'js', 'ajustes.js'), 'utf8');

export const test = base.extend({
  hora: [HORA_ABERTA, { option: true }],
  pix: [null, { option: true }],
  cep: ['meireles', { option: true }],
  api: [false, { option: true }],
  page: async ({ page, hora, pix, cep, api }, use) => {
    await page.clock.setFixedTime(new Date(hora));
    await page.addInitScript(() => {
      Math.random = () => 0;
      window.__abertos = [];
      window.open = url => { window.__abertos.push(String(url)); return null; };
      try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__copiado = t; return Promise.resolve(); } }, configurable: true }); } catch {}
    });
    if (api) {
      await page.route(/\/js\/config\.js/, r => r.fulfill({
        contentType: 'text/javascript; charset=utf-8',
        body: 'const ZG_CONFIG = { apiBase: location.origin + "/api", usarMock: false };'
      }));
    }
    if (pix) {
      await page.route(/\/js\/ajustes\.js/, r => r.fulfill({
        contentType: 'text/javascript; charset=utf-8',
        body: `${AJUSTES_ORIGINAIS}\nAJUSTES_PUBLICADOS.pix = ${JSON.stringify(pix)};`
      }));
    }
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, servirFonte);
    await page.route('**://viacep.com.br/**', r => {
      const resposta = VIACEP[cep];
      if (!resposta) return r.abort();
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify(resposta) });
    });
    await use(page);
  }
});

export { expect };

export async function pronto(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

export async function abrir(page, caminho = '/index.html') {
  await page.goto(caminho, { waitUntil: 'networkidle' });
  await pronto(page);
}

export async function confirmarIdade(page) {
  await expect(page.locator('#gate')).toHaveClass(/aberto/);
  await page.click('#gateYes');
  await expect(page.locator('#gate')).not.toHaveClass(/aberto/);
  await expect(page.locator('#porta')).toHaveClass(/aberto/);
}

let sequencia = 0;
export function emailNovo(prefixo = 'cliente') {
  sequencia += 1;
  return `${prefixo}.${process.pid}.${Date.now().toString(36)}.${sequencia}@exemplo.com`;
}

export async function preencherCadastro(page, { doc, nome, email, senha = SENHA, confirmacao = senha }) {
  if (await page.locator('#painelCriar').isHidden()) await page.click('#painelEntrar [data-painel="criar"]');
  await expect(page.locator('#painelCriar')).toBeVisible();
  await page.fill('#cDocInput', doc);
  await page.fill('#nomeInput', nome);
  await page.fill('#cEmailInput', email);
  await page.fill('#cSenhaInput', senha);
  await page.fill('#cConfInput', confirmacao);
}

export async function criarConta(page, { doc = CPF, nome = 'Cliente de Teste', email = emailNovo(), senha = SENHA } = {}) {
  await confirmarIdade(page);
  await preencherCadastro(page, { doc, nome, email, senha });
  await page.click('#criarBtn');
  return { doc, nome, email, senha };
}

export async function esperarLoja(page) {
  await expect(page.locator('#porta')).not.toHaveClass(/aberto/);
  await pronto(page);
}

export async function entrarVarejo(page, opcoes = {}) {
  await abrir(page, '/index.html');
  const conta = await criarConta(page, { doc: CPF, ...opcoes });
  await esperarLoja(page);
  return conta;
}

export async function entrarAtacado(page, opcoes = {}) {
  await abrir(page, '/atacado.html');
  const conta = await criarConta(page, { doc: CNPJ, nome: 'Bar de Teste Ltda', ...opcoes });
  await page.waitForURL(/atacado\.html/);
  await esperarLoja(page);
  return conta;
}

export async function irVista(page, vista) {
  await page.click(`.app-aba[data-vista="${vista}"]`);
  await expect(page.locator(`#v-${vista}`)).toHaveClass(/ativa/);
  await pronto(page);
}

export async function adicionarAoCarrinho(page, marcaNome, vezes = 1) {
  for (let i = 0; i < vezes; i++) await page.click(`.add[aria-label="Adicionar ${marcaNome} ao carrinho"]`);
}

export async function abrirCarrinho(page) {
  await page.click('#cartBtn');
  await expect(page.locator('#cart')).toHaveClass(/aberto/);
  await page.waitForTimeout(350);
}

export async function calcularCep(page, campo = '#cepInput', botao = '#cepBtn', cep = '60160000') {
  await page.fill(campo, cep);
  await page.click(botao);
}

export const abertos = page => page.evaluate(() => window.__abertos);
export const textoZap = url => decodeURIComponent(url.split('?text=')[1] || '');

export async function semRolagemLateral(page) {
  const m = await page.evaluate(() => ({ rola: document.documentElement.scrollWidth, tela: document.documentElement.clientWidth }));
  expect(m.rola, `largura do documento ${m.rola} > ${m.tela}`).toBeLessThanOrEqual(m.tela + 1);
}
