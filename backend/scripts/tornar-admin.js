// Dá (ou tira) o perfil de administrador de uma conta que já existe.
//   npm run admin -- dono@exemplo.com
//   npm run admin -- dono@exemplo.com --tirar
const { sequelize, Usuario } = require("../src/models/relacionamentos");

async function principal() {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  const tirar = process.argv.includes("--tirar");
  if (!email || email.startsWith("--")) {
    console.error("Uso: npm run admin -- email@da.conta [--tirar]");
    process.exitCode = 1;
    return;
  }
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    console.error(`Nenhuma conta com o e-mail ${email}. Crie a conta pelo site primeiro.`);
    process.exitCode = 1;
    return;
  }
  await usuario.update({ perfil: tirar ? "cliente" : "admin" });
  console.log(tirar ? `${email} voltou a ser cliente.` : `${email} agora é administrador. Entre de novo no site para abrir o painel.`);
}

principal()
  .catch(erro => {
    console.error("Não deu certo:", erro.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
