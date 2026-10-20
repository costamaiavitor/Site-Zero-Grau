# Fase 0: inventário do repositório e linha de base

Branch `correcoes-integracao`, criada a partir da `main` em `82466b3` (16/10/2026). Nenhum arquivo do site nem do back-end foi alterado nesta fase: só entraram a suíte de testes e o que ela precisa para rodar.

## 1. Estado geral

| Parte | Situação |
|---|---|
| `frontend/` | Protótipo completo em HTML/CSS/JS puro, dados em `js/dados.js` + `js/ajustes.js` e no `localStorage`. **Não chama nenhuma rota da API.** O teste de fumaça antigo (`tests/smoke.mjs`, 409 verificações) passa inteiro contra `frontend/`. |
| `backend/` | Express + Sequelize (MySQL 8): cadastro, login com JWT, categorias e CRUD de produtos com foto. Sem testes, sem CORS e sem proteção nas rotas de escrita. |
| GitHub Actions | **Os dois workflows estão vermelhos desde 15/10** (ver §4). |
| GitHub Pages | O último deploy que deu certo é de **29/09** (pasta `ZeroGrau/`). Tudo o que entrou depois não está no ar. |

## 2. Arquivos e o que cada um faz

### Front-end (`frontend/`)

| Arquivo | O que faz | Requisitos |
|---|---|---|
| `index.html` | Loja de varejo: casca de uma tela com 5 vistas (Início, Catálogo, Como pedir, Cupom, Entrega), aviso 18+, porta (entrar/criar conta), carrinho em 4 etapas (lista, entrega e pagamento, Pix, pedido pronto), toast | RF01, RF02, RF04–RF12, RF14, RF15 |
| `atacado.html` | Balcão de atacado para CNPJ: tabela por caixa fechada, resumo do pedido (coluna fixa acima de 1080 px, gaveta abaixo) | RF13 |
| `admin.html` | Painel do dono: abas Produtos, Varejo, Atacado, Loja e Publicação; diálogos de foto e de publicação | RF16, RF17, RF18 (sem RF21: abre para qualquer pessoa) |
| `creditos.html` | Créditos e licenças das fotos | — |
| `js/dados.js` | Fonte única: `BEBIDAS`, `CATEGORIAS`, `CONTATO`, `PIX`, `HORARIO`, `ESTATISTICA`, `REGRAS` (varejo e cupom), `ATACADO`, `CAIXA_*`, tabela de distância `ENTREGA`, horário de Fortaleza (`situacaoLoja`) e as três camadas de ajustes (base → publicado → rascunho do painel, com aviso de prévia) | RF05, RF08, RF09, RF13, RF15, RF17, RF18 |
| `js/ajustes.js` | Arquivo gerado pelo painel ("Publicar"): retrato do catálogo e das regras. Hoje traz o cupom **DANGATINHO 67%, mínimo R$ 100**, e raio de 30 km | RF16, RF17 |
| `js/porta.js` | Aviso 18+, login e cadastro (contas em `localStorage` `zg-contas`, **sem senha**: qualquer senha com 6+ caracteres entra), CPF → varejo e CNPJ → atacado, máscara, dígito verificador (desligado em `CONFERE_DIGITO`), foco preso nos diálogos, "trocar conta" | RF01, RF02, RF03 (parcial), RF04, RNF02, RNF06 |
| `js/script.js` | Vitrine: cards, abas de categoria, busca sem acento, carrinho (`localStorage` `zg-carrinho`, **mesma chave para todas as contas**), cupom, CEP no ViaCEP, checkout com troco e observação, mensagem do WhatsApp, Pix, "pedir de novo" (`zg-pedidos`), horário, manchete sorteada, indicadores inventados no rodapé | RF05–RF12, RF14, RF15 |
| `js/atacado.js` | Tabela do atacado, pedido em caixas (`zg-atacado`), faixas de volume, frete, envio pelo WhatsApp | RF06, RF13 |
| `js/admin.js` | Edição em rascunho, validação de campo, foto (recorte e WebP no navegador), horário, estatística, publicação no GitHub por token pessoal ou download do `ajustes.js`, histórico | RF16, RF17, RF18 |
| `js/pix.js` | BR Code (EMV + CRC16), normalização da chave, `txid` do pedido | RF11 |
| `js/app.js` | Registro do service worker, botão "Instalar o app", estatística (Plausible / GA4 com consentimento) | RNF07, RNF09 |
| `js/vendor/qrcode.js` | Biblioteca do QR code, carregada só no Pix | RF11 |
| `sw.js`, `manifest.webmanifest`, `icone-*.png`, `favicon.svg` | PWA: rede primeiro, cópia em cache para abrir sem sinal | RNF09 |
| `css/style.css`, `css/temas.css` | Visual: tema escuro neon "madrugada" (varejo) e "balcao" (atacado e painel), tokens de cor e tipografia (Gabarito + Manrope) | RNF01, RNF02 |
| `img/*.webp` | 15 produtos em 200 e 400 px | RNF08 |
| `img/produtos/produto-1-1792125537424.png` | **Arquivo de teste** gerado pelo upload do back-end e commitado por engano | — |
| `og.jpg`, `robots.txt`, `sitemap.xml` | Prévia de compartilhamento e SEO | — |

