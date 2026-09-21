/* ==========================================================================
   ZERO GRAU · comportamento da vitrine
   ========================================================================== */

/* ---------- 1. ESTOQUE ----------
   sku:   identidade do produto. É a chave do carrinho e do localStorage, e
          existe separada de `foto` de propósito: a foto pode faltar, mudar de
          nome ou chegar depois, e nada disso pode mexer no que o cliente já
          colocou no carrinho.
   cat:   a categoria de verdade — cada aba da vitrine e cada card de categoria
          da home apontam para uma destas, sem apelido e sem agrupamento
          escondido.
   forma: bottle (long neck) · can (lata) · tall (destilado/vinho) · pet
          (garrafão) · saco (gelo/carvão). É a silhueta de reserva.
   foto:  nome-base do arquivo em img/. O card monta img/<foto>-200.webp e
          img/<foto>-400.webp; se não existir, cai na silhueta — dá para ir
          subindo as fotos uma a uma sem quebrar nada. */
const BEBIDAS = [
  {sku:"estrella-galicia-330",  marca:"Estrella Galicia",  nome:"Cerveza Especial · lata 330 ml", cat:"cerveja",    foto:"estrella-galicia-330",   forma:"can",    vol:"330 ml", teor:"5,5%",  preco:8.90,   promo:6.90,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:240},
  {sku:"guinness-draught-500",  marca:"Guinness",          nome:"Draught Stout 500 ml",           cat:"cerveja",    foto:"guinness-draught-500",   forma:"can",    vol:"500 ml", teor:"4,2%",  preco:22.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:96},
  {sku:"spaten-350",            marca:"Spaten",            nome:"Münchner Hell · lata 350 ml",    cat:"cerveja",    foto:"spaten-fardo-350",       forma:"can",    vol:"350 ml", teor:"5,2%",  preco:12.90,  promo:9.90,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:180},
  {sku:"feldschlosschen-500",   marca:"Feldschlösschen",   nome:"Original 500 ml",                cat:"cerveja",    foto:"feldschlosschen-500",    forma:"can",    vol:"500 ml", teor:"4,8%",  preco:15.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:0},
  {sku:"goudale-blonde-750",    marca:"La Goudale",        nome:"Blonde 750 ml",                  cat:"cerveja",    foto:"goudale-blonde-750",     forma:"bottle", vol:"750 ml", teor:"7,2%",  preco:34.90,  promo:28.90,  gelada:true,  retornavel:true, casco:3.50,    alcoolica:true,  estoque:44},

  {sku:"jack-daniels-1l",       marca:"Jack Daniel's",     nome:"Old No. 7 · 1 L",                cat:"destilado",  foto:"jack-daniels-1l",        forma:"tall",   vol:"1 L",    teor:"40%",   preco:189.90, promo:null,   gelada:false, retornavel:false,               alcoolica:true,  estoque:14},
  {sku:"absolut-1l",            marca:"Absolut",           nome:"Vodka Original 1 L",             cat:"destilado",  foto:"absolut-1l",             forma:"tall",   vol:"1 L",    teor:"40%",   preco:89.90,  promo:74.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:52},
  {sku:"absolut-mango-1l",      marca:"Absolut",           nome:"Vodka Mango 1 L",                cat:"destilado",  foto:"absolut-mango-1l",       forma:"tall",   vol:"1 L",    teor:"38%",   preco:94.90,  promo:79.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:31},
  {sku:"ivanov-vodka-1l",       marca:"Ivanov",            nome:"Imperial Vodka 1 L",             cat:"destilado",  foto:"ivanov-vodka-1l",        forma:"tall",   vol:"1 L",    teor:"37,5%", preco:44.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:120},
  {sku:"tanqueray-750",         marca:"Tanqueray",         nome:"London Dry Gin 750 ml",          cat:"destilado",  foto:"tanqueray-750",          forma:"tall",   vol:"750 ml", teor:"47,3%", preco:129.90, promo:109.90, gelada:false, retornavel:false,               alcoolica:true,  estoque:21},
  {sku:"no3-gin-700",           marca:"No. 3",             nome:"London Dry Gin 700 ml",          cat:"destilado",  foto:"no3-gin-700",            forma:"tall",   vol:"700 ml", teor:"46%",   preco:189.90, promo:null,   gelada:false, retornavel:false,               alcoolica:true,  estoque:8},
  {sku:"seagrams-gin-700",      marca:"Seagram's",         nome:"Extra Dry Gin 700 ml",           cat:"destilado",  foto:"seagrams-gin-700",       forma:"tall",   vol:"700 ml", teor:"40%",   preco:69.90,  promo:57.90,  gelada:false, retornavel:false,               alcoolica:true,  estoque:64},

  {sku:"martini-rosso-1l",      marca:"Martini",           nome:"Rosso 1 L",                      cat:"vinho",      foto:"martini-rosso-1l",       forma:"tall",   vol:"1 L",    teor:"15%",   preco:64.90,  promo:52.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:26},
  {sku:"villageoise-branco-250",marca:"La Villageoise",    nome:"Vinho Branco Seco 250 ml",       cat:"vinho",      foto:"villageoise-branco-250", forma:"tall",   vol:"250 ml", teor:"11%",   preco:12.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:88},
  {sku:"coventry-fizz-750",     marca:"Coventry",          nome:"Fizz Elderflower 750 ml",        cat:"vinho",      foto:"coventry-fizz-750",      forma:"tall",   vol:"750 ml", teor:"5,5%",  preco:39.90,  promo:32.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:37},
  {sku:"smirnoff-ice-275",      marca:"Smirnoff",          nome:"Ice Tropical 275 ml",            cat:"vinho",      foto:"smirnoff-ice-275",       forma:"bottle", vol:"275 ml", teor:"5%",    preco:11.90,  promo:9.90,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:210},

  {sku:"red-bull-250",          marca:"Red Bull",          nome:"Energy Drink 250 ml",            cat:"energetico", foto:"red-bull-250",           forma:"can",    vol:"250 ml", teor:"0%",    preco:9.90,   promo:7.90,   gelada:true,  retornavel:false,               alcoolica:false, estoque:310},
  {sku:"monster-ultra-500",     marca:"Monster",           nome:"Energy Ultra 500 ml",            cat:"energetico", foto:"monster-ultra-500",      forma:"can",    vol:"500 ml", teor:"0%",    preco:12.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:false, estoque:150},

  {sku:"coca-cola-2l",          marca:"Coca-Cola",         nome:"Sabor Original 2 L",             cat:"agua",       foto:"coca-cola-2l",           forma:"pet",    vol:"2 L",    teor:"0%",    preco:11.90,  promo:null,   gelada:true,  retornavel:true, casco:2.00,    alcoolica:false, estoque:150},
  {sku:"evian-15l",             marca:"Evian",             nome:"Água Mineral 1,5 L",             cat:"agua",       foto:"evian-15l",              forma:"pet",    vol:"1,5 L",  teor:"0%",    preco:8.90,   promo:null,   gelada:true,  retornavel:false,               alcoolica:false, estoque:420},

  {sku:"gelo-cubos-5kg",        marca:"Zero Grau",         nome:"Gelo em Cubos 5 kg",             cat:"gelo",       foto:"gelo-cubos-5kg",         forma:"saco",   vol:"5 kg",   teor:"—",     preco:14.90,  promo:11.90,  gelada:true,  retornavel:false,               alcoolica:false, estoque:88}
];

