const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define("Usuario", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  nome: {
    type: DataTypes.STRING(120),
    allowNull: false
  },

  email: {
    type: DataTypes.STRING(160),
    unique: true,
    allowNull: false
  },

  senha_hash: {
    type: DataTypes.CHAR(60),
    allowNull: false
  },

  documento: {
    type: DataTypes.STRING(18),
    unique: true,
    allowNull: false
  },

  tipo_documento: {
    type: DataTypes.ENUM("cpf", "cnpj"),
    allowNull: false
  },

  perfil: {
    type: DataTypes.ENUM("cliente", "admin"),
    allowNull: false
  },

  criado_em: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

}, {
  timestamps: false
});

module.exports = Usuario;