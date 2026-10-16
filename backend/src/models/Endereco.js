const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Endereco = sequelize.define("Endereco", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  cep: {
    type: DataTypes.CHAR(8)
  },

  logradouro: {
    type: DataTypes.STRING(160)
  },

  numero: {
    type: DataTypes.STRING(10)
  },

  complemento: {
    type: DataTypes.STRING(80)
  },

  bairro: {
    type: DataTypes.STRING(80)
  },

  cidade: {
    type: DataTypes.STRING(80)
  },

  uf: {
    type: DataTypes.CHAR(2)
  },

  referencia: {
    type: DataTypes.STRING(120)
  }

}, {
  timestamps: false
});

module.exports = Endereco;