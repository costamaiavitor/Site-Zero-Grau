"""Baixa a foto frontal curada de cada produto no Open Food Facts.

Só a frontal: foi ao pegar um imgid arbitrário que o Evian veio como foto de
código de barras. A saída final tem 400 px de altura, então a frontal curada
(300-900 px) sobra — não vale caçar o upload bruto e arriscar a foto errada.
"""
import json, subprocess, os, io, re
from PIL import Image

CA = '/root/.ccr/ca-bundle.crt'
MAP = {
 'absolut-1l':'7312040017201','absolut-mango-1l':'7312040350209','coca-cola-2l':'5449000009067',
 'coventry-fizz-750':'3596710187614','estrella-galicia-330':'8412598000010','evian-15l':'3068320120256',
 'feldschlosschen-500':'76129810','goudale-blonde-750':'3261570000044','guinness-draught-500':'5000213101223',
 'ivanov-vodka-1l':'3596710445417','jack-daniels-1l':'3099873045864','martini-rosso-1l':'3011932000805',
 'monster-ultra-500':'5060337500401','no3-gin-700':'5010493025775','red-bull-250':'9002490205973',
 'seagrams-gin-700':'5900685007910','smirnoff-ice-275':'5410316962094','spaten-fardo-350':'4072700005780',
 'tanqueray-750':'5000281005904','villageoise-branco-250':'3175520036338',
}

def get(u, t=25):
    return subprocess.run(f'curl -s --cacert {CA} -m {t} "{u}"',
                          shell=True, capture_output=True).stdout

os.makedirs('/tmp/fonte2', exist_ok=True)
for nome, cb in MAP.items():
    j = get(f'https://world.openfoodfacts.org/api/v2/product/{cb}.json?fields=image_front_url').decode('utf8', 'ignore')
    try:
        url = json.loads(j)['product']['image_front_url']
    except Exception:
        print(f'{nome:<24} sem frontal', flush=True); continue
    melhor = dim = None
    for u in (re.sub(r'\.\d+\.jpg$', '.full.jpg', url), url):
        b = get(u, 40)
        if len(b) < 4000:
            continue
        try:
            im = Image.open(io.BytesIO(b))
        except Exception:
            continue
        if melhor is None or im.size[0] * im.size[1] > dim[0] * dim[1]:
            melhor, dim = b, im.size
    if melhor:
        open(f'/tmp/fonte2/{nome}.jpg', 'wb').write(melhor)
        print(f'{nome:<24} {dim[0]}x{dim[1]}', flush=True)
    else:
        print(f'{nome:<24} falhou', flush=True)
