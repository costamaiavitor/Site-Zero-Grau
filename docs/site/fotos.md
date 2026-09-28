# Fotos de produto

> Os caminhos citados aqui (`js/…`, `css/…`, `img/…`) são relativos à pasta [`ZeroGrau/`](../../ZeroGrau), que é o site.

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
python3 ferramentas/confere-fotos.py      # confere o padrão
```

O passo do meio é interativo: o conector Adobe exige que o arquivo esteja no
armazenamento dele (não aceita URL de terceiros), então cada foto passa por
`asset_initialize_file_upload` → PUT → `asset_finalize_file_upload` antes do
recorte.

Toda foto nova passa por `python3 ferramentas/confere-fotos.py` antes de subir.
Ele mede o que dá para medir do padrão (altura, folga, contorno sem mordida,
produto em pé, lata sem trapézio) e sai com erro se algo falhar. O resto é
olho: foto de estúdio, produto inteiro e lacrado, e rótulo batendo com o
catálogo. O padrão completo e o que saiu por ele estão em `img/CREDITOS.md`.

Os PNG do primeiro lote ficam no histórico do git, no commit `c000790`.

---
[← Voltar ao README](../../README.md) · [Índice da documentação](../README.md)
