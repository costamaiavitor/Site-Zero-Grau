// Erro com mensagem para o cliente e status HTTP. Qualquer outro erro vira 500
// com texto genérico; o detalhe fica só no log do servidor.
class ErroDaLoja extends Error {
  constructor(status, mensagem, extra = {}) {
    super(mensagem);
    this.status = status;
    this.extra = extra;
  }
}

const recusar = (mensagem, extra) => new ErroDaLoja(400, mensagem, extra);
const naoAchou = mensagem => new ErroDaLoja(404, mensagem);
const conflito = mensagem => new ErroDaLoja(409, mensagem);

// Deixa a rota ser async: erro lançado vai para o tratador central.
const rota = funcao => (req, res, next) => Promise.resolve(funcao(req, res, next)).catch(next);

// Copia só os campos permitidos que vieram no corpo.
function escolher(corpo, campos) {
  const saida = {};
  for (const campo of campos) {
    if (corpo && Object.prototype.hasOwnProperty.call(corpo, campo)) saida[campo] = corpo[campo];
  }
  return saida;
}

function texto(valor, { max = 255, obrigatorio = false, nome = "campo" } = {}) {
  if (valor === undefined || valor === null || String(valor).trim() === "") {
    if (obrigatorio) throw recusar(`Preencha ${nome}.`);
    return null;
  }
  if (typeof valor !== "string" && typeof valor !== "number") throw recusar(`Valor inválido para ${nome}.`);
  const limpo = String(valor).trim().replace(/\s+/g, " ");
  if (limpo.length > max) throw recusar(`${nome} pode ter no máximo ${max} caracteres.`);
  return limpo;
}

function numero(valor, { min = 0, max = 1e9, obrigatorio = false, inteiro = false, nome = "valor" } = {}) {
  if (valor === undefined || valor === null || valor === "") {
    if (obrigatorio) throw recusar(`Informe ${nome}.`);
    return null;
  }
  const convertido = typeof valor === "string" ? Number(valor.replace(",", ".")) : Number(valor);
  if (typeof valor === "boolean" || !Number.isFinite(convertido) || convertido < min || convertido > max || (inteiro && !Number.isInteger(convertido))) {
    throw recusar(`Valor inválido para ${nome}.`);
  }
  return convertido;
}

function booleano(valor) {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

module.exports = { ErroDaLoja, recusar, naoAchou, conflito, rota, escolher, texto, numero, booleano };
