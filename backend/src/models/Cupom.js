const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cupom = sequelize.define("Cupom", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  codigo: {
    type: DataTypes.STRING(30),
    unique: true
  },

  percentual: {
    type: DataTypes.DECIMAL(4, 2)
  },

  valor_minimo: {
    type: DataTypes.DECIMAL(10, 2)
  },

  validade: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  ativo: {
    type: DataTypes.BOOLEAN
  }

}, {
  timestamps: false
});

module.exports = Cupom;