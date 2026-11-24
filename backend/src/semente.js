// Dados mínimos para a loja funcionar num banco novo, tirados do catálogo e das
// regras que o site já publica. Só cria o que falta; não sobrescreve nada.
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { Loja, Horario, RegraVenda, Categoria, Produto, Usuario } = require("./models/relacionamentos");
const { regrasDaLoja } = require("./regras");

function horaDoBanco(hora) {
  return /^\d{2}:\d{2}$/.test(hora) ? `${hora}:00` : hora;
}

async function semearLoja(regras, avisar) {
  if (await Loja.count()) return;
  await Loja.create({
    id: 1,
    nome: "Zero Grau",
    cnpj: regras.CONTATO.cnpj,
    whatsapp: String(regras.CONTATO.whatsapp || "").replace(/\D/g, "").slice(-13),
    telefone: regras.CONTATO.telefone,
    email: regras.CONTATO.email,
    endereco: [regras.CONTATO.endereco, regras.CONTATO.bairro].filter(Boolean).join(" · ").slice(0, 200),
    chave_pix: regras.PIX.chave || null,
    cidade_pix: regras.PIX.cidade,
    taxa_base: regras.taxaBase,
    taxa_km: regras.taxaKm,
    raio_max_km: regras.raioMax
  });
  avisar("loja criada com os dados do site");
}

async function semearHorarios(regras, avisar) {
  const loja = await Loja.findOne({ order: [["id", "ASC"]] });
  if (!loja || await Horario.count({ where: { loja_id: loja.id } })) return;
  const linhas = regras.HORARIO.dias
    .map((turno, dia) => turno && { loja_id: loja.id, dia_semana: dia, abre: horaDoBanco(turno[0]), fecha: horaDoBanco(turno[1]) })
    .filter(Boolean);
  await Horario.bulkCreate(linhas);
  avisar(`${linhas.length} horários de funcionamento criados`);
}

async function semearRegras(regras, avisar) {
  const loja = await Loja.findOne({ order: [["id", "ASC"]] });
  const padrao = {
    varejo: { pedido_minimo: regras.REGRAS.minimo, frete_gratis_acima: regras.REGRAS.freteGratis, desconto_canal: 0, prazo_pagamento: "À vista" },
    atacado: {
      pedido_minimo: regras.ATACADO.minimo,
      frete_gratis_acima: regras.ATACADO.freteGratis,
      desconto_canal: Math.round(regras.ATACADO.desconto * 10000) / 100,
      prazo_pagamento: String(regras.ATACADO.prazo || "").slice(0, 40)
    }
  };
  for (const canal of ["varejo", "atacado"]) {
    const [, criada] = await RegraVenda.findOrCreate({ where: { canal }, defaults: { canal, loja_id: loja?.id ?? null, ...padrao[canal] } });
    if (criada) avisar(`regras do ${canal} criadas`);
  }
}

async function semearCategorias(regras, avisar) {
  for (const categoria of regras.CATEGORIAS) {
    const [, criada] = await Categoria.findOrCreate({
      where: { slug: categoria.id },
      defaults: { slug: categoria.id, nome: categoria.nome, detalhe: categoria.detalhe }
    });
    if (criada) avisar(`categoria ${categoria.id} criada`);
  }
}

function produtoDoSite(bebida, regras, idPorSlug) {
  return {
    sku: bebida.sku,
    categoria_id: idPorSlug.get(bebida.cat),
    marca: bebida.marca,
    nome: bebida.nome,
    volume: bebida.vol && bebida.vol !== "—" ? bebida.vol : null,
    teor_alcoolico: bebida.teor && bebida.teor !== "—" ? bebida.teor : null,
    embalagem: bebida.forma,
    preco: bebida.preco,
    preco_promo: bebida.promo ?? null,
    unidades_caixa: regras.CAIXA_EXCECAO[bebida.sku] ?? null,
    estoque: bebida.estoque,
    gelada: !!bebida.gelada,
    alcoolica: !!bebida.alcoolica,
    retornavel: !!bebida.retornavel,
    valor_casco: bebida.retornavel ? bebida.casco ?? null : null,
    foto_url: bebida.foto || null,
    ativo: true
  };
}

// substituir=true: grava o catálogo do site por cima (pelo SKU) e desativa os
// produtos que não estão nele. Usado por scripts/carregar-catalogo.js.
async function carregarCatalogoDoSite({ substituir = false, avisar = () => {} } = {}) {
  const regras = regrasDaLoja();
  await semearCategorias(regras, avisar);
  const categorias = await Categoria.findAll();
  const idPorSlug = new Map(categorias.map(categoria => [categoria.slug, categoria.id]));
  let gravados = 0;
  for (const bebida of regras.BEBIDAS) {
    const dados = produtoDoSite(bebida, regras, idPorSlug);
    const existente = await Produto.findOne({ where: { sku: dados.sku } });
    if (!existente) {
      await Produto.create(dados);
      gravados++;
    } else if (substituir) {
      await existente.update(dados);
      gravados++;
    }
  }
  if (substituir) {
    const skus = regras.BEBIDAS.map(bebida => bebida.sku);
    const [desativados] = await Produto.update({ ativo: false }, { where: { sku: { [Op.notIn]: skus }, ativo: { [Op.ne]: false } } });
    if (desativados) avisar(`${desativados} produtos fora do catálogo do site desativados`);
  }
  return gravados;
}

async function semearProdutos(avisar) {
  if (await Produto.count()) return;
  const gravados = await carregarCatalogoDoSite({ avisar });
  avisar(`${gravados} produtos do catálogo do site gravados`);
}

// Administrador vindo do ambiente: ADMIN_EMAIL e ADMIN_SENHA (8+ caracteres).
// Sem conta com esse e-mail, cria. Com conta, só promove se a senha bater, para
// ninguém virar admin só por se cadastrar antes com o e-mail do dono.
// Para promover uma conta à mão: npm run admin -- email@exemplo.com
async function garantirAdministrador(avisar) {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA || "";
  if (!email) return;
  if (senha.length < 8) {
    avisar("ADMIN_EMAIL definido sem ADMIN_SENHA de 8 caracteres ou mais: nenhum administrador criado.");
    return;
  }
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    await Usuario.create({
      nome: "Administrador",
      email,
      senha_hash: await bcrypt.hash(senha, 10),
      documento: `ADMIN-${Date.now().toString(36)}`.slice(0, 18),
      tipo_documento: "cpf",
      perfil: "admin"
    });
    avisar(`administrador ${email} criado`);
    return;
  }
  if (usuario.perfil === "admin") return;
  if (await bcrypt.compare(senha, usuario.senha_hash)) {
    await usuario.update({ perfil: "admin" });
    avisar(`${email} agora é administrador`);
  } else {
    avisar(`${email} já tem conta com outra senha e não foi promovido. Use: npm run admin -- ${email}`);
  }
}

async function semearBanco({ avisar = mensagem => console.log(`[banco] ${mensagem}`) } = {}) {
  const regras = regrasDaLoja();
  await semearLoja(regras, avisar);
  await semearHorarios(regras, avisar);
  await semearRegras(regras, avisar);
  await semearCategorias(regras, avisar);
  await semearProdutos(avisar);
  await garantirAdministrador(avisar);
}

module.exports = { semearBanco, carregarCatalogoDoSite };
