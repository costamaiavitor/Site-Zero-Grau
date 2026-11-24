const express = require("express");
const { Op } = require("sequelize");
const { sequelize, Pedido, ItemPedido, Produto, Endereco, Pagamento, Usuario, Cupom } = require("../models/relacionamentos");
const { exigirLogin, exigirAdmin } = require("../auth");
const { rota, recusar, naoAchou, texto, numero } = require("../util");
const { regrasDaLoja, distanciaAte, arredondar, unidadesPorCaixa, precoDeVarejo, precoDaCaixaNoAtacado } = require("../regras");
const { avaliarCupom } = require("../cupons");

const router = express.Router();

const STATUS = ["recebido", "confirmado", "em_preparo", "saiu", "entregue", "cancelado"];
const FORMAS = ["pix", "cartao", "dinheiro"];
const MAX_ITENS = 60;

// ------------------------------------------------------------------ leitura

const INCLUIR = [
  { model: Usuario, attributes: ["id", "nome", "email", "documento", "tipo_documento"] },
  { model: ItemPedido, include: [{ model: Produto, attributes: ["id", "sku", "marca", "nome", "embalagem", "volume"] }] },
  { model: Endereco },
  { model: Pagamento },
  { model: Cupom, attributes: ["id", "codigo"] }
];

// Formato que o site lê (frontend-react/src/services/pedidos.js).
function pedidoParaCliente(pedido) {
  const dados = pedido.get({ plain: true });
  const { Usuario: usuario, ItemPedidos: itens = [], Endereco: endereco, Pagamento: pagamento, Cupom: cupom, ...resto } = dados;
  return {
    ...resto,
    usuario: usuario || null,
    itens: itens.map(({ Produto: produto, ...item }) => ({ ...item, produto: produto || null })),
    endereco: endereco || null,
    pagamento: pagamento || null,
    cupom: cupom?.codigo || null
  };
}

router.get("/", exigirAdmin, rota(async (req, res) => {
  const onde = {};
  if (req.query.status) onde.status = String(req.query.status);
  const limite = Math.min(Number.parseInt(req.query.limite, 10) || 300, 1000);
  const pedidos = await Pedido.findAll({ where: onde, include: INCLUIR, order: [["criado_em", "DESC"], ["id", "DESC"]], limit: limite });
  res.json(pedidos.map(pedidoParaCliente));
}));

router.get("/meus", exigirLogin, rota(async (req, res) => {
  const pedidos = await Pedido.findAll({ where: { usuario_id: req.usuario.id }, include: INCLUIR, order: [["criado_em", "DESC"], ["id", "DESC"]], limit: 200 });
  res.json(pedidos.map(pedidoParaCliente));
}));

router.get("/:id(\\d+)", exigirLogin, rota(async (req, res) => {
  const pedido = await Pedido.findByPk(req.params.id, { include: INCLUIR });
  if (!pedido || (pedido.usuario_id !== req.usuario.id && req.usuario.perfil !== "admin")) throw naoAchou("Pedido não encontrado.");
  res.json(pedidoParaCliente(pedido));
}));

// ------------------------------------------------------------- novo pedido

function itensDoCorpo(itens, unidadeEsperada) {
  if (!Array.isArray(itens) || !itens.length) throw recusar("O pedido está sem itens.");
  if (itens.length > MAX_ITENS) throw recusar(`Um pedido pode ter no máximo ${MAX_ITENS} produtos diferentes.`);
  const porSku = new Map();
  for (const item of itens) {
    const sku = String(item?.sku || "").trim();
    if (!sku) throw recusar("Item do pedido sem SKU.");
    if ((item.unidade || unidadeEsperada) !== unidadeEsperada) {
      throw recusar(unidadeEsperada === "cx" ? "No atacado a venda é por caixa." : "No varejo a venda é por unidade.");
    }
    const quantidade = numero(item.quantidade, { min: 1, max: 10000, inteiro: true, obrigatorio: true, nome: `a quantidade de ${sku}` });
    porSku.set(sku, (porSku.get(sku) || 0) + quantidade);
  }
  return porSku;
}

