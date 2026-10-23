const gradeProdutos = document.getElementById("grid");
const abasCategoria = document.getElementById("tabs");
const campoBusca = document.getElementById("buscaInput");
const avisoSemResultado = document.getElementById("semResultado");
const botaoLimparBusca = document.getElementById("limparBusca");

const botaoCarrinho = document.getElementById("cartBtn");
const contadorCarrinho = document.getElementById("cartCount");
const totalNoBotao = document.getElementById("cartTotal");
const carrinhoLateral = document.getElementById("cart");
const fundoCarrinho = document.getElementById("cartOverlay");
const tituloCarrinho = document.getElementById("cartTitulo");
const botaoFecharCarrinho = document.getElementById("cartClose");
const botaoVoltarEtapa = document.getElementById("cartVoltar");
const listaCarrinho = document.getElementById("cartItens");
const carrinhoVazio = document.getElementById("cartVazio");
const rodapeCarrinho = document.getElementById("cartPe");
const caixaPedidosAntigos = document.getElementById("pedidosAntigos");
const listaPedidosAntigos = document.getElementById("pedidosLista");

const campoCupom = document.getElementById("cupomInput");
const botaoCupom = document.getElementById("cupomBtn");
const mensagemCupom = document.getElementById("cupomMsg");
const resumoSubtotal = document.getElementById("rSub");
const linhaDesconto = document.getElementById("linhaDesconto");
const resumoDesconto = document.getElementById("rDesc");
const nomeDoCupom = document.getElementById("rCupomNome");
const resumoEntrega = document.getElementById("rEntrega");
const resumoCep = document.getElementById("rCepInfo");
const resumoTotal = document.getElementById("rTotal");
const avisoCarrinho = document.getElementById("cartAviso");
const botaoContinuar = document.getElementById("finalizar");

const formCheckout = document.getElementById("checkout");
const avisoLojaFechada = document.getElementById("ckFechada");
const campoQuemRecebe = document.getElementById("ckNome");
const campoCepEntrega = document.getElementById("ckCep");
const botaoCepEntrega = document.getElementById("ckCepBtn");
const mensagemCepEntrega = document.getElementById("ckCepMsg");
const blocoEndereco = document.getElementById("ckEndereco");
const campoRua = document.getElementById("ckRua");
const campoNumero = document.getElementById("ckNumero");
const campoComplemento = document.getElementById("ckCompl");
const campoReferencia = document.getElementById("ckRef");
const avisoRetirada = document.getElementById("ckRetirada");
const opcaoPixPeloSite = document.getElementById("ckOpPix");
const tituloPagarNaEntrega = document.getElementById("ckEntregaTit");
const blocoFormasDePagamento = document.getElementById("ckFormas");
const blocoTroco = document.getElementById("ckTrocoBloco");
const campoTroco = document.getElementById("ckTroco");
const caixaSemTroco = document.getElementById("ckSemTroco");
const campoObservacao = document.getElementById("ckObs");
const entregaNoCheckout = document.getElementById("ckEntrega");
const totalNoCheckout = document.getElementById("ckTotal");
const mensagemCheckout = document.getElementById("ckMsg");
const botaoEnviarPedido = document.getElementById("ckEnviar");

const valorDoPix = document.getElementById("pixValor");
const desenhoQrCode = document.getElementById("pixQr");
const campoCodigoPix = document.getElementById("pixCodigo");
const botaoCopiarPix = document.getElementById("pixCopiar");
const recebedorDoPix = document.getElementById("pixNome");
const referenciaDoPix = document.getElementById("pixRef");
const botaoJaPaguei = document.getElementById("pixPaguei");

const textoPedidoFeito = document.getElementById("feitoTxt");
const linkWhatsappDeNovo = document.getElementById("feitoZap");
const botaoVoltarALoja = document.getElementById("feitoFechar");

const campoCep = document.getElementById("cepInput");
const botaoCep = document.getElementById("cepBtn");
const mensagemCep = document.getElementById("cepMsg");
const botaoCodigoCupom = document.getElementById("code");
const dicaCodigoCupom = document.getElementById("codeHint");
const avisoToast = document.getElementById("toast");
const textoToast = document.getElementById("toastMsg");
const menuAbas = document.getElementById("abas");


const VALOR_DA_REGRA = {
  taxaBase: () => TAXA_BASE,
  taxaKm: () => TAXA_KM,
  minimo: () => REGRAS.minimo,
  freteGratis: () => REGRAS.freteGratis,
  cupomDesconto: () => REGRAS.cupom.desconto,
  cupomMinimo: () => REGRAS.cupom.minimo,
  cupomCodigo: () => REGRAS.cupom.codigo,
  raio: () => RAIO_MAX,
  cupomTetoTexto: () => {
    if (REGRAS.cupom.teto > 0) return `Desconto de até R$ ${brl(REGRAS.cupom.teto)}`;
    return "Sem teto de desconto";
  },
  cupomValidadeTexto: () => {
    if (!REGRAS.cupom.validade) return "Sem prazo de validade";
    return `${cupomVencido() ? "Venceu em" : "Válido até"} ${dataCurta(REGRAS.cupom.validade)}`;
  }
};

const FORMATO_DA_REGRA = {
  brl: valor => brl(valor),
  curto: valor => Number.isInteger(valor) ? String(valor) : brl(valor),
  pct: valor => String(Math.round(valor * 1000) / 10).replace(".", ","),
  km: valor => String(valor).replace(".", ","),
  texto: valor => valor
};

const TITULOS_DAS_ETAPAS = {carrinho: "Seu carrinho", dados: "Entrega e pagamento", pix: "Pagar com Pix", feito: "Pedido pronto"};

const SLOGANS = [
  ["Sexta à noite não é", "hora de encarar",    "fila de mercado"],
  ["O rolê não para",     "só porque a gelada", "acabou"]
];

const TAMANHO_DE_MEDIDA = 100;
const TAMANHO_MAXIMO = 84;
const TAMANHO_MAXIMO_CELULAR = 30;
const TAMANHO_MINIMO = 11;


let categoriaAtual = "all";
let buscaAtual = "";
let esperaDaBusca;

const carrinho = new Map();
let entrega = null;
let cupomAtivo = false;
let etapaAtual = "carrinho";
let pedidoAguardandoPix = null;
let contaDoCarrinho = idConta(PERFIL.ler());
let esperaDoToast;
let esperaDoRedimensionar;

const focoCarrinho = prenderFoco(carrinhoLateral);
const linhasDaManchete = [...document.querySelectorAll(".manchete span")];


