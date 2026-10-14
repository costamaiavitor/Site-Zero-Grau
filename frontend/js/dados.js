/* ==========================================================================
   ZERO GRAU · catálogo, contato e regras de venda

   Fonte única das duas frentes: o varejo (index.html) e o atacado
   (atacado.html) leem daqui. Duplicar a lista de produtos entre as duas
   páginas seria garantir que um dia elas discordassem sobre o que está em
   estoque, e o cliente veria preço de um lugar e disponibilidade do outro.
   ========================================================================== */

/* ---------- 1. ESTOQUE ----------
   sku:   identidade do produto. É a chave do carrinho e do localStorage, e
          existe separada de `foto` de propósito: a foto pode faltar, mudar de
          nome ou chegar depois, e nada disso pode mexer no que o cliente já
          colocou no carrinho.
   cat:   a categoria de verdade — cada aba da vitrine e cada card de categoria
          da home apontam para uma destas, sem apelido e sem agrupamento
          escondido.
   forma: bottle (long neck) · can (lata) · tall (destilado/vinho) · pet
          (garrafão) · saco (gelo/carvão). É a silhueta de reserva.
   foto:  nome-base do arquivo em img/. O card monta img/<foto>-200.webp e
          img/<foto>-400.webp; se não existir, cai na silhueta — dá para ir
          subindo as fotos uma a uma sem quebrar nada. */
const BEBIDAS = [
  {sku:"estrella-galicia-330",  marca:"Estrella Galicia",  nome:"Cerveza Especial · lata 330 ml", cat:"cerveja",    foto:"estrella-galicia-330",   forma:"can",    vol:"330 ml", teor:"5,5%",  preco:8.90,   promo:6.90,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:240},
  {sku:"guinness-draught-500",  marca:"Guinness",          nome:"Draught Stout 500 ml",           cat:"cerveja",    foto:"guinness-draught-500",   forma:"can",    vol:"500 ml", teor:"4,2%",  preco:22.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:96},
  {sku:"feldschlosschen-500",   marca:"Feldschlösschen",   nome:"Original 500 ml",                cat:"cerveja",    foto:"feldschlosschen-500",    forma:"can",    vol:"500 ml", teor:"4,8%",  preco:15.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:0},

  {sku:"jack-daniels-1l",       marca:"Jack Daniel's",     nome:"Old No. 7 · 700 ml",                cat:"destilado",  foto:"jack-daniels-1l",        forma:"tall",   vol:"700 ml",    teor:"40%",   preco:149.90, promo:null,   gelada:false, retornavel:false,               alcoolica:true,  estoque:14},
  {sku:"absolut-1l",            marca:"Absolut",           nome:"Vodka Original 700 ml",             cat:"destilado",  foto:"absolut-1l",             forma:"tall",   vol:"700 ml",    teor:"40%",   preco:69.90,  promo:59.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:52},
  {sku:"absolut-mango-1l",      marca:"Absolut",           nome:"Vodka Mango 750 ml",                cat:"destilado",  foto:"absolut-mango-1l",       forma:"tall",   vol:"750 ml",    teor:"38%",   preco:74.90,  promo:64.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:31},
  {sku:"tanqueray-750",         marca:"Tanqueray",         nome:"London Dry Gin 700 ml",          cat:"destilado",  foto:"tanqueray-750",          forma:"tall",   vol:"700 ml", teor:"47,3%", preco:129.90, promo:109.90, gelada:false, retornavel:false,               alcoolica:true,  estoque:21},
  {sku:"no3-gin-700",           marca:"No. 3",             nome:"London Dry Gin 700 ml",          cat:"destilado",  foto:"no3-gin-700",            forma:"tall",   vol:"700 ml", teor:"46%",   preco:189.90, promo:null,   gelada:false, retornavel:false,               alcoolica:true,  estoque:8},
  {sku:"seagrams-gin-700",      marca:"Seagram's",         nome:"Extra Dry Gin 750 ml",           cat:"destilado",  foto:"seagrams-gin-700",       forma:"tall",   vol:"750 ml", teor:"40%",   preco:69.90,  promo:57.90,  gelada:false, retornavel:false,               alcoolica:true,  estoque:64},

  {sku:"martini-rosso-1l",      marca:"Martini",           nome:"Rosso 1 L",                      cat:"vinho",      foto:"martini-rosso-1l",       forma:"tall",   vol:"1 L",    teor:"15%",   preco:64.90,  promo:52.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:26},
  {sku:"coventry-fizz-750",     marca:"Coventry",          nome:"Fizz Elderflower 700 ml",        cat:"vinho",      foto:"coventry-fizz-750",      forma:"tall",   vol:"700 ml", teor:"15%",  preco:39.90,  promo:32.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:37},
  {sku:"smirnoff-ice-275",      marca:"Smirnoff",          nome:"Ice Tropical 275 ml",            cat:"vinho",      foto:"smirnoff-ice-275",       forma:"bottle", vol:"275 ml", teor:"5%",    preco:11.90,  promo:9.90,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:210},

  {sku:"red-bull-250",          marca:"Red Bull",          nome:"Energy Drink 250 ml",            cat:"energetico", foto:"red-bull-250",           forma:"can",    vol:"250 ml", teor:"0%",    preco:9.90,   promo:7.90,   gelada:true,  retornavel:false,               alcoolica:false, estoque:310},
  {sku:"baly-melancia-2l",      marca:"Baly",              nome:"Energy Drink Melancia 2 L",      cat:"energetico", foto:"baly-melancia-2l",       forma:"pet",    vol:"2 L",    teor:"0%",    preco:13.90,  promo:11.90,  gelada:true,  retornavel:false,               alcoolica:false, estoque:180},

  {sku:"coca-cola-2l",          marca:"Coca-Cola",         nome:"Sabor Original 2 L",             cat:"agua",       foto:"coca-cola-2l",           forma:"pet",    vol:"2 L",    teor:"0%",    preco:11.90,  promo:null,   gelada:true,  retornavel:true, casco:2.00,    alcoolica:false, estoque:150}
];

