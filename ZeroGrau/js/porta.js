/* ==========================================================================
   ZERO GRAU · a porta

   Duas perguntas antes do catálogo, nesta ordem:

   1. Idade. Exigência da Lei nº 13.106/2015 para bebida alcoólica.
   2. Login — ou criar conta — com e-mail, senha e CPF ou CNPJ (o cadastro
      pede também nome ou razão social). O documento é o que decide para
      qual das duas lojas a pessoa vai: CPF vai para a vitrine de varejo,
      CNPJ vai para o balcão de atacado, que vende por caixa fechada e com
      preço de revenda.

   ⚠ O login ainda não tem servidor. A tela está pronta, mas nada aqui confere
   se a senha é a certa: o script só olha o formato (e-mail com @ e domínio,
   senha com 6 caracteres ou mais, documento com a contagem certa). Por isso
   a senha não é guardada em lugar nenhum — nem sessionStorage, nem
   localStorage — e o campo é esvaziado logo depois de entrar. Guardar senha
   no navegador sem um servidor para conferi-la seria só um risco a mais.

   Para ligar o servidor, os pontos são `autenticar()` e `cadastrar()`, na
   seção 2: hoje aceitam tudo que passou na conferência de formato; é ali
   que entram as chamadas ao backend, e o resto da porta não precisa mudar.

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

/* ---------- 2. login e cadastro ---------- */
const $id = id => document.getElementById(id);
const porta     = $id("porta");
const focoPorta = prenderFoco(porta);
const paineis   = {entrar: $id("painelEntrar"), criar: $id("painelCriar")};
const tituloDe  = {entrar: "portaTitle", criar: "criarTitle"};

/* entrar */
const loginForm  = $id("loginForm");
const emailInput = $id("emailInput");
const senhaInput = $id("senhaInput");
const docInput   = $id("docInput");
const docMsg     = $id("docMsg");
const docTipo    = $id("docTipo");

/* criar conta */
const criarForm   = $id("criarForm");
const cDocInput   = $id("cDocInput");
const cDocTipo    = $id("cDocTipo");
const nomeInput   = $id("nomeInput");
const nomeTag     = $id("nomeTag");
const cEmailInput = $id("cEmailInput");
const cSenhaInput = $id("cSenhaInput");
const cConfInput  = $id("cConfInput");
const criarMsg    = $id("criarMsg");

const SENHA_MIN = 6;
const NOME_MIN  = 3;

function tipoDe(v){
  const n = digitos(v);
  if(n.length === 11) return aceitaCPF(v)  ? "varejo"  : null;
  if(n.length === 14) return aceitaCNPJ(v) ? "atacado" : null;
  return null;
}

/* A dica muda enquanto a pessoa digita: ela sabe para onde vai antes de
   apertar o botão, em vez de descobrir com uma troca de página. Serve aos
   dois formulários, cada um com o seu campo e a sua linha de dica. */
function dica(campo, saida){
  const n = digitos(campo.value);
  saida.className = "doc-tipo";
  if(!n.length){ saida.textContent = ""; return; }
  if(n.length < 11){ saida.textContent = "CPF tem 11 dígitos, CNPJ tem 14."; return; }
  if(n.length === 11){
    const ok = aceitaCPF(n);
    saida.classList.add(ok ? "ok" : "bad");
    saida.textContent = ok ? "CPF · você compra no varejo" : "CPF inválido — confira os dígitos.";
    return;
  }
  if(n.length < 14){ saida.textContent = "Faltam dígitos para um CNPJ."; return; }
  const ok = aceitaCNPJ(n);
  saida.classList.add(ok ? "ok" : "bad");
  saida.textContent = ok ? "CNPJ · você compra no atacado, por caixa fechada"
                         : "CNPJ inválido — confira os dígitos.";
}

/* Formato, não existência: algo@algo.algo, sem espaço. Conferir se a caixa de
   e-mail existe é trabalho de servidor. */
const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/* Um erro de cada vez, na ordem em que os campos aparecem: a mensagem diz o
   que falta e o foco vai para o campo, que ganha aria-invalid para o leitor
   de tela anunciar junto. Vale para os dois formulários. */
function recusar(form, saida, campo, texto){
  for(const c of form.querySelectorAll("input")) c.removeAttribute("aria-invalid");
  campo.setAttribute("aria-invalid", "true");
  saida.className = "doc-msg bad";
  saida.textContent = texto;
  campo.focus();
  return null;
}

