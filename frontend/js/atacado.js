const corpoTabela = document.getElementById("linhas");
const abasCategoria = document.getElementById("tabs");
const campoBusca = document.getElementById("buscaInput");
const avisoSemResultado = document.getElementById("semResultado");
const botaoLimparBusca = document.getElementById("limparBusca");

const painelPedido = document.getElementById("pedido");
const fundoPedido = document.getElementById("pedidoOverlay");
const botaoFecharPedido = document.getElementById("pedidoClose");
const barraDoPedido = document.getElementById("barra");
const itensDoPedido = document.getElementById("pedidoItens");
const pedidoVazio = document.getElementById("pedidoVazio");
const avisoPedido = document.getElementById("pedidoAviso");
const botaoEnviar = document.getElementById("enviar");

const botaoCarrinho = document.getElementById("cartBtn");
const contadorCarrinho = document.getElementById("cartCount");
const totalNoBotao = document.getElementById("cartTotal");
const caixasNaBarra = document.getElementById("barraCaixas");
const totalNaBarra = document.getElementById("barraTotal");

const resumoCaixas = document.getElementById("rCaixas");
const resumoMercadoria = document.getElementById("rSub");
const linhaFaixa = document.getElementById("linhaFaixa");
const resumoFaixa = document.getElementById("rFaixa");
const nomeDaFaixa = document.getElementById("rFaixaNome");
const resumoFrete = document.getElementById("rFrete");
const resumoTotal = document.getElementById("rTotal");

const avisoToast = document.getElementById("toast");
const textoToast = document.getElementById("toastMsg");

const pedido = new Map();
let categoriaAtual = "all";
let buscaAtual = "";
let esperaDaBusca;
let esperaDoToast;
let contaDoPedido = idConta(PERFIL.ler());
const focoPainelPedido = prenderFoco(painelPedido);

const PEDIDO_SALVO = {
  ler() {
    const salvo = lerDaConta("zg-atacado", []);
    return Array.isArray(salvo) ? salvo : [];
  },
  salvar() {
    gravarNaConta("zg-atacado", [...pedido]);
  }
};


function acharBebida(sku) {
  return BEBIDAS.find(bebida => bebida.sku === sku);
}

function montarLinhaTabela(bebida) {
  const unidadesPorCaixa = caixaDe(bebida);
  const caixasEmEstoque = caixasDe(bebida);
  const precoUnidade = precoAtacado(bebida);
  const esgotado = caixasEmEstoque === 0;

  return `
  <tr class="item${esgotado ? " esgotado" : ""}" data-sku="${bebida.sku}" data-cat="${bebida.cat}"
      data-busca="${semAcento(bebida.marca + " " + bebida.nome + " " + bebida.vol)}">
    <th scope="row" class="prod">
      <span class="prod-marca">${bebida.marca}</span>
      <span class="prod-nome">${bebida.nome}</span>
      <span class="prod-emb">caixa com ${unidadesPorCaixa} un. · ${esgotado ? "esgotado" : caixasEmEstoque + " cx em estoque"}</span>
      ${bebida.retornavel ? `<span class="prod-nota">casco retornável · R$ ${brl(bebida.casco)} por unidade</span>` : ""}
    </th>
    <td class="n">${unidadesPorCaixa} un.</td>
    <td class="n">R$ ${brl(precoUnidade)}</td>
    <td class="n forte">R$ ${brl(precoUnidade * unidadesPorCaixa)}</td>
    <td class="n ${esgotado ? "zero" : ""}">${esgotado ? "esgotado" : caixasEmEstoque + " cx"}</td>
    <td class="n">
      <div class="qtd">
        <button data-acao="menos" ${esgotado ? "disabled" : ""} aria-label="Menos uma caixa de ${bebida.marca} ${bebida.nome}">−</button>
        <span aria-live="polite" data-qtd>0</span>
        <button data-acao="mais" ${esgotado ? "disabled" : ""} aria-label="Mais uma caixa de ${bebida.marca} ${bebida.nome}">+</button>
      </div>
    </td>
  </tr>`;
}

