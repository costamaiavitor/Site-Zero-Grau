# Back-end e banco de dados

A API fica em `backend/` (Node.js + Express + Sequelize + MySQL 8). Ela guarda
contas, catálogo, pedidos, cupons e os dados da loja, e também pode entregar o
próprio site: aberto pelo endereço da API, o site já entra em **modo API**
(contas valem em qualquer computador, pedidos ficam gravados na loja).

## Como está organizado

```
backend/
  server.js            sobe tudo: confere o banco, semeia o que falta, abre a porta
  src/app.js           Express: segurança, CORS, rotas, erros, entrega do site
  src/rotas/           auth, catalogo (categorias, produtos, fotos, atacado),
                       pedidos, loja (loja e regras), cupons
  src/auth.js          token JWT, exigirLogin e exigirAdmin
  src/regras.js        lê as regras do site (frontend/js/dados.js + ajustes.js)
  src/cupons.js        cupom do site (ZEROGRAU10) ou criado pela API
  src/esquema.js       prepara o banco a cada subida (ver abaixo)
  src/semente.js       dados iniciais: loja, horários, regras, catálogo, admin
  src/models/          as 13 tabelas e como se ligam (relacionamentos.js)
  scripts/             tornar-admin.js, carregar-catalogo.js
  tests/api.test.js    testes da API num MySQL de teste
  docs/swagger.json    documentação interativa em /api-docs
```

**O preço é sempre calculado no servidor.** O pedido chega só com SKU,
quantidade, entrega e pagamento; a API busca o preço no banco e aplica as
mesmas regras que o carrinho mostra (promoção, cupom com teto, pedido mínimo,
frete pela distância do bairro, desconto de revenda e faixas do atacado). As
regras vêm dos mesmos arquivos do site, então uma publicação do painel vale
para os dois (as rotas `/api/loja` e `/api/regras` guardam uma cópia para
consulta; quem vale no pedido é o que o painel publicou). O estoque baixa na mesma transação do pedido: se faltar um item,
nada é gravado. Cancelar devolve o estoque e o uso do cupom.

**Quem pode o quê.**

| Rota | Quem |
|---|---|
| catálogo, categorias, fotos, loja, regras, validar cupom | qualquer um |
| fazer pedido, meus pedidos, agendar | cliente logado |
| atacado | só conta com CNPJ |
| mudar produto, categoria, foto, loja, regras, cupons; ver todos os pedidos e mudar status | administrador |

A lista completa, com exemplos, está em `/api-docs` com o servidor no ar.

**Banco sem surpresa a cada reinício.** Antes, o `sync({alter:true})` recriava
os índices únicos a cada subida (`email_2`, `email_3`…) até o MySQL recusar.
Agora `src/esquema.js` cria só as tabelas e colunas que faltam, apaga os
índices repetidos que o alter deixou, e acerta as chaves estrangeiras: apagar
um produto, uma categoria ou um cliente com pedidos é recusado pelo banco (o
painel desativa o produto em vez de apagar). Pode rodar quantas vezes for.

**Fotos no banco.** A foto enviada pelo painel fica na tabela `fotos_produto` e
é servida em `/api/produtos/:id/foto`. Num serviço de nuvem a pasta do servidor
é apagada a cada publicação; no banco, não.

## Rodar na sua máquina

1. MySQL 8 rodando (local ou o do Aiven).
2. `cp backend/.env.example backend/.env` e preencha (o arquivo explica cada linha).
3. Suba:

```bash
npm ci --prefix backend
npm start --prefix backend      # http://localhost:3000 (site + API) e /api-docs
```

Num banco vazio, a primeira subida cria as tabelas, a loja, os horários, as
regras, as 5 categorias e os 15 produtos do site, e o administrador do `.env`.

| Comando (dentro de `backend/`) | Para quê |
|---|---|
| `npm run admin -- email@da.conta` | dá o perfil de administrador a uma conta (`--tirar` volta a cliente) |
| `npm run catalogo` | grava no banco os produtos do site que faltam |
| `npm run catalogo -- --substituir` | põe o catálogo do site por cima e desativa o resto (ex.: a carga antiga "Cola Pop") |

## Colocar no ar (Render + Aiven)

O banco já está no Aiven. A API vai no [Render](https://render.com), que tem
plano gratuito e lê o `render.yaml` da raiz do repositório.

1. No Aiven, abra o serviço MySQL → **Overview** → anote host, porta, usuário,
   senha e nome do banco.
2. No Render: **New → Blueprint**, escolha este repositório. Ele lê o
   `render.yaml` e pede as variáveis marcadas como secretas: `DB_HOST`,
   `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` e `ADMIN_SENHA` (8+
   caracteres). O `JWT_SECRET` é gerado sozinho. Nada disso vai para o GitHub.
3. Espere o deploy. O site com a API fica em `https://zero-grau.onrender.com`
   (ou o nome que o Render der). Entre com `admin@zerograu.com.br` e a
   `ADMIN_SENHA` para abrir o painel.
4. Se a conta já tinha sido criada com outra senha, rode no **Shell** do
   Render: `npm run admin --prefix backend -- admin@zerograu.com.br`.

No plano gratuito o Render "dorme" depois de 15 minutos sem visita; a primeira
visita depois disso demora uns 50 segundos.

**E o site do GitHub Pages?** Continua no modo simulado, como demonstração. Para
ele também usar a API, em `frontend/js/config.js` troque `apiBase` pelo
endereço do Render (`https://zero-grau.onrender.com/api`) e `usarMock` para
`false`. O CORS da API já aceita `costamaiavitor.github.io` e `*.vercel.app`.

## Testes

```bash
# MySQL de teste (o banco é zerado: o nome precisa ter "teste")
export DB_HOST=127.0.0.1 DB_NAME=zerograu_teste DB_USER=... DB_PASSWORD=...
npm run test:api     # 19 testes da API: contas, permissões, catálogo, pedidos, estoque, cupons, banco
npm run test:real    # o site inteiro no Chromium com a API e o banco, sem nada simulado
```

O CI roda os dois a cada push, com um MySQL 8 próprio (job "API e banco").
