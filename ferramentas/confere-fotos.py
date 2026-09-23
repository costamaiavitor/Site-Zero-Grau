"""Confere se as fotos do catálogo seguem o padrão da estante.

O padrão, e por que cada item existe:

  1. Altura de 400 e 200 px, com folga de 2% em volta. É o que faz a estante
     alinhar: base e topo de todos os produtos na mesma linha.
  2. Contorno liso. Degrau de mais de 2 px de uma linha para a seguinte, no
     corpo do produto, é mordida do recorte — foi o que tirou a Evian.
  3. Produto em pé. O eixo central pode andar no máximo 4 px de cima a baixo;
     acima disso a garrafa está inclinada, coisa de foto de celular.
  4. Lata sem trapézio. Lata fotografada de frente tem a mesma largura em cima
     e embaixo (Red Bull 0,997, Estrella 1,000). Fora de 0,98–1,02 é lente
     grande-angular ou câmera de cima — foi o que tirou o Monster 473. Garrafa
     não entra nesta conta: Tanqueray, Seagram's e No. 3 afinam ou alargam por
     desenho, não por defeito.

O que número não pega, e fica para o olho: foto de estúdio em fundo neutro,
produto inteiro e lacrado, sem mão, mesa, parede ou amassado; e o rótulo tem
de bater com o catálogo (a Absolut da foto é 700 ml, não 1 L).

Uso:  python3 ferramentas/confere-fotos.py      (sai com erro se alguma falhar)
"""
import glob, os, re, sys
import numpy as np
from PIL import Image

IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ZeroGrau', 'img')
DADOS = os.path.join(IMG, '..', 'js', 'dados.js')

FOLGA = (4, 9)          # px de folga aceitos a 400 px de altura
DEGRAU_MAX = 0          # degraus > 2 px no contorno do corpo
EIXO_MAX = 4.0          # px de desvio do eixo central, de cima a baixo
LATA = (0.98, 1.02)     # largura a 45% / largura a 85% da altura

formas = dict(re.findall(r'foto:"([^"]+)",\s*forma:"([^"]+)"', open(DADOS, encoding='utf8').read()))

falhas = 0
for f in sorted(glob.glob(os.path.join(IMG, '*-400.webp'))):
    nome = os.path.basename(f)[:-9]
    im = Image.open(f).convert('RGBA')
    a = np.array(im)[:, :, 3] > 128
    H, W = a.shape
    erros = []

    if H != 400:
        erros.append(f'altura {H}, não 400')
    if not os.path.exists(os.path.join(IMG, f'{nome}-200.webp')):
        erros.append('falta a versão de 200 px')

    ys, xs = np.where(a)
    for lado, v in (('topo', ys.min()), ('base', H - 1 - ys.max()),
                    ('esquerda', xs.min()), ('direita', W - 1 - xs.max())):
        if not FOLGA[0] <= v <= FOLGA[1]:
            erros.append(f'folga {lado} {v} px')

    L = np.full(H, np.nan); R = np.full(H, np.nan)
    for y in range(H):
        x = np.where(a[y])[0]
        if len(x):
            L[y], R[y] = x.min(), x.max()

    corpo = slice(int(H * .4), int(H * .9))
    degraus = int((np.abs(np.diff(L[corpo], 2)) > 2).sum() + (np.abs(np.diff(R[corpo], 2)) > 2).sum())
    if degraus > DEGRAU_MAX:
        erros.append(f'contorno serrilhado ({degraus} degraus)')

    ok = ~np.isnan(L)
    centro = ((L + R) / 2)[ok]
    eixo = np.polyfit(np.arange(len(centro)), centro, 1)[0] * len(centro)
    if abs(eixo) > EIXO_MAX:
        erros.append(f'inclinado ({eixo:+.1f} px)')

    if formas.get(nome) == 'can':
        w = R - L
        razao = np.nanmedian(w[int(H * .45):int(H * .5)]) / np.nanmedian(w[int(H * .85):int(H * .9)])
        if not LATA[0] <= razao <= LATA[1]:
            erros.append(f'lata em trapézio (razão {razao:.3f})')

    if nome not in formas:
        erros.append('foto sem produto no dados.js')

    print(f'{"✗" if erros else "✓"} {nome:<24} {"; ".join(erros)}')
    falhas += bool(erros)

sem_foto = sorted(set(formas) - {os.path.basename(f)[:-9] for f in glob.glob(os.path.join(IMG, '*-400.webp'))})
for nome in sem_foto:
    print(f'✗ {nome:<24} produto sem foto')
falhas += len(sem_foto)

print(f'\n{falhas} fora do padrão' if falhas else '\ntodas no padrão')
sys.exit(1 if falhas else 0)
