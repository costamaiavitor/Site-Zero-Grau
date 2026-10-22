const PUBLICO = document.body.dataset.publico;
const CONFERE_DIGITO = false;
const SENHA_MIN = 6;
const NOME_MIN = 3;

const PERFIL = {
  ler() {
    try {
      return JSON.parse(sessionStorage.getItem("zg-perfil") || "null");
    } catch {
      return null;
    }
  },
  gravar(perfil) {
    try {
      sessionStorage.setItem("zg-perfil", JSON.stringify(perfil));
    } catch {}
  },
  limpar() {
    try {
      sessionStorage.removeItem("zg-perfil");
    } catch {}
  }
};

const LOJA = {
  ler() {
    try {
      return sessionStorage.getItem("zg-loja");
    } catch {
      return null;
    }
  },
  gravar(loja) {
    try {
      sessionStorage.setItem("zg-loja", loja);
    } catch {}
  },
  limpar() {
    try {
      sessionStorage.removeItem("zg-loja");
    } catch {}
  }
};

const PAGINA_DA_LOJA = {varejo: "index.html", atacado: "atacado.html"};

const CHAVES_SEM_CONTA = ["zg-carrinho", "zg-atacado", "zg-pedidos", "zg-endereco", "zg-entrega"];
try {
  for (const chave of CHAVES_SEM_CONTA) localStorage.removeItem(chave);
} catch {}


function idConta(perfil) {
  if (!perfil) return null;
  if (perfil.id !== undefined && perfil.id !== null) return `id-${perfil.id}`;
  if (perfil.email) return String(perfil.email).toLowerCase();
  return null;
}

function chaveDaConta(nomeBase) {
  const id = idConta(PERFIL.ler());
  if (!id) return null;
  return `${nomeBase}:${id}`;
}

function lerDaConta(nomeBase, valorPadrao) {
  const chave = chaveDaConta(nomeBase);
  if (!chave) return valorPadrao;
  try {
    const salvo = JSON.parse(localStorage.getItem(chave) || "null");
    return salvo ?? valorPadrao;
  } catch {
    return valorPadrao;
  }
}

function gravarNaConta(nomeBase, valor) {
  const chave = chaveDaConta(nomeBase);
  if (!chave) return;
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {}
}


function soNumeros(texto) {
  return texto.replace(/\D/g, "");
}

function cpfValido(cpf) {
  const numeros = soNumeros(cpf);
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;
  for (const [tamanho, pesoInicial] of [[9, 10], [10, 11]]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(numeros[i]) * (pesoInicial - i);
    }
    const digito = (soma * 10) % 11 % 10;
    if (digito !== Number(numeros[tamanho])) return false;
  }
  return true;
}

function cnpjValido(cnpj) {
  const numeros = soNumeros(cnpj);
  if (numeros.length !== 14 || /^(\d)\1{13}$/.test(numeros)) return false;
  for (const tamanho of [12, 13]) {
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(numeros[i]) * peso;
      peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    const digito = resto < 2 ? 0 : 11 - resto;
    if (digito !== Number(numeros[tamanho])) return false;
  }
  return true;
}

function aceitaCPF(cpf) {
  return !CONFERE_DIGITO || cpfValido(cpf);
}

function aceitaCNPJ(cnpj) {
  return !CONFERE_DIGITO || cnpjValido(cnpj);
}

