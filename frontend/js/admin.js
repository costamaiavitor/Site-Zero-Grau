const tabelaProdutos = document.getElementById("linhasProdutos");
const campoBuscaProduto = document.getElementById("busca");
const contadorProdutos = document.getElementById("contaProdutos");
const botaoNovoProduto = document.getElementById("novoProduto");
const listaFaixas = document.getElementById("faixas");
const botaoNovaFaixa = document.getElementById("novaFaixa");
const gradeHorario = document.getElementById("horario");
const seletorEstatistica = document.getElementById("estTipo");
const campoIdEstatistica = document.getElementById("estId");
const blocoIdEstatistica = document.getElementById("estIdCampo");
const rotuloIdEstatistica = document.getElementById("estIdRotulo");

const situacaoDoPainel = document.getElementById("estado");
const botaoPublicar = document.getElementById("publicar");
const botaoDescartar = document.getElementById("descartar");
const botaoBaixar = document.getElementById("baixar");

const seletorDeFoto = document.getElementById("fotoArquivo");
const janelaFoto = document.getElementById("dlgFoto");
const tituloFoto = document.getElementById("fotoTitulo");
const resultadoFoto = document.getElementById("fotoResultado");
const previaFoto = document.getElementById("fotoPrevia");
const botaoUsarFoto = document.getElementById("fotoUsar");

const botaoCarregarHistorico = document.getElementById("histCarregar");
const mensagemHistorico = document.getElementById("histMsg");
const listaHistorico = document.getElementById("histLista");

const janelaSemChave = document.getElementById("dlgSemChave");
const janelaPublicar = document.getElementById("dlgPublicar");
const avisoFotosNoDownload = document.getElementById("dlgFotosAviso");
const situacaoGitHub = document.getElementById("ghEstado");
const formGitHub = document.getElementById("ghForm");
const campoChaveGitHub = document.getElementById("ghChave");
const mensagemGitHub = document.getElementById("ghMsg");
const botaoConectar = document.getElementById("ghConectar");
const botaoEsquecerChave = document.getElementById("ghEsquecer");

const avisoToast = document.getElementById("toast");
const textoToast = document.getElementById("toastMsg");
const abasDoPainel = [...document.querySelectorAll(".adm-aba")];


const PUBLICADO = estadoAtual();

const rascunhoSalvo = RASCUNHO.ler();
aplicarAjustes(rascunhoSalvo);
let emEdicao = estadoAtual();
emEdicao.fotosNovas = {};
for (const [nome, foto] of Object.entries(rascunhoSalvo?.fotosNovas || {})) {
  if (fotoNovaValida(nome, foto)) emEdicao.fotosNovas[nome] = foto;
}

const FOTOS_PUBLICADAS = [...new Set(PUBLICADO.bebidas.map(bebida => bebida.foto).filter(Boolean))].sort();
const NOME_DA_EMBALAGEM = {can: "Lata", bottle: "Long neck", tall: "Garrafa alta", pet: "PET", saco: "Saco"};
const ORDEM_DOS_DIAS = [1, 2, 3, 4, 5, 6, 0];
const CAMPOS_DO_PRODUTO = ["marca", "nome", "cat", "vol", "teor", "forma", "foto", "preco", "promo",
                           "estoque", "gelada", "alcoolica", "casco"];

const camposComErro = new Map();
let skuDaFoto = null;
let fotoProcessada = null;
let esperaParaSalvar;
let esperaDoToast;
let publicando = false;

function fotosDisponiveis() {
  return [...new Set([...FOTOS_PUBLICADAS, ...Object.keys(emEdicao.fotosNovas || {})])].sort();
}

function enderecoDaFoto(foto) {
  return emEdicao.fotosNovas?.[foto]?.[200] || `img/${foto}-200.webp`;
}


function lerNumeroDigitado(texto) {
  let numero = String(texto).trim().replace(/\s|R\$/g, "");
  if (numero === "") return null;
  if (numero.includes(",")) {
    numero = numero.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(numero)) {
    numero = numero.replace(/\./g, "");
  }
  const valor = Number(numero);
  return Number.isFinite(valor) ? valor : NaN;
}

function arredondar(valor, casas = 2) {
  return Math.round(valor * 10 ** casas) / 10 ** casas;
}

function lerEArredondar(texto, transformar) {
  const numero = lerNumeroDigitado(texto);
  if (numero === null) return null;
  return transformar(numero);
}

function mostrarWhatsapp(link) {
  const numeros = String(link || "").replace(/\D/g, "").replace(/^55/, "");
  if (numeros.length === 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  if (numeros.length === 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  return numeros;
}

function lerWhatsapp(texto) {
  let numeros = texto.replace(/\D/g, "");
  if (numeros.length === 12 || numeros.length === 13) numeros = numeros.replace(/^55/, "");
  if (numeros.length === 10 || numeros.length === 11) return `https://wa.me/55${numeros}`;
  return texto.trim() ? NaN : null;
}

function lerData(texto) {
  const partes = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!texto.trim()) return "";
  const dataIso = partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : "";
  return FORMATO_DATA.test(dataIso) ? dataIso : NaN;
}

function lerChavePix(texto) {
  const chave = texto.trim();
  if (!chave) return "";
  return chavePix(chave) || NaN;
}

const TIPOS_DE_CAMPO = {
  brl: {
    mostrar: valor => valor == null ? "" : brl(valor),
    ler: texto => lerEArredondar(texto, numero => arredondar(numero))
  },
  pct: {
    mostrar: valor => valor == null ? "" : String(arredondar(valor * 100, 1)).replace(".", ","),
    ler: texto => lerEArredondar(texto, numero => arredondar(numero / 100, 4))
  },
  km: {
    mostrar: valor => valor == null ? "" : String(valor).replace(".", ","),
    ler: texto => lerEArredondar(texto, numero => arredondar(numero, 1))
  },
  int: {
    mostrar: valor => valor == null ? "" : String(valor),
    ler: texto => lerEArredondar(texto, numero => numero)
  },
  texto: {
    mostrar: valor => valor ?? "",
    ler: texto => texto.trim()
  },
  codigo: {
    mostrar: valor => valor ?? "",
    ler: texto => texto.trim().toUpperCase()
  },
  zap: {
    mostrar: mostrarWhatsapp,
    ler: lerWhatsapp
  },
  link: {
    mostrar: valor => valor === "#" ? "" : valor ?? "",
    ler: texto => texto.trim() || "#"
  },
  data: {
    mostrar: valor => valor ? dataCurta(valor) : "",
    ler: lerData
  },
  pixchave: {
    mostrar: valor => valor ?? "",
    ler: lerChavePix
  }
};


function ehInteiro(valor) {
  return Number.isInteger(valor);
}

function precisaSerReais(valor) {
  return valor === null || !(valor >= 0) ? "Valor em reais, 0 ou mais." : "";
}

function precisaSerObrigatorio(valor) {
  return !valor ? "Obrigatório." : "";
}

function precisaSerLink(valor) {
  return valor !== "#" && !/^https:\/\/\S+$/.test(valor) ? "Link começando com https://, ou vazio." : "";
}

const VALIDACAO_DOS_CAMPOS = {
  "varejo.minimo":         precisaSerReais,
  "varejo.freteGratis":    precisaSerReais,
  "varejo.taxaBase":       precisaSerReais,
  "varejo.taxaKm":         precisaSerReais,
  "varejo.raioMax":        valor => valor === null || !(valor >= 0.5) || valor > 200 ? "Entre 0,5 e 200 km." : "",
  "varejo.cupom.codigo":   valor => !/^[A-Z0-9]{3,24}$/.test(valor) ? "3 a 24 letras ou números, sem espaço." : "",
  "varejo.cupom.desconto": valor => valor === null || !(valor >= 0.01) || valor > 0.9 ? "Entre 1% e 90%." : "",
  "varejo.cupom.minimo":   precisaSerReais,
  "varejo.cupom.teto":     valor => valor === null || !(valor >= 0) ? "Valor em reais; 0 = sem teto." : "",
  "varejo.cupom.validade": valor => Number.isNaN(valor) ? "Data como 31/12/2026, ou vazio." : "",
  "atacado.desconto":      valor => valor === null || !(valor >= 0) || valor > 0.9 ? "Entre 0% e 90%." : "",
  "atacado.minimo":        precisaSerReais,
  "atacado.freteGratis":   precisaSerReais,
  "atacado.prazo":         valor => !valor ? "Escreva a condição de pagamento." : "",
  "contato.whatsapp":      valor => typeof valor !== "string" ? "Número com DDD: (85) 98149-4445." : "",
  "contato.telefone":      precisaSerObrigatorio,
  "contato.email":         valor => !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor) ? "E-mail incompleto." : "",
  "contato.cnpj":          precisaSerObrigatorio,
  "contato.endereco":      precisaSerObrigatorio,
  "contato.bairro":        precisaSerObrigatorio,
  "contato.instagram":     precisaSerLink,
  "contato.facebook":      precisaSerLink,
  "pix.chave":  valor => Number.isNaN(valor) ? "Não é uma chave Pix: use CNPJ, CPF, e-mail, telefone com DDD ou chave aleatória." : "",
  "pix.nome":   valor => !textoPix(valor, 25) ? "Nome de quem recebe, até 25 letras." : valor.length > 25 ? "Até 25 letras." : "",
  "pix.cidade": valor => !textoPix(valor, 15) ? "Cidade, até 15 letras." : valor.length > 15 ? "Até 15 letras." : ""
};
for (const forma of FORMAS) {
  VALIDACAO_DOS_CAMPOS[`caixaPadrao.${forma}`] = valor => valor === null || !ehInteiro(valor) || valor < 1 ? "Número inteiro, 1 ou mais." : "";
}

