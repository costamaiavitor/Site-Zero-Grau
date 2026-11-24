const jwt = require("jsonwebtoken");
const { Usuario } = require("./models/relacionamentos");

function segredo() {
  const valor = process.env.JWT_SECRET;
  if (!valor || valor.length < 16) {
    throw new Error("JWT_SECRET precisa estar definido no .env, com 16 caracteres ou mais (veja backend/.env.example).");
  }
  return valor;
}

function lojaDoUsuario(usuario) {
  return usuario.tipo_documento === "cnpj" ? "atacado" : "varejo";
}

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, perfil: usuario.perfil, tipo_documento: usuario.tipo_documento, loja: lojaDoUsuario(usuario) },
    segredo(),
    { expiresIn: "24h" }
  );
}

// Confere o token e relê a conta no banco: quem foi apagado ou perdeu o
// perfil de admin deixa de passar na hora, sem esperar o token vencer.
async function exigirLogin(req, res, next) {
  const [tipo, token] = String(req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Entre na sua conta para continuar." });
  }
  let dados;
  try {
    dados = jwt.verify(token, segredo());
  } catch {
    return res.status(401).json({ erro: "Sua sessão expirou. Entre de novo." });
  }
  try {
    const usuario = await Usuario.findByPk(dados.id, { attributes: ["id", "nome", "email", "perfil", "tipo_documento", "documento"] });
    if (!usuario) return res.status(401).json({ erro: "Sua sessão expirou. Entre de novo." });
    req.usuario = usuario.get({ plain: true });
    return next();
  } catch (erro) {
    return next(erro);
  }
}

function exigirAdmin(req, res, next) {
  return exigirLogin(req, res, erro => {
    if (erro) return next(erro);
    if (req.usuario.perfil !== "admin") {
      return res.status(403).json({ erro: "Só o administrador da loja pode fazer isso." });
    }
    return next();
  });
}

module.exports = { segredo, gerarToken, lojaDoUsuario, exigirLogin, exigirAdmin };
