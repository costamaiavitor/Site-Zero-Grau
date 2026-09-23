# Créditos das imagens

As fotos de produto vêm do **Open Food Facts** (openfoodfacts.org), banco
colaborativo de produtos alimentícios. As imagens são publicadas sob
**CC BY-SA 3.0** — uso livre com atribuição e mesma licença.

| Arquivo | Código de barras | Ficha do produto |
|---|---|---|
| `absolut-1l-200.webp` · `absolut-1l-400.webp` | `7312040017201` | [Open Food Facts](https://world.openfoodfacts.org/product/7312040017201) |
| `absolut-mango-1l-200.webp` · `absolut-mango-1l-400.webp` | `7312040350209` | [Open Food Facts](https://world.openfoodfacts.org/product/7312040350209) |
| `baly-melancia-2l-200.webp` · `baly-melancia-2l-400.webp` | `7898080664389` | [Open Food Facts](https://world.openfoodfacts.org/product/7898080664389) |
| `coca-cola-2l-200.webp` · `coca-cola-2l-400.webp` | `5449000009067` | [Open Food Facts](https://world.openfoodfacts.org/product/5449000009067) |
| `coventry-fizz-750-200.webp` · `coventry-fizz-750-400.webp` | `3596710187614` | [Open Food Facts](https://world.openfoodfacts.org/product/3596710187614) |
| `estrella-galicia-330-200.webp` · `estrella-galicia-330-400.webp` | `8412598000010` | [Open Food Facts](https://world.openfoodfacts.org/product/8412598000010) |
| `feldschlosschen-500-200.webp` · `feldschlosschen-500-400.webp` | `76129810` | [Open Food Facts](https://world.openfoodfacts.org/product/76129810) |
| `guinness-draught-500-200.webp` · `guinness-draught-500-400.webp` | `5000213101223` | [Open Food Facts](https://world.openfoodfacts.org/product/5000213101223) |
| `jack-daniels-1l-200.webp` · `jack-daniels-1l-400.webp` | `3099873045864` | [Open Food Facts](https://world.openfoodfacts.org/product/3099873045864) |
| `martini-rosso-1l-200.webp` · `martini-rosso-1l-400.webp` | `3011932000805` | [Open Food Facts](https://world.openfoodfacts.org/product/3011932000805) |
| `no3-gin-700-200.webp` · `no3-gin-700-400.webp` | `5010493025775` | [Open Food Facts](https://world.openfoodfacts.org/product/5010493025775) |
| `red-bull-250-200.webp` · `red-bull-250-400.webp` | `9002490205973` | [Open Food Facts](https://world.openfoodfacts.org/product/9002490205973) |
| `seagrams-gin-700-200.webp` · `seagrams-gin-700-400.webp` | `5900685007910` | [Open Food Facts](https://world.openfoodfacts.org/product/5900685007910) |
| `smirnoff-ice-275-200.webp` · `smirnoff-ice-275-400.webp` | `5410316962094` | [Open Food Facts](https://world.openfoodfacts.org/product/5410316962094) |
| `tanqueray-750-200.webp` · `tanqueray-750-400.webp` | `5000281005904` | [Open Food Facts](https://world.openfoodfacts.org/product/5000281005904) |

> A versão pública desta página é `creditos.html`, na raiz do site — é ela que
> cumpre a exigência de atribuição das licenças CC BY-SA. Este arquivo é a
> fonte de referência no repositório; ao mexer num, mexa no outro.

## Tratamento aplicado

O recorte é feito pelo **Adobe Photoshop**, via o conector Adobe for Creativity
(`image_remove_background`), que segmenta o produto em vez de separar por cor.

A distinção importa. Duas tentativas anteriores separavam o fundo pela distância
de cor até o branco do estúdio, e as duas falharam pelo mesmo motivo: numa foto
de fundo branco, vidro transparente e rótulo branco têm a mesma cor. Ou o vidro
ficava leitoso, ou o rótulo do Red Bull desaparecia junto com o fundo. Pior: a
franja branca herdada do primeiro lote estava gravada em pixels totalmente
opacos, e a função escrita para removê-la só agia sobre pixels
semitransparentes — nunca tocou no defeito que deveria corrigir.

Origem de cada imagem:

- a foto frontal do Open Food Facts, buscada por código de barras.

## O padrão

Só entra foto de estúdio: produto inteiro, lacrado, em pé e de frente, em fundo
neutro, e com o rótulo batendo com o que o catálogo diz. O recorte limpa o
fundo, mas não conserta perspectiva, inclinação nem amassado — e na estante a
foto de celular aparece ao lado das de estúdio na hora.

A parte mensurável está em `ferramentas/confere-fotos.py`: altura, folga,
contorno sem mordida, eixo em pé e, nas latas, a mesma largura em cima e
embaixo. Rode-o antes de subir foto nova.

Saíram por não caber nele, na revisão de setembro de 2026:

| Foto | Motivo |
|---|---|
| Campo Largo 750 ml | foto de celular tirada de cima: garrafa inclinada 19 px e 20% mais larga no ombro que na base |
| Velho Barreiro 910 ml | foto de celular, inclinada 10 px, luz de ambiente |
| Monster Ultra Violet 473 ml | lata em trapézio (razão 1,039; as de estúdio ficam em 1,00) |
| Evian 1,5 L | recorte com mordidas no contorno, na altura do rótulo |
| Gelo Zero Grau 5 kg | dois sacos sobrepostos e deitados; o Photoshop não separa um do outro |

Também foram corrigidos os dados de seis produtos cujo rótulo na foto não batia
com o catálogo: Absolut (700 ml), Absolut Mango (750 ml), Jack Daniel's
(700 ml), Seagram's (750 ml), Tanqueray (700 ml) e Coventry Fizz (700 ml, 15%).

Depois do recorte, `ferramentas/padroniza-fotos.py` apara a moldura
transparente, iguala altura, base e folga entre todas — medindo pelo contorno visível, não
pelo primeiro pixel acima de zero — e exporta em WebP de 400
e 200 px de altura, escolhidos pelo navegador conforme a densidade da tela.

Os PNG do primeiro lote ficam no histórico do git, no commit `c000790`.
