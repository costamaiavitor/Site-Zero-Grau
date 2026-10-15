import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const caminhoFrontend = path.join(__dirname, '..', 'frontend');
app.use(express.static(caminhoFrontend));

// ==========================================================================
// DADOS EM MEMÓRIA
// ==========================================================================
const CATEGORIAS = [
  { id: "cerveja",    nome: "Cervejas",        detalhe: "lata de 330 e 500 ml" },
  { id: "destilado",  nome: "Destilados",      detalhe: "whisky, vodka, gin" },
  { id: "vinho",      nome: "Vinhos e drinks", detalhe: "vermute, fizz, ice" },
  { id: "energetico", nome: "Energéticos",     detalhe: "lata e garrafa de 2 L" },
  { id: "agua",       nome: "Refrigerantes",   detalhe: "garrafa de 2 L" }
];

// Usamos let para permitir reatribuições (ex: no DELETE)
let BEBIDAS = [
  { sku: "estrella-galicia-330", marca: "Estrella Galicia", nome: "Cerveza Especial · lata 330 ml", cat: "cerveja",    foto: "estrella-galicia-330", forma: "can",    vol: "330 ml", teor: "5,5%",  preco: 8.90,   promo: 6.90,  gelada: true,  retornavel: false,               alcoolica: true,  estoque: 240 },
  { sku: "guinness-draught-500", marca: "Guinness",         nome: "Draught Stout 500 ml",          cat: "cerveja",    foto: "guinness-draught-500", forma: "can",    vol: "500 ml", teor: "4,2%",  preco: 22.90,  promo: null,  gelada: true,  retornavel: false,               alcoolica: true,  estoque: 96 },
  { sku: "feldschlosschen-500",  marca: "Feldschlösschen",  nome: "Original 500 ml",               cat: "cerveja",    foto: "feldschlosschen-500",  forma: "can",    vol: "500 ml", teor: "4,8%",  preco: 15.90,  promo: null,  gelada: true,  retornavel: false,               alcoolica: true,  estoque: 0 },

  { sku: "jack-daniels-1l",      marca: "Jack Daniel's",    nome: "Old No. 7 · 700 ml",             cat: "destilado", foto: "jack-daniels-1l",      forma: "tall",   vol: "700 ml", teor: "40%",   preco: 149.90, promo: null,  gelada: false, retornavel: false,               alcoolica: true,  estoque: 14 },
  { sku: "absolut-1l",           marca: "Absolut",          nome: "Vodka Original 700 ml",             cat: "destilado", foto: "absolut-1l",           forma: "tall",   vol: "700 ml", teor: "40%",   preco: 69.90,  promo: 59.90, gelada: true,  retornavel: false,               alcoolica: true,  estoque: 52 },
  { sku: "absolut-mango-1l",     marca: "Absolut",          nome: "Vodka Mango 750 ml",                cat: "destilado", foto: "absolut-mango-1l",     forma: "tall",   vol: "750 ml", teor: "38%",   preco: 74.90,  promo: 64.90, gelada: true,  retornavel: false,               alcoolica: true,  estoque: 31 },
  { sku: "tanqueray-750",        marca: "Tanqueray",        nome: "London Dry Gin 700 ml",         cat: "destilado", foto: "tanqueray-750",        forma: "tall",   vol: "700 ml", teor: "47,3%",preco: 129.90, promo: 109.90,gelada: false, retornavel: false,               alcoolica: true,  estoque: 21 },
  { sku: "no3-gin-700",          marca: "No. 3",            nome: "London Dry Gin 700 ml",         cat: "destilado", foto: "no3-gin-700",          forma: "tall",   vol: "700 ml", teor: "46%",   preco: 189.90, promo: null,  gelada: false, retornavel: false,               alcoolica: true,  estoque: 8 },
  { sku: "seagrams-gin-700",     marca: "Seagram's",        nome: "Extra Dry Gin 750 ml",          cat: "destilado", foto: "seagrams-gin-700",     forma: "tall",   vol: "750 ml", teor: "40%",   preco: 69.90,  promo: 57.90, gelada: false, retornavel: false,               alcoolica: true,  estoque: 64 },

  { sku: "martini-rosso-1l",     marca: "Martini",          nome: "Rosso 1 L",                     cat: "vinho",     foto: "martini-rosso-1l",     forma: "tall",   vol: "1 L",    teor: "15%",   preco: 64.90,  promo: 52.90, gelada: true,  retornavel: false,               alcoolica: true,  estoque: 26 },
  { sku: "coventry-fizz-750",    marca: "Coventry",         nome: "Fizz Elderflower 700 ml",       cat: "vinho",     foto: "coventry-fizz-750",    forma: "tall",   vol: "700 ml", teor: "15%",   preco: 39.90,  promo: 32.90, gelada: true,  retornavel: false,               alcoolica: true,  estoque: 37 },
  { sku: "smirnoff-ice-275",     marca: "Smirnoff",         nome: "Ice Tropical 275 ml",           cat: "vinho",     foto: "smirnoff-ice-275",     forma: "bottle", vol: "275 ml", teor: "5%",    preco: 11.90,  promo: 9.90,  gelada: true,  retornavel: false,               alcoolica: true,  estoque: 210 },

  { sku: "red-bull-250",         marca: "Red Bull",         nome: "Energy Drink 250 ml",           cat: "energetico",foto: "red-bull-250",         forma: "can",    vol: "250 ml", teor: "0%",    preco: 9.90,   promo: 7.90,  gelada: true,  retornavel: false,               alcoolica: false, estoque: 310 },
  { sku: "baly-melancia-2l",     marca: "Baly",             nome: "Energy Drink Melancia 2 L",     cat: "energetico",foto: "baly-melancia-2l",     forma: "pet",    vol: "2 L",    teor: "0%",    preco: 13.90,  promo: 11.90, gelada: true,  retornavel: false,               alcoolica: false, estoque: 180 },

  { sku: "coca-cola-2l",         marca: "Coca-Cola",        nome: "Sabor Original 2 L",            cat: "agua",       foto: "coca-cola-2l",         forma: "pet",    vol: "2 L",    teor: "0%",    preco: 11.90,  promo: null,  gelada: true,  retornavel: true,  casco: 2.00,  alcoolica: false, estoque: 150 }
];

