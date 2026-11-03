import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log('MySQL conectado com sucesso!');

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
app.get('/api/produtos', async (req, res) => {
  try {
    const { cat, busca } = req.query;

    let sql = `
      SELECT
        p.sku,
        p.marca,
        p.nome,
        c.slug AS cat,
        p.foto_url AS foto,
        p.embalagem AS forma,
        p.volume AS vol,
        p.teor_alcoolico AS teor,
        p.preco,
        p.preco_promo AS promo,
        p.gelada,
        p.retornavel,
        p.valor_casco AS casco,
        p.alcoolica,
        p.estoque
      FROM produtos p
      JOIN categoria c ON c.id = p.categoria_id
      WHERE p.ativo = 1
    `;

    const valores = [];

    if (cat && cat !== 'all') {
      sql += ' AND c.slug = ?';
      valores.push(cat);
    }

    if (busca) {
      sql += ' AND (LOWER(p.nome) LIKE ? OR LOWER(p.marca) LIKE ?)';
      const termo = `%${busca.toLowerCase()}%`;
      valores.push(termo, termo);
    }

    sql += ' ORDER BY p.nome';

    const [produtos] = await db.query(sql, valores);

    res.status(200).json(produtos);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: 'Erro ao buscar produtos.'
    });
  }
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
// AUTENTICAÇÃO
// ==========================================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: 'Email e senha são obrigatórios.'
      });
    }

    const [usuarios] = await db.query(
      'SELECT id, nome, email, senha_hash, perfil, tipo_documento FROM usuarios WHERE email = ?',
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos.'
      });
    }

    const usuario = usuarios[0];

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos.'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        perfil: usuario.perfil,
        tipo_documento: usuario.tipo_documento
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h'
      }
    );

    res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        tipo_documento: usuario.tipo_documento
      }
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: 'Erro ao realizar login.'
    });
  }
});

function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      erro: 'Token não informado.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      erro: 'Token inválido.'
    });
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = usuario;
    next();
  } catch (erro) {
    return res.status(401).json({
      erro: 'Token inválido ou expirado.'
    });
  }
}


// GET /api/pedidos/meus
// Lista apenas os pedidos do usuário logado
app.get('/api/pedidos/meus', autenticarToken, async (req, res) => {
  try {
    const [pedidos] = await db.query(`
      SELECT
        id,
        usuario_id,
        endereco_id,
        cupom_id,
        canal,
        modalidade,
        subtotal,
        desconto,
        taxa_entrega,
        total,
        status,
        agendado,
        observacao,
        criado_em
      FROM pedidos
      WHERE usuario_id = ?
      ORDER BY criado_em DESC
    `, [req.usuario.id]);

    res.status(200).json(pedidos);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: 'Erro ao buscar pedidos do usuário.'
    });
  }
});

// ==========================================================================
// ROTAS DE PEDIDOS
// ==========================================================================

// GET /api/pedidos
// Lista todos os pedidos do banco
app.get('/api/pedidos', async (req, res) => {
  try {
    const [pedidos] = await db.query(`
      SELECT
        id,
        usuario_id,
        endereco_id,
        cupom_id,
        canal,
        modalidade,
        subtotal,
        desconto,
        taxa_entrega,
        total,
        status,
        agendado,
        observacao,
        criado_em
      FROM pedidos
      ORDER BY criado_em DESC
    `);

    res.status(200).json(pedidos);
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: 'Erro ao buscar pedidos.'
    });
  }
});

// PATCH /api/pedidos/:id/status
// Atualiza somente o status de um pedido no banco
app.patch('/api/pedidos/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        erro: 'O campo status é obrigatório.'
      });
    }

    const [resultado] = await db.query(
      'UPDATE pedidos SET status = ? WHERE id = ?',
      [status, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        erro: 'Pedido não encontrado.'
      });
    }

    const [pedidos] = await db.query(
      'SELECT * FROM pedidos WHERE id = ?',
      [id]
    );

    res.status(200).json({
      mensagem: 'Status atualizado com sucesso!',
      pedido: pedidos[0]
    });
  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: 'Erro ao atualizar status do pedido.'
    });
  }
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