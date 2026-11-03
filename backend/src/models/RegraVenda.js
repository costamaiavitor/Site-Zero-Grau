const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RegraVenda = sequelize.define(
  "RegraVenda",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    loja_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    canal: {
      type: DataTypes.ENUM("varejo", "atacado"),
      allowNull: false,
      unique: true,
    },

    pedido_minimo: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },

    frete_gratis_acima: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    desconto_canal: {
      type: DataTypes.DECIMAL(4, 2),
      defaultValue: 0.0,
    },

    prazo_pagamento: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
  },
  {
    tableName: "regras_venda",
    timestamps: false,
  }
);

module.exports = RegraVenda;