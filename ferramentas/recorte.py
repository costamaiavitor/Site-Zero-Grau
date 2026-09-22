"""
Recorte de foto de produto sobre fundo de estúdio.

Duas funções, para duas situações:

  recorta()   parte da foto original, com fundo ainda presente. É o caminho bom.
  limpa_png() conserta um recorte que já existe, para quando não há foto de
              origem melhor que ele. Não recupera o que se perdeu, mas tira os
              defeitos visíveis.

Etapas de recorta():
  1. cor do fundo pela mediana da moldura externa
  2. fundo definitivo por conexão com a borda, e não por limiar global — assim
     rótulo branco no meio do produto não é confundido com fundo
  3. silhueta = o que não é fundo, com buracos preenchidos, só o maior componente
  4. alfa opaco por dentro, com transição de sub-pixel na borda
  5. descontaminação de cor: desfaz a mistura com o branco do estúdio, que é o
     que causa a franja clara

Sobre o passo 4: a versão anterior fazia o alfa proporcional à distância da cor
do fundo, para o vidro transparente ficar translúcido sobre o fundo escuro do
site. Não funciona. Numa foto de fundo branco, vidro transparente e rótulo
branco são a mesma cor, então o mesmo alfa que revela o vidro apaga o rótulo —
na prática, sumiu a metade branca da lata do Red Bull e o texto da Estrella.
Rótulo legível vale mais que vidro translúcido, porque é por ele que o cliente
reconhece o produto.

Os parâmetros opcionais (adapta, ancora, abre, tira_borda) existem porque uma
heurística só não serve para 21 fotos de origens diferentes. Ligados por padrão,
cada um deles quebra algum caso: veja processa-fotos.py, onde cada ajuste está
anotado com o produto e o motivo.
"""
import numpy as np
from PIL import Image
from scipy import ndimage


def _fundo(arr, faixa=8):
    """Cor do fundo: mediana da moldura externa da foto."""
    b = np.concatenate([
        arr[:faixa].reshape(-1, 3), arr[-faixa:].reshape(-1, 3),
        arr[:, :faixa].reshape(-1, 3), arr[:, -faixa:].reshape(-1, 3)])
    return np.median(b, axis=0)


def _espalhamento(arr, faixa=8):
    """Desvio-padrão da moldura: mede se o fundo é liso ou sujo."""
    b = np.concatenate([
        arr[:faixa].reshape(-1, 3), arr[-faixa:].reshape(-1, 3),
        arr[:, :faixa].reshape(-1, 3), arr[:, -faixa:].reshape(-1, 3)])
    return float(b.std(axis=0).mean())


def _maior_componente(mask):
    lab, n = ndimage.label(mask)
    if n == 0:
        return mask
    tam = ndimage.sum(mask, lab, range(1, n + 1))
    return lab == (int(np.argmax(tam)) + 1)


def recorta(caminho, tol=0.055, suave=1.0, adapta=False, ancora=False):
    im = Image.open(caminho).convert('RGB')
    arr = np.asarray(im).astype(np.float32) / 255.0
    H, W, _ = arr.shape

    B = _fundo(arr)
    dist = np.linalg.norm(arr - B[None, None, :], axis=2)      # 0 = cor do fundo

    # Tolerância adaptativa só quando pedida. Ligada por padrão ela destruiu o
    # fardo do Spaten: lata cinza-prata contra parede cinza, o corpo da lata
    # entrou na tolerância do fundo e virou contorno vazio.
    if adapta:
        tol = max(tol, _espalhamento(arr) * 2.6)

    # --- fundo definitivo: parecido com o fundo E ligado à borda da foto ---
    parecido = dist < tol
    semente = np.zeros_like(parecido)
    semente[0], semente[-1], semente[:, 0], semente[:, -1] = True, True, True, True
    fundo = _maior_componente(parecido & ndimage.binary_propagation(
        semente & parecido, mask=parecido))

    # --- silhueta: o que sobra, sem buracos e sem sujeira solta ---
    silhueta = ~fundo
    silhueta = ndimage.binary_closing(silhueta, np.ones((5, 5)))
    silhueta = ndimage.binary_fill_holes(silhueta)

    # Ancora no núcleo sólido. Sombra projetada e moldura da foto ficam perto da
    # cor do fundo, então nunca entram no núcleo — e o que não estiver a poucos
    # pixels dele é descartado. É o que tira a elipse de sombra sob a lata e a
    # moldura cinza em volta do fardo, que o "maior componente" sozinho mantinha
    # por estarem encostados no produto.
    if ancora:
        nucleo = _maior_componente(ndimage.binary_opening(dist > tol * 3.2, np.ones((5, 5))))
        if nucleo.sum() > 100:
            silhueta &= ndimage.binary_dilation(nucleo, np.ones((9, 9)), iterations=2)
    silhueta = _maior_componente(silhueta)
    silhueta = ndimage.binary_fill_holes(silhueta)

    # --- alfa ---
    # Opaco dentro, transição só na borda. Tentei alfa proporcional à distância
    # do fundo, para o vidro ficar translúcido, e o resultado foi pior: numa foto
    # de fundo branco, vidro transparente e rótulo branco são a mesma cor, então
    # o rótulo do Red Bull e o texto da Estrella iam junto. Rótulo legível vale
    # mais que vidro translúcido — é por ele que o cliente reconhece o produto.
    interior = ndimage.binary_erosion(silhueta, np.ones((3, 3)))

    # cobertura de sub-pixel na borda: entre "cor do fundo" e "claramente produto"
    t0, t1 = tol * 0.5, tol * 2.2
    borda = np.clip((dist - t0) / max(t1 - t0, 1e-6), 0, 1)

    a = np.where(interior, 1.0, borda)
    a = np.where(silhueta, a, 0.0)
    a = ndimage.gaussian_filter(a, suave)
    a = np.clip((a - 0.06) / 0.88, 0, 1)   # tira o véu de meio-alfa que sobra fora

    # --- descontaminação: desfaz a mistura com o fundo ---
    # observado C = F*a + B*(1-a)  ->  F = (C - B*(1-a)) / a
    with np.errstate(divide='ignore', invalid='ignore'):
        F = (arr - B[None, None, :] * (1 - a[..., None])) / np.maximum(a[..., None], 1e-3)
    F = np.where(a[..., None] > 0.004, F, arr)
    F = np.clip(F, 0, 1)

    rgba = np.dstack([F, a])
    out = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')

    # --- apara a moldura transparente ---
    bb = out.getchannel('A').point(lambda v: 255 if v > 2 else 0).getbbox()
    return out.crop(bb) if bb else out