function montarTabela() {
  corpoTabela.innerHTML = BEBIDAS.map(montarLinhaTabela).join("");

  const botoes = CATEGORIAS.map(categoria =>
    `<button class="tab" data-cat="${categoria.id}" role="tab" aria-selected="false" aria-controls="tabela">${categoria.nome}</button>`
  );
  abasCategoria.insertAdjacentHTML("beforeend", botoes.join(""));

  const totais = {itens: BEBIDAS.length, categorias: CATEGORIAS.length};
  for (const elemento of document.querySelectorAll("[data-total]")) {
    elemento.textContent = totais[elemento.dataset.total];
  }
  for (const elemento of document.querySelectorAll("[data-reg]")) {
    elemento.textContent = "R$ " + brl(ATACADO[elemento.dataset.reg]);
  }
  document.getElementById("pedidoNota").textContent = ATACADO.prazo;
}


function filtrarTabela() {
  const termo = semAcento(buscaAtual.trim());
  let procura = null;
  if (termo) {
    const termoSeguro = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    procura = new RegExp("(?<![\\p{L}\\p{N}])" + termoSeguro, "u");
  }

  let visiveis = 0;
  for (const linha of corpoTabela.querySelectorAll(".item")) {
    const daCategoria = categoriaAtual === "all" || linha.dataset.cat === categoriaAtual;
    const daBusca = !procura || procura.test(linha.dataset.busca);
    const aparece = daCategoria && daBusca;
    linha.classList.toggle("hide", !aparece);
    if (aparece) visiveis++;
  }
  avisoSemResultado.hidden = visiveis > 0;
}

function escolherCategoria(evento) {
  const abaClicada = evento.target.closest(".tab");
  if (!abaClicada) return;
  for (const aba of abasCategoria.querySelectorAll(".tab")) {
    const selecionada = aba === abaClicada;
    aba.classList.toggle("active", selecionada);
    aba.setAttribute("aria-selected", String(selecionada));
  }
  categoriaAtual = abaClicada.dataset.cat;
  filtrarTabela();
}

function buscarComCalma() {
  clearTimeout(esperaDaBusca);
  esperaDaBusca = setTimeout(() => {
    buscaAtual = campoBusca.value;
    filtrarTabela();
  }, 140);
}

function limparBusca() {
  campoBusca.value = "";
  buscaAtual = "";
  filtrarTabela();
  campoBusca.focus();
}


function calcularTotais() {
  let caixas = 0;
  let mercadoria = 0;
  for (const [sku, quantidade] of pedido) {
    const bebida = acharBebida(sku);
    if (!bebida) continue;
    caixas += quantidade;
    mercadoria += precoAtacado(bebida) * caixaDe(bebida) * quantidade;
  }
  const extra = descontoDaFaixa(caixas);
  const desconto = mercadoria * extra;
  const totalProdutos = mercadoria - desconto;

  let frete = null;
  if (caixas > 0) {
    frete = totalProdutos >= ATACADO.freteGratis ? 0 : TAXA_BASE + RAIO_MAX * TAXA_KM;
  }
  return {caixas, mercadoria, extra, desconto, totalProdutos, frete, total: totalProdutos + (frete ?? 0)};
}

function montarItemDoPedido(sku, quantidade) {
  const bebida = acharBebida(sku);
  const unidadesPorCaixa = caixaDe(bebida);
  return `
  <article class="pedido-item" data-sku="${sku}">
    <div>
      <div class="marca">${bebida.marca}</div>
      <div class="nome">${bebida.nome}</div>
      <div class="un">${quantidade} cx · ${quantidade * unidadesPorCaixa} un. · R$ ${brl(precoAtacado(bebida))} a unidade</div>
    </div>
    <div class="linha-fim">
      <div class="sub">R$ ${brl(precoAtacado(bebida) * unidadesPorCaixa * quantidade)}</div>
      <button class="tirar" data-acao="tirar" aria-label="Tirar ${bebida.marca} ${bebida.nome} do pedido">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>
        </svg>
      </button>
    </div>
  </article>`;
}

