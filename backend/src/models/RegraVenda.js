const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RegraVenda = sequelize.define("RegraVenda", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  loja_id: {
    type: DataTypes.INTEGER
  },

  canal: {
    type: DataTypes.ENUM("varejo", "atacado"),
    unique: true
  },

  pedido_minimo: {
    type: DataTypes.DECIMAL(10, 2)
  },

  frete_gratis_acima: {
    type: DataTypes.DECIMAL(10, 2)
  },

  desconto_canal: {
    type: DataTypes.DECIMAL(4, 2)
  },

  prazo_pagamento: {
    type: DataTypes.STRING(40)
  }

}, {
  timestamps: false
});

module.exports = RegraVenda;