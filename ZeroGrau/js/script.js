/* ==========================================================================
   ZERO GRAU · comportamento da vitrine de varejo

   Catálogo, contato e regras vêm de js/dados.js; o aviso de idade e a
   identificação por CPF/CNPJ vêm de js/porta.js. Aqui fica só o que é desta
   página.
   ========================================================================== */

/* ---------- 2. VITRINE ---------- */
function cardHTML(b){
  const preco    = b.promo ?? b.preco;
  const esgotado = b.estoque === 0;
  const off      = b.promo ? Math.round((1 - b.promo / b.preco) * 100) : 0;
  const alt      = alturaSilhueta(b.vol);
  /* itens sem graduação (gelo, carvão) não ganham linha de teor */
  const teor     = b.teor === "—" ? "" : b.alcoolica ? `${b.teor} álc.` : "sem álcool";

  const badges = [
    b.promo      ? `<span class="badge b-promo">−${off}%</span>`  : "",
    b.gelada     ? `<span class="badge b-gelada">Gelada</span>`   : "",
    b.retornavel ? `<span class="badge b-ret">Casco</span>`       : "",
    b.alcoolica  ? `<span class="badge b-18">18+</span>`          : ""
  ].join("");

  return `
  <article class="card${esgotado ? " esgotado" : ""}${b.promo && !esgotado ? " promo" : ""}" data-cat="${b.cat}" data-busca="${semAcento(b.marca + " " + b.nome + " " + b.vol)}">
    <div class="card-art${b.foto ? " com-foto" : ""}">
      <div class="badges">${badges}</div>
      ${b.foto ? `<img class="foto" ${fotoAttrs(b.foto)} alt="" loading="lazy" decoding="async">` : ""}
      <svg class="silhueta" width="${Math.round(alt * .375)}" height="${alt}" viewBox="0 0 60 160" aria-hidden="true"><use href="#s-${b.forma}"/></svg>
    </div>
    <div class="card-body">
      <div class="marca">${b.marca}</div>
      <div class="nome">${b.nome}</div>
      <div class="spec">
        <span>${b.vol}</span><i>/</i>
        ${teor ? `<span>${teor}</span><i>/</i>` : ""}
        <span>${esgotado ? "esgotado" : b.estoque + " un."}</span>
      </div>
      ${b.retornavel ? `<div class="casco">Casco retornável · R$ ${brl(b.casco)} de volta na devolução</div>` : ""}
      <div class="price-row">
        <div class="price">
          ${b.promo ? `<s>R$ ${brl(b.preco)}</s>` : ""}
          <b><em>R$</em>${brl(preco)}</b>
        </div>
        <button class="add" ${esgotado ? "disabled" : ""} data-sku="${b.sku}"
                aria-label="${esgotado ? "Esgotado" : "Adicionar " + b.marca + " " + b.nome + " ao carrinho"}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

const grid = $("grid");
grid.innerHTML = BEBIDAS.map(cardHTML).join("");

/* Foto que não carrega devolve o card para a silhueta. É o que permite subir as
   imagens aos poucos: enquanto o arquivo não existe em img/, o card não quebra. */
function fotoComReserva(img, aoFalhar){
  img.addEventListener("error", () => aoFalhar(img), {once:true});
}
grid.querySelectorAll(".foto").forEach(img => fotoComReserva(img, el => {
  el.closest(".card-art").classList.remove("com-foto");
  el.remove();
}));

/* ---------- 3. NÚMEROS DA PÁGINA ----------
   Todo número de catálogo que aparece em texto sai daqui. Antes eles eram
   escritos à mão no HTML e divergiam do estoque real na mesma tela. */
const porCategoria = cat => BEBIDAS.filter(b => b.cat === cat).length;
const unidades     = BEBIDAS.reduce((t, b) => t + b.estoque, 0);
const emEstoque    = BEBIDAS.filter(b => b.estoque > 0).length;

for(const el of document.querySelectorAll("[data-conta]")){
  const n = porCategoria(el.dataset.conta);
  el.textContent = `${n} ${n === 1 ? "item" : "itens"}`;
}
for(const el of document.querySelectorAll("[data-total]")){
  el.textContent = {
    itens:      BEBIDAS.length,
    disponivel: emEstoque,
    categorias: CATEGORIAS.length,
    unidades:   unidades.toLocaleString("pt-BR")
  }[el.dataset.total];
}

/* Contato escrito na página a partir de um lugar só. Trocar o número da loja
   é editar CONTATO e mais nada. */
for(const el of document.querySelectorAll("[data-contato]")){
  const k = el.dataset.contato;
  if(k === "tel"){    el.href = "tel:" + CONTATO.telefone.replace(/\D/g, ""); el.textContent = CONTATO.telefone; }
  else if(k === "mailto"){ el.href = "mailto:" + CONTATO.email; el.textContent = CONTATO.email; }
  else if(k === "whatsapp" || k === "instagram" || k === "facebook"){ el.href = CONTATO[k]; }
  else el.textContent = CONTATO[k];
}

/* As abas saem da mesma lista de categorias do atacado: escrever os rótulos à
   mão no HTML era como as duas páginas discordariam primeiro. */
$("tabs").insertAdjacentHTML("beforeend", CATEGORIAS.map(c =>
  `<button class="tab" data-cat="${c.id}" role="tab" aria-selected="false" aria-controls="grid">${c.nome}</button>`
).join(""));

/* ---------- 4. BUSCA E FILTRO DE CATEGORIA ----------
   Filtro e busca são a mesma operação: cada card decide se aparece a partir do
   par (categoria, termo). Por isso as duas passam pela mesma função. */
let catAtual = "all";
let termoAtual = "";

function aplicarFiltro(){
  const termo = semAcento(termoAtual.trim());
  /* Casa só no início de palavra: buscar "gin" não pode trazer "oriGINal".
     A fronteira é escrita à mão com \p{L}\p{N} porque o \b do JavaScript
     enxerga só [A-Za-z0-9_] — com ele, "agua" nunca casava com "agua". */
  const alvo = termo && new RegExp("(?<![\\p{L}\\p{N}])" + termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u");
  let visiveis = 0;

  for(const card of document.querySelectorAll(".card")){
    const casaCat = catAtual === "all" || card.dataset.cat === catAtual;
    const casaTermo = !alvo || alvo.test(card.dataset.busca);
    const mostrar = casaCat && casaTermo;
    card.classList.toggle("hide", !mostrar);
    if(mostrar) visiveis++;
  }
  $("semResultado").hidden = visiveis > 0;
}

function irParaCategoria(cat){
  const aba = document.querySelector(`.tab[data-cat="${cat}"]`);
  if(aba) aba.click();
}

$("tabs").addEventListener("click", e => {
  const tab = e.target.closest(".tab");
  if(!tab) return;
  document.querySelectorAll(".tab").forEach(t => {
    const on = t === tab;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
  });
  catAtual = tab.dataset.cat;
  aplicarFiltro();
});

const buscaInput = $("buscaInput");
let buscaTimer;
buscaInput.addEventListener("input", () => {
  clearTimeout(buscaTimer);
  buscaTimer = setTimeout(() => { termoAtual = buscaInput.value; aplicarFiltro(); }, 140);
});

$("limparBusca").addEventListener("click", () => {
  buscaInput.value = ""; termoAtual = ""; aplicarFiltro(); buscaInput.focus();
});

/* cards de categoria e links do rodapé passam a filtrar de verdade */
document.addEventListener("click", e => {
  const alvo = e.target.closest("[data-ir]");
  if(!alvo) return;
  irParaCategoria(alvo.dataset.ir);
});

/* ---------- 6. CARRINHO ----------
   Estado em memória: mapa de sku -> {item, qtd}. O total é sempre recalculado
   a partir do estado, nunca acumulado — evita divergência depois de remover. */
const carrinho = new Map();
let entrega = null;    /* {km, taxa, minutos, retirada} preenchido pelo cálculo do CEP */
let cupomAtivo = false;

const cartBtn     = $("cartBtn");
const cartCount   = $("cartCount");
const cartTotal   = $("cartTotal");
const cartEl      = $("cart");
const cartOverlay = $("cartOverlay");
const cartItens   = $("cartItens");
const cartVazio   = $("cartVazio");
const cartPe      = $("cartPe");

const guardar = {
  ler:   () => { try{ return JSON.parse(localStorage.getItem("zg-carrinho") || "[]") }catch{ return [] } },
  salvar:() => { try{
      localStorage.setItem("zg-carrinho", JSON.stringify(
        [...carrinho.values()].map(l => [l.item.sku, l.qtd])));
    }catch{ /* segue sem lembrar */ } }
};

const precoDe = b => b.promo ?? b.preco;

function contas(){
  let itens = 0, sub = 0;
  for(const {item,qtd} of carrinho.values()){ itens += qtd; sub += precoDe(item) * qtd; }
  const desconto = (cupomAtivo && sub >= REGRAS.cupom.minimo) ? sub * REGRAS.cupom.desconto : 0;
  const base = sub - desconto;
  /* o frete grátis olha o valor já com desconto — é o que o cliente paga */
  const taxa = entrega ? (base >= REGRAS.freteGratis ? 0 : entrega.taxa) : null;
  return {itens, sub, desconto, base, taxa, total: base + (taxa ?? 0)};
}

function linhaHTML({item,qtd}){
  const p = precoDe(item);
  return `
  <article class="cart-item" data-sku="${item.sku}">
    <div class="cart-art${item.foto ? "" : " sem-foto"}">
      ${item.foto ? `<img ${fotoAttrs(item.foto)} alt="" loading="lazy" decoding="async">` : ""}
      <svg class="silhueta" viewBox="0 0 60 160" aria-hidden="true"><use href="#s-${item.forma}"/></svg>
    </div>
    <div>
      <div class="marca">${item.marca}</div>
      <div class="nome">${item.nome}</div>
      <div class="un">R$ ${brl(p)} a unidade</div>
    </div>
    <div class="linha-fim">
      <div class="sub">R$ ${brl(p * qtd)}</div>
      <div class="acoes">
        <div class="qtd">
          <button data-acao="menos" aria-label="Diminuir quantidade de ${item.marca} ${item.nome}">−</button>
          <span aria-live="polite">${qtd}</span>
          <button data-acao="mais" ${qtd >= item.estoque ? "disabled" : ""} aria-label="Aumentar quantidade de ${item.marca} ${item.nome}">+</button>
        </div>
        <button class="tirar" data-acao="tirar" aria-label="Remover ${item.marca} ${item.nome} do carrinho">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>
          </svg>
        </button>
      </div>
    </div>
  </article>`;
}

/* Redesenha a lista só quando itens entram ou saem. Mudar quantidade atualiza
   os números no lugar: reconstruir o HTML a cada clique jogaria fora o botão
   sob o cursor e faria o foco do teclado voltar para o começo. */
function sincronizarLista(){
  const atuais = [...carrinho.keys()].join("|");
  if(atuais !== cartItens.dataset.chaves){
    cartItens.innerHTML = [...carrinho.values()].map(linhaHTML).join("");
    cartItens.dataset.chaves = atuais;
    /* a miniatura tem a mesma reserva da vitrine: sem foto, a silhueta assume */
    cartItens.querySelectorAll("img").forEach(img => fotoComReserva(img, el => {
      el.closest(".cart-art").classList.add("sem-foto");
      el.remove();
    }));
    return;
  }
  for(const {item,qtd} of carrinho.values()){
    const el = cartItens.querySelector(`[data-sku="${item.sku}"]`);
    if(!el) continue;
    el.querySelector(".qtd span").textContent = qtd;
    el.querySelector(".sub").textContent = "R$ " + brl(precoDe(item) * qtd);
    el.querySelector('[data-acao="mais"]').disabled = qtd >= item.estoque;
  }
}

function pintarCarrinho(){
  const c = contas();
  const vazio = carrinho.size === 0;

  sincronizarLista();
  cartVazio.hidden = !vazio;
  cartPe.hidden = vazio;

  cartCount.textContent = c.itens;
  cartTotal.textContent = "R$ " + brl(c.total);
  cartBtn.classList.toggle("tem-itens", !vazio);

  $("rSub").textContent   = "R$ " + brl(c.sub);
  $("rTotal").textContent = "R$ " + brl(c.total);

  $("linhaDesconto").hidden   = c.desconto <= 0;
  $("rDesc").textContent      = "− R$ " + brl(c.desconto);
  $("rCupomNome").textContent = cupomAtivo ? REGRAS.cupom.codigo : "";

  /* Fora do raio não é frete grátis: é retirada no balcão. Os dois davam taxa
     zero e caíam na mesma linha, e o cliente fechava o pedido achando que
     alguém ia bater na porta dele. */
  $("rEntrega").textContent = entrega === null        ? "—"
                            : entrega.retirada        ? "retirar no balcão"
                            : c.taxa === 0            ? "grátis"
                            : "R$ " + brl(c.taxa);
  $("rCepInfo").textContent = entrega ? `${entrega.km.toFixed(1).replace(".", ",")} km` : "informe o CEP";

  /* avisos na ordem em que o cliente resolve: mínimo, endereço, retirada, frete */
  const aviso  = $("cartAviso");
  const fechar = $("finalizar");
  aviso.className = "cart-aviso";
  if(vazio){
    aviso.textContent = "";
  }else if(c.base < REGRAS.minimo){
    aviso.classList.add("bad");
    aviso.textContent = `Faltam R$ ${brl(REGRAS.minimo - c.base)} para o pedido mínimo de R$ ${brl(REGRAS.minimo)}.`;
  }else if(entrega === null){
    aviso.textContent = "Calcule o CEP no topo da página para ver a taxa de entrega.";
  }else if(entrega.retirada){
    aviso.textContent = `Seu endereço fica a ${entrega.km.toFixed(1).replace(".", ",")} km, fora do raio de ${RAIO_MAX} km. O pedido fica separado para retirada no balcão, sem taxa.`;
  }else if(c.taxa === 0){
    aviso.classList.add("ok");
    aviso.textContent = "Frete grátis aplicado.";
  }else{
    aviso.textContent = `Faltam R$ ${brl(REGRAS.freteGratis - c.base)} para o frete sair de graça.`;
  }
  fechar.disabled = vazio || c.base < REGRAS.minimo;

  guardar.salvar();
}

function adicionar(item, n = 1){
  const linha = carrinho.get(item.sku) || {item, qtd:0};
  if(linha.qtd >= item.estoque){
    toast(`${item.marca}: só há ${item.estoque} em estoque`);
    return false;
  }
  linha.qtd = Math.min(linha.qtd + n, item.estoque);
  carrinho.set(item.sku, linha);
  pintarCarrinho();
  return true;
}

function mudarQtd(sku, delta){
  const linha = carrinho.get(sku);
  if(!linha) return;
  linha.qtd += delta;
  if(linha.qtd <= 0) carrinho.delete(sku);
  else linha.qtd = Math.min(linha.qtd, linha.item.estoque);
  pintarCarrinho();
}

function tirarDoCarrinho(sku){
  const linha = carrinho.get(sku);
  if(!linha) return;
  carrinho.delete(sku);
  pintarCarrinho();
  toast(`${linha.item.marca} saiu do carrinho`);
}

const focoCart = prenderFoco(cartEl);

function abrirCarrinho(abrir){
  cartEl.classList.toggle("aberto", abrir);
  cartEl.setAttribute("aria-hidden", String(!abrir));
  if(abrir) cartOverlay.hidden = false;
  requestAnimationFrame(() => cartOverlay.classList.toggle("aberto", abrir));
  if(!abrir) setTimeout(() => { cartOverlay.hidden = true }, 300);
  document.body.classList.toggle("locked", abrir);
  cartEl[abrir ? "addEventListener" : "removeEventListener"]("keydown", focoCart);
  if(abrir) $("cartClose").focus(); else cartBtn.focus();
}

cartBtn.addEventListener("click", () => abrirCarrinho(true));
$("cartClose").addEventListener("click", () => abrirCarrinho(false));
cartOverlay.addEventListener("click", () => abrirCarrinho(false));
addEventListener("keydown", e => {
  if(e.key === "Escape" && cartEl.classList.contains("aberto")) abrirCarrinho(false);
});

cartItens.addEventListener("click", e => {
  const b = e.target.closest("button[data-acao]");
  if(!b) return;
  const sku = b.closest(".cart-item").dataset.sku;
  if(b.dataset.acao === "tirar") tirarDoCarrinho(sku);
  else mudarQtd(sku, b.dataset.acao === "mais" ? 1 : -1);
});

/* adicionar pela vitrine */
grid.addEventListener("click", e => {
  const btn = e.target.closest(".add");
  if(!btn || btn.disabled) return;
  const item = BEBIDAS.find(b => b.sku === btn.dataset.sku);
  if(!item || !adicionar(item)) return;

  cartBtn.classList.remove("pulsa");
  void cartBtn.offsetWidth;
  cartBtn.classList.add("pulsa");
  toast(`${item.marca} ${item.nome} no carrinho`);
});

/* cupom aplicado dentro do carrinho */
$("cupomBtn").addEventListener("click", () => {
  const campo  = $("cupomInput");
  const msg    = $("cupomMsg");
  const codigo = campo.value.trim().toUpperCase();
  const {sub}  = contas();
  msg.className = "cart-aviso";

  if(codigo !== REGRAS.cupom.codigo){
    msg.classList.add("bad");
    msg.textContent = codigo ? "Cupom inválido." : "Digite o código do cupom.";
    return;
  }
  if(sub < REGRAS.cupom.minimo){
    msg.classList.add("bad");
    msg.textContent = `O cupom vale a partir de R$ ${brl(REGRAS.cupom.minimo)} em produtos.`;
    return;
  }
  cupomAtivo = true;
  msg.classList.add("ok");
  msg.textContent = `Cupom aplicado: ${REGRAS.cupom.desconto * 100}% de desconto.`;
  campo.value = REGRAS.cupom.codigo;
  pintarCarrinho();
});
$("cupomInput").addEventListener("keydown", e => { if(e.key === "Enter") $("cupomBtn").click(); });

/* finalizar: o pedido vira uma mensagem de WhatsApp já formatada */
$("finalizar").addEventListener("click", () => {
  const c = contas();
  const linhas = [...carrinho.values()].map(({item,qtd}) =>
    `• ${qtd}x ${item.marca} ${item.nome} — R$ ${brl(precoDe(item) * qtd)}`);
  const entregaTxt = !entrega          ? "Entrega: a combinar"
                   : entrega.retirada  ? `Retirada no balcão (${entrega.km.toFixed(1).replace(".", ",")} km, fora do raio)`
                   : `Entrega (${entrega.km.toFixed(1).replace(".", ",")} km): ${c.taxa === 0 ? "grátis" : "R$ " + brl(c.taxa)}`;
  const texto = [
    "*Pedido Zero Grau*", "", ...linhas, "",
    `Subtotal: R$ ${brl(c.sub)}`,
    c.desconto > 0 ? `Desconto (${REGRAS.cupom.codigo}): − R$ ${brl(c.desconto)}` : null,
    entregaTxt,
    `*Total: R$ ${brl(c.total)}*`
  ].filter(Boolean).join("\n");

  open(CONTATO.whatsapp + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
});

/* restaura carrinho e endereço da última visita */
try{
  const e = JSON.parse(localStorage.getItem("zg-entrega") || "null");
  if(e && typeof e.taxa === "number") entrega = e;
}catch{ /* segue sem endereço */ }

for(const [sku,qtd] of guardar.ler()){
  const item = BEBIDAS.find(b => b.sku === sku);
  if(item && qtd > 0) carrinho.set(sku, {item, qtd: Math.min(qtd, item.estoque)});
}
pintarCarrinho();

/* ---------- 7. TOAST ---------- */
let toastTimer;
function toast(msg){
  const t = $("toast");
  $("toastMsg").textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- 8. CEP E TAXA ---------- */
const cepInput = $("cepInput");
const cepMsg   = $("cepMsg");

cepInput.addEventListener("input", e => {
  const v = e.target.value.replace(/\D/g, "").slice(0, 8);
  e.target.value = v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v;
});

cepInput.addEventListener("keydown", e => {
  if(e.key === "Enter") $("cepBtn").click();
});

$("cepBtn").addEventListener("click", () => {
  const digits = cepInput.value.replace(/\D/g, "");

  if(digits.length !== 8){
    cepMsg.className = "cep-msg bad";
    cepMsg.textContent = "O CEP precisa ter 8 dígitos. Confira e calcule de novo.";
    return;
  }

  /* simulação: a distância é derivada do CEP só para demonstrar o cálculo da taxa */
  const km    = (parseInt(digits.slice(-3), 10) % 130) / 10;
  const kmTxt = km.toFixed(1).replace(".", ",");

  if(km > RAIO_MAX){
    cepMsg.className = "cep-msg bad";
    cepMsg.textContent = `${kmTxt} km da loja — fora do raio de ${RAIO_MAX} km. Você pode retirar no balcão sem taxa.`;
    entrega = {km, taxa: 0, minutos: 0, retirada: true};
    try{ localStorage.setItem("zg-entrega", JSON.stringify(entrega)) }catch{}
    pintarCarrinho();
    return;
  }

  const taxa = TAXA_BASE + km * TAXA_KM;
  const min  = Math.round(18 + km * 2.6);
  cepMsg.className = "cep-msg ok";
  cepMsg.textContent = `Entregamos aí. ${kmTxt} km · taxa R$ ${brl(taxa)} · cerca de ${min} minutos.`;
  /* o endereço calculado alimenta o resumo do carrinho */
  entrega = {km, taxa, minutos: min, retirada: false};
  try{ localStorage.setItem("zg-entrega", JSON.stringify(entrega)) }catch{}
  pintarCarrinho();
});

/* ---------- 9. CUPOM ---------- */
$("code").addEventListener("click", function(){
  const codigo = this.textContent.trim();
  /* copia e já deixa o cupom preenchido no carrinho — evita o cliente colar */
  $("cupomInput").value = codigo;
  const feito = () => {
    $("codeHint").textContent = "Copiado";
    toast(`Cupom ${codigo} copiado e pronto no carrinho`);
  };
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(codigo).then(feito).catch(feito);
  }else{
    feito();
  }
});

/* ---------- 13. FAIXA DE OPERAÇÃO ---------- */
const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

if(!semMovimento){
  const oscila = (el, base, amplitude) => {
    const v = base + (Math.random() * 2 - 1) * amplitude;
    el.textContent = `−${Math.abs(v).toFixed(1).replace(".", ",")} °C`;
  };
  setInterval(() => {
    oscila($("t1"), -2.0, 0.4);
    $("rotas").textContent = 4 + Math.floor(Math.random() * 5);
  }, 4200);
}

/* ---------- 14. MANCHETE: AJUSTE À LARGURA DA COLUNA ----------
   Mede cada linha com um corpo de referência e calcula o corpo real para que
   ela preencha a coluna. Assim qualquer fonte e qualquer slogan se compõem
   sozinhos, sem calibragem à mão. Os valores em CSS ficam como reserva caso
   o script não rode. */
const heroLinhas = [...document.querySelectorAll(".manchete span")];
const CORPO_REF  = 100;   /* px — só para medir */
const CORPO_TETO = 84;    /* px — a manchete tem vista própria, então pode respirar */
const CORPO_TETO_M = 30;  /* px — no celular, o bastante para caber com o resto da abertura */
const CORPO_PISO = 11;    /* px — abaixo disso não é manchete, é rodapé */

function ajustarManchete(){
  const col = document.querySelector(".manchete");
  if(!col) return;
  const cs  = getComputedStyle(col);
  /* 1,5% de folga: medir e preencher a coluna exata deixava a última letra
     raspando a borda, e com a sombra do tema ela chegava a ser cortada */
  const util = (col.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) * 0.985;
  if(util <= 0) return;                          /* vista escondida não mede */
  const teto = innerWidth < 820 ? CORPO_TETO_M : CORPO_TETO;

  for(const linha of heroLinhas){
    linha.style.fontSize = CORPO_REF + "px";
    const r = document.createRange();
    r.selectNodeContents(linha);
    const largura = r.getBoundingClientRect().width;
    if(!largura) continue;                       /* fonte ainda não carregou */

    /* A largura do texto não escala exatamente com o corpo da fonte: kerning e
       hinting mudam de um tamanho para outro. A regra de três erra por fração,
       e a correção sofre da mesma não-linearidade que tenta corrigir — por isso
       uma passada só não fecha sempre, e a sobra de 1 ou 2 px aparecia ou não
       conforme o arredondamento. Mede de novo e insiste até caber, com um fio
       de folga a cada volta para garantir convergência. */
    let corpo = Math.max(CORPO_PISO, Math.min(util / (largura / CORPO_REF), teto));
    let real  = aplicarCorpo(linha, corpo);
    for(let i = 0; i < 5 && real > util && corpo > CORPO_PISO; i++){
      corpo = Math.max(CORPO_PISO, corpo * (util / real) * 0.999);
      real  = aplicarCorpo(linha, corpo);
    }
  }
}

/* escreve o corpo e devolve a largura que o texto passou a ocupar */
function aplicarCorpo(linha, corpo){
  linha.style.fontSize = corpo.toFixed(2) + "px";
  const r = document.createRange();
  r.selectNodeContents(linha);
  return r.getBoundingClientRect().width;
}

/* as fontes chegam depois do primeiro layout — medir antes daria errado */
document.fonts.ready.then(ajustarManchete);
addEventListener("resize", () => {
  clearTimeout(ajustarManchete._t);
  ajustarManchete._t = setTimeout(ajustarManchete, 120);
});

/* ---------- 15. SLOGAN ----------
   Duas manchetes com o mesmo esqueleto de três linhas, sorteadas a cada visita:
   quem volta no dia seguinte não encontra a mesma frase na porta. O HTML já
   nasce com uma delas, então sem script a manchete continua de pé.
   A medição da seção 14 roda depois disto (document.fonts.ready só resolve no
   fim da tarefa atual), então já mede o texto sorteado. */
const SLOGANS = [
  ["Sexta à noite não é", "hora de encarar",    "fila de mercado"],
  ["O rolê não para",     "só porque a gelada", "acabou"]
];

const slogan = SLOGANS[Math.floor(Math.random() * SLOGANS.length)];
heroLinhas.forEach((el, i) => el.textContent = slogan[i]);

/* ---------- 16. VISTAS ----------
   O site deixou de ser uma página que rola e virou quatro vistas que se
   revezam no mesmo espaço. A regra é uma só: a aba marcada manda, e a vista
   correspondente é a única sem `hidden`.

   O `hidden` no HTML e a classe `.ativa` dizem a mesma coisa de propósito. A
   classe é quem o CSS lê na casca de uma tela; o `hidden` é quem vale sem
   script, e é o que impede as quatro vistas de aparecerem empilhadas antes
   de o script rodar. */
const abas = $("abas");

function mostrarVista(nome){
  for(const b of abas.querySelectorAll(".app-aba"))
    b.setAttribute("aria-selected", String(b.dataset.vista === nome));
  /* quem esconde é o CSS, pela classe: .js .vista{display:none} e
     .js .vista.ativa{display:flex}. Marcar `hidden` aqui também tiraria as
     outras vistas do documento sem script, e sem script elas são justamente
     o que sobra do site — e o que o buscador lê. */
  for(const v of document.querySelectorAll(".vista"))
    v.classList.toggle("ativa", v.id === "v-" + nome);
  /* a manchete só tem largura quando a vista dela está à mostra */
  if(nome === "inicio") ajustarManchete();
}

/* Um ouvinte só, no documento: serve as abas do topo, o botão "Ver o
   catálogo" da abertura e o link de pular do teclado. Três lugares diferentes
   pedindo a mesma coisa não precisam de três ouvintes. */
document.addEventListener("click", e => {
  const alvo = e.target.closest("[data-vista]");
  if(alvo) mostrarVista(alvo.dataset.vista);
});

/* A porta abre na abertura, não na prateleira: quem chega precisa saber de
   quem é a loja, quanto custa a entrega e em quanto tempo ela chega antes de
   encarar dezenove rótulos. */
mostrarVista("inicio");

/* quem clica numa categoria a partir de outra vista vai para o catálogo */
document.addEventListener("click", e => {
  if(e.target.closest("[data-ir]")) mostrarVista("catalogo");
});
