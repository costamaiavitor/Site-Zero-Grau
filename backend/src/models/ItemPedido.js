const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ItemPedido = sequelize.define("ItemPedido", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  produto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  unidade: {
    type: DataTypes.ENUM("un", "cx"),
    allowNull: false
  },

  preco_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }

}, {
  timestamps: false
});

module.exports = ItemPedido;