const VALIDACAO_DO_PRODUTO = {
  marca:   precisaSerObrigatorio,
  nome:    precisaSerObrigatorio,
  vol:     precisaSerObrigatorio,
  teor:    valor => !valor ? "Use — se não tiver." : "",
  preco:   valor => valor === null || !(valor >= 0.01) ? "Preço acima de zero." : "",
  promo:   (valor, bebida) => {
    if (valor === null) return "";
    if (!(valor >= 0.01)) return "Acima de zero, ou vazio.";
    if (valor >= bebida.preco) return "Menor que o preço.";
    return "";
  },
  estoque: valor => valor === null || !ehInteiro(valor) || valor < 0 ? "Inteiro, 0 ou mais." : "",
  caixa:   valor => valor === null ? "" : !ehInteiro(valor) || valor < 1 ? "Inteiro, ou vazio." : "",
  casco:   valor => valor === null ? "" : !(valor >= 0.01) ? "Acima de zero, ou vazio." : ""
};

function lerCaminho(objeto, caminho) {
  return caminho.split(".").reduce((atual, chave) => atual?.[chave], objeto);
}

function gravarCaminho(objeto, caminho, valor) {
  const partes = caminho.split(".");
  const ultima = partes.pop();
  const alvo = partes.reduce((atual, chave) => atual[chave], objeto);
  alvo[ultima] = valor;
}

function marcarErro(campo, chave, mensagem) {
  const caixa = campo.closest(".adm-campo, td, .adm-dia");
  let aviso = caixa?.querySelector(".adm-erro");
  if (mensagem) {
    camposComErro.set(chave, mensagem);
    campo.setAttribute("aria-invalid", "true");
    if (caixa && !aviso) {
      aviso = document.createElement("span");
      aviso.className = "adm-erro";
      aviso.id = "erro-" + chave.replace(/[^\w-]/g, "_");
      caixa.append(aviso);
      campo.setAttribute("aria-describedby", aviso.id);
    }
    if (aviso) aviso.textContent = mensagem;
  } else {
    camposComErro.delete(chave);
    campo.removeAttribute("aria-invalid");
    campo.removeAttribute("aria-describedby");
    aviso?.remove();
  }
}

function esquecerErrosQueComecamCom(prefixo) {
  for (const chave of [...camposComErro.keys()]) {
    if (chave.startsWith(prefixo)) camposComErro.delete(chave);
  }
}


