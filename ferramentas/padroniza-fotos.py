"""Padroniza os recortes vindos da Adobe e gera os WebP do site.

O recorte em si é feito pelo conector Adobe for Creativity, com
`image_remove_background` — segmentação do sujeito, não chroma key. Isso importa:
a tentativa anterior, feita aqui com processamento próprio, separava fundo por
distância de cor, e numa foto de estúdio branco isso confunde vidro transparente
com rótulo branco. A Adobe acerta porque decide pelo que é o produto, não pela
cor do pixel.

Este script cuida do resto, que é o que deixa as 19 iguais entre si:
apara a moldura transparente, iguala a altura, a base e a folga, e exporta em
dois tamanhos.

Entrada : /tmp/adobe/<produto>.png   (saída do image_remove_background)
Saída   : ZeroGrau/img/<produto>-{200,400}.webp
"""
import glob, os
from PIL import Image

ENTRADA = '/tmp/adobe'
DESTINO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ZeroGrau', 'img')
ALTURA  = 600      # mestre; os WebP saem em 400 e 200
MARGEM  = 0.02     # folga proporcional, igual para todos


def padroniza(im, altura=ALTURA, margem=MARGEM):
    bb = im.getchannel('A').point(lambda v: 255 if v > 2 else 0).getbbox()
    if bb:
        im = im.crop(bb)
    w, h = im.size
    im = im.resize((max(1, round(w * altura / h)), altura), Image.LANCZOS)
    pad = round(altura * margem)
    tela = Image.new('RGBA', (im.width + 2 * pad, altura + 2 * pad), (0, 0, 0, 0))
    tela.alpha_composite(im, (pad, pad))
    return tela


if __name__ == '__main__':
    total = 0
    for f in sorted(glob.glob(f'{ENTRADA}/*.png')):
        base = os.path.basename(f)[:-4]
        mestre = padroniza(Image.open(f).convert('RGBA'))
        for h in (400, 200):
            w = round(mestre.size[0] * h / mestre.size[1])
            saida = os.path.join(DESTINO, f'{base}-{h}.webp')
            mestre.resize((w, h), Image.LANCZOS).save(saida, 'WEBP', quality=82, method=6)
            total += os.path.getsize(saida)
        print(f'{base:<26} {mestre.size}')
    print(f'\n{total/1024:.0f} KB no total')