/* Rótulo de cada categoria, na ordem em que aparecem nas abas e nos cards.
   É a única lista de categorias do site: abas, cards da home e contagens
   saem toda daqui, então não há como uma discordar da outra. */
const CATEGORIAS = [
  {id:"cerveja",    nome:"Cervejas",              detalhe:"lata de 330 e 500 ml"},
  {id:"destilado",  nome:"Destilados",            detalhe:"whisky, vodka, gin"},
  {id:"vinho",      nome:"Vinhos e drinks",       detalhe:"vermute, fizz, ice"},
  {id:"energetico", nome:"Energéticos",           detalhe:"lata e garrafa de 2 L"},
  {id:"agua",       nome:"Refrigerantes",         detalhe:"garrafa de 2 L"}
];

/* ---------- CONTATO ----------
   O WhatsApp é o real da loja: (85) 98149-4445. ⚠ O resto ainda é VALOR DE
   EXEMPLO — trocar pelos reais antes de publicar.
   Tudo o que identifica a loja mora aqui e é escrito na página pelo script,
   para que trocar o número não vire uma caça a string espalhada pelo HTML.
   O mesmo vale para o CNPJ e o endereço no rodapé. */
const CONTATO = {
  whatsapp:  "https://wa.me/5585981494445",   /* (85) 98149-4445: 55 + DDD + número, sem símbolos */
  telefone:  "(85) 3000-0000",
  email:     "oi@zerograu.com.br",
  cnpj:      "00.000.000/0001-00",
  endereco:  "Av. Santos Dumont, 1580",
  bairro:    "Aldeota · Fortaleza / CE",
  instagram: "#",
  facebook:  "#"
};

/* ---------- PIX ----------
   Para o "pagar com Pix pelo site" do carrinho. Chave vazia = a opção não
   aparece e o cliente fecha pelo WhatsApp, como antes — melhor não oferecer
   do que gerar um Pix para uma chave que não é da loja. Preenche-se pelo
   painel (aba Loja). `nome` e `cidade` vão dentro do código Pix e o banco
   do cliente mostra os dois na hora de confirmar: até 25 e 15 caracteres,
   sem acento, é o que o padrão do Banco Central aceita. */
