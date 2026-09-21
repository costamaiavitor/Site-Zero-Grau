# Créditos das imagens

As fotos de produto vêm do **Open Food Facts** (openfoodfacts.org), banco
colaborativo de produtos alimentícios. As imagens são publicadas sob
**CC BY-SA 3.0** — uso livre com atribuição e mesma licença.

A foto do gelo vem do **Wikimedia Commons** (Alicia Fagerving, CC BY-SA 4.0).

| Arquivo | Código de barras | Ficha do produto |
|---|---|---|
| `absolut-1l-200.webp` · `absolut-1l-400.webp` | `7312040017201` | [Open Food Facts](https://world.openfoodfacts.org/product/7312040017201) |
| `absolut-mango-1l-200.webp` · `absolut-mango-1l-400.webp` | `7312040350209` | [Open Food Facts](https://world.openfoodfacts.org/product/7312040350209) |
| `coca-cola-2l-200.webp` · `coca-cola-2l-400.webp` | `5449000009067` | [Open Food Facts](https://world.openfoodfacts.org/product/5449000009067) |
| `coventry-fizz-750-200.webp` · `coventry-fizz-750-400.webp` | `3596710187614` | [Open Food Facts](https://world.openfoodfacts.org/product/3596710187614) |
| `estrella-galicia-330-200.webp` · `estrella-galicia-330-400.webp` | `8412598000010` | [Open Food Facts](https://world.openfoodfacts.org/product/8412598000010) |
| `evian-15l-200.webp` · `evian-15l-400.webp` | `3068320120256` | [Open Food Facts](https://world.openfoodfacts.org/product/3068320120256) |
| `feldschlosschen-500-200.webp` · `feldschlosschen-500-400.webp` | `76129810` | [Open Food Facts](https://world.openfoodfacts.org/product/76129810) |
| `gelo-cubos-5kg-200.webp` · `gelo-cubos-5kg-400.webp` | — | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ice_cube_bag_02.jpg) |
| `goudale-blonde-750-200.webp` · `goudale-blonde-750-400.webp` | `3261570000044` | [Open Food Facts](https://world.openfoodfacts.org/product/3261570000044) |
| `guinness-draught-500-200.webp` · `guinness-draught-500-400.webp` | `5000213101223` | [Open Food Facts](https://world.openfoodfacts.org/product/5000213101223) |
| `ivanov-vodka-1l-200.webp` · `ivanov-vodka-1l-400.webp` | `3596710445417` | [Open Food Facts](https://world.openfoodfacts.org/product/3596710445417) |
| `jack-daniels-1l-200.webp` · `jack-daniels-1l-400.webp` | `3099873045864` | [Open Food Facts](https://world.openfoodfacts.org/product/3099873045864) |
| `martini-rosso-1l-200.webp` · `martini-rosso-1l-400.webp` | `3011932000805` | [Open Food Facts](https://world.openfoodfacts.org/product/3011932000805) |
| `monster-ultra-500-200.webp` · `monster-ultra-500-400.webp` | `5060337500401` | [Open Food Facts](https://world.openfoodfacts.org/product/5060337500401) |
| `no3-gin-700-200.webp` · `no3-gin-700-400.webp` | `5010493025775` | [Open Food Facts](https://world.openfoodfacts.org/product/5010493025775) |
| `red-bull-250-200.webp` · `red-bull-250-400.webp` | `9002490205973` | [Open Food Facts](https://world.openfoodfacts.org/product/9002490205973) |
| `seagrams-gin-700-200.webp` · `seagrams-gin-700-400.webp` | `5900685007910` | [Open Food Facts](https://world.openfoodfacts.org/product/5900685007910) |
| `smirnoff-ice-275-200.webp` · `smirnoff-ice-275-400.webp` | `5410316962094` | [Open Food Facts](https://world.openfoodfacts.org/product/5410316962094) |
| `spaten-fardo-350-200.webp` · `spaten-fardo-350-400.webp` | `4072700005780` | [Open Food Facts](https://world.openfoodfacts.org/product/4072700005780) |
| `tanqueray-750-200.webp` · `tanqueray-750-400.webp` | `5000281005904` | [Open Food Facts](https://world.openfoodfacts.org/product/5000281005904) |
| `villageoise-branco-250-200.webp` · `villageoise-branco-250-400.webp` | `3175520036338` | [Open Food Facts](https://world.openfoodfacts.org/product/3175520036338) |

> A versão pública desta página é `creditos.html`, na raiz do site — é ela que
> cumpre a exigência de atribuição das licenças CC BY-SA. Este arquivo é a
> fonte de referência no repositório; ao mexer num, mexa no outro.

## Tratamento aplicado

1. Download da foto em resolução média
2. Remoção do fundo por preenchimento a partir das bordas
3. Reconstrução do miolo em garrafas transparentes, interpolando a cor entre as
   bordas opacas de cada linha — sem isso o vidro claro some junto com o fundo
4. Recorte no contorno do produto e normalização em 600 px de altura
5. Revisão automática: rejeita imagem com buraco interno acima de 7,5 por cento,
   franja de fundo acima de 16 por cento ou proporção horizontal
6. Conversão para WebP em dois tamanhos, 200 e 400 px de altura, escolhidos pelo
   navegador conforme a densidade da tela. Os PNG originais de 600 px ficam no
   histórico do git, no commit `c000790`, caso seja preciso reprocessar

Todas as 21 imagens do catálogo passam nesse critério.