/* As mensagens de documento são as mesmas nos dois lados. */
function textoDoc(v){
  return !CONFERE_DIGITO || digitos(v).length < 11
    ? "Digite um CPF (11 dígitos) ou um CNPJ (14)."
    : "Esse número não fecha no dígito verificador. Confira e tente de novo.";
}

/* Os dois pontos onde o servidor entra. Hoje não há: quem passou na
   conferência de formato está dentro, e toda conta nova é aceita. Quando
   houver, `autenticar` confere e-mail e senha, `cadastrar` cria a conta e
   responde se o e-mail já estava em uso — e uma recusa volta pela mesma
   `recusar()`, no campo certo. */
function autenticar(dados){ return Promise.resolve(true) }
function cadastrar(dados){  return Promise.resolve(true) }

/* Entrar ou criar conta terminam igual: grava quem é, grava a loja e vai
   para ela. A senha nunca entra no perfil. */
function concluir(destino, dados){
  PERFIL.gravar({tipo: destino === "varejo" ? "cpf" : "cnpj", ...dados});
  LOJA.gravar(destino);
  if(destino === PUBLICO) fecharPorta();
  else location.href = DESTINO[destino];
}

async function entrar(){
  const r = (campo, texto) => recusar(loginForm, docMsg, campo, texto);
  const email = emailInput.value.trim();
  if(!email)              return r(emailInput, "Digite seu e-mail.");
  if(!emailValido(email)) return r(emailInput, "Esse e-mail não parece completo — confira o @ e o domínio.");
  if(!senhaInput.value)   return r(senhaInput, "Digite sua senha.");
  if(senhaInput.value.length < SENHA_MIN)
    return r(senhaInput, `A senha tem de ter pelo menos ${SENHA_MIN} caracteres.`);
  const destino = tipoDe(docInput.value);
  if(!destino) return r(docInput, textoDoc(docInput.value));

  const ok = await autenticar({email, senha: senhaInput.value, doc: digitos(docInput.value)});
  senhaInput.value = "";                      /* a senha não fica nem no campo */
  if(!ok) return r(senhaInput, "E-mail ou senha não conferem.");
  concluir(destino, {doc: mascarar(docInput.value), email});
}

async function criar(){
  const r = (campo, texto) => recusar(criarForm, criarMsg, campo, texto);
  const destino = tipoDe(cDocInput.value);
  if(!destino) return r(cDocInput, textoDoc(cDocInput.value));
  const nome = nomeInput.value.trim().replace(/\s+/g, " ");
  const [oQue, completo] = destino === "atacado" ? ["a razão social", "completa"] : ["seu nome", "completo"];
  if(!nome)                  return r(nomeInput, `Digite ${oQue}.`);
  if(nome.length < NOME_MIN) return r(nomeInput, `Digite ${oQue} ${completo}.`);
  const email = cEmailInput.value.trim();
  if(!email)              return r(cEmailInput, "Digite seu e-mail.");
  if(!emailValido(email)) return r(cEmailInput, "Esse e-mail não parece completo — confira o @ e o domínio.");
  if(!cSenhaInput.value)  return r(cSenhaInput, "Crie uma senha.");
  if(cSenhaInput.value.length < SENHA_MIN)
    return r(cSenhaInput, `A senha tem de ter pelo menos ${SENHA_MIN} caracteres.`);
  if(!cConfInput.value)   return r(cConfInput, "Repita a senha para confirmar.");
  if(cConfInput.value !== cSenhaInput.value)
    return r(cConfInput, "As duas senhas não são iguais.");

  const ok = await cadastrar({nome, email, senha: cSenhaInput.value, doc: digitos(cDocInput.value)});
  cSenhaInput.value = cConfInput.value = "";
  if(!ok) return r(cEmailInput, "Já existe uma conta com esse e-mail. Entre com ela.");
  concluir(destino, {doc: mascarar(cDocInput.value), email, nome});
}

/* Trocar de painel leva junto o que já foi digitado no outro — quem escreveu
   o e-mail para entrar e descobriu que não tem conta não digita de novo. */
