"""Padroniza os recortes vindos da Adobe e gera os WebP do site.

O recorte em si é feito pelo conector Adobe for Creativity, com
`image_remove_background` — segmentação do sujeito, não chroma key. Isso importa:
a tentativa anterior, feita aqui com processamento próprio, separava fundo por
distância de cor, e numa foto de estúdio branco isso confunde vidro transparente
com rótulo branco. A Adobe acerta porque decide pelo que é o produto, não pela
cor do pixel.

Este script cuida do resto, que é o que deixa todas iguais entre si:
apara a moldura transparente, iguala a altura, a base e a folga, e exporta em
dois tamanhos.

Entrada : /tmp/adobe/<produto>.png   (saída do image_remove_background)
Saída   : ZeroGrau/img/<produto>-{200,400}.webp
"""
import os
import re
from PIL import Image

ENTRADA = '/tmp/adobe'
AQUI    = os.path.dirname(os.path.abspath(__file__))
DESTINO = os.path.join(AQUI, '..', 'ZeroGrau', 'img')
DADOS   = os.path.join(AQUI, '..', 'ZeroGrau', 'js', 'dados.js')
ALTURA  = 600      # mestre; os WebP saem em 400 e 200
MARGEM  = 0.02     # folga proporcional, igual para todos
VEU     = 16       # alfa até aqui é resto do recorte, invisível mas conta na medida
CONTORNO = 64      # a partir daqui o pixel é produto: é por ele que se apara


def padroniza(im, altura=ALTURA, margem=MARGEM):
    # Apara pelo contorno visível, não pelo primeiro pixel acima de zero. Com
    # o limiar em 2, foto de borda macia (Absolut Mango, Estrella) ficava com
    # o corpo 2-3 px mais para dentro que as outras, e a estante desalinhava.
    a = im.getchannel('A').point(lambda v: 0 if v <= VEU else v)
    im.putalpha(a)
    bb = a.point(lambda v: 255 if v > CONTORNO else 0).getbbox()
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
    # Só o que está no catálogo. A pasta de entrada guarda recortes de
    # produtos que já saíram, e varrê-la inteira traria as fotos de volta.
    fotos = re.findall(r'foto:"([^"]+)"', open(DADOS, encoding='utf8').read())
    for base in fotos:
        f = os.path.join(ENTRADA, f'{base}.png')
        if not os.path.exists(f):
            print(f'{base:<26} sem recorte em {ENTRADA}'); continue
        mestre = padroniza(Image.open(f).convert('RGBA'))
        for h in (400, 200):
            w = round(mestre.size[0] * h / mestre.size[1])
            saida = os.path.join(DESTINO, f'{base}-{h}.webp')
            mestre.resize((w, h), Image.LANCZOS).save(saida, 'WEBP', quality=82, method=6)
            total += os.path.getsize(saida)
        print(f'{base:<26} {mestre.size}')
    print(f'\n{total/1024:.0f} KB no total')
