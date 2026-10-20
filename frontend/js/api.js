const API = (() => {
  const config = typeof ZG_CONFIG === "object" && ZG_CONFIG ? ZG_CONFIG : {};
  const base = String(config.apiBase || "").replace(/\/+$/, "");
  const usarMock = config.usarMock !== false || !base;
  const TEMPO_MAX = 10000;

  const TOKEN = {
    ler(){ try{ return sessionStorage.getItem("zg-token") }catch{ return null } },
    gravar(t){ try{ sessionStorage.setItem("zg-token", t) }catch{} },
    limpar(){ try{ sessionStorage.removeItem("zg-token") }catch{} }
  };

  class ErroApi extends Error {
    constructor(mensagem, status = 0, dados = null){
      super(mensagem);
      this.status = status;
      this.dados = dados;
    }
  }

  async function pedir(caminho, {metodo = "GET", corpo, token = TOKEN.ler(), formulario} = {}){
    const controle = new AbortController();
    const prazo = setTimeout(() => controle.abort(), TEMPO_MAX);
    const cabecalhos = {Accept: "application/json"};
    if(corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
    if(token) cabecalhos.Authorization = `Bearer ${token}`;
    let resposta;
    try{
      resposta = await fetch(base + caminho, {
        method: metodo,
        headers: cabecalhos,
        body: formulario || (corpo !== undefined ? JSON.stringify(corpo) : undefined),
        signal: controle.signal
      });
    }catch{
      throw new ErroApi("Não deu para falar com o servidor da loja. Confira a internet e tente de novo.", 0);
    }finally{
      clearTimeout(prazo);
    }
    let dados = null;
    try{ dados = await resposta.json() }catch{}
    if(!resposta.ok) throw new ErroApi(dados?.erro || `O servidor respondeu com erro ${resposta.status}.`, resposta.status, dados);
    return dados;
  }

  return {
    usarMock,
    base,
    ErroApi,
    token: TOKEN,
    pedir,
    get: (caminho, opcoes) => pedir(caminho, opcoes),
    post: (caminho, corpo, opcoes = {}) => pedir(caminho, {...opcoes, metodo: "POST", corpo}),
    put: (caminho, corpo, opcoes = {}) => pedir(caminho, {...opcoes, metodo: "PUT", corpo}),
    patch: (caminho, corpo, opcoes = {}) => pedir(caminho, {...opcoes, metodo: "PATCH", corpo}),
    apagar: (caminho, opcoes = {}) => pedir(caminho, {...opcoes, metodo: "DELETE"})
  };
})();

async function hashSenha(email, senha){
  if(!globalThis.crypto?.subtle) throw new Error("sem-cripto");
  const bytes = new TextEncoder().encode(`zero-grau:${String(email).trim().toLowerCase()}:${senha}`);
  const resumo = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(resumo)].map(b => b.toString(16).padStart(2, "0")).join("");
}
