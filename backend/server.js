require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// Conexão e Models do Sequelize (MySQL 8)
const sequelize = require("./src/config/database");
const Categoria = require("./src/models/Categoria");
const Produto = require("./src/models/Produto");
const Usuario = require("./src/models/Usuario");
const Endereco = require("./src/models/Endereco");
const Pedido = require("./src/models/Pedido");
const ItemPedido = require("./src/models/ItemPedido");
const Pagamento = require("./src/models/Pagamento");
const Cupom = require("./src/models/Cupom");
const Loja = require("./src/models/Loja");
const Horario = require("./src/models/Horario");
const RegraVenda = require("./src/models/RegraVenda");
const FaixaAtacado = require("./src/models/FaixaAtacado");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");

const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Carrega associações/relacionamentos entre os models
require("./src/models/relacionamentos");


const PORT = process.env.PORT || 3000;

// Informa ao Express que ele está atrás de um proxy reverso seguro
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para redirecionar tráfego HTTP para HTTPS automaticamente em produção
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});


// Middlewares para JSON e arquivos estáticos do frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const caminhoFrontend = path.join(__dirname, "..", "frontend");
app.use(express.static(caminhoFrontend));

// Ajuste o nome da pasta de acordo com o seu projeto ('../frontend' ou '../ZeroGrau')
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ==========================================================================
// 1. ROTA DE CADASTRO
// ==========================================================================
app.post("/api/auth/cadastro", async (req, res) => {
  try {
    const { nome, email, senha, documento, tipo_documento } = req.body;

    if (!nome || !email || !senha || !documento || !tipo_documento) {
      return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }

    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ erro: "E-mail já cadastrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    const usuario = await Usuario.create({
      nome,
      email,
      senha_hash,
      documento,
      tipo_documento: tipo_documento.toLowerCase(),
      perfil: "cliente"
    });

    const loja = tipo_documento.toLowerCase() === "cpf" ? "varejo" : "atacado";

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        documento: usuario.documento,
        tipo_documento: usuario.tipo_documento,
        loja
      }
    });
  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    return res.status(500).json({ erro: "Erro interno ao cadastrar usuário." });
  }
});

// ==========================================================================
// 2. ROTA DE LOGIN COM JWT (RF03 / RNF03)
// ==========================================================================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }

    const loja = usuario.tipo_documento === "cpf" ? "varejo" : "atacado";

    const segredoJwt = process.env.JWT_SECRET || "zero_grau_segredo_padrao";
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
        tipo_documento: usuario.tipo_documento,
        loja
      },
      segredoJwt,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        documento: usuario.documento,
        tipo_documento: usuario.tipo_documento,
        loja
      }
    });
  } catch (erro) {
    console.error("Erro no login:", erro);
    return res.status(500).json({ erro: "Erro interno no servidor ao realizar login." });
  }
});

