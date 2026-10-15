const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Horario = sequelize.define("Horario", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  loja_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  dia_semana: {
    type: DataTypes.TINYINT,
    allowNull: false
  },

  abre: {
    type: DataTypes.TIME,
    allowNull: false
  },

  fecha: {
    type: DataTypes.TIME,
    allowNull: false
  }

}, {
  timestamps: false
});

module.exports = Horario;