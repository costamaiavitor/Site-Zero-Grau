const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// A foto fica no banco: num serviço de nuvem a pasta do servidor é apagada a
// cada nova publicação, e a foto sumiria junto.
const FotoProduto = sequelize.define("FotoProduto", {
  produto_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },

  tipo: {
    type: DataTypes.STRING(40),
    allowNull: false
  },

  dados: {
    type: DataTypes.BLOB("medium"),
    allowNull: false
  },

  atualizado_em: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "fotos_produto",
  timestamps: false
});

module.exports = FotoProduto;
