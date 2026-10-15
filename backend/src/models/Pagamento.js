const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pagamento = sequelize.define("Pagamento", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },

  forma: {
    type: DataTypes.ENUM("pix", "cartao", "dinheiro"),
    allowNull: false
  },

  momento: {
    type: DataTypes.ENUM("site", "entrega"),
    allowNull: false
  },

  troco_para: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },

  txid: {
    type: DataTypes.STRING(25),
    allowNull: true
  },

  status: {
    type: DataTypes.ENUM("pendente", "pago"),
    allowNull: false
  },

  confirmado_em: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  timestamps: false
});

module.exports = Pagamento;