### Back-end (`backend/`)

| Arquivo | O que faz | Requisitos |
|---|---|---|
| `server.js` | Express na porta 3000, serve `frontend/` como estático; rotas `POST /api/auth/cadastro` (bcrypt), `POST /api/auth/login` (JWT 24 h), `GET/POST /api/categorias`, `GET/POST/PUT/DELETE /api/produtos[/:sku]`, `POST /api/produtos/:id/foto` (multer, 5 MB); `sequelize.sync({ alter: true })` ao subir | RF02, RF03, RF05, RF06, RF16, RNF03 (parcial) |
| `src/config/database.js`, `config.js`, `.sequelizerc` | Conexão MySQL pelo `.env` (`DB_*`) e configuração do Sequelize CLI | — |
| `src/models/*.js` | 12 models: Usuario, Endereco, Categoria, Produto, Pedido, ItemPedido, Pagamento, Cupom, Loja, Horario, RegraVenda, FaixaAtacado | base de RF02–RF21 |
| `src/models/relacionamentos.js` | Associações (1:N e 1:1) do diagrama ER | — |
| `src/migrations/*` | Cria `Categoria` e `Produtos`; ajusta o ENUM de `embalagem` | — |
| `src/seeders/*` | 5 categorias e 15 produtos **sem álcool e fictícios** ("Cola Pop", "Energy One"…) | — |
| `requisicoes.http` | Exemplos de chamada (REST Client) | RNF10 (documentação parcial) |
| `teste.png` | Imagem de teste do upload | — |

### Resto do repositório

| Caminho | O que é |
|---|---|
| `tests/smoke.mjs` | Teste de fumaça antigo (Playwright puro, 409 verificações, 9 larguras). Ainda aponta para `ZeroGrau/` |
| `tests/e2e/`, `tests/servidor.mjs`, `playwright.config.js`, `package.json` (raiz) | **Novos nesta fase**: suíte de regressão (ver §5) |
| `.github/workflows/ci.yml`, `pages.yml` | Testes a cada push e publicação no Pages |
| `ferramentas/*.py` | Baixar, padronizar e conferir as fotos (Open Food Facts) |
| `docs/entrega-1/` | Plano de Trabalho (docx/pdf), apresentação, diagramas e os geradores (`fonte/conteudo.cjs` tem RF01–RF21 e RNF01–RNF11) |
| `docs/site/` | Guias do protótipo; ainda falam em `ZeroGrau/` |

## 3. Requisitos: onde está cada um hoje