const PIX = {chave: "", nome: "ZERO GRAU", cidade: "FORTALEZA"};

/* ---------- HORÁRIO ----------
   Um turno por dia da semana, de domingo (0) a sábado (6): [abre, fecha] em
   "HH:MM", ou null para fechado. Fechar antes de abrir quer dizer que o turno
   passa da meia-noite (10:00 → 03:00). Abrir e fechar na mesma hora = 24 h.
   O relógio é o de Fortaleza, não o do aparelho do cliente. */
const HORARIO = {
  fuso: "America/Fortaleza",
  dias: [["10:00","03:00"], ["10:00","03:00"], ["10:00","03:00"], ["10:00","03:00"],
         ["10:00","03:00"], ["10:00","03:00"], ["10:00","03:00"]]
};

/* ---------- ESTATÍSTICA ----------
   tipo "" = desligada (nada é carregado). "plausible" usa o domínio do site
   como id e não põe cookie; "ga4" usa o id G-XXXXXXX do Google Analytics e,
   por usar cookie, só liga depois que o visitante aceita. */
const ESTATISTICA = {tipo: "", id: ""};

/* ---------- a loja está aberta? ----------
   Tudo em minutos desde a meia-noite, no fuso da loja. Um turno que passa da
   meia-noite continua valendo na madrugada do dia seguinte: sábado às 01h30,
   com sexta 10:00 → 03:00, a loja está aberta pelo turno de sexta. */
const DIAS_NOME = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const minutos = h => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
const horaTxt = h => h.endsWith(":00") ? `${+h.slice(0, 2)}h` : `${+h.slice(0, 2)}h${h.slice(3)}`;
const horaLonga = h => `${h.slice(0, 2)}h${h.slice(3)}`;           /* "03h00", como no resto do site */

function agoraNaLoja(quando = new Date()){
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: HORARIO.fuso, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(quando).map(x => [x.type, x.value]));
  return {dia: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(p.weekday), min: (+p.hour % 24) * 60 + +p.minute};
}

function situacaoLoja(quando = new Date()){
  const {dia, min} = agoraNaLoja(quando);
  const hoje = HORARIO.dias[dia], ontem = HORARIO.dias[(dia + 6) % 7];
  const vira = d => d && minutos(d[1]) <= minutos(d[0]);     /* passa da meia-noite (ou 24 h) */

  if(ontem && vira(ontem) && minutos(ontem[1]) !== minutos(ontem[0]) && min < minutos(ontem[1]))
    return {aberto: true, fecha: ontem[1]};
  if(hoje){
    const a = minutos(hoje[0]), f = minutos(hoje[1]);
    if(a === f) return {aberto: true, fecha: null};          /* 24 horas */
    if(min >= a && (vira(hoje) || min < f)) return {aberto: true, fecha: hoje[1]};
    if(min < a) return {aberto: false, abre: {quando: "hoje", hora: hoje[0]}};
  }
  for(let i = 1; i <= 7; i++){
    const d = HORARIO.dias[(dia + i) % 7];
    if(d) return {aberto: false, abre: {quando: i === 1 ? "amanhã" : DIAS_NOME[(dia + i) % 7], hora: d[0]}};
  }
  return {aberto: false, abre: null};                        /* fechada a semana toda */
}

/* "abre hoje às 10h" / "abre sexta às 10h30" */
const abreTxt = s => s.abre ? `abre ${s.abre.quando} às ${horaTxt(s.abre.hora)}` : "sem horário marcado";

