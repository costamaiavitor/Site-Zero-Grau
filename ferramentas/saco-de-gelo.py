"""Monta o pack shot do saco de gelo 5 kg, o único item de marca própria.

Por que montar em vez de só recortar uma foto: o gelo não tem ficha no Open
Food Facts e não existe foto de licença livre de um saco escrito "Zero Grau" —
a marca é a da casa, então esse saco não existe para ser fotografado. O que
existe com licença livre é foto de gelo solto. Aqui o gelo é fotografia e o
saco é desenho: plástico, brilho, solda e impressão são construídos por cima.

Isso vale para a marca da casa e não valeria para mais nada na prateleira.
Desenhar o rótulo de um Absolut ou de um Jack Daniel's seria inventar o produto
que o cliente acha que está comprando; desenhar a embalagem da própria loja é o
que qualquer mockup de embalagem faz.

Baixa sozinho o que precisa: a foto do gelo e a Gabarito, a mesma fonte de
display do site. Saída em /tmp/adobe/gelo-cubos-5kg.png, de onde o
padroniza-fotos.py tira os WebP junto com o resto do lote.
"""
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 900, 1300                     # tela de montagem
CREME = (255, 243, 230)
ROSA  = (255, 45, 120)
FUNDO = (10, 10, 30)
FONTE = '/tmp/gelo/Gabarito.ttf'
GELO  = '/tmp/gelo/cubes.jpg'
SAIDA = '/tmp/adobe/gelo-cubos-5kg.png'

ANG = 1.02                           # meia-abertura do cilindro visível, rad
RNG = np.random.default_rng(20260922)   # semente fixa: o saco sai igual sempre

# O thumb do Commons só serve larguras de uma lista fechada; 1280 está nela.
FOTO = ('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/'
        'Cloudy_ice_cubes.jpg/1280px-Cloudy_ice_cubes.jpg')
TTF  = ('https://raw.githubusercontent.com/google/fonts/main/ofl/gabarito/'
        'Gabarito%5Bwght%5D.ttf')


def baixa(url, destino):
    if os.path.exists(destino) and os.path.getsize(destino) > 5000:
        return destino
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    ca = '/root/.ccr/ca-bundle.crt'
    cacert = ['--cacert', ca] if os.path.exists(ca) else []
    subprocess.run(['curl', '-sL', '-m', '90', *cacert,
                    '-A', 'ZeroGrauSite/1.0 (montagem de embalagem)',
                    '-o', destino, url], check=True)
    return destino


def suave(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)


def ondula(t, sementes):
    """Soma de senos de fase espalhada: contorno irregular sem virar ruído."""
    o = np.zeros_like(t)
    for freq, amp, fase in sementes:
        o += amp * np.sin(t * freq + fase)
    return o


def silhueta():
    """Perfil do saco: solda larga e plana em cima, corpo cheio, base redonda.

    Saco de gelo é um tubo soldado nas duas pontas, não uma garrafa: a solda sai
    quase da largura toda e o ombro não afunila. As duas laterais têm ondulação
    própria, com fases diferentes — o gelo empurra o plástico de um jeito de
    cada lado, e contorno simétrico entrega o desenho na hora.
    """
    t = np.linspace(0, 1, H)
    f = 0.95 - 0.06 * suave(0.012, 0.055, t) + 0.11 * suave(0.055, 0.30, t)
    f *= 1 + 0.035 * np.sin(np.pi * suave(0.10, 0.98, t))     # barriga
    base = np.ones(H)
    m = t > 0.885
    base[m] = np.sqrt(np.clip(1 - ((t[m] - 0.885) / 0.128) ** 2, 0, 1))
    f *= base

    esq_o = ondula(t, [(9.3, 0.026, 0.7), (21.0, 0.011, 2.4), (37.0, 0.005, 5.1)])
    dir_o = ondula(t, [(8.1, 0.024, 3.9), (19.4, 0.012, 0.3), (41.0, 0.005, 1.8)])
    # a solda é prensada: chapa lisa, sem caroço de gelo
    liso = suave(0.0, 0.075, t)
    meia = f * (0.468 * W)
    cx = W / 2 + 6 * np.sin(t * 3.1 + 0.4)
    esq = cx - meia * (1 + esq_o * liso)
    dir_ = cx + meia * (1 + dir_o * liso)
    return esq, dir_


