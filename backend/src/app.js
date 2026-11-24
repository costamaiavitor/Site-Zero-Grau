const path = require("path");
const express = require("express");
const helmet = require("helmet");
const multer = require("multer");
const swaggerUi = require("swagger-ui-express");
const { UniqueConstraintError, ForeignKeyConstraintError, ValidationError } = require("sequelize");
const { sequelize } = require("./models/relacionamentos");
const { ErroDaLoja } = require("./util");

const PASTA_SITE = path.join(__dirname, "..", "..", "frontend");

// Endereços que podem chamar a API de outro domínio (o site no GitHub Pages,
// na Vercel ou rodando na máquina). CORS_ORIGENS acrescenta outros, separados
// por vírgula.
const ORIGENS_PADRAO = [/^https:\/\/costamaiavitor\.github\.io$/, /^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];

function origemPermitida(origem) {
  if (!origem) return false;
  const extras = String(process.env.CORS_ORIGENS || "").split(",").map(item => item.trim()).filter(Boolean);
  return extras.includes(origem) || ORIGENS_PADRAO.some(padrao => padrao.test(origem));
}

function cors(req, res, next) {
  const origem = req.headers.origin;
  if (origemPermitida(origem)) {
    res.set("Access-Control-Allow-Origin", origem);
    res.set("Vary", "Origin");
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.set("Access-Control-Allow-Headers", "Authorization,Content-Type,Accept");
      res.set("Access-Control-Max-Age", "600");
      return res.sendStatus(204);
    }
  }
  return next();
}

// Limite simples de tentativas por IP (login e cadastro).
function limitarTentativas({ janelaMs, maximo }) {
  const contagem = new Map();
  return (req, res, next) => {
    const agora = Date.now();
    const chave = req.ip;
    const atual = contagem.get(chave);
    if (!atual || atual.inicio + janelaMs < agora) {
      contagem.set(chave, { inicio: agora, vezes: 1 });
    } else if (++atual.vezes > maximo) {
      res.set("Retry-After", String(Math.ceil((atual.inicio + janelaMs - agora) / 1000)));
      return res.status(429).json({ erro: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo." });
    }
    if (contagem.size > 10000) contagem.clear();
    return next();
  };
}

function criarApp({ servirSite = process.env.SERVIR_SITE !== "false" } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // CSP desligado porque o próprio servidor também entrega o site (páginas com
  // script inline e chamadas ao ViaCEP). As fotos da API são carregadas por
  // outros domínios, daí o cross-origin.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));

  app.use((req, res, next) => {
    const https = req.secure || req.headers["x-forwarded-proto"] === "https";
    if (process.env.NODE_ENV === "production" && !https && req.path !== "/api/saude") {
      return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
    }
    return next();
  });

  app.use(cors);
  app.use(express.json({ limit: "200kb" }));
  app.use(express.urlencoded({ extended: false, limit: "200kb" }));

  app.get("/api/saude", async (req, res) => {
    try {
      await sequelize.query("SELECT 1");
      res.json({ ok: true, banco: "conectado" });
    } catch {
      res.status(503).json({ ok: false, banco: "fora do ar" });
    }
  });

  const tentativas = limitarTentativas({ janelaMs: 5 * 60 * 1000, maximo: Number(process.env.LIMITE_LOGIN) || 30 });
  app.use(["/api/auth/login", "/api/auth/cadastro"], tentativas);
  app.use("/api/auth", require("./rotas/auth"));
  app.use("/api/pedidos", require("./rotas/pedidos"));
  app.use("/api/cupons", require("./rotas/cupons"));
  app.use("/api", require("./rotas/catalogo"));
  app.use("/api", require("./rotas/loja"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(require("../docs/swagger.json")));

  app.use("/api", (req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

  if (servirSite) {
    // Servido por aqui, o site já liga na API deste mesmo endereço.
    app.get("/js/config.js", (req, res) => {
      res.type("application/javascript").set("Cache-Control", "no-cache");
      res.send('const ZG_CONFIG = {\n  apiBase: "/api",\n  usarMock: false,\n  adminsSimulados: []\n};\n');
    });
    app.use(express.static(PASTA_SITE, { extensions: ["html"] }));
  }

  // Tratador central de erros: mensagem clara para o cliente, detalhe no log.
  // eslint-disable-next-line no-unused-vars
  app.use((erro, req, res, next) => {
    if (erro instanceof ErroDaLoja) return res.status(erro.status).json({ erro: erro.message, ...erro.extra });
    if (erro instanceof multer.MulterError) {
      const mensagem = erro.code === "LIMIT_FILE_SIZE" ? "A imagem pode ter no máximo 3 MB." : "Envio de arquivo inválido.";
      return res.status(400).json({ erro: mensagem });
    }
    if (erro.type === "entity.parse.failed") return res.status(400).json({ erro: "O corpo da requisição não é um JSON válido." });
    if (erro.type === "entity.too.large") return res.status(413).json({ erro: "Requisição grande demais." });
    if (erro instanceof UniqueConstraintError) return res.status(409).json({ erro: "Já existe um registro com esses dados." });
    if (erro instanceof ForeignKeyConstraintError) return res.status(409).json({ erro: "Este registro está ligado a outros e não pode ser apagado ou mudado assim." });
    if (erro instanceof ValidationError) return res.status(400).json({ erro: erro.errors?.[0]?.message || "Dados inválidos." });
    console.error(`[erro] ${req.method} ${req.originalUrl}:`, erro);
    return res.status(500).json({ erro: "Erro interno no servidor. Tente de novo em instantes." });
  });

  return app;
}

module.exports = { criarApp };