/* "Seg a dom · 10h00 – 03h00", juntando dias seguidos com o mesmo turno */
function resumoHorario(){
  const ordem = [1, 2, 3, 4, 5, 6, 0];                       /* a semana começa na segunda */
  const chave = d => d ? d.join("-") : "x";
  const grupos = [];
  for(const i of ordem){
    const g = grupos[grupos.length - 1];
    if(g && chave(HORARIO.dias[i]) === chave(HORARIO.dias[g.fim])) g.fim = i;
    else grupos.push({ini: i, fim: i});
  }
  return grupos.map(g => {
    const nome = g.ini === g.fim ? DIAS_CURTO[g.ini]
               : ordem.indexOf(g.fim) - ordem.indexOf(g.ini) === 1 ? `${DIAS_CURTO[g.ini]} e ${DIAS_CURTO[g.fim].toLowerCase()}`
               : `${DIAS_CURTO[g.ini]} a ${DIAS_CURTO[g.fim].toLowerCase()}`;
    const d = HORARIO.dias[g.ini];
    return `${nome} · ${d ? (minutos(d[0]) === minutos(d[1]) ? "24 horas" : `${horaLonga(d[0])} – ${horaLonga(d[1])}`) : "fechado"}`;
  }).join(" · ");
}

/* taxa de entrega. `let` e não `const` porque o painel de administração
   pode mudá-las (ver AJUSTES, no fim do arquivo). */
let TAXA_BASE = 4.90;
let TAXA_KM   = 1.20;
let RAIO_MAX  = 12;

const brl = v => v.toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
const $   = id => document.getElementById(id);

/* "Água" e "agua" têm de achar a mesma coisa. Tira o acento por decomposição
   e joga para minúscula: vale para o que o cliente digita e para o texto do
   card, então os dois lados se encontram no meio. */
const semAcento = s => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/* Altura da silhueta em função do volume, para que a estante fique proporcional.
   Escala logarítmica: na prateleira uma garrafa de 2 L não é oito vezes maior
   que uma lata de 250 ml. */
function alturaSilhueta(vol){
  const n = parseFloat(vol.replace(",", "."));
  const ml = /\bL\b/.test(vol) ? n * 1000
           : /kg/.test(vol)    ? n * 300   /* saco de gelo, aproximado pelo volume ocupado */
           : n;
  const t = Math.min(1, Math.max(0, Math.log(ml / 250) / Math.log(2000 / 250)));
  return Math.round(140 + t * 46);
}

/* A foto ocupa sempre a mesma altura na tela (o .card-art é fixo), então o que
   muda de aparelho para aparelho é só a densidade — daí descritor x, e não w.
   Foto que ainda não foi publicada (subida pelo painel, só no rascunho) vem de
   FOTOS_PREVIA, como data URL, para a prévia não mostrar imagem quebrada. */
const FOTOS_PREVIA = {};
function fotoAttrs(foto){
  const p = FOTOS_PREVIA[foto];
  if(p) return `src="${p[200]}" srcset="${p[200]} 1x, ${p[400]} 2x"`;
  return `src="img/${foto}-200.webp" srcset="img/${foto}-200.webp 1x, img/${foto}-400.webp 2x"`;
}

/* ---------- VAREJO ---------- */
const REGRAS = {
  minimo: 30,          /* pedido mínimo, em reais */
  freteGratis: 120,    /* acima disso a entrega sai de graça */
  cupom: {codigo:"PRIMEIRAGELADA", desconto:.15, minimo:60}
};


/* ---------- ATACADO ----------
   A venda para CNPJ é por caixa fechada, nunca por unidade: é o que separa
   distribuidora de mercearia, e é o que justifica o preço menor.

   `desconto` incide sobre o preço cheio de varejo, não sobre a promoção —
   promoção de varejo é isca de fim de semana e não tem por que valer para
   quem compra vinte caixas. As faixas somam em cima disso, por volume no
   pedido inteiro.

   ⚠ Números de exemplo, como o resto do catálogo. */
const ATACADO = {
  desconto:    0.28,
  minimo:      500,      /* pedido mínimo, em reais */
  freteGratis: 1200,
  prazo:       "Faturado em 28 dias para CNPJ com cadastro aprovado.",
  faixas: [              /* desconto extra por caixas no pedido */
    {cx: 10, extra: 0.04},
    {cx: 20, extra: 0.07}
  ]
};

/* Unidades por caixa. O padrão vem da forma da embalagem, que é o que decide
   na prática; a exceção existe porque garrafão e saco não seguem a regra da
   garrafa e da lata. */
const CAIXA_PADRAO = {can: 12, bottle: 12, tall: 6, pet: 6, saco: 4};
const CAIXA_EXCECAO = {
  "coca-cola-2l": 6
};