| Req. | Hoje | Onde |
|---|---|---|
| RF01 maioridade | feito | `porta.js`, `#gate` |
| RF02 cadastro | parcial: só no navegador; API existe e não é chamada | `porta.js` `cadastrar()`; `server.js` |
| RF03 login + JWT | **falta no front**: qualquer senha entra; API pronta | `porta.js` `autenticar()`; `server.js` |
| RF04 CPF → varejo, CNPJ → atacado | feito | `porta.js` |
| RF05 catálogo do banco | parcial: catálogo em JS; API existe | `dados.js`; `GET /api/produtos` |
| RF06 busca e filtro | feito no front; na API o filtro `?cat=` usa uma coluna que não existe | `script.js`, `atacado.js`; `server.js` |
| RF07 carrinho com estoque | feito (sem separar por conta) | `script.js` |
| RF08 frete pelo CEP | feito no front (ViaCEP + tabela); sem `/api/frete` | `script.js`, `dados.js` |
| RF09 mínimo, frete grátis, cupom | parcial: cupom único sem teto, sem validade, sem "1 uso por CPF" | `dados.js`, `script.js` |
| RF10 finalizar e gravar | parcial: monta o pedido, não grava | `script.js` |
| RF11 Pix | feito (só aparece com chave cadastrada; hoje não há chave publicada) | `pix.js` |
| RF12 WhatsApp | feito | `script.js`, `atacado.js` |
| RF13 atacado | feito | `atacado.js` |
| RF14 histórico e pedir de novo | parcial: últimos 5 no aparelho | `script.js` |
| RF15 aberto/fechado e agendado | feito | `dados.js`, `script.js` |
| RF16 CRUD de produtos com foto | parcial: no painel por arquivo; API existe e não é usada; DELETE apaga em vez de desativar | `admin.js`; `server.js` |
| RF17 regras do varejo e do atacado | feito no painel, por arquivo | `admin.js` |
| RF18 dados da loja | feito no painel, por arquivo | `admin.js` |
| RF19 pedidos e status | falta | — |
| RF20 baixa de estoque | falta | — |
| RF21 painel e escrita só admin | falta (front e API) | — |
| RNF01 responsivo | feito no front (smoke cobre 320–1920 px) | `style.css` |
| RNF02 acessibilidade | parcial: foco preso e rótulos ok; fotos com `alt=""`; contraste não medido | vários |
| RNF03 segurança | parcial: bcrypt e JWT na API; segredo do JWT com valor padrão escrito no código | `server.js` |
| RNF04 recálculo no servidor | falta | — |
| RNF05 transação pedido + estoque | falta | — |
| RNF06 18+ | feito | `porta.js` |
| RNF07 LGPD | feito no front (estatística com consentimento) | `app.js` |
| RNF08 WebP e < 3 s | feito (WebP 200/400) | `img/` |
| RNF09 PWA | feito | `sw.js`, `manifest.webmanifest` |
| RNF10 GitHub Actions | **quebrado** desde 15/10 | `.github/workflows` |
| RNF11 Vercel | falta | — |

## 4. Problemas encontrados que não estão na lista do pedido

Anotados aqui para decisão. Nada foi corrigido.

1. **Publicação no Pages quebrada.** `pages.yml` publica a pasta `ZeroGrau`, que virou `frontend` no commit `293cfa4` (14/10). O site no ar é o de 29/09.
2. **CI quebrado.** O `package.json` da raiz foi movido para `backend/`; o `npm install && npm test` da raiz falha. O `backend/package.json` tem `"test": "node tests/smoke.mjs"`, caminho que não existe dentro de `backend/`.
3. **"Publicar" do painel grava no lugar errado.** `admin.js` envia para `ZeroGrau/js/ajustes.js` e `ZeroGrau/img/` pelo GitHub: recriaria a pasta antiga e o site não mudaria. Os guias de `docs/site/` e o diálogo do painel também mandam subir em `ZeroGrau/js/`.
4. **Back-end**:
   - `GET /api/produtos?cat=…` filtra pela coluna `cat`, que não existe (o model usa `categoria_id`): erro 500.
   - As rotas de escrita (produtos, categorias, foto) não exigem token: `autenticarToken` existe mas não é usado em nenhuma.
   - `JWT_SECRET` tem o valor padrão `"zero_grau_segredo_padrao"` escrito no código; não há `.env.example`.
   - `DELETE /api/produtos/:sku` apaga o registro; o RF16 diz "desativar" (o campo `ativo` existe).
   - A foto usa `:id` e o resto usa `:sku`.
   - O model `Categoria` usa a tabela `categorias`; a migration e o seeder usam `Categoria`.
   - `sync({ alter: true })` ao subir, junto com migrations: o banco pode divergir das migrations.
   - Os nomes dos campos do produto na API (`volume`, `teor_alcoolico`, `embalagem`, `preco_promo`, `valor_casco`, `foto_url`, `categoria_id`) diferem dos do front (`vol`, `teor`, `forma`, `promo`, `casco`, `foto`, `cat`): a integração precisa de um tradutor.
   - O seeder põe 15 produtos fictícios sem álcool em categorias que o front não tem (refrigerante, suco, isotônico); o catálogo real do front é outro.
   - Os erros 500 devolvem `erro.message` ao cliente; o cadastro não confere CPF/CNPJ nem o formato do e-mail.
   - O upload grava dentro de `frontend/img/produtos/` (e um arquivo de teste foi commitado).