// ==========================================================================
// 2. ROTAS DE CATEGORIAS (MYSQL)
// ==========================================================================
// Listar categorias cadastradas
app.get("/api/categorias", async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    return res.status(200).json(categorias);
  } catch (erro) {
    console.error("Erro ao listar categorias:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// Criar nova categoria
app.post("/api/categorias", async (req, res) => {
  try {
    const categoria = await Categoria.create(req.body);
    return res.status(201).json(categoria);
  } catch (erro) {
    console.error("Erro ao criar categoria:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// ==========================================================================
// 3. ROTAS DE PRODUTOS - CRUD COMPLETO (RF05, RF06, RF16)
// ==========================================================================

// GET /api/produtos: Listar com suporte a filtro de busca e categoria
app.get("/api/produtos", async (req, res) => {
  try {
    const { cat, busca } = req.query;
    const condicoes = {};

    if (cat && cat !== "all") {
      condicoes.cat = cat;
    }

    if (busca) {
      condicoes[Op.or] = [
        { nome: { [Op.like]: `%${busca}%` } },
        { marca: { [Op.like]: `%${busca}%` } }
      ];
    }

    const produtos = await Produto.findAll({ where: condicoes });
    return res.status(200).json(produtos);
  } catch (erro) {
    console.error("Erro ao listar produtos:", erro);
    return res.status(500).json({ erro: "Erro ao buscar produtos no banco de dados." });
  }
});

// GET /api/produtos/:sku: Buscar produto específico
app.get("/api/produtos/:sku", async (req, res) => {
  try {
    const produto = await Produto.findOne({ where: { sku: req.params.sku } });
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }
    return res.status(200).json(produto);
  } catch (erro) {
    console.error("Erro ao buscar produto:", erro);
    return res.status(500).json({ erro: "Erro interno ao buscar produto." });
  }
});

// POST /api/produtos: Criar produto no banco
app.post("/api/produtos", async (req, res) => {
  try {
    const { sku, marca, nome, cat, preco, estoque } = req.body;

    if (!sku || !marca || !nome || !cat || preco === undefined || estoque === undefined) {
      return res.status(400).json({ erro: "Campos obrigatórios: sku, marca, nome, cat, preco, estoque." });
    }

    const produtoExistente = await Produto.findOne({ where: { sku } });
    if (produtoExistente) {
      return res.status(409).json({ erro: "Já existe um produto com este SKU no banco de dados." });
    }

    const novoProduto = await Produto.create(req.body);
    return res.status(201).json({ mensagem: "Produto cadastrado com sucesso!", produto: novoProduto });
  // Substitua o catch atual por:
  } catch (erro) {
    console.error("Erro ao criar produto:", erro);
    return res.status(500).json({ 
      erro: "Erro ao salvar produto no banco de dados.",
      detalhes: erro.message,
      errosValidacao: erro.errors ? erro.errors.map(e => e.message) : undefined
    });
  }
});

// PUT /api/produtos/:sku: Atualizar produto no banco
app.put("/api/produtos/:sku", async (req, res) => {
  try {
    const produto = await Produto.findOne({ where: { sku: req.params.sku } });
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado para atualização." });
    }

    // Não permite alterar o SKU via body
    delete req.body.sku;

    await produto.update(req.body);
    return res.status(200).json({ mensagem: "Produto atualizado com sucesso!", produto });
  } catch (erro) {
    console.error("Erro ao atualizar produto:", erro);
    return res.status(500).json({ erro: "Erro ao atualizar produto no banco de dados." });
  }
});

// DELETE /api/produtos/:sku: Remover produto do banco
app.delete("/api/produtos/:sku", async (req, res) => {
  try {
    const produto = await Produto.findOne({ where: { sku: req.params.sku } });
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado para exclusão." });
    }

    await produto.destroy();
    return res.status(200).json({ mensagem: "Produto removido com sucesso!" });
  } catch (erro) {
    console.error("Erro ao excluir produto:", erro);
    return res.status(500).json({ erro: "Erro ao remover produto do banco de dados." });
  }
});

// ==========================================================================
// ROTAS DE PEDIDOS
// ==========================================================================

// GET /api/pedidos
app.get("/api/pedidos", async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      order: [["criado_em", "DESC"]]
    });

    return res.status(200).json(pedidos);
  } catch (erro) {
    console.error("Erro ao buscar pedidos:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar pedidos."
    });
  }
});

// PATCH /api/pedidos/:id/status
app.patch("/api/pedidos/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        erro: "O campo status é obrigatório."
      });
    }

    const pedido = await Pedido.findByPk(id);

    if (!pedido) {
      return res.status(404).json({
        erro: "Pedido não encontrado."
      });
    }

    pedido.status = status;
    await pedido.save();

    return res.status(200).json({
      mensagem: "Status atualizado com sucesso!",
      pedido
    });
  } catch (erro) {
    console.error("Erro ao atualizar status do pedido:", erro);
    return res.status(500).json({
      erro: "Erro ao atualizar status do pedido."
    });
  }
});

// GET /api/pedidos/meus
app.get("/api/pedidos/meus", autenticarToken, async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      where: {
        usuario_id: req.usuario.id
      },
      order: [["criado_em", "DESC"]]
    });

    return res.status(200).json(pedidos);
  } catch (erro) {
    console.error("Erro ao buscar pedidos do usuário:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar pedidos do usuário."
    });
  }
});

