# Painel de administração

> Os caminhos citados aqui (`js/…`, `css/…`, `img/…`) são relativos à pasta [`ZeroGrau/`](../../ZeroGrau), que é o site.

Abas: **Produtos**, **Varejo**, **Atacado**, **Loja** (contato, chave Pix,
horário, estatística) e **Publicação** (chave do GitHub e histórico).

- **Foto de produto:** "Subir foto" na linha do produto. O painel exige PNG
  com fundo transparente e produto com pelo menos 400 px de altura, apara,
  iguala ao padrão (mestre de 600 px, 2% de folga, WebP de 400 e 200) e
  mede o mesmo que `ferramentas/confere-fotos.py` — inclinação, contorno,
  lata em trapézio. O que não passa é recusado com o motivo. Ao publicar, as
  fotos sobem antes do `ajustes.js`, e uma trava impede publicar um produto
  que aponte para foto inexistente.
- **Histórico:** lista as publicações (os commits do `ajustes.js`) e abre
  qualquer uma — ou a versão original — no rascunho. Nada vai ao ar sem
  você publicar.

`admin.html` edita o que as duas lojas leem: produtos (preço, promoção,
estoque, categoria, embalagem, foto, unidades por caixa, casco), as regras do
varejo (pedido mínimo, frete grátis, taxa e raio de entrega, cupom) e as do
atacado (desconto de revenda, mínimo, frete, prazo, faixas de volume,
unidades por caixa de cada embalagem). A coluna "Atacado" da tabela mostra o
preço que o revendedor paga, já com o desconto do rascunho.

Não há servidor, então o painel trabalha em três camadas, aplicadas por
`aplicarAjustes()` no fim de `js/dados.js`:

1. **Base** — o que está escrito em `js/dados.js`.
2. **Publicado** — `js/ajustes.js`, gerado pelo botão **Publicar**. Subido no
   repositório, vale para todo mundo. É um retrato inteiro do que o painel
   edita e substitui esses trechos da base; enquanto ele existir, mudar preço
   direto em `dados.js` não tem efeito — mude pelo painel.
3. **Rascunho** — no `localStorage` de quem está editando. As lojas abertas
   nesse navegador já o aplicam, com um aviso amarelo de "prévia"; os
   clientes continuam vendo o publicado.

Para publicar, há dois caminhos:

- **Direto (recomendado).** Na aba **Publicação** do painel, cole uma chave
  de acesso do GitHub — *fine-grained token*, só para o repositório
  `Site-Zero-Grau`, com **Contents: Read and write** e mais nada; o passo a
  passo está na própria aba. Daí em diante **Publicar** grava o
  `ajustes.js` direto na `main` pela API do GitHub (conferindo o `sha`, para
  não sobrescrever o trabalho de outra pessoa), e o workflow do Pages põe no
  ar em um ou dois minutos. A chave fica só no `localStorage` daquele
  navegador; há um botão para esquecê-la.
- **À mão.** Sem chave, **Publicar** baixa o `ajustes.js`; no GitHub, abra
  `ZeroGrau/js/`, **Add file → Upload files**, solte o arquivo e confirme na
  `main`.

Quando o arquivo estiver no ar, o painel percebe que o rascunho ficou igual
ao publicado e o apaga sozinho.

Os textos do varejo que citam regra (frete grátis, taxa, pedido mínimo, raio,
cupom) são escritos pelo script a partir dos atributos `data-regra` do HTML,
para não prometerem um valor que o painel já trocou.

⚠ **O painel não tem senha; quem guarda a porta é a chave.** Sem ela,
qualquer um que abra `admin.html` mexe só no próprio navegador. Com ela,
publica — por isso a chave mora só no navegador de quem a colou, deve ser
esquecida em computador compartilhado e deve ter só a permissão de conteúdo
deste repositório (se vazar, basta revogá-la no GitHub). O painel fica fora
do buscador pelo `robots.txt` e pelo `noindex`. No dia em que ganhar um
servidor, ganha login junto: o ponto de troca é `publicar()`, em
`js/admin.js`.

---
[← Voltar ao README](../../README.md) · [Índice da documentação](../README.md)
