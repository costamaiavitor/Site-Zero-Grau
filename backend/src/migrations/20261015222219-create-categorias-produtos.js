"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tabelas = await queryInterface.showAllTables();
    const nomes = tabelas.map((tabela) => String(tabela).toLowerCase());

    // Cria Categoria somente se ainda não existir
    if (!nomes.includes("categoria")) {
      await queryInterface.createTable("Categoria", {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },

        slug: {
          type: Sequelize.STRING(30),
          unique: true
        },

        nome: {
          type: Sequelize.STRING(60)
        },

        detalhe: {
          type: Sequelize.STRING(120)
        }
      });
    }

    // Cria Produtos somente se ainda não existir
    if (!nomes.includes("produtos")) {
      await queryInterface.createTable("Produtos", {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },

        categoria_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Categoria",
            key: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },

        sku: {
          type: Sequelize.STRING(60),
          allowNull: false,
          unique: true
        },

        marca: {
          type: Sequelize.STRING(80)
        },

        nome: {
          type: Sequelize.STRING(120),
          allowNull: false
        },

        volume: {
          type: Sequelize.STRING(20)
        },

        teor_alcoolico: {
          type: Sequelize.STRING(10)
        },

        embalagem: {
          type: Sequelize.ENUM("lata", "long", "garrafa", "pet")
        },

        preco: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },

        preco_promo: {
          type: Sequelize.DECIMAL(10, 2)
        },

        unidades_caixa: {
          type: Sequelize.INTEGER
        },

        estoque: {
          type: Sequelize.INTEGER
        },

        gelada: {
          type: Sequelize.BOOLEAN
        },

        alcoolica: {
          type: Sequelize.BOOLEAN
        },

        retornavel: {
          type: Sequelize.BOOLEAN
        },

        valor_casco: {
          type: Sequelize.DECIMAL(10, 2)
        },

        foto_url: {
          type: Sequelize.STRING(255)
        },

        ativo: {
          type: Sequelize.BOOLEAN
        }
      });
    }
  },

  async down(queryInterface) {
    const tabelas = await queryInterface.showAllTables();
    const nomes = tabelas.map((tabela) => String(tabela).toLowerCase());

    if (nomes.includes("produtos")) {
      await queryInterface.dropTable("Produtos");
    }

    if (nomes.includes("categoria")) {
      await queryInterface.dropTable("Categoria");
    }
  }
};