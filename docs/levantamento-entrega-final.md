# Levantamento para a apresentação final

Comparação, item a item, do enunciado "Trabalho Final – Etapas" com o código da branch `entrega-final` (29/10/2026). O front-end foi corrigido nesta rodada; o back-end e o banco de dados **só foram levantados**: nada em `backend/` mudou.

Legenda: ✅ atendido · ⚠️ parcial · ❌ falta

## 1. O que o enunciado pede e onde está

### Tecnologias

| Exigência | Situação | Onde |
|---|---|---|
| Front-end com HTML e JavaScript | ✅ | `frontend/*.html`, `frontend/js/` |
| Front-end com Bootstrap e React | ✅ | `frontend-react/` (React 18 + Vite + Bootstrap 5): páginas "Minha conta" (`/conta/`) e "Pedidos" do painel (`/conta/pedidos.html`), com links na loja, no atacado e no painel |
| Back-end Node.js + Express | ✅ | `backend/server.js` |
| Banco MySQL | ✅ modelado, ⚠️ inconsistências (seção 3) | `backend/src/models/`, `src/migrations/`, `src/seeders/` |

### Etapa 2 (MVP)

| Exigência | Situação | Onde / observação |
|---|---|---|
| Interface básica com framework e responsividade | ✅ | todas as páginas sem rolagem lateral em 320, 768 e 1280 px (`tests/e2e/responsivo.spec.js`) |
| Back-end com CRUD | ✅ produtos (GET, POST, PUT, DELETE), ⚠️ categorias só GET e POST | `backend/server.js:143-267` |
| Banco integrado, cadastrar usuários e registros | ✅ no back-end | cadastro em `server.js:40`, produtos em `server.js:208` |
| **Front usando o CRUD** | ✅ **novo nesta rodada** (com a API ligada) | catálogo e painel, ver seção 2 |

### Etapa 3 (sistema completo)

| Exigência | Situação | Onde / observação |
|---|---|---|
| Autenticação: login e registro | ✅ | API: `server.js:40` e `:87` (bcrypt + JWT). Front: `js/porta.js` usa `POST /api/auth/login` e `/cadastro` com a API ligada; no modo simulado, senha só como hash SHA-256 |
| Autorização | ⚠️ front ✅, back ❌ | o painel só abre para admin (`js/guarda-admin.js`), mas **a API aceita escrita sem token** (seção 3, B1) |
| Pesquisa e filtragem | ✅ front, ⚠️ API | busca sem acento e abas de categoria no varejo e no atacado. Na API, `?cat=` dá erro 500 (B4) |
| Interface interativa com JS/React | ✅ | carrinho em etapas, Pix com QR code, CEP pelo ViaCEP, painel com rascunho e prévia, página React |
| Integração completa front ↔ back | ⚠️ | login, cadastro, catálogo e CRUD do painel ✅. Pedidos, histórico, frete e cupom no servidor dependem de rotas que não existem (B9) |
| Hospedagem online (Heroku ou Vercel) | ⚠️ | front no GitHub Pages e pronto para a Vercel (`vercel.json`). **API e banco não estão online** (seção 4) |
| Usabilidade testada e validada | ✅ | 380+ testes Playwright em 3 larguras, auditoria de acessibilidade com axe-core (WCAG 2.1 AA) e teste de fumaça com 409 verificações, rodando no GitHub Actions a cada push |

## 2. O que mudou no front-end nesta rodada

Tudo abaixo só entra em ação quando `frontend/js/config.js` tem `usarMock: false` e `apiBase` aponta para a API no ar. Com `usarMock: true`, que é o que está no GitHub Pages hoje, o site continua exatamente igual (confirmado pelas screenshots de referência).