// ==========================================================================
// ROTAS DE CATEGORIAS
// ==========================================================================
app.get('/api/categorias', (req, res) => {
  res.status(200).json(CATEGORIAS);
});

// ==========================================================================
// ROTAS DE PRODUTOS (CRUD)
// ==========================================================================

// 1. GET ALL: Listar produtos (com filtro opcional por categoria e busca)
app.get('/api/produtos', (req, res) => {
  const { cat, busca } = req.query;
  let resultado = [...BEBIDAS];

  if (cat && cat !== 'all') {
    resultado = resultado.filter(item => item.cat === cat);
  }

  if (busca) {
    const termo = busca.toLowerCase();
    resultado = resultado.filter(item =>
      item.nome.toLowerCase().includes(termo) ||
      item.marca.toLowerCase().includes(termo)
    );
  }

  res.status(200).json(resultado);
});

// 2. GET BY SKU: Buscar produto específico
app.get('/api/produtos/:sku', (req, res) => {
  const produto = BEBIDAS.find(p => p.sku === req.params.sku);
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  res.status(200).json(produto);
});

// 3. POST: Criar novo produto
app.post('/api/produtos', (req, res) => {
  const { sku, marca, nome, cat, preco, estoque, forma, vol, teor, foto, promo, gelada, retornavel, alcoolica } = req.body;

  // Validação simples de campos obrigatórios
  if (!sku || !marca || !nome || !cat || preco === undefined || estoque === undefined) {
    return res.status(400).json({ erro: 'Campos obrigatórios: sku, marca, nome, cat, preco, estoque.' });
  }

  // Verificar se o SKU já existe
  const produtoExistente = BEBIDAS.find(p => p.sku === sku);
  if (produtoExistente) {
    return res.status(409).json({ erro: 'Já existe um produto cadastrado com este SKU.' });
  }

  const novoProduto = {
    sku,
    marca,
    nome,
    cat,
    foto: foto || sku,
    forma: forma || 'can',
    vol: vol || '—',
    teor: teor || '—',
    preco: Number(preco),
    promo: promo !== undefined ? Number(promo) : null,
    gelada: Boolean(gelada),
    retornavel: Boolean(retornavel),
    alcoolica: Boolean(alcoolica),
    estoque: Number(estoque)
  };

  BEBIDAS.push(novoProduto);
  res.status(201).json({ mensagem: 'Produto criado com sucesso!', produto: novoProduto });
});

// 4. PUT: Atualizar produto existente por SKU
app.put('/api/produtos/:sku', (req, res) => {
  const { sku } = req.params;
  const index = BEBIDAS.findIndex(p => p.sku === sku);

  if (index === -1) {
    return res.status(404).json({ erro: 'Produto não encontrado para atualização.' });
  }

  // Mescla os dados existentes com os novos enviados no body
  BEBIDAS[index] = {
    ...BEBIDAS[index],
    ...req.body,
    sku: BEBIDAS[index].sku // Impede que o SKU original seja alterado pela URL
  };

  res.status(200).json({ mensagem: 'Produto atualizado com sucesso!', produto: BEBIDAS[index] });
});

// 5. DELETE: Remover produto por SKU
app.delete('/api/produtos/:sku', (req, res) => {
  const { sku } = req.params;
  const index = BEBIDAS.findIndex(p => p.sku === sku);

  if (index === -1) {
    return res.status(404).json({ erro: 'Produto não encontrado para remoção.' });
  }

  const [produtoRemovido] = BEBIDAS.splice(index, 1);
  res.status(200).json({ mensagem: 'Produto removido com sucesso!', produto: produtoRemovido });
});

// ==========================================================================
// ROTA PRINCIPAL E INICIALIZAÇÃO
// ==========================================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(caminhoFrontend, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});