async function consultarCep(cep) {
  if (process.env.CONSULTAR_CEP === "false") return null;
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(4000) });
    if (!resposta.ok) return null;
    const lugar = await resposta.json();
    return lugar && !lugar.erro ? lugar : null;
  } catch {
    return null;
  }
}

const reais = valor => `R$ ${valor.toFixed(2).replace(".", ",")}`;

async function entregaDoVarejo(entrega = {}, totalProdutos, regras) {
  const modalidade = entrega.modalidade === "retirada" ? "retirada" : "entrega";
  const destinatario = texto(entrega.destinatario, { max: 120, nome: "o nome de quem recebe" });
  if (modalidade === "retirada") return { modalidade, taxa: 0, destinatario, endereco: null };

  const cep = String(entrega.cep || "").replace(/\D/g, "");
  if (cep.length !== 8) throw recusar("Informe o CEP da entrega com 8 dígitos.");
  const logradouro = texto(entrega.logradouro, { max: 160, obrigatorio: true, nome: "a rua" });
  const numeroDaCasa = texto(entrega.numero, { max: 10, obrigatorio: true, nome: "o número" });
  const informado = { localidade: entrega.cidade, bairro: entrega.bairro, uf: entrega.uf };
  const lugar = (await consultarCep(cep)) || (informado.localidade ? informado : null);
  if (!lugar) throw recusar("Não deu para conferir o CEP agora. Tente de novo em instantes.");

  const km = distanciaAte(lugar, regras);
  if (km === null || km > regras.raioMax) {
    throw recusar(`${[lugar.bairro, lugar.localidade].filter(Boolean).join(", ")} fica fora do raio de entrega de ${regras.raioMax} km. Escolha retirar no balcão.`);
  }
  const taxa = totalProdutos >= regras.REGRAS.freteGratis ? 0 : arredondar(regras.taxaBase + km * regras.taxaKm);
  return {
    modalidade,
    taxa,
    destinatario,
    endereco: {
      cep,
      logradouro,
      numero: numeroDaCasa,
      complemento: texto(entrega.complemento, { max: 80, nome: "o complemento" }),
      referencia: texto(entrega.referencia, { max: 120, nome: "a referência" }),
      bairro: texto(lugar.bairro, { max: 80 }),
      cidade: texto(lugar.localidade, { max: 80 }),
      uf: lugar.uf ? String(lugar.uf).slice(0, 2).toUpperCase() : null
    }
  };
}

function pagamentoDoVarejo(pagamento = {}, total) {
  const forma = pagamento.forma;
  if (!FORMAS.includes(forma)) throw recusar("Escolha a forma de pagamento: Pix, cartão ou dinheiro.");
  const momento = pagamento.momento === "site" ? "site" : "entrega";
  if (momento === "site" && forma !== "pix") throw recusar("Pelo site, só dá para pagar com Pix.");
  let trocoPara = null;
  if (forma === "dinheiro" && pagamento.troco_para !== null && pagamento.troco_para !== undefined && pagamento.troco_para !== "") {
    trocoPara = numero(pagamento.troco_para, { min: 0, max: 100000, nome: "o troco" });
    if (trocoPara < total) throw recusar(`O troco tem de ser para ${reais(total)} ou mais.`);
  }
  const txid = pagamento.txid ? String(pagamento.txid).replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || null : null;
  return { forma, momento, troco_para: trocoPara, txid, status: "pendente" };
}

async function baixarEstoque(produto, unidades, transaction) {
  const [mudou] = await Produto.update(
    { estoque: sequelize.literal(`estoque - ${Number(unidades)}`) },
    { where: { id: produto.id, estoque: { [Op.gte]: unidades } }, transaction }
  );
  if (!mudou) {
    const atual = await Produto.findByPk(produto.id, { transaction });
    throw recusar(`Não temos estoque suficiente de ${produto.marca} ${produto.nome} (restam ${atual?.estoque ?? 0} un.).`);
  }
}

