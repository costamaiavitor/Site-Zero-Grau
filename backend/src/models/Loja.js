const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Loja = sequelize.define("Loja", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  nome: {
    type: DataTypes.STRING(80)
  },

  cnpj: {
    type: DataTypes.STRING(18)
  },

  whatsapp: {
    type: DataTypes.STRING(20)
  },

  telefone: {
    type: DataTypes.STRING(20)
  },

  email: {
    type: DataTypes.STRING(160)
  },

  endereco: {
    type: DataTypes.STRING(200)
  },

  chave_pix: {
    type: DataTypes.STRING(77)
  },

  cidade_pix: {
    type: DataTypes.STRING(15)
  },

  taxa_base: {
    type: DataTypes.DECIMAL(10, 2)
  },

  taxa_km: {
    type: DataTypes.DECIMAL(10, 2)
  },

  raio_max_km: {
    type: DataTypes.DECIMAL(5, 1)
  }

}, {
  timestamps: false
});

module.exports = Loja;