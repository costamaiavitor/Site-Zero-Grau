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

/* As regras de venda escritas na página. O HTML traz os valores de hoje, que
   é o que aparece sem JavaScript; aqui eles são trocados pelos de REGRAS e da
   taxa de entrega — que o painel de administração pode ter mudado. Sem isto,
   mudar o frete grátis no painel mudaria a conta do carrinho e deixaria a
   página prometendo o valor antigo. */
const REGRA_VALOR = {
  taxaBase: () => TAXA_BASE,           taxaKm: () => TAXA_KM,
  minimo: () => REGRAS.minimo,         freteGratis: () => REGRAS.freteGratis,
  cupomDesconto: () => REGRAS.cupom.desconto, cupomMinimo: () => REGRAS.cupom.minimo,
  cupomCodigo: () => REGRAS.cupom.codigo,     raio: () => RAIO_MAX
};
const REGRA_FORMATO = {
  brl:   v => brl(v),
  curto: v => Number.isInteger(v) ? String(v) : brl(v),     /* "R$ 30", mas "R$ 32,50" */
  pct:   v => String(Math.round(v * 1000) / 10).replace(".", ","),
  km:    v => String(v).replace(".", ","),
  texto: v => v
};
for(const el of document.querySelectorAll("[data-regra]")){
  const valor = REGRA_VALOR[el.dataset.regra], fmt = REGRA_FORMATO[el.dataset.fmt];
  if(valor && fmt) el.textContent = fmt(valor());
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
  $("rCepInfo").textContent = entrega ? (entrega.onde || `${entrega.km.toFixed(1).replace(".", ",")} km`) : "informe o CEP";

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
    aviso.textContent = "Informe o CEP na aba Início para ver a taxa de entrega.";
  }else if(entrega.retirada){
    aviso.textContent = `${entrega.onde || "Seu endereço"} fica fora do raio de ${RAIO_MAX} km. O pedido fica separado para retirada no balcão, sem taxa.`;
  }else if(c.taxa === 0){
    aviso.classList.add("ok");
    aviso.textContent = "Frete grátis aplicado.";
  }else{
    aviso.textContent = `Faltam R$ ${brl(REGRAS.freteGratis - c.base)} para o frete sair de graça.`;
  }
  fechar.disabled = vazio || c.base < REGRAS.minimo;

  guardar.salvar();
  if($("pedidosAntigos")) pintarPedidosAntigos();
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
  /* depois de um pedido enviado, o carrinho reabre do começo */
  if(abrir && etapa === "feito") irEtapa("carrinho");
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
  msg.textContent = `Cupom aplicado: ${REGRA_FORMATO.pct(REGRAS.cupom.desconto)}% de desconto.`;
  campo.value = REGRAS.cupom.codigo;
  pintarCarrinho();
});
$("cupomInput").addEventListener("keydown", e => { if(e.key === "Enter") $("cupomBtn").click(); });

/* ---------- 6b. FECHAMENTO DO PEDIDO ----------
   Quatro etapas dentro do carrinho: a lista; entrega e pagamento; o Pix,
   quando o cliente paga pelo site; e a confirmação.

   Os dois caminhos terminam no WhatsApp da loja. Pagando na entrega, a
   mensagem leva endereço e forma de pagamento (com troco, se for dinheiro).
   Pagando pelo site, o cliente paga o Pix gerado aqui e manda o pedido com
   a referência do pagamento — sem servidor, quem confirma o recebimento é a
   loja, no extrato. Nenhum dado do pedido sai do aparelho por outro caminho
   que não a própria conversa do WhatsApp. */
const TITULO_ETAPA = {carrinho: "Seu carrinho", dados: "Entrega e pagamento", pix: "Pagar com Pix", feito: "Pedido pronto"};
let etapa = "carrinho";

