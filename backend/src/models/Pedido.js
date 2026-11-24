const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pedido = sequelize.define("Pedido", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  endereco_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  cupom_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  canal: {
    type: DataTypes.ENUM("varejo", "atacado"),
    allowNull: false
  },

  modalidade: {
    type: DataTypes.ENUM("entrega", "retirada"),
    allowNull: false
  },

  subtotal: {
    type: DataTypes.DECIMAL(10, 2)
  },

  desconto: {
    type: DataTypes.DECIMAL(10, 2)
  },

  taxa_entrega: {
    type: DataTypes.DECIMAL(10, 2)
  },

  total: {
    type: DataTypes.DECIMAL(10, 2)
  },

  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: "recebido"
  },

  agendado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  agendado_para: {
    type: DataTypes.DATE,
    allowNull: true
  },

  destinatario: {
    type: DataTypes.STRING(120),
    allowNull: true
  },

  observacao: {
    type: DataTypes.STRING(255)
  },

  criado_em: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

}, {
  timestamps: false
});

module.exports = Pedido;