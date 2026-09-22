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

  {sku:"jack-daniels-1l",       marca:"Jack Daniel's",     nome:"Old No. 7 · 1 L",                cat:"destilado",  foto:"jack-daniels-1l",        forma:"tall",   vol:"1 L",    teor:"40%",   preco:189.90, promo:null,   gelada:false, retornavel:false,               alcoolica:true,  estoque:14},
  {sku:"absolut-1l",            marca:"Absolut",           nome:"Vodka Original 1 L",             cat:"destilado",  foto:"absolut-1l",             forma:"tall",   vol:"1 L",    teor:"40%",   preco:89.90,  promo:74.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:52},
  {sku:"absolut-mango-1l",      marca:"Absolut",           nome:"Vodka Mango 1 L",                cat:"destilado",  foto:"absolut-mango-1l",       forma:"tall",   vol:"1 L",    teor:"38%",   preco:94.90,  promo:79.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:31},
  {sku:"ivanov-vodka-1l",       marca:"Ivanov",            nome:"Imperial Vodka 1 L",             cat:"destilado",  foto:"ivanov-vodka-1l",        forma:"tall",   vol:"1 L",    teor:"37,5%", preco:44.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:120},
  {sku:"tanqueray-750",         marca:"Tanqueray",         nome:"London Dry Gin 750 ml",          cat:"destilado",  foto:"tanqueray-750",          forma:"tall",   vol:"750 ml", teor:"47,3%", preco:129.90, promo:109.90, gelada:false, retornavel:false,               alcoolica:true,  estoque:21},
  {sku:"no3-gin-700",           marca:"No. 3",             nome:"London Dry Gin 700 ml",          cat:"destilado",  foto:"no3-gin-700",            forma:"tall",   vol:"700 ml", teor:"46%",   preco:189.90, promo:null,   gelada:false, retornavel:false,               alcoolica:true,  estoque:8},
  {sku:"seagrams-gin-700",      marca:"Seagram's",         nome:"Extra Dry Gin 700 ml",           cat:"destilado",  foto:"seagrams-gin-700",       forma:"tall",   vol:"700 ml", teor:"40%",   preco:69.90,  promo:57.90,  gelada:false, retornavel:false,               alcoolica:true,  estoque:64},

  {sku:"martini-rosso-1l",      marca:"Martini",           nome:"Rosso 1 L",                      cat:"vinho",      foto:"martini-rosso-1l",       forma:"tall",   vol:"1 L",    teor:"15%",   preco:64.90,  promo:52.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:26},
  {sku:"villageoise-branco-250",marca:"La Villageoise",    nome:"Vinho Branco Seco 250 ml",       cat:"vinho",      foto:"villageoise-branco-250", forma:"tall",   vol:"250 ml", teor:"11%",   preco:12.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:88},
  {sku:"coventry-fizz-750",     marca:"Coventry",          nome:"Fizz Elderflower 750 ml",        cat:"vinho",      foto:"coventry-fizz-750",      forma:"tall",   vol:"750 ml", teor:"5,5%",  preco:39.90,  promo:32.90,  gelada:true,  retornavel:false,               alcoolica:true,  estoque:37},
  {sku:"smirnoff-ice-275",      marca:"Smirnoff",          nome:"Ice Tropical 275 ml",            cat:"vinho",      foto:"smirnoff-ice-275",       forma:"bottle", vol:"275 ml", teor:"5%",    preco:11.90,  promo:9.90,   gelada:true,  retornavel:false,               alcoolica:true,  estoque:210},

  {sku:"red-bull-250",          marca:"Red Bull",          nome:"Energy Drink 250 ml",            cat:"energetico", foto:"red-bull-250",           forma:"can",    vol:"250 ml", teor:"0%",    preco:9.90,   promo:7.90,   gelada:true,  retornavel:false,               alcoolica:false, estoque:310},
  {sku:"monster-ultra-500",     marca:"Monster",           nome:"Energy Ultra 500 ml",            cat:"energetico", foto:"monster-ultra-500",      forma:"can",    vol:"500 ml", teor:"0%",    preco:12.90,  promo:null,   gelada:true,  retornavel:false,               alcoolica:false, estoque:150},

  {sku:"coca-cola-2l",          marca:"Coca-Cola",         nome:"Sabor Original 2 L",             cat:"agua",       foto:"coca-cola-2l",           forma:"pet",    vol:"2 L",    teor:"0%",    preco:11.90,  promo:null,   gelada:true,  retornavel:true, casco:2.00,    alcoolica:false, estoque:150},
  {sku:"evian-15l",             marca:"Evian",             nome:"Água Mineral 1,5 L",             cat:"agua",       foto:"evian-15l",              forma:"pet",    vol:"1,5 L",  teor:"0%",    preco:8.90,   promo:null,   gelada:true,  retornavel:false,               alcoolica:false, estoque:420},

  {sku:"gelo-cubos-5kg",        marca:"Zero Grau",         nome:"Gelo em Cubos 5 kg",             cat:"gelo",       foto:"gelo-cubos-5kg",         forma:"saco",   vol:"5 kg",   teor:"—",     preco:14.90,  promo:11.90,  gelada:true,  retornavel:false,               alcoolica:false, estoque:88}
];

/* Rótulo de cada categoria, na ordem em que aparecem nas abas e nos cards.
   É a única lista de categorias do site: abas, cards da home e contagens
   saem toda daqui, então não há como uma discordar da outra. */
const CATEGORIAS = [
  {id:"cerveja",    nome:"Cervejas",              detalhe:"long neck, lata, 600 ml"},
  {id:"destilado",  nome:"Destilados",            detalhe:"whisky, vodka, gin"},
  {id:"vinho",      nome:"Vinhos e espumantes",   detalhe:"tinto, branco, rosé"},
  {id:"energetico", nome:"Energéticos",           detalhe:"lata avulsa e fardo"},
  {id:"agua",       nome:"Águas e refrigerantes", detalhe:"2 L, 1,5 L, lata"},
  {id:"gelo",       nome:"Gelo e carvão",         detalhe:"sacos de 5 kg e 10 kg"}
];

/* ---------- CONTATO ----------
   ⚠ VALORES DE EXEMPLO — trocar pelos reais antes de publicar.
   Tudo o que identifica a loja mora aqui e é escrito na página pelo script,
   para que trocar o número não vire uma caça a string espalhada pelo HTML.
   O mesmo vale para o CNPJ e o endereço no rodapé. */
const CONTATO = {
  whatsapp:  "https://wa.me/5585999999999",
  telefone:  "(85) 3000-0000",
  email:     "oi@zerograu.com.br",
  cnpj:      "00.000.000/0001-00",
  endereco:  "Av. Santos Dumont, 1580",
  bairro:    "Aldeota · Fortaleza / CE",
  instagram: "#",
  facebook:  "#"
};

/* taxa de entrega — mesma regra usada no diagrama de zonas */
const TAXA_BASE = 4.90;
const TAXA_KM   = 1.20;
const RAIO_MAX  = 12;

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
   muda de aparelho para aparelho é só a densidade — daí descritor x, e não w. */
const fotoAttrs = foto =>
  `src="img/${foto}-200.webp" srcset="img/${foto}-200.webp 1x, img/${foto}-400.webp 2x"`;

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
  "coca-cola-2l": 6,
  "evian-15l":    12,
  "gelo-cubos-5kg": 4
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
