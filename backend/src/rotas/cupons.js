const express = require("express");
const { Cupom } = require("../models/relacionamentos");
const { exigirAdmin } = require("../auth");
const { rota, recusar, naoAchou, conflito, numero, booleano } = require("../util");
const { normalizarCodigo, avaliarCupom } = require("../cupons");

const router = express.Router();

function dadosDoCupom(corpo = {}, novo) {
  const dados = {};
  const veio = campo => Object.prototype.hasOwnProperty.call(corpo, campo);
  if (novo || veio("codigo")) {
    const codigo = normalizarCodigo(corpo.codigo);
    if (!/^[A-Z0-9_-]{3,50}$/.test(codigo)) throw recusar("O código do cupom usa letras, números, _ ou - (3 a 50).");
    dados.codigo = codigo;
  }
  if (novo || veio("tipo_desconto")) {
    const tipo = corpo.tipo_desconto || "percentual";
    if (!["percentual", "fixo"].includes(tipo)) throw recusar("Tipo de desconto inválido (percentual ou fixo).");
    dados.tipo_desconto = tipo;
  }
  if (novo || veio("valor_desconto")) dados.valor_desconto = numero(corpo.valor_desconto, { min: 0.01, max: 100000, obrigatorio: true, nome: "o valor do desconto" });
  if (dados.tipo_desconto === "percentual" && dados.valor_desconto > 90) throw recusar("O desconto percentual vai até 90%.");
  if (veio("valor_minimo_pedido")) dados.valor_minimo_pedido = numero(corpo.valor_minimo_pedido, { min: 0, max: 1000000, nome: "o valor mínimo" }) ?? 0;
  if (veio("teto")) dados.teto = numero(corpo.teto, { min: 0.01, max: 1000000, nome: "o teto" });
  if (veio("data_validade")) {
    const data = corpo.data_validade ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(corpo.data_validade) ? `${corpo.data_validade}T23:59:59-03:00` : corpo.data_validade) : null;
    if (data && Number.isNaN(data.getTime())) throw recusar("Data de validade inválida.");
    dados.data_validade = data;
  }
  if (veio("limite_uso")) dados.limite_uso = numero(corpo.limite_uso, { min: 1, max: 1000000, inteiro: true, nome: "o limite de uso" });
  if (novo || veio("ativo")) dados.ativo = veio("ativo") ? booleano(corpo.ativo) : true;
  return dados;
}

router.get("/", exigirAdmin, rota(async (req, res) => {
  res.json(await Cupom.findAll({ order: [["id", "DESC"]] }));
}));

router.get("/:id(\\d+)", exigirAdmin, rota(async (req, res) => {
  const cupom = await Cupom.findByPk(req.params.id);
  if (!cupom) throw naoAchou("Cupom não encontrado.");
  res.json(cupom);
}));

router.post("/", exigirAdmin, rota(async (req, res) => {
  const dados = dadosDoCupom(req.body, true);
  if (await Cupom.findOne({ where: { codigo: dados.codigo } })) throw conflito("Já existe um cupom com este código.");
  res.status(201).json({ mensagem: "Cupom criado com sucesso!", cupom: await Cupom.create(dados) });
}));

router.put("/:id(\\d+)", exigirAdmin, rota(async (req, res) => {
  const cupom = await Cupom.findByPk(req.params.id);
  if (!cupom) throw naoAchou("Cupom não encontrado.");
  const dados = dadosDoCupom(req.body, false);
  if (dados.codigo && dados.codigo !== cupom.codigo && await Cupom.findOne({ where: { codigo: dados.codigo } })) {
    throw conflito("Já existe um cupom com este código.");
  }
  await cupom.update(dados);
  res.json({ mensagem: "Cupom atualizado com sucesso!", cupom });
}));

// Apagar só desativa: pedidos antigos continuam apontando para o cupom.
router.delete("/:id(\\d+)", exigirAdmin, rota(async (req, res) => {
  const cupom = await Cupom.findByPk(req.params.id);
  if (!cupom) throw naoAchou("Cupom não encontrado.");
  await cupom.update({ ativo: false });
  res.json({ mensagem: "Cupom excluído com sucesso." });
}));

router.post("/validar", rota(async (req, res) => {
  const { codigo, subtotal } = req.body || {};
  if (!codigo || subtotal === undefined) {
    return res.status(400).json({ valido: false, erro: "Informe o 'codigo' do cupom e o 'subtotal' da compra." });
  }
  try {
    const valor = numero(subtotal, { min: 0, max: 10000000, nome: "o subtotal" });
    const { cupom, desconto } = await avaliarCupom(codigo, valor);
    res.json({
      valido: true,
      mensagem: "Cupom aplicado com sucesso!",
      codigo: cupom.codigo,
      tipo_desconto: cupom.tipo_desconto,
      valor_desconto: Number(cupom.valor_desconto),
      desconto_calculado: desconto,
      subtotal_original: valor,
      total_com_desconto: Math.round((valor - desconto) * 100) / 100
    });
  } catch (erro) {
    if (erro.status) return res.status(erro.status === 404 ? 404 : 400).json({ valido: false, erro: erro.message });
    throw erro;
  }
}));

module.exports = router;
