/* ==========================================================================
   ZERO GRAU · código Pix (BR Code)

   O "copia e cola" do Pix é um texto no padrão EMV do Banco Central: campos
   no formato ID (2 dígitos) + tamanho (2 dígitos) + valor, e um CRC16 no fim
   que o banco confere antes de aceitar. É o mesmo texto que vai dentro do QR
   code. Gerado aqui, no navegador, sem servidor: o que chega ao banco do
   cliente é a chave da loja, o valor do pedido e uma referência (txid).

   Pix "estático com valor": o banco mostra nome, cidade e valor para o
   cliente confirmar. O que ele NÃO faz é avisar a loja — sem servidor, quem
   confirma o recebimento é a loja, no extrato, pela referência do pedido.
   ========================================================================== */

const campoEMV = (id, valor) => {
  const v = String(valor);
  return id + String(v.length).padStart(2, "0") + v;
};

/* CRC16-CCITT (polinômio 0x1021, início 0xFFFF), sobre os bytes do texto */
function crc16(texto){
  let crc = 0xFFFF;
  for(const byte of new TextEncoder().encode(texto)){
    crc ^= byte << 8;
    for(let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/* Nome e cidade: sem acento e sem símbolo, no tamanho que o padrão aceita.
   A caixa fica como veio — "Zero Grau" e "ZERO GRAU" são os dois válidos. */
const textoPix = (s, max) => String(s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .replace(/[^A-Za-z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

/* A chave, no formato em que o Pix a registra: telefone com +55, CPF e CNPJ
   só dígitos, e-mail e chave aleatória como vieram. Devolve "" se não for
   nenhum dos cinco tipos. */
function chavePix(bruta){
  const c = String(bruta || "").trim();
  if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)) return c.toLowerCase();
  if(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) && c.length <= 77) return c.toLowerCase();
  const d = c.replace(/\D/g, "");
  if(/^\+/.test(c) && /^55\d{10,11}$/.test(d)) return "+" + d;
  if(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(c) && /^\d{10,11}$/.test(d)) return "+55" + d;
  if(/^\d{11}$/.test(d) || /^\d{14}$/.test(d)) return d;
  return "";
}

function codigoPix({chave, nome, cidade, valor, txid = "***"}){
  const conta = campoEMV("00", "br.gov.bcb.pix") + campoEMV("01", chave);
  let p = campoEMV("00", "01")
        + campoEMV("26", conta)
        + campoEMV("52", "0000")
        + campoEMV("53", "986")                                   /* real */
        + (valor ? campoEMV("54", valor.toFixed(2)) : "")
        + campoEMV("58", "BR")
        + campoEMV("59", textoPix(nome, 25) || "ZERO GRAU")
        + campoEMV("60", textoPix(cidade, 15) || "FORTALEZA")
        + campoEMV("62", campoEMV("05", txid));
  p += "6304";
  return p + crc16(p);
}

/* Referência do pedido: só letras e números, até 25 — é ela que a loja
   procura no extrato para saber de qual pedido é o Pix. */
const txidPedido = () => ("ZG" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).toUpperCase().slice(0, 25);