function irEtapa(nome){
  etapa = nome;
  for(const e of cartEl.querySelectorAll(".cart-etapa")) e.hidden = e.dataset.etapa !== nome;
  $("cartTitulo").textContent = TITULO_ETAPA[nome];
  $("cartVoltar").hidden = !(nome === "dados" || nome === "pix");
  const alvo = {carrinho: $("cartClose"), dados: $("ckNome"), pix: $("pixCopiar"), feito: $("feitoZap")}[nome];
  alvo?.focus({preventScroll: true});
}
$("cartVoltar").addEventListener("click", () => irEtapa(etapa === "pix" ? "dados" : "carrinho"));
$("feitoFechar").addEventListener("click", () => { abrirCarrinho(false); irEtapa("carrinho"); });

/* O endereço fica no aparelho para o próximo pedido — só aqui, e só se o
   navegador deixar. */
const ENDERECO = {
  ler(){ try{ return JSON.parse(localStorage.getItem("zg-endereco") || "null") || {} }catch{ return {} } },
  gravar(e){ try{ localStorage.setItem("zg-endereco", JSON.stringify(e)) }catch{} }
};

const temPix = () => !!chavePix(PIX.chave);
const valorCk = id => $(id).value.trim();

function pintarCheckout(){
  const c = contas();
  const retirada = !!entrega?.retirada;
  $("ckEndereco").hidden = retirada;
  $("ckRetirada").hidden = !retirada;
  $("ckRetirada").textContent = `Retirada no balcão: ${CONTATO.endereco} — ${CONTATO.bairro}. Sem taxa.`;
  $("ckEntregaTit").textContent = retirada ? "Pagar na retirada" : "Pagar na entrega";
  $("ckEntrega").textContent = entrega === null ? "calcule o CEP" : retirada ? "retirar no balcão" : c.taxa === 0 ? "grátis" : "R$ " + brl(c.taxa);
  $("ckTotal").textContent = "R$ " + brl(c.total);

  $("ckOpPix").hidden = !temPix();
  const fechar = cartEl.querySelector('input[name="fechar"]:checked')?.value;
  $("ckFormas").hidden = fechar !== "entrega";
  const forma = cartEl.querySelector('input[name="forma"]:checked')?.value;
  $("ckTrocoBloco").hidden = fechar !== "entrega" || forma !== "dinheiro";
  $("ckTroco").disabled = $("ckSemTroco").checked;
  $("ckEnviar").textContent = fechar === "pix-site" ? "Ir para o Pix" : "Enviar pedido pelo WhatsApp";

  /* loja fechada: o pedido pode ir, mas agendado — e o cliente sabe disso antes */
  const s = situacaoLoja();
  $("ckFechada").hidden = s.aberto;
  $("ckFechada").textContent = s.aberto ? "" :
    `A loja está fechada agora (${abreTxt(s)}). Seu pedido fica agendado para quando ela abrir.`;
}

function abrirCheckout(){
  const salvo = ENDERECO.ler();
  const perfil = PERFIL.ler?.() || null;
  if(!valorCk("ckNome")) $("ckNome").value = salvo.nome || perfil?.nome || "";
  if(!valorCk("ckCep") && entrega?.cep) $("ckCep").value = entrega.cep;
  const mesmoCep = salvo.cep && entrega?.cep === salvo.cep;
  if(!valorCk("ckRua")) $("ckRua").value = mesmoCep && salvo.rua ? salvo.rua : entrega?.rua || "";
  if(mesmoCep){
    for(const [id, k] of [["ckNumero", "numero"], ["ckCompl", "compl"], ["ckRef", "ref"]])
      if(!valorCk(id)) $(id).value = salvo[k] || "";
  }
  if(!cartEl.querySelector('input[name="fechar"]:checked')){
    const padrao = cartEl.querySelector(`input[name="fechar"][value="${temPix() ? "pix-site" : "entrega"}"]`);
    padrao.checked = true;
  }
  $("ckMsg").textContent = "";
  pintarCheckout();
  irEtapa("dados");
}
$("finalizar").addEventListener("click", abrirCheckout);

ligarCep($("ckCep"), $("ckCepBtn"), $("ckCepMsg"));
document.addEventListener("zg:entrega", e => {
  if(e.detail?.rua && !valorCk("ckRua")) $("ckRua").value = e.detail.rua;
  if(etapa === "dados") pintarCheckout();
});
$("checkout").addEventListener("change", pintarCheckout);