const caixaDe   = b => CAIXA_EXCECAO[b.sku] ?? CAIXA_PADRAO[b.forma] ?? 12;
const caixasDe  = b => Math.floor(b.estoque / caixaDe(b));
const precoAtacado = b => b.preco * (1 - ATACADO.desconto);

/* desconto extra da faixa em que o pedido caiu, por número de caixas */
function faixaDe(caixas){
  let extra = 0;
  for(const f of ATACADO.faixas) if(caixas >= f.cx) extra = f.extra;
  return extra;
}

/* ---------- ENTREGA ----------
   O CEP é conferido no ViaCEP, que é a base dos Correios exposta de graça e
   sem chave. É de lá que vêm cidade e bairro; a distância sai da tabela
   abaixo. Antes disso a distância era derivada dos três últimos dígitos do
   CEP — um número inventado com cara de cálculo, que mandaria alguém pagar
   frete errado ou ouvir "fora do raio" morando a dois quarteirões.

   ⚠ Os quilômetros são estimativas a partir do endereço da loja, que também é
   exemplo. Quem for publicar mede os seus e troca só esta tabela: é o único
   lugar do site que decide quanto custa chegar em cada bairro.

   Bairro que não estiver na lista cai em `PADRAO_FORTALEZA`; cidade que não
   estiver em `CIDADES` fica fora do raio, e aí é retirada no balcão. */
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
    "fortaleza": null,     /* null = usa a tabela de bairros */
    "eusebio": 14.0,       "caucaia": 17.5,       "maracanau": 16.8,
    "aquiraz": 27.0,       "pacatuba": 24.0,      "maranguape": 28.5,
    "itaitinga": 21.0
  }
};

/* "Fátima" e "fatima" são o mesmo bairro; o ViaCEP devolve com acento. */
const chaveLugar = s => semAcento(String(s || "")).trim();


/* ==========================================================================
   AJUSTES DO PAINEL (admin.html)

   Três camadas, nesta ordem, e só esta função as aplica:

   1. O que está escrito acima neste arquivo — a base.
   2. AJUSTES_PUBLICADOS, de js/ajustes.js, que é o arquivo que o botão
      "Publicar" do painel gera. Subido no repositório, vale para todo mundo.
   3. O rascunho do painel, no localStorage. Vale só no navegador de quem
      está editando, e a loja mostra um aviso de prévia enquanto ele existir.
      O painel em si não aplica o rascunho: ele precisa ver o publicado para
      saber o que mudou.

   Os ajustes são um retrato inteiro do que o painel edita, não uma lista de
   diferenças: o que chega substitui o que havia. Tudo é conferido na entrada
   — número tem de ser número, fração tem de estar entre 0 e 1 —, porque o
   rascunho mora num lugar que qualquer um edita pelo console, e um valor
   torto aqui derrubaria a loja inteira.
   ========================================================================== */
const AJUSTE_VERSAO  = 1;
const RASCUNHO_CHAVE = "zg-admin-rascunho";
const FORMAS = ["can", "bottle", "tall", "pet", "saco"];

const numOk  = (v, min = 0, max = Infinity) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const textoOk = v => typeof v === "string" && v.trim().length > 0;

/* Um produto vindo de fora só entra se tiver o que o card precisa para ser
   desenhado; o resto dos campos cai no padrão. */
function produtoDe(b){
  if(!b || !textoOk(b.sku) || !textoOk(b.marca) || !textoOk(b.nome)) return null;
  if(!CATEGORIAS.some(c => c.id === b.cat) || !FORMAS.includes(b.forma)) return null;
  if(!numOk(b.preco, 0.01) || !numOk(b.estoque) || !Number.isInteger(b.estoque)) return null;
  const promo = numOk(b.promo, 0.01) && b.promo < b.preco ? b.promo : null;
  const casco = b.retornavel && numOk(b.casco, 0.01) ? b.casco : null;
  return {
    sku: b.sku.trim(), marca: b.marca.trim(), nome: b.nome.trim(), cat: b.cat,
    foto: textoOk(b.foto) ? b.foto.trim() : "", forma: b.forma,
    vol: textoOk(b.vol) ? b.vol.trim() : "—", teor: textoOk(b.teor) ? b.teor.trim() : "—",
    preco: b.preco, promo, gelada: !!b.gelada,
    retornavel: casco !== null, ...(casco !== null ? {casco} : {}),
    alcoolica: !!b.alcoolica, estoque: b.estoque
  };
}

