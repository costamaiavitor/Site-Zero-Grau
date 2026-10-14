const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Permite que o Express processe dados enviados em formulários e JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve todos os arquivos estáticos (HTML, CSS, JS, imagens) da raiz do projeto
app.use(express.static(__dirname));

// Rota padrão para entregar a página inicial (se houver um index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});