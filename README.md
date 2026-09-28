# Zero Grau · Distribuidora de Bebidas

[![Testes](https://github.com/costamaiavitor/Site-Zero-Grau/actions/workflows/ci.yml/badge.svg)](https://github.com/costamaiavitor/Site-Zero-Grau/actions/workflows/ci.yml)
[![Publicação](https://github.com/costamaiavitor/Site-Zero-Grau/actions/workflows/pages.yml/badge.svg)](https://github.com/costamaiavitor/Site-Zero-Grau/actions/workflows/pages.yml)

Site de pedidos de uma distribuidora de bebidas de Fortaleza, com duas lojas
sobre o mesmo estoque: quem se cadastra com **CPF** compra no varejo, por
unidade; quem se cadastra com **CNPJ** compra no atacado, por caixa fechada.
O pedido fecha com entrega calculada pelo CEP, Pix ou pagamento na entrega, e
vai para o WhatsApp da loja. Um painel deixa o dono mudar preço, estoque e
regras sem mexer em código.

| | Endereço |
|---|---|
| Site no ar | https://costamaiavitor.github.io/Site-Zero-Grau/ |
| Atacado | https://costamaiavitor.github.io/Site-Zero-Grau/atacado.html |
| Painel do dono | https://costamaiavitor.github.io/Site-Zero-Grau/admin.html |

## Trabalho final da disciplina

Este repositório é também o trabalho final da disciplina. O site atual é o
**protótipo** (HTML, CSS e JavaScript, sem servidor). O plano é refazê-lo com
React + Bootstrap, API em Node.js + Express e banco MySQL.

| Entrega | Data | Situação | Material |
|---|---|---|---|
| 1 — Plano de Trabalho | 29/09/2026 | pronta | [`docs/entrega-1/`](docs/entrega-1) |
| 2 — MVP | 03/11/2026 | a fazer | — |
| 3 — Apresentação final com relatório | 26/11/2026 | a fazer | — |

## Estrutura do repositório

```
ZeroGrau/            o site, publicado no GitHub Pages a cada push na main
  index.html           loja de varejo
  atacado.html         balcão de atacado
  admin.html           painel do dono
  css/  js/  img/      estilos, scripts e fotos de produto
docs/                documentação
  entrega-1/           Plano de Trabalho: documento, apresentação e diagramas
  site/                guias de como o site funciona por dentro
ferramentas/         scripts em Python para padronizar e conferir as fotos
tests/               teste automático do site no navegador (Playwright)
.github/workflows/   testes a cada push (ci.yml) e publicação no Pages (pages.yml)
```

## Rodar e testar

```bash
npm run dev          # abre o site em http://localhost:8080
```

```bash
npm install
npx playwright install chromium
npm test             # passa o Chromium pelas duas lojas e pelo painel
```

Os testes rodam sozinhos a cada push. Se algum falhar, o selo "Testes" no
topo desta página fica vermelho.

## Onde mexer

Os caminhos abaixo são dentro de `ZeroGrau/`.

| Para mudar | Vá em |
|---|---|
| produtos, preço, estoque | `BEBIDAS`, no topo de `js/dados.js` |
| categorias e abas | `CATEGORIAS`, logo abaixo |
| telefone, WhatsApp, CNPJ, endereço | `CONTATO`, logo abaixo — ou a aba Loja do painel |
| chave Pix, horário, estatística | `PIX`, `HORARIO`, `ESTATISTICA` — ou a aba Loja do painel |
| taxa, raio, pedido mínimo, cupom | `TAXA_BASE`, `RAIO_MAX` e `REGRAS` |
| distância até cada bairro | `ENTREGA`, no fim de `js/dados.js` |
| desconto de revenda, pedido mínimo do atacado | `ATACADO` |
| quantas unidades tem cada caixa | `CAIXA_PADRAO` e `CAIXA_EXCECAO` |
| cor, tipografia, forma | os tokens em `css/temas.css` |
| conferir o dígito verificador na porta | `CONFERE_DIGITO`, em `js/porta.js` |
| ligar o login e o cadastro a um servidor | `autenticar()` e `cadastrar()`, em `js/porta.js` |
| preço, estoque e regras, sem mexer em código | `admin.html` ([guia do painel](docs/site/painel.md)) |
| publicar o painel direto num servidor | `publicar()`, em `js/admin.js` |
| tamanho mínimo da senha | `SENHA_MIN`, em `js/porta.js` |

Ao mexer em `css/` ou `js/`, suba o `?v=` dos `<link>` e `<script>` das
páginas, senão quem abriu o site nos últimos dez minutos continua vendo a
versão antiga.

## Guias

| Guia | Assunto |
|---|---|
| [Como o site funciona](docs/site/como-funciona.md) | porta e login, as duas lojas, cada arquivo, fechamento do pedido e Pix, app instalável e estatística |
| [Painel de administração](docs/site/painel.md) | o que o painel edita, as três camadas (base, publicado, rascunho), publicar com a chave do GitHub |
| [Fotos de produto](docs/site/fotos.md) | padrão das fotos, origem e licença, como refazer o lote |
| [Publicação e o que falta para ir ao ar](docs/site/publicacao.md) | GitHub Pages e a lista do que ainda é exemplo |

⚠ Hoje o login não tem servidor: as contas ficam só no navegador em que foram
criadas. O painel não tem senha; quem publica é quem tem a chave do GitHub.
Os detalhes estão nos guias acima.
