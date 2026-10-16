const express = require("express");
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
const bcrypt = require("bcrypt");

// Carrega os relacionamentos entre os models
require("./src/models/relacionamentos");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend da Zero Grau funcionando!");
});


app.post("/api/auth/cadastro", async (req, res) => {
  try {
    const {
      nome,
      email,
      senha,
      documento,
      tipo_documento
    } = req.body;

    // Campos obrigatórios
    if (!nome || !email || !senha || !documento || !tipo_documento) {
      return res.status(400).json({
        erro: "Preencha todos os campos obrigatórios."
      });
    }

    // Só aceita CPF ou CNPJ
    if (!["cpf", "cnpj"].includes(tipo_documento)) {
      return res.status(400).json({
        erro: "Tipo de documento inválido."
      });
    }

    // Verifica e-mail existente
    const emailExistente = await Usuario.findOne({
      where: { email }
    });

    if (emailExistente) {
      return res.status(409).json({
        erro: "E-mail já cadastrado."
      });
    }

    // Verifica documento existente
    const documentoExistente = await Usuario.findOne({
      where: { documento }
    });

    if (documentoExistente) {
      return res.status(409).json({
        erro: "Documento já cadastrado."
      });
    }

    // Criptografa a senha
    const senha_hash = await bcrypt.hash(senha, 10);

    // Usuário comum; admin é outro tipo de perfil
    const usuario = await Usuario.create({
      nome,
      email,
      senha_hash,
      documento,
      tipo_documento,
      perfil: "cliente"
    });

    // RF04: CPF = varejo / CNPJ = atacado
    const loja = tipo_documento === "cpf"
      ? "varejo"
      : "atacado";

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

    return res.status(500).json({
      erro: "Erro interno ao cadastrar usuário."
    });
  }
});

async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log("Conexão com MySQL realizada com sucesso!");

    await sequelize.sync();
    console.log("Tabelas sincronizadas!");

    app.listen(3000, () => {
      console.log("Servidor rodando em http://localhost:3000");
    });

  } catch (erro) {
    console.error("Erro ao conectar com MySQL:", erro);
  }
}

iniciarServidor();