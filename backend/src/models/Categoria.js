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
  // Nome que a tabela sempre teve no banco (o Sequelize não pluraliza "Categoria").
  tableName: "Categoria",
  timestamps: false
});

module.exports = Categoria;