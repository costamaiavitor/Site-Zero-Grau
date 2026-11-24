// Ponto de entrada da API da Zero Grau.
//   npm start      sobe o servidor (lê o .env desta pasta)
//   npm test       testes da API num MySQL de teste
// Variáveis: veja .env.example.
const { segredo } = require("./src/auth");
const { criarApp } = require("./src/app");
const { prepararBanco } = require("./src/esquema");
const { semearBanco } = require("./src/semente");

const PORT = Number(process.env.PORT) || 3000;

async function iniciarServidor() {
  segredo();
  await prepararBanco();
  console.log("Banco pronto (tabelas, colunas e chaves conferidas).");
  await semearBanco();
  const app = criarApp();
  return new Promise(resolve => {
    const servidor = app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Swagger disponível em http://localhost:${PORT}/api-docs`);
      resolve(servidor);
    });
  });
}

if (require.main === module) {
  iniciarServidor().catch(erro => {
    console.error("Não deu para subir o servidor:", erro.message);
    process.exit(1);
  });
}

module.exports = { iniciarServidor };
