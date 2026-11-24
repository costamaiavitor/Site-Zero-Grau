const express = require("express");
const multer = require("multer");
const { Op } = require("sequelize");
const { Categoria, Produto, FaixaAtacado, FotoProduto } = require("../models/relacionamentos");
const { exigirAdmin } = require("../auth");
const { rota, recusar, naoAchou, conflito, texto, numero, booleano } = require("../util");
const { regrasDaLoja, unidadesPorCaixa, precoDaCaixaNoAtacado, arredondar } = require("../regras");

const router = express.Router();

const EMBALAGENS = ["can", "bottle", "tall", "pet", "saco"];
const SKU = /^[a-z0-9][a-z0-9-]{0,59}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{0,29}$/;
const FOTO = /^([a-z0-9-]{1,120}|\/api\/produtos\/\d+\/foto(\?v=\d+)?|https:\/\/\S{1,240})$/i;

// ---------------------------------------------------------------- categorias

router.get("/categorias", rota(async (req, res) => {
  res.json(await Categoria.findAll({ order: [["id", "ASC"]] }));
}));

router.post("/categorias", exigirAdmin, rota(async (req, res) => {
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  if (!SLUG.test(slug)) throw recusar("O identificador da categoria usa só letras minúsculas, números e hífen (até 30).");
  if (await Categoria.findOne({ where: { slug } })) throw conflito("Já existe uma categoria com esse identificador.");
  const categoria = await Categoria.create({
    slug,
    nome: texto(req.body.nome, { max: 60, obrigatorio: true, nome: "o nome da categoria" }),
    detalhe: texto(req.body.detalhe, { max: 120, nome: "o detalhe" })
  });
  res.status(201).json(categoria);
}));

// ------------------------------------------------------------------ produtos

async function idDaCategoria(corpo) {
  if (corpo.categoria_id !== undefined && corpo.categoria_id !== null && corpo.categoria_id !== "") {
    const id = numero(corpo.categoria_id, { min: 1, inteiro: true, nome: "a categoria" });
    if (!(await Categoria.findByPk(id))) throw recusar("Essa categoria não existe no servidor.");
    return id;
  }
  if (corpo.cat) {
    const categoria = await Categoria.findOne({ where: { slug: String(corpo.cat) } });
    if (!categoria) throw recusar(`A categoria "${corpo.cat}" não existe no servidor.`);
    return categoria.id;
  }
  return undefined;
}

// Valida e converte o corpo vindo do painel. Em edição (parcial), só confere o
// que veio; o resto continua como está no banco.
async function dadosDoProduto(corpo = {}, atual = null) {
  const novo = !atual;
  const dados = {};
  const veio = campo => Object.prototype.hasOwnProperty.call(corpo, campo);

  const categoria = await idDaCategoria(corpo);
  if (categoria !== undefined) dados.categoria_id = categoria;
  else if (novo) throw recusar("Escolha a categoria do produto.");

  if (novo) {
    const sku = String(corpo.sku || "").trim();
    if (!SKU.test(sku)) throw recusar("O SKU usa só letras, números e hífen (até 60).");
    dados.sku = sku;
  }
  if (novo || veio("marca")) dados.marca = texto(corpo.marca, { max: 80, obrigatorio: true, nome: "a marca" });
  if (novo || veio("nome")) dados.nome = texto(corpo.nome, { max: 120, obrigatorio: true, nome: "o nome" });
  if (veio("volume")) dados.volume = texto(corpo.volume, { max: 20, nome: "o volume" });
  if (veio("teor_alcoolico")) dados.teor_alcoolico = texto(corpo.teor_alcoolico, { max: 10, nome: "o teor alcoólico" });
  if (novo || veio("embalagem")) {
    if (!EMBALAGENS.includes(corpo.embalagem)) throw recusar(`Embalagem inválida. Use: ${EMBALAGENS.join(", ")}.`);
    dados.embalagem = corpo.embalagem;
  }
  if (novo || veio("preco")) dados.preco = numero(corpo.preco, { min: 0.01, max: 100000, obrigatorio: true, nome: "o preço" });
  if (veio("preco_promo")) dados.preco_promo = numero(corpo.preco_promo, { min: 0.01, max: 100000, nome: "o preço promocional" });
  if (veio("unidades_caixa")) dados.unidades_caixa = numero(corpo.unidades_caixa, { min: 1, max: 1000, inteiro: true, nome: "as unidades por caixa" });
  if (novo || veio("estoque")) dados.estoque = numero(corpo.estoque, { min: 0, max: 1000000, inteiro: true, obrigatorio: true, nome: "o estoque" });
  for (const campo of ["gelada", "alcoolica", "retornavel"]) {
    if (novo || veio(campo)) dados[campo] = booleano(corpo[campo]);
  }
  if (veio("valor_casco")) dados.valor_casco = numero(corpo.valor_casco, { min: 0.01, max: 10000, nome: "o valor do casco" });
  if (veio("foto_url")) {
    const foto = corpo.foto_url === null || corpo.foto_url === "" ? null : String(corpo.foto_url).trim();
    if (foto !== null && !FOTO.test(foto)) throw recusar("Endereço de foto inválido.");
    dados.foto_url = foto;
  }
  if (novo) dados.ativo = veio("ativo") ? booleano(corpo.ativo) : true;
  else if (veio("ativo")) dados.ativo = booleano(corpo.ativo);

  const preco = dados.preco ?? Number(atual?.preco);
  const promo = veio("preco_promo") ? dados.preco_promo : atual?.preco_promo === null || atual?.preco_promo === undefined ? null : Number(atual.preco_promo);
  if (promo !== null && promo >= preco) throw recusar("O preço promocional tem de ser menor que o preço normal.");
  return dados;
}