/* O retrato do que o painel edita, no estado em que está agora. */
function estadoAtual(){
  return {
    versao: AJUSTE_VERSAO,
    bebidas: BEBIDAS.map(b => ({...b})),
    varejo: {
      minimo: REGRAS.minimo, freteGratis: REGRAS.freteGratis,
      cupom: {...REGRAS.cupom},
      taxaBase: TAXA_BASE, taxaKm: TAXA_KM, raioMax: RAIO_MAX
    },
    atacado: {
      desconto: ATACADO.desconto, minimo: ATACADO.minimo, freteGratis: ATACADO.freteGratis,
      prazo: ATACADO.prazo, faixas: ATACADO.faixas.map(f => ({...f}))
    },
    caixaPadrao: {...CAIXA_PADRAO},
    caixaExcecao: {...CAIXA_EXCECAO},
    contato: {...CONTATO},
    pix: {...PIX},
    horario: {dias: HORARIO.dias.map(d => d ? [...d] : null)},
    estatistica: {...ESTATISTICA}
  };
}

function aplicarAjustes(a){
  if(!a || a.versao !== AJUSTE_VERSAO) return false;

  if(Array.isArray(a.bebidas)){
    const lista = a.bebidas.map(produtoDe).filter(Boolean);
    const skus = new Set(lista.map(b => b.sku));
    if(lista.length && skus.size === lista.length) BEBIDAS.splice(0, BEBIDAS.length, ...lista);
  }

  const v = a.varejo || {};
  if(numOk(v.minimo))          REGRAS.minimo = v.minimo;
  if(numOk(v.freteGratis))     REGRAS.freteGratis = v.freteGratis;
  if(v.cupom){
    if(textoOk(v.cupom.codigo))            REGRAS.cupom.codigo = v.cupom.codigo.trim().toUpperCase();
    if(numOk(v.cupom.desconto, 0.01, 0.9)) REGRAS.cupom.desconto = v.cupom.desconto;
    if(numOk(v.cupom.minimo))              REGRAS.cupom.minimo = v.cupom.minimo;
  }
  if(numOk(v.taxaBase))        TAXA_BASE = v.taxaBase;
  if(numOk(v.taxaKm))          TAXA_KM = v.taxaKm;
  if(numOk(v.raioMax, 0.5))    RAIO_MAX = v.raioMax;

  const at = a.atacado || {};
  if(numOk(at.desconto, 0, 0.9)) ATACADO.desconto = at.desconto;
  if(numOk(at.minimo))           ATACADO.minimo = at.minimo;
  if(numOk(at.freteGratis))      ATACADO.freteGratis = at.freteGratis;
  if(textoOk(at.prazo))          ATACADO.prazo = at.prazo.trim();
  if(Array.isArray(at.faixas)){
    const faixas = at.faixas
      .filter(f => f && Number.isInteger(f.cx) && f.cx > 0 && numOk(f.extra, 0, 0.5))
      .sort((x, y) => x.cx - y.cx);
    ATACADO.faixas.splice(0, ATACADO.faixas.length, ...faixas);
  }

  for(const f of FORMAS){
    const n = a.caixaPadrao?.[f];
    if(Number.isInteger(n) && n > 0) CAIXA_PADRAO[f] = n;
  }
  if(a.caixaExcecao && typeof a.caixaExcecao === "object"){
    for(const k of Object.keys(CAIXA_EXCECAO)) delete CAIXA_EXCECAO[k];
    for(const [sku, n] of Object.entries(a.caixaExcecao))
      if(Number.isInteger(n) && n > 0) CAIXA_EXCECAO[sku] = n;
  }

  /* Contato: cada campo com o formato que o site sabe usar. Um link de
     WhatsApp torto quebraria o fechamento de todos os pedidos. */
  const ct = a.contato || {};
  if(typeof ct.whatsapp === "string" && ZAP_OK.test(ct.whatsapp)) CONTATO.whatsapp = ct.whatsapp;
  for(const k of ["telefone", "email", "cnpj", "endereco", "bairro"])
    if(textoOk(ct[k]) && ct[k].length <= 120) CONTATO[k] = ct[k].trim();
  for(const k of ["instagram", "facebook"])
    if(ct[k] === "#" || (typeof ct[k] === "string" && /^https:\/\/\S+$/.test(ct[k]))) CONTATO[k] = ct[k];

  const px = a.pix || {};
  if(typeof px.chave === "string" && px.chave.length <= 77) PIX.chave = px.chave.trim();
  if(textoOk(px.nome) && px.nome.length <= 25)   PIX.nome = px.nome.trim();
  if(textoOk(px.cidade) && px.cidade.length <= 15) PIX.cidade = px.cidade.trim();

  const dias = a.horario?.dias;
  if(Array.isArray(dias) && dias.length === 7 && dias.every(d => d === null || turnoOk(d)))
    HORARIO.dias.splice(0, 7, ...dias.map(d => d ? [...d] : null));

  const es = a.estatistica || {};
  if(es.tipo === "")                                             Object.assign(ESTATISTICA, {tipo: "", id: ""});
  if(es.tipo === "ga4" && /^G-[A-Z0-9]{4,14}$/.test(es.id))      Object.assign(ESTATISTICA, {tipo: "ga4", id: es.id});
  if(es.tipo === "plausible" && /^[a-z0-9.-]{3,120}$/.test(es.id)) Object.assign(ESTATISTICA, {tipo: "plausible", id: es.id});
  return true;
}

const ZAP_OK  = /^https:\/\/wa\.me\/55\d{10,11}$/;
const HORA_OK = /^([01]\d|2[0-3]):[0-5]\d$/;
const turnoOk = d => Array.isArray(d) && d.length === 2 && HORA_OK.test(d[0]) && HORA_OK.test(d[1]);

const RASCUNHO = {
  ler(){ try{ return JSON.parse(localStorage.getItem(RASCUNHO_CHAVE) || "null") }catch{ return null } },
  gravar(r){ try{ localStorage.setItem(RASCUNHO_CHAVE, JSON.stringify(r)); return true }catch{ return false } },
  limpar(){ try{ localStorage.removeItem(RASCUNHO_CHAVE) }catch{} }
};

/* camada 1 guardada à parte: o histórico do painel precisa dela para
   restaurar a versão em que nada tinha sido publicado */
const ESTADO_BASE = estadoAtual();

/* camada 2: o publicado */
if(typeof AJUSTES_PUBLICADOS !== "undefined") aplicarAjustes(AJUSTES_PUBLICADOS);

/* camada 3: o rascunho, só nas lojas */
const RASCUNHO_LIDO = document.body?.dataset.publico !== "admin" ? RASCUNHO.ler() : null;
const EM_PREVIA = aplicarAjustes(RASCUNHO_LIDO);
/* fotos subidas pelo painel e ainda não publicadas */
if(EM_PREVIA && RASCUNHO_LIDO.fotosNovas && typeof RASCUNHO_LIDO.fotosNovas === "object")
  for(const [nome, f] of Object.entries(RASCUNHO_LIDO.fotosNovas))
    if(/^[a-z0-9-]+$/.test(nome) && /^data:image\/webp;base64,/.test(f?.[200] || "") && /^data:image\/webp;base64,/.test(f?.[400] || ""))
      FOTOS_PREVIA[nome] = f;

/* Quem está vendo o rascunho precisa saber disso: sem o aviso, o dono abre a
   loja, vê o preço novo e acha que já está no ar para todo mundo. */
if(EM_PREVIA){
  document.body.insertAdjacentHTML("beforeend", `
    <div class="previa" role="status">
      <b>Prévia do rascunho</b>
      <span>só neste navegador</span>
      <a href="admin.html">Voltar ao painel</a>
    </div>`);
}
