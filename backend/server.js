import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Caminho para a pasta frontend (sobe da backend para a raiz e entra em frontend)
const caminhoFrontend = path.join(__dirname, '..', 'frontend');

// Servir arquivos estáticos (CSS, imagens, JS do frontend)
app.use(express.static(caminhoFrontend));

// Rota GET /api/categorias
const categorias = [
  { id: 1, nome: 'Cervejas', descricao: 'Pilsen, IPA e artesanais' },
  { id: 2, nome: 'Destilados', descricao: 'Gin, Vodka, Whisky' },
  { id: 3, nome: 'Vinhos & Espumantes', descricao: 'Tintos e frisantes' },
  { id: 4, nome: 'Não Alcoólicos', descricao: 'Refrigerantes, energéticos e sucos' },
  { id: 5, nome: 'Gelo & Petiscos', descricao: 'Gelo, carvão e snacks' }
];

app.get('/api/categorias', (req, res) => {
  res.status(200).json(categorias);
});

// Entrega a página index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(caminhoFrontend, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});