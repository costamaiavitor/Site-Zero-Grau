const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env"), quiet: true });

// Aceita os dois nomes que já circularam na equipe para a senha.
const senha = process.env.DB_PASSWORD ?? process.env.DB_PASS;
const host = process.env.DB_HOST || "localhost";
const local = ["localhost", "127.0.0.1", "::1"].includes(host);

// SSL: ligado por padrão fora da máquina local (o Aiven exige).
// DB_SSL=false desliga; DB_SSL_CA aponta para o certificado da autoridade
// (o ca.pem baixado no painel do Aiven) e passa a conferir o servidor.
function opcoesSsl() {
  const ligado = process.env.DB_SSL ? process.env.DB_SSL !== "false" : !local;
  if (!ligado) return undefined;
  if (process.env.DB_SSL_CA) {
    const arquivo = path.resolve(path.join(__dirname, "..", ".."), process.env.DB_SSL_CA);
    return { ca: fs.readFileSync(arquivo, "utf8"), rejectUnauthorized: true };
  }
  return { require: true, rejectUnauthorized: false };
}

const ssl = opcoesSsl();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, senha, {
  host,
  port: Number(process.env.DB_PORT) || (local ? 3306 : 21020),
  dialect: "mysql",
  dialectOptions: ssl ? { ssl } : {},
  timezone: "+00:00",
  pool: { max: 5, min: 0, idle: 10000, acquire: 30000 },
  logging: process.env.DB_LOG === "true" ? console.log : false
});

module.exports = sequelize;