router.post("/", exigirLogin, rota(async (req, res) => {
  const corpo = req.body || {};
  const canal = corpo.canal === "atacado" ? "atacado" : corpo.canal === "varejo" ? "varejo" : null;
  if (!canal) throw recusar("Canal do pedido inválido (varejo ou atacado).");
  if (canal === "atacado" && req.usuario.tipo_documento !== "cnpj" && req.usuario.perfil !== "admin") {
    throw recusar("O atacado é só para contas com CNPJ.");
  }
  if (canal === "atacado" && corpo.cupom) throw recusar("Cupom de desconto só vale no varejo.");

  const regras = regrasDaLoja();
  const quantidades = itensDoCorpo(corpo.itens, canal === "atacado" ? "cx" : "un");
  const produtos = await Produto.findAll({ where: { sku: [...quantidades.keys()], ativo: { [Op.ne]: false } } });
  const porSku = new Map(produtos.map(produto => [produto.sku, produto]));
  const faltando = [...quantidades.keys()].filter(sku => !porSku.has(sku));
  if (faltando.length) throw recusar(`Produto fora de venda: ${faltando.join(", ")}. Atualize a página e monte o pedido de novo.`);

  const linhas = [...quantidades].map(([sku, quantidade]) => {
    const produto = porSku.get(sku);
    const unitario = canal === "atacado" ? precoDaCaixaNoAtacado(produto, regras) : precoDeVarejo(produto);
    const unidades = canal === "atacado" ? quantidade * unidadesPorCaixa(produto, regras) : quantidade;
    if (unidades > Number(produto.estoque || 0)) {
      throw recusar(`Não temos estoque suficiente de ${produto.marca} ${produto.nome} (restam ${produto.estoque} un.).`);
    }
    return { produto, quantidade, unidades, bruto: unitario * quantidade, unitario: arredondar(unitario), subtotal: arredondar(unitario * quantidade) };
  });
  const subtotal = arredondar(linhas.reduce((soma, linha) => soma + linha.bruto, 0));
  const observacao = texto(corpo.observacao, { max: 255, nome: "a observação" });
  const situacao = regras.situacaoLoja(new Date());

  const pedidoCriado = await sequelize.transaction(async transaction => {
    let desconto = 0;
    let cupom = null;
    let taxa;
    let modalidade = "entrega";
    let destinatario = null;
    let endereco = null;
    let pagamento = null;

    if (canal === "varejo") {
      ({ cupom, desconto } = await avaliarCupom(corpo.cupom, subtotal, { usuarioId: req.usuario.id, transaction }));
      const totalProdutos = arredondar(subtotal - desconto);
      if (totalProdutos < regras.REGRAS.minimo) throw recusar(`O pedido mínimo é de ${reais(regras.REGRAS.minimo)} em produtos.`);
      const entrega = await entregaDoVarejo(corpo.entrega, totalProdutos, regras);
      ({ modalidade, taxa, destinatario } = entrega);
      if (entrega.endereco) endereco = await Endereco.create({ usuario_id: req.usuario.id, ...entrega.endereco }, { transaction });
      pagamento = pagamentoDoVarejo(corpo.pagamento, arredondar(totalProdutos + taxa));
    } else {
      const caixas = linhas.reduce((soma, linha) => soma + linha.quantidade, 0);
      desconto = arredondar(subtotal * regras.descontoDaFaixa(caixas));
      const totalProdutos = arredondar(subtotal - desconto);
      if (totalProdutos < regras.ATACADO.minimo) throw recusar(`O pedido mínimo do atacado é de ${reais(regras.ATACADO.minimo)}.`);
      taxa = totalProdutos >= regras.ATACADO.freteGratis ? 0 : arredondar(regras.taxaBase + regras.raioMax * regras.taxaKm);
      destinatario = req.usuario.nome;
    }

    const pedido = await Pedido.create({
      usuario_id: req.usuario.id,
      endereco_id: endereco?.id ?? null,
      cupom_id: cupom?.id ?? null,
      canal,
      modalidade,
      subtotal,
      desconto,
      taxa_entrega: taxa,
      total: arredondar(subtotal - desconto + taxa),
      status: "recebido",
      agendado: !situacao.aberto,
      observacao,
      destinatario,
      criado_em: new Date()
    }, { transaction });

    for (const linha of linhas) {
      await baixarEstoque(linha.produto, linha.unidades, transaction);
      await ItemPedido.create({
        pedido_id: pedido.id,
        produto_id: linha.produto.id,
        quantidade: linha.quantidade,
        unidade: canal === "atacado" ? "cx" : "un",
        preco_unitario: linha.unitario,
        subtotal: linha.subtotal
      }, { transaction });
    }
    if (pagamento) await Pagamento.create({ pedido_id: pedido.id, ...pagamento }, { transaction });
    if (cupom) await cupom.increment("usos_atuais", { by: 1, transaction });
    return pedido;
  });

  const completo = await Pedido.findByPk(pedidoCriado.id, { include: INCLUIR });
  res.status(201).json({ mensagem: "Pedido registrado na loja.", pedido: pedidoParaCliente(completo) });
}));

// ------------------------------------------------------------ painel/cliente

router.patch("/:id(\\d+)/status", exigirAdmin, rota(async (req, res) => {
  const status = String(req.body?.status || "");
  if (!STATUS.includes(status)) throw recusar(`Status inválido. Use: ${STATUS.join(", ")}.`);

  const pedido = await sequelize.transaction(async transaction => {
    const atual = await Pedido.findByPk(req.params.id, { include: [{ model: ItemPedido, include: [Produto] }, Pagamento, Cupom], transaction, lock: transaction.LOCK.UPDATE });
    if (!atual) throw naoAchou("Pedido não encontrado.");
    if (atual.status === status) return atual;
    if (atual.status === "cancelado") throw recusar("Pedido cancelado não pode mudar de status. Faça um pedido novo.");
    if (atual.status === "entregue" && status === "cancelado") throw recusar("Pedido já entregue não pode ser cancelado.");

    if (status === "cancelado") {
      // Devolve o estoque e o uso do cupom.
      for (const item of atual.ItemPedidos) {
        if (!item.Produto) continue;
        const unidades = item.unidade === "cx" ? item.quantidade * unidadesPorCaixa(item.Produto) : item.quantidade;
        await Produto.increment("estoque", { by: unidades, where: { id: item.produto_id }, transaction });
      }
      if (atual.Cupom && atual.Cupom.usos_atuais > 0) await atual.Cupom.decrement("usos_atuais", { by: 1, transaction });
    }
    if (status === "entregue" && atual.Pagamento && atual.Pagamento.status !== "pago") {
      await atual.Pagamento.update({ status: "pago", confirmado_em: new Date() }, { transaction });
    }
    await atual.update({ status }, { transaction });
    return atual;
  });

  const completo = await Pedido.findByPk(pedido.id, { include: INCLUIR });
  res.json({ mensagem: "Status atualizado com sucesso!", pedido: pedidoParaCliente(completo) });
}));

router.patch("/:id(\\d+)/agendar", exigirLogin, rota(async (req, res) => {
  const quando = new Date(req.body?.agendado_para);
  if (!req.body?.agendado_para || Number.isNaN(quando.getTime())) throw recusar("Informe a data e a hora do agendamento.");
  const agora = Date.now();
  if (quando.getTime() < agora + 15 * 60 * 1000) throw recusar("Agende com pelo menos 15 minutos de antecedência.");
  if (quando.getTime() > agora + 30 * 24 * 60 * 60 * 1000) throw recusar("Dá para agendar até 30 dias à frente.");
  if (!regrasDaLoja().situacaoLoja(quando).aberto) throw recusar("Horário fora do funcionamento da loja.");

  const pedido = await Pedido.findOne({ where: { id: req.params.id, usuario_id: req.usuario.id } });
  if (!pedido) throw naoAchou("Pedido não encontrado para este usuário.");
  if (["cancelado", "entregue"].includes(pedido.status)) throw recusar("Este pedido já foi encerrado.");
  await pedido.update({ agendado: true, agendado_para: quando });
  const completo = await Pedido.findByPk(pedido.id, { include: INCLUIR });
  res.json({ mensagem: "Pedido agendado com sucesso!", pedido: pedidoParaCliente(completo) });
}));

module.exports = router;