5. **Textos que prometem o que o site não faz** (decisão de conteúdo, fora da lista do pedido): "Como pedir" fala em favoritos, vários endereços e status em tempo real; "Entrega" oferece crédito e débito "no site" e vale-refeição, que o checkout não tem; o título e a meta da página prometem "entrega em 40 minutos"; "Câmara fria própria desde 2014".
6. **Endereço fixo no HTML** além do `CONTATO`: "Loja física na Av. Santos Dumont" e "Aldeota, Fortaleza" na vista Entrega. Isso entra no item 6 da Fase 1.

## 5. Linha de base (Playwright)

- `npm test` na raiz roda `tests/e2e` em três projetos: **w320, w768 e w1280**.
- Servidor estático próprio (`tests/servidor.mjs`), sem dependência, servindo `frontend/`.
- Determinismo: relógio fixo (sexta 16/10/2026, 20h em Fortaleza; o "loja fechada" usa sábado às 5h), `Math.random` fixo (manchete e indicadores sempre iguais), ViaCEP simulado, WhatsApp e área de transferência interceptados, service worker bloqueado (exceto no teste do PWA), fontes do Google em cache local (`node_modules/.cache/fontes-teste`).
- Os testes rodam sobre o `ajustes.js` **publicado de verdade** (DANGATINHO, raio de 30 km), porque essa é a loja de hoje. O Pix usa uma chave de teste injetada só no teste do Pix, porque hoje não há chave publicada.
- Screenshots de referência em `tests/e2e/referencias/win32/`. Renderização de fonte muda entre sistemas: no CI (Linux), enquanto não existir `referencias/linux/`, as comparações de imagem são puladas e os testes de comportamento rodam normalmente.
- Local: 1 worker por padrão (com 4 workers a máquina ficou sem memória livre e tudo estourou o tempo; não era defeito do site). `WORKERS=2 npm test` para mudar.

Cobertura (por largura):

| Arquivo | Fluxos |
|---|---|
| `porta.spec.js` | aviso 18+, foco preso, lembrar a idade, criar conta (rótulo e máscara por documento, erros), CPF → varejo, CNPJ → atacado, trocar de conta e entrar de novo, e-mail sem conta |
| `varejo.spec.js` | as 5 abas (screenshot de cada), filtro por categoria, busca sem acento e por início de palavra, busca vazia, copiar cupom, CEP na abertura (ok, fora do raio, inexistente, curto), WhatsApp, loja fechada |
| `carrinho.spec.js` | +, −, remover, limite de estoque, pedido mínimo, cupom (válido, inválido, abaixo do mínimo), carrinho vazio, foco preso e Esc, persistência; checkout com dinheiro, troco e observação até a mensagem do WhatsApp; troco inválido; número faltando; pedir de novo; loja fechada = agendado; Pix com QR code, copia e cola, valor e referência |
| `atacado.spec.js` | tabela por caixa, montar pedido até o WhatsApp, faixa de volume, limite de caixas, abas e busca, conta CPF devolvida ao varejo, persistência |
| `admin.spec.js` | as 5 abas (screenshot de cada), catálogo publicado, setas do teclado, rascunho → prévia na loja, descartar, publicar sem chave |
| `paginas.spec.js` | créditos, manifest e ícones, service worker e cache, carga sem erro de console e sem 404 |
| `responsivo.spec.js` | sem rolagem lateral em todas as vistas, no carrinho aberto, no atacado, no painel e nos créditos |
