const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Categoria = sequelize.define("Categoria", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  slug: {
    type: DataTypes.STRING(30),
    unique: true
  },

  nome: {
    type: DataTypes.STRING(60)
  },

  detalhe: {
    type: DataTypes.STRING(120)
  }
}, {
  timestamps: false
});

module.exports = Categoria;