function atualizarAvisoPedido(totais, vazio) {
  avisoPedido.className = "cart-aviso";
  if (vazio) {
    avisoPedido.textContent = "";
  } else if (totais.totalProdutos < ATACADO.minimo) {
    avisoPedido.classList.add("bad");
    avisoPedido.textContent = `Faltam R$ ${brl(ATACADO.minimo - totais.totalProdutos)} para o pedido mínimo de R$ ${brl(ATACADO.minimo)}.`;
  } else if (totais.frete === 0) {
    avisoPedido.classList.add("ok");
    avisoPedido.textContent = "Frete grátis aplicado.";
  } else {
    const proximaFaixa = ATACADO.faixas.find(faixa => totais.caixas < faixa.cx);
    if (proximaFaixa) {
      avisoPedido.textContent = `Faltam ${proximaFaixa.cx - totais.caixas} caixas para ${Math.round(proximaFaixa.extra * 100)}% de desconto por volume.`;
    } else {
      avisoPedido.textContent = `Faltam R$ ${brl(ATACADO.freteGratis - totais.totalProdutos)} para o frete sair de graça.`;
    }
  }
}

function atualizarPedido() {
  const totais = calcularTotais();
  const vazio = pedido.size === 0;

  itensDoPedido.innerHTML = [...pedido].map(([sku, quantidade]) => montarItemDoPedido(sku, quantidade)).join("");
  pedidoVazio.hidden = !vazio;

  for (const linha of corpoTabela.querySelectorAll(".item")) {
    const quantidade = pedido.get(linha.dataset.sku) || 0;
    linha.querySelector("[data-qtd]").textContent = quantidade;
    linha.classList.toggle("no-pedido", quantidade > 0);
    const bebida = acharBebida(linha.dataset.sku);
    const botaoMais = linha.querySelector('[data-acao="mais"]');
    if (botaoMais) botaoMais.disabled = quantidade >= caixasDe(bebida);
    const botaoMenos = linha.querySelector('[data-acao="menos"]');
    if (botaoMenos) botaoMenos.disabled = quantidade === 0;
  }

  contadorCarrinho.textContent = totais.caixas;
  totalNoBotao.textContent = "R$ " + brl(totais.total);
  botaoCarrinho.classList.toggle("tem-itens", !vazio);
  caixasNaBarra.textContent = totais.caixas;
  totalNaBarra.textContent = "R$ " + brl(totais.total);
  document.body.classList.toggle("tem-pedido", !vazio);

  resumoCaixas.textContent = totais.caixas;
  resumoMercadoria.textContent = "R$ " + brl(totais.mercadoria);
  resumoTotal.textContent = "R$ " + brl(totais.total);
  linhaFaixa.hidden = totais.extra === 0;
  resumoFaixa.textContent = "− R$ " + brl(totais.desconto);
  nomeDaFaixa.textContent = totais.extra ? `(${Math.round(totais.extra * 100)}%)` : "";

  if (totais.frete === null) {
    resumoFrete.textContent = "—";
  } else if (totais.frete === 0) {
    resumoFrete.textContent = "grátis";
  } else {
    resumoFrete.textContent = "R$ " + brl(totais.frete);
  }

  atualizarAvisoPedido(totais, vazio);
  botaoEnviar.disabled = vazio || totais.totalProdutos < ATACADO.minimo;

  PEDIDO_SALVO.salvar();
}

function mudarCaixas(sku, diferenca) {
  const bebida = acharBebida(sku);
  if (!bebida) return;
  const limite = caixasDe(bebida);
  const quantidade = (pedido.get(sku) || 0) + diferenca;
  if (quantidade > limite) {
    mostrarToast(`${bebida.marca}: só há ${limite} caixas em estoque`);
    return;
  }
  if (quantidade <= 0) {
    pedido.delete(sku);
  } else {
    pedido.set(sku, quantidade);
  }
  atualizarPedido();
}

function clicarNaTabela(evento) {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao || botao.disabled) return;
  mudarCaixas(botao.closest(".item").dataset.sku, botao.dataset.acao === "mais" ? 1 : -1);
}

function tirarDoPedido(evento) {
  const botao = evento.target.closest('[data-acao="tirar"]');
  if (!botao) return;
  const sku = botao.closest(".pedido-item").dataset.sku;
  const bebida = acharBebida(sku);
  pedido.delete(sku);
  atualizarPedido();
  mostrarToast(`${bebida.marca} saiu do pedido`);
}