function mascararDocumento(texto) {
  const numeros = soNumeros(texto).slice(0, 14);
  if (numeros.length <= 11) {
    return numeros
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function lojaDoDocumento(documento) {
  const numeros = soNumeros(documento);
  if (numeros.length === 11) return aceitaCPF(documento) ? "varejo" : null;
  if (numeros.length === 14) return aceitaCNPJ(documento) ? "atacado" : null;
  return null;
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}


const ELEMENTOS_FOCAVEIS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

function prenderFoco(caixa) {
  return evento => {
    if (evento.key !== "Tab") return;
    const focaveis = [...caixa.querySelectorAll(ELEMENTOS_FOCAVEIS)].filter(elemento => elemento.offsetParent !== null);
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  };
}

function abrirCaixa(caixa, abrir, prenderTeclado) {
  caixa.classList.toggle("aberto", abrir);
  caixa.setAttribute("aria-hidden", String(!abrir));
  document.body.classList.toggle("locked", abrir);
  if (abrir) {
    caixa.addEventListener("keydown", prenderTeclado);
  } else {
    caixa.removeEventListener("keydown", prenderTeclado);
  }
}


const avisoDeIdade = document.getElementById("gate");
const botaoTenhoIdade = document.getElementById("gateYes");
const focoAvisoDeIdade = prenderFoco(avisoDeIdade);

const porta = document.getElementById("porta");
const focoPorta = prenderFoco(porta);
const paineisDaPorta = {entrar: document.getElementById("painelEntrar"), criar: document.getElementById("painelCriar")};
const tituloDoPainel = {entrar: "portaTitle", criar: "criarTitle"};

const formLogin = document.getElementById("loginForm");
const campoEmailLogin = document.getElementById("emailInput");
const campoSenhaLogin = document.getElementById("senhaInput");
const mensagemLogin = document.getElementById("docMsg");
const botaoEntrar = document.getElementById("docBtn");

const formCadastro = document.getElementById("criarForm");
const campoDocumento = document.getElementById("cDocInput");
const dicaDocumento = document.getElementById("cDocTipo");
const campoNome = document.getElementById("nomeInput");
const rotuloNome = document.getElementById("nomeTag");
const campoEmailCadastro = document.getElementById("cEmailInput");
const campoSenhaCadastro = document.getElementById("cSenhaInput");
const campoConfirmaSenha = document.getElementById("cConfInput");
const mensagemCadastro = document.getElementById("criarMsg");
const botaoCriarConta = document.getElementById("criarBtn");

function idadeConfirmada() {
  try {
    return sessionStorage.getItem("zg-idade") === "ok";
  } catch {
    return false;
  }
}

function mostrarDicaDocumento() {
  const numeros = soNumeros(campoDocumento.value);
  dicaDocumento.className = "doc-tipo";

  if (!numeros.length) {
    dicaDocumento.textContent = "";
    return;
  }
  if (numeros.length < 11) {
    dicaDocumento.textContent = "CPF tem 11 dígitos, CNPJ tem 14.";
    return;
  }
  if (numeros.length === 11) {
    const cpfAceito = aceitaCPF(numeros);
    dicaDocumento.classList.add(cpfAceito ? "ok" : "bad");
    dicaDocumento.textContent = cpfAceito ? "CPF · você compra no varejo" : "CPF inválido — confira os dígitos.";
    return;
  }
  if (numeros.length < 14) {
    dicaDocumento.textContent = "Faltam dígitos para um CNPJ.";
    return;
  }
  const cnpjAceito = aceitaCNPJ(numeros);
  dicaDocumento.classList.add(cnpjAceito ? "ok" : "bad");
  dicaDocumento.textContent = cnpjAceito
    ? "CNPJ · você compra no atacado, por caixa fechada"
    : "CNPJ inválido — confira os dígitos.";
}

function ajustarRotuloNome() {
  const empresa = soNumeros(campoDocumento.value).length > 11;
  rotuloNome.textContent = empresa ? "Razão social" : "Nome completo";
  campoNome.autocomplete = empresa ? "organization" : "name";
  campoNome.placeholder = empresa ? "como está no CNPJ" : "como está no documento";
}

function mostrarErro(form, mensagem, campo, texto) {
  for (const input of form.querySelectorAll("input")) {
    input.removeAttribute("aria-invalid");
  }
  campo.setAttribute("aria-invalid", "true");
  mensagem.className = "doc-msg bad";
  mensagem.textContent = texto;
  campo.focus();
  return null;
}

function erroNoLogin(campo, texto) {
  return mostrarErro(formLogin, mensagemLogin, campo, texto);
}

function erroNoCadastro(campo, texto) {
  return mostrarErro(formCadastro, mensagemCadastro, campo, texto);
}

function textoDocumentoInvalido(documento) {
  if (!CONFERE_DIGITO || soNumeros(documento).length < 11) {
    return "Digite um CPF (11 dígitos) ou um CNPJ (14).";
  }
  return "Esse número não fecha no dígito verificador. Confira e tente de novo.";
}


const CONTAS = {
  todas() {
    try {
      return JSON.parse(localStorage.getItem("zg-contas") || "{}") || {};
    } catch {
      return {};
    }
  },
  achar(email) {
    return this.todas()[email.toLowerCase()] || null;
  },
  gravar(conta) {
    try {
      const contas = this.todas();
      contas[conta.email.toLowerCase()] = conta;
      localStorage.setItem("zg-contas", JSON.stringify(contas));
      return true;
    } catch {
      return false;
    }
  }
};

function contaDaApi(usuario) {
  return {
    id: usuario.id,
    email: String(usuario.email).toLowerCase(),
    nome: usuario.nome,
    doc: usuario.documento,
    tipo: usuario.tipo_documento,
    perfil: usuario.perfil || "cliente"
  };
}

async function autenticar({email, senha}) {
  if (!API.usarMock) {
    try {
      const resposta = await API.post("/auth/login", {email: email.trim().toLowerCase(), senha}, {token: null});
      if (!resposta?.token || !resposta.usuario) {
        return {erro: "O servidor não devolveu a sessão. Tente de novo."};
      }
      API.token.gravar(resposta.token);
      return {conta: contaDaApi(resposta.usuario)};
    } catch (erro) {
      if (erro.status === 401) return {erro: "E-mail ou senha incorretos.", campo: "senha"};
      return {erro: erro.message};
    }
  }

  const conta = CONTAS.achar(email);
  if (!conta) {
    return {erro: "Não encontramos uma conta com esse e-mail. Confira o endereço ou crie uma conta.", campo: "email"};
  }

  let hash;
  try {
    hash = await hashSenha(email, senha);
  } catch {
    return {erro: "Este navegador não deixa conferir a senha com segurança aqui. Abra o site pelo endereço https."};
  }

  if (!conta.senhaHash) {
    CONTAS.gravar({...conta, senhaHash: hash});
    return {conta};
  }
  if (conta.senhaHash !== hash) {
    return {erro: "Senha incorreta. Confira e tente de novo.", campo: "senha"};
  }
  return {conta};
}

async function cadastrar({nome, email, senha, doc, tipo}) {
  if (!API.usarMock) {
    try {
      await API.post("/auth/cadastro", {nome, email: email.trim().toLowerCase(), senha, documento: doc, tipo_documento: tipo}, {token: null});
    } catch (erro) {
      if (erro.status === 400 && /e-mail/i.test(erro.message) && /cadastrad/i.test(erro.message)) {
        return {ok: false, campo: "email"};
      }
      return {ok: false, erro: erro.message};
    }
    const login = await autenticar({email, senha});
    if (!login.conta) {
      return {ok: false, erro: login.erro || "A conta foi criada, mas não deu para entrar agora. Entre com o e-mail e a senha."};
    }
    return {ok: true, conta: login.conta};
  }

  if (CONTAS.achar(email)) return {ok: false, campo: "email"};
  const senhaHash = await hashSenha(email, senha);
  return {ok: CONTAS.gravar({email: email.toLowerCase(), nome, doc, tipo, senhaHash})};
}

function irParaLoja(loja, dadosDoPerfil) {
  PERFIL.gravar({tipo: loja === "varejo" ? "cpf" : "cnpj", ...dadosDoPerfil});
  LOJA.gravar(loja);
  if (loja === PUBLICO) {
    fecharPorta();
  } else {
    location.href = PAGINA_DA_LOJA[loja];
  }
}

async function entrar() {
  const email = campoEmailLogin.value.trim();
  if (!email) return erroNoLogin(campoEmailLogin, "Digite seu e-mail.");
  if (!emailValido(email)) return erroNoLogin(campoEmailLogin, "Esse e-mail não parece completo — confira o @ e o domínio.");
  if (!campoSenhaLogin.value) return erroNoLogin(campoSenhaLogin, "Digite sua senha.");
  if (campoSenhaLogin.value.length < SENHA_MIN) {
    return erroNoLogin(campoSenhaLogin, `A senha tem de ter pelo menos ${SENHA_MIN} caracteres.`);
  }

  botaoEntrar.disabled = true;
  const {conta, erro, campo} = await autenticar({email, senha: campoSenhaLogin.value});
  botaoEntrar.disabled = false;
  campoSenhaLogin.value = "";

  if (!conta) {
    return erroNoLogin(campo === "email" ? campoEmailLogin : campoSenhaLogin, erro);
  }

  const dadosDoPerfil = {doc: conta.doc, email: conta.email, nome: conta.nome};
  if (conta.id !== undefined) dadosDoPerfil.id = conta.id;
  if (conta.perfil) dadosDoPerfil.perfil = conta.perfil;
  irParaLoja(conta.tipo === "cnpj" ? "atacado" : "varejo", dadosDoPerfil);
}

async function criarConta() {
  const loja = lojaDoDocumento(campoDocumento.value);
  if (!loja) return erroNoCadastro(campoDocumento, textoDocumentoInvalido(campoDocumento.value));

  const nome = campoNome.value.trim().replace(/\s+/g, " ");
  const oQuePedir = loja === "atacado" ? "a razão social" : "seu nome";
  const completo = loja === "atacado" ? "completa" : "completo";
  if (!nome) return erroNoCadastro(campoNome, `Digite ${oQuePedir}.`);
  if (nome.length < NOME_MIN) return erroNoCadastro(campoNome, `Digite ${oQuePedir} ${completo}.`);

  const email = campoEmailCadastro.value.trim();
  if (!email) return erroNoCadastro(campoEmailCadastro, "Digite seu e-mail.");
  if (!emailValido(email)) return erroNoCadastro(campoEmailCadastro, "Esse e-mail não parece completo — confira o @ e o domínio.");
  if (!campoSenhaCadastro.value) return erroNoCadastro(campoSenhaCadastro, "Crie uma senha.");
  if (campoSenhaCadastro.value.length < SENHA_MIN) {
    return erroNoCadastro(campoSenhaCadastro, `A senha tem de ter pelo menos ${SENHA_MIN} caracteres.`);
  }
  if (!campoConfirmaSenha.value) return erroNoCadastro(campoConfirmaSenha, "Repita a senha para confirmar.");
  if (campoConfirmaSenha.value !== campoSenhaCadastro.value) {
    return erroNoCadastro(campoConfirmaSenha, "As duas senhas não são iguais.");
  }

  const tipo = loja === "atacado" ? "cnpj" : "cpf";
  botaoCriarConta.disabled = true;
  let cadastro;
  try {
    cadastro = await cadastrar({nome, email, senha: campoSenhaCadastro.value, doc: mascararDocumento(campoDocumento.value), tipo});
  } catch {
    cadastro = {ok: false, erro: "Este navegador não deixa guardar a senha com segurança aqui. Abra o site pelo endereço https.", campo: "senha"};
  } finally {
    botaoCriarConta.disabled = false;
  }

  if (!cadastro.ok) {
    if (cadastro.campo === "email") {
      campoSenhaCadastro.value = campoConfirmaSenha.value = "";
      return erroNoCadastro(campoEmailCadastro, "Já existe uma conta com esse e-mail. Entre com ela.");
    }
    return erroNoCadastro(cadastro.campo === "senha" ? campoSenhaCadastro : campoDocumento, cadastro.erro);
  }

  campoSenhaCadastro.value = campoConfirmaSenha.value = "";
  const conta = cadastro.conta;
  if (conta) {
    irParaLoja(loja, {doc: conta.doc, email: conta.email, nome: conta.nome, id: conta.id, perfil: conta.perfil});
  } else {
    irParaLoja(loja, {doc: mascararDocumento(campoDocumento.value), email: email.toLowerCase(), nome});
  }
}

function focarDoTopo(campo) {
  porta.scrollTop = 0;
  campo.focus({preventScroll: true});
}

function mostrarPainel(painel) {
  const outroPainel = painel === "entrar" ? "criar" : "entrar";
  const origem = painel === "criar" ? campoEmailLogin : campoEmailCadastro;
  const destino = painel === "criar" ? campoEmailCadastro : campoEmailLogin;
  if (origem.value && !destino.value) destino.value = origem.value;
  mostrarDicaDocumento();
  ajustarRotuloNome();

  paineisDaPorta[painel].hidden = false;
  paineisDaPorta[outroPainel].hidden = true;
  porta.setAttribute("aria-labelledby", tituloDoPainel[painel]);

  for (const mensagem of [mensagemLogin, mensagemCadastro]) {
    mensagem.textContent = "";
    mensagem.className = "doc-msg";
  }
  for (const input of porta.querySelectorAll("input")) {
    input.removeAttribute("aria-invalid");
  }

  const form = painel === "entrar" ? formLogin : formCadastro;
  const primeiroVazio = [...form.querySelectorAll("input")].find(input => !input.value);
  focarDoTopo(primeiroVazio || form.querySelector("input"));
}

function ligarBotaoVerSenha(idDoBotao, campos) {
  const botao = document.getElementById(idDoBotao);
  const mostrarSenha = ver => {
    for (const campo of campos) {
      campo.type = ver ? "text" : "password";
    }
    botao.setAttribute("aria-pressed", String(ver));
    botao.textContent = ver ? "Ocultar" : "Mostrar";
  };
  botao.addEventListener("click", () => {
    mostrarSenha(campos[0].type === "password");
    campos[0].focus();
  });
  return mostrarSenha;
}

const mostrarSenhas = [
  ligarBotaoVerSenha("senhaVer", [campoSenhaLogin]),
  ligarBotaoVerSenha("cSenhaVer", [campoSenhaCadastro, campoConfirmaSenha])
];

function fecharPorta() {
  abrirCaixa(porta, false, focoPorta);
  document.dispatchEvent(new CustomEvent("zg:entrou", {detail: PERFIL.ler()}));
}

function abrirPorta(aviso, email = "") {
  abrirCaixa(porta, true, focoPorta);
  formLogin.reset();
  formCadastro.reset();
  for (const mostrarSenha of mostrarSenhas) mostrarSenha(false);
  mostrarPainel("entrar");
  campoEmailLogin.value = email;
  mensagemLogin.textContent = aviso || "";
  mensagemLogin.className = aviso ? "doc-msg bad" : "doc-msg";
  focarDoTopo(email ? campoSenhaLogin : campoEmailLogin);
}

function confirmarIdade() {
  abrirCaixa(avisoDeIdade, false, focoAvisoDeIdade);
  try {
    sessionStorage.setItem("zg-idade", "ok");
  } catch {}
  decidirEntrada();
}

function decidirEntrada() {
  const perfil = PERFIL.ler();
  if (!perfil) {
    abrirPorta();
    return;
  }

  const lojaEscolhida = LOJA.ler() || (perfil.tipo === "cnpj" ? "atacado" : "varejo");
  if (lojaEscolhida !== PUBLICO) {
    location.href = PAGINA_DA_LOJA[lojaEscolhida];
    return;
  }

  if (PUBLICO === "atacado" && perfil.tipo !== "cnpj") {
    abrirPorta("O balcão de atacado é para conta de CNPJ. Entre com uma, ou crie uma conta com o CNPJ da empresa.", "");
    return;
  }
  document.dispatchEvent(new CustomEvent("zg:entrou", {detail: perfil}));
}

function limparErroAoDigitar(form, mensagem) {
  for (const input of form.querySelectorAll("input")) {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") !== "true") return;
      input.removeAttribute("aria-invalid");
      mensagem.textContent = "";
      mensagem.className = "doc-msg";
    });
  }
}

