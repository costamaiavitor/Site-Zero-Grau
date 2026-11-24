// Apaga todas as tabelas do banco de TESTE antes da rodada ponta a ponta.
const sequelize = require("../../backend/src/config/database");

(async () => {
  if (!/teste/i.test(process.env.DB_NAME || "")) {
    console.error("DB_NAME precisa ser um banco de teste (com \"teste\" no nome).");
    process.exit(1);
  }
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  const [tabelas] = await sequelize.query("SELECT TABLE_NAME AS nome FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
  for (const { nome } of tabelas) await sequelize.query(`DROP TABLE \`${nome}\``);
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  await sequelize.close();
})().catch(erro => {
  console.error(erro.message);
  process.exit(1);
});