def mascara(esq, dir_):
    x = np.arange(W)[None, :]
    return np.clip(np.minimum(x - esq[:, None] + 0.5, dir_[:, None] - x + 0.5), 0, 1)


def gelo_de_fundo():
    """Fundo de gelo remontado em retalhos da foto, para o cubo ficar na escala.

    A foto tem cubo de um quinto da largura do quadro; num saco de 28 cm isso
    daria cubo de 6 cm. Reduzir a foto inteira não resolve, porque aí ela não
    cobre a tela, e espelhar em 2x2 deixa um X de simetria bem no meio do saco —
    a primeira coisa que o olho acha. Então o fundo é costurado com pedaços da
    foto, cada um sorteado, girado e espelhado por conta, com a borda esfumada:
    a emenda some na sobreposição e não sobra eixo nenhum para achar.
    """
    src = Image.open(baixa(FOTO, GELO)).convert('RGB')
    src = src.crop((0, 0, 1280, 740)).transpose(Image.ROTATE_90)   # tira a mesa
    lado, k = 430, 0.46
    p = int(lado * k)
    passo = int(p * 0.72)

    # máscara de esfumado: cosseno nas duas direções, zero na borda do retalho
    g = (1 - np.cos(np.linspace(0, 2 * np.pi, p))) / 2
    pena = np.clip(np.outer(g, g), 0.02, 1)

    acc = np.zeros((H + 2 * p, W + 2 * p, 3), np.float32)
    peso = np.zeros((H + 2 * p, W + 2 * p, 1), np.float32)
    for y in range(0, H + p, passo):
        for x in range(0, W + p, passo):
            sx = RNG.integers(0, src.width - lado)
            sy = RNG.integers(0, src.height - lado)
            r = src.crop((sx, sy, sx + lado, sy + lado)).resize((p, p), Image.LANCZOS)
            r = r.transpose(RNG.choice([Image.ROTATE_90, Image.ROTATE_180,
                                        Image.ROTATE_270, Image.FLIP_LEFT_RIGHT]))
            jx = x + int(RNG.integers(-p // 6, p // 6))
            jy = y + int(RNG.integers(-p // 6, p // 6))
            jx, jy = np.clip(jx, 0, W + p), np.clip(jy, 0, H + p)
            a = np.asarray(r).astype(np.float32) * pena[..., None]
            acc[jy:jy + p, jx:jx + p] += a
            peso[jy:jy + p, jx:jx + p] += pena[..., None]

    a = (acc / np.maximum(peso, 1e-3))[p:p + H, p:p + W] / 255
    a = 0.5 + (a - 0.5) * 0.98
    a = a * 0.87 + np.array([0.86, 0.94, 1.00]) * 0.13    # azul frio do plástico
    return np.clip(a * 1.12 + 0.03, 0, 1)


def folga(rgb):
    """O saco não enche até a solda: em cima sobra plástico vazio e amassado."""
    t = np.linspace(0, 1, H)[:, None]
    x = np.arange(W)[None, :]
    vazio = 1 - suave(0.085, 0.185, t)
    vinco = 1 + 0.085 * np.sin(x * 0.048 + t * 41) + 0.055 * np.sin(x * 0.019 - t * 63)
    vinco *= 1 + 0.045 * np.sin(x * 0.11 + t * 17)
    chapa = np.clip(np.asarray([0.70, 0.77, 0.85])[None, None, :] * vinco[..., None], 0, 1)
    return rgb * (1 - vazio[..., None]) + chapa * vazio[..., None]


def luz(esq, dir_):
    """Sombreamento de cilindro, com a chave vindo da esquerda."""
    cx, meia = (esq + dir_) / 2, (dir_ - esq) / 2
    x = np.arange(W)[None, :]
    u = np.clip((x - cx[:, None]) / meia[:, None], -1, 1)
    lamb = np.sqrt(np.clip(1 - np.clip(u + 0.26, -1, 1) ** 2, 0, 1))
    s = 0.58 + 0.48 * lamb ** 0.75

    t = np.linspace(0, 1, H)[:, None]
    s *= 1 - 0.11 * suave(0.72, 1.0, t) - 0.05 * suave(0.18, 0.0, t)

    brilho = 0.46 * np.exp(-((u + 0.38) ** 2) / (2 * 0.12 ** 2))
    brilho += 0.24 * np.exp(-((u - 0.72) ** 2) / (2 * 0.050 ** 2))
    brilho *= 0.82 + 0.18 * np.sin(t * 23 + 1.3)
    # o estouro do especular no plástico vazio do topo virava um borrão branco
    brilho *= 0.30 + 0.70 * suave(0.09, 0.22, t)
    borda = 0.40 * np.exp(-((np.abs(u) - 0.955) ** 2) / (2 * 0.022 ** 2))
    return s, np.clip(brilho + borda, 0, 1), u


def solda(rgb):
    """A solda do topo: plástico prensado, mais claro, com o frisado da máquina."""
    t = np.linspace(0, 1, H)[:, None]
    faixa = (1 - suave(0.038, 0.058, t)) * suave(0.0, 0.009, t)
    x = np.arange(W)[None, :]
    frisa = 1 + 0.028 * np.sign(np.sin(x * np.pi / 9))
    tom = np.asarray([0.83, 0.87, 0.91])[None, None, :] * (1 - 0.10 * suave(0.0, 0.058, t))[..., None]
    chapa = np.clip(tom * frisa[..., None], 0, 1)
    return rgb * (1 - faixa[..., None]) + chapa * faixa[..., None]


def arte():
    """A impressão, desenhada plana: painel escuro, marca, peso."""
    PW, PH = 760, 1300
    im = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    def g(tam, peso='Black'):
        f = ImageFont.truetype(baixa(TTF, FONTE), tam)
        f.set_variation_by_name(peso)
        return f

    y0, y1 = 300, 892
    d.rounded_rectangle([54, y0, PW - 54, y1], radius=42, fill=FUNDO + (255,))

    s = 124                                       # o selo 0°, o mesmo do favicon
    sx, sy = (PW - s) // 2, y0 + 48
    d.rounded_rectangle([sx, sy, sx + s, sy + s], radius=19, outline=ROSA + (255,), width=9)
    d.text((sx + s / 2, sy + s / 2 + 3), '0°', font=g(70), fill=CREME + (255,), anchor='mm')

    yy = sy + s + 54
    for linha in ('ZERO', 'GRAU'):
        d.text((PW / 2, yy), linha, font=g(114), fill=CREME + (255,), anchor='ma')
        yy += 118

    yy += 30
    d.line([196, yy, PW - 196, yy], fill=ROSA + (255,), width=5)
    d.text((PW / 2, yy + 26), 'G E L O   E M   C U B O S',
           font=g(36, 'Bold'), fill=CREME + (205,), anchor='ma')

    d.text((PW / 2, y1 + 50), '5 kg', font=g(92), fill=FUNDO + (230,), anchor='ma')
    return im


def imprime(rgb, u, sombra, brilho):
    """Enrola a arte plana no cilindro e imprime, com a luz do saco por cima."""
    a = np.asarray(arte()).astype(np.float32) / 255
    PH, PW = a.shape[:2]

    p = np.arcsin(np.clip(u * np.sin(ANG), -1, 1)) / ANG      # tela -> plano
    col = np.clip((p + 1) / 2 * (PW - 1), 0, PW - 1)
    lin = np.clip(np.arange(H)[:, None] - 14 * (1 - u ** 2), 0, PH - 1)
    tinta = a[np.round(lin).astype(int), np.round(col).astype(int)]

    ta = tinta[..., 3] * 0.95 * (np.abs(u) < 0.94)            # não imprime na dobra
    cor = tinta[..., :3] * (0.62 + 0.52 * sombra[..., None])
    cor = np.clip(cor + brilho[..., None] * 0.28, 0, 1)
    return rgb * (1 - ta[..., None]) + cor * ta[..., None]


def monta():
    esq, dir_ = silhueta()
    alfa = mascara(esq, dir_)
    sombra, brilho, u = luz(esq, dir_)

    rgb = folga(gelo_de_fundo()) * sombra[..., None]
    rgb = np.clip(rgb + brilho[..., None] * 0.55, 0, 1)
    rgb = rgb * 0.93 + 0.07                                   # véu do plástico
    rgb = solda(rgb)
    rgb = imprime(rgb, u, sombra, brilho)

    out = np.dstack([np.clip(rgb, 0, 1) * 255, alfa * 255]).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    im.save(SAIDA)
    print(f'{SAIDA}  {im.size}')
    return im


if __name__ == '__main__':
    monta()