const pedidoEmGaveta = matchMedia("(max-width: 1080px)");

function ajustarInertePedido() {
  painelPedido.inert = pedidoEmGaveta.matches && !painelPedido.classList.contains("aberto");
}

function abrirPainelPedido() {
  painelPedido.classList.add("aberto");
  ajustarInertePedido();
  fundoPedido.hidden = false;
  requestAnimationFrame(() => fundoPedido.classList.add("aberto"));
  document.body.classList.add("locked");
  painelPedido.addEventListener("keydown", focoPainelPedido);
  botaoFecharPedido.focus();
}

function fecharPainelPedido() {
  painelPedido.classList.remove("aberto");
  ajustarInertePedido();
  requestAnimationFrame(() => fundoPedido.classList.remove("aberto"));
  setTimeout(() => {
    fundoPedido.hidden = true;
  }, 300);
  document.body.classList.remove("locked");
  painelPedido.removeEventListener("keydown", focoPainelPedido);
  barraDoPedido.focus();
}

function mostrarToast(mensagem) {
  textoToast.textContent = mensagem;
  avisoToast.classList.add("show");
  clearTimeout(esperaDoToast);
  esperaDoToast = setTimeout(() => avisoToast.classList.remove("show"), 2600);
}

function enviarPedidoAtacado() {
  const totais = calcularTotais();
  const cnpj = document.querySelector("[data-doc]")?.textContent || "";
  const linhasDosItens = [...pedido].map(([sku, quantidade]) => {
    const bebida = acharBebida(sku);
    return `• ${quantidade} cx (${quantidade * caixaDe(bebida)} un.) ${bebida.marca} ${bebida.nome} — R$ ${brl(precoAtacado(bebida) * caixaDe(bebida) * quantidade)}`;
  });

  const linhas = [
    "*Pedido de atacado · Zero Grau*",
    cnpj ? `CNPJ: ${cnpj}` : null,
    "",
    ...linhasDosItens,
    "",
    `Caixas: ${totais.caixas}`,
    `Mercadoria: R$ ${brl(totais.mercadoria)}`,
    totais.desconto > 0 ? `Desconto por volume (${Math.round(totais.extra * 100)}%): − R$ ${brl(totais.desconto)}` : null,
    `Frete: ${totais.frete === 0 ? "grátis" : "R$ " + brl(totais.frete)}`,
    `*Total: R$ ${brl(totais.total)}*`,
    "",
    ATACADO.prazo
  ];
  const mensagem = linhas.filter(Boolean).join("\n");

  open(CONTATO.whatsapp + "?text=" + encodeURIComponent(mensagem), "_blank", "noopener");
}

function carregarPedidoDaConta() {
  pedido.clear();
  for (const [sku, quantidade] of PEDIDO_SALVO.ler()) {
    const bebida = acharBebida(sku);
    if (bebida && quantidade > 0) pedido.set(sku, Math.min(quantidade, caixasDe(bebida)));
  }
  atualizarPedido();
}

function trocouDeConta(evento) {
  const id = idConta(evento.detail);
  if (id === contaDoPedido) return;
  contaDoPedido = id;
  carregarPedidoDaConta();
}


montarTabela();

abasCategoria.addEventListener("click", escolherCategoria);
campoBusca.addEventListener("input", buscarComCalma);
botaoLimparBusca.addEventListener("click", limparBusca);

corpoTabela.addEventListener("click", clicarNaTabela);
itensDoPedido.addEventListener("click", tirarDoPedido);

barraDoPedido.addEventListener("click", abrirPainelPedido);
botaoCarrinho.addEventListener("click", abrirPainelPedido);
botaoFecharPedido.addEventListener("click", fecharPainelPedido);
fundoPedido.addEventListener("click", fecharPainelPedido);
addEventListener("keydown", evento => {
  if (evento.key === "Escape" && painelPedido.classList.contains("aberto")) fecharPainelPedido();
});

botaoEnviar.addEventListener("click", enviarPedidoAtacado);

carregarPedidoDaConta();
document.addEventListener("zg:entrou", trocouDeConta);

pedidoEmGaveta.addEventListener("change", ajustarInertePedido);
ajustarInertePedido();