/* Um erro de cada vez, na ordem da tela, com foco no campo. */
function recusarCk(campo, texto){
  for(const c of $("checkout").querySelectorAll("[aria-invalid]")) c.removeAttribute("aria-invalid");
  $("ckMsg").textContent = texto;
  if(campo){ campo.setAttribute("aria-invalid", "true"); campo.focus(); }
  return null;
}
$("checkout").addEventListener("input", e => {
  if(e.target.getAttribute("aria-invalid") === "true"){ e.target.removeAttribute("aria-invalid"); $("ckMsg").textContent = ""; }
});

/* confere a etapa 2 e devolve o que a mensagem precisa, ou null */
function lerCheckout(){
  const c = contas();
  const nome = valorCk("ckNome").replace(/\s+/g, " ");
  if(nome.length < 2) return recusarCk($("ckNome"), "Diga o nome de quem vai receber.");
  if(entrega === null) return recusarCk($("ckCep"), "Calcule o CEP da entrega para seguir.");
  if(!entrega.retirada){
    if(!valorCk("ckRua"))    return recusarCk($("ckRua"), "Falta a rua.");
    if(!valorCk("ckNumero")) return recusarCk($("ckNumero"), "Falta o número. Sem número, escreva s/n.");
  }
  const fechar = cartEl.querySelector('input[name="fechar"]:checked')?.value;
  if(!fechar) return recusarCk(cartEl.querySelector('input[name="fechar"]'), "Escolha como vai pagar.");
  let pagamento = "";
  if(fechar === "entrega"){
    const forma = cartEl.querySelector('input[name="forma"]:checked')?.value;
    const quando = entrega.retirada ? "na retirada" : "na entrega";
    if(!forma) return recusarCk(cartEl.querySelector('input[name="forma"]'), `Escolha como vai pagar ${quando}.`);
    if(forma === "pix")    pagamento = `Pix ${quando}`;
    if(forma === "cartao") pagamento = `Cartão ${quando} (débito ou crédito)`;
    if(forma === "dinheiro"){
      if($("ckSemTroco").checked) pagamento = `Dinheiro ${quando} — sem troco`;
      else{
        const troco = lerDinheiro(valorCk("ckTroco"));
        if(!(troco > c.total))
          return recusarCk($("ckTroco"), `O troco tem de ser para um valor acima do total (R$ ${brl(c.total)}). Se não precisa, marque "Não preciso de troco".`);
        pagamento = `Dinheiro ${quando} — troco para R$ ${brl(troco)} (levar R$ ${brl(troco - c.total)})`;
      }
    }
  }
  $("ckMsg").textContent = "";
  return {
    fechar, pagamento, nome,
    rua: valorCk("ckRua"), numero: valorCk("ckNumero"), compl: valorCk("ckCompl"), ref: valorCk("ckRef"),
    obs: valorCk("ckObs").replace(/\s+/g, " ")
  };
}

/* "100", "100,50", "R$ 1.000,00" */
function lerDinheiro(t){
  let x = String(t).replace(/[^\d,.]/g, "");
  if(x.includes(",")) x = x.replace(/\./g, "").replace(",", ".");
  const n = Number(x);
  return x && Number.isFinite(n) ? n : NaN;
}

