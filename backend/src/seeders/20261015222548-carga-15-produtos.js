"use strict";

module.exports = {
  async up(queryInterface) {
    // Cria/atualiza categorias sem duplicar
    await queryInterface.sequelize.query(`
      INSERT INTO Categoria (slug, nome, detalhe)
      VALUES
        ('refrigerante', 'Refrigerantes', 'Latas e garrafas'),
        ('energetico', 'Energéticos', 'Latas e garrafas'),
        ('agua', 'Águas', 'Água mineral e com gás'),
        ('suco', 'Sucos', 'Sucos e néctares'),
        ('isotonico', 'Isotônicos', 'Bebidas esportivas')
      ON DUPLICATE KEY UPDATE
        nome = VALUES(nome),
        detalhe = VALUES(detalhe);
    `);

    // Busca os IDs gerados no banco
    const [categorias] = await queryInterface.sequelize.query(`
      SELECT id, slug
      FROM Categoria;
    `);

    const ids = {};

    for (const categoria of categorias) {
      ids[categoria.slug] = categoria.id;
    }

    // Evita duplicação caso o seeder precise ser executado novamente
    await queryInterface.bulkDelete("Produtos", {
      sku: [
        "REF001", "REF002", "REF003",
        "ENE001", "ENE002", "ENE003",
        "AGU001", "AGU002", "AGU003",
        "SUC001", "SUC002", "SUC003",
        "ISO001", "ISO002", "ISO003"
      ]
    });

    await queryInterface.bulkInsert("Produtos", [
      {
        categoria_id: ids.refrigerante,
        sku: "REF001",
        marca: "Cola Pop",
        nome: "Refrigerante Cola",
        volume: "350 ml",
        teor_alcoolico: "0%",
        embalagem: "can",
        preco: 5.90,
        preco_promo: 4.90,
        unidades_caixa: 12,
        estoque: 120,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "ref-cola",
        ativo: true
      },
      {
        categoria_id: ids.refrigerante,
        sku: "REF002",
        marca: "Citrus",
        nome: "Refrigerante Limão",
        volume: "350 ml",
        teor_alcoolico: "0%",
        embalagem: "can",
        preco: 5.50,
        preco_promo: null,
        unidades_caixa: 12,
        estoque: 95,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "ref-limao",
        ativo: true
      },
      {
        categoria_id: ids.refrigerante,
        sku: "REF003",
        marca: "Orange",
        nome: "Refrigerante Laranja",
        volume: "2 L",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 10.90,
        preco_promo: 9.90,
        unidades_caixa: 6,
        estoque: 70,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "ref-laranja",
        ativo: true
      },

      {
        categoria_id: ids.energetico,
        sku: "ENE001",
        marca: "Energy One",
        nome: "Energy Original",
        volume: "250 ml",
        teor_alcoolico: "0%",
        embalagem: "can",
        preco: 8.90,
        preco_promo: 7.90,
        unidades_caixa: 12,
        estoque: 90,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "energy-original",
        ativo: true
      },
      {
        categoria_id: ids.energetico,
        sku: "ENE002",
        marca: "Energy One",
        nome: "Energy Tropical",
        volume: "473 ml",
        teor_alcoolico: "0%",
        embalagem: "can",
        preco: 11.90,
        preco_promo: null,
        unidades_caixa: 12,
        estoque: 75,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "energy-tropical",
        ativo: true
      },
      {
        categoria_id: ids.energetico,
        sku: "ENE003",
        marca: "Power Mix",
        nome: "Energy Melancia",
        volume: "2 L",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 14.90,
        preco_promo: 12.90,
        unidades_caixa: 6,
        estoque: 60,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "energy-melancia",
        ativo: true
      },

      {
        categoria_id: ids.agua,
        sku: "AGU001",
        marca: "Fonte Azul",
        nome: "Água Mineral",
        volume: "500 ml",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 3.00,
        preco_promo: null,
        unidades_caixa: 12,
        estoque: 200,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "agua-500",
        ativo: true
      },
      {
        categoria_id: ids.agua,
        sku: "AGU002",
        marca: "Fonte Azul",
        nome: "Água com Gás",
        volume: "500 ml",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 3.50,
        preco_promo: null,
        unidades_caixa: 12,
        estoque: 160,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "agua-gas",
        ativo: true
      },
      {
        categoria_id: ids.agua,
        sku: "AGU003",
        marca: "Fonte Azul",
        nome: "Água Mineral",
        volume: "1.5 L",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 5.00,
        preco_promo: 4.50,
        unidades_caixa: 6,
        estoque: 110,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "agua-1500",
        ativo: true
      },

      {
        categoria_id: ids.suco,
        sku: "SUC001",
        marca: "Fruta Boa",
        nome: "Suco de Laranja",
        volume: "1 L",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 9.90,
        preco_promo: null,
        unidades_caixa: 6,
        estoque: 80,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "suco-laranja",
        ativo: true
      },
      {
        categoria_id: ids.suco,
        sku: "SUC002",
        marca: "Fruta Boa",
        nome: "Suco de Uva",
        volume: "1 L",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 10.90,
        preco_promo: 9.50,
        unidades_caixa: 6,
        estoque: 65,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "suco-uva",
        ativo: true
      },
      {
        categoria_id: ids.suco,
        sku: "SUC003",
        marca: "Fruta Boa",
        nome: "Suco de Maracujá",
        volume: "1 L",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 10.50,
        preco_promo: null,
        unidades_caixa: 6,
        estoque: 55,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "suco-maracuja",
        ativo: true
      },

      {
        categoria_id: ids.isotonico,
        sku: "ISO001",
        marca: "Sport Up",
        nome: "Isotônico Limão",
        volume: "500 ml",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 6.90,
        preco_promo: null,
        unidades_caixa: 12,
        estoque: 100,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "isotonico-limao",
        ativo: true
      },
      {
        categoria_id: ids.isotonico,
        sku: "ISO002",
        marca: "Sport Up",
        nome: "Isotônico Laranja",
        volume: "500 ml",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 6.90,
        preco_promo: 5.90,
        unidades_caixa: 12,
        estoque: 90,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "isotonico-laranja",
        ativo: true
      },
      {
        categoria_id: ids.isotonico,
        sku: "ISO003",
        marca: "Sport Up",
        nome: "Isotônico Uva",
        volume: "500 ml",
        teor_alcoolico: "0%",
        embalagem: "pet",
        preco: 6.90,
        preco_promo: null,
        unidades_caixa: 12,
        estoque: 85,
        gelada: true,
        alcoolica: false,
        retornavel: false,
        valor_casco: null,
        foto_url: "isotonico-uva",
        ativo: true
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Produtos", {
      sku: [
        "REF001", "REF002", "REF003",
        "ENE001", "ENE002", "ENE003",
        "AGU001", "AGU002", "AGU003",
        "SUC001", "SUC002", "SUC003",
        "ISO001", "ISO002", "ISO003"
      ]
    });

    await queryInterface.bulkDelete("Categoria", {
      slug: [
        "refrigerante",
        "energetico",
        "agua",
        "suco",
        "isotonico"
      ]
    });
  }
};