| Mudança | Arquivos | Requisito |
|---|---|---|
| Catálogo do varejo lido de `GET /api/produtos` e `GET /api/categorias`, com "Carregando o catálogo…", erro com "Tentar de novo" e aviso de catálogo vazio. Produto com `ativo = false` não aparece. As abas de categoria passam a ser as do banco | `js/catalogo-api.js` (novo), `js/script.js` | RF05, RF06 |
| O mesmo para o balcão de atacado (preço de revenda e unidades por caixa vindas do banco) | `js/atacado.js` | RF05, RF13 |
| O carrinho salvo não é apagado se o catálogo ainda não chegou ou falhou | `js/script.js`, `js/atacado.js` | RF07 |
| Painel carrega os produtos do banco e o **Publicar** grava pela API: produto novo por `POST /api/produtos`, alterado por `PUT /api/produtos/:sku`, removido por `DELETE /api/produtos/:sku`, foto nova por `POST /api/produtos/:id/foto` (multipart), sempre com o token JWT. Regras, loja e horário continuam saindo pelo `ajustes.js`, porque a API não tem rota para eles | `js/admin.js` | RF16 |
| Fotos que vêm do servidor (`/img/produtos/...`) aparecem na loja e no painel | `js/dados.js`, `js/admin.js`, `js/catalogo-api.js` | RF16 |
| Textos que vêm da API são limpos antes de entrar no HTML | `js/catalogo-api.js` | RNF03 |
| Configuração da Vercel para o front (monta a página React e publica `frontend/`) | `vercel.json` (novo) | RNF11 |
| Acessibilidade: carrinho fechado e gaveta do atacado fora do Tab (`inert`), fotos com texto alternativo (marca, nome e volume), áreas com rolagem acessíveis pelo teclado, busca sem resultado anunciada ao leitor de tela, auditoria axe em todas as telas | `index.html`, `atacado.html`, `js/script.js`, `js/atacado.js`, `js/dados.js`, `js/admin.js`, `tests/e2e/acessibilidade.spec.js` | RNF02 |
| Testes da integração com a API simulada (catálogo, erro, vazio, carregando, carrinho, atacado e CRUD do painel com token) | `tests/e2e/integracao-api.spec.js` (novo) | RNF10 |
| **Página Pedidos do painel em React + Bootstrap** (`/conta/pedidos.html`): só para administrador, contagem por status, filtro, busca por nº, nome ou e-mail e troca de status (`GET /api/pedidos`, `PATCH /api/pedidos/:id/status`). Sem a API, explica como os pedidos chegam | `frontend-react/src/pages/PaginaPedidos.jsx`, `components/TabelaPedidos.jsx`, `services/pedidos.js`, `services/api.js` (novos) | RF19 |
| "Minha conta" lê o histórico de `GET /api/pedidos/meus`, com número e status de cada pedido; se o servidor não responder, usa o histórico do aparelho | `frontend-react/src/context/ContaContext.jsx`, `components/ListaPedidos.jsx` | RF14 |
| Checkout e atacado gravam o pedido em `POST /api/pedidos` ao mesmo tempo em que abrem o WhatsApp; a tela final mostra o nº do pedido ou avisa que não foi registrado | `js/script.js`, `js/atacado.js`, `index.html` | RF10, RF12 |
| Botão "Minha conta" no topo da loja e do atacado; botão "Pedidos" no painel | `index.html`, `atacado.html`, `admin.html` | RF14, RF19 |
| E-mail de administrador de demonstração (`admin@zerograu.com.br`) para o painel abrir no site publicado em modo simulado | `js/config.js` | RF21 |

Rodadas anteriores (já na `main`): login com senha validada, cadastro pela API, carrinho por conta, painel só para administrador, cupom configurável (ZEROGRAU10), indicadores inventados retirados, dados da loja vindos do painel, página "Minha conta" em React + Bootstrap, publicação e CI consertados.

### Contraste (aplicado)

Os três textos abaixo do contraste mínimo do WCAG AA foram corrigidos: "informe o CEP" no carrinho (3,65:1 para 5,52:1), "opcional" nos campos de endereço e a linha esgotada do atacado (1,9:1 para 5,43:1). A auditoria axe passa em todas as telas.

## 3. Back-end e banco de dados: levantamento (nada foi alterado)

Ordenado pelo impacto na nota da Etapa 3. Os números de linha são de `backend/server.js` em `1912ef8`.

### Bloqueiam a integração com o site no ar

