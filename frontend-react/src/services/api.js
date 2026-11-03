const configuracao = typeof ZG_CONFIG === 'object' && ZG_CONFIG ? ZG_CONFIG : {};
const base = String(configuracao.apiBase || '').replace(/\/+$/, '');

export const usarMock = configuracao.usarMock !== false || !base;

export const adminsSimulados = Array.isArray(configuracao.adminsSimulados)
  ? configuracao.adminsSimulados.map(email => String(email).trim().toLowerCase())
  : [];

export class ErroApi extends Error {
  constructor(mensagem, status = 0) {
    super(mensagem);
    this.status = status;
  }
}

export function lerToken() {
  try {
    return sessionStorage.getItem('zg-token');
  } catch {
    return null;
  }
}

export function dadosDoToken(token = lerToken()) {
  const partes = String(token || '').split('.');
  if (partes.length !== 3) return null;
  try {
    return JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export async function chamarApi(caminho, { metodo = 'GET', corpo } = {}) {
  const cabecalhos = { Accept: 'application/json' };
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  const token = lerToken();
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(base + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    });
  } catch {
    throw new ErroApi('Não deu para falar com o servidor da loja. Confira a internet e tente de novo.');
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {}
  if (!resposta.ok) {
    const mensagem = resposta.status === 404
      ? 'O servidor ainda não tem essa função.'
      : dados?.erro || `O servidor respondeu com erro ${resposta.status}.`;
    throw new ErroApi(mensagem, resposta.status);
  }
  return dados;
}
