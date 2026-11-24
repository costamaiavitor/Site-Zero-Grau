const express = require("express");
const { Loja, RegraVenda, Horario } = require("../models/relacionamentos");
const { exigirAdmin } = require("../auth");
const { rota, recusar, naoAchou, texto, numero } = require("../util");

const router = express.Router();

async function lojaPrincipal() {
  return Loja.findOne({ order: [["id", "ASC"]], include: [{ model: Horario }] });
}

router.get("/loja", rota(async (req, res) => {
  const loja = await lojaPrincipal();
  if (!loja) throw naoAchou("Loja não encontrada.");
  res.json(loja);
}));

router.put("/loja", exigirAdmin, rota(async (req, res) => {
  const loja = await lojaPrincipal();
  if (!loja) throw naoAchou("Loja não encontrada.");
  const corpo = req.body || {};
  const dados = {};
  const textos = { nome: 80, cnpj: 18, whatsapp: 20, telefone: 20, email: 160, endereco: 200, chave_pix: 77, cidade_pix: 15 };
  for (const [campo, max] of Object.entries(textos)) {
    if (campo in corpo) dados[campo] = texto(corpo[campo], { max, nome: campo });
  }
  if ("taxa_base" in corpo) dados.taxa_base = numero(corpo.taxa_base, { min: 0, max: 1000, nome: "a taxa base" });
  if ("taxa_km" in corpo) dados.taxa_km = numero(corpo.taxa_km, { min: 0, max: 1000, nome: "a taxa por km" });
  if ("raio_max_km" in corpo) dados.raio_max_km = numero(corpo.raio_max_km, { min: 0.5, max: 500, nome: "o raio máximo" });
  await loja.update(dados);
  res.json(loja);
}));

function canalValido(valor) {
  const canal = String(valor || "").toLowerCase();
  if (!["varejo", "atacado"].includes(canal)) throw recusar("Canal inválido. Os valores permitidos são 'varejo' ou 'atacado'.");
  return canal;
}

async function regraDoCanal(canal) {
  const loja = await Loja.findOne({ order: [["id", "ASC"]] });
  const [regra] = await RegraVenda.findOrCreate({
    where: { canal },
    defaults: {
      canal,
      loja_id: loja?.id ?? null,
      pedido_minimo: canal === "atacado" ? 300 : 30,
      frete_gratis_acima: canal === "atacado" ? 800 : 150,
      desconto_canal: 0,
      prazo_pagamento: canal === "atacado" ? "30 dias" : "À vista"
    }
  });
  return regra;
}

router.get("/regras/:canal", rota(async (req, res) => {
  res.json(await regraDoCanal(canalValido(req.params.canal)));
}));

router.put("/regras/:canal", exigirAdmin, rota(async (req, res) => {
  const regra = await regraDoCanal(canalValido(req.params.canal));
  const corpo = req.body || {};
  const dados = {};
  if ("pedido_minimo" in corpo) dados.pedido_minimo = numero(corpo.pedido_minimo, { min: 0, max: 1000000, nome: "o pedido mínimo" });
  if ("frete_gratis_acima" in corpo) dados.frete_gratis_acima = numero(corpo.frete_gratis_acima, { min: 0, max: 1000000, nome: "o frete grátis" });
  if ("desconto_canal" in corpo) dados.desconto_canal = numero(corpo.desconto_canal, { min: 0, max: 90, nome: "o desconto do canal" });
  if ("prazo_pagamento" in corpo) dados.prazo_pagamento = texto(corpo.prazo_pagamento, { max: 40, nome: "o prazo" });
  await regra.update(dados);
  res.json({ mensagem: `Regras do canal '${regra.canal}' atualizadas com sucesso!`, regra });
}));

module.exports = router;
