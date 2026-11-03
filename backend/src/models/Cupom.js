const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cupom = sequelize.define(
  "Cupom",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    tipo_desconto: {
      type: DataTypes.ENUM("percentual", "fixo"),
      allowNull: false,
      defaultValue: "percentual",
    },
    valor_desconto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    valor_minimo_pedido: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    data_validade: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    limite_uso: {
      type: DataTypes.INTEGER,
      allowNull: true, // null = sem limite
    },
    usos_atuais: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "cupons",
    timestamps: true,
  }
);

module.exports = Cupom;