function mensagemPedido(d){
  const c = contas();
  const s = situacaoLoja();
  const linhas = [...carrinho.values()].map(({item, qtd}) =>
    `• ${qtd}x ${item.marca} ${item.nome} — R$ ${brl(precoDe(item) * qtd)}`);
  const entregaTxt = entrega.retirada ? `Retirada no balcão (${entrega.onde || "fora do raio"})`
                   : `Entrega (${entrega.onde}): ${c.taxa === 0 ? "grátis" : "R$ " + brl(c.taxa)}`;
  const onde = entrega.retirada ? ["*Retira no balcão:* " + d.nome]
    : [`*Entregar para:* ${d.nome}`,
       `${d.rua}, ${d.numero}${d.compl ? " — " + d.compl : ""}`,
       `${entrega.onde} — CEP ${entrega.cep || ""}`.replace(/ — CEP $/, ""),
       d.ref ? `Referência: ${d.ref}` : null];
  return [
    "*Pedido Zero Grau*",
    s.aberto ? null : `_Pedido feito com a loja fechada — entregar quando abrir (${abreTxt(s)})._`,
    "", ...linhas, "",
    `Subtotal: R$ ${brl(c.sub)}`,
    c.desconto > 0 ? `Desconto (${REGRAS.cupom.codigo}): − R$ ${brl(c.desconto)}` : null,
    entregaTxt,
    `*Total: R$ ${brl(c.total)}*`,
    "", ...onde, "",
    `*Pagamento:* ${d.pagamento}`,
    d.obs ? `*Observação:* ${d.obs}` : null
  ].filter(l => l !== null).join("\n");
}

/* Abre o WhatsApp, guarda o pedido para "pedir de novo" e esvazia o carrinho.
   O link fica na tela de confirmação: se o navegador barrar a janela nova,
   o cliente toca e vai. */
function enviarPedido(d){
  const texto = mensagemPedido(d);
  const url = CONTATO.whatsapp + "?text=" + encodeURIComponent(texto);
  const c = contas();
  ENDERECO.gravar({nome: d.nome, cep: entrega?.cep || "", rua: d.rua, numero: d.numero, compl: d.compl, ref: d.ref});
  PEDIDOS.guardar({
    em: Date.now(), total: c.total,
    itens: [...carrinho.values()].map(({item, qtd}) => [item.sku, qtd, `${item.marca} ${item.nome}`])
  });
  if(typeof registrarEvento === "function") registrarEvento("pedido", {forma: d.fechar === "pix-site" ? "pix-site" : "whatsapp"});

  open(url, "_blank", "noopener");
  $("feitoZap").href = url;
  $("feitoTxt").textContent = d.fechar === "pix-site"
    ? "Abrimos a conversa com a loja com o pedido e a referência do Pix. Toque em enviar e mande o comprovante."
    : "Abrimos a conversa com a loja com o pedido escrito. É só tocar em enviar.";

  carrinho.clear();
  cupomAtivo = false;
  $("cupomInput").value = ""; $("cupomMsg").textContent = "";
  for(const id of ["ckObs", "ckTroco"]) $(id).value = "";
  $("ckSemTroco").checked = false;
  pintarCarrinho();
  irEtapa("feito");
}

let pedidoPix = null;          /* os dados da etapa 2, enquanto o cliente paga */

$("checkout").addEventListener("submit", async e => {
  e.preventDefault();
  const d = lerCheckout();
  if(!d) return;
  if(d.fechar !== "pix-site"){ enviarPedido(d); return; }

  /* Pix: gera o código com o valor exato e uma referência para o extrato */
  const c = contas();
  const txid = txidPedido();
  const codigo = codigoPix({chave: chavePix(PIX.chave), nome: PIX.nome, cidade: PIX.cidade, valor: Math.round(c.total * 100) / 100, txid});
  pedidoPix = {...d, pagamento: `Pix pago pelo site — R$ ${brl(c.total)} — referência ${txid}. O comprovante segue nesta conversa.`};
  $("pixValor").textContent = "R$ " + brl(c.total);
  $("pixCodigo").value = codigo;
  $("pixRef").textContent = txid;
  $("pixNome").textContent = PIX.nome;
  $("pixQr").innerHTML = "";
  irEtapa("pix");
  try{
    await carregarQr();
    const qr = qrcode(0, "M");
    qr.addData(codigo);
    qr.make();
    $("pixQr").innerHTML = qr.createSvgTag({cellSize: 4, margin: 3, scalable: true});
  }catch{
    $("pixQr").innerHTML = '<p class="pix-semqr">Não deu para desenhar o QR code aqui. Use o código "copia e cola" abaixo.</p>';
  }
});

/* a biblioteca do QR só é baixada por quem escolhe pagar pelo site */
function carregarQr(){
  if(window.qrcode) return Promise.resolve();
  return new Promise((ok, erro) => {
    const el = document.createElement("script");
    el.src = "js/vendor/qrcode.js?v=15";
    el.onload = ok; el.onerror = erro;
    document.head.append(el);
  });
}