function escaparHtml(texto) {
  const trocas = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"};
  return String(texto ?? "").replace(/[&<>"]/g, caractere => trocas[caractere]);
}

function caixaPropriaDe(bebida) {
  return emEdicao.caixaExcecao[bebida.sku] ?? null;
}

function acharProduto(sku) {
  return emEdicao.bebidas.find(bebida => bebida.sku === sku);
}

function montarOpcoes(opcoes, valorAtual) {
  return opcoes.map(([valor, texto]) =>
    `<option value="${escaparHtml(valor)}"${valor === valorAtual ? " selected" : ""}>${escaparHtml(texto)}</option>`
  ).join("");
}

function montarLinhaProduto(bebida) {
  const rotulo = `${bebida.marca} ${bebida.nome}`.trim() || "produto novo";
  const campoDeTexto = (campo, valor, classe = "") =>
    `<input class="${classe}" data-campo="${campo}" value="${escaparHtml(valor)}" aria-label="${escaparHtml(rotulo)} — ${campo}">`;
  const campoDeNumero = (campo, valor, tipo) =>
    `<input class="n" data-campo="${campo}" data-tipo="${tipo}" inputmode="${tipo === "int" ? "numeric" : "decimal"}"
       value="${escaparHtml(TIPOS_DE_CAMPO[tipo].mostrar(valor))}" aria-label="${escaparHtml(rotulo)} — ${campo}">`;
  const caixaDeMarcar = (campo, valor) =>
    `<input type="checkbox" data-campo="${campo}"${valor ? " checked" : ""} aria-label="${escaparHtml(rotulo)} — ${campo}">`;

  const opcoesCategoria = montarOpcoes(CATEGORIAS.map(categoria => [categoria.id, categoria.nome]), bebida.cat);
  const opcoesEmbalagem = montarOpcoes(FORMAS.map(forma => [forma, NOME_DA_EMBALAGEM[forma]]), bebida.forma);
  const listaDeFotos = [["", "sem foto"], ...fotosDisponiveis().map(foto => [foto, emEdicao.fotosNovas?.[foto] ? foto + " (nova)" : foto])];
  const opcoesFoto = montarOpcoes(listaDeFotos, bebida.foto || "");

  return `
  <tr data-sku="${escaparHtml(bebida.sku)}">
    <td class="fixa">
      ${campoDeTexto("marca", bebida.marca, "marca")}
      ${campoDeTexto("nome", bebida.nome)}
    </td>
    <td><select data-campo="cat" aria-label="${escaparHtml(rotulo)} — categoria">${opcoesCategoria}</select></td>
    <td>${campoDeTexto("vol", bebida.vol, "curto")}</td>
    <td>${campoDeTexto("teor", bebida.teor, "curto")}</td>
    <td><select data-campo="forma" aria-label="${escaparHtml(rotulo)} — embalagem">${opcoesEmbalagem}</select></td>
    <td class="adm-foto">
      ${bebida.foto ? `<img class="adm-thumb" src="${escaparHtml(enderecoDaFoto(bebida.foto))}" alt="">` : ""}
      <select data-campo="foto" aria-label="${escaparHtml(rotulo)} — foto">${opcoesFoto}</select>
      <button type="button" class="adm-foto-btn" data-acao="foto" aria-label="Subir foto de ${escaparHtml(rotulo)}">Subir foto</button>
    </td>
    <td>${campoDeNumero("preco", bebida.preco, "brl")}</td>
    <td>${campoDeNumero("promo", bebida.promo, "brl")}</td>
    <td>${campoDeNumero("estoque", bebida.estoque, "int")}</td>
    <td>${campoDeNumero("caixa", caixaPropriaDe(bebida), "int")}</td>
    <td>${campoDeNumero("casco", bebida.retornavel ? bebida.casco : null, "brl")}</td>
    <td class="c">${caixaDeMarcar("gelada", bebida.gelada)}</td>
    <td class="c">${caixaDeMarcar("alcoolica", bebida.alcoolica)}</td>
    <td class="n calc" data-calc></td>
    <td class="c"><button type="button" class="adm-tirar" data-acao="tirar" aria-label="Remover ${escaparHtml(rotulo)}">Remover</button></td>
  </tr>`;
}

function calcularColunaAtacado(linha) {
  const bebida = acharProduto(linha.dataset.sku);
  const celula = linha.querySelector("[data-calc]");
  if (!bebida || !(bebida.preco > 0)) {
    celula.textContent = "—";
    return;
  }
  const precoUnidade = bebida.preco * (1 - emEdicao.atacado.desconto);
  const unidadesPorCaixa = caixaPropriaDe(bebida) ?? emEdicao.caixaPadrao[bebida.forma] ?? 12;
  celula.innerHTML = `R$ ${brl(precoUnidade)}<small>cx ${unidadesPorCaixa} · R$ ${brl(precoUnidade * unidadesPorCaixa)}</small>`;
}

function recalcularColunaAtacado() {
  for (const linha of tabelaProdutos.rows) calcularColunaAtacado(linha);
}

function atualizarContadorProdutos() {
  contadorProdutos.textContent = `· ${emEdicao.bebidas.length}`;
}

function desenharProdutos() {
  tabelaProdutos.innerHTML = emEdicao.bebidas.map(montarLinhaProduto).join("");
  recalcularColunaAtacado();
  filtrarProdutos();
  atualizarContadorProdutos();
}

function filtrarProdutos() {
  const busca = semAcento(campoBuscaProduto.value.trim());
  for (const linha of tabelaProdutos.rows) {
    const bebida = acharProduto(linha.dataset.sku);
    linha.hidden = !!busca && !semAcento(`${bebida.marca} ${bebida.nome} ${bebida.vol}`).includes(busca);
  }
}

function editarProduto(campo) {
  const linha = campo.closest("tr");
  const nomeDoCampo = campo.dataset.campo;
  if (!linha || !nomeDoCampo) return;
  const bebida = acharProduto(linha.dataset.sku);
  const chave = `${bebida.sku}.${nomeDoCampo}`;

  if (campo.type === "checkbox") {
    bebida[nomeDoCampo] = campo.checked;
  } else if (campo.tagName === "SELECT") {
    bebida[nomeDoCampo] = campo.value;
  } else {
    const tipo = campo.dataset.tipo;
    const valor = tipo ? TIPOS_DE_CAMPO[tipo].ler(campo.value) : campo.value.trim();
    const erro = VALIDACAO_DO_PRODUTO[nomeDoCampo]?.(valor, bebida) || "";
    marcarErro(campo, chave, erro);

    if (!erro) {
      if (nomeDoCampo === "caixa") {
        if (valor === null) delete emEdicao.caixaExcecao[bebida.sku];
        else emEdicao.caixaExcecao[bebida.sku] = valor;
      } else if (nomeDoCampo === "casco") {
        bebida.retornavel = valor !== null;
        if (valor === null) delete bebida.casco;
        else bebida.casco = valor;
      } else {
        bebida[nomeDoCampo] = valor;
      }
    }

    if (nomeDoCampo === "preco") {
      const campoPromo = linha.querySelector('[data-campo="promo"]');
      const promo = TIPOS_DE_CAMPO.brl.ler(campoPromo.value);
      const erroDaPromo = VALIDACAO_DO_PRODUTO.promo(promo, bebida);
      marcarErro(campoPromo, `${bebida.sku}.promo`, erroDaPromo);
      if (!erroDaPromo) bebida.promo = promo;
    }
  }

  calcularColunaAtacado(linha);
  registrarMudanca();
}

function removerProduto(evento) {
  const botao = evento.target.closest('[data-acao="tirar"]');
  if (!botao) return;
  const linha = botao.closest("tr");
  const bebida = acharProduto(linha.dataset.sku);
  if (emEdicao.bebidas.length === 1) {
    mostrarToast("A loja precisa de ao menos um produto.");
    return;
  }
  if (!confirm(`Remover ${bebida.marca} ${bebida.nome} das duas lojas?`)) return;

  emEdicao.bebidas = emEdicao.bebidas.filter(produto => produto !== bebida);
  delete emEdicao.caixaExcecao[bebida.sku];
  esquecerErrosQueComecamCom(bebida.sku + ".");
  linha.remove();
  atualizarContadorProdutos();
  registrarMudanca();
  mostrarToast(`${bebida.marca} ${bebida.nome} removido do rascunho`);
}

function adicionarProduto() {
  const sku = "novo-" + Date.now().toString(36);
  const novo = {
    sku, marca: "", nome: "", cat: CATEGORIAS[0].id, foto: "", forma: "can",
    vol: "", teor: "—", preco: null, promo: null, gelada: true,
    retornavel: false, alcoolica: true, estoque: 0
  };
  emEdicao.bebidas.push(novo);
  tabelaProdutos.insertAdjacentHTML("beforeend", montarLinhaProduto(novo));
  const linha = tabelaProdutos.rows[tabelaProdutos.rows.length - 1];
  calcularColunaAtacado(linha);
  campoBuscaProduto.value = "";
  filtrarProdutos();
  atualizarContadorProdutos();

  for (const nomeDoCampo of ["marca", "nome", "vol", "preco"]) {
    const campo = linha.querySelector(`[data-campo="${nomeDoCampo}"]`);
    const valorVazio = nomeDoCampo === "preco" ? null : "";
    marcarErro(campo, `${sku}.${nomeDoCampo}`, VALIDACAO_DO_PRODUTO[nomeDoCampo](valorVazio));
  }
  registrarMudanca();
  linha.querySelector('[data-campo="marca"]').focus();
  linha.scrollIntoView({block: "nearest"});
}


function desenharRegras() {
  for (const campo of document.querySelectorAll("input[data-regra]")) {
    campo.value = TIPOS_DE_CAMPO[campo.dataset.tipo].mostrar(lerCaminho(emEdicao, campo.dataset.regra));
    marcarErro(campo, campo.dataset.regra, "");
  }
  desenharFaixas();
}

function editarRegra(evento) {
  const campo = evento.target;
  if (!campo.matches("input[data-regra]")) return;
  const chave = campo.dataset.regra;
  const valor = TIPOS_DE_CAMPO[campo.dataset.tipo].ler(campo.value);
  const erro = VALIDACAO_DOS_CAMPOS[chave]?.(valor) || "";
  marcarErro(campo, chave, erro);
  if (!erro) gravarCaminho(emEdicao, chave, valor);
  if (chave === "atacado.desconto" || chave.startsWith("caixaPadrao.")) recalcularColunaAtacado();
  registrarMudanca();
}

function desenharFaixas() {
  const faixas = emEdicao.atacado.faixas.map((faixa, posicao) => `
    <div class="adm-faixa" data-i="${posicao}">
      <label class="adm-campo"><span>A partir de (caixas)</span>
        <input data-faixa="cx" inputmode="numeric" value="${faixa.cx}"></label>
      <label class="adm-campo"><span>Desconto extra (%)</span>
        <input data-faixa="extra" inputmode="decimal" value="${TIPOS_DE_CAMPO.pct.mostrar(faixa.extra)}"></label>
      <button type="button" class="adm-tirar" data-acao="tirar-faixa" aria-label="Remover a faixa de ${faixa.cx} caixas">Remover</button>
    </div>`).join("");
  listaFaixas.innerHTML = faixas || `<p class="adm-dica">Sem faixas: o atacado cobra só o desconto de revenda.</p>`;
}

function editarFaixa(evento) {
  const campo = evento.target;
  const posicao = Number(campo.closest(".adm-faixa").dataset.i);
  const qualCampo = campo.dataset.faixa;
  const faixa = emEdicao.atacado.faixas[posicao];
  const chave = `faixa.${posicao}.${qualCampo}`;

  if (qualCampo === "cx") {
    const caixas = TIPOS_DE_CAMPO.int.ler(campo.value);
    const repetida = emEdicao.atacado.faixas.some((outra, outraPosicao) => outraPosicao !== posicao && outra.cx === caixas);
    let erro = "";
    if (caixas === null || !ehInteiro(caixas) || caixas < 1) erro = "Inteiro, 1 ou mais.";
    else if (repetida) erro = "Já existe uma faixa com esse número.";
    marcarErro(campo, chave, erro);
    if (!erro) faixa.cx = caixas;
  } else {
    const extra = TIPOS_DE_CAMPO.pct.ler(campo.value);
    const erro = extra === null || !(extra > 0) || extra > 0.5 ? "Entre 0,1% e 50%." : "";
    marcarErro(campo, chave, erro);
    if (!erro) faixa.extra = extra;
  }
  registrarMudanca();
}

function removerFaixa(evento) {
  if (!evento.target.closest('[data-acao="tirar-faixa"]')) return;
  const posicao = Number(evento.target.closest(".adm-faixa").dataset.i);
  emEdicao.atacado.faixas.splice(posicao, 1);
  esquecerErrosQueComecamCom("faixa.");
  desenharFaixas();
  registrarMudanca();
}

function adicionarFaixa() {
  const maiorFaixa = Math.max(0, ...emEdicao.atacado.faixas.map(faixa => faixa.cx));
  emEdicao.atacado.faixas.push({cx: maiorFaixa + 10, extra: 0.01});
  desenharFaixas();
  registrarMudanca();
  listaFaixas.lastElementChild.querySelector("input").focus();
}


function criarCanvas(largura, altura) {
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  return canvas;
}

function conferirFoto(canvas, forma) {
  const largura = canvas.width;
  const altura = canvas.height;
  const pixels = canvas.getContext("2d").getImageData(0, 0, largura, altura).data;
  const temProduto = (x, y) => pixels[(y * largura + x) * 4 + 3] > 128;

  const bordaEsquerda = [];
  const bordaDireita = [];
  for (let y = 0; y < altura; y++) {
    let esquerda = -1;
    let direita = -1;
    for (let x = 0; x < largura; x++) {
      if (temProduto(x, y)) {
        if (esquerda < 0) esquerda = x;
        direita = x;
      }
    }
    bordaEsquerda.push(esquerda < 0 ? NaN : esquerda);
    bordaDireita.push(direita < 0 ? NaN : direita);
  }

  const problemas = [];
  const inicio = Math.floor(altura * .4);
  const fim = Math.floor(altura * .9);
  let degraus = 0;
  for (let y = inicio + 2; y < fim; y++) {
    for (const borda of [bordaEsquerda, bordaDireita]) {
      const curva = borda[y] - 2 * borda[y - 1] + borda[y - 2];
      if (Math.abs(curva) > 2) degraus++;
    }
  }
  if (degraus > 0) problemas.push(`Contorno serrilhado (${degraus} degraus): o recorte mordeu o produto.`);

  const linhasComProduto = [];
  const centros = [];
  bordaEsquerda.forEach((esquerda, y) => {
    if (!Number.isNaN(esquerda)) {
      linhasComProduto.push(y);
      centros.push((esquerda + bordaDireita[y]) / 2);
    }
  });
  const quantidade = linhasComProduto.length;
  const mediaDasLinhas = linhasComProduto.reduce((soma, valor) => soma + valor, 0) / quantidade;
  const mediaDosCentros = centros.reduce((soma, valor) => soma + valor, 0) / quantidade;
  let numerador = 0;
  let denominador = 0;
  for (let i = 0; i < quantidade; i++) {
    numerador += (linhasComProduto[i] - mediaDasLinhas) * (centros[i] - mediaDosCentros);
    denominador += (linhasComProduto[i] - mediaDasLinhas) ** 2;
  }
  const inclinacao = denominador ? numerador / denominador * quantidade : 0;
  if (Math.abs(inclinacao) > 4) {
    problemas.push(`Produto inclinado (${inclinacao.toFixed(1)} px): a foto precisa estar em pé e de frente.`);
  }

  if (forma === "can") {
    const larguraMediana = (de, ate) => {
      const larguras = [];
      for (let y = Math.floor(altura * de); y < Math.floor(altura * ate); y++) {
        if (!Number.isNaN(bordaEsquerda[y])) larguras.push(bordaDireita[y] - bordaEsquerda[y]);
      }
      larguras.sort((primeira, segunda) => primeira - segunda);
      return larguras[Math.floor(larguras.length / 2)];
    };
    const razao = larguraMediana(.45, .5) / larguraMediana(.85, .9);
    if (!(razao >= .98 && razao <= 1.02)) {
      problemas.push(`Lata em trapézio (razão ${razao.toFixed(3)}): foto de lente grande-angular ou de cima.`);
    }
  }
  return problemas;
}

function redimensionar(original, novaAltura) {
  const novaLargura = Math.round(original.width * novaAltura / original.height);
  const canvas = criarCanvas(novaLargura, novaAltura);
  const contexto = canvas.getContext("2d");
  contexto.imageSmoothingQuality = "high";
  contexto.drawImage(original, 0, 0, novaLargura, novaAltura);
  return canvas;
}

async function processarFoto(arquivo, forma) {
  const problemas = [];
  let imagem;
  try {
    imagem = await createImageBitmap(arquivo);
  } catch {
    return {problemas: ["Não deu para abrir esse arquivo como imagem. Use PNG com fundo transparente."]};
  }

  const original = criarCanvas(imagem.width, imagem.height);
  const contexto = original.getContext("2d");
  contexto.drawImage(imagem, 0, 0);
  const dadosDaImagem = contexto.getImageData(0, 0, original.width, original.height);
  const pixels = dadosDaImagem.data;

  let transparentes = 0;
  let menorX = original.width;
  let menorY = original.height;
  let maiorX = -1;
  let maiorY = -1;
  const totalDePixels = pixels.length / 4;
  for (let i = 0; i < totalDePixels; i++) {
    if (pixels[i * 4 + 3] <= 16) {
      pixels[i * 4 + 3] = 0;
      transparentes++;
    }
    if (pixels[i * 4 + 3] > 64) {
      const x = i % original.width;
      const y = Math.floor(i / original.width);
      if (x < menorX) menorX = x;
      if (x > maiorX) maiorX = x;
      if (y < menorY) menorY = y;
      if (y > maiorY) maiorY = y;
    }
  }

  if (transparentes / (pixels.length / 4) < 0.02) {
    return {problemas: ["A foto não tem fundo transparente. Recorte o produto (Photoshop, remove.bg) e salve em PNG."]};
  }
  if (maiorX < 0) return {problemas: ["Não há produto visível nessa imagem."]};

  contexto.putImageData(dadosDaImagem, 0, 0);
  const larguraDoProduto = maiorX - menorX + 1;
  const alturaDoProduto = maiorY - menorY + 1;
  if (alturaDoProduto < 400) {
    problemas.push(`Foto pequena demais: o produto tem ${alturaDoProduto} px de altura e precisa de pelo menos 400.`);
  }

  const ALTURA_MESTRE = 600;
  const folga = Math.round(ALTURA_MESTRE * 0.02);
  const larguraMestre = Math.max(1, Math.round(larguraDoProduto * ALTURA_MESTRE / alturaDoProduto));
  const mestre = criarCanvas(larguraMestre + 2 * folga, ALTURA_MESTRE + 2 * folga);
  const contextoMestre = mestre.getContext("2d");
  contextoMestre.imageSmoothingQuality = "high";
  contextoMestre.drawImage(original, menorX, menorY, larguraDoProduto, alturaDoProduto, folga, folga, larguraMestre, ALTURA_MESTRE);

  const foto400 = redimensionar(mestre, 400);
  const foto200 = redimensionar(mestre, 200);
  problemas.push(...conferirFoto(foto400, forma));

  const d400 = foto400.toDataURL("image/webp", 0.82);
  const d200 = foto200.toDataURL("image/webp", 0.82);
  if (!d400.startsWith("data:image/webp")) {
    problemas.push("Este navegador não gera WebP. Suba a foto pelo Chrome ou pelo Edge.");
  }
  return {problemas, d400, d200};
}

function escolherFoto(evento) {
  const botao = evento.target.closest('[data-acao="foto"]');
  if (!botao) return;
  skuDaFoto = botao.closest("tr").dataset.sku;
  seletorDeFoto.value = "";
  seletorDeFoto.click();
}

async function fotoEscolhida() {
  const arquivo = seletorDeFoto.files[0];
  const bebida = acharProduto(skuDaFoto);
  if (!arquivo || !bebida) return;

  tituloFoto.textContent = `Foto de ${bebida.marca || "produto novo"} ${bebida.nome}`.trim();
  resultadoFoto.innerHTML = "Processando…";
  previaFoto.innerHTML = "";
  botaoUsarFoto.disabled = true;
  janelaFoto.showModal();

  const resultado = await processarFoto(arquivo, bebida.forma);
  fotoProcessada = resultado.problemas.length ? null : resultado;
  if (resultado.d400) {
    previaFoto.innerHTML = `<img src="${resultado.d400}" alt="Prévia sobre fundo escuro"><img src="${resultado.d400}" alt="Prévia sobre fundo claro">`;
  }
  resultadoFoto.className = "adm-foto-res " + (resultado.problemas.length ? "bad" : "ok");
  if (resultado.problemas.length) {
    resultadoFoto.innerHTML = `<b>Não entra no padrão:</b><ul>${resultado.problemas.map(problema => `<li>${escaparHtml(problema)}</li>`).join("")}</ul>`;
  } else {
    resultadoFoto.innerHTML = "<b>No padrão.</b> Altura, folga e contorno iguais aos das outras fotos.";
  }
  botaoUsarFoto.disabled = !fotoProcessada;
}

function usarFoto() {
  const bebida = acharProduto(skuDaFoto);
  if (!bebida || !fotoProcessada) return;
  const nomeBase = semAcento(`${bebida.marca} ${bebida.nome}`).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "produto";
  const nomeDaFoto = `${nomeBase}-${Date.now().toString(36)}`;
  emEdicao.fotosNovas = {...(emEdicao.fotosNovas || {}), [nomeDaFoto]: {200: fotoProcessada.d200, 400: fotoProcessada.d400}};
  bebida.foto = nomeDaFoto;
  janelaFoto.close();
  desenharProdutos();
  registrarMudanca();
  mostrarToast("Foto no rascunho. Ela vai para o site junto com a próxima publicação.");
}


function decodificarBase64(textoBase64) {
  const binario = atob(textoBase64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binario, caractere => caractere.charCodeAt(0)));
}

function lerAjustesDoArquivo(conteudo) {
  const encontrado = conteudo.match(/const AJUSTES_PUBLICADOS = ([\s\S]*?);\s*$/);
  if (!encontrado) throw new Error("formato");
  return JSON.parse(encontrado[1]);
}

async function carregarHistorico() {
  mensagemHistorico.className = "adm-gh-msg";
  mensagemHistorico.textContent = "Carregando…";
  botaoCarregarHistorico.disabled = true;
  try {
    const resposta = await chamarGitHub(`/commits?path=${encodeURIComponent(GITHUB.caminho)}&sha=${GITHUB.ramo}&per_page=15`);
    if (!resposta.ok) throw new Error(explicarErroGitHub(resposta.status));
    const commits = await resposta.json();
    const itens = commits.map(commit => {
      const quando = new Date(commit.commit.author.date).toLocaleString("pt-BR", {dateStyle: "short", timeStyle: "short"});
      return `<li><div><b>${escaparHtml(quando)}</b> · ${escaparHtml(commit.commit.message.split("\n")[0])}<small>${escaparHtml(commit.author?.login || commit.commit.author.name)} · ${commit.sha.slice(0, 7)}</small></div>
        <button type="button" class="btn btn-ghost adm-mini" data-versao="${commit.sha}" data-quando="${escaparHtml(quando)}">Abrir no rascunho</button></li>`;
    });
    listaHistorico.innerHTML = itens.join("") + `<li><div><b>Versão original</b> · o catálogo como está no dados.js, sem nada publicado pelo painel</div>
        <button type="button" class="btn btn-ghost adm-mini" data-versao="base" data-quando="original">Abrir no rascunho</button></li>`;
    mensagemHistorico.textContent = commits.length ? "" : "Nenhuma publicação pelo painel ainda.";
  } catch (erro) {
    mensagemHistorico.className = "adm-gh-msg bad";
    mensagemHistorico.textContent = erro instanceof TypeError ? "Sem conexão com o GitHub." : erro.message;
  } finally {
    botaoCarregarHistorico.disabled = false;
  }
}

async function abrirVersaoNoRascunho(evento) {
  const botao = evento.target.closest("[data-versao]");
  if (!botao) return;
  if (contarAlteracoes() && !confirm("Isto troca o rascunho atual pela versão escolhida. Continuar?")) return;

  let versao;
  try {
    if (botao.dataset.versao === "base") {
      versao = ESTADO_BASE;
    } else {
      const resposta = await chamarGitHub(`/contents/${GITHUB.caminho}?ref=${botao.dataset.versao}`);
      if (!resposta.ok) throw new Error(explicarErroGitHub(resposta.status));
      const arquivo = await resposta.json();
      versao = lerAjustesDoArquivo(decodificarBase64(arquivo.content)) || ESTADO_BASE;
    }
  } catch (erro) {
    mensagemHistorico.className = "adm-gh-msg bad";
    if (erro.message === "formato") {
      mensagemHistorico.textContent = "Essa versão do arquivo não foi gerada pelo painel e não dá para abrir.";
    } else {
      mensagemHistorico.textContent = erro.message;
    }
    return;
  }

  aplicarAjustes(PUBLICADO);
  aplicarAjustes(versao);
  emEdicao = estadoAtual();
  emEdicao.fotosNovas = {};
  camposComErro.clear();
  desenharTudo();
  mostrarToast(`Versão ${botao.dataset.quando} aberta no rascunho. Confira e publique.`);
}


function desenharHorario() {
  gradeHorario.innerHTML = ORDEM_DOS_DIAS.map(dia => {
    const turno = emEdicao.horario.dias[dia];
    const nome = DIAS_NOME[dia][0].toUpperCase() + DIAS_NOME[dia].slice(1);
    return `<div class="adm-dia" data-dia="${dia}">
      <span class="adm-dia-nome">${nome}</span>
      <label class="adm-dia-fechado"><input type="checkbox" data-h="fechado"${turno ? "" : " checked"}> Fechado</label>
      <label><span class="so-leitor">${nome}, abre</span><input type="time" data-h="abre" value="${turno ? turno[0] : "10:00"}"${turno ? "" : " disabled"}></label>
      <span aria-hidden="true">→</span>
      <label><span class="so-leitor">${nome}, fecha</span><input type="time" data-h="fecha" value="${turno ? turno[1] : "03:00"}"${turno ? "" : " disabled"}></label>
    </div>`;
  }).join("");
}

function editarHorario(evento) {
  const linha = evento.target.closest(".adm-dia");
  if (!linha) return;
  const dia = Number(linha.dataset.dia);
  const fechado = linha.querySelector('[data-h="fechado"]').checked;
  const campoAbre = linha.querySelector('[data-h="abre"]');
  const campoFecha = linha.querySelector('[data-h="fecha"]');
  campoAbre.disabled = campoFecha.disabled = fechado;
  const valido = fechado || (FORMATO_HORA.test(campoAbre.value) && FORMATO_HORA.test(campoFecha.value));
  marcarErro(campoFecha, `horario.${dia}`, valido ? "" : "Hora inválida.");
  if (valido) emEdicao.horario.dias[dia] = fechado ? null : [campoAbre.value, campoFecha.value];
  registrarMudanca();
}


function desenharEstatistica() {
  seletorEstatistica.value = emEdicao.estatistica.tipo;
  campoIdEstatistica.value = emEdicao.estatistica.id;
  ajustarCampoEstatistica();
}

function ajustarCampoEstatistica() {
  const tipo = seletorEstatistica.value;
  blocoIdEstatistica.hidden = !tipo;
  rotuloIdEstatistica.textContent = tipo === "ga4" ? "ID de medição (G-XXXXXXX)" : "Domínio cadastrado no Plausible";
  campoIdEstatistica.placeholder = tipo === "ga4" ? "G-ABC123XYZ" : "costamaiavitor.github.io";
}

function editarEstatistica() {
  const tipo = seletorEstatistica.value;
  const id = campoIdEstatistica.value.trim();
  let erro = "";
  if (tipo === "ga4") {
    erro = /^G-[A-Z0-9]{4,14}$/.test(id) ? "" : "O ID do GA4 começa com G-.";
  } else if (tipo) {
    erro = /^[a-z0-9.-]{3,120}$/.test(id) ? "" : "Só o domínio, sem https://.";
  }
  marcarErro(campoIdEstatistica, "estatistica", erro);
  if (!erro) emEdicao.estatistica = tipo ? {tipo, id} : {tipo: "", id: ""};
  ajustarCampoEstatistica();
  registrarMudanca();
}


function valorPublicadoDoProduto(produto, campo, caixaExcecao) {
  if (campo === "caixa") return caixaExcecao[produto.sku] ?? null;
  if (campo === "casco") return produto.retornavel ? produto.casco : null;
  return produto[campo] ?? null;
}

function contarAlteracoes() {
  let alteracoes = 0;
  const produtosPublicados = new Map(PUBLICADO.bebidas.map(bebida => [bebida.sku, bebida]));
  const skusEmEdicao = new Set(emEdicao.bebidas.map(bebida => bebida.sku));

  for (const bebida of emEdicao.bebidas) {
    const publicado = produtosPublicados.get(bebida.sku);
    const linha = tabelaProdutos.querySelector(`tr[data-sku="${CSS.escape(bebida.sku)}"]`);
    linha?.classList.toggle("nova", !publicado);
    if (!publicado) {
      alteracoes++;
      continue;
    }
    for (const campo of [...CAMPOS_DO_PRODUTO, "caixa"]) {
      const antes = valorPublicadoDoProduto(publicado, campo, PUBLICADO.caixaExcecao);
      const agora = valorPublicadoDoProduto(bebida, campo, emEdicao.caixaExcecao);
      const mudou = antes !== agora;
      if (mudou) alteracoes++;
      linha?.querySelector(`[data-campo="${campo}"]`)?.classList.toggle("mudou", mudou);
    }
  }
  for (const sku of produtosPublicados.keys()) {
    if (!skusEmEdicao.has(sku)) alteracoes++;
  }

  for (const campo of document.querySelectorAll("input[data-regra]")) {
    const mudou = lerCaminho(emEdicao, campo.dataset.regra) !== lerCaminho(PUBLICADO, campo.dataset.regra);
    campo.classList.toggle("mudou", mudou);
    if (mudou) alteracoes++;
  }

  if (JSON.stringify(emEdicao.atacado.faixas) !== JSON.stringify(PUBLICADO.atacado.faixas)) alteracoes++;

  for (const dia of ORDEM_DOS_DIAS) {
    const mudou = JSON.stringify(emEdicao.horario.dias[dia]) !== JSON.stringify(PUBLICADO.horario.dias[dia]);
    document.querySelector(`.adm-dia[data-dia="${dia}"]`)?.classList.toggle("mudou", mudou);
    if (mudou) alteracoes++;
  }

  const estatisticaMudou = JSON.stringify(emEdicao.estatistica) !== JSON.stringify(PUBLICADO.estatistica);
  seletorEstatistica.classList.toggle("mudou", estatisticaMudou);
  if (estatisticaMudou) alteracoes++;

  return alteracoes;
}

function mostrarSituacao(tipo, texto) {
  situacaoDoPainel.className = "adm-estado" + (tipo ? " " + tipo : "");
  situacaoDoPainel.textContent = texto;
}

function salvarRascunho(alteracoes) {
  if (alteracoes) {
    emEdicao.atacado.faixas.sort((primeira, segunda) => primeira.cx - segunda.cx);
    for (const foto of Object.keys(emEdicao.fotosNovas || {})) {
      if (!emEdicao.bebidas.some(bebida => bebida.foto === foto)) delete emEdicao.fotosNovas[foto];
    }
    if (!RASCUNHO.gravar(emEdicao)) mostrarToast("O navegador não deixou salvar o rascunho.");
  } else {
    RASCUNHO.limpar();
  }
}

function registrarMudanca() {
  const alteracoes = contarAlteracoes();
  const ultimoEnvio = ULTIMO_ENVIO.ler();
  const jaFoiEnviado = !!alteracoes && !camposComErro.size && ultimoEnvio?.retrato === textoCanonico(retratoParaPublicar(emEdicao));

  if (camposComErro.size) {
    const campos = camposComErro.size === 1 ? "campo com erro" : "campos com erro";
    mostrarSituacao("bad", `${camposComErro.size} ${campos} · rascunho não salvo até corrigir`);
  } else if (jaFoiEnviado) {
    const hora = new Date(ultimoEnvio.em).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"});
    mostrarSituacao("ok", `Publicado às ${hora} · o site se atualiza em um ou dois minutos`);
  } else if (alteracoes) {
    mostrarSituacao("mudou", `Rascunho · ${alteracoes} ${alteracoes === 1 ? "alteração" : "alterações"} · só neste navegador`);
  } else {
    mostrarSituacao("", "Sem alterações · igual ao que está no ar");
  }

  botaoPublicar.disabled = publicando || !!camposComErro.size || !alteracoes || jaFoiEnviado;
  botaoDescartar.disabled = !alteracoes && !camposComErro.size;

  clearTimeout(esperaParaSalvar);
  if (camposComErro.size) return;
  esperaParaSalvar = setTimeout(() => salvarRascunho(alteracoes), 250);
}

function descartarRascunho() {
  if (!confirm("Descartar o rascunho e voltar ao que está no ar?")) return;
  RASCUNHO.limpar();
  emEdicao = structuredClone(PUBLICADO);
  camposComErro.clear();
  desenharTudo();
  mostrarToast("Rascunho descartado");
}


function retratoParaPublicar(ajustes) {
  const {fotosNovas, ...resto} = ajustes;
  return {
    ...structuredClone(resto),
    bebidas: ajustes.bebidas.map(produtoDe).filter(Boolean),
    atacado: {...structuredClone(resto.atacado), faixas: [...resto.atacado.faixas].sort((primeira, segunda) => primeira.cx - segunda.cx)}
  };
}

function textoCanonico(valor) {
  if (Array.isArray(valor)) return `[${valor.map(textoCanonico).join(",")}]`;
  if (valor && typeof valor === "object") {
    const chaves = Object.keys(valor).sort().filter(chave => valor[chave] !== undefined);
    return `{${chaves.map(chave => `${JSON.stringify(chave)}:${textoCanonico(valor[chave])}`).join(",")}}`;
  }
  return JSON.stringify(valor);
}

function montarArquivoAjustes() {
  const quando = new Date().toLocaleString("pt-BR", {dateStyle: "short", timeStyle: "short"});
  return `/* ==========================================================================
   ZERO GRAU · ajustes publicados

   Gerado pelo painel (admin.html) em ${quando}. Não edite à mão: publique
   pelo painel, ou troque este arquivo pelo que ele baixar.

   É o retrato inteiro do que o painel edita — produtos, regras do varejo e
   do atacado — e substitui esses trechos de js/dados.js.
   ========================================================================== */
const AJUSTES_PUBLICADOS = ${JSON.stringify(retratoParaPublicar(emEdicao), null, 2)};
`;
}

function baixarArquivo(conteudo) {
  const blob = new Blob([conteudo], {type: "text/javascript"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ajustes.js";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}


const GITHUB = {dono: "costamaiavitor", repo: "Site-Zero-Grau", ramo: "main", caminho: "frontend/js/ajustes.js"};
const ENDERECO_API_GITHUB = `https://api.github.com/repos/${GITHUB.dono}/${GITHUB.repo}`;

const CHAVE_GITHUB = {
  ler() {
    try {
      return localStorage.getItem("zg-admin-github") || "";
    } catch {
      return "";
    }
  },
  gravar(chave) {
    try {
      localStorage.setItem("zg-admin-github", chave);
      return true;
    } catch {
      return false;
    }
  },
  limpar() {
    try {
      localStorage.removeItem("zg-admin-github");
    } catch {}
  }
};

const ULTIMO_ENVIO = {
  ler() {
    try {
      return JSON.parse(localStorage.getItem("zg-admin-enviado") || "null");
    } catch {
      return null;
    }
  },
  gravar(envio) {
    try {
      localStorage.setItem("zg-admin-enviado", JSON.stringify(envio));
    } catch {}
  },
  limpar() {
    try {
      localStorage.removeItem("zg-admin-enviado");
    } catch {}
  }
};

if (ULTIMO_ENVIO.ler()?.retrato === textoCanonico(retratoParaPublicar(PUBLICADO))) ULTIMO_ENVIO.limpar();

function chamarGitHub(caminho, {metodo = "GET", corpo, chave = CHAVE_GITHUB.ler()} = {}) {
  const cabecalhos = {"Accept": "application/vnd.github+json"};
  if (chave) cabecalhos["Authorization"] = `Bearer ${chave}`;
  cabecalhos["X-GitHub-Api-Version"] = "2022-11-28";
  if (corpo) cabecalhos["Content-Type"] = "application/json";

  return fetch(ENDERECO_API_GITHUB + caminho, {
    method: metodo,
    headers: cabecalhos,
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: "no-store"
  });
}

function explicarErroGitHub(status) {
  if (status === 401) return "O GitHub recusou a chave: confira se foi colada inteira, ou se venceu.";
  if (status === 403 || status === 404) {
    return `A chave não tem permissão para gravar em ${GITHUB.repo}. Confira o repositório escolhido e "Contents: Read and write".`;
  }
  if (status === 409 || status === 422) return "O arquivo mudou no GitHub enquanto você publicava. Tente de novo.";
  return `O GitHub respondeu com erro ${status}. Tente de novo em instantes.`;
}

function paraBase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

async function gravarArquivoNoGitHub(caminho, conteudoBase64, mensagem) {
  const endereco = `/contents/${caminho}`;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const atual = await chamarGitHub(`${endereco}?ref=${GITHUB.ramo}`);
    if (!atual.ok && atual.status !== 404) throw new Error(explicarErroGitHub(atual.status));
    const sha = atual.ok ? (await atual.json()).sha : undefined;

    const corpo = {message: mensagem, content: conteudoBase64, branch: GITHUB.ramo};
    if (sha) corpo.sha = sha;
    const resposta = await chamarGitHub(endereco, {metodo: "PUT", corpo});
    if (resposta.ok) return (await resposta.json()).commit;
    if ((resposta.status === 409 || resposta.status === 422) && tentativa === 0) continue;
    throw new Error(explicarErroGitHub(resposta.status));
  }
}

async function publicarAjustesNoGitHub(conteudo, alteracoes) {
  const mensagem = `Painel: publica ${alteracoes} ${alteracoes === 1 ? "alteração" : "alterações"} no catálogo`;
  return gravarArquivoNoGitHub(GITHUB.caminho, paraBase64(conteudo), mensagem);
}

function fotosParaPublicar() {
  return Object.entries(emEdicao.fotosNovas || {})
    .filter(([nome]) => emEdicao.bebidas.some(bebida => bebida.foto === nome));
}

async function publicar() {
  const conteudo = montarArquivoAjustes();
  if (!CHAVE_GITHUB.ler()) {
    janelaSemChave.showModal();
    return;
  }
  const alteracoes = contarAlteracoes();
  const semArquivo = emEdicao.bebidas.filter(bebida => bebida.foto && !FOTOS_PUBLICADAS.includes(bebida.foto) && !emEdicao.fotosNovas?.[bebida.foto]);
  if (semArquivo.length) {
    mostrarSituacao("bad", `Não publicou: a foto de ${semArquivo.map(bebida => bebida.marca).join(", ")} não está disponível. Suba de novo ou escolha outra.`);
    return;
  }
  if (!confirm(`Publicar ${alteracoes} ${alteracoes === 1 ? "alteração" : "alterações"} no site, para todos os clientes?`)) return;

  publicando = true;
  botaoPublicar.disabled = true;
  botaoPublicar.textContent = "Publicando…";
  try {
    for (const [nome, foto] of fotosParaPublicar()) {
      const bebida = emEdicao.bebidas.find(produto => produto.foto === nome);
      for (const altura of [400, 200]) {
        await gravarArquivoNoGitHub(`frontend/img/${nome}-${altura}.webp`, foto[altura].split(",")[1],
          `Painel: foto de ${bebida.marca} ${bebida.nome} (${altura} px)`);
      }
    }
    await publicarAjustesNoGitHub(conteudo, alteracoes);
    ULTIMO_ENVIO.gravar({em: Date.now(), retrato: textoCanonico(retratoParaPublicar(emEdicao))});
    mostrarToast("Publicado. O site se atualiza em um ou dois minutos.");
  } catch (erro) {
    const mensagem = erro instanceof TypeError ? "Sem conexão com o GitHub. Confira a internet e tente de novo." : erro.message;
    mostrarSituacao("bad", `Não publicou: ${mensagem}`);
    mostrarToast("Não publicou — veja o aviso no topo");
    publicando = false;
    botaoPublicar.textContent = "Publicar";
    botaoPublicar.disabled = !!camposComErro.size;
    return;
  }
  publicando = false;
  botaoPublicar.textContent = "Publicar";
  registrarMudanca();
}

function baixarArquivos() {
  for (const [nome, foto] of fotosParaPublicar()) {
    for (const altura of [400, 200]) {
      const link = document.createElement("a");
      link.href = foto[altura];
      link.download = `${nome}-${altura}.webp`;
      document.body.append(link);
      link.click();
      link.remove();
    }
  }
  baixarArquivo(montarArquivoAjustes());
  avisoFotosNoDownload.hidden = !fotosParaPublicar().length;
}


function mostrarConexaoGitHub() {
  const chave = CHAVE_GITHUB.ler();
  situacaoGitHub.className = "adm-gh" + (chave ? " ok" : "");
  if (chave) {
    situacaoGitHub.textContent = `Conectado ao GitHub (chave terminada em …${chave.slice(-4)}). Publicar grava direto no site.`;
  } else {
    situacaoGitHub.textContent = "Não conectado. Publicar baixa o arquivo para você subir à mão.";
  }
  formGitHub.hidden = !!chave;
  botaoEsquecerChave.hidden = !chave;
  botaoPublicar.title = chave ? "Grava no site, para todos os clientes" : "Baixa o ajustes.js para subir no GitHub";
}

async function conectarGitHub(evento) {
  evento.preventDefault();
  const chave = campoChaveGitHub.value.trim();
  const recusar = texto => {
    mensagemGitHub.className = "adm-gh-msg bad";
    mensagemGitHub.textContent = texto;
    campoChaveGitHub.setAttribute("aria-invalid", "true");
    campoChaveGitHub.focus();
  };

  if (!chave) return recusar("Cole a chave gerada no GitHub.");
  if (!/^(github_pat_|ghp_)\w{10,}$/.test(chave)) return recusar("Isso não parece uma chave do GitHub: ela começa com github_pat_.");

  campoChaveGitHub.removeAttribute("aria-invalid");
  mensagemGitHub.className = "adm-gh-msg";
  mensagemGitHub.textContent = "Conferindo com o GitHub…";
  botaoConectar.disabled = true;
  try {
    const resposta = await chamarGitHub("", {chave});
    if (!resposta.ok) return recusar(explicarErroGitHub(resposta.status));
    if (!CHAVE_GITHUB.gravar(chave)) return recusar("O navegador não deixou guardar a chave.");
    campoChaveGitHub.value = "";
    mensagemGitHub.textContent = "";
    mostrarConexaoGitHub();
    mostrarToast("Chave conectada");
  } catch {
    recusar("Sem conexão com o GitHub. Confira a internet e tente de novo.");
  } finally {
    botaoConectar.disabled = false;
  }
}

function esquecerChave() {
  if (!confirm("Esquecer a chave neste navegador? Para publicar direto de novo, será preciso colá-la outra vez.")) return;
  CHAVE_GITHUB.limpar();
  mostrarConexaoGitHub();
  mostrarToast("Chave esquecida neste navegador");
}


function mostrarAba(abaEscolhida) {
  for (const aba of abasDoPainel) {
    const ativa = aba === abaEscolhida;
    aba.setAttribute("aria-selected", String(ativa));
    aba.tabIndex = ativa ? 0 : -1;
    document.getElementById(aba.getAttribute("aria-controls")).hidden = !ativa;
  }
}

function trocarAbaPeloTeclado(evento) {
  const posicao = abasDoPainel.indexOf(document.activeElement);
  if (posicao < 0 || !["ArrowLeft", "ArrowRight"].includes(evento.key)) return;
  const passo = evento.key === "ArrowRight" ? 1 : -1;
  const proximaAba = abasDoPainel[(posicao + passo + abasDoPainel.length) % abasDoPainel.length];
  proximaAba.focus();
  mostrarAba(proximaAba);
}

function mostrarToast(mensagem) {
  textoToast.textContent = mensagem;
  avisoToast.classList.add("show");
  clearTimeout(esperaDoToast);
  esperaDoToast = setTimeout(() => avisoToast.classList.remove("show"), 2600);
}

function desenharTudo() {
  desenharProdutos();
  desenharRegras();
  desenharHorario();
  desenharEstatistica();
  mostrarConexaoGitHub();
  registrarMudanca();
}


campoBuscaProduto.addEventListener("input", filtrarProdutos);
tabelaProdutos.addEventListener("input", evento => editarProduto(evento.target));
tabelaProdutos.addEventListener("change", evento => {
  if (evento.target.matches("select, [type=checkbox]")) editarProduto(evento.target);
});
tabelaProdutos.addEventListener("click", removerProduto);
botaoNovoProduto.addEventListener("click", adicionarProduto);

document.addEventListener("input", editarRegra);
listaFaixas.addEventListener("input", editarFaixa);
listaFaixas.addEventListener("click", removerFaixa);
botaoNovaFaixa.addEventListener("click", adicionarFaixa);

tabelaProdutos.addEventListener("click", escolherFoto);
seletorDeFoto.addEventListener("change", fotoEscolhida);
botaoUsarFoto.addEventListener("click", usarFoto);

botaoCarregarHistorico.addEventListener("click", carregarHistorico);
listaHistorico.addEventListener("click", abrirVersaoNoRascunho);

gradeHorario.addEventListener("input", editarHorario);
seletorEstatistica.addEventListener("change", editarEstatistica);
campoIdEstatistica.addEventListener("input", editarEstatistica);

botaoDescartar.addEventListener("click", descartarRascunho);
botaoPublicar.addEventListener("click", publicar);

document.getElementById("irConectar").addEventListener("click", () => {
  janelaSemChave.close();
  mostrarAba(document.getElementById("t-publicacao"));
  campoChaveGitHub.focus();
});
document.getElementById("baixarMesmo").addEventListener("click", () => {
  janelaSemChave.close();
  baixarArquivos();
  janelaPublicar.showModal();
});
botaoBaixar.addEventListener("click", baixarArquivos);

formGitHub.addEventListener("submit", conectarGitHub);
botaoEsquecerChave.addEventListener("click", esquecerChave);

for (const aba of abasDoPainel) {
  aba.addEventListener("click", () => mostrarAba(aba));
}
document.querySelector(".adm-abas").addEventListener("keydown", trocarAbaPeloTeclado);

desenharTudo();
mostrarAba(abasDoPainel[0]);
