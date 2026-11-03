const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FaixaAtacado = sequelize.define(
  "FaixaAtacado",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    produto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantidade_minima: {
      type: DataTypes.INTEGER,
      allowNull: false, // Ex: a partir de 5 caixas, 10 caixas, 20 caixas...
    },
    desconto_percentual: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.0, // Ex: 5.00 para 5%
    },
    preco_caixa: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // Preço fixo por caixa nesta faixa (ou calculado via desconto)
    },
  },
  {
    tableName: "faixas_atacado",
    timestamps: false,
  }
);

module.exports = FaixaAtacado;