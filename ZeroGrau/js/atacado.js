/* ==========================================================================
   ZERO GRAU · balcão de atacado

   Outra loja, não outro tema. O que muda não é a cor: é a unidade de venda.
   Aqui se vende caixa fechada, o preço sai do preço cheio de varejo com o
   desconto de revenda, e a promoção de fim de semana não vale — quem leva
   vinte caixas já tem o desconto dele.

   Por isso a tela é tabela e não vitrine. Quem compra para revender compara
   preço por unidade entre dez itens de uma vez; card com foto grande e selo
   de "gelada" atrapalha essa conta em vez de ajudar.
   ========================================================================== */

/* ---------- 1. TABELA ---------- */
const linhas = $("linhas");

function linhaTabela(b){
  const cx       = caixaDe(b);
  const emCaixas = caixasDe(b);
  const un       = precoAtacado(b);
  const esgotado = emCaixas === 0;

  return `
  <tr class="item${esgotado ? " esgotado" : ""}" data-sku="${b.sku}" data-cat="${b.cat}"
      data-busca="${semAcento(b.marca + " " + b.nome + " " + b.vol)}">
    <th scope="row" class="prod">
      <span class="prod-marca">${b.marca}</span>
      <span class="prod-nome">${b.nome}</span>
      <span class="prod-emb">caixa com ${cx} un. · ${esgotado ? "esgotado" : emCaixas + " cx em estoque"}</span>
      ${b.retornavel ? `<span class="prod-nota">casco retornável · R$ ${brl(b.casco)} por unidade</span>` : ""}
    </th>
    <td class="n">${cx} un.</td>
    <td class="n">R$ ${brl(un)}</td>
    <td class="n forte">R$ ${brl(un * cx)}</td>
    <td class="n ${esgotado ? "zero" : ""}">${esgotado ? "esgotado" : emCaixas + " cx"}</td>
    <td class="n">
      <div class="qtd">
        <button data-acao="menos" ${esgotado ? "disabled" : ""} aria-label="Menos uma caixa de ${b.marca} ${b.nome}">−</button>
        <span aria-live="polite" data-qtd>0</span>
        <button data-acao="mais" ${esgotado ? "disabled" : ""} aria-label="Mais uma caixa de ${b.marca} ${b.nome}">+</button>
      </div>
    </td>
  </tr>`;
}

linhas.innerHTML = BEBIDAS.map(linhaTabela).join("");

/* abas a partir da mesma lista de categorias do varejo */
const tabs = $("tabs");
tabs.insertAdjacentHTML("beforeend", CATEGORIAS.map(c =>
  `<button class="tab" data-cat="${c.id}" role="tab" aria-selected="false" aria-controls="tabela">${c.nome}</button>`
).join(""));

/* números que vêm do catálogo, nunca escritos à mão */
for(const el of document.querySelectorAll("[data-total]")){
  el.textContent = {itens: BEBIDAS.length, categorias: CATEGORIAS.length}[el.dataset.total];
}
for(const el of document.querySelectorAll("[data-reg]")){
  el.textContent = "R$ " + brl(ATACADO[el.dataset.reg]);
}
$("pedidoNota").textContent = ATACADO.prazo;

/* ---------- 2. BUSCA E FILTRO ---------- */
let catAtual = "all", termoAtual = "";

