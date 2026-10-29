const BEBIDAS = [
  {sku:"estrella-galicia-330",  marca:"Estrella Galicia",  nome:"Cerveza Especial · lata 330 ml", cat:"cerveja",    foto:"estrella-galicia-330",   forma:"can",    vol:"330 ml", teor:"5,5%",  preco:8.90,   promo:6.90,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:240},
  {sku:"guinness-draught-500",  marca:"Guinness",          nome:"Draught Stout 500 ml",           cat:"cerveja",    foto:"guinness-draught-500",   forma:"can",    vol:"500 ml", teor:"4,2%",  preco:22.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:96},
  {sku:"feldschlosschen-500",   marca:"Feldschlösschen",   nome:"Original 500 ml",                cat:"cerveja",    foto:"feldschlosschen-500",    forma:"can",    vol:"500 ml", teor:"4,8%",  preco:15.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:0},

  {sku:"jack-daniels-1l",       marca:"Jack Daniel's",     nome:"Old No. 7 · 700 ml",             cat:"destilado",  foto:"jack-daniels-1l",        forma:"tall",   vol:"700 ml", teor:"40%",   preco:149.90, promo:null,   gelada:false, retornavel:false,               alcoolica:true,  estoque:14},
  {sku:"absolut-1l",            marca:"Absolut",           nome:"Vodka Original 700 ml",          cat:"destilado",  foto:"absolut-1l",             forma:"tall",   vol:"700 ml", teor:"40%",   preco:69.90,  promo:59.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:52},
  {sku:"absolut-mango-1l",      marca:"Absolut",           nome:"Vodka Mango 750 ml",             cat:"destilado",  foto:"absolut-mango-1l",       forma:"tall",   vol:"750 ml", teor:"38%",   preco:74.90,  promo:64.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:31},
  {sku:"tanqueray-750",         marca:"Tanqueray",         nome:"London Dry Gin 700 ml",          cat:"destilado",  foto:"tanqueray-750",          forma:"tall",   vol:"700 ml", teor:"47,3%", preco:129.90, promo:109.90, gelada:false, retornavel:false,               alcoolica:true,  estoque:21},
  {sku:"no3-gin-700",           marca:"No. 3",             nome:"London Dry Gin 700 ml",          cat:"destilado",  foto:"no3-gin-700",            forma:"tall",   vol:"700 ml", teor:"46%",   preco:189.90, promo:null,   gelada:false, retornavel:false,               alcoolica:true,  estoque:8},
  {sku:"seagrams-gin-700",      marca:"Seagram's",         nome:"Extra Dry Gin 750 ml",           cat:"destilado",  foto:"seagrams-gin-700",       forma:"tall",   vol:"750 ml", teor:"40%",   preco:69.90,  promo:57.90,  gelada:false, retornavel:false,               alcoolica:true,  estoque:64},

  {sku:"martini-rosso-1l",      marca:"Martini",           nome:"Rosso 1 L",                      cat:"vinho",      foto:"martini-rosso-1l",       forma:"tall",   vol:"1 L",    teor:"15%",   preco:64.90,  promo:52.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:26},
  {sku:"coventry-fizz-750",     marca:"Coventry",          nome:"Fizz Elderflower 700 ml",        cat:"vinho",      foto:"coventry-fizz-750",      forma:"tall",   vol:"700 ml", teor:"15%",   preco:39.90,  promo:32.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:37},
  {sku:"smirnoff-ice-275",      marca:"Smirnoff",          nome:"Ice Tropical 275 ml",            cat:"vinho",      foto:"smirnoff-ice-275",       forma:"bottle", vol:"275 ml", teor:"5%",    preco:11.90,  promo:9.90,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:210},

  {sku:"red-bull-250",          marca:"Red Bull",          nome:"Energy Drink 250 ml",            cat:"energetico", foto:"red-bull-250",           forma:"can",    vol:"250 ml", teor:"0%",    preco:9.90,   promo:7.90,   gelada:true,  retornavel:false,               alcoolica:false, estoque:310},
  {sku:"baly-melancia-2l",      marca:"Baly",              nome:"Energy Drink Melancia 2 L",      cat:"energetico", foto:"baly-melancia-2l",       forma:"pet",    vol:"2 L",    teor:"0%",    preco:13.90,  promo:11.90,  gelada:true,  retornavel:false,               alcoolica:false, estoque:180},

  {sku:"coca-cola-2l",          marca:"Coca-Cola",         nome:"Sabor Original 2 L",             cat:"agua",       foto:"coca-cola-2l",           forma:"pet",    vol:"2 L",    teor:"0%",    preco:11.90,  promo:null,   gelada:true,  retornavel:true, casco:2.00,    alcoolica:false, estoque:150}
];

