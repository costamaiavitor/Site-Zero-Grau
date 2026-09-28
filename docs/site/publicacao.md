# Publicação e o que falta para ir ao ar

> Os caminhos citados aqui (`js/…`, `css/…`, `img/…`) são relativos à pasta [`ZeroGrau/`](../../ZeroGrau), que é o site.

## Como o site é publicado

`.github/workflows/pages.yml` publica a pasta `ZeroGrau/` no GitHub Pages a
cada push na `main`. O conteúdo dessa pasta vira a raiz do site, então o
endereço é `https://costamaiavitor.github.io/Site-Zero-Grau/` — sem `ZeroGrau`
no caminho. É esse endereço que o `og:url` do `index.html` declara.

Duas condições, as duas fora do workflow e só na primeira vez:

1. **Repositório público.** No plano gratuito o Pages não atende repositório
   privado; em privado exige GitHub Pro ou superior.
2. **Settings → Pages → Source = GitHub Actions.**

O passo 2 não dá para automatizar: criar o site pela API exige permissão de
administração, que o `GITHUB_TOKEN` do workflow não recebe — com
`enablement: true` o `configure-pages` falha em "Resource not accessible by
integration". Enquanto o site não existir, o deploy morre em "Get Pages site
failed". Depois de criado uma vez, todo push na `main` publica sozinho.

Para hospedar sem tornar o repositório público, Netlify, Cloudflare Pages e
Vercel publicam pasta estática de repositório privado no plano gratuito. Nesse
caso, troque o `og:url` e o `og:image` pelo domínio novo.

## Antes de ir ao ar

- [ ] Cadastrar a chave Pix da loja no painel (aba Loja) e fazer um Pix de
      R$ 0,01 pelo site para conferir nome, cidade e destino.
- [ ] Se quiser estatística, criar a conta no Plausible ou no Google
      Analytics e colar o id na aba Loja.
- [ ] Dar login ao painel `admin.html` antes de ligá-lo a qualquer servidor.
- [ ] Ligar login e cadastro a um servidor (`autenticar()` e `cadastrar()`
      em `js/porta.js`). Hoje qualquer senha com 6 caracteres entra e toda
      conta nova é aceita; falta também "esqueci a senha", que depende do
      mesmo servidor.
- [ ] Trocar o resto do bloco `CONTATO` em `js/dados.js` pelos dados reais da
      loja. O WhatsApp já é o real, (85) 98149-4445; telefone, e-mail, CNPJ,
      endereço e redes sociais ainda são valores de exemplo.
- [ ] Apontar `og:url` e `og:image` em `index.html` para o domínio final.
- [ ] Escrever as páginas de "Trocas e devoluções" e "Política de casco" —
      hoje esses links caem no WhatsApp.
- [ ] Medir a distância real da loja até cada bairro e trocar a tabela
      `ENTREGA` em `js/dados.js` — os quilômetros de hoje são estimativa, e o
      endereço da loja também é exemplo. O CEP em si já é conferido de verdade,
      no ViaCEP.
- [ ] Trocar as fotos de produto por fotos da própria loja. As de hoje são de
      produto importado, do Open Food Facts; o banco brasileiro de lá é quase
      todo foto de celular com a mão na garrafa (ver [Fotos de produto](fotos.md)).

---
[← Voltar ao README](../../README.md) · [Índice da documentação](../README.md)
