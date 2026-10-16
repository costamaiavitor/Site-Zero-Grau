const express = require("express");
const path = require("path");
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

// Carrega associações/relacionamentos entre os models
require("./src/models/relacionamentos");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares para JSON e arquivos estáticos do frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const caminhoFrontend = path.join(__dirname, "..", "frontend");
app.use(express.static(caminhoFrontend));

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
// 4. ROTA RAIZ (SPA FRONTEND)
// ==========================================================================
app.get("/", (req, res) => {
  res.sendFile(path.join(caminhoFrontend, "index.html"));
});

// ==========================================================================
// 5. INICIALIZAÇÃO E SINCRONIZAÇÃO COM O BANCO DE DADOS
// ==========================================================================
async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log("Conexão com MySQL realizada com sucesso!");

    await sequelize.sync({ alter: true });
    console.log("Tabelas sincronizadas no MySQL 8!");

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
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