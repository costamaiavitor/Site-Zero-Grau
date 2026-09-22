"""Retifica a perspectiva de um produto cilíndrico fotografado de cima.

A lata do Spaten foi fotografada com a câmera acima da linha do produto: o aro
superior aparece como elipse aberta e o corpo afunila para baixo. As outras duas
latas do catálogo são frontais, então ela destoa.

A correção é uma transformação projetiva — a mesma coisa que o "recorte em
perspectiva" do Photoshop. Mede as laterais do corpo em duas alturas, monta o
quadrilátero que elas formam e mapeia esse quadrilátero para um retângulo. As
laterais ficam paralelas e o aro superior comprime junto, porque a projeção é
global.
"""
import numpy as np
from PIL import Image


def _bordas(a, y, lim=0.5):
    linha = np.where(a[y] > lim)[0]
    return (linha.min(), linha.max()) if len(linha) > 2 else None


def _coef(dest, src):
    """Coeficientes que o PIL espera: mapeiam destino -> origem."""
    A, B = [], []
    for (xd, yd), (xs, ys) in zip(dest, src):
        A.append([xd, yd, 1, 0, 0, 0, -xs * xd, -xs * yd]); B.append(xs)
        A.append([0, 0, 0, xd, yd, 1, -ys * xd, -ys * yd]); B.append(ys)
    return np.linalg.solve(np.array(A, float), np.array(B, float))


def retifica(caminho, topo=0.10, base=0.90, margem=0.25, corpo=(0.30, 0.86)):
    """`corpo` delimita a faixa usada para ajustar as retas laterais.

    Amostrar duas linhas isoladas não funciona: perto da base a lata curva para
    dentro, e uma linha tomada ali dá uma largura pequena demais, o que faz a
    correção disparar — cheguei a medir 22° de afunilamento tentando assim.
    Ajustar uma reta ao corpo inteiro e só então avaliá-la nas duas alturas é
    imune a isso.
    """
    im = Image.open(caminho).convert('RGBA')
    a = np.asarray(im).astype(np.float32)[..., 3] / 255
    H, W = a.shape

    ys, xe, xd = [], [], []
    for y in range(H):
        b = _bordas(a, y)
        if b:
            ys.append(y); xe.append(b[0]); xd.append(b[1])
    ys = np.array(ys, float); xe = np.array(xe, float); xd = np.array(xd, float)
    i0, i1 = int(len(ys) * corpo[0]), int(len(ys) * corpo[1])
    pe = np.polyfit(ys[i0:i1], xe[i0:i1], 1)
    pd = np.polyfit(ys[i0:i1], xd[i0:i1], 1)

    yt, yb = int(H * topo), int(H * base)
    lt, rt = np.polyval(pe, yt), np.polyval(pd, yt)
    lb, rb = np.polyval(pe, yb), np.polyval(pd, yb)
    larg_t, larg_b = rt - lt, rb - lb
    # largura alvo: a do meio do corpo, para não esticar nem encolher no geral
    alvo = (larg_t + larg_b) / 2
    cx_t, cx_b = (lt + rt) / 2, (lb + rb) / 2
    cx = (cx_t + cx_b) / 2

    src = [(lt, yt), (rt, yt), (rb, yb), (lb, yb)]
    dst = [(cx - alvo / 2, yt), (cx + alvo / 2, yt),
           (cx + alvo / 2, yb), (cx - alvo / 2, yb)]

    # tela mais larga, para a projeção não cortar nada nas pontas
    pad = int(W * margem)
    tela = Image.new('RGBA', (W + 2 * pad, H), (0, 0, 0, 0))
    tela.alpha_composite(im, (pad, 0))
    src = [(x + pad, y) for x, y in src]
    dst = [(x + pad, y) for x, y in dst]

    fora = tela.transform(tela.size, Image.PERSPECTIVE, _coef(dst, src),
                          Image.BICUBIC)
    bb2 = fora.getchannel('A').point(lambda v: 255 if v > 2 else 0).getbbox()
    print(f'  largura topo {larg_t:.0f}px · base {larg_b:.0f}px · alvo {alvo:.0f}px')
    return fora.crop(bb2) if bb2 else fora


if __name__ == '__main__':
    import sys
    entrada = sys.argv[1]
    saida = sys.argv[2]
    retifica(entrada).save(saida)
    print(f'  salvo em {saida}')