$("pixCopiar").addEventListener("click", () => {
  const codigo = $("pixCodigo").value;
  const feito = () => toast("Código Pix copiado. Cole no app do seu banco.");
  if(navigator.clipboard?.writeText) navigator.clipboard.writeText(codigo).then(feito).catch(() => { $("pixCodigo").select(); feito(); });
  else{ $("pixCodigo").select(); feito(); }
});
$("pixPaguei").addEventListener("click", () => { if(pedidoPix) enviarPedido(pedidoPix); });

/* ---------- 6c. PEDIR DE NOVO ----------
   Os últimos pedidos ficam no aparelho (itens e total, nada de endereço ou
   pagamento). Com o carrinho vazio, eles aparecem ali mesmo, e um toque põe
   tudo de volta — respeitando o estoque de hoje e pulando o que saiu do
   catálogo. */
const PEDIDOS = {
  ler(){ try{ const l = JSON.parse(localStorage.getItem("zg-pedidos") || "[]"); return Array.isArray(l) ? l : [] }catch{ return [] } },
  guardar(p){ try{ localStorage.setItem("zg-pedidos", JSON.stringify([p, ...this.ler()].slice(0, 5))) }catch{} }
};

function pintarPedidosAntigos(){
  const lista = PEDIDOS.ler();
  const caixa = $("pedidosAntigos");
  caixa.hidden = !lista.length || carrinho.size > 0;
  if(caixa.hidden) return;
  $("pedidosLista").innerHTML = lista.map((p, i) => {
    const qtd = p.itens.reduce((n, [, q]) => n + q, 0);
    const quando = new Date(p.em).toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"});
    const nomes = p.itens.slice(0, 3).map(([, q, nome]) => `${q}x ${nome}`).join(", ") + (p.itens.length > 3 ? "…" : "");
    return `<li class="pedido-antigo">
      <div><b>${quando} · ${qtd} ${qtd === 1 ? "item" : "itens"} · R$ ${brl(p.total)}</b><small>${esc(nomes)}</small></div>
      <button type="button" class="btn btn-ghost btn-sm" data-denovo="${i}">Pedir de novo</button>
    </li>`;
  }).join("");
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);

