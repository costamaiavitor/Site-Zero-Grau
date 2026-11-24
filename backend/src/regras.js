// Regras da loja (preços de atacado, cupom, frete, horário) lidas dos mesmos
// arquivos que o site usa: frontend/js/dados.js com os ajustes publicados pelo
// painel em frontend/js/ajustes.js. Assim o servidor calcula o pedido igual ao
// carrinho, e uma publicação do painel vale para os dois na mesma hora.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA_JS = process.env.PASTA_REGRAS || path.join(__dirname, "..", "..", "frontend", "js");
const ARQUIVOS = ["ajustes.js", "dados.js"];

const EXPORTAR = `({
  REGRAS, ATACADO, ENTREGA, HORARIO, CONTATO, PIX, CATEGORIAS, BEBIDAS,
  CAIXA_PADRAO, CAIXA_EXCECAO, FORMAS,
  taxaBase: TAXA_BASE, taxaKm: TAXA_KM, raioMax: RAIO_MAX,
  normalizarLugar, descontoCupom, cupomVencido, descontoDaFaixa, situacaoLoja
})`;

let emCache = null;

function assinatura() {
  return ARQUIVOS.map(nome => {
    try {
      const info = fs.statSync(path.join(PASTA_JS, nome));
      return `${nome}:${info.mtimeMs}:${info.size}`;
    } catch {
      return `${nome}:-`;
    }
  }).join("|");
}

function carregar() {
  const codigo = ARQUIVOS
    .filter(nome => fs.existsSync(path.join(PASTA_JS, nome)))
    .map(nome => fs.readFileSync(path.join(PASTA_JS, nome), "utf8"))
    .join("\n;\n");
  const contexto = vm.createContext({console, Intl, Date, Math, JSON, Number, String, Object, Array, Map, Set, RegExp, document: {}});
  return vm.runInContext(`${codigo}\n;${EXPORTAR}`, contexto, {timeout: 2000});
}

function regrasDaLoja() {
  const atual = assinatura();
  if (!emCache || emCache.assinatura !== atual) {
    emCache = {assinatura: atual, regras: carregar()};
  }
  return emCache.regras;
}

// Mesma conta de distanciaAte() em frontend/js/script.js.
function distanciaAte(lugar, regras = regrasDaLoja()) {
  const cidade = regras.normalizarLugar(lugar.localidade);
  if (!(cidade in regras.ENTREGA.cidades)) return null;
  const distanciaDaCidade = regras.ENTREGA.cidades[cidade];
  if (distanciaDaCidade !== null) return distanciaDaCidade;
  return regras.ENTREGA.bairros[regras.normalizarLugar(lugar.bairro)] ?? regras.ENTREGA.PADRAO_FORTALEZA;
}

function arredondar(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function unidadesPorCaixa(produto, regras = regrasDaLoja()) {
  const propria = Number.parseInt(produto.unidades_caixa, 10);
  if (propria > 0) return propria;
  return regras.CAIXA_EXCECAO[produto.sku] ?? regras.CAIXA_PADRAO[produto.embalagem] ?? 12;
}

function precoDeVarejo(produto) {
  const preco = Number(produto.preco);
  const promo = produto.preco_promo === null || produto.preco_promo === undefined ? null : Number(produto.preco_promo);
  return promo !== null && promo > 0 && promo < preco ? promo : preco;
}

function precoDaCaixaNoAtacado(produto, regras = regrasDaLoja()) {
  return Number(produto.preco) * (1 - regras.ATACADO.desconto) * unidadesPorCaixa(produto, regras);
}

module.exports = {regrasDaLoja, distanciaAte, arredondar, unidadesPorCaixa, precoDeVarejo, precoDaCaixaNoAtacado};
