const configDaApi = typeof ZG_CONFIG === "object" && ZG_CONFIG ? ZG_CONFIG : {};
const enderecoDaApi = String(configDaApi.apiBase || "").replace(/\/+$/, "");
const TEMPO_LIMITE_API = 10000;

const TOKEN_SESSAO = {
  ler() {
    try {
      return sessionStorage.getItem("zg-token");
    } catch {
      return null;
    }
  },
  gravar(token) {
    try {
      sessionStorage.setItem("zg-token", token);
    } catch {}
  },
  limpar() {
    try {
      sessionStorage.removeItem("zg-token");
    } catch {}
  }
};

class ErroApi extends Error {
  constructor(mensagem, status = 0, dados = null) {
    super(mensagem);
    this.status = status;
    this.dados = dados;
  }
}

async function chamarApi(caminho, {metodo = "GET", corpo, token = TOKEN_SESSAO.ler(), formulario} = {}) {
  const controle = new AbortController();
  const tempoEsgotado = setTimeout(() => controle.abort(), TEMPO_LIMITE_API);

  const cabecalhos = {Accept: "application/json"};
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let conteudo;
  if (formulario) {
    conteudo = formulario;
  } else if (corpo !== undefined) {
    conteudo = JSON.stringify(corpo);
  }

  let resposta;
  try {
    resposta = await fetch(enderecoDaApi + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: conteudo,
      signal: controle.signal
    });
  } catch {
    throw new ErroApi("Não deu para falar com o servidor da loja. Confira a internet e tente de novo.", 0);
  } finally {
    clearTimeout(tempoEsgotado);
  }

  let json = null;
  try {
    json = await resposta.json();
  } catch {}

  if (!resposta.ok) {
    throw new ErroApi(json?.erro || `O servidor respondeu com erro ${resposta.status}.`, resposta.status, json);
  }
  return json;
}

const API = {
  usarMock: configDaApi.usarMock !== false || !enderecoDaApi,
  base: enderecoDaApi,
  ErroApi,
  token: TOKEN_SESSAO,
  pedir: chamarApi,
  get: (caminho, opcoes) => chamarApi(caminho, opcoes),
  post: (caminho, corpo, opcoes = {}) => chamarApi(caminho, {...opcoes, metodo: "POST", corpo}),
  put: (caminho, corpo, opcoes = {}) => chamarApi(caminho, {...opcoes, metodo: "PUT", corpo}),
  patch: (caminho, corpo, opcoes = {}) => chamarApi(caminho, {...opcoes, metodo: "PATCH", corpo}),
  apagar: (caminho, opcoes = {}) => chamarApi(caminho, {...opcoes, metodo: "DELETE"})
};

async function hashSenha(email, senha) {
  if (!globalThis.crypto?.subtle) throw new Error("sem-cripto");
  const texto = `zero-grau:${String(email).trim().toLowerCase()}:${senha}`;
  const bytes = new TextEncoder().encode(texto);
  const resumo = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(resumo)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