| # | Problema | Onde | O que fazer |
|---|---|---|---|
| B1 | **Rotas de escrita sem autenticação.** Qualquer pessoa cria, altera ou apaga produto e categoria e sobe foto. A função `autenticarToken` existe, mas não é usada em nenhuma rota, e nada confere se o perfil é `admin` | `:154`, `:208`, `:235`, `:254`, `:327`; função em `:359` | Aplicar `autenticarToken` e um `exigirAdmin` (perfil `admin` no token) nessas rotas. O front já manda `Authorization: Bearer <token>` (RF21, RNF03) |
| B2 | **Sem CORS.** O site no Pages ou na Vercel não consegue chamar a API em outro domínio: o navegador bloqueia | `server.js` (falta) | `npm i cors` e `app.use(cors({ origin: [localhost, costamaiavitor.github.io, domínio da Vercel] }))` |
| B3 | **Tabela de categorias com dois nomes.** O model usa `categorias`; a migration e o seeder usam `Categoria`. Com o `sync`, podem ficar duas tabelas, e `GET /api/categorias` lê a que o seeder não preenche. O front precisa dessa rota para montar as abas | `src/models/Categoria.js:26`, migration `:10`, seeder `:7` | Usar um nome só (o mais simples é `tableName: "Categoria"` no model) |
| B4 | **Filtro `?cat=` quebra.** Filtra por uma coluna `cat` que não existe no model (o campo é `categoria_id`): erro 500 | `:175` | Buscar a categoria pelo `slug` e filtrar por `categoria_id`. O front hoje filtra sozinho, então não depende disso |
| B5 | **Seeder com catálogo fictício.** 15 produtos sem álcool ("Cola Pop", "Energy One") com SKUs `REF001`… e categorias que o site não tem (refrigerante, suco, isotônico). O catálogo real do site (15 rótulos, com fotos) está em `frontend/js/dados.js` | `src/seeders/20261015222548-carga-15-produtos.js` | Trocar a carga pelos produtos e categorias de `dados.js`, com os mesmos SKUs (o carrinho e o "pedir de novo" usam o SKU) |
| B6 | **Não há como criar um administrador.** Todo cadastro entra com `perfil: "cliente"`, então ninguém consegue usar o painel com a API ligada | `:62` | Script ou seeder que cria um admin a partir de variáveis do `.env` (sem senha no repositório) |

### Segurança e qualidade