function mostrarPainel(qual){
  const outro = qual === "entrar" ? "criar" : "entrar";
  const levar = qual === "criar"
    ? [[emailInput, cEmailInput], [docInput, cDocInput]]
    : [[cEmailInput, emailInput], [cDocInput, docInput]];
  for(const [de, para] of levar) if(de.value && !para.value) para.value = de.value;
  dica(docInput, docTipo); dica(cDocInput, cDocTipo); rotularNome();

  paineis[qual].hidden = false;
  paineis[outro].hidden = true;
  porta.setAttribute("aria-labelledby", tituloDe[qual]);
  for(const m of [docMsg, criarMsg]){ m.textContent = ""; m.className = "doc-msg"; }
  for(const c of porta.querySelectorAll("input")) c.removeAttribute("aria-invalid");

  const form = qual === "entrar" ? loginForm : criarForm;
  const vazio = [...form.querySelectorAll("input")].find(c => !c.value);
  focarDoTopo(vazio || form.querySelector("input"));
}

/* Focar um campo faz o navegador rolar até ele, e no celular isso tirava da
   tela o título do painel que acabou de abrir — a pessoa tocava em "Criar
   conta" e não via "Criar conta". A caixa volta ao topo e o campo recebe o
   foco sem rolar; os primeiros campos já estão à vista. */
function focarDoTopo(campo){
  porta.scrollTop = 0;
  campo.focus({preventScroll: true});
}

/* "Nome completo" para quem é pessoa, "Razão social" para quem é empresa:
   o documento vem antes justamente para o rótulo já saber o que pedir. */
function rotularNome(){
  const empresa = digitos(cDocInput.value).length > 11;
  nomeTag.textContent = empresa ? "Razão social" : "Nome completo";
  nomeInput.autocomplete = empresa ? "organization" : "name";
  nomeInput.placeholder = empresa ? "como está no CNPJ" : "como está no documento";
}

function fecharPorta(){
  abrirCaixa(porta, false, focoPorta);
  document.dispatchEvent(new CustomEvent("zg:entrou", {detail: PERFIL.ler()}));
}

/* `email` vem preenchido quando a pessoa já entrou e só o documento não
   serve nesta loja: pedir o e-mail de novo seria castigo. */
function abrirPorta(nota, email = ""){
  abrirCaixa(porta, true, focoPorta);
  loginForm.reset(); criarForm.reset();
  for(const b of verSenha) b.mostrar(false);
  mostrarPainel("entrar");
  emailInput.value = email;
  docMsg.textContent = nota || "";
  docMsg.className = nota ? "doc-msg bad" : "doc-msg";
  focarDoTopo(email ? senhaInput : emailInput);
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
   troca o tipo do campo e diz o próprio estado com aria-pressed. No cadastro
   ele revela as duas de uma vez — é comparando as duas que se acha o erro. */
const verSenha = [["senhaVer", [senhaInput]], ["cSenhaVer", [cSenhaInput, cConfInput]]].map(([id, campos]) => {
  const botao = $id(id);
  const mostrar = ver => {
    for(const c of campos) c.type = ver ? "text" : "password";
    botao.setAttribute("aria-pressed", String(ver));
    botao.textContent = ver ? "Ocultar" : "Mostrar";
  };
  botao.addEventListener("click", () => { mostrar(campos[0].type === "password"); campos[0].focus(); });
  return {mostrar};
});

/* Corrigir o campo apaga a queixa sobre ele. */
function ligarQueixa(form, saida){
  for(const c of form.querySelectorAll("input")){
    c.addEventListener("input", () => {
      if(c.getAttribute("aria-invalid") !== "true") return;
      c.removeAttribute("aria-invalid");
      saida.textContent = "";
      saida.className = "doc-msg";
    });
  }
}
ligarQueixa(loginForm, docMsg);
ligarQueixa(criarForm, criarMsg);

for(const [campo, saida] of [[docInput, docTipo], [cDocInput, cDocTipo]]){
  campo.addEventListener("input", () => {
    campo.value = mascarar(campo.value);
    dica(campo, saida);
    if(campo === cDocInput) rotularNome();
  });
}

for(const b of porta.querySelectorAll("[data-painel]"))
  b.addEventListener("click", () => mostrarPainel(b.dataset.painel));

/* O formulário cuida do Enter em qualquer campo e deixa o gerenciador de
   senhas do navegador reconhecer o login e oferecer para salvar a conta nova. */
loginForm.addEventListener("submit", e => { e.preventDefault(); entrar(); });
criarForm.addEventListener("submit", e => { e.preventDefault(); criar(); });
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
    el.title = e.detail?.email
      ? `Conectado como ${e.detail.nome ? `${e.detail.nome} (${e.detail.email})` : e.detail.email} · trocar de conta`
      : "Trocar de conta";
});

if(!idadeOk()){
  abrirCaixa(gate, true, focoGate);
  document.getElementById("gateYes").focus();
}else{
  seguir();
}
