# Como o site funciona

> Os caminhos citados aqui (`js/…`, `css/…`, `img/…`) são relativos à pasta [`ZeroGrau/`](../../ZeroGrau), que é o site.

## As duas lojas e a porta

Site estático de uma distribuidora que atende as duas pontas: quem vai beber e
quem vai revender. Sem framework e sem build — HTML, CSS e alguns arquivos de
JavaScript.

São duas lojas sobre o mesmo estoque:

| | quem entra | como é | unidade de venda |
|---|---|---|---|
| **Varejo** `index.html` | CPF | vitrine, foto grande, slogan | unidade |
| **Atacado** `atacado.html` | CNPJ | tabela sóbria, sem slogan | caixa fechada |

Quem decide é a porta, em `js/porta.js`: depois do aviso de idade vem o
login, só com e-mail e senha. O CPF ou CNPJ é pedido uma vez, em "Criar
conta" (que também pede nome ou razão social), fica guardado na conta e é ele
que manda para a loja correspondente a cada login.

⚠ **O login ainda não tem servidor.** As contas ficam registradas no
navegador (`localStorage`, chave `zg-contas`): e-mail, nome e documento —
nunca a senha. Então a conta só existe no navegador em que foi criada, e
qualquer senha no formato certo (6 caracteres ou mais) entra; e-mail sem
conta é recusado com o convite para criar uma. Para ligar o backend, os
pontos são `autenticar()` e `cadastrar()` em `js/porta.js`: `autenticar`
devolve a conta (ou nada), `cadastrar` diz se o e-mail já estava em uso; o
resto da porta não muda.

⚠ **A conferência do dígito verificador está desligada.** Hoje passa qualquer
número com 11 dígitos (vai para o varejo) ou 14 (vai para o atacado). O
algoritmo dos dois documentos continua em `js/porta.js` e coberto por teste;
para religar, troque `CONFERE_DIGITO` para `true` e mais nada muda.

Nenhuma das duas rola a página. O conteúdo que antes vinha empilhado em onze
seções virou vistas que se revezam no mesmo espaço; rola só a lista de
produtos. Sem JavaScript as vistas voltam a empilhar e a página rola como
qualquer documento, que é o que o buscador lê.

O varejo abre na vista **Início**, não no catálogo: quem chega precisa saber
de quem é a loja, quanto custa a entrega e em quanto tempo ela chega antes de
encarar a lista inteira de rótulos. O catálogo fica a um clique, na aba ou no botão.

As duas lojas têm o botão **Trocar conta** no topo: ele limpa o documento
desta aba e reabre a porta. Num site que escolhe a vitrine pelo documento,
errar o documento não pode ser sem saída.

No celular a navegação desce para uma barra fixa no pé da tela, ao alcance do
polegar, e a faixa de operação do rodapé sai — os mesmos números estão na
abertura. Todo alvo de toque tem no mínimo 44 px de altura, e o teste de
fumaça percorre as cinco vistas e as duas lojas medindo isso.

## O que tem em cada arquivo

```
ZeroGrau/
  index.html        varejo: vitrine em quatro vistas
  atacado.html      atacado: tabela por caixa fechada
  admin.html        painel: produtos e regras das duas lojas
  creditos.html     atribuição das fotos (exigida pelas licenças CC BY-SA)
  css/style.css     estrutura e componentes; o :root guarda todos os tokens
  css/temas.css     as duas peles: "Madrugada" no varejo, "Balcão" no atacado
  js/ajustes.js     o que o painel publicou (gerado; não edite à mão)
  js/dados.js       catálogo, contato e regras de venda — fonte única das duas
  js/admin.js       o painel
  js/porta.js       aviso de idade, login e criar conta
  js/app.js         o site como app (service worker, instalar) e a estatística
  js/pix.js         código Pix "copia e cola" (BR Code do Banco Central)
  js/vendor/        qrcode.js (Kazuhiko Arase, MIT), baixado só por quem paga pelo site
  js/script.js      varejo: vistas, busca, carrinho, fechamento, Pix, CEP, cupom
  js/atacado.js     atacado: tabela, pedido por caixa, faixas de desconto
  img/              fotos de produto em WebP, 200 e 400 px de altura
  sw.js             service worker: rede primeiro, cópia só sem sinal
  manifest.webmanifest  nome, ícones e cores do app instalado
  robots.txt        libera o varejo, barra o atacado e o painel
  sitemap.xml       as duas páginas públicas
```

## Regras que o código segue

Ao mexer em `css/` ou `js/`, suba o `?v=` dos `<link>` e `<script>` das três
páginas. O GitHub Pages serve esses arquivos com `max-age=600`: sem o selo de
versão, quem esteve no site nos últimos dez minutos continua recebendo a
versão velha e acha que a mudança não foi ao ar.

Nenhum número de catálogo é escrito à mão no HTML. Os `data-total` da página
são preenchidos a partir de `BEBIDAS`, justamente para que os textos não possam
divergir do estoque — e as duas lojas leem a mesma lista, que é como elas
discordariam primeiro.

O preço de atacado sai do preço cheio de varejo, não da promoção: promoção de
fim de semana é isca, e não tem por que valer para quem leva vinte caixas.

## Fechamento do pedido e Pix

O carrinho fecha em etapas: a lista, **entrega e pagamento** (nome, CEP, rua
preenchida pelo CEP, número, complemento, referência, observação) e a
escolha entre dois caminhos:

- **Pagar agora com Pix, pelo site.** Gera o QR code e o "copia e cola" com o
  valor exato do pedido e uma referência (`ZG…`). Depois de pagar, o cliente
  toca em **Já paguei** e o pedido vai pelo WhatsApp com essa referência.
  Sem servidor, **quem confirma o recebimento é a loja**, no extrato do banco,
  pela referência. O código segue o padrão do Banco Central (`js/pix.js`),
  conferido contra o exemplo do manual e decodificado nos testes.
- **Pagar na entrega (ou na retirada).** O pedido vai pelo WhatsApp com a
  forma: Pix, cartão ou dinheiro com "troco para quanto?".

A opção de Pix pelo site só aparece com uma chave cadastrada (painel → aba
Loja → Pix). Com a loja fechada, o fechamento avisa e o pedido chega marcado
como agendado. Cada pedido enviado fica no aparelho (itens e total, nunca
endereço ou pagamento) para o **Pedir de novo**, que aparece com o carrinho
vazio.

O horário de funcionamento (`HORARIO`, no fuso de Fortaleza) escreve o
"Aberto até 03h00 / Fechado · abre hoje às 10h" no topo e no rodapé.

## App e estatística

O site pode ser instalado na tela do celular (`manifest.webmanifest`,
`sw.js`); o botão **Instalar o app** aparece onde o navegador oferece isso. O
service worker busca sempre a rede primeiro — o que o painel publica chega na
hora — e só usa a cópia guardada sem sinal. O painel nunca passa por ele.

A estatística vem desligada. Na aba Loja do painel dá para ligar o
**Plausible** (sem cookie; o id é o domínio cadastrado lá) ou o **Google
Analytics 4** (id `G-…`; usa cookie, então pela LGPD só liga depois que o
visitante aceita). Conta visitas e pedidos enviados, sem dado pessoal.

---
[← Voltar ao README](../../README.md) · [Índice da documentação](../README.md)