def _tira_escuro_na_borda(a, rgb, lim=0.32):
    """Apaga mancha escura que encosta na borda da foto.

    Resto de recorte costuma sobrar grudado na moldura. No saco de gelo o
    plástico do fundo é tão escuro quanto o borrão que sobrou, e os dois estão
    no mesmo componente — o que os separa é só a posição: o borrão toca a borda
    esquerda, o plástico fica no miolo.
    """
    escuro = (a > 0.3) & (rgb.max(axis=2) < lim)
    lab, n = ndimage.label(escuro)
    if n == 0:
        return a
    fora = (set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1])) - {0}
    return np.where(np.isin(lab, list(fora)), 0.0, a) if fora else a


def limpa_png(caminho, fundo=(1.0, 1.0, 1.0), abre=0, encolhe=0.10, tira_borda=0.0):
    """Conserta o PNG já recortado, para quando não há origem melhor.

    Não recupera o que foi perdido no recorte original, mas tira os três
    defeitos visíveis: restos soltos de fundo (a elipse de sombra, o borrão),
    a franja clara na borda e a moldura transparente irregular.
    """
    im = Image.open(caminho).convert('RGBA')
    arr = np.asarray(im).astype(np.float32) / 255.0
    rgb, a = arr[..., :3], arr[..., 3]
    B = np.array(fundo, dtype=np.float32)

    if tira_borda:
        a = _tira_escuro_na_borda(a, rgb, tira_borda)

    # 1. corpo principal; com `abre`, rompe pontes finas antes de escolhê-lo
    corpo = a > 0.35
    if abre:
        nucleo = _maior_componente(ndimage.binary_opening(a > 0.75, np.ones((abre, abre))))
        if nucleo.sum() > 100:
            corpo &= ndimage.binary_dilation(nucleo, np.ones((9, 9)), iterations=3)
    corpo = _maior_componente(corpo)
    corpo = ndimage.binary_closing(corpo, np.ones((3, 3)))
    corpo = ndimage.binary_fill_holes(corpo)
    perto = ndimage.binary_dilation(corpo, np.ones((5, 5)))
    a = np.where(perto, a, 0.0)

    # 2. descontamina a borda: desfaz a mistura com o branco do fundo
    banda = (a > 0.02) & (a < 0.985)
    with np.errstate(divide='ignore', invalid='ignore'):
        F = (rgb - B[None, None, :] * (1 - a[..., None])) / np.maximum(a[..., None], 1e-3)
    rgb = np.where(banda[..., None], np.clip(F, 0, 1), rgb)

    # 3. encolhe meio pixel: o que sobrar de franja sai junto
    a = np.clip((a - encolhe) / max(1 - encolhe - 0.05, 0.1), 0, 1)

    out = Image.fromarray((np.dstack([rgb, a]) * 255).astype(np.uint8), 'RGBA')
    bb = out.getchannel('A').point(lambda v: 255 if v > 2 else 0).getbbox()
    return out.crop(bb) if bb else out


def normaliza(im, altura=600, margem=0.02):
    """Mesma altura e mesma base para todos, com uma folga igual em volta."""
    w, h = im.size
    nw = max(1, round(w * altura / h))
    im = im.resize((nw, altura), Image.LANCZOS)
    pad = round(altura * margem)
    tela = Image.new('RGBA', (nw + 2 * pad, altura + 2 * pad), (0, 0, 0, 0))
    tela.alpha_composite(im, (pad, pad))
    return tela