const CATEGORIAS = [
  {id:"cerveja",    nome:"Cervejas",        detalhe:"lata de 330 e 500 ml"},
  {id:"destilado",  nome:"Destilados",      detalhe:"whisky, vodka, gin"},
  {id:"vinho",      nome:"Vinhos e drinks", detalhe:"vermute, fizz, ice"},
  {id:"energetico", nome:"Energéticos",     detalhe:"lata e garrafa de 2 L"},
  {id:"agua",       nome:"Refrigerantes",   detalhe:"garrafa de 2 L"}
];

const CONTATO = {
  whatsapp:  "https://wa.me/5585981494445",
  telefone:  "(85) 3000-0000",
  email:     "oi@zerograu.com.br",
  cnpj:      "00.000.000/0001-00",
  endereco:  "Av. Santos Dumont, 1580",
  bairro:    "Aldeota · Fortaleza / CE",
  instagram: "#",
  facebook:  "#"
};

const PIX = {chave: "", nome: "ZERO GRAU", cidade: "FORTALEZA"};

const HORARIO = {
  fuso: "America/Fortaleza",
  dias: [["10:00","03:00"], ["10:00","03:00"], ["10:00","03:00"], ["10:00","03:00"],
         ["10:00","03:00"], ["10:00","03:00"], ["10:00","03:00"]]
};

const ESTATISTICA = {tipo: "", id: ""};

let TAXA_BASE = 4.90;
let TAXA_KM   = 1.20;
let RAIO_MAX  = 12;

const REGRAS = {
  minimo: 30,
  freteGratis: 120,
  cupom: {codigo:"ZEROGRAU10", desconto:.10, teto:30, minimo:100, validade:"2026-12-31"}
};

const ATACADO = {
  desconto:    0.28,
  minimo:      500,
  freteGratis: 1200,
  prazo:       "Faturado em 28 dias para CNPJ com cadastro aprovado.",
  faixas: [
    {cx: 10, extra: 0.04},
    {cx: 20, extra: 0.07}
  ]
};

const CAIXA_PADRAO = {can: 12, bottle: 12, tall: 6, pet: 6, saco: 4};
const CAIXA_EXCECAO = {
  "coca-cola-2l": 6
};

const ENTREGA = {
  loja: "Aldeota · Fortaleza / CE",

  bairros: {
    "aldeota": 0.8,        "meireles": 1.6,       "dionisio torres": 1.4,
    "joaquim tavora": 2.0, "centro": 3.2,         "praia de iracema": 2.6,
    "varjota": 2.2,        "papicu": 3.6,         "cocó": 3.4,
    "de lourdes": 2.4,     "fatima": 3.0,         "benfica": 4.2,
    "montese": 5.4,        "parquelandia": 5.8,   "messejana": 11.4,
    "sapiranga": 10.2,     "edson queiroz": 7.8,  "parangaba": 6.6,
    "barra do ceara": 9.4, "mucuripe": 3.0,       "cidade dos funcionarios": 8.2,
    "passare": 9.6,        "conjunto ceara": 12.8, "pirambu": 6.4,
    "jardim america": 4.6, "bairro de fatima": 3.0, "praia do futuro": 6.2
  },
  PADRAO_FORTALEZA: 7.5,

  cidades: {
    "fortaleza": null,
    "eusebio": 14.0,       "caucaia": 17.5,       "maracanau": 16.8,
    "aquiraz": 27.0,       "pacatuba": 24.0,      "maranguape": 28.5,
    "itaitinga": 21.0
  }
};