/* Rótulo de cada categoria, na ordem em que aparecem nas abas e nos cards.
   É a única lista de categorias do site: abas, cards da home e contagens
   saem toda daqui, então não há como uma discordar da outra. */
const CATEGORIAS = [
  {id:"cerveja",    nome:"Cervejas",              detalhe:"long neck, lata, 600 ml"},
  {id:"destilado",  nome:"Destilados",            detalhe:"whisky, vodka, gin"},
  {id:"vinho",      nome:"Vinhos e espumantes",   detalhe:"tinto, branco, rosé"},
  {id:"energetico", nome:"Energéticos",           detalhe:"lata avulsa e fardo"},
  {id:"agua",       nome:"Águas e refrigerantes", detalhe:"2 L, 1,5 L, lata"},
  {id:"gelo",       nome:"Gelo e carvão",         detalhe:"sacos de 5 kg e 10 kg"}
];

/* ---------- CONTATO ----------
   ⚠ VALORES DE EXEMPLO — trocar pelos reais antes de publicar.
   Tudo o que identifica a loja mora aqui e é escrito na página pelo script,
   para que trocar o número não vire uma caça a string espalhada pelo HTML.
   O mesmo vale para o CNPJ e o endereço no rodapé. */
const CONTATO = {
  whatsapp:  "https://wa.me/5585999999999",
  telefone:  "(85) 3000-0000",
  email:     "oi@zerograu.com.br",
  cnpj:      "00.000.000/0001-00",
  endereco:  "Av. Santos Dumont, 1580",
  bairro:    "Aldeota · Fortaleza / CE",
  instagram: "#",
  facebook:  "#"
};

