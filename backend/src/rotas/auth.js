const express = require("express");
const bcrypt = require("bcrypt");
const { Usuario } = require("../models/relacionamentos");
const { gerarToken, lojaDoUsuario, exigirLogin } = require("../auth");
const { rota, recusar, texto } = require("../util");

const router = express.Router();

const SENHA_MIN = 6;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONFERIR_DIGITO = process.env.CONFERIR_DIGITO === "true";

function cpfValido(numeros) {
  if (/^(\d)\1{10}$/.test(numeros)) return false;
  for (const [tamanho, pesoInicial] of [[9, 10], [10, 11]]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(numeros[i]) * (pesoInicial - i);
    if ((soma * 10) % 11 % 10 !== Number(numeros[tamanho])) return false;
  }
  return true;
}

function cnpjValido(numeros) {
  if (/^(\d)\1{13}$/.test(numeros)) return false;
  for (const tamanho of [12, 13]) {
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(numeros[i]) * peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    if ((resto < 2 ? 0 : 11 - resto) !== Number(numeros[tamanho])) return false;
  }
  return true;
}

// Guarda o documento sempre com a mesma máscara, para o "já cadastrado" valer
// com ou sem pontos e traços.
function documentoFormatado(valor, tipo) {
  const numeros = String(valor || "").replace(/\D/g, "");
  if (tipo === "cpf") {
    if (numeros.length !== 11 || (CONFERIR_DIGITO && !cpfValido(numeros))) throw recusar("CPF inválido. Confira os números.");
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (numeros.length !== 14 || (CONFERIR_DIGITO && !cnpjValido(numeros))) throw recusar("CNPJ inválido. Confira os números.");
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    documento: usuario.documento,
    tipo_documento: usuario.tipo_documento,
    loja: lojaDoUsuario(usuario)
  };
}

router.post("/cadastro", rota(async (req, res) => {
  const corpo = req.body || {};
  const tipo = String(corpo.tipo_documento || "").toLowerCase();
  if (!["cpf", "cnpj"].includes(tipo)) throw recusar("Informe se o documento é CPF ou CNPJ.");
  const nome = texto(corpo.nome, { max: 120, obrigatorio: true, nome: tipo === "cnpj" ? "a razão social" : "o nome" });
  const email = String(corpo.email || "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 160) throw recusar("Esse e-mail não parece completo — confira o @ e o domínio.");
  const senha = typeof corpo.senha === "string" ? corpo.senha : "";
  if (senha.length < SENHA_MIN || senha.length > 72) throw recusar(`A senha tem de ter de ${SENHA_MIN} a 72 caracteres.`);
  const documento = documentoFormatado(corpo.documento, tipo);

  if (await Usuario.findOne({ where: { email } })) throw recusar("E-mail já cadastrado.");
  if (await Usuario.findOne({ where: { documento } })) throw recusar(`Já existe uma conta com esse ${tipo.toUpperCase()}. Entre com ela.`);

  const usuario = await Usuario.create({
    nome,
    email,
    senha_hash: await bcrypt.hash(senha, 10),
    documento,
    tipo_documento: tipo,
    perfil: "cliente"
  });

  return res.status(201).json({ mensagem: "Usuário cadastrado com sucesso.", usuario: usuarioPublico(usuario) });
}));

router.post("/login", rota(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const senha = typeof req.body?.senha === "string" ? req.body.senha : "";
  if (!email || !senha) throw recusar("E-mail e senha são obrigatórios.");

  const usuario = await Usuario.findOne({ where: { email } });
  const confere = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;
  if (!confere) return res.status(401).json({ erro: "Credenciais inválidas." });

  return res.status(200).json({ mensagem: "Login realizado com sucesso!", token: gerarToken(usuario), usuario: usuarioPublico(usuario) });
}));

router.get("/eu", exigirLogin, rota(async (req, res) => {
  return res.status(200).json({ usuario: usuarioPublico(req.usuario) });
}));

module.exports = router;
