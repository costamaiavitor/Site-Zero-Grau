const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FaixaAtacado = sequelize.define("FaixaAtacado", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  regra_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  caixas_minimas: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  desconto_extra: {
    type: DataTypes.DECIMAL(4, 2)
  }

}, {
  timestamps: false
});

module.exports = FaixaAtacado;