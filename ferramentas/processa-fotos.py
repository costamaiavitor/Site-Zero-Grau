"""Gera o lote novo de fotos de produto.

Vinte e uma fotos, de origens diferentes e com defeitos diferentes: uma
heurística só não dá conta. O padrão resolve a maioria; os poucos que precisam
de ajuste têm o ajuste anotado aqui, com o motivo.

Origem: a frontal curada do Open Food Facts quando tem altura suficiente para
os 400 px de destino sem ampliar. Senão, limpa o PNG que já está no site.
"""
import os, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recorte import recorta, limpa_png, normaliza
from PIL import Image

ALT_MIN = 560

# Ajustes por produto. Vazio = padrão.
AJUSTE = {
    # a lata fica sobre superfície refletiva; a sombra clara colada na base só
    # sai ancorando no núcleo sólido, que sombra pálida nunca alcança
    'feldschlosschen-500': dict(fonte='origem', ancora=True),

    # a origem é a lata cinza-prata contra uma parede cinza: o corpo da lata cai
    # dentro da tolerância do fundo e vira contorno vazio. O PNG atual já estava
    # limpo (foi um dos sete sem franja), então é ele que vale.
    'spaten-fardo-350': dict(fonte='atual'),

    # borrão escuro no mesmo componente do saco: só a posição na borda o separa
    'gelo-cubos-5kg': dict(fonte='atual', tira_borda=0.34),

    # franja clara larga; encolher mais que o padrão limpa sem comer o rótulo
    'monster-ultra-500': dict(fonte='atual', encolhe=0.18),
}

SAIDA = '/tmp/novo'
os.makedirs(SAIDA, exist_ok=True)
nomes = sorted(os.path.basename(p)[:-4] for p in glob.glob('/tmp/orig/*.png'))
relato = []

for n in nomes:
    aj = dict(AJUSTE.get(n, {}))
    forca = aj.pop('fonte', None)

    origem = f'/tmp/fonte2/{n}.jpg'
    h = 0
    if os.path.exists(origem):
        try: h = Image.open(origem).size[1]
        except Exception: h = 0

    usa_origem = (forca == 'origem') or (forca is None and h >= ALT_MIN)

    if usa_origem:
        im = recorta(origem, **{k: v for k, v in aj.items() if k in ('tol', 'suave', 'adapta', 'ancora')})
        via = f'origem {Image.open(origem).size[0]}x{h}'
    else:
        im = limpa_png(f'/tmp/orig/{n}.png', **{k: v for k, v in aj.items() if k in ('abre', 'encolhe', 'tira_borda')})
        via = 'limpeza do atual' + (f' (origem só {h}px)' if h and forca is None else '')

    if aj: via += '  [' + ', '.join(f'{k}={v}' for k, v in aj.items()) + ']'
    im = normaliza(im, altura=600)
    im.save(f'{SAIDA}/{n}.png')
    relato.append((n, via, im.size))

for n, via, tam in relato:
    print(f'{n:<26} {str(tam):<12} {via}')
print(f'\n{sum(1 for _,v,_ in relato if v.startswith("origem"))} da origem · '
      f'{sum(1 for _,v,_ in relato if v.startswith("limpeza"))} limpos do atual')
