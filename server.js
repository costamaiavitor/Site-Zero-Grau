import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aponta para a pasta onde os arquivos estáticos e o index.html realmente estão
app.use(express.static(path.join(__dirname, 'ZeroGrau')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ZeroGrau', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});