router.get("/produtos", rota(async (req, res) => {
  const onde = {};
  const { cat, busca } = req.query;
  if (cat && cat !== "all") {
    const categoria = await Categoria.findOne({ where: { slug: String(cat) } });
    if (!categoria) return res.json([]);
    onde.categoria_id = categoria.id;
  }
  if (busca) {
    const termo = `%${String(busca).slice(0, 60).replace(/[\\%_]/g, letra => `\\${letra}`)}%`;
    onde[Op.or] = [{ nome: { [Op.like]: termo } }, { marca: { [Op.like]: termo } }];
  }
  res.json(await Produto.findAll({ where: onde, order: [["id", "ASC"]] }));
}));

router.get("/produtos/:sku", rota(async (req, res) => {
  const produto = await Produto.findOne({ where: { sku: req.params.sku } });
  if (!produto) throw naoAchou("Produto não encontrado.");
  res.json(produto);
}));

router.post("/produtos", exigirAdmin, rota(async (req, res) => {
  const dados = await dadosDoProduto(req.body);
  const existente = await Produto.findOne({ where: { sku: dados.sku } });
  if (existente && existente.ativo !== false) throw conflito("Já existe um produto com este SKU no banco de dados.");
  if (existente) {
    // SKU de um produto removido antes: volta com os dados novos.
    await existente.update({ ...dados, ativo: true });
    return res.status(201).json({ mensagem: "Produto cadastrado com sucesso!", produto: existente });
  }
  const produto = await Produto.create(dados);
  res.status(201).json({ mensagem: "Produto cadastrado com sucesso!", produto });
}));

router.put("/produtos/:sku", exigirAdmin, rota(async (req, res) => {
  const produto = await Produto.findOne({ where: { sku: req.params.sku } });
  if (!produto) throw naoAchou("Produto não encontrado para atualização.");
  const { sku, ...corpo } = req.body || {};
  await produto.update(await dadosDoProduto(corpo, produto));
  res.json({ mensagem: "Produto atualizado com sucesso!", produto });
}));

// Remover = desativar (RF16): o produto some da loja, mas os pedidos antigos
// continuam mostrando o que foi vendido.
router.delete("/produtos/:sku", exigirAdmin, rota(async (req, res) => {
  const produto = await Produto.findOne({ where: { sku: req.params.sku } });
  if (!produto || produto.ativo === false) throw naoAchou("Produto não encontrado para exclusão.");
  await produto.update({ ativo: false });
  res.json({ mensagem: "Produto removido com sucesso!" });
}));

// --------------------------------------------------------------------- fotos

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (req, arquivo, decidir) => {
    if (/^image\/(webp|png|jpeg|gif|avif)$/.test(arquivo.mimetype)) return decidir(null, true);
    return decidir(recusar("Envie uma imagem (WebP, PNG, JPEG, GIF ou AVIF)."));
  }
});

router.post("/produtos/:id/foto", exigirAdmin, upload.single("foto"), rota(async (req, res) => {
  const produto = await Produto.findByPk(numero(req.params.id, { min: 1, inteiro: true, nome: "o produto" }));
  if (!produto) throw naoAchou("Produto não encontrado.");
  if (!req.file) throw recusar("Nenhum arquivo de imagem foi enviado (campo \"foto\").");
  await FotoProduto.upsert({ produto_id: produto.id, tipo: req.file.mimetype, dados: req.file.buffer, atualizado_em: new Date() });
  const fotoUrl = `/api/produtos/${produto.id}/foto?v=${Date.now()}`;
  await produto.update({ foto_url: fotoUrl });
  res.json({ mensagem: "Foto do produto enviada e guardada com sucesso!", foto_url: fotoUrl, produto });
}));