cartEl.addEventListener("click", e => {
  const b = e.target.closest("[data-denovo]");
  if(!b) return;
  const p = PEDIDOS.ler()[+b.dataset.denovo];
  if(!p) return;
  let faltou = 0, entrou = 0;
  for(const [sku, qtd] of p.itens){
    const item = BEBIDAS.find(x => x.sku === sku);
    if(!item || item.estoque === 0){ faltou++; continue; }
    const n = Math.min(qtd, item.estoque);
    carrinho.set(sku, {item, qtd: n});
    entrou++;
    if(n < qtd) faltou++;
  }
  pintarCarrinho();
  toast(!entrou ? "Nenhum item desse pedido está disponível hoje."
      : faltou ? "Pedido de volta no carrinho — alguns itens mudaram, confira." : "Pedido de volta no carrinho.");
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

/* ---------- 8. CEP E TAXA ----------
   O CEP vai ao ViaCEP, que é a base dos Correios aberta e sem chave. De lá
   vêm cidade e bairro de verdade; a distância sai da tabela ENTREGA, em
   js/dados.js.

   A versão anterior tirava a distância dos três últimos dígitos do CEP. Dava
   um número plausível e sempre diferente, o que é pior do que não dar número
   nenhum: quem publicasse aquilo cobraria frete errado de gente real, ou
   mandaria retirar no balcão quem mora a dois quarteirões.

   Rede é coisa que falha. Quando falha, a resposta é dizer que não deu para
   conferir — nunca cair de volta num palpite. */
/* distância a partir do que o ViaCEP devolveu; null = não atendemos a cidade */
function distanciaDe(lugar){
  const cidade = chaveLugar(lugar.localidade);
  if(!(cidade in ENTREGA.cidades)) return null;
  const km = ENTREGA.cidades[cidade];
  if(km !== null) return km;
  return ENTREGA.bairros[chaveLugar(lugar.bairro)] ?? ENTREGA.PADRAO_FORTALEZA;
}

function guardarEntrega(e){
  entrega = e;
  try{ localStorage.setItem("zg-entrega", JSON.stringify(e)) }catch{ /* segue sem lembrar */ }
  pintarCarrinho();
  document.dispatchEvent(new CustomEvent("zg:entrega", {detail: e}));
}

const mascaraCep = v => { const d = v.replace(/\D/g, "").slice(0, 8); return d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d; };

/* Consulta o CEP e devolve {classe, texto, entrega?}. Quem chama decide onde
   mostrar: a abertura e o fechamento do pedido usam a mesma consulta. */
async function consultarCep(digitos){
  if(digitos.length !== 8) return {classe: "bad", texto: "O CEP precisa ter 8 dígitos. Confira e calcule de novo."};
  let lugar;
  try{
    const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    if(!r.ok) throw new Error(r.status);
    lugar = await r.json();
  }catch{
    return {classe: "bad", texto: "Não deu para consultar o CEP agora. Tente de novo em instantes ou fale com a loja pelo WhatsApp."};
  }
  if(lugar.erro) return {classe: "bad", texto: "Esse CEP não existe na base dos Correios. Confira os oito dígitos."};

  const onde = [lugar.bairro, lugar.localidade].filter(Boolean).join(", ") || lugar.localidade;
  const cep = mascaraCep(digitos), rua = lugar.logradouro || "";
  const km = distanciaDe(lugar);
  if(km === null || km > RAIO_MAX){
    return {classe: "bad", texto: `${onde} fica fora do raio de ${RAIO_MAX} km. Você pode retirar no balcão, sem taxa.`,
            entrega: {km: km ?? 0, taxa: 0, minutos: 0, retirada: true, onde, cep, rua}};
  }
  const taxa   = TAXA_BASE + km * TAXA_KM;
  const minuto = Math.round(18 + km * 2.6);
  return {classe: "ok", texto: `Entregamos em ${onde}. ${km.toFixed(1).replace(".", ",")} km · taxa R$ ${brl(taxa)} · cerca de ${minuto} minutos.`,
          entrega: {km, taxa, minutos: minuto, retirada: false, onde, cep, rua}};
}

/* liga um par campo + botão + mensagem à consulta */
function ligarCep(campo, botao, msg){
  const aviso = (classe, texto) => { msg.className = "cep-msg " + classe; msg.textContent = texto; };
  campo.addEventListener("input", () => { campo.value = mascaraCep(campo.value); });
  campo.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); botao.click(); } });
  botao.addEventListener("click", async () => {
    botao.disabled = true;
    aviso("", "Consultando o CEP…");
    const r = await consultarCep(campo.value.replace(/\D/g, ""));
    botao.disabled = false;
    aviso(r.classe, r.texto);
    if(r.entrega) guardarEntrega(r.entrega);
  });
}
ligarCep($("cepInput"), $("cepBtn"), $("cepMsg"));

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

/* Aberto ou fechado, pelo relógio de Fortaleza e pelo HORARIO de dados.js
   (que o painel edita). Repinta a cada minuto: quem deixa a aba aberta até
   as 03h vê a loja fechar na hora. */
function pintarHorario(){
  const s = situacaoLoja();
  for(const el of document.querySelectorAll('[data-horario="resumo"]')) el.textContent = resumoHorario();
  for(const el of document.querySelectorAll('[data-horario="agora"], [data-horario="status"]')){
    el.classList.toggle("fechado", !s.aberto);
    el.innerHTML = '<i class="live" aria-hidden="true"></i> ' + (s.aberto
      ? `<b>Aberto</b> ${s.fecha ? "até " + horaLonga(s.fecha) : "24 horas"}`
      : `<b>Fechado</b> · ${abreTxt(s)}`);
  }
  document.body.classList.toggle("loja-fechada", !s.aberto);
}
pintarHorario();
setInterval(pintarHorario, 60_000);
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
