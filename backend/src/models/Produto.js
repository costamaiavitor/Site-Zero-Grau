const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Produto = sequelize.define("Produto", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  sku: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true
  },

  marca: {
    type: DataTypes.STRING(80)
  },

  nome: {
    type: DataTypes.STRING(120),
    allowNull: false
  },

  volume: {
    type: DataTypes.STRING(20)
  },

  teor_alcoolico: {
    type: DataTypes.STRING(10)
  },

  embalagem: {
    type: DataTypes.ENUM("lata", "long", "garrafa", "pet")
  },

  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  preco_promo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },

  unidades_caixa: {
    type: DataTypes.INTEGER
  },

  estoque: {
    type: DataTypes.INTEGER
  },

  gelada: {
    type: DataTypes.BOOLEAN
  },

  alcoolica: {
    type: DataTypes.BOOLEAN
  },

  retornavel: {
    type: DataTypes.BOOLEAN
  },

  valor_casco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },

  foto_url: {
    type: DataTypes.STRING(255)
  },

  ativo: {
    type: DataTypes.BOOLEAN
  }

}, {
  timestamps: false
});

module.exports = Produto;