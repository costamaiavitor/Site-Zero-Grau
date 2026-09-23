/* ==========================================================================
   ZERO GRAU · a porta

   Duas perguntas antes do catálogo, nesta ordem:

   1. Idade. Exigência da Lei nº 13.106/2015 para bebida alcoólica.
   2. Login: e-mail, senha e CPF ou CNPJ. O documento é o que decide para
      qual das duas lojas a pessoa vai: CPF vai para a vitrine de varejo,
      CNPJ vai para o balcão de atacado, que vende por caixa fechada e com
      preço de revenda.

   ⚠ O login ainda não tem servidor. A tela está pronta, mas nada aqui confere
   se a senha é a certa: o script só olha o formato (e-mail com @ e domínio,
   senha com 6 caracteres ou mais, documento com a contagem certa). Por isso
   a senha não é guardada em lugar nenhum — nem sessionStorage, nem
   localStorage — e o campo é esvaziado logo depois de entrar. Guardar senha
   no navegador sem um servidor para conferi-la seria só um risco a mais.

   Para ligar o servidor, o ponto é `autenticar()`, logo abaixo: hoje ele
   aceita tudo que passou na conferência de formato; é ali que entra a
   chamada ao backend, e o resto da porta não precisa mudar.

   ⚠ A conferência do dígito verificador está DESLIGADA (CONFERE_DIGITO, logo
   abaixo). Neste momento qualquer número passa, desde que tenha 11 dígitos
   para CPF ou 14 para CNPJ — o que ainda decide a loja é a contagem. O
   algoritmo continua aqui, testado, e volta a valer trocando a chave para
   true.

   As duas caixas nascem fechadas no CSS e é o script que as abre. Sem
   JavaScript não há parede: o visitante cai na vitrine de varejo, que é a
   escolha segura — o atacado exige aprovação de cadastro de qualquer jeito.
   ========================================================================== */

const PUBLICO = document.body.dataset.publico;          /* "varejo" | "atacado" */

/* A chave do dígito verificador. Desligada por ora, a pedido: qualquer número
   com a contagem certa entra. Ligar é trocar para true — nada mais muda, e os
   dois algoritmos abaixo continuam cobertos por teste. */
const CONFERE_DIGITO = false;

const PERFIL = {
  ler(){
    try{ return JSON.parse(sessionStorage.getItem("zg-perfil") || "null") }
    catch{ return null }
  },
  gravar(p){
    try{ sessionStorage.setItem("zg-perfil", JSON.stringify(p)) }catch{ /* segue sem lembrar */ }
  },
  limpar(){
    try{ sessionStorage.removeItem("zg-perfil") }catch{}
  }
};

/* Quem a pessoa é e onde ela escolheu ficar são duas coisas.

   Na primeira versão eram uma só, e o link "ver a loja de varejo" do atacado
   virava um pingue-pongue: index.html via o CNPJ guardado e devolvia a pessoa
   para atacado.html, que devolvia de novo. O documento define o destino
   padrão; a escolha explícita, quando existe, manda mais que ele. */
const LOJA = {
  ler(){ try{ return sessionStorage.getItem("zg-loja") }catch{ return null } },
  gravar(v){ try{ sessionStorage.setItem("zg-loja", v) }catch{} },
  limpar(){ try{ sessionStorage.removeItem("zg-loja") }catch{} }
};

const DESTINO = {varejo: "index.html", atacado: "atacado.html"};

/* ---------- dígito verificador ----------
   Os dois algoritmos são o mesmo esqueleto: soma ponderada dos dígitos,
   resto por 11, e o dígito é 0 quando o resto dá menos que 2. Só mudam os
   pesos. Rejeitar os repetidos (111.111.111-11) é necessário porque eles
   passam na conta — é o buraco clássico de quem implementa só a fórmula.

   Quem chama é `aceitaCPF` / `aceitaCNPJ`, que olham a chave antes. */
function digitos(v){ return v.replace(/\D/g, "") }

function cpfValido(v){
  const n = digitos(v);
  if(n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  for(const [tam, ini] of [[9, 10], [10, 11]]){
    let soma = 0;
    for(let i = 0; i < tam; i++) soma += +n[i] * (ini - i);
    const d = (soma * 10) % 11 % 10;
    if(d !== +n[tam]) return false;
  }
  return true;
}

function cnpjValido(v){
  const n = digitos(v);
  if(n.length !== 14 || /^(\d)\1{13}$/.test(n)) return false;
  for(const tam of [12, 13]){
    let soma = 0, peso = tam - 7;
    for(let i = 0; i < tam; i++){
      soma += +n[i] * peso;
      peso = --peso < 2 ? 9 : peso;
    }
    const resto = soma % 11;
    if((resto < 2 ? 0 : 11 - resto) !== +n[tam]) return false;
  }
  return true;
}

/* o que a porta de fato exige hoje: contagem, e o dígito só se a chave mandar */
const aceitaCPF  = v => !CONFERE_DIGITO || cpfValido(v);
const aceitaCNPJ = v => !CONFERE_DIGITO || cnpjValido(v);

function mascarar(v){
  const n = digitos(v).slice(0, 14);
  if(n.length <= 11){
    return n.replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return n.replace(/^(\d{2})(\d)/, "$1.$2")
          .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
          .replace(/\.(\d{3})(\d)/, ".$1/$2")
          .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/* ---------- foco preso ----------
   Um diálogo que cobre a tela mas deixa o Tab passear pelo conteúdo atrás não
   é um diálogo. Vale para o aviso de idade, para a identificação e para o
   carrinho — por isso mora aqui, que as três páginas carregam. */
const FOCAVEIS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

function prenderFoco(caixa){
  return e => {
    if(e.key !== "Tab") return;
    const alvos = [...caixa.querySelectorAll(FOCAVEIS)].filter(el => el.offsetParent !== null);
    if(!alvos.length) return;
    const primeiro = alvos[0], ultimo = alvos[alvos.length - 1];
    if(e.shiftKey && document.activeElement === primeiro){ e.preventDefault(); ultimo.focus(); }
    else if(!e.shiftKey && document.activeElement === ultimo){ e.preventDefault(); primeiro.focus(); }
  };
}

/* ---------- abrir e fechar ---------- */
function abrirCaixa(caixa, abrir, foco){
  caixa.classList.toggle("aberto", abrir);
  caixa.setAttribute("aria-hidden", String(!abrir));
  document.body.classList.toggle("locked", abrir);
  caixa[abrir ? "addEventListener" : "removeEventListener"]("keydown", foco);
}

/* ---------- 1. idade ---------- */
const gate = document.getElementById("gate");
const focoGate = prenderFoco(gate);
const idadeOk = () => { try{ return sessionStorage.getItem("zg-idade") === "ok" }catch{ return false } };

/* ---------- 2. login ---------- */
const porta    = document.getElementById("porta");
const focoPorta = prenderFoco(porta);
const loginForm  = document.getElementById("loginForm");
const emailInput = document.getElementById("emailInput");
const senhaInput = document.getElementById("senhaInput");
const senhaVer   = document.getElementById("senhaVer");
const docInput = document.getElementById("docInput");
const docMsg   = document.getElementById("docMsg");
const docTipo  = document.getElementById("docTipo");

function tipoDe(v){
  const n = digitos(v);
  if(n.length === 11) return aceitaCPF(v)  ? "varejo"  : null;
  if(n.length === 14) return aceitaCNPJ(v) ? "atacado" : null;
  return null;
}

/* A dica muda enquanto a pessoa digita: ela sabe para onde vai antes de
   apertar o botão, em vez de descobrir com uma troca de página. */
function dica(){
  const n = digitos(docInput.value);
  docTipo.className = "doc-tipo";
  if(!n.length){ docTipo.textContent = ""; return; }
  if(n.length < 11){ docTipo.textContent = "CPF tem 11 dígitos, CNPJ tem 14."; return; }
  if(n.length === 11){
    const ok = aceitaCPF(n);
    docTipo.classList.add(ok ? "ok" : "bad");
    docTipo.textContent = ok ? "CPF · você compra no varejo" : "CPF inválido — confira os dígitos.";
    return;
  }
  if(n.length < 14){ docTipo.textContent = "Faltam dígitos para um CNPJ."; return; }
  const ok = aceitaCNPJ(n);
  docTipo.classList.add(ok ? "ok" : "bad");
  docTipo.textContent = ok ? "CNPJ · você compra no atacado, por caixa fechada"
                           : "CNPJ inválido — confira os dígitos.";
}

const SENHA_MIN = 6;
/* Formato, não existência: algo@algo.algo, sem espaço. Conferir se a caixa de
   e-mail existe é trabalho de servidor. */
const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/* Um erro de cada vez, na ordem em que os campos aparecem: a mensagem diz o
   que falta e o foco vai para o campo, que ganha aria-invalid para o leitor
   de tela anunciar junto. */
function recusar(campo, texto){
  for(const c of [emailInput, senhaInput, docInput]) c.removeAttribute("aria-invalid");
  campo.setAttribute("aria-invalid", "true");
  docMsg.className = "doc-msg bad";
  docMsg.textContent = texto;
  campo.focus();
}

/* O ponto onde o servidor entra. Hoje não há: quem passou na conferência de
   formato está dentro. Quando houver, é aqui que se manda e-mail, senha e
   documento, e uma recusa volta pela mesma `recusar()`. */
function autenticar(dados){
  return Promise.resolve(true);
}

async function entrar(){
  const email = emailInput.value.trim();
  if(!email)              return recusar(emailInput, "Digite seu e-mail.");
  if(!emailValido(email)) return recusar(emailInput, "Esse e-mail não parece completo — confira o @ e o domínio.");
  if(!senhaInput.value)   return recusar(senhaInput, "Digite sua senha.");
  if(senhaInput.value.length < SENHA_MIN)
    return recusar(senhaInput, `A senha tem de ter pelo menos ${SENHA_MIN} caracteres.`);

  const destino = tipoDe(docInput.value);
  if(!destino){
    return recusar(docInput, !CONFERE_DIGITO || digitos(docInput.value).length < 11
      ? "Digite um CPF (11 dígitos) ou um CNPJ (14)."
      : "Esse número não fecha no dígito verificador. Confira e tente de novo.");
  }

  const ok = await autenticar({email, senha: senhaInput.value, doc: digitos(docInput.value)});
  senhaInput.value = "";                      /* a senha não fica nem no campo */
  if(!ok) return recusar(senhaInput, "E-mail ou senha não conferem.");

  PERFIL.gravar({tipo: destino === "varejo" ? "cpf" : "cnpj", doc: mascarar(docInput.value), email});
  LOJA.gravar(destino);
  if(destino === PUBLICO) fecharPorta();
  else location.href = DESTINO[destino];
}

function fecharPorta(){
  abrirCaixa(porta, false, focoPorta);
  document.dispatchEvent(new CustomEvent("zg:entrou", {detail: PERFIL.ler()}));
}

/* `email` vem preenchido quando a pessoa já entrou e só o documento não
   serve nesta loja: pedir o e-mail de novo seria castigo. */
function abrirPorta(nota, email = ""){
  abrirCaixa(porta, true, focoPorta);
  loginForm.reset();
  mostrarSenha(false);
  emailInput.value = email;
  for(const c of [emailInput, senhaInput, docInput]) c.removeAttribute("aria-invalid");
  docTipo.textContent = "";
  docMsg.textContent = nota || "";
  docMsg.className = nota ? "doc-msg bad" : "doc-msg";
  (email ? senhaInput : emailInput).focus();
}

function fecharGate(){
  abrirCaixa(gate, false, focoGate);
  try{ sessionStorage.setItem("zg-idade", "ok") }catch{ /* segue sem lembrar */ }
  seguir();
}

/* Decide o que fazer depois da idade: quem já se identificou entra direto, e
   quem se identificou como o outro público é mandado para a loja dele. */
function seguir(){
  const p = PERFIL.ler();
  if(!p){ abrirPorta(); return; }

  const loja = LOJA.ler() || (p.tipo === "cnpj" ? "atacado" : "varejo");
  if(loja !== PUBLICO){ location.href = DESTINO[loja]; return; }

  /* Escolher vir para o atacado não basta: o balcão vende com preço de
     revenda e nota, então aqui o documento tem de ser CNPJ. O caminho de
     volta é o mesmo campo — digitar um CPF manda para o varejo. */
  if(PUBLICO === "atacado" && p.tipo !== "cnpj"){
    abrirPorta("O balcão de atacado precisa de um CNPJ.", p.email || "");
    return;
  }
  document.dispatchEvent(new CustomEvent("zg:entrou", {detail: p}));
}

/* Mostrar a senha: no celular, digitar às cegas é onde mais se erra. O botão
   troca o tipo do campo e diz o próprio estado com aria-pressed. */
function mostrarSenha(ver){
  senhaInput.type = ver ? "text" : "password";
  senhaVer.setAttribute("aria-pressed", String(ver));
  senhaVer.textContent = ver ? "Ocultar" : "Mostrar";
}
senhaVer.addEventListener("click", () => {
  mostrarSenha(senhaInput.type === "password");
  senhaInput.focus();
});

/* Corrigir o campo apaga a queixa sobre ele. */
function limparQueixa(campo){
  if(campo.getAttribute("aria-invalid") !== "true") return;
  campo.removeAttribute("aria-invalid");
  docMsg.textContent = "";
  docMsg.className = "doc-msg";
}
emailInput.addEventListener("input", () => limparQueixa(emailInput));
senhaInput.addEventListener("input", () => limparQueixa(senhaInput));
docInput.addEventListener("input", () => {
  docInput.value = mascarar(docInput.value);
  limparQueixa(docInput);
  dica();
});
/* O formulário cuida do Enter em qualquer campo e deixa o gerenciador de
   senhas do navegador reconhecer o login. */
loginForm.addEventListener("submit", e => { e.preventDefault(); entrar(); });
document.getElementById("gateYes").addEventListener("click", fecharGate);

/* trocar de documento: volta à pergunta sem perder o aviso de idade */
for(const el of document.querySelectorAll("[data-trocar]")){
  el.addEventListener("click", e => {
    e.preventDefault();
    PERFIL.limpar(); LOJA.limpar();
    abrirPorta();
  });
}

/* atravessar de uma loja para a outra é uma escolha, e fica registrada antes
   de a navegação acontecer — senão a outra página devolve a pessoa para cá */
for(const el of document.querySelectorAll("[data-loja]")){
  el.addEventListener("click", () => LOJA.gravar(el.dataset.loja));
}

/* escreve o documento identificado onde a página pedir, e o e-mail da conta
   na dica do botão de trocar */
document.addEventListener("zg:entrou", e => {
  for(const el of document.querySelectorAll("[data-doc]")) el.textContent = e.detail?.doc || "";
  for(const el of document.querySelectorAll("[data-trocar]"))
    el.title = e.detail?.email ? `Conectado como ${e.detail.email} · trocar de conta` : "Trocar de conta";
});

if(!idadeOk()){
  abrirCaixa(gate, true, focoGate);
  document.getElementById("gateYes").focus();
}else{
  seguir();
}
