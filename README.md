# Zero Grau · Distribuidora de Bebidas

Site estático de uma distribuidora que atende as duas pontas: quem vai beber e
quem vai revender. Sem framework e sem build — HTML, CSS e alguns arquivos de
JavaScript.

São duas lojas sobre o mesmo estoque:

| | quem entra | como é | unidade de venda |
|---|---|---|---|
| **Varejo** `index.html` | CPF | vitrine, foto grande, slogan | unidade |
| **Atacado** `atacado.html` | CNPJ | tabela sóbria, sem slogan | caixa fechada |

Quem decide é a porta, em `js/porta.js`: depois do aviso de idade o site pede
CPF ou CNPJ e manda para a loja correspondente. É identificação, não
autenticação — não há senha, não há servidor e não há consulta à Receita. Num
site estático não dá para ir além, e fingir que dá seria pior.

⚠ **A conferência do dígito verificador está desligada.** Hoje passa qualquer
número com 11 dígitos (vai para o varejo) ou 14 (vai para o atacado). O
algoritmo dos dois documentos continua em `js/porta.js` e coberto por teste;
para religar, troque `CONFERE_DIGITO` para `true` e mais nada muda.

Nenhuma das duas rola a página. O conteúdo que antes vinha empilhado em onze
seções virou vistas que se revezam no mesmo espaço; rola só a lista de
produtos. Sem JavaScript as vistas voltam a empilhar e a página rola como
qualquer documento, que é o que o buscador lê.

O varejo abre na vista **Início**, não no catálogo: quem chega precisa saber
de quem é a loja, quanto custa a entrega e em quanto tempo ela chega antes de
encarar dezenove rótulos. O catálogo fica a um clique, na aba ou no botão.

As duas lojas têm o botão **Trocar conta** no topo: ele limpa o documento
desta aba e reabre a porta. Num site que escolhe a vitrine pelo documento,
errar o documento não pode ser sem saída.

No celular a navegação desce para uma barra fixa no pé da tela, ao alcance do
polegar, e a faixa de operação do rodapé sai — os mesmos números estão na
abertura. Todo alvo de toque tem no mínimo 44 px de altura, e o teste de
fumaça percorre as cinco vistas e as duas lojas medindo isso.

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

O `tests/smoke.mjs` sobe um servidor próprio e passa o Chromium pelas duas
lojas em nove larguras, com e sem JavaScript. Cobre o que já quebrou alguma
vez: busca com acento, entrega fora do raio, o aviso de idade travando a página
sem JavaScript, manchete estourando a coluna, números de catálogo divergindo do
estoque, a página voltando a rolar e o pingue-pongue entre varejo e atacado.
Roda também em cada push, por `.github/workflows/ci.yml`.

Em rede sem saída para o Google Fonts, aponte as fontes para um espelho local:

```bash
FONTES_DIR=/caminho/para/fontes npm test
```

## Como está organizado

```
ZeroGrau/
  index.html        varejo: vitrine em quatro vistas
  atacado.html      atacado: tabela por caixa fechada
  creditos.html     atribuição das fotos (exigida pelas licenças CC BY-SA)
  css/style.css     estrutura e componentes; o :root guarda todos os tokens
  css/temas.css     as duas peles: "Madrugada" no varejo, "Balcão" no atacado
  js/dados.js       catálogo, contato e regras de venda — fonte única das duas
  js/porta.js       aviso de idade e identificação por CPF/CNPJ
  js/script.js      varejo: vistas, busca, carrinho, CEP, cupom
  js/atacado.js     atacado: tabela, pedido por caixa, faixas de desconto
  img/              fotos de produto em WebP, 200 e 400 px de altura
  robots.txt        libera o varejo, barra o atacado
  sitemap.xml       as duas páginas públicas
```

### Onde mexer

| Para mudar | Vá em |
|---|---|
| produtos, preço, estoque | `BEBIDAS`, no topo de `js/dados.js` |
| categorias e abas | `CATEGORIAS`, logo abaixo |
| telefone, WhatsApp, CNPJ, endereço | `CONTATO`, logo abaixo |
| taxa, raio, pedido mínimo, cupom | `TAXA_BASE`, `RAIO_MAX` e `REGRAS` |
| distância até cada bairro | `ENTREGA`, no fim de `js/dados.js` |
| desconto de revenda, pedido mínimo do atacado | `ATACADO` |
| quantas unidades tem cada caixa | `CAIXA_PADRAO` e `CAIXA_EXCECAO` |
| cor, tipografia, forma | os tokens em `css/temas.css` |
| conferir o dígito verificador na porta | `CONFERE_DIGITO`, em `js/porta.js` |

Ao mexer em `css/` ou `js/`, suba o `?v=` dos `<link>` e `<script>` das três
páginas. O GitHub Pages serve esses arquivos com `max-age=600`: sem o selo de
versão, quem esteve no site nos últimos dez minutos continua recebendo a
versão velha e acha que a mudança não foi ao ar.

Nenhum número de catálogo é escrito à mão no HTML. Os `data-total` da página
são preenchidos a partir de `BEBIDAS`, justamente para que os textos não possam
divergir do estoque — e as duas lojas leem a mesma lista, que é como elas
discordariam primeiro.

O preço de atacado sai do preço cheio de varejo, não da promoção: promoção de
fim de semana é isca, e não tem por que valer para quem leva vinte caixas.

## Imagens

As fotos de produto vêm do Open Food Facts, sob CC BY-SA. A atribuição exigida
pela licença está em `ZeroGrau/creditos.html`, com link no rodapé do site, e o
detalhamento técnico em `ZeroGrau/img/CREDITOS.md`.

São servidas em WebP em dois tamanhos, escolhidos pelo navegador conforme a
densidade da tela (`srcset` com descritores `x`, porque o card exibe a foto
sempre na mesma altura).

O recorte é feito pelo Adobe Photoshop, via o conector **Adobe for Creativity**
(`image_remove_background`), que segmenta o produto em vez de separar por cor —
distinção que importa, porque numa foto de fundo branco vidro transparente e
rótulo branco têm a mesma cor.

Para refazer o lote:

```bash
pip install pillow
python3 ferramentas/baixa-fotos.py        # frontais do Open Food Facts → /tmp/fonte2
# subir cada foto ao Adobe e rodar image_remove_background → /tmp/adobe
python3 ferramentas/padroniza-fotos.py    # iguala e exporta os WebP
```

O passo do meio é interativo: o conector Adobe exige que o arquivo esteja no
armazenamento dele (não aceita URL de terceiros), então cada foto passa por
`asset_initialize_file_upload` → PUT → `asset_finalize_file_upload` antes do
recorte. Evian e Monster não têm foto frontal no Open Food Facts; para esses, a
entrada é o recorte anterior achatado sobre branco.

O gelo não passa por aí. É o único item de marca própria, e a foto é da loja,
já recortada — entra direto no `padroniza-fotos.py`.

Os PNG do primeiro lote ficam no histórico do git, no commit `c000790`.

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
- [ ] Medir a distância real da loja até cada bairro e trocar a tabela
      `ENTREGA` em `js/dados.js` — os quilômetros de hoje são estimativa, e o
      endereço da loja também é exemplo. O CEP em si já é conferido de verdade,
      no ViaCEP.
- [ ] Trocar as fotos de produto por fotos da própria loja. As de hoje são de
      produto importado, do Open Food Facts; o banco brasileiro de lá é quase
      todo foto de celular com a mão na garrafa (ver "Imagens").
