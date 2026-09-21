# Zero Grau · Distribuidora de Bebidas

Vitrine estática de uma distribuidora de bebidas com entrega: catálogo com
busca e filtro, carrinho, cupom, cálculo de frete por CEP e fechamento do
pedido pelo WhatsApp. Sem framework, sem build — HTML, CSS e um arquivo de
JavaScript.

## Rodar

```bash
npm run dev     # sobe em http://localhost:8080
```

Qualquer servidor estático serve. Abrir o `index.html` direto pelo `file://`
funciona em quase tudo, menos no `localStorage` de alguns navegadores.

## Testar

```bash
npm install
npx playwright install chromium
npm test
```

O `tests/smoke.mjs` sobe um servidor próprio e passa o Chromium pelo site em
seis larguras, com e sem JavaScript. Cobre o que já quebrou alguma vez: busca
com acento, entrega fora do raio, o aviso de idade travando a página sem
JavaScript, manchete estourando a coluna e números de catálogo divergindo do
estoque. Roda também em cada push, por `.github/workflows/ci.yml`.

Em rede sem saída para o Google Fonts, aponte as fontes para um espelho local:

```bash
FONTES_DIR=/caminho/para/fontes npm test
```

## Como está organizado

```
ZeroGrau/
  index.html        vitrine, seção a seção
  creditos.html     atribuição das fotos (exigida pelas licenças CC BY-SA)
  identidade.html   estudo das quatro identidades visuais consideradas
  css/style.css     estrutura e componentes; o :root guarda todos os tokens
  css/temas.css     a pele que o site veste — redefine só os tokens
  js/script.js      catálogo, busca, carrinho, CEP, cupom
  img/              fotos de produto em WebP, 200 e 400 px de altura
```

### Onde mexer

| Para mudar | Vá em |
|---|---|
| produtos, preço, estoque | `BEBIDAS`, no topo de `js/script.js` |
| categorias, abas e cards | `CATEGORIAS`, logo abaixo |
| telefone, WhatsApp, CNPJ, endereço | `CONTATO`, logo abaixo |
| taxa, raio, pedido mínimo, cupom | `TAXA_BASE`, `RAIO_MAX` e `REGRAS` |
| cor, tipografia, forma | os tokens em `css/temas.css` |

Nenhum número de catálogo é escrito à mão no HTML. Os `data-total` e
`data-conta` da página são preenchidos a partir de `BEBIDAS`, justamente para
que os textos não possam divergir do estoque.

## Imagens

As fotos de produto vêm do Open Food Facts e do Wikimedia Commons, sob
CC BY-SA. A atribuição exigida pela licença está em `ZeroGrau/creditos.html`,
com link no rodapé do site, e o detalhamento técnico em
`ZeroGrau/img/CREDITOS.md`.

São servidas em WebP em dois tamanhos, escolhidos pelo navegador conforme a
densidade da tela (`srcset` com descritores `x`, porque o card exibe a foto
sempre na mesma altura). Os PNG originais de 600 px ficam no histórico do git,
no commit `c000790`, caso seja preciso reprocessar.

## Publicar

`.github/workflows/pages.yml` publica a pasta `ZeroGrau/` no GitHub Pages a
cada push na `main`. O conteúdo dessa pasta vira a raiz do site, então o
endereço é `https://costamaiavitor.github.io/Site-Zero-Grau/` — sem `ZeroGrau`
no caminho. É esse endereço que o `og:url` do `index.html` declara.

Duas condições, as duas fora do workflow e só na primeira vez:

1. **Repositório público.** No plano gratuito o Pages não atende repositório
   privado; em privado exige GitHub Pro ou superior.
2. **Settings → Pages → Source = GitHub Actions.**

O passo 2 não dá para automatizar: criar o site pela API exige permissão de
administração, que o `GITHUB_TOKEN` do workflow não recebe — com
`enablement: true` o `configure-pages` falha em "Resource not accessible by
integration". Enquanto o site não existir, o deploy morre em "Get Pages site
failed". Depois de criado uma vez, todo push na `main` publica sozinho.

Para hospedar sem tornar o repositório público, Netlify, Cloudflare Pages e
Vercel publicam pasta estática de repositório privado no plano gratuito. Nesse
caso, troque o `og:url` e o `og:image` pelo domínio novo.

## Antes de ir ao ar

- [ ] Trocar o bloco `CONTATO` em `js/script.js` pelos dados reais da loja
      (hoje são valores de exemplo: WhatsApp, telefone, e-mail e CNPJ).
- [ ] Apontar `og:url` e `og:image` em `index.html` para o domínio final.
- [ ] Escrever as páginas de "Trocas e devoluções" e "Política de casco" —
      hoje esses links caem no WhatsApp.
- [ ] O cálculo de distância do CEP é uma simulação a partir dos dígitos.
      Trocar por geocodificação de verdade antes de cobrar frete de alguém.
