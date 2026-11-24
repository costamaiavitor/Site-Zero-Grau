// Grava no banco o catálogo publicado do site (frontend/js/dados.js + ajustes.js).
//   npm run catalogo                 só acrescenta os produtos que faltam
//   npm run catalogo -- --substituir atualiza todos pelo SKU e desativa os que
//                                    não estão no site (ex.: a carga antiga de teste)
const { sequelize } = require("../src/models/relacionamentos");
const { prepararBanco } = require("../src/esquema");
const { carregarCatalogoDoSite } = require("../src/semente");

async function principal() {
  const substituir = process.argv.includes("--substituir");
  await prepararBanco();
  const gravados = await carregarCatalogoDoSite({ substituir, avisar: mensagem => console.log(mensagem) });
  console.log(`${gravados} produtos gravados${substituir ? " (catálogo substituído)" : ""}.`);
}

principal()
  .catch(erro => {
    console.error("Não deu certo:", erro.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
