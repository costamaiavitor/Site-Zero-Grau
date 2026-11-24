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
const FotoProduto = require("./FotoProduto");

// O que acontece ao apagar a linha "de cima":
//   RESTRICT  o banco recusa (não se apaga cliente, produto ou categoria com histórico);
//   CASCADE   apaga junto (itens e pagamento de um pedido, endereços de um cliente);
//   SET NULL  só desliga (pedido continua existindo sem o cupom ou o endereço).
const restringe = { onDelete: "RESTRICT", onUpdate: "CASCADE" };
const apagaJunto = { onDelete: "CASCADE", onUpdate: "CASCADE" };
const desliga = { onDelete: "SET NULL", onUpdate: "CASCADE" };

// USUARIO 1:N ENDERECO
Usuario.hasMany(Endereco, { foreignKey: "usuario_id", ...apagaJunto });
Endereco.belongsTo(Usuario, { foreignKey: "usuario_id", ...apagaJunto });

// USUARIO 1:N PEDIDO
Usuario.hasMany(Pedido, { foreignKey: "usuario_id", ...restringe });
Pedido.belongsTo(Usuario, { foreignKey: "usuario_id", ...restringe });

// ENDERECO 1:N PEDIDO
Endereco.hasMany(Pedido, { foreignKey: "endereco_id", ...desliga });
Pedido.belongsTo(Endereco, { foreignKey: "endereco_id", ...desliga });

// CUPOM 1:N PEDIDO
Cupom.hasMany(Pedido, { foreignKey: "cupom_id", ...desliga });
Pedido.belongsTo(Cupom, { foreignKey: "cupom_id", ...desliga });

// PEDIDO 1:N ITEM_PEDIDO
Pedido.hasMany(ItemPedido, { foreignKey: "pedido_id", ...apagaJunto });
ItemPedido.belongsTo(Pedido, { foreignKey: "pedido_id", ...apagaJunto });

// PRODUTO 1:N ITEM_PEDIDO
Produto.hasMany(ItemPedido, { foreignKey: "produto_id", ...restringe });
ItemPedido.belongsTo(Produto, { foreignKey: "produto_id", ...restringe });

// CATEGORIA 1:N PRODUTO
Categoria.hasMany(Produto, { foreignKey: "categoria_id", ...restringe });
Produto.belongsTo(Categoria, { foreignKey: "categoria_id", ...restringe });

// PRODUTO 1:N FAIXA_ATACADO
Produto.hasMany(FaixaAtacado, { foreignKey: "produto_id", ...apagaJunto });
FaixaAtacado.belongsTo(Produto, { foreignKey: "produto_id", ...apagaJunto });

// PRODUTO 1:1 FOTO
Produto.hasOne(FotoProduto, { foreignKey: "produto_id", ...apagaJunto });
FotoProduto.belongsTo(Produto, { foreignKey: "produto_id", ...apagaJunto });

// PEDIDO 1:1 PAGAMENTO
Pedido.hasOne(Pagamento, { foreignKey: "pedido_id", ...apagaJunto });
Pagamento.belongsTo(Pedido, { foreignKey: "pedido_id", ...apagaJunto });

// LOJA 1:N HORARIO
Loja.hasMany(Horario, { foreignKey: "loja_id", ...apagaJunto });
Horario.belongsTo(Loja, { foreignKey: "loja_id", ...apagaJunto });

// LOJA 1:N REGRA_VENDA
Loja.hasMany(RegraVenda, { foreignKey: "loja_id", ...desliga });
RegraVenda.belongsTo(Loja, { foreignKey: "loja_id", ...desliga });

module.exports = {
  sequelize: require("../config/database"),
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
  FaixaAtacado,
  FotoProduto
};