const CARRINHO_SALVO = {
  ler() {
    const salvo = lerDaConta("zg-carrinho", []);
    return Array.isArray(salvo) ? salvo : [];
  },
  salvar() {
    const itens = [...carrinho.values()].map(linha => [linha.bebida.sku, linha.quantidade]);
    gravarNaConta("zg-carrinho", itens);
  }
};

const ENDERECO_SALVO = {
  ler() {
    const salvo = lerDaConta("zg-endereco", {});
    return salvo && typeof salvo === "object" ? salvo : {};
  },
  gravar(endereco) {
    gravarNaConta("zg-endereco", endereco);
  }
};

const PEDIDOS_ANTERIORES = {
  ler() {
    const salvos = lerDaConta("zg-pedidos", []);
    return Array.isArray(salvos) ? salvos : [];
  },
  guardar(pedido) {
    gravarNaConta("zg-pedidos", [pedido, ...this.ler()].slice(0, 5));
  }
};

const CUPONS_USADOS = {
  todos() {
    try {
      const usados = JSON.parse(localStorage.getItem("zg-cupons-usados") || "{}");
      return usados && typeof usados === "object" ? usados : {};
    } catch {
      return {};
    }
  },
  documento() {
    return String(PERFIL.ler()?.doc || "").replace(/\D/g, "");
  },
  usou(codigo) {
    const documento = this.documento();
    return !!documento && (this.todos()[documento] || []).includes(codigo);
  },
  marcar(codigo) {
    const documento = this.documento();
    if (!documento) return;
    const usados = this.todos();
    usados[documento] = [...new Set([...(usados[documento] || []), codigo])];
    try {
      localStorage.setItem("zg-cupons-usados", JSON.stringify(usados));
    } catch {}
  }
};


function montarCardProduto(bebida) {
  const preco = bebida.promo ?? bebida.preco;
  const esgotado = bebida.estoque === 0;
  const desconto = bebida.promo ? Math.round((1 - bebida.promo / bebida.preco) * 100) : 0;
  const altura = alturaSilhueta(bebida.vol);

  let teor = "";
  if (bebida.teor !== "—") {
    teor = bebida.alcoolica ? `${bebida.teor} álc.` : "sem álcool";
  }

  const selos = [
    bebida.promo      ? `<span class="badge b-promo">−${desconto}%</span>`  : "",
    bebida.gelada     ? `<span class="badge b-gelada">Gelada</span>`   : "",
    bebida.retornavel ? `<span class="badge b-ret">Casco</span>`       : "",
    bebida.alcoolica  ? `<span class="badge b-18">18+</span>`          : ""
  ].join("");

  return `
  <article class="card${esgotado ? " esgotado" : ""}${bebida.promo && !esgotado ? " promo" : ""}" data-cat="${bebida.cat}" data-busca="${semAcento(bebida.marca + " " + bebida.nome + " " + bebida.vol)}">
    <div class="card-art${bebida.foto ? " com-foto" : ""}">
      <div class="badges">${selos}</div>
      ${bebida.foto ? `<img class="foto" ${fotoAttrs(bebida.foto)} alt="${escaparHtml(textoAlternativo(bebida))}" loading="lazy" decoding="async">` : ""}
      <svg class="silhueta" width="${Math.round(altura * .375)}" height="${altura}" viewBox="0 0 60 160" aria-hidden="true"><use href="#s-${bebida.forma}"/></svg>
    </div>
    <div class="card-body">
      <div class="marca">${bebida.marca}</div>
      <div class="nome">${bebida.nome}</div>
      <div class="spec">
        <span>${bebida.vol}</span><i>/</i>
        ${teor ? `<span>${teor}</span><i>/</i>` : ""}
        <span>${esgotado ? "esgotado" : bebida.estoque + " un."}</span>
      </div>
      ${bebida.retornavel ? `<div class="casco">Casco retornável · R$ ${brl(bebida.casco)} de volta na devolução</div>` : ""}
      <div class="price-row">
        <div class="price">
          ${bebida.promo ? `<s>R$ ${brl(bebida.preco)}</s>` : ""}
          <b><em>R$</em>${brl(preco)}</b>
        </div>
        <button class="add" ${esgotado ? "disabled" : ""} data-sku="${bebida.sku}"
                aria-label="${esgotado ? "Esgotado" : "Adicionar " + bebida.marca + " " + bebida.nome + " ao carrinho"}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

function trocarFotoQuebrada(imagem, quandoFalhar) {
  imagem.addEventListener("error", () => quandoFalhar(imagem), {once: true});
}

function montarVitrine() {
  gradeProdutos.innerHTML = BEBIDAS.map(montarCardProduto).join("");
  for (const foto of gradeProdutos.querySelectorAll(".foto")) {
    trocarFotoQuebrada(foto, imagem => {
      imagem.closest(".card-art").classList.remove("com-foto");
      imagem.remove();
    });
  }
}

function preencherNumerosDoCatalogo() {
  const unidades = BEBIDAS.reduce((soma, bebida) => soma + bebida.estoque, 0);
  const disponiveis = BEBIDAS.filter(bebida => bebida.estoque > 0).length;

  for (const elemento of document.querySelectorAll("[data-conta]")) {
    const quantidade = BEBIDAS.filter(bebida => bebida.cat === elemento.dataset.conta).length;
    elemento.textContent = `${quantidade} ${quantidade === 1 ? "item" : "itens"}`;
  }

  const totais = {
    itens: BEBIDAS.length,
    disponivel: disponiveis,
    categorias: CATEGORIAS.length,
    unidades: unidades.toLocaleString("pt-BR")
  };
  for (const elemento of document.querySelectorAll("[data-total]")) {
    elemento.textContent = totais[elemento.dataset.total];
  }
}

function preencherRegrasNaPagina() {
  for (const elemento of document.querySelectorAll("[data-regra]")) {
    const valor = VALOR_DA_REGRA[elemento.dataset.regra];
    const formato = FORMATO_DA_REGRA[elemento.dataset.fmt];
    if (valor && formato) elemento.textContent = formato(valor());
  }
}

function preencherContato() {
  for (const elemento of document.querySelectorAll("[data-contato]")) {
    const tipo = elemento.dataset.contato;
    if (tipo === "tel") {
      elemento.href = "tel:" + CONTATO.telefone.replace(/\D/g, "");
      elemento.textContent = CONTATO.telefone;
    } else if (tipo === "mailto") {
      elemento.href = "mailto:" + CONTATO.email;
      elemento.textContent = CONTATO.email;
    } else if (tipo === "whatsapp" || tipo === "instagram" || tipo === "facebook") {
      elemento.href = CONTATO[tipo];
    } else {
      elemento.textContent = CONTATO[tipo];
    }
  }
}

function montarAbasDeCategoria() {
  const botoes = CATEGORIAS.map(categoria =>
    `<button class="tab" data-cat="${categoria.id}" role="tab" aria-selected="false" aria-controls="grid">${categoria.nome}</button>`
  );
  abasCategoria.insertAdjacentHTML("beforeend", botoes.join(""));
}


function filtrarCatalogo() {
  const termo = semAcento(buscaAtual.trim());
  let procura = null;
  if (termo) {
    const termoSeguro = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    procura = new RegExp("(?<![\\p{L}\\p{N}])" + termoSeguro, "u");
  }

  let visiveis = 0;
  for (const card of document.querySelectorAll(".card")) {
    const daCategoria = categoriaAtual === "all" || card.dataset.cat === categoriaAtual;
    const daBusca = !procura || procura.test(card.dataset.busca);
    const aparece = daCategoria && daBusca;
    card.classList.toggle("hide", !aparece);
    if (aparece) visiveis++;
  }
  avisoSemResultado.hidden = visiveis > 0;
}

function irParaCategoria(categoria) {
  const aba = document.querySelector(`.tab[data-cat="${categoria}"]`);
  if (aba) aba.click();
}

function escolherCategoria(evento) {
  const abaClicada = evento.target.closest(".tab");
  if (!abaClicada) return;
  for (const aba of document.querySelectorAll(".tab")) {
    const selecionada = aba === abaClicada;
    aba.classList.toggle("active", selecionada);
    aba.setAttribute("aria-selected", String(selecionada));
  }
  categoriaAtual = abaClicada.dataset.cat;
  filtrarCatalogo();
}

function buscarComCalma() {
  clearTimeout(esperaDaBusca);
  esperaDaBusca = setTimeout(() => {
    buscaAtual = campoBusca.value;
    filtrarCatalogo();
  }, 140);
}

function limparBusca() {
  campoBusca.value = "";
  buscaAtual = "";
  filtrarCatalogo();
  campoBusca.focus();
}


function precoDeVenda(bebida) {
  return bebida.promo ?? bebida.preco;
}

function calcularTotais() {
  let quantidade = 0;
  let subtotal = 0;
  for (const linha of carrinho.values()) {
    quantidade += linha.quantidade;
    subtotal += precoDeVenda(linha.bebida) * linha.quantidade;
  }
  const desconto = cupomAtivo ? descontoCupom(subtotal) : 0;
  const totalProdutos = subtotal - desconto;

  let taxa = null;
  if (entrega) {
    taxa = totalProdutos >= REGRAS.freteGratis ? 0 : entrega.taxa;
  }
  return {quantidade, subtotal, desconto, totalProdutos, taxa, total: totalProdutos + (taxa ?? 0)};
}

function montarLinhaCarrinho({bebida, quantidade}) {
  const preco = precoDeVenda(bebida);
  return `
  <article class="cart-item" data-sku="${bebida.sku}">
    <div class="cart-art${bebida.foto ? "" : " sem-foto"}">
      ${bebida.foto ? `<img ${fotoAttrs(bebida.foto)} alt="${escaparHtml(textoAlternativo(bebida))}" loading="lazy" decoding="async">` : ""}
      <svg class="silhueta" viewBox="0 0 60 160" aria-hidden="true"><use href="#s-${bebida.forma}"/></svg>
    </div>
    <div>
      <div class="marca">${bebida.marca}</div>
      <div class="nome">${bebida.nome}</div>
      <div class="un">R$ ${brl(preco)} a unidade</div>
    </div>
    <div class="linha-fim">
      <div class="sub">R$ ${brl(preco * quantidade)}</div>
      <div class="acoes">
        <div class="qtd">
          <button data-acao="menos" aria-label="Diminuir quantidade de ${bebida.marca} ${bebida.nome}">−</button>
          <span aria-live="polite">${quantidade}</span>
          <button data-acao="mais" ${quantidade >= bebida.estoque ? "disabled" : ""} aria-label="Aumentar quantidade de ${bebida.marca} ${bebida.nome}">+</button>
        </div>
        <button class="tirar" data-acao="tirar" aria-label="Remover ${bebida.marca} ${bebida.nome} do carrinho">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>
          </svg>
        </button>
      </div>
    </div>
  </article>`;
}

function atualizarListaCarrinho() {
  const skusNoCarrinho = [...carrinho.keys()].join("|");
  if (skusNoCarrinho !== listaCarrinho.dataset.chaves) {
    listaCarrinho.innerHTML = [...carrinho.values()].map(montarLinhaCarrinho).join("");
    listaCarrinho.dataset.chaves = skusNoCarrinho;
    for (const foto of listaCarrinho.querySelectorAll("img")) {
      trocarFotoQuebrada(foto, imagem => {
        imagem.closest(".cart-art").classList.add("sem-foto");
        imagem.remove();
      });
    }
    return;
  }

  for (const {bebida, quantidade} of carrinho.values()) {
    const linha = listaCarrinho.querySelector(`[data-sku="${bebida.sku}"]`);
    if (!linha) continue;
    linha.querySelector(".qtd span").textContent = quantidade;
    linha.querySelector(".sub").textContent = "R$ " + brl(precoDeVenda(bebida) * quantidade);
    linha.querySelector('[data-acao="mais"]').disabled = quantidade >= bebida.estoque;
  }
}

function textoDaEntrega(totais, semCep) {
  if (entrega === null) return semCep;
  if (entrega.retirada) return "retirar no balcão";
  if (totais.taxa === 0) return "grátis";
  return "R$ " + brl(totais.taxa);
}

function atualizarAvisoCarrinho(totais, vazio) {
  avisoCarrinho.className = "cart-aviso";
  if (vazio) {
    avisoCarrinho.textContent = "";
  } else if (totais.totalProdutos < REGRAS.minimo) {
    avisoCarrinho.classList.add("bad");
    avisoCarrinho.textContent = `Faltam R$ ${brl(REGRAS.minimo - totais.totalProdutos)} para o pedido mínimo de R$ ${brl(REGRAS.minimo)}.`;
  } else if (entrega === null) {
    avisoCarrinho.textContent = "Informe o CEP na aba Início para ver a taxa de entrega.";
  } else if (entrega.retirada) {
    avisoCarrinho.textContent = `${entrega.onde || "Seu endereço"} fica fora do raio de ${RAIO_MAX} km. O pedido fica separado para retirada no balcão, sem taxa.`;
  } else if (totais.taxa === 0) {
    avisoCarrinho.classList.add("ok");
    avisoCarrinho.textContent = "Frete grátis aplicado.";
  } else {
    avisoCarrinho.textContent = `Faltam R$ ${brl(REGRAS.freteGratis - totais.totalProdutos)} para o frete sair de graça.`;
  }
}

function atualizarCarrinho() {
  const totais = calcularTotais();
  const vazio = carrinho.size === 0;

  atualizarListaCarrinho();
  carrinhoVazio.hidden = !vazio;
  rodapeCarrinho.hidden = vazio;

  contadorCarrinho.textContent = totais.quantidade;
  totalNoBotao.textContent = "R$ " + brl(totais.total);
  botaoCarrinho.classList.toggle("tem-itens", !vazio);

  resumoSubtotal.textContent = "R$ " + brl(totais.subtotal);
  resumoTotal.textContent = "R$ " + brl(totais.total);

  linhaDesconto.hidden = totais.desconto <= 0;
  resumoDesconto.textContent = "− R$ " + brl(totais.desconto);
  nomeDoCupom.textContent = cupomAtivo ? REGRAS.cupom.codigo : "";

  resumoEntrega.textContent = textoDaEntrega(totais, "—");
  if (entrega) {
    resumoCep.textContent = entrega.onde || `${entrega.km.toFixed(1).replace(".", ",")} km`;
  } else {
    resumoCep.textContent = "informe o CEP";
  }

  atualizarAvisoCarrinho(totais, vazio);
  botaoContinuar.disabled = vazio || totais.totalProdutos < REGRAS.minimo;

  CARRINHO_SALVO.salvar();
  if (caixaPedidosAntigos) mostrarPedidosAntigos();
}

function colocarNoCarrinho(bebida, quantidade = 1) {
  const linha = carrinho.get(bebida.sku) || {bebida, quantidade: 0};
  if (linha.quantidade >= bebida.estoque) {
    mostrarToast(`${bebida.marca}: só há ${bebida.estoque} em estoque`);
    return false;
  }
  linha.quantidade = Math.min(linha.quantidade + quantidade, bebida.estoque);
  carrinho.set(bebida.sku, linha);
  atualizarCarrinho();
  return true;
}

function mudarQuantidade(sku, diferenca) {
  const linha = carrinho.get(sku);
  if (!linha) return;
  linha.quantidade += diferenca;
  if (linha.quantidade <= 0) {
    carrinho.delete(sku);
  } else {
    linha.quantidade = Math.min(linha.quantidade, linha.bebida.estoque);
  }
  atualizarCarrinho();
}

function tirarDoCarrinho(sku) {
  const linha = carrinho.get(sku);
  if (!linha) return;
  carrinho.delete(sku);
  atualizarCarrinho();
  mostrarToast(`${linha.bebida.marca} saiu do carrinho`);
}

function abrirCarrinho() {
  if (etapaAtual === "feito") irParaEtapa("carrinho");
  carrinhoLateral.classList.add("aberto");
  carrinhoLateral.setAttribute("aria-hidden", "false");
  carrinhoLateral.inert = false;
  fundoCarrinho.hidden = false;
  requestAnimationFrame(() => fundoCarrinho.classList.add("aberto"));
  document.body.classList.add("locked");
  carrinhoLateral.addEventListener("keydown", focoCarrinho);
  botaoFecharCarrinho.focus();
}

function fecharCarrinho() {
  carrinhoLateral.classList.remove("aberto");
  carrinhoLateral.setAttribute("aria-hidden", "true");
  carrinhoLateral.inert = true;
  requestAnimationFrame(() => fundoCarrinho.classList.remove("aberto"));
  setTimeout(() => {
    fundoCarrinho.hidden = true;
  }, 300);
  document.body.classList.remove("locked");
  carrinhoLateral.removeEventListener("keydown", focoCarrinho);
  botaoCarrinho.focus();
}

function clicarNaListaDoCarrinho(evento) {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;
  const sku = botao.closest(".cart-item").dataset.sku;
  if (botao.dataset.acao === "tirar") {
    tirarDoCarrinho(sku);
  } else {
    mudarQuantidade(sku, botao.dataset.acao === "mais" ? 1 : -1);
  }
}

function clicarNaVitrine(evento) {
  const botao = evento.target.closest(".add");
  if (!botao || botao.disabled) return;
  const bebida = BEBIDAS.find(produto => produto.sku === botao.dataset.sku);
  if (!bebida || !colocarNoCarrinho(bebida)) return;

  botaoCarrinho.classList.remove("pulsa");
  botaoCarrinho.offsetWidth;
  botaoCarrinho.classList.add("pulsa");
  mostrarToast(`${bebida.marca} ${bebida.nome} no carrinho`);
}


function recusarCupom(texto) {
  mensagemCupom.classList.add("bad");
  mensagemCupom.textContent = texto;
}

function aplicarCupom() {
  const codigo = campoCupom.value.trim().toUpperCase();
  const {subtotal} = calcularTotais();
  mensagemCupom.className = "cart-aviso";

  if (codigo !== REGRAS.cupom.codigo) {
    recusarCupom(codigo ? "Cupom inválido." : "Digite o código do cupom.");
    return;
  }
  if (cupomVencido()) {
    recusarCupom(`Este cupom venceu em ${dataCurta(REGRAS.cupom.validade)}.`);
    return;
  }
  if (CUPONS_USADOS.usou(codigo)) {
    recusarCupom("Este cupom já foi usado neste CPF.");
    return;
  }
  if (subtotal < REGRAS.cupom.minimo) {
    recusarCupom(`O cupom vale a partir de R$ ${brl(REGRAS.cupom.minimo)} em produtos.`);
    return;
  }

  cupomAtivo = true;
  mensagemCupom.classList.add("ok");
  let texto = `Cupom aplicado: ${FORMATO_DA_REGRA.pct(REGRAS.cupom.desconto)}% de desconto`;
  texto += REGRAS.cupom.teto > 0 ? `, até R$ ${brl(REGRAS.cupom.teto)}.` : ".";
  mensagemCupom.textContent = texto;
  campoCupom.value = REGRAS.cupom.codigo;
  atualizarCarrinho();
}

function copiarCupom() {
  const codigo = botaoCodigoCupom.textContent.trim();
  campoCupom.value = codigo;
  const avisarCopiado = () => {
    dicaCodigoCupom.textContent = "Copiado";
    mostrarToast(`Cupom ${codigo} copiado e pronto no carrinho`);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(codigo).then(avisarCopiado).catch(avisarCopiado);
  } else {
    avisarCopiado();
  }
}


function irParaEtapa(etapa) {
  etapaAtual = etapa;
  for (const bloco of carrinhoLateral.querySelectorAll(".cart-etapa")) {
    bloco.hidden = bloco.dataset.etapa !== etapa;
  }
  tituloCarrinho.textContent = TITULOS_DAS_ETAPAS[etapa];
  botaoVoltarEtapa.hidden = !(etapa === "dados" || etapa === "pix");

  const focoDaEtapa = {carrinho: botaoFecharCarrinho, dados: campoQuemRecebe, pix: botaoCopiarPix, feito: linkWhatsappDeNovo};
  focoDaEtapa[etapa]?.focus({preventScroll: true});
}

function lojaTemPix() {
  return !!chavePix(PIX.chave);
}

function valorDoCampo(campo) {
  return campo.value.trim();
}

function opcaoMarcada(nome) {
  return carrinhoLateral.querySelector(`input[name="${nome}"]:checked`)?.value;
}

function atualizarCheckout() {
  const totais = calcularTotais();
  const retirada = !!entrega?.retirada;

  blocoEndereco.hidden = retirada;
  avisoRetirada.hidden = !retirada;
  avisoRetirada.textContent = `Retirada no balcão: ${CONTATO.endereco} — ${CONTATO.bairro}. Sem taxa.`;
  tituloPagarNaEntrega.textContent = retirada ? "Pagar na retirada" : "Pagar na entrega";
  entregaNoCheckout.textContent = textoDaEntrega(totais, "calcule o CEP");
  totalNoCheckout.textContent = "R$ " + brl(totais.total);

  opcaoPixPeloSite.hidden = !lojaTemPix();
  const comoFechar = opcaoMarcada("fechar");
  blocoFormasDePagamento.hidden = comoFechar !== "entrega";
  const forma = opcaoMarcada("forma");
  blocoTroco.hidden = comoFechar !== "entrega" || forma !== "dinheiro";
  campoTroco.disabled = caixaSemTroco.checked;
  botaoEnviarPedido.textContent = comoFechar === "pix-site" ? "Ir para o Pix" : "Enviar pedido pelo WhatsApp";

  const situacao = situacaoLoja();
  avisoLojaFechada.hidden = situacao.aberto;
  if (situacao.aberto) {
    avisoLojaFechada.textContent = "";
  } else {
    avisoLojaFechada.textContent = `A loja está fechada agora (${textoQuandoAbre(situacao)}). Seu pedido fica agendado para quando ela abrir.`;
  }
}

function abrirCheckout() {
  const enderecoSalvo = ENDERECO_SALVO.ler();
  const perfil = PERFIL.ler?.() || null;

  if (!valorDoCampo(campoQuemRecebe)) campoQuemRecebe.value = enderecoSalvo.nome || perfil?.nome || "";
  if (!valorDoCampo(campoCepEntrega) && entrega?.cep) campoCepEntrega.value = entrega.cep;

  const mesmoCep = enderecoSalvo.cep && entrega?.cep === enderecoSalvo.cep;
  if (!valorDoCampo(campoRua)) {
    campoRua.value = mesmoCep && enderecoSalvo.rua ? enderecoSalvo.rua : entrega?.rua || "";
  }
  if (mesmoCep) {
    if (!valorDoCampo(campoNumero)) campoNumero.value = enderecoSalvo.numero || "";
    if (!valorDoCampo(campoComplemento)) campoComplemento.value = enderecoSalvo.compl || "";
    if (!valorDoCampo(campoReferencia)) campoReferencia.value = enderecoSalvo.ref || "";
  }

  if (!opcaoMarcada("fechar")) {
    const opcaoPadrao = lojaTemPix() ? "pix-site" : "entrega";
    carrinhoLateral.querySelector(`input[name="fechar"][value="${opcaoPadrao}"]`).checked = true;
  }
  mensagemCheckout.textContent = "";
  atualizarCheckout();
  irParaEtapa("dados");
}

function apontarErroNoCheckout(campo, texto) {
  for (const campoComErro of formCheckout.querySelectorAll("[aria-invalid]")) {
    campoComErro.removeAttribute("aria-invalid");
  }
  mensagemCheckout.textContent = texto;
  if (campo) {
    campo.setAttribute("aria-invalid", "true");
    campo.focus();
  }
  return null;
}

function limparErroDoCheckout(evento) {
  if (evento.target.getAttribute("aria-invalid") === "true") {
    evento.target.removeAttribute("aria-invalid");
    mensagemCheckout.textContent = "";
  }
}

function lerValorEmReais(texto) {
  let numero = String(texto).replace(/[^\d,.]/g, "");
  if (numero.includes(",")) numero = numero.replace(/\./g, "").replace(",", ".");
  const valor = Number(numero);
  return numero && Number.isFinite(valor) ? valor : NaN;
}

function descreverPagamentoNaEntrega(totais) {
  const forma = opcaoMarcada("forma");
  const quando = entrega.retirada ? "na retirada" : "na entrega";
  if (!forma) {
    return apontarErroNoCheckout(carrinhoLateral.querySelector('input[name="forma"]'), `Escolha como vai pagar ${quando}.`);
  }
  if (forma === "pix") return `Pix ${quando}`;
  if (forma === "cartao") return `Cartão ${quando} (débito ou crédito)`;
  if (forma === "dinheiro") {
    if (caixaSemTroco.checked) return `Dinheiro ${quando} — sem troco`;
    const troco = lerValorEmReais(valorDoCampo(campoTroco));
    if (!(troco > totais.total)) {
      return apontarErroNoCheckout(campoTroco, `O troco tem de ser para um valor acima do total (R$ ${brl(totais.total)}). Se não precisa, marque "Não preciso de troco".`);
    }
    return `Dinheiro ${quando} — troco para R$ ${brl(troco)} (levar R$ ${brl(troco - totais.total)})`;
  }
  return "";
}

function conferirCheckout() {
  const totais = calcularTotais();
  const nome = valorDoCampo(campoQuemRecebe).replace(/\s+/g, " ");
  if (nome.length < 2) return apontarErroNoCheckout(campoQuemRecebe, "Diga o nome de quem vai receber.");
  if (entrega === null) return apontarErroNoCheckout(campoCepEntrega, "Calcule o CEP da entrega para seguir.");
  if (!entrega.retirada) {
    if (!valorDoCampo(campoRua)) return apontarErroNoCheckout(campoRua, "Falta a rua.");
    if (!valorDoCampo(campoNumero)) return apontarErroNoCheckout(campoNumero, "Falta o número. Sem número, escreva s/n.");
  }

  const comoFechar = opcaoMarcada("fechar");
  if (!comoFechar) return apontarErroNoCheckout(carrinhoLateral.querySelector('input[name="fechar"]'), "Escolha como vai pagar.");

  let pagamento = "";
  if (comoFechar === "entrega") {
    pagamento = descreverPagamentoNaEntrega(totais);
    if (pagamento === null) return null;
  }

  mensagemCheckout.textContent = "";
  return {
    fechar: comoFechar,
    pagamento,
    nome,
    rua: valorDoCampo(campoRua),
    numero: valorDoCampo(campoNumero),
    compl: valorDoCampo(campoComplemento),
    ref: valorDoCampo(campoReferencia),
    obs: valorDoCampo(campoObservacao).replace(/\s+/g, " ")
  };
}

function montarMensagemPedido(pedido) {
  const totais = calcularTotais();
  const situacao = situacaoLoja();

  const linhasDosItens = [...carrinho.values()].map(({bebida, quantidade}) =>
    `• ${quantidade}x ${bebida.marca} ${bebida.nome} — R$ ${brl(precoDeVenda(bebida) * quantidade)}`);

  let linhaDaEntrega;
  let enderecoDoPedido;
  if (entrega.retirada) {
    linhaDaEntrega = `Retirada no balcão (${entrega.onde || "fora do raio"})`;
    enderecoDoPedido = ["*Retira no balcão:* " + pedido.nome];
  } else {
    linhaDaEntrega = `Entrega (${entrega.onde}): ${totais.taxa === 0 ? "grátis" : "R$ " + brl(totais.taxa)}`;
    enderecoDoPedido = [
      `*Entregar para:* ${pedido.nome}`,
      `${pedido.rua}, ${pedido.numero}${pedido.compl ? " — " + pedido.compl : ""}`,
      `${entrega.onde} — CEP ${entrega.cep || ""}`.replace(/ — CEP $/, ""),
      pedido.ref ? `Referência: ${pedido.ref}` : null
    ];
  }

  const linhas = [
    "*Pedido Zero Grau*",
    situacao.aberto ? null : `_Pedido feito com a loja fechada — entregar quando abrir (${textoQuandoAbre(situacao)})._`,
    "",
    ...linhasDosItens,
    "",
    `Subtotal: R$ ${brl(totais.subtotal)}`,
    totais.desconto > 0 ? `Desconto (${REGRAS.cupom.codigo}): − R$ ${brl(totais.desconto)}` : null,
    linhaDaEntrega,
    `*Total: R$ ${brl(totais.total)}*`,
    "",
    ...enderecoDoPedido,
    "",
    `*Pagamento:* ${pedido.pagamento}`,
    pedido.obs ? `*Observação:* ${pedido.obs}` : null
  ];
  return linhas.filter(linha => linha !== null).join("\n");
}

function enviarPedido(pedido) {
  const mensagem = montarMensagemPedido(pedido);
  const linkWhatsapp = CONTATO.whatsapp + "?text=" + encodeURIComponent(mensagem);
  const totais = calcularTotais();

  ENDERECO_SALVO.gravar({nome: pedido.nome, cep: entrega?.cep || "", rua: pedido.rua, numero: pedido.numero, compl: pedido.compl, ref: pedido.ref});
  PEDIDOS_ANTERIORES.guardar({
    em: Date.now(),
    total: totais.total,
    itens: [...carrinho.values()].map(({bebida, quantidade}) => [bebida.sku, quantidade, `${bebida.marca} ${bebida.nome}`])
  });
  if (totais.desconto > 0) CUPONS_USADOS.marcar(REGRAS.cupom.codigo);
  if (typeof registrarEvento === "function") {
    registrarEvento("pedido", {forma: pedido.fechar === "pix-site" ? "pix-site" : "whatsapp"});
  }

  open(linkWhatsapp, "_blank", "noopener");
  linkWhatsappDeNovo.href = linkWhatsapp;
  if (pedido.fechar === "pix-site") {
    textoPedidoFeito.textContent = "Abrimos a conversa com a loja com o pedido e a referência do Pix. Toque em enviar e mande o comprovante.";
  } else {
    textoPedidoFeito.textContent = "Abrimos a conversa com a loja com o pedido escrito. É só tocar em enviar.";
  }

  carrinho.clear();
  cupomAtivo = false;
  campoCupom.value = "";
  mensagemCupom.textContent = "";
  campoObservacao.value = "";
  campoTroco.value = "";
  caixaSemTroco.checked = false;
  atualizarCarrinho();
  irParaEtapa("feito");
}

function carregarBibliotecaQr() {
  if (window.qrcode) return Promise.resolve();
  return new Promise((quandoCarregar, quandoFalhar) => {
    const script = document.createElement("script");
    script.src = "js/vendor/qrcode.js?v=15";
    script.onload = quandoCarregar;
    script.onerror = quandoFalhar;
    document.head.append(script);
  });
}

async function enviarCheckout(evento) {
  evento.preventDefault();
  const pedido = conferirCheckout();
  if (!pedido) return;
  if (pedido.fechar !== "pix-site") {
    enviarPedido(pedido);
    return;
  }

  const totais = calcularTotais();
  const referencia = gerarReferenciaPix();
  const codigo = codigoPix({
    chave: chavePix(PIX.chave),
    nome: PIX.nome,
    cidade: PIX.cidade,
    valor: Math.round(totais.total * 100) / 100,
    txid: referencia
  });
  pedidoAguardandoPix = {...pedido, pagamento: `Pix pago pelo site — R$ ${brl(totais.total)} — referência ${referencia}. O comprovante segue nesta conversa.`};

  valorDoPix.textContent = "R$ " + brl(totais.total);
  campoCodigoPix.value = codigo;
  referenciaDoPix.textContent = referencia;
  recebedorDoPix.textContent = PIX.nome;
  desenhoQrCode.innerHTML = "";
  irParaEtapa("pix");

  try {
    await carregarBibliotecaQr();
    const qr = qrcode(0, "M");
    qr.addData(codigo);
    qr.make();
    desenhoQrCode.innerHTML = qr.createSvgTag({cellSize: 4, margin: 3, scalable: true});
  } catch {
    desenhoQrCode.innerHTML = '<p class="pix-semqr">Não deu para desenhar o QR code aqui. Use o código "copia e cola" abaixo.</p>';
  }
}

function copiarCodigoPix() {
  const codigo = campoCodigoPix.value;
  const avisarCopiado = () => mostrarToast("Código Pix copiado. Cole no app do seu banco.");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(codigo).then(avisarCopiado).catch(() => {
      campoCodigoPix.select();
      avisarCopiado();
    });
  } else {
    campoCodigoPix.select();
    avisarCopiado();
  }
}


function escaparHtml(texto) {
  const trocas = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"};
  return String(texto).replace(/[&<>"]/g, caractere => trocas[caractere]);
}

function mostrarPedidosAntigos() {
  const pedidos = PEDIDOS_ANTERIORES.ler();
  caixaPedidosAntigos.hidden = !pedidos.length || carrinho.size > 0;
  if (caixaPedidosAntigos.hidden) return;

  listaPedidosAntigos.innerHTML = pedidos.map((pedido, posicao) => {
    const quantidade = pedido.itens.reduce((soma, [, unidades]) => soma + unidades, 0);
    const dia = new Date(pedido.em).toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"});
    let nomes = pedido.itens.slice(0, 3).map(([, unidades, nome]) => `${unidades}x ${nome}`).join(", ");
    if (pedido.itens.length > 3) nomes += "…";
    return `<li class="pedido-antigo">
      <div><b>${dia} · ${quantidade} ${quantidade === 1 ? "item" : "itens"} · R$ ${brl(pedido.total)}</b><small>${escaparHtml(nomes)}</small></div>
      <button type="button" class="btn btn-ghost btn-sm" data-denovo="${posicao}">Pedir de novo</button>
    </li>`;
  }).join("");
}

function pedirDeNovo(evento) {
  const botao = evento.target.closest("[data-denovo]");
  if (!botao) return;
  const pedido = PEDIDOS_ANTERIORES.ler()[Number(botao.dataset.denovo)];
  if (!pedido) return;

  let faltaram = 0;
  let entraram = 0;
  for (const [sku, quantidade] of pedido.itens) {
    const bebida = BEBIDAS.find(produto => produto.sku === sku);
    if (!bebida || bebida.estoque === 0) {
      faltaram++;
      continue;
    }
    const cabe = Math.min(quantidade, bebida.estoque);
    carrinho.set(sku, {bebida, quantidade: cabe});
    entraram++;
    if (cabe < quantidade) faltaram++;
  }
  atualizarCarrinho();

  if (!entraram) {
    mostrarToast("Nenhum item desse pedido está disponível hoje.");
  } else if (faltaram) {
    mostrarToast("Pedido de volta no carrinho — alguns itens mudaram, confira.");
  } else {
    mostrarToast("Pedido de volta no carrinho.");
  }
}

function carregarCarrinhoDaConta() {
  carrinho.clear();
  cupomAtivo = false;
  entrega = null;
  const entregaSalva = lerDaConta("zg-entrega", null);
  if (entregaSalva && typeof entregaSalva.taxa === "number") entrega = entregaSalva;
  for (const [sku, quantidade] of CARRINHO_SALVO.ler()) {
    const bebida = BEBIDAS.find(produto => produto.sku === sku);
    if (bebida && quantidade > 0) {
      carrinho.set(sku, {bebida, quantidade: Math.min(quantidade, bebida.estoque)});
    }
  }
  atualizarCarrinho();
}

function trocouDeConta(evento) {
  const id = idConta(evento.detail);
  if (id === contaDoCarrinho) return;
  contaDoCarrinho = id;
  campoCupom.value = "";
  mensagemCupom.textContent = "";
  carregarCarrinhoDaConta();
}


function mostrarToast(mensagem) {
  textoToast.textContent = mensagem;
  avisoToast.classList.add("show");
  clearTimeout(esperaDoToast);
  esperaDoToast = setTimeout(() => avisoToast.classList.remove("show"), 2600);
}


function distanciaAte(lugar) {
  const cidade = normalizarLugar(lugar.localidade);
  if (!(cidade in ENTREGA.cidades)) return null;
  const distanciaDaCidade = ENTREGA.cidades[cidade];
  if (distanciaDaCidade !== null) return distanciaDaCidade;
  return ENTREGA.bairros[normalizarLugar(lugar.bairro)] ?? ENTREGA.PADRAO_FORTALEZA;
}

function salvarEntrega(novaEntrega) {
  entrega = novaEntrega;
  gravarNaConta("zg-entrega", novaEntrega);
  atualizarCarrinho();
  document.dispatchEvent(new CustomEvent("zg:entrega", {detail: novaEntrega}));
}

function mascararCep(texto) {
  const numeros = texto.replace(/\D/g, "").slice(0, 8);
  if (numeros.length > 5) return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
  return numeros;
}

async function consultarCep(numerosDoCep) {
  if (numerosDoCep.length !== 8) {
    return {classe: "bad", texto: "O CEP precisa ter 8 dígitos. Confira e calcule de novo."};
  }

  let lugar;
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${numerosDoCep}/json/`);
    if (!resposta.ok) throw new Error(resposta.status);
    lugar = await resposta.json();
  } catch {
    return {classe: "bad", texto: "Não deu para consultar o CEP agora. Tente de novo em instantes ou fale com a loja pelo WhatsApp."};
  }
  if (lugar.erro) {
    return {classe: "bad", texto: "Esse CEP não existe na base dos Correios. Confira os oito dígitos."};
  }

  const onde = [lugar.bairro, lugar.localidade].filter(Boolean).join(", ") || lugar.localidade;
  const cep = mascararCep(numerosDoCep);
  const rua = lugar.logradouro || "";
  const km = distanciaAte(lugar);

  if (km === null || km > RAIO_MAX) {
    return {
      classe: "bad",
      texto: `${onde} fica fora do raio de ${RAIO_MAX} km. Você pode retirar no balcão, sem taxa.`,
      entrega: {km: km ?? 0, taxa: 0, minutos: 0, retirada: true, onde, cep, rua}
    };
  }

  const taxa = TAXA_BASE + km * TAXA_KM;
  const minutos = Math.round(18 + km * 2.6);
  return {
    classe: "ok",
    texto: `Entregamos em ${onde}. ${km.toFixed(1).replace(".", ",")} km · taxa R$ ${brl(taxa)} · cerca de ${minutos} minutos.`,
    entrega: {km, taxa, minutos, retirada: false, onde, cep, rua}
  };
}

function ligarConsultaDeCep(campo, botao, mensagem) {
  const mostrarMensagem = (classe, texto) => {
    mensagem.className = "cep-msg " + classe;
    mensagem.textContent = texto;
  };

  campo.addEventListener("input", () => {
    campo.value = mascararCep(campo.value);
  });
  campo.addEventListener("keydown", evento => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      botao.click();
    }
  });
  botao.addEventListener("click", async () => {
    botao.disabled = true;
    mostrarMensagem("", "Consultando o CEP…");
    const consulta = await consultarCep(campo.value.replace(/\D/g, ""));
    botao.disabled = false;
    mostrarMensagem(consulta.classe, consulta.texto);
    if (consulta.entrega) salvarEntrega(consulta.entrega);
  });
}

function entregaMudou(evento) {
  if (evento.detail?.rua && !valorDoCampo(campoRua)) campoRua.value = evento.detail.rua;
  if (etapaAtual === "dados") atualizarCheckout();
}


function atualizarHorario() {
  const situacao = situacaoLoja();
  for (const elemento of document.querySelectorAll('[data-horario="resumo"]')) {
    elemento.textContent = resumoHorario();
  }
  for (const elemento of document.querySelectorAll('[data-horario="agora"], [data-horario="status"]')) {
    elemento.classList.toggle("fechado", !situacao.aberto);
    let texto;
    if (situacao.aberto) {
      texto = `<b>Aberto</b> ${situacao.fecha ? "até " + horaLonga(situacao.fecha) : "24 horas"}`;
    } else {
      texto = `<b>Fechado</b> · ${textoQuandoAbre(situacao)}`;
    }
    elemento.innerHTML = '<i class="live" aria-hidden="true"></i> ' + texto;
  }
  document.body.classList.toggle("loja-fechada", !situacao.aberto);
}


function larguraDoTexto(linha) {
  const intervalo = document.createRange();
  intervalo.selectNodeContents(linha);
  return intervalo.getBoundingClientRect().width;
}

function aplicarTamanho(linha, tamanho) {
  linha.style.fontSize = tamanho.toFixed(2) + "px";
  return larguraDoTexto(linha);
}

function ajustarManchete() {
  const manchete = document.querySelector(".manchete");
  if (!manchete) return;
  const estilo = getComputedStyle(manchete);
  const espacoLivre = (manchete.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight)) * 0.985;
  if (espacoLivre <= 0) return;
  const tamanhoMaximo = innerWidth < 820 ? TAMANHO_MAXIMO_CELULAR : TAMANHO_MAXIMO;

  for (const linha of linhasDaManchete) {
    linha.style.fontSize = TAMANHO_DE_MEDIDA + "px";
    const largura = larguraDoTexto(linha);
    if (!largura) continue;

    let tamanho = Math.max(TAMANHO_MINIMO, Math.min(espacoLivre / (largura / TAMANHO_DE_MEDIDA), tamanhoMaximo));
    let larguraReal = aplicarTamanho(linha, tamanho);
    for (let tentativa = 0; tentativa < 5 && larguraReal > espacoLivre && tamanho > TAMANHO_MINIMO; tentativa++) {
      tamanho = Math.max(TAMANHO_MINIMO, tamanho * (espacoLivre / larguraReal) * 0.999);
      larguraReal = aplicarTamanho(linha, tamanho);
    }
  }
}

function sortearSlogan() {
  const sloganSorteado = SLOGANS[Math.floor(Math.random() * SLOGANS.length)];
  linhasDaManchete.forEach((linha, posicao) => {
    linha.textContent = sloganSorteado[posicao];
  });
}

function mostrarVista(vista) {
  for (const aba of menuAbas.querySelectorAll(".app-aba")) {
    aba.setAttribute("aria-selected", String(aba.dataset.vista === vista));
  }
  for (const secao of document.querySelectorAll(".vista")) {
    secao.classList.toggle("ativa", secao.id === "v-" + vista);
  }
  if (vista === "inicio") ajustarManchete();
}


montarVitrine();
preencherNumerosDoCatalogo();
preencherRegrasNaPagina();
preencherContato();
montarAbasDeCategoria();

abasCategoria.addEventListener("click", escolherCategoria);
campoBusca.addEventListener("input", buscarComCalma);
botaoLimparBusca.addEventListener("click", limparBusca);

document.addEventListener("click", evento => {
  const link = evento.target.closest("[data-ir]");
  if (!link) return;
  irParaCategoria(link.dataset.ir);
});

botaoCarrinho.addEventListener("click", abrirCarrinho);
botaoFecharCarrinho.addEventListener("click", fecharCarrinho);
fundoCarrinho.addEventListener("click", fecharCarrinho);
addEventListener("keydown", evento => {
  if (evento.key === "Escape" && carrinhoLateral.classList.contains("aberto")) fecharCarrinho();
});
listaCarrinho.addEventListener("click", clicarNaListaDoCarrinho);
gradeProdutos.addEventListener("click", clicarNaVitrine);

botaoCupom.addEventListener("click", aplicarCupom);
campoCupom.addEventListener("keydown", evento => {
  if (evento.key === "Enter") botaoCupom.click();
});

botaoVoltarEtapa.addEventListener("click", () => {
  irParaEtapa(etapaAtual === "pix" ? "dados" : "carrinho");
});
botaoVoltarALoja.addEventListener("click", () => {
  fecharCarrinho();
  irParaEtapa("carrinho");
});
botaoContinuar.addEventListener("click", abrirCheckout);

ligarConsultaDeCep(campoCepEntrega, botaoCepEntrega, mensagemCepEntrega);
document.addEventListener("zg:entrega", entregaMudou);
formCheckout.addEventListener("change", atualizarCheckout);
formCheckout.addEventListener("input", limparErroDoCheckout);
formCheckout.addEventListener("submit", enviarCheckout);

botaoCopiarPix.addEventListener("click", copiarCodigoPix);
botaoJaPaguei.addEventListener("click", () => {
  if (pedidoAguardandoPix) enviarPedido(pedidoAguardandoPix);
});

carrinhoLateral.addEventListener("click", pedirDeNovo);

carregarCarrinhoDaConta();
document.addEventListener("zg:entrou", trocouDeConta);

ligarConsultaDeCep(campoCep, botaoCep, mensagemCep);
botaoCodigoCupom.addEventListener("click", copiarCupom);

atualizarHorario();
setInterval(atualizarHorario, 60_000);

document.fonts.ready.then(ajustarManchete);
addEventListener("resize", () => {
  clearTimeout(esperaDoRedimensionar);
  esperaDoRedimensionar = setTimeout(ajustarManchete, 120);
});

sortearSlogan();

document.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-vista]");
  if (botao) mostrarVista(botao.dataset.vista);
});

mostrarVista("inicio");

document.addEventListener("click", evento => {
  if (evento.target.closest("[data-ir]")) mostrarVista("catalogo");
});
