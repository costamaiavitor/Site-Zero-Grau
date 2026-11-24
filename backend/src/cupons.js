// Cupom: o do site (ajustes.js, ex.: ZEROGRAU10) ou um criado pela API em
// /api/cupons. Vale uma vez por cliente (pedidos não cancelados).
const { Op } = require("sequelize");
const { Cupom, Pedido } = require("./models/relacionamentos");
const { regrasDaLoja, arredondar } = require("./regras");
const { recusar } = require("./util");

function normalizarCodigo(codigo) {
  return String(codigo || "").trim().toUpperCase().slice(0, 50);
}

function fimDoDia(data) {
  return data ? new Date(`${data}T23:59:59-03:00`) : null;
}

// Mantém a linha do cupom do site no banco (o pedido guarda cupom_id).
async function cupomDoSite(transaction) {
  const { cupom } = regrasDaLoja().REGRAS;
  const codigo = normalizarCodigo(cupom.codigo);
  if (!codigo) return null;
  const dados = {
    codigo,
    tipo_desconto: "percentual",
    valor_desconto: arredondar(cupom.desconto * 100),
    valor_minimo_pedido: cupom.minimo || 0,
    teto: cupom.teto > 0 ? cupom.teto : null,
    data_validade: fimDoDia(cupom.validade),
    ativo: true
  };
  const existente = await Cupom.findOne({ where: { codigo }, transaction });
  if (!existente) return Cupom.create(dados, { transaction });
  const mudou = ["valor_desconto", "valor_minimo_pedido", "teto"].some(campo => Number(existente[campo] ?? 0) !== Number(dados[campo] ?? 0))
    || String(existente.data_validade?.toISOString?.() ?? "") !== String(dados.data_validade?.toISOString?.() ?? "")
    || existente.tipo_desconto !== "percentual" || !existente.ativo;
  if (mudou) await existente.update(dados, { transaction });
  return existente;
}

async function avaliarCupom(codigoRecebido, subtotal, { usuarioId = null, transaction } = {}) {
  const codigo = normalizarCodigo(codigoRecebido);
  if (!codigo) return { cupom: null, desconto: 0 };
  const doSite = codigo === normalizarCodigo(regrasDaLoja().REGRAS.cupom.codigo);
  const cupom = doSite ? await cupomDoSite(transaction) : await Cupom.findOne({ where: { codigo }, transaction });

  if (!cupom || !cupom.ativo) throw recusar("Cupom inválido ou inexistente.");
  if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) throw recusar("Este cupom já expirou.");
  if (cupom.limite_uso !== null && cupom.limite_uso !== undefined && cupom.usos_atuais >= cupom.limite_uso) {
    throw recusar("O limite de uso deste cupom foi atingido.");
  }
  const minimo = Number(cupom.valor_minimo_pedido || 0);
  if (subtotal < minimo) throw recusar(`O cupom vale a partir de R$ ${minimo.toFixed(2).replace(".", ",")} em produtos.`);
  if (usuarioId) {
    const usos = await Pedido.count({ where: { usuario_id: usuarioId, cupom_id: cupom.id, status: { [Op.ne]: "cancelado" } }, transaction });
    if (usos > 0) throw recusar("Você já usou este cupom em outro pedido.");
  }

  const valor = Number(cupom.valor_desconto);
  let desconto = cupom.tipo_desconto === "percentual" ? subtotal * valor / 100 : valor;
  if (cupom.teto !== null && cupom.teto !== undefined && Number(cupom.teto) > 0) desconto = Math.min(desconto, Number(cupom.teto));
  desconto = Math.min(desconto, subtotal);
  return { cupom, desconto: arredondar(desconto) };
}

module.exports = { normalizarCodigo, avaliarCupom, cupomDoSite };