function brl(valor) {
  return valor.toLocaleString("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function semAcento(texto) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function normalizarLugar(nomeDoLugar) {
  return semAcento(String(nomeDoLugar || "")).trim();
}

function alturaSilhueta(volume) {
  const numero = parseFloat(volume.replace(",", "."));
  let mililitros = numero;
  if (/\bL\b/.test(volume)) {
    mililitros = numero * 1000;
  } else if (/kg/.test(volume)) {
    mililitros = numero * 300;
  }
  const proporcao = Math.min(1, Math.max(0, Math.log(mililitros / 250) / Math.log(2000 / 250)));
  return Math.round(140 + proporcao * 46);
}

const FOTOS_PREVIA = {};

function fotoAttrs(foto) {
  const previa = FOTOS_PREVIA[foto];
  if (previa) {
    return `src="${previa[200]}" srcset="${previa[200]} 1x, ${previa[400]} 2x"`;
  }
  if (/^https?:\/\//.test(foto)) return `src="${foto}"`;
  return `src="img/${foto}-200.webp" srcset="img/${foto}-200.webp 1x, img/${foto}-400.webp 2x"`;
}


const DIAS_NOME = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function paraMinutos(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function horaCurta(hora) {
  const horas = Number(hora.slice(0, 2));
  if (hora.endsWith(":00")) return `${horas}h`;
  return `${horas}h${hora.slice(3)}`;
}

function horaLonga(hora) {
  return `${hora.slice(0, 2)}h${hora.slice(3)}`;
}

function agoraNaLoja(quando = new Date()) {
  const formato = new Intl.DateTimeFormat("en-US", {
    timeZone: HORARIO.fuso, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });
  const partes = {};
  for (const parte of formato.formatToParts(quando)) {
    partes[parte.type] = parte.value;
  }
  const diasEmIngles = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    dia: diasEmIngles.indexOf(partes.weekday),
    min: (Number(partes.hour) % 24) * 60 + Number(partes.minute)
  };
}

function passaDaMeiaNoite(turno) {
  return turno && paraMinutos(turno[1]) <= paraMinutos(turno[0]);
}

function situacaoLoja(quando = new Date()) {
  const {dia, min} = agoraNaLoja(quando);
  const turnoDeHoje = HORARIO.dias[dia];
  const turnoDeOntem = HORARIO.dias[(dia + 6) % 7];

  if (turnoDeOntem && passaDaMeiaNoite(turnoDeOntem)
      && paraMinutos(turnoDeOntem[1]) !== paraMinutos(turnoDeOntem[0])
      && min < paraMinutos(turnoDeOntem[1])) {
    return {aberto: true, fecha: turnoDeOntem[1]};
  }

  if (turnoDeHoje) {
    const abre = paraMinutos(turnoDeHoje[0]);
    const fecha = paraMinutos(turnoDeHoje[1]);
    if (abre === fecha) {
      return {aberto: true, fecha: null};
    }
    if (min >= abre && (passaDaMeiaNoite(turnoDeHoje) || min < fecha)) {
      return {aberto: true, fecha: turnoDeHoje[1]};
    }
    if (min < abre) {
      return {aberto: false, abre: {quando: "hoje", hora: turnoDeHoje[0]}};
    }
  }

  for (let diasAFrente = 1; diasAFrente <= 7; diasAFrente++) {
    const proximoDia = (dia + diasAFrente) % 7;
    const turno = HORARIO.dias[proximoDia];
    if (turno) {
      const quando = diasAFrente === 1 ? "amanhã" : DIAS_NOME[proximoDia];
      return {aberto: false, abre: {quando, hora: turno[0]}};
    }
  }
  return {aberto: false, abre: null};
}

function textoQuandoAbre(situacao) {
  if (!situacao.abre) return "sem horário marcado";
  return `abre ${situacao.abre.quando} às ${horaCurta(situacao.abre.hora)}`;
}

function resumoHorario() {
  const ordemDaSemana = [1, 2, 3, 4, 5, 6, 0];
  const jeitoDoTurno = turno => turno ? turno.join("-") : "x";

  const grupos = [];
  for (const dia of ordemDaSemana) {
    const ultimoGrupo = grupos[grupos.length - 1];
    if (ultimoGrupo && jeitoDoTurno(HORARIO.dias[dia]) === jeitoDoTurno(HORARIO.dias[ultimoGrupo.fim])) {
      ultimoGrupo.fim = dia;
    } else {
      grupos.push({inicio: dia, fim: dia});
    }
  }

  const textos = grupos.map(grupo => {
    const primeiro = DIAS_CURTO[grupo.inicio];
    const ultimo = DIAS_CURTO[grupo.fim].toLowerCase();
    let dias;
    if (grupo.inicio === grupo.fim) {
      dias = primeiro;
    } else if (ordemDaSemana.indexOf(grupo.fim) - ordemDaSemana.indexOf(grupo.inicio) === 1) {
      dias = `${primeiro} e ${ultimo}`;
    } else {
      dias = `${primeiro} a ${ultimo}`;
    }

    const turno = HORARIO.dias[grupo.inicio];
    let horas;
    if (!turno) {
      horas = "fechado";
    } else if (paraMinutos(turno[0]) === paraMinutos(turno[1])) {
      horas = "24 horas";
    } else {
      horas = `${horaLonga(turno[0])} – ${horaLonga(turno[1])}`;
    }
    return `${dias} · ${horas}`;
  });

  return textos.join(" · ");
}


const FORMATO_DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function hojeNaLoja(quando = new Date()) {
  const formato = new Intl.DateTimeFormat("en-CA", {timeZone: HORARIO.fuso, year: "numeric", month: "2-digit", day: "2-digit"});
  return formato.format(quando);
}

function dataCurta(dataIso) {
  if (!dataIso) return "";
  return dataIso.split("-").reverse().join("/");
}

function cupomVencido() {
  return !!REGRAS.cupom.validade && hojeNaLoja() > REGRAS.cupom.validade;
}

function descontoCupom(subtotal) {
  const cupom = REGRAS.cupom;
  if (subtotal < cupom.minimo || cupomVencido()) return 0;
  const desconto = subtotal * cupom.desconto;
  if (cupom.teto > 0) return Math.min(desconto, cupom.teto);
  return desconto;
}


function caixaDe(bebida) {
  return CAIXA_EXCECAO[bebida.sku] ?? CAIXA_PADRAO[bebida.forma] ?? 12;
}

function caixasDe(bebida) {
  return Math.floor(bebida.estoque / caixaDe(bebida));
}

function precoAtacado(bebida) {
  return bebida.preco * (1 - ATACADO.desconto);
}

function descontoDaFaixa(totalDeCaixas) {
  let extra = 0;
  for (const faixa of ATACADO.faixas) {
    if (totalDeCaixas >= faixa.cx) extra = faixa.extra;
  }
  return extra;
}


const AJUSTE_VERSAO = 1;
const RASCUNHO_CHAVE = "zg-admin-rascunho";
const FORMAS = ["can", "bottle", "tall", "pet", "saco"];
const LINK_WHATSAPP = /^https:\/\/wa\.me\/55\d{10,11}$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function numeroValido(valor, minimo = 0, maximo = Infinity) {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= minimo && valor <= maximo;
}

function textoPreenchido(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function turnoValido(turno) {
  return Array.isArray(turno) && turno.length === 2 && FORMATO_HORA.test(turno[0]) && FORMATO_HORA.test(turno[1]);
}

function produtoDe(bebida) {
  if (!bebida || !textoPreenchido(bebida.sku) || !textoPreenchido(bebida.marca) || !textoPreenchido(bebida.nome)) return null;
  if (!CATEGORIAS.some(categoria => categoria.id === bebida.cat) || !FORMAS.includes(bebida.forma)) return null;
  if (!numeroValido(bebida.preco, 0.01) || !numeroValido(bebida.estoque) || !Number.isInteger(bebida.estoque)) return null;

  const promo = numeroValido(bebida.promo, 0.01) && bebida.promo < bebida.preco ? bebida.promo : null;
  const casco = bebida.retornavel && numeroValido(bebida.casco, 0.01) ? bebida.casco : null;

  const produto = {
    sku: bebida.sku.trim(),
    marca: bebida.marca.trim(),
    nome: bebida.nome.trim(),
    cat: bebida.cat,
    foto: textoPreenchido(bebida.foto) ? bebida.foto.trim() : "",
    forma: bebida.forma,
    vol: textoPreenchido(bebida.vol) ? bebida.vol.trim() : "—",
    teor: textoPreenchido(bebida.teor) ? bebida.teor.trim() : "—",
    preco: bebida.preco,
    promo,
    gelada: !!bebida.gelada,
    retornavel: casco !== null
  };
  if (casco !== null) produto.casco = casco;
  produto.alcoolica = !!bebida.alcoolica;
  produto.estoque = bebida.estoque;
  return produto;
}

function estadoAtual() {
  return {
    versao: AJUSTE_VERSAO,
    bebidas: BEBIDAS.map(bebida => ({...bebida})),
    varejo: {
      minimo: REGRAS.minimo,
      freteGratis: REGRAS.freteGratis,
      cupom: {...REGRAS.cupom},
      taxaBase: TAXA_BASE,
      taxaKm: TAXA_KM,
      raioMax: RAIO_MAX
    },
    atacado: {
      desconto: ATACADO.desconto,
      minimo: ATACADO.minimo,
      freteGratis: ATACADO.freteGratis,
      prazo: ATACADO.prazo,
      faixas: ATACADO.faixas.map(faixa => ({...faixa}))
    },
    caixaPadrao: {...CAIXA_PADRAO},
    caixaExcecao: {...CAIXA_EXCECAO},
    contato: {...CONTATO},
    pix: {...PIX},
    horario: {dias: HORARIO.dias.map(turno => turno ? [...turno] : null)},
    estatistica: {...ESTATISTICA}
  };
}

function aplicarProdutos(listaRecebida) {
  if (!Array.isArray(listaRecebida)) return;
  const produtos = listaRecebida.map(produtoDe).filter(Boolean);
  const skus = new Set(produtos.map(produto => produto.sku));
  if (produtos.length && skus.size === produtos.length) {
    BEBIDAS.splice(0, BEBIDAS.length, ...produtos);
  }
}

function aplicarVarejo(varejo) {
  if (numeroValido(varejo.minimo)) REGRAS.minimo = varejo.minimo;
  if (numeroValido(varejo.freteGratis)) REGRAS.freteGratis = varejo.freteGratis;

  const cupom = varejo.cupom;
  if (cupom) {
    if (textoPreenchido(cupom.codigo)) REGRAS.cupom.codigo = cupom.codigo.trim().toUpperCase();
    if (numeroValido(cupom.desconto, 0.01, 0.9)) REGRAS.cupom.desconto = cupom.desconto;
    if (numeroValido(cupom.minimo)) REGRAS.cupom.minimo = cupom.minimo;
    if (numeroValido(cupom.teto)) REGRAS.cupom.teto = cupom.teto;
    if (cupom.validade === "" || (typeof cupom.validade === "string" && FORMATO_DATA.test(cupom.validade))) {
      REGRAS.cupom.validade = cupom.validade;
    }
  }

  if (numeroValido(varejo.taxaBase)) TAXA_BASE = varejo.taxaBase;
  if (numeroValido(varejo.taxaKm)) TAXA_KM = varejo.taxaKm;
  if (numeroValido(varejo.raioMax, 0.5)) RAIO_MAX = varejo.raioMax;
}

function aplicarAtacado(atacado) {
  if (numeroValido(atacado.desconto, 0, 0.9)) ATACADO.desconto = atacado.desconto;
  if (numeroValido(atacado.minimo)) ATACADO.minimo = atacado.minimo;
  if (numeroValido(atacado.freteGratis)) ATACADO.freteGratis = atacado.freteGratis;
  if (textoPreenchido(atacado.prazo)) ATACADO.prazo = atacado.prazo.trim();

  if (Array.isArray(atacado.faixas)) {
    const faixas = atacado.faixas
      .filter(faixa => faixa && Number.isInteger(faixa.cx) && faixa.cx > 0 && numeroValido(faixa.extra, 0, 0.5))
      .sort((primeira, segunda) => primeira.cx - segunda.cx);
    ATACADO.faixas.splice(0, ATACADO.faixas.length, ...faixas);
  }
}

function aplicarCaixas(caixaPadrao, caixaExcecao) {
  for (const forma of FORMAS) {
    const unidades = caixaPadrao?.[forma];
    if (Number.isInteger(unidades) && unidades > 0) CAIXA_PADRAO[forma] = unidades;
  }

  if (caixaExcecao && typeof caixaExcecao === "object") {
    for (const sku of Object.keys(CAIXA_EXCECAO)) {
      delete CAIXA_EXCECAO[sku];
    }
    for (const [sku, unidades] of Object.entries(caixaExcecao)) {
      if (Number.isInteger(unidades) && unidades > 0) CAIXA_EXCECAO[sku] = unidades;
    }
  }
}

function aplicarContato(contato) {
  if (typeof contato.whatsapp === "string" && LINK_WHATSAPP.test(contato.whatsapp)) {
    CONTATO.whatsapp = contato.whatsapp;
  }
  for (const campo of ["telefone", "email", "cnpj", "endereco", "bairro"]) {
    if (textoPreenchido(contato[campo]) && contato[campo].length <= 120) CONTATO[campo] = contato[campo].trim();
  }
  for (const rede of ["instagram", "facebook"]) {
    const link = contato[rede];
    if (link === "#" || (typeof link === "string" && /^https:\/\/\S+$/.test(link))) CONTATO[rede] = link;
  }
}

function aplicarPix(pix) {
  if (typeof pix.chave === "string" && pix.chave.length <= 77) PIX.chave = pix.chave.trim();
  if (textoPreenchido(pix.nome) && pix.nome.length <= 25) PIX.nome = pix.nome.trim();
  if (textoPreenchido(pix.cidade) && pix.cidade.length <= 15) PIX.cidade = pix.cidade.trim();
}

function aplicarHorario(dias) {
  if (Array.isArray(dias) && dias.length === 7 && dias.every(turno => turno === null || turnoValido(turno))) {
    HORARIO.dias.splice(0, 7, ...dias.map(turno => turno ? [...turno] : null));
  }
}

function aplicarEstatistica(estatistica) {
  if (estatistica.tipo === "") {
    Object.assign(ESTATISTICA, {tipo: "", id: ""});
  }
  if (estatistica.tipo === "ga4" && /^G-[A-Z0-9]{4,14}$/.test(estatistica.id)) {
    Object.assign(ESTATISTICA, {tipo: "ga4", id: estatistica.id});
  }
  if (estatistica.tipo === "plausible" && /^[a-z0-9.-]{3,120}$/.test(estatistica.id)) {
    Object.assign(ESTATISTICA, {tipo: "plausible", id: estatistica.id});
  }
}

function aplicarAjustes(ajustes) {
  if (!ajustes || ajustes.versao !== AJUSTE_VERSAO) return false;
  aplicarProdutos(ajustes.bebidas);
  aplicarVarejo(ajustes.varejo || {});
  aplicarAtacado(ajustes.atacado || {});
  aplicarCaixas(ajustes.caixaPadrao, ajustes.caixaExcecao);
  aplicarContato(ajustes.contato || {});
  aplicarPix(ajustes.pix || {});
  aplicarHorario(ajustes.horario?.dias);
  aplicarEstatistica(ajustes.estatistica || {});
  return true;
}

const RASCUNHO = {
  ler() {
    try {
      return JSON.parse(localStorage.getItem(RASCUNHO_CHAVE) || "null");
    } catch {
      return null;
    }
  },
  gravar(rascunho) {
    try {
      localStorage.setItem(RASCUNHO_CHAVE, JSON.stringify(rascunho));
      return true;
    } catch {
      return false;
    }
  },
  limpar() {
    try {
      localStorage.removeItem(RASCUNHO_CHAVE);
    } catch {}
  }
};

function fotoNovaValida(nome, foto) {
  const webp = /^data:image\/webp;base64,/;
  return /^[a-z0-9-]+$/.test(nome) && webp.test(foto?.[200] || "") && webp.test(foto?.[400] || "");
}

const ESTADO_BASE = estadoAtual();

if (typeof AJUSTES_PUBLICADOS !== "undefined") aplicarAjustes(AJUSTES_PUBLICADOS);

const rascunhoDaLoja = document.body?.dataset.publico !== "admin" ? RASCUNHO.ler() : null;
const emPrevia = aplicarAjustes(rascunhoDaLoja);

if (emPrevia && rascunhoDaLoja.fotosNovas && typeof rascunhoDaLoja.fotosNovas === "object") {
  for (const [nome, foto] of Object.entries(rascunhoDaLoja.fotosNovas)) {
    if (fotoNovaValida(nome, foto)) FOTOS_PREVIA[nome] = foto;
  }
}

if (emPrevia) {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="previa" role="status">
      <b>Prévia do rascunho</b>
      <span>só neste navegador</span>
      <a href="admin.html">Voltar ao painel</a>
    </div>`);
}

function textoAlternativo(bebida) {
  const nome = `${bebida.marca} ${bebida.nome}`.trim();
  const temVolume = bebida.vol && bebida.vol !== "—" && semAcento(nome).includes(semAcento(bebida.vol));
  return temVolume || !bebida.vol || bebida.vol === "—" ? nome : `${nome}, ${bebida.vol}`;
}