limparErroAoDigitar(formLogin, mensagemLogin);
limparErroAoDigitar(formCadastro, mensagemCadastro);

campoDocumento.addEventListener("input", () => {
  campoDocumento.value = mascararDocumento(campoDocumento.value);
  mostrarDicaDocumento();
  ajustarRotuloNome();
});

for (const botao of porta.querySelectorAll("[data-painel]")) {
  botao.addEventListener("click", () => mostrarPainel(botao.dataset.painel));
}

formLogin.addEventListener("submit", evento => {
  evento.preventDefault();
  entrar();
});

formCadastro.addEventListener("submit", evento => {
  evento.preventDefault();
  criarConta();
});

botaoTenhoIdade.addEventListener("click", confirmarIdade);

for (const botao of document.querySelectorAll("[data-trocar]")) {
  botao.addEventListener("click", evento => {
    evento.preventDefault();
    PERFIL.limpar();
    LOJA.limpar();
    API.token.limpar();
    abrirPorta();
  });
}

for (const link of document.querySelectorAll("[data-loja]")) {
  link.addEventListener("click", () => LOJA.gravar(link.dataset.loja));
}

document.addEventListener("zg:entrou", evento => {
  const perfil = evento.detail;
  for (const elemento of document.querySelectorAll("[data-doc]")) {
    elemento.textContent = perfil?.doc || "";
  }
  for (const botao of document.querySelectorAll("[data-trocar]")) {
    if (perfil?.email) {
      const quem = perfil.nome ? `${perfil.nome} (${perfil.email})` : perfil.email;
      botao.title = `Conectado como ${quem} · trocar de conta`;
    } else {
      botao.title = "Trocar de conta";
    }
  }
});

const avisoDaPorta = porta.querySelector(".gate-legal");
if (avisoDaPorta) {
  avisoDaPorta.textContent = API.usarMock
    ? "Os dados ficam só neste navegador, e a senha é guardada só como hash, nunca como texto. O cadastro de revenda é aprovado depois, quando o pedido chega."
    : "A senha é conferida no servidor da loja e não fica guardada neste navegador. O cadastro de revenda é aprovado depois, quando o pedido chega.";
}

if (!idadeConfirmada()) {
  abrirCaixa(avisoDeIdade, true, focoAvisoDeIdade);
  botaoTenhoIdade.focus();
} else {
  decidirEntrada();
}