| # | Problema | Onde | O que fazer |
|---|---|---|---|
| B7 | Segredo do JWT com valor padrão escrito no código (`"zero_grau_segredo_padrao"`) | `:107`, `:367` | Exigir `JWT_SECRET` no `.env` e falhar ao subir se faltar (RNF03) |
| B8 | Falta `backend/.env.example` com `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `PORT` | `backend/` | Criar o arquivo, sem valores reais |
| B9 | `POST /api/produtos` e `POST /api/categorias` gravam o `req.body` inteiro (dá para mandar `id` ou qualquer campo). A rota exige um campo `cat` que não existe no model | `:156`, `:212`, `:221` | Escolher os campos aceitos e validar tipos |
| B10 | `DELETE` apaga o produto; o RF16 diz "desativar". O model já tem `ativo` | `:261` | `produto.update({ ativo: false })`. O front já esconde produto com `ativo = false` |
| B11 | Foto usa `:id` e o resto usa `:sku`. O arquivo vai para `frontend/img/produtos/`, que some a cada deploy num serviço de nuvem | `:327`, `:295` | Padronizar o parâmetro; guardar a foto num serviço de arquivos ou no banco |
| B12 | Erros 500 devolvem `erro.message` (detalhe interno do banco) para o navegador | `:149`, `:160`, `:229`, `:356` | Mensagem genérica para o cliente e detalhe só no log |
| B13 | Cadastro não confere CPF/CNPJ nem o formato do e-mail no servidor | `:40-66` | Mesmas regras do front (`js/porta.js`) |
| B14 | `sequelize.sync({ alter: true })` ao subir junto com migrations: o banco pode divergir do que as migrations descrevem (só 2 das 12 tabelas têm migration) | `:284` | Escolher um caminho: migrations para todas as tabelas, ou só o `sync` |
| B15 | Sem testes do back-end; o script `test` aponta para `tests/smoke.mjs`, que não existe dentro de `backend/` | `backend/package.json:8` | Testes de rota (ex.: `node:test` + `supertest` com SQLite em memória) e incluir no CI (RNF10) |
| B16 | Arquivos de teste commitados: `backend/teste.png` e `frontend/img/produtos/produto-1-1792125537424.png` | — | Remover e ignorar a pasta de uploads |

### Rotas previstas no Plano de Trabalho que não existem

Os models já existem (`Pedido`, `ItemPedido`, `Pagamento`, `Endereco`, `Cupom`, `RegraVenda`, `FaixaAtacado`, `Loja`, `Horario`); faltam as rotas.

| Rota | Para quê | Requisito | Observação |
|---|---|---|---|
| `POST /api/pedidos` | gravar o pedido, itens, endereço e pagamento | RF10 | recalcular preço, desconto e frete no servidor (RNF04) e baixar o estoque na mesma transação (RNF05, RF20) |
| `GET /api/pedidos/meus` | histórico do cliente | RF14 | a página "Minha conta" passa a ler daqui |
| `GET /api/pedidos` e `PATCH /api/pedidos/:id/status` | aba Pedidos do painel; recebido → confirmado → em preparo → saiu → entregue (e cancelado, devolvendo o estoque) | RF19, RF20 | só admin |
| `POST /api/frete` | taxa pelo CEP no servidor | RF08, RNF04 | a tabela de bairros está em `frontend/js/dados.js` (`ENTREGA`) |
| `/api/cupons` e `POST /api/cupons/validar` | cupom no banco e "1 uso por CPF" de verdade | RF09 | o model `Cupom` não tem o campo `teto` (o site usa teto de R$ 30) |
| `GET/PUT /api/regras/:canal` | pedido mínimo, frete grátis, desconto e faixas do atacado | RF17 | models `RegraVenda` e `FaixaAtacado` |
| `GET/PUT /api/loja` | contato, WhatsApp, Pix e horário | RF18 | models `Loja` e `Horario` |

O front **já chama** as rotas de pedido. Enquanto elas não existirem, o site segue funcionando como antes (pedido pelo WhatsApp, histórico do aparelho, página de Pedidos avisando que o servidor ainda não tem a função). Para tudo funcionar junto, o back-end precisa seguir o formato abaixo.

### Contrato das rotas de pedido que o front já usa

Todas com `Authorization: Bearer <token>` do login.

**`POST /api/pedidos`** (cliente logado). Corpo enviado pelo site:

```json
{
  "canal": "varejo",
  "itens": [{ "sku": "absolut-1l", "quantidade": 2, "unidade": "un" }],
  "cupom": "ZEROGRAU10",
  "entrega": {
    "modalidade": "entrega",
    "cep": "60160000",
    "logradouro": "Rua Silva Paulet",
    "numero": "100",
    "complemento": null,
    "referencia": null,
    "destinatario": "Ana Cliente"
  },
  "pagamento": { "momento": "entrega", "forma": "dinheiro", "troco_para": 200, "txid": null },
  "observacao": "portão azul",
  "agendado": false
}
```

No atacado, `"canal": "atacado"`, `"unidade": "cx"` e só `"modalidade"` em `entrega`. O servidor recalcula preço, desconto e frete (RNF04), baixa o estoque na mesma transação (RNF05) e responde `201` com `{ "pedido": { "id": 77, ... } }`. O site mostra "Pedido nº 77 registrado na loja".

**`GET /api/pedidos/meus`** (cliente) e **`GET /api/pedidos`** (admin). Devolvem uma lista. O site lê de cada pedido:

```json
{
  "id": 41,
  "criado_em": "2026-10-15T23:00:00Z",
  "status": "recebido",
  "total": "126.62",
  "canal": "varejo",
  "modalidade": "entrega",
  "usuario": { "nome": "Ana Cliente", "email": "ana@exemplo.com" },
  "itens": [{ "quantidade": 2, "unidade": "un", "produto": { "sku": "absolut-1l", "marca": "Absolut", "nome": "Vodka Original 700 ml" } }]
}
```

Os nomes que o Sequelize gera por padrão (`Usuario`, `ItemPedidos`, `Produto`) também são aceitos.

**`PATCH /api/pedidos/:id/status`** (admin). Corpo `{ "status": "confirmado" }`. Status aceitos pelo site: `recebido`, `confirmado`, `em_preparo`, `saiu`, `entregue`, `cancelado`. Em caso de recusa, devolver `400` com `{ "erro": "mensagem" }`: o site mostra a mensagem e volta o status anterior.

## 4. Como colocar o sistema inteiro no ar

1. **Banco MySQL na nuvem** (ex.: Aiven, TiDB Cloud ou Railway; todos têm plano gratuito). Anotar host, porta, usuário, senha e nome do banco.
2. **API** num serviço que roda Node continuamente (ex.: Render ou Railway): pasta `backend/`, comando `npm start`, variáveis do `.env` (B8) no painel do serviço. Antes, resolver B1, B2, B3, B5, B6 e B7.
3. **Front na Vercel**: importar o repositório; o `vercel.json` já diz o que montar e publicar. O GitHub Pages continua funcionando em paralelo.
4. **Ligar o site na API**: em `frontend/js/config.js`, `apiBase` com o endereço da API (ex.: `https://zero-grau-api.onrender.com/api`) e `usarMock: false`. Criar o administrador (B6) e entrar com ele no painel.

## 5. Como conferir

```bash
npm install
npm install --prefix frontend-react
npx playwright install chromium
npm test
```

`npm test` monta a página React e roda a suíte inteira (varejo, atacado, painel, Minha conta, acessibilidade, integração com a API simulada) e o teste de fumaça.