function aplicarFiltro(){
  const termo = semAcento(termoAtual.trim());
  const alvo = termo && new RegExp("(?<![\\p{L}\\p{N}])" + termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u");
  let visiveis = 0;
  for(const tr of linhas.querySelectorAll(".item")){
    const mostrar = (catAtual === "all" || tr.dataset.cat === catAtual)
                 && (!alvo || alvo.test(tr.dataset.busca));
    tr.classList.toggle("hide", !mostrar);
    if(mostrar) visiveis++;
  }
  $("semResultado").hidden = visiveis > 0;
}

tabs.addEventListener("click", e => {
  const tab = e.target.closest(".tab");
  if(!tab) return;
  for(const t of tabs.querySelectorAll(".tab")){
    const on = t === tab;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
  }
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

/* ---------- 3. PEDIDO ----------
   Estado em caixas, não em unidades. O carrinho do varejo guarda unidade e
   aqui isso daria pedido de 7 latas, que não existe: a caixa é indivisível. */
const pedido = new Map();      /* sku -> caixas */

const guardar = {
  ler:   () => { try{ return JSON.parse(localStorage.getItem("zg-atacado") || "[]") }catch{ return [] } },
  salvar:() => { try{ localStorage.setItem("zg-atacado", JSON.stringify([...pedido])) }catch{} }
};

function contas(){
  let caixas = 0, sub = 0;
  for(const [sku, n] of pedido){
    const b = BEBIDAS.find(x => x.sku === sku);
    if(!b) continue;
    caixas += n;
    sub += precoAtacado(b) * caixaDe(b) * n;
  }
  const extra    = faixaDe(caixas);
  const desconto = sub * extra;
  const base     = sub - desconto;
  const frete    = caixas === 0 ? null : (base >= ATACADO.freteGratis ? 0 : TAXA_BASE + RAIO_MAX * TAXA_KM);
  return {caixas, sub, extra, desconto, base, frete, total: base + (frete ?? 0)};
}

function itemHTML(sku, n){
  const b  = BEBIDAS.find(x => x.sku === sku);
  const cx = caixaDe(b);
  return `
  <article class="pedido-item" data-sku="${sku}">
    <div>
      <div class="marca">${b.marca}</div>
      <div class="nome">${b.nome}</div>
      <div class="un">${n} cx · ${n * cx} un. · R$ ${brl(precoAtacado(b))} a unidade</div>
    </div>
    <div class="linha-fim">
      <div class="sub">R$ ${brl(precoAtacado(b) * cx * n)}</div>
      <button class="tirar" data-acao="tirar" aria-label="Tirar ${b.marca} ${b.nome} do pedido">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>
        </svg>
      </button>
    </div>
  </article>`;
}

function pintar(){
  const c = contas();
  const vazio = pedido.size === 0;

  $("pedidoItens").innerHTML = [...pedido].map(([sku, n]) => itemHTML(sku, n)).join("");
  $("pedidoVazio").hidden = !vazio;

  /* a contagem de cada linha da tabela vem do estado, não do clique */
  for(const tr of linhas.querySelectorAll(".item")){
    const n = pedido.get(tr.dataset.sku) || 0;
    tr.querySelector("[data-qtd]").textContent = n;
    tr.classList.toggle("no-pedido", n > 0);
    const b = BEBIDAS.find(x => x.sku === tr.dataset.sku);
    const mais = tr.querySelector('[data-acao="mais"]');
    if(mais) mais.disabled = n >= caixasDe(b);
    const menos = tr.querySelector('[data-acao="menos"]');
    if(menos) menos.disabled = n === 0;
  }

  $("cartCount").textContent  = c.caixas;
  $("cartTotal").textContent  = "R$ " + brl(c.total);
  $("cartBtn").classList.toggle("tem-itens", !vazio);
  $("barraCaixas").textContent = c.caixas;
  $("barraTotal").textContent  = "R$ " + brl(c.total);
  document.body.classList.toggle("tem-pedido", !vazio);

  $("rCaixas").textContent = c.caixas;
  $("rSub").textContent    = "R$ " + brl(c.sub);
  $("rTotal").textContent  = "R$ " + brl(c.total);
  $("linhaFaixa").hidden   = c.extra === 0;
  $("rFaixa").textContent  = "− R$ " + brl(c.desconto);
  $("rFaixaNome").textContent = c.extra ? `(${Math.round(c.extra * 100)}%)` : "";
  $("rFrete").textContent  = c.frete === null ? "—" : c.frete === 0 ? "grátis" : "R$ " + brl(c.frete);

  const aviso = $("pedidoAviso");
  aviso.className = "cart-aviso";
  if(vazio){
    aviso.textContent = "";
  }else if(c.base < ATACADO.minimo){
    aviso.classList.add("bad");
    aviso.textContent = `Faltam R$ ${brl(ATACADO.minimo - c.base)} para o pedido mínimo de R$ ${brl(ATACADO.minimo)}.`;
  }else if(c.frete === 0){
    aviso.classList.add("ok");
    aviso.textContent = "Frete grátis aplicado.";
  }else{
    const prox = ATACADO.faixas.find(f => c.caixas < f.cx);
    aviso.textContent = prox
      ? `Faltam ${prox.cx - c.caixas} caixas para ${Math.round(prox.extra * 100)}% de desconto por volume.`
      : `Faltam R$ ${brl(ATACADO.freteGratis - c.base)} para o frete sair de graça.`;
  }
  $("enviar").disabled = vazio || c.base < ATACADO.minimo;

  guardar.salvar();
}

function mudar(sku, delta){
  const b = BEBIDAS.find(x => x.sku === sku);
  if(!b) return;
  const teto = caixasDe(b);
  const n = (pedido.get(sku) || 0) + delta;
  if(n > teto){ toast(`${b.marca}: só há ${teto} caixas em estoque`); return; }
  if(n <= 0) pedido.delete(sku); else pedido.set(sku, n);
  pintar();
}

linhas.addEventListener("click", e => {
  const btn = e.target.closest("button[data-acao]");
  if(!btn || btn.disabled) return;
  mudar(btn.closest(".item").dataset.sku, btn.dataset.acao === "mais" ? 1 : -1);
});

$("pedidoItens").addEventListener("click", e => {
  const btn = e.target.closest('[data-acao="tirar"]');
  if(!btn) return;
  const sku = btn.closest(".pedido-item").dataset.sku;
  const b = BEBIDAS.find(x => x.sku === sku);
  pedido.delete(sku);
  pintar();
  toast(`${b.marca} saiu do pedido`);
});

/* ---------- 4. O PAINEL EM TELA ESTREITA ----------
   Acima de 1080px o resumo é coluna fixa e está sempre à vista, que é o que
   um balcão precisa. Abaixo disso ele vira gaveta, chamada pela barra do pé. */
const painel  = $("pedido");
const overlay = $("pedidoOverlay");
const focoPainel = prenderFoco(painel);

function abrirPainel(abrir){
  painel.classList.toggle("aberto", abrir);
  if(abrir) overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.toggle("aberto", abrir));
  if(!abrir) setTimeout(() => { overlay.hidden = true }, 300);
  document.body.classList.toggle("locked", abrir);
  painel[abrir ? "addEventListener" : "removeEventListener"]("keydown", focoPainel);
  if(abrir) $("pedidoClose").focus(); else $("barra").focus();
}

$("barra").addEventListener("click", () => abrirPainel(true));
$("cartBtn").addEventListener("click", () => abrirPainel(true));
$("pedidoClose").addEventListener("click", () => abrirPainel(false));
overlay.addEventListener("click", () => abrirPainel(false));
addEventListener("keydown", e => {
  if(e.key === "Escape" && painel.classList.contains("aberto")) abrirPainel(false);
});

/* ---------- 5. TOAST ---------- */
let toastTimer;
function toast(msg){
  const t = $("toast");
  $("toastMsg").textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- 6. ENVIAR ---------- */
$("enviar").addEventListener("click", () => {
  const c = contas();
  const doc = document.querySelector("[data-doc]")?.textContent || "";
  const itens = [...pedido].map(([sku, n]) => {
    const b = BEBIDAS.find(x => x.sku === sku);
    return `• ${n} cx (${n * caixaDe(b)} un.) ${b.marca} ${b.nome} — R$ ${brl(precoAtacado(b) * caixaDe(b) * n)}`;
  });
  const texto = [
    "*Pedido de atacado · Zero Grau*",
    doc ? `CNPJ: ${doc}` : null, "",
    ...itens, "",
    `Caixas: ${c.caixas}`,
    `Mercadoria: R$ ${brl(c.sub)}`,
    c.desconto > 0 ? `Desconto por volume (${Math.round(c.extra * 100)}%): − R$ ${brl(c.desconto)}` : null,
    `Frete: ${c.frete === 0 ? "grátis" : "R$ " + brl(c.frete)}`,
    `*Total: R$ ${brl(c.total)}*`, "",
    ATACADO.prazo
  ].filter(Boolean).join("\n");

  open(CONTATO.whatsapp + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
});

/* ---------- 7. RETOMAR ---------- */
for(const [sku, n] of guardar.ler()){
  const b = BEBIDAS.find(x => x.sku === sku);
  if(b && n > 0) pedido.set(sku, Math.min(n, caixasDe(b)));
}
pintar();