/* taxa de entrega — mesma regra usada no diagrama de zonas */
const TAXA_BASE = 4.90;
const TAXA_KM   = 1.20;
const RAIO_MAX  = 12;

const brl = v => v.toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
const $   = id => document.getElementById(id);

/* "Água" e "agua" têm de achar a mesma coisa. Tira o acento por decomposição
   e joga para minúscula: vale para o que o cliente digita e para o texto do
   card, então os dois lados se encontram no meio. */
const semAcento = s => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/* Altura da silhueta em função do volume, para que a estante fique proporcional.
   Escala logarítmica: na prateleira uma garrafa de 2 L não é oito vezes maior
   que uma lata de 250 ml. */
function alturaSilhueta(vol){
  const n = parseFloat(vol.replace(",", "."));
  const ml = /\bL\b/.test(vol) ? n * 1000
           : /kg/.test(vol)    ? n * 300   /* saco de gelo, aproximado pelo volume ocupado */
           : n;
  const t = Math.min(1, Math.max(0, Math.log(ml / 250) / Math.log(2000 / 250)));
  return Math.round(140 + t * 46);
}

/* A foto ocupa sempre a mesma altura na tela (o .card-art é fixo), então o que
   muda de aparelho para aparelho é só a densidade — daí descritor x, e não w. */
const fotoAttrs = foto =>
  `src="img/${foto}-200.webp" srcset="img/${foto}-200.webp 1x, img/${foto}-400.webp 2x"`;

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

$("estoqueTotal").textContent = `${BEBIDAS.length} itens · ${unidades.toLocaleString("pt-BR")} unidades`;