router.get("/produtos/:id/foto", rota(async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const foto = Number.isInteger(id) ? await FotoProduto.findByPk(id) : null;
  if (!foto) throw naoAchou("Este produto não tem foto no servidor.");
  res.set("Content-Type", foto.tipo);
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(foto.dados);
}));

// ------------------------------------------------------- atacado por produto

router.get("/produtos/:id/faixas", rota(async (req, res) => {
  const produto = await Produto.findByPk(numero(req.params.id, { min: 1, inteiro: true, nome: "o produto" }));
  if (!produto) throw naoAchou("Produto não encontrado.");
  const faixas = await FaixaAtacado.findAll({ where: { produto_id: produto.id }, order: [["quantidade_minima", "ASC"]] });
  const unidades = unidadesPorCaixa(produto);
  res.json({
    produto_id: produto.id,
    nome: produto.nome,
    unidades_por_caixa: unidades,
    preco_unitario: Number(produto.preco),
    preco_caixa_padrao: arredondar(precoDaCaixaNoAtacado(produto)),
    faixas
  });
}));

router.post("/produtos/:id/faixas", exigirAdmin, rota(async (req, res) => {
  const produto = await Produto.findByPk(numero(req.params.id, { min: 1, inteiro: true, nome: "o produto" }));
  if (!produto) throw naoAchou("Produto não encontrado.");
  const quantidade = numero(req.body?.quantidade_minima, { min: 1, max: 100000, inteiro: true, obrigatorio: true, nome: "a quantidade mínima" });
  const desconto = numero(req.body?.desconto_percentual, { min: 0, max: 90, nome: "o desconto" }) ?? 0;
  const precoCaixa = numero(req.body?.preco_caixa, { min: 0.01, max: 1000000, nome: "o preço da caixa" });
  const base = precoDaCaixaNoAtacado(produto);
  const dados = { produto_id: produto.id, quantidade_minima: quantidade, desconto_percentual: desconto, preco_caixa: precoCaixa ?? arredondar(base * (1 - desconto / 100)) };
  const existente = await FaixaAtacado.findOne({ where: { produto_id: produto.id, quantidade_minima: quantidade } });
  const faixa = existente ? await existente.update(dados) : await FaixaAtacado.create(dados);
  res.status(existente ? 200 : 201).json({ mensagem: "Faixa de atacado cadastrada com sucesso!", faixa });
}));

async function calcularAtacado(produtoId, caixasRecebidas) {
  const caixas = numero(caixasRecebidas, { min: 1, max: 100000, inteiro: true, obrigatorio: true, nome: "a quantidade de caixas" });
  const produto = await Produto.findByPk(numero(produtoId, { min: 1, inteiro: true, obrigatorio: true, nome: "o produto" }));
  if (!produto) throw naoAchou("Produto não encontrado.");
  const regras = regrasDaLoja();
  const unidades = unidadesPorCaixa(produto, regras);
  const faixas = await FaixaAtacado.findAll({ where: { produto_id: produto.id }, order: [["quantidade_minima", "DESC"]] });
  const faixa = faixas.find(item => caixas >= item.quantidade_minima);
  const precoBase = precoDaCaixaNoAtacado(produto, regras);
  const precoPorCaixa = faixa?.preco_caixa ? Number(faixa.preco_caixa) : precoBase * (1 - Number(faixa?.desconto_percentual || 0) / 100);
  const subtotal = precoPorCaixa * caixas;
  return {
    produto: produto.nome,
    caixas,
    unidades_por_caixa: unidades,
    total_unidades: unidades * caixas,
    desconto_aplicado_percentual: Number(faixa?.desconto_percentual || 0),
    preco_por_caixa: arredondar(precoPorCaixa),
    preco_unitario_efetivo: arredondar(subtotal / (unidades * caixas)),
    subtotal: arredondar(subtotal)
  };
}

router.post("/atacado/calcular", rota(async (req, res) => {
  res.json(await calcularAtacado(req.body?.produto_id, req.body?.caixas));
}));

router.get("/atacado/calcular", rota(async (req, res) => {
  res.json(await calcularAtacado(req.query.produto_id, req.query.caixas));
}));

module.exports = router;
