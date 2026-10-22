function campoPix(id, valor) {
  const texto = String(valor);
  return id + String(texto.length).padStart(2, "0") + texto;
}

function crc16(texto) {
  let crc = 0xFFFF;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function textoPix(texto, tamanhoMaximo) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, tamanhoMaximo);
}

function chavePix(chaveDigitada) {
  const chave = String(chaveDigitada || "").trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave)) return chave.toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(chave) && chave.length <= 77) return chave.toLowerCase();

  const numeros = chave.replace(/\D/g, "");
  if (/^\+/.test(chave) && /^55\d{10,11}$/.test(numeros)) return "+" + numeros;
  if (/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(chave) && /^\d{10,11}$/.test(numeros)) return "+55" + numeros;
  if (/^\d{11}$/.test(numeros) || /^\d{14}$/.test(numeros)) return numeros;
  return "";
}

function codigoPix({chave, nome, cidade, valor, txid = "***"}) {
  const conta = campoPix("00", "br.gov.bcb.pix") + campoPix("01", chave);
  let codigo = campoPix("00", "01")
    + campoPix("26", conta)
    + campoPix("52", "0000")
    + campoPix("53", "986");
  if (valor) codigo += campoPix("54", valor.toFixed(2));
  codigo += campoPix("58", "BR")
    + campoPix("59", textoPix(nome, 25) || "ZERO GRAU")
    + campoPix("60", textoPix(cidade, 15) || "FORTALEZA")
    + campoPix("62", campoPix("05", txid));
  codigo += "6304";
  return codigo + crc16(codigo);
}

function gerarReferenciaPix() {
  const referencia = "ZG" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return referencia.toUpperCase().slice(0, 25);
}
