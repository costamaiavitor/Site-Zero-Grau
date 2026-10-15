"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Produtos", "embalagem", {
      type: Sequelize.ENUM("can", "bottle", "tall", "pet", "saco"),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Produtos", "embalagem", {
      type: Sequelize.ENUM("lata", "long", "garrafa", "pet"),
      allowNull: true
    });
  }
};