// PATCH /api/pedidos/:id/agendar
app.patch("/api/pedidos/:id/agendar", autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { agendado_para } = req.body;

    if (!agendado_para) {
      return res.status(400).json({
        erro: "O campo agendado_para é obrigatório."
      });
    }

    const data = new Date(agendado_para);

    if (Number.isNaN(data.getTime())) {
      return res.status(400).json({
        erro: "Data de agendamento inválida."
      });
    }

    const diaSemana = data.getDay();
    const hora = data.toTimeString().slice(0, 8);

    const horario = await Horario.findOne({
      where: {
        loja_id: 1,
        dia_semana: diaSemana
      }
    });

    if (!horario || hora < horario.abre || hora > horario.fecha) {
      return res.status(400).json({
        erro: "Horário fora do funcionamento da loja."
      });
    }

    const pedido = await Pedido.findOne({
      where: {
        id,
        usuario_id: req.usuario.id
      }
    });

    if (!pedido) {
      return res.status(404).json({
        erro: "Pedido não encontrado para este usuário."
      });
    }

    pedido.agendado = true;
    pedido.agendado_para = agendado_para;

    await pedido.save();

    return res.status(200).json({
      mensagem: "Pedido agendado com sucesso!",
      pedido
    });
  } catch (erro) {
    console.error("Erro ao agendar pedido:", erro);
    return res.status(500).json({
      erro: "Erro ao agendar pedido."
    });
  }
});

// GET /api/loja
app.get("/api/loja", async (req, res) => {
  try {
    const loja = await Loja.findByPk(1);

    if (!loja) {
      return res.status(404).json({
        erro: "Loja não encontrada."
      });
    }

    const horarios = await Horario.findAll({
      where: {
        loja_id: 1
      },
      order: [["dia_semana", "ASC"]]
    });

    return res.status(200).json({
      ...loja.toJSON(),
      horarios
    });
  } catch (erro) {
    console.error("Erro ao buscar dados da loja:", erro);
    return res.status(500).json({
      erro: "Erro ao buscar dados da loja."
    });
  }
});

// PUT /api/loja
app.put("/api/loja", async (req, res) => {
  try {
    const loja = await Loja.findByPk(1);

    if (!loja) {
      return res.status(404).json({
        erro: "Loja não encontrada."
      });
    }

    const {
      nome,
      cnpj,
      whatsapp,
      telefone,
      email,
      endereco,
      chave_pix,
      cidade_pix,
      taxa_base,
      taxa_km,
      raio_max_km
    } = req.body;

    await loja.update({
      nome: nome ?? loja.nome,
      cnpj: cnpj ?? loja.cnpj,
      whatsapp: whatsapp ?? loja.whatsapp,
      telefone: telefone ?? loja.telefone,
      email: email ?? loja.email,
      endereco: endereco ?? loja.endereco,
      chave_pix: chave_pix ?? loja.chave_pix,
      cidade_pix: cidade_pix ?? loja.cidade_pix,
      taxa_base: taxa_base ?? loja.taxa_base,
      taxa_km: taxa_km ?? loja.taxa_km,
      raio_max_km: raio_max_km ?? loja.raio_max_km
    });

    return res.status(200).json({
      mensagem: "Dados da loja atualizados com sucesso!",
      loja
    });
  } catch (erro) {
    console.error("Erro ao atualizar dados da loja:", erro);
    return res.status(500).json({
      erro: "Erro ao atualizar dados da loja."
    });
  }
});

// ==========================================================================
// 4. ROTA RAIZ (SPA FRONTEND)
// ==========================================================================
app.get("/", (req, res) => {
  res.sendFile(path.join(caminhoFrontend, "index.html"));
});

// ==========================================================================
// 5. CONSULTAR REGRAS DO CANAL (GET /api/regras/:canal - RF17)
// ==========================================================================
app.get("/api/regras/:canal", async (req, res) => {
  try {
    const canal = req.params.canal.toLowerCase();

    if (!["varejo", "atacado"].includes(canal)) {
      return res.status(400).json({
        erro: "Canal inválido. Os valores permitidos são 'varejo' ou 'atacado'."
      });
    }

    const [regra] = await RegraVenda.findOrCreate({
      where: { canal },
      defaults: {
        canal,
        loja_id: 1,
        pedido_minimo: canal === "atacado" ? 300.00 : 30.00,
        frete_gratis_acima: canal === "atacado" ? 800.00 : 150.00,
        desconto_canal: 0.00,
        prazo_pagamento: canal === "atacado" ? "30 dias" : "À vista"
      }
    });

    return res.status(200).json(regra);
  } catch (erro) {
    console.error("Erro ao procurar regras de venda:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// ==========================================================================
// 6. ATUALIZAR REGRAS DO CANAL (PUT /api/regras/:canal - RF17 / RF21)
// ==========================================================================
app.put("/api/regras/:canal", async (req, res) => {
  try {
    const canal = req.params.canal.toLowerCase();

    if (!["varejo", "atacado"].includes(canal)) {
      return res.status(400).json({
        erro: "Canal inválido. Os valores permitidos são 'varejo' ou 'atacado'."
      });
    }

    const [regra] = await RegraVenda.findOrCreate({
      where: { canal },
      defaults: { canal }
    });

    const camposPermitidos = [
      "pedido_minimo",
      "frete_gratis_acima",
      "desconto_canal",
      "prazo_pagamento",
      "loja_id"
    ];

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        regra[campo] = req.body[campo];
      }
    });

    await regra.save();

    return res.status(200).json({
      mensagem: `Regras do canal '${canal}' atualizadas com sucesso!`,
      regra
    });
  } catch (erro) {
    console.error("Erro ao atualizar regras de venda:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// ==========================================================================
// 7. CADASTRAR OU ATUALIZAR FAIXA DE ATACADO (POST /api/produtos/:id/faixas)
// ==========================================================================
app.post("/api/produtos/:id/faixas", async (req, res) => {
  try {
    const produtoId = req.params.id;
    const { quantidade_minima, desconto_percentual, preco_caixa } = req.body;

    const produto = await Produto.findByPk(produtoId);
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    if (!quantidade_minima || quantidade_minima <= 0) {
      return res.status(400).json({ erro: "A quantidade mínima deve ser maior que zero." });
    }

    // Calcula o preço da caixa base se não for informado diretamente
    const precoUnitario = Number(produto.preco_promo || produto.preco);
    const precoCaixaPadrao = precoUnitario * (produto.unidades_caixa || 1);
    
    let valorCaixaFinal = preco_caixa;
    if (!valorCaixaFinal && desconto_percentual) {
      valorCaixaFinal = precoCaixaPadrao * (1 - Number(desconto_percentual) / 100);
    }

    const faixa = await FaixaAtacado.create({
      produto_id: produtoId,
      quantidade_minima,
      desconto_percentual: desconto_percentual || 0,
      preco_caixa: valorCaixaFinal || precoCaixaPadrao,
    });

    return res.status(201).json({
      mensagem: "Faixa de atacado cadastrada com sucesso!",
      faixa,
    });
  } catch (erro) {
    console.error("Erro ao cadastrar faixa de atacado:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// ==========================================================================
// 8. LISTAR AS FAIXAS DE DESCONTO DE UM PRODUTO (GET /api/produtos/:id/faixas)
// ==========================================================================
app.get("/api/produtos/:id/faixas", async (req, res) => {
  try {
    const produtoId = req.params.id;

    const produto = await Produto.findByPk(produtoId);
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const faixas = await FaixaAtacado.findAll({
      where: { produto_id: produtoId },
      order: [["quantidade_minima", "ASC"]],
    });

    const precoUnitario = Number(produto.preco_promo || produto.preco);
    const unidadesCaixa = produto.unidades_caixa || 1;
    const precoCaixaPadrao = precoUnitario * unidadesCaixa;

    return res.status(200).json({
      produto_id: produto.id,
      nome: produto.nome,
      unidades_por_caixa: unidadesCaixa,
      preco_unitario: precoUnitario,
      preco_caixa_padrao: precoCaixaPadrao,
      faixas,
    });
  } catch (erro) {
    console.error("Erro ao listar faixas de atacado:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// ==========================================================================
// 9. CALCULAR PREÇO DE ATACADO POR QUANTIDADE DE CAIXAS (POST /api/atacado/calcular)
// ==========================================================================
app.post("/api/atacado/calcular", async (req, res) => {
  try {
    const { produto_id, caixas } = req.body;

    if (!produto_id || !caixas || caixas <= 0) {
      return res.status(400).json({ erro: "Informe produto_id e a quantidade de caixas desejada." });
    }

    const produto = await Produto.findByPk(produto_id);
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    // Busca faixas aplicáveis ordenadas pela maior quantidade elegível
    const faixas = await FaixaAtacado.findAll({
      where: { produto_id },
      order: [["quantidade_minima", "DESC"]],
    });

    const faixaAplicavel = faixas.find((f) => caixas >= f.quantidade_minima);

    const precoUnitario = Number(produto.preco_promo || produto.preco);
    const unidadesCaixa = produto.unidades_caixa || 1;
    const precoCaixaBase = precoUnitario * unidadesCaixa;

    let precoPorCaixa = precoCaixaBase;
    let descontoPercentual = 0;

    if (faixaAplicavel) {
      descontoPercentual = Number(faixaAplicavel.desconto_percentual);
      precoPorCaixa = faixaAplicavel.preco_caixa 
        ? Number(faixaAplicavel.preco_caixa)
        : precoCaixaBase * (1 - descontoPercentual / 100);
    }

    const subtotal = precoPorCaixa * caixas;
    const totalUnidades = unidadesCaixa * caixas;
    const valorUnitarioEfetivo = subtotal / totalUnidades;

    return res.status(200).json({
      produto: produto.nome,
      caixas,
      unidades_por_caixa: unidadesCaixa,
      total_unidades: totalUnidades,
      desconto_aplicado_percentual: descontoPercentual,
      preco_por_caixa: Number(precoPorCaixa.toFixed(2)),
      preco_unitario_efetivo: Number(valorUnitarioEfetivo.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
    });
  } catch (erro) {
    console.error("Erro no cálculo de atacado:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// ==========================================================================
// 10. CALCULAR PREÇO VIA QUERY PARAMS (GET /api/atacado/calcular)
// ==========================================================================
app.get("/api/atacado/calcular", async (req, res) => {
  try {
    const produto_id = req.query.produto_id;
    const caixas = Number(req.query.caixas);

    if (!produto_id || !caixas || caixas <= 0) {
      return res.status(400).json({
        erro: "Informe 'produto_id' e 'caixas' como query params (ex: ?produto_id=1&caixas=10)."
      });
    }

    const produto = await Produto.findByPk(produto_id);
    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const faixas = await FaixaAtacado.findAll({
      where: { produto_id },
      order: [["quantidade_minima", "DESC"]],
    });

    const faixaAplicavel = faixas.find((f) => caixas >= f.quantidade_minima);

    const precoUnitario = Number(produto.preco_promo || produto.preco);
    const unidadesCaixa = produto.unidades_caixa || 1;
    const precoCaixaBase = precoUnitario * unidadesCaixa;

    let precoPorCaixa = precoCaixaBase;
    let descontoPercentual = 0;

    if (faixaAplicavel) {
      descontoPercentual = Number(faixaAplicavel.desconto_percentual);
      precoPorCaixa = faixaAplicavel.preco_caixa
        ? Number(faixaAplicavel.preco_caixa)
        : precoCaixaBase * (1 - descontoPercentual / 100);
    }

    const subtotal = precoPorCaixa * caixas;
    const totalUnidades = unidadesCaixa * caixas;
    const valorUnitarioEfetivo = subtotal / totalUnidades;

    return res.status(200).json({
      produto: produto.nome,
      caixas,
      unidades_por_caixa: unidadesCaixa,
      total_unidades: totalUnidades,
      desconto_aplicado_percentual: descontoPercentual,
      preco_por_caixa: Number(precoPorCaixa.toFixed(2)),
      preco_unitario_efetivo: Number(valorUnitarioEfetivo.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
    });
  } catch (erro) {
    console.error("Erro no cálculo de atacado:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// ==========================================================================
// CRUD /api/cupons
// ==========================================================================

// 1. LISTAR TODOS OS CUPONS (GET /api/cupons)
app.get("/api/cupons", async (req, res) => {
  try {
    const cupons = await Cupom.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(cupons);
  } catch (erro) {
    console.error("Erro ao listar cupons:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// 2. OBTER CUPOM POR ID (GET /api/cupons/:id)
app.get("/api/cupons/:id", async (req, res) => {
  try {
    const cupom = await Cupom.findByPk(req.params.id);
    if (!cupom) {
      return res.status(404).json({ erro: "Cupom não encontrado." });
    }
    return res.status(200).json(cupom);
  } catch (erro) {
    console.error("Erro ao obter cupom:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// 3. CRIAR NOVO CUPOM (POST /api/cupons)
app.post("/api/cupons", async (req, res) => {
  try {
    const {
      codigo,
      tipo_desconto,
      valor_desconto,
      valor_minimo_pedido,
      data_validade,
      limite_uso,
      ativo,
    } = req.body;

    if (!codigo || !valor_desconto) {
      return res.status(400).json({ erro: "Código e valor de desconto são obrigatórios." });
    }

    const codigoNormalizado = codigo.trim().toUpperCase();

    const cupomExistente = await Cupom.findOne({ where: { codigo: codigoNormalizado } });
    if (cupomExistente) {
      return res.status(400).json({ erro: "Já existe um cupom com este código." });
    }

    const novoCupom = await Cupom.create({
      codigo: codigoNormalizado,
      tipo_desconto: tipo_desconto || "percentual",
      valor_desconto,
      valor_minimo_pedido: valor_minimo_pedido || 0,
      data_validade: data_validade || null,
      limite_uso: limite_uso !== undefined ? limite_uso : null,
      ativo: ativo !== undefined ? ativo : true,
    });

    return res.status(201).json({
      mensagem: "Cupom criado com sucesso!",
      cupom: novoCupom,
    });
  } catch (erro) {
    console.error("Erro ao criar cupom:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// 4. ATUALIZAR CUPOM (PUT /api/cupons/:id)
app.put("/api/cupons/:id", async (req, res) => {
  try {
    const cupom = await Cupom.findByPk(req.params.id);
    if (!cupom) {
      return res.status(404).json({ erro: "Cupom não encontrado." });
    }

    if (req.body.codigo) {
      req.body.codigo = req.body.codigo.trim().toUpperCase();
    }

    await cupom.update(req.body);

    return res.status(200).json({
      mensagem: "Cupom atualizado com sucesso!",
      cupom,
    });
  } catch (erro) {
    console.error("Erro ao atualizar cupom:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// 5. DELETAR CUPOM (DELETE /api/cupons/:id)
app.delete("/api/cupons/:id", async (req, res) => {
  try {
    const cupom = await Cupom.findByPk(req.params.id);
    if (!cupom) {
      return res.status(404).json({ erro: "Cupom não encontrado." });
    }

    await cupom.destroy();
    return res.status(200).json({ mensagem: "Cupom excluído com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir cupom:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// ==========================================================================
// 11. VALIDAR CUPOM NO CARRINHO/CHECKOUT
// ==========================================================================
app.post("/api/cupons/validar", async (req, res) => {
  try {
    const { codigo, subtotal } = req.body;

    if (!codigo || subtotal === undefined) {
      return res.status(400).json({
        valido: false,
        erro: "Informe o 'codigo' do cupom e o 'subtotal' da compra.",
      });
    }

    const codigoNormalizado = codigo.trim().toUpperCase();
    const cupom = await Cupom.findOne({ where: { codigo: codigoNormalizado } });

    if (!cupom) {
      return res.status(404).json({ valido: false, erro: "Cupom inválido ou inexistente." });
    }

    if (!cupom.ativo) {
      return res.status(400).json({ valido: false, erro: "Este cupom foi desativado." });
    }

    // Validação de expiração
    if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
      return res.status(400).json({ valido: false, erro: "Este cupom já expirou." });
    }

    // Validação de limite de uso geral
    if (cupom.limite_uso !== null && cupom.usos_atuais >= cupom.limite_uso) {
      return res.status(400).json({ valido: false, erro: "O limite de uso deste cupom foi atingido." });
    }

    // Validação de valor mínimo de pedido
    const subtotalNumero = Number(subtotal);
    if (subtotalNumero < Number(cupom.valor_minimo_pedido)) {
      return res.status(400).json({
        valido: false,
        erro: `Valor mínimo para este cupom é de R$ ${Number(cupom.valor_minimo_pedido).toFixed(2)}.`,
      });
    }

    // Cálculo do desconto
    let desconto = 0;
    const valorDesconto = Number(cupom.valor_desconto);

    if (cupom.tipo_desconto === "percentual") {
      desconto = (subtotalNumero * valorDesconto) / 100;
    } else {
      desconto = valorDesconto;
    }

    // Desconto não pode ultrapassar o subtotal
    if (desconto > subtotalNumero) {
      desconto = subtotalNumero;
    }

    const totalComDesconto = subtotalNumero - desconto;

    return res.status(200).json({
      valido: true,
      mensagem: "Cupom aplicado com sucesso!",
      codigo: cupom.codigo,
      tipo_desconto: cupom.tipo_desconto,
      valor_desconto: valorDesconto,
      desconto_calculado: Number(desconto.toFixed(2)),
      subtotal_original: Number(subtotalNumero.toFixed(2)),
      total_com_desconto: Number(totalComDesconto.toFixed(2)),
    });
  } catch (erro) {
    console.error("Erro ao validar cupom:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});

// ==========================================================================
// 10. INICIALIZAÇÃO E SINCRONIZAÇÃO COM O BANCO DE DADOS
// ==========================================================================
async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log("Conexão com MySQL realizada com sucesso!");

    await sequelize.sync({ alter: true });
    console.log("Tabelas sincronizadas no MySQL 8!");

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Swagger disponível em http://localhost:${PORT}/api-docs`);
    });
  } catch (erro) {
    console.error("Erro ao inicializar conexão com o MySQL:", erro);
  }
}
// Garante que a pasta de uploads existe
const pastaUploads = path.join(__dirname, "..", "frontend", "img", "produtos");
if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads, { recursive: true });
}

// Configuração de destino e nome do ficheiro
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },
  filename: (req, file, cb) => {
    // Mantém a extensão original (ex: .png, .jpg)
    const extensao = path.extname(file.originalname);
    const nomeArquivo = `produto-${req.params.id}-${Date.now()}${extensao}`;
    cb(null, nomeArquivo);
  }
});

// Filtro para aceitar apenas imagens
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Formato de ficheiro inválido. Apenas imagens são permitidas."));
    }
  }
});

// Rota de Upload da Imagem do Produto (RF16)
app.post("/api/produtos/:id/foto", upload.single("foto"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ erro: "Nenhum ficheiro de imagem foi enviado." });
    }

    // Procura o produto por ID no MySQL
    const produto = await Produto.findByPk(id);
    if (!produto) {
      // Remove o ficheiro enviado caso o produto não exista
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    // Caminho relativo da imagem gravada para o frontend aceder
    const fotoUrl = `/img/produtos/${req.file.filename}`;

    // Atualiza o campo foto_url no MySQL
    await produto.update({ foto_url: fotoUrl });

    return res.status(200).json({
      mensagem: "Foto do produto enviada e guardada com sucesso!",
      foto_url: fotoUrl,
      produto
    });
  } catch (erro) {
    console.error("Erro no upload da foto:", erro);
    return res.status(500).json({ erro: erro.message });
  }
});
function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
  }

  jwt.verify(token, process.env.JWT_SECRET || "zero_grau_segredo_padrao", (err, usuario) => {
    if (err) {
      return res.status(403).json({ erro: "Token inválido ou expirado." });
    }
    req.usuario = usuario;
    next();
  });
}

iniciarServidor();