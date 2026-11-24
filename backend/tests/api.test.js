// Testes da API contra um MySQL de verdade.
//   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME apontam para um banco de
//   TESTE (o nome precisa ter "teste": o banco é zerado a cada rodada).
//   npm test
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

if (!/teste/i.test(process.env.DB_NAME || "")) {
  console.error("DB_NAME precisa ser um banco de teste (com \"teste\" no nome): ele é apagado a cada rodada.");
  process.exit(1);
}

// Regras fixas para o teste não depender da data: cupom que não vence e loja
// aberta o dia todo, menos domingo.
const pastaRegras = fs.mkdtempSync(path.join(os.tmpdir(), "zg-regras-"));
fs.copyFileSync(path.join(__dirname, "..", "..", "frontend", "js", "dados.js"), path.join(pastaRegras, "dados.js"));
fs.writeFileSync(path.join(pastaRegras, "ajustes.js"), `const AJUSTES_PUBLICADOS = ${JSON.stringify({
  versao: 1,
  varejo: { minimo: 30, freteGratis: 120, cupom: { codigo: "ZEROGRAU10", desconto: 0.1, teto: 30, minimo: 100, validade: "2099-12-31" }, taxaBase: 4.9, taxaKm: 1.2, raioMax: 12 },
  atacado: { desconto: 0.28, minimo: 500, freteGratis: 1200, prazo: "Faturado em 28 dias.", faixas: [{ cx: 10, extra: 0.04 }, { cx: 20, extra: 0.07 }] },
  horario: { dias: [null, ["00:00", "23:59"], ["00:00", "23:59"], ["00:00", "23:59"], ["00:00", "23:59"], ["00:00", "23:59"], ["00:00", "23:59"]] }
})};`);

Object.assign(process.env, {
  PASTA_REGRAS: pastaRegras,
  JWT_SECRET: process.env.JWT_SECRET || "segredo-so-para-os-testes-da-api",
  CONSULTAR_CEP: "false",
  ADMIN_EMAIL: "dono@zerograu.test",
  ADMIN_SENHA: "senha-do-dono-123",
  NODE_ENV: "test"
});

const { sequelize, Produto, Cupom } = require("../src/models/relacionamentos");
const { prepararBanco } = require("../src/esquema");
const { semearBanco } = require("../src/semente");
const { criarApp } = require("../src/app");

let servidor;
let base;
const avisos = [];

async function chamar(metodo, caminho, { corpo, token, cabecalhos = {}, formulario } = {}) {
  const resposta = await fetch(base + caminho, {
    method: metodo,
    headers: { ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...cabecalhos },
    body: formulario || (corpo !== undefined ? JSON.stringify(corpo) : undefined)
  });
  const texto = await resposta.text();
  let dados = texto;
  try { dados = JSON.parse(texto); } catch {}
  return { status: resposta.status, dados, cabecalhos: resposta.headers };
}

let contador = 0;
function cpfNovo() {
  contador++;
  return String(10000000000 + Date.now() % 1000000000 + contador).slice(-11);
}
function cnpjNovo() {
  contador++;
  return String(10000000000000 + Date.now() % 1000000000 + contador).slice(-14);
}

async function novaConta(tipo = "cpf") {
  const email = `cliente${Date.now()}${++contador}@exemplo.com`;
  const documento = tipo === "cpf" ? cpfNovo() : cnpjNovo();
  const cadastro = await chamar("POST", "/api/auth/cadastro", { corpo: { nome: "Cliente Teste", email, senha: "senha123", documento, tipo_documento: tipo } });
  assert.equal(cadastro.status, 201, JSON.stringify(cadastro.dados));
  const login = await chamar("POST", "/api/auth/login", { corpo: { email, senha: "senha123" } });
  return { email, documento, token: login.dados.token, usuario: login.dados.usuario };
}

let admin;
let cliente;

before(async () => {
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  const [tabelas] = await sequelize.query("SELECT TABLE_NAME AS nome FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
  for (const { nome } of tabelas) await sequelize.query(`DROP TABLE \`${nome}\``);
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  await prepararBanco({ avisar: aviso => avisos.push(aviso) });
  await semearBanco({ avisar: aviso => avisos.push(aviso) });
  servidor = criarApp().listen(0);
  await new Promise(resolve => servidor.once("listening", resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
  const login = await chamar("POST", "/api/auth/login", { corpo: { email: "dono@zerograu.test", senha: "senha-do-dono-123" } });
  admin = login.dados.token;
  cliente = await novaConta("cpf");
});

after(async () => {
  servidor?.close();
  await sequelize.close();
  fs.rmSync(pastaRegras, { recursive: true, force: true });
});

// ------------------------------------------------------------------ banco

test("banco novo: semeia loja, horários, regras, categorias, catálogo do site e admin", async () => {
  assert.ok(avisos.includes("loja criada com os dados do site"));
  assert.ok(avisos.some(aviso => /15 produtos do catálogo do site gravados/.test(aviso)));
  assert.ok(avisos.includes("administrador dono@zerograu.test criado"));
  const saude = await chamar("GET", "/api/saude");
  assert.deepEqual(saude.dados, { ok: true, banco: "conectado" });
});

test("preparar o banco de novo não muda nada e apaga índice repetido", async () => {
  const segunda = [];
  await prepararBanco({ avisar: aviso => segunda.push(aviso) });
  assert.deepEqual(segunda, []);
  await sequelize.query("CREATE UNIQUE INDEX email_2 ON Usuarios (email)");
  const terceira = [];
  await prepararBanco({ avisar: aviso => terceira.push(aviso) });
  assert.deepEqual(terceira, ["índice repetido Usuarios.email_2 apagado"]);
});

test("apagar produto com pedido é recusado pelo banco (histórico preservado)", async () => {
  const [[chave]] = await sequelize.query(`SELECT r.DELETE_RULE AS regra FROM information_schema.REFERENTIAL_CONSTRAINTS r
    JOIN information_schema.KEY_COLUMN_USAGE k ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA
    WHERE k.TABLE_SCHEMA = DATABASE() AND k.TABLE_NAME = 'ItemPedidos' AND k.COLUMN_NAME = 'produto_id'`);
  assert.equal(chave.regra, "RESTRICT");
});

// ------------------------------------------------------------- contas

test("cadastro e login", async () => {
  const email = `Nova${Date.now()}@Exemplo.com`;
  const documento = cpfNovo();
  const cadastro = await chamar("POST", "/api/auth/cadastro", { corpo: { nome: "  Ana   Cliente ", email, senha: "segredo1", documento, tipo_documento: "CPF" } });
  assert.equal(cadastro.status, 201);
  assert.equal(cadastro.dados.usuario.email, email.toLowerCase());
  assert.equal(cadastro.dados.usuario.nome, "Ana Cliente");
  assert.equal(cadastro.dados.usuario.loja, "varejo");
  assert.match(cadastro.dados.usuario.documento, /^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  assert.equal(cadastro.dados.usuario.senha_hash, undefined);

  const repetido = await chamar("POST", "/api/auth/cadastro", { corpo: { nome: "Outra", email: email.toUpperCase(), senha: "segredo1", documento: cpfNovo(), tipo_documento: "cpf" } });
  assert.equal(repetido.status, 400);
  assert.match(repetido.dados.erro, /e-mail/i);
  assert.match(repetido.dados.erro, /cadastrad/i);

  const mesmoCpf = await chamar("POST", "/api/auth/cadastro", { corpo: { nome: "Outra", email: `x${email}`, senha: "segredo1", documento: cadastro.dados.usuario.documento.replace(/\D/g, ""), tipo_documento: "cpf" } });
  assert.equal(mesmoCpf.status, 400);
  assert.match(mesmoCpf.dados.erro, /CPF/);

  for (const corpo of [
    { nome: "A", email: "sem-arroba", senha: "segredo1", documento: cpfNovo(), tipo_documento: "cpf" },
    { nome: "A", email: `c${Date.now()}@x.com`, senha: "123", documento: cpfNovo(), tipo_documento: "cpf" },
    { nome: "A", email: `d${Date.now()}@x.com`, senha: "segredo1", documento: "123", tipo_documento: "cpf" },
    { nome: "A", email: `e${Date.now()}@x.com`, senha: "segredo1", documento: cpfNovo(), tipo_documento: "rg" },
    { nome: "", email: `f${Date.now()}@x.com`, senha: "segredo1", documento: cpfNovo(), tipo_documento: "cpf" }
  ]) {
    const resposta = await chamar("POST", "/api/auth/cadastro", { corpo });
    assert.equal(resposta.status, 400, JSON.stringify(corpo));
  }

  const login = await chamar("POST", "/api/auth/login", { corpo: { email: email.toUpperCase(), senha: "segredo1" } });
  assert.equal(login.status, 200);
  assert.equal(login.dados.usuario.perfil, "cliente");
  assert.ok(login.dados.token);
  const eu = await chamar("GET", "/api/auth/eu", { token: login.dados.token });
  assert.equal(eu.dados.usuario.email, email.toLowerCase());

  assert.equal((await chamar("POST", "/api/auth/login", { corpo: { email, senha: "errada!" } })).status, 401);
  assert.equal((await chamar("POST", "/api/auth/login", { corpo: { email: "ninguem@x.com", senha: "errada!" } })).status, 401);
  assert.equal((await chamar("GET", "/api/auth/eu", { token: "token.falso.x" })).status, 401);
  assert.equal((await chamar("POST", "/api/auth/login", { corpo: "{quebrado", cabecalhos: { "Content-Type": "application/json" } })).status, 400);
});

test("administrador vem do ambiente", async () => {
  const eu = await chamar("GET", "/api/auth/eu", { token: admin });
  assert.equal(eu.dados.usuario.perfil, "admin");
});

// --------------------------------------------------------- permissões

test("rotas de escrita exigem login de administrador", async () => {
  const rotas = [
    ["POST", "/api/categorias", { slug: "x", nome: "X" }],
    ["POST", "/api/produtos", {}],
    ["PUT", "/api/produtos/absolut-1l", { preco: 1 }],
    ["DELETE", "/api/produtos/absolut-1l"],
    ["POST", "/api/produtos/1/foto"],
    ["POST", "/api/produtos/1/faixas", { quantidade_minima: 2 }],
    ["GET", "/api/pedidos"],
    ["PATCH", "/api/pedidos/1/status", { status: "confirmado" }],
    ["PUT", "/api/loja", { nome: "x" }],
    ["PUT", "/api/regras/varejo", { pedido_minimo: 1 }],
    ["GET", "/api/cupons"],
    ["POST", "/api/cupons", { codigo: "X", valor_desconto: 1 }],
    ["PUT", "/api/cupons/1", { ativo: false }],
    ["DELETE", "/api/cupons/1"]
  ];
  for (const [metodo, caminho, corpo] of rotas) {
    assert.equal((await chamar(metodo, caminho, { corpo })).status, 401, `${metodo} ${caminho} sem login`);
    assert.equal((await chamar(metodo, caminho, { corpo, token: cliente.token })).status, 403, `${metodo} ${caminho} como cliente`);
  }
  assert.equal((await chamar("POST", "/api/pedidos", { corpo: {} })).status, 401);
  assert.equal((await chamar("GET", "/api/pedidos/meus")).status, 401);
});

// ------------------------------------------------------------ catálogo

test("catálogo: lista, filtro por categoria e busca", async () => {
  const todos = await chamar("GET", "/api/produtos");
  assert.equal(todos.status, 200);
  assert.ok(todos.dados.length >= 15);
  const categorias = await chamar("GET", "/api/categorias");
  const cerveja = categorias.dados.find(categoria => categoria.slug === "cerveja");
  assert.ok(cerveja);

  const cervejas = await chamar("GET", "/api/produtos?cat=cerveja");
  assert.equal(cervejas.status, 200);
  assert.ok(cervejas.dados.length > 0);
  assert.ok(cervejas.dados.every(produto => produto.categoria_id === cerveja.id));
  assert.deepEqual((await chamar("GET", "/api/produtos?cat=nao-existe")).dados, []);

  const busca = await chamar("GET", "/api/produtos?busca=guinness");
  assert.deepEqual(busca.dados.map(produto => produto.sku), ["guinness-draught-500"]);
  assert.deepEqual((await chamar("GET", "/api/produtos?busca=%25")).dados, []);
  assert.equal((await chamar("GET", "/api/produtos/guinness-draught-500")).dados.marca, "Guinness");
  assert.equal((await chamar("GET", "/api/produtos/nao-existe")).status, 404);
});

test("painel: cria, edita, remove e recria produto", async () => {
  const categorias = (await chamar("GET", "/api/categorias")).dados;
  const idCerveja = categorias.find(categoria => categoria.slug === "cerveja").id;
  const sku = `teste-${Date.now()}`;
  const produto = {
    sku, categoria_id: idCerveja, cat: "cerveja", marca: "Marca", nome: "Lager 350 ml", volume: "350 ml", teor_alcoolico: "4,5%",
    embalagem: "can", preco: 6.5, preco_promo: null, unidades_caixa: 12, estoque: 48, gelada: true, alcoolica: true,
    retornavel: false, valor_casco: null, ativo: true, id: 999999, usos: 1
  };
  const criado = await chamar("POST", "/api/produtos", { corpo: produto, token: admin });
  assert.equal(criado.status, 201, JSON.stringify(criado.dados));
  assert.notEqual(criado.dados.produto.id, 999999);
  assert.equal((await chamar("POST", "/api/produtos", { corpo: produto, token: admin })).status, 409);

  for (const errado of [
    { ...produto, sku: `${sku}-a`, preco_promo: 7 },
    { ...produto, sku: `${sku}-b`, embalagem: "lata" },
    { ...produto, sku: `${sku}-c`, categoria_id: 999999 },
    { ...produto, sku: `${sku}-d`, categoria_id: undefined, cat: "nao-existe" },
    { ...produto, sku: "sku com espaço" },
    { ...produto, sku: `${sku}-e`, estoque: -1 },
    { ...produto, sku: `${sku}-f`, preco: "abc" }
  ]) {
    const resposta = await chamar("POST", "/api/produtos", { corpo: errado, token: admin });
    assert.equal(resposta.status, 400, JSON.stringify(errado));
    assert.ok(resposta.dados.erro);
  }

  const editado = await chamar("PUT", `/api/produtos/${sku}`, { corpo: { sku: "outro", preco: 7.25, estoque: 30, preco_promo: 6.99 }, token: admin });
  assert.equal(editado.status, 200);
  assert.equal(editado.dados.produto.sku, sku);
  assert.equal(Number(editado.dados.produto.preco), 7.25);
  assert.equal((await chamar("PUT", `/api/produtos/${sku}`, { corpo: { preco: 5 }, token: admin })).status, 400, "promo maior que o preço novo");

  assert.equal((await chamar("DELETE", `/api/produtos/${sku}`, { token: admin })).status, 200);
  const removido = await chamar("GET", `/api/produtos/${sku}`);
  assert.equal(removido.dados.ativo, false);
  assert.equal((await chamar("DELETE", `/api/produtos/${sku}`, { token: admin })).status, 404);
  const recriado = await chamar("POST", "/api/produtos", { corpo: produto, token: admin });
  assert.equal(recriado.status, 201);
  assert.equal(recriado.dados.produto.ativo, true);
});

test("foto do produto fica no banco e é servida para outros domínios", async () => {
  const produto = (await chamar("GET", "/api/produtos/guinness-draught-500")).dados;
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const formulario = new FormData();
  formulario.append("foto", new Blob([png], { type: "image/png" }), "foto.png");
  const envio = await chamar("POST", `/api/produtos/${produto.id}/foto`, { formulario, token: admin });
  assert.equal(envio.status, 200, JSON.stringify(envio.dados));
  assert.match(envio.dados.foto_url, new RegExp(`^/api/produtos/${produto.id}/foto\\?v=\\d+$`));

  const resposta = await fetch(base + envio.dados.foto_url);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.headers.get("content-type"), "image/png");
  assert.equal(resposta.headers.get("cross-origin-resource-policy"), "cross-origin");
  assert.deepEqual(Buffer.from(await resposta.arrayBuffer()), png);

  const texto = new FormData();
  texto.append("foto", new Blob(["oi"], { type: "text/plain" }), "a.txt");
  assert.equal((await chamar("POST", `/api/produtos/${produto.id}/foto`, { formulario: texto, token: admin })).status, 400);
  assert.equal((await chamar("GET", "/api/produtos/999999/foto")).status, 404);
});

// ------------------------------------------------------------- pedidos

const ENTREGA_MEIRELES = { modalidade: "entrega", cep: "60160000", logradouro: "Rua Silva Paulet", numero: "100", complemento: null, referencia: "portão azul", destinatario: "Ana", bairro: "Meireles", cidade: "Fortaleza", uf: "CE" };
const PAGAMENTO_PIX = { momento: "entrega", forma: "pix", troco_para: null, txid: null };

async function estoqueDe(sku) {
  return (await chamar("GET", `/api/produtos/${sku}`)).dados.estoque;
}

test("pedido de varejo: preço, cupom, frete e estoque calculados no servidor", async () => {
  const conta = await novaConta("cpf");
  const antes = await estoqueDe("estrella-galicia-330");
  const produto = (await chamar("GET", "/api/produtos/estrella-galicia-330")).dados;
  const preco = Number(produto.preco_promo ?? produto.preco);
  const quantidade = Math.ceil(110 / preco);

  const resposta = await chamar("POST", "/api/pedidos", {
    token: conta.token,
    corpo: { canal: "varejo", itens: [{ sku: "estrella-galicia-330", quantidade, unidade: "un" }], cupom: "zerograu10", entrega: ENTREGA_MEIRELES, pagamento: PAGAMENTO_PIX, observacao: "sem gelo", agendado: false, total: 1 }
  });
  assert.equal(resposta.status, 201, JSON.stringify(resposta.dados));
  const pedido = resposta.dados.pedido;
  const subtotal = Math.round(preco * quantidade * 100) / 100;
  const desconto = Math.round(Math.min(subtotal * 0.1, 30) * 100) / 100;
  const totalProdutos = subtotal - desconto;
  const taxa = totalProdutos >= 120 ? 0 : Math.round((4.9 + 1.6 * 1.2) * 100) / 100;
  assert.equal(Number(pedido.subtotal), subtotal);
  assert.equal(Number(pedido.desconto), desconto);
  assert.equal(Number(pedido.taxa_entrega), taxa);
  assert.equal(Number(pedido.total), Math.round((totalProdutos + taxa) * 100) / 100);
  assert.equal(pedido.status, "recebido");
  assert.equal(pedido.cupom, "ZEROGRAU10");
  assert.equal(pedido.usuario.email, conta.email);
  assert.equal(pedido.itens[0].produto.sku, "estrella-galicia-330");
  assert.equal(pedido.endereco.bairro, "Meireles");
  assert.equal(pedido.pagamento.forma, "pix");
  assert.equal(pedido.destinatario, "Ana");
  assert.equal(await estoqueDe("estrella-galicia-330"), antes - quantidade);

  const deNovo = await chamar("POST", "/api/pedidos", {
    token: conta.token,
    corpo: { canal: "varejo", itens: [{ sku: "estrella-galicia-330", quantidade, unidade: "un" }], cupom: "ZEROGRAU10", entrega: ENTREGA_MEIRELES, pagamento: PAGAMENTO_PIX }
  });
  assert.equal(deNovo.status, 400);
  assert.match(deNovo.dados.erro, /já usou/);

  const meus = await chamar("GET", "/api/pedidos/meus", { token: conta.token });
  assert.equal(meus.dados.length, 1);
  assert.equal(meus.dados[0].itens[0].quantidade, quantidade);
  const outro = await chamar("GET", `/api/pedidos/${pedido.id}`, { token: cliente.token });
  assert.equal(outro.status, 404, "um cliente não vê o pedido de outro");
  const todos = await chamar("GET", "/api/pedidos", { token: admin });
  assert.ok(todos.dados.some(item => item.id === pedido.id && item.usuario.email === conta.email));
});

test("pedido de varejo: recusas", async () => {
  const conta = await novaConta("cpf");
  const item = quantidade => [{ sku: "guinness-draught-500", quantidade, unidade: "un" }];
  const casos = [
    [{ canal: "varejo", itens: item(1), entrega: { modalidade: "retirada" }, pagamento: PAGAMENTO_PIX }, /mínimo/],
    [{ canal: "varejo", itens: item(2), entrega: { ...ENTREGA_MEIRELES, bairro: "Centro", cidade: "Recife" }, pagamento: PAGAMENTO_PIX }, /fora do raio/],
    [{ canal: "varejo", itens: item(2), entrega: { ...ENTREGA_MEIRELES, cep: "123" }, pagamento: PAGAMENTO_PIX }, /CEP/],
    [{ canal: "varejo", itens: item(9999), entrega: ENTREGA_MEIRELES, pagamento: PAGAMENTO_PIX }, /estoque/],
    [{ canal: "varejo", itens: [{ sku: "nao-existe", quantidade: 1 }], entrega: ENTREGA_MEIRELES, pagamento: PAGAMENTO_PIX }, /fora de venda/],
    [{ canal: "varejo", itens: item(2), entrega: ENTREGA_MEIRELES, pagamento: { forma: "cheque" } }, /forma de pagamento/],
    [{ canal: "varejo", itens: item(2), entrega: ENTREGA_MEIRELES, pagamento: { forma: "dinheiro", troco_para: 5 } }, /troco/],
    [{ canal: "varejo", itens: item(2), entrega: ENTREGA_MEIRELES, pagamento: { forma: "cartao", momento: "site" } }, /Pix/],
    [{ canal: "varejo", itens: item(2), cupom: "NAOEXISTE", entrega: ENTREGA_MEIRELES, pagamento: PAGAMENTO_PIX }, /Cupom inválido/],
    [{ canal: "varejo", itens: item(2), cupom: "ZEROGRAU10", entrega: ENTREGA_MEIRELES, pagamento: PAGAMENTO_PIX }, /a partir de/],
    [{ canal: "varejo", itens: [{ sku: "guinness-draught-500", quantidade: 2, unidade: "cx" }], entrega: ENTREGA_MEIRELES, pagamento: PAGAMENTO_PIX }, /por unidade/],
    [{ canal: "atacado", itens: [{ sku: "guinness-draught-500", quantidade: 30, unidade: "cx" }], entrega: { modalidade: "entrega" }, pagamento: { forma: null } }, /CNPJ/],
    [{ canal: "loja", itens: item(2) }, /Canal/],
    [{ canal: "varejo", itens: [] }, /sem itens/]
  ];
  for (const [corpo, erro] of casos) {
    const resposta = await chamar("POST", "/api/pedidos", { token: conta.token, corpo });
    assert.equal(resposta.status, 400, JSON.stringify(corpo));
    assert.match(resposta.dados.erro, erro);
  }
  assert.equal((await chamar("GET", "/api/pedidos/meus", { token: conta.token })).dados.length, 0);
});

test("estoque: um item sem estoque desfaz o pedido inteiro", async () => {
  const conta = await novaConta("cpf");
  const antesA = await estoqueDe("guinness-draught-500");
  const antesB = await estoqueDe("estrella-galicia-330");
  await Produto.update({ estoque: 1 }, { where: { sku: "feldschlosschen-500" } });
  // O segundo item passa na leitura, mas outra compra leva o estoque antes da baixa.
  const original = Produto.update.bind(Produto);
  let primeira = true;
  Produto.update = async (...args) => {
    if (primeira && args[1]?.where?.estoque) {
      primeira = false;
      await original({ estoque: 0 }, { where: { sku: "feldschlosschen-500" } });
    }
    return original(...args);
  };
  try {
    const resposta = await chamar("POST", "/api/pedidos", {
      token: conta.token,
      corpo: { canal: "varejo", itens: [{ sku: "guinness-draught-500", quantidade: 2 }, { sku: "estrella-galicia-330", quantidade: 2 }, { sku: "feldschlosschen-500", quantidade: 1 }], entrega: { modalidade: "retirada" }, pagamento: PAGAMENTO_PIX }
    });
    assert.equal(resposta.status, 400, JSON.stringify(resposta.dados));
    assert.match(resposta.dados.erro, /estoque/);
  } finally {
    Produto.update = original;
  }
  assert.equal(await estoqueDe("guinness-draught-500"), antesA);
  assert.equal(await estoqueDe("estrella-galicia-330"), antesB);
  assert.equal((await chamar("GET", "/api/pedidos/meus", { token: conta.token })).dados.length, 0);
});

test("pedido de atacado: caixa, faixa de volume, frete e estoque", async () => {
  const conta = await novaConta("cnpj");
  const produto = (await chamar("GET", "/api/produtos/guinness-draught-500")).dados;
  await Produto.update({ estoque: 1000 }, { where: { id: produto.id } });
  const caixa = produto.unidades_caixa || 12;
  const resposta = await chamar("POST", "/api/pedidos", {
    token: conta.token,
    corpo: { canal: "atacado", itens: [{ sku: "guinness-draught-500", quantidade: 10, unidade: "cx" }], cupom: null, entrega: { modalidade: "entrega" }, pagamento: { momento: "entrega", forma: null }, observacao: null, agendado: false }
  });
  assert.equal(resposta.status, 201, JSON.stringify(resposta.dados));
  const pedido = resposta.dados.pedido;
  const mercadoria = Number(produto.preco) * 0.72 * caixa * 10;
  assert.equal(Number(pedido.subtotal), Math.round(mercadoria * 100) / 100);
  assert.equal(Number(pedido.desconto), Math.round(mercadoria * 0.04 * 100) / 100);
  const totalProdutos = Number(pedido.subtotal) - Number(pedido.desconto);
  assert.equal(Number(pedido.taxa_entrega), totalProdutos >= 1200 ? 0 : Math.round((4.9 + 12 * 1.2) * 100) / 100);
  assert.equal(pedido.itens[0].unidade, "cx");
  assert.equal(pedido.pagamento, null);
  assert.equal(await estoqueDe("guinness-draught-500"), 1000 - 10 * caixa);

  const pequeno = await chamar("POST", "/api/pedidos", { token: conta.token, corpo: { canal: "atacado", itens: [{ sku: "guinness-draught-500", quantidade: 1, unidade: "cx" }] } });
  assert.equal(pequeno.status, 400);
  assert.match(pequeno.dados.erro, /mínimo do atacado/);
});

test("status do pedido: cancelar devolve estoque e cupom; entregue marca pago", async () => {
  const conta = await novaConta("cpf");
  const antes = await estoqueDe("guinness-draught-500");
  const cupomAntes = (await Cupom.findOne({ where: { codigo: "ZEROGRAU10" } })).usos_atuais;
  const criado = await chamar("POST", "/api/pedidos", {
    token: conta.token,
    corpo: { canal: "varejo", itens: [{ sku: "guinness-draught-500", quantidade: 5 }], cupom: "ZEROGRAU10", entrega: { modalidade: "retirada" }, pagamento: { forma: "dinheiro", troco_para: null } }
  });
  assert.equal(criado.status, 201, JSON.stringify(criado.dados));
  const id = criado.dados.pedido.id;
  assert.equal(await estoqueDe("guinness-draught-500"), antes - 5);

  assert.equal((await chamar("PATCH", `/api/pedidos/${id}/status`, { corpo: { status: "voando" }, token: admin })).status, 400);
  const confirmado = await chamar("PATCH", `/api/pedidos/${id}/status`, { corpo: { status: "confirmado" }, token: admin });
  assert.equal(confirmado.dados.pedido.status, "confirmado");
  const cancelado = await chamar("PATCH", `/api/pedidos/${id}/status`, { corpo: { status: "cancelado" }, token: admin });
  assert.equal(cancelado.status, 200);
  assert.equal(await estoqueDe("guinness-draught-500"), antes);
  assert.equal((await Cupom.findOne({ where: { codigo: "ZEROGRAU10" } })).usos_atuais, cupomAntes);
  const volta = await chamar("PATCH", `/api/pedidos/${id}/status`, { corpo: { status: "recebido" }, token: admin });
  assert.equal(volta.status, 400);

  const outro = await chamar("POST", "/api/pedidos", {
    token: conta.token,
    corpo: { canal: "varejo", itens: [{ sku: "guinness-draught-500", quantidade: 5 }], cupom: "ZEROGRAU10", entrega: { modalidade: "retirada" }, pagamento: { forma: "cartao" } }
  });
  assert.equal(outro.status, 201, "cupom de pedido cancelado pode ser usado de novo");
  const entregue = await chamar("PATCH", `/api/pedidos/${outro.dados.pedido.id}/status`, { corpo: { status: "entregue" }, token: admin });
  assert.equal(entregue.dados.pedido.pagamento.status, "pago");
  const cancelarEntregue = await chamar("PATCH", `/api/pedidos/${outro.dados.pedido.id}/status`, { corpo: { status: "cancelado" }, token: admin });
  assert.equal(cancelarEntregue.status, 400);
});

test("agendar pedido só no horário da loja", async () => {
  const conta = await novaConta("cpf");
  const criado = await chamar("POST", "/api/pedidos", {
    token: conta.token,
    corpo: { canal: "varejo", itens: [{ sku: "guinness-draught-500", quantidade: 2 }], entrega: { modalidade: "retirada" }, pagamento: { forma: "pix" } }
  });
  const id = criado.dados.pedido.id;
  const dia = (deslocamento, semana) => {
    const data = new Date();
    data.setUTCDate(data.getUTCDate() + ((semana - data.getUTCDay() + 7) % 7 || 7) + deslocamento);
    data.setUTCHours(15, 0, 0, 0);
    return data.toISOString();
  };
  const domingo = await chamar("PATCH", `/api/pedidos/${id}/agendar`, { corpo: { agendado_para: dia(0, 0) }, token: conta.token });
  assert.equal(domingo.status, 400);
  assert.match(domingo.dados.erro, /fora do funcionamento/);
  const segunda = await chamar("PATCH", `/api/pedidos/${id}/agendar`, { corpo: { agendado_para: dia(0, 1) }, token: conta.token });
  assert.equal(segunda.status, 200, JSON.stringify(segunda.dados));
  assert.equal(new Date(segunda.dados.pedido.agendado_para).toISOString(), dia(0, 1));
  assert.equal((await chamar("PATCH", `/api/pedidos/${id}/agendar`, { corpo: { agendado_para: dia(0, 1) }, token: cliente.token })).status, 404);
  assert.equal((await chamar("PATCH", `/api/pedidos/${id}/agendar`, { corpo: { agendado_para: "ontem" }, token: conta.token })).status, 400);
});

// --------------------------------------------------- cupons, loja, regras

test("cupons: CRUD do admin e validação", async () => {
  const codigo = `TESTE${Date.now()}`;
  const criado = await chamar("POST", "/api/cupons", { corpo: { codigo: codigo.toLowerCase(), tipo_desconto: "fixo", valor_desconto: 15, valor_minimo_pedido: 50, teto: 10, data_validade: "2099-01-31" }, token: admin });
  assert.equal(criado.status, 201, JSON.stringify(criado.dados));
  assert.equal(criado.dados.cupom.codigo, codigo);
  assert.equal((await chamar("POST", "/api/cupons", { corpo: { codigo, valor_desconto: 5 }, token: admin })).status, 409);
  assert.equal((await chamar("POST", "/api/cupons", { corpo: { codigo: "X1", valor_desconto: 5 }, token: admin })).status, 400);
  assert.equal((await chamar("POST", "/api/cupons", { corpo: { codigo: "PERC", tipo_desconto: "percentual", valor_desconto: 95 }, token: admin })).status, 400);

  const valido = await chamar("POST", "/api/cupons/validar", { corpo: { codigo, subtotal: 80 } });
  assert.equal(valido.status, 200);
  assert.equal(valido.dados.desconto_calculado, 10, "teto de R$ 10");
  const pouco = await chamar("POST", "/api/cupons/validar", { corpo: { codigo, subtotal: 20 } });
  assert.equal(pouco.status, 400);
  assert.equal(pouco.dados.valido, false);
  const torto = await chamar("POST", "/api/cupons/validar", { corpo: { codigo, subtotal: "abc" } });
  assert.deepEqual([torto.status, torto.dados.valido], [400, false]);
  const site = await chamar("POST", "/api/cupons/validar", { corpo: { codigo: "ZEROGRAU10", subtotal: 500 } });
  assert.equal(site.dados.desconto_calculado, 30);

  const id = criado.dados.cupom.id;
  assert.equal((await chamar("PUT", `/api/cupons/${id}`, { corpo: { ativo: false }, token: admin })).status, 200);
  assert.equal((await chamar("POST", "/api/cupons/validar", { corpo: { codigo, subtotal: 80 } })).status, 400);
  assert.equal((await chamar("DELETE", `/api/cupons/${id}`, { token: admin })).status, 200);
  assert.ok((await chamar("GET", "/api/cupons", { token: admin })).dados.some(cupom => cupom.codigo === codigo));
});

test("loja e regras: leitura pública, escrita do admin", async () => {
  const loja = await chamar("GET", "/api/loja");
  assert.equal(loja.status, 200);
  assert.equal(loja.dados.Horarios.length, 6);
  const mudou = await chamar("PUT", "/api/loja", { corpo: { telefone: "(85) 99999-0000", id: 77 }, token: admin });
  assert.equal(mudou.dados.telefone, "(85) 99999-0000");
  assert.equal(mudou.dados.id, loja.dados.id);
  assert.equal((await chamar("PUT", "/api/loja", { corpo: { taxa_km: -1 }, token: admin })).status, 400);

  const varejo = await chamar("GET", "/api/regras/varejo");
  assert.equal(Number(varejo.dados.pedido_minimo), 30);
  assert.equal(Number((await chamar("GET", "/api/regras/atacado")).dados.desconto_canal), 28);
  assert.equal((await chamar("GET", "/api/regras/loja")).status, 400);
  const regra = await chamar("PUT", "/api/regras/varejo", { corpo: { pedido_minimo: 35 }, token: admin });
  assert.equal(Number(regra.dados.regra.pedido_minimo), 35);
});

test("faixas e cálculo de atacado por produto", async () => {
  const produto = (await chamar("GET", "/api/produtos/guinness-draught-500")).dados;
  const faixa = await chamar("POST", `/api/produtos/${produto.id}/faixas`, { corpo: { quantidade_minima: 5, desconto_percentual: 10 }, token: admin });
  assert.equal(faixa.status, 201);
  const calculo = await chamar("POST", "/api/atacado/calcular", { corpo: { produto_id: produto.id, caixas: 6 } });
  assert.equal(calculo.status, 200);
  assert.equal(calculo.dados.desconto_aplicado_percentual, 10);
  assert.equal((await chamar("GET", `/api/atacado/calcular?produto_id=${produto.id}&caixas=2`)).dados.desconto_aplicado_percentual, 0);
  assert.equal((await chamar("POST", "/api/atacado/calcular", { corpo: { produto_id: produto.id } })).status, 400);
  assert.equal((await chamar("GET", `/api/produtos/${produto.id}/faixas`)).dados.faixas.length, 1);
});

// ------------------------------------------------------- infraestrutura

test("CORS para o site publicado e site servido já em modo API", async () => {
  const site = await chamar("OPTIONS", "/api/pedidos", { cabecalhos: { Origin: "https://costamaiavitor.github.io", "Access-Control-Request-Method": "POST" } });
  assert.equal(site.status, 204);
  assert.equal(site.cabecalhos.get("access-control-allow-origin"), "https://costamaiavitor.github.io");
  assert.match(site.cabecalhos.get("access-control-allow-headers"), /Authorization/);
  const estranho = await chamar("GET", "/api/produtos", { cabecalhos: { Origin: "https://outro-site.com" } });
  assert.equal(estranho.cabecalhos.get("access-control-allow-origin"), null);

  const config = await chamar("GET", "/js/config.js");
  assert.match(config.dados, /usarMock: false/);
  assert.match(config.dados, /apiBase: "\/api"/);
  const pagina = await chamar("GET", "/index.html");
  assert.equal(pagina.status, 200);
  assert.equal((await chamar("GET", "/api/nao-existe")).status, 404);
});