for(const el of document.querySelectorAll("[data-conta]")){
  const n = porCategoria(el.dataset.conta);
  el.textContent = `${n} ${n === 1 ? "item" : "itens"}`;
}
for(const el of document.querySelectorAll("[data-total]")){
  el.textContent = {
    itens:      BEBIDAS.length,
    disponivel: emEstoque,
    categorias: CATEGORIAS.length
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

/* ---------- 5. FOCO PRESO ----------
   Um diálogo que cobre a tela mas deixa o Tab passear pelo conteúdo atrás não
   é um diálogo. Vale para o aviso de idade e para o carrinho. */
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

/* ---------- 6. CARRINHO ----------
   Estado em memória: mapa de sku -> {item, qtd}. O total é sempre recalculado
   a partir do estado, nunca acumulado — evita divergência depois de remover. */
const REGRAS = {
  minimo: 30,          /* pedido mínimo, em reais */
  freteGratis: 120,    /* acima disso a entrega sai de graça */
  cupom: {codigo:"PRIMEIRAGELADA", desconto:.15, minimo:60}
};

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

/* ---------- 10. VERIFICAÇÃO DE IDADE ----------
   O aviso nasce fechado no CSS e é o script que o abre. Antes era o contrário,
   e sem JavaScript a tela ficava coberta por um diálogo que ninguém conseguia
   dispensar — o site inteiro virava uma parede. Falhar para o lado de deixar
   passar é melhor: a idade é conferida com documento na entrega, que é onde a
   lei exige. Dentro da mesma aba a resposta é lembrada. */
const gate = $("gate");
const focoGate = prenderFoco(gate);

const jaConfirmou = () => { try{ return sessionStorage.getItem("zg-idade") === "ok" }catch{ return false } };

function fecharGate(){
  gate.classList.remove("aberto");
  gate.setAttribute("aria-hidden", "true");
  gate.removeEventListener("keydown", focoGate);
  document.body.classList.remove("locked");
  try{ sessionStorage.setItem("zg-idade", "ok") }catch{ /* segue sem lembrar */ }
}

if(!jaConfirmou()){
  gate.classList.add("aberto");
  gate.setAttribute("aria-hidden", "false");
  gate.addEventListener("keydown", focoGate);
  document.body.classList.add("locked");
  $("gateYes").focus();
}

$("gateYes").addEventListener("click", fecharGate);

/* ---------- 11. HEADER E MENU ---------- */
const header = $("header");
const nav    = $("nav");
const burger = $("burger");

addEventListener("scroll", () => header.classList.toggle("stuck", scrollY > 8), {passive:true});

burger.addEventListener("click", () => {
  const aberto = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(aberto));
  burger.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
});

nav.addEventListener("click", e => {
  if(e.target.tagName === "A"){
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
  }
});

/* ---------- 12. MARQUEE (duplica a lista para o loop fechar) ---------- */
const mq = $("mq");
mq.innerHTML += mq.innerHTML;

/* ---------- 13. FAIXA DE OPERAÇÃO ---------- */
const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

if(!semMovimento){
  const oscila = (el, base, amplitude) => {
    const v = base + (Math.random() * 2 - 1) * amplitude;
    el.textContent = `−${Math.abs(v).toFixed(1).replace(".", ",")} °C`;
  };
  setInterval(() => {
    oscila($("t1"), -2.0, 0.4);
    oscila($("t2"), -4.5, 0.4);
    $("rotas").textContent = 4 + Math.floor(Math.random() * 5);
  }, 4200);
}

/* ---------- 14. MANCHETE: AJUSTE À LARGURA DA COLUNA ----------
   Mede cada linha com um corpo de referência e calcula o corpo real para que
   ela preencha a coluna. Assim qualquer fonte e qualquer slogan se compõem
   sozinhos, sem calibragem à mão. Os valores em CSS ficam como reserva caso
   o script não rode. */
const heroLinhas = [...document.querySelectorAll(".hero-title span")];
const CORPO_REF  = 100;   /* px — só para medir */
const CORPO_TETO = 168;   /* px — impede manchete absurda em tela larga */

function ajustarManchete(){
  const col = document.querySelector(".hero .wrap");
  const cs  = getComputedStyle(col);
  const util = col.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);

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
    let corpo = Math.min(util / (largura / CORPO_REF), CORPO_TETO);
    let real  = aplicarCorpo(linha, corpo);
    for(let i = 0; i < 5 && real > util; i++){
      corpo = corpo * (util / real) * 0.999;
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

/* ---------- 16. REVELAR AO ROLAR ---------- */
const io = new IntersectionObserver(entradas => {
  entradas.forEach(en => {
    if(en.isIntersecting){
      en.target.classList.add("in");
      io.unobserve(en.target);
    }
  });
}, {threshold:.1, rootMargin:"0px 0px -40px 0px"});

document.querySelectorAll(".rv").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 60}ms`;
  io.observe(el);
});
