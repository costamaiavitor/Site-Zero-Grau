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

// Carrega os relacionamentos entre os models
require("./src/models/relacionamentos");

const app = express();

app.get("/", (req, res) => {
  res.send("Backend da Zero Grau funcionando!");
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