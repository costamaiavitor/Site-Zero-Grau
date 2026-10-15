const Usuario = require("./Usuario");
const Endereco = require("./Endereco");
const Pedido = require("./Pedido");
const ItemPedido = require("./ItemPedido");
const Produto = require("./Produto");
const Categoria = require("./Categoria");
const Pagamento = require("./Pagamento");
const Cupom = require("./Cupom");
const Loja = require("./Loja");
const Horario = require("./Horario");
const RegraVenda = require("./RegraVenda");
const FaixaAtacado = require("./FaixaAtacado");

// USUARIO 1:N ENDERECO
Usuario.hasMany(Endereco, { foreignKey: "usuario_id" });
Endereco.belongsTo(Usuario, { foreignKey: "usuario_id" });

// USUARIO 1:N PEDIDO
Usuario.hasMany(Pedido, { foreignKey: "usuario_id" });
Pedido.belongsTo(Usuario, { foreignKey: "usuario_id" });

// ENDERECO 1:N PEDIDO
Endereco.hasMany(Pedido, { foreignKey: "endereco_id" });
Pedido.belongsTo(Endereco, { foreignKey: "endereco_id" });

// CUPOM 1:N PEDIDO
Cupom.hasMany(Pedido, { foreignKey: "cupom_id" });
Pedido.belongsTo(Cupom, { foreignKey: "cupom_id" });

// PEDIDO 1:N ITEM_PEDIDO
Pedido.hasMany(ItemPedido, { foreignKey: "pedido_id" });
ItemPedido.belongsTo(Pedido, { foreignKey: "pedido_id" });

// PRODUTO 1:N ITEM_PEDIDO
Produto.hasMany(ItemPedido, { foreignKey: "produto_id" });
ItemPedido.belongsTo(Produto, { foreignKey: "produto_id" });

// CATEGORIA 1:N PRODUTO
Categoria.hasMany(Produto, { foreignKey: "categoria_id" });
Produto.belongsTo(Categoria, { foreignKey: "categoria_id" });

// PEDIDO 1:1 PAGAMENTO
Pedido.hasOne(Pagamento, { foreignKey: "pedido_id" });
Pagamento.belongsTo(Pedido, { foreignKey: "pedido_id" });

// LOJA 1:N HORARIO
Loja.hasMany(Horario, { foreignKey: "loja_id" });
Horario.belongsTo(Loja, { foreignKey: "loja_id" });

// LOJA 1:N REGRA_VENDA
Loja.hasMany(RegraVenda, { foreignKey: "loja_id" });
RegraVenda.belongsTo(Loja, { foreignKey: "loja_id" });

// REGRA_VENDA 1:N FAIXA_ATACADO
RegraVenda.hasMany(FaixaAtacado, { foreignKey: "regra_id" });
FaixaAtacado.belongsTo(RegraVenda, { foreignKey: "regra_id" });

module.exports = {
  Usuario,
  Endereco,
  Pedido,
  ItemPedido,
  Produto,
  Categoria,
  Pagamento,
  Cupom,
  Loja,
  Horario,
  RegraVenda,
  FaixaAtacado
};