(() => {
  const CHAVE_VISTO = "zg-tour-visto";
  const PUBLICO = document.body.dataset.publico === "atacado" ? "atacado" : "varejo";
  const NO_CELULAR = matchMedia("(max-width: 900px)");
  const SEM_MOVIMENTO = matchMedia("(prefers-reduced-motion: reduce)");

  const visivel = elemento => {
    if (!elemento) return false;
    if (elemento.closest("[inert], [aria-hidden=\"true\"]")) return false;
    const caixa = elemento.getBoundingClientRect();
    if (Math.min(caixa.right, innerWidth) - Math.max(caixa.left, 0) < 24) return false;
    return caixa.width > 0 && caixa.height > 0 && getComputedStyle(elemento).visibility !== "hidden";
  };

  const primeiroVisivel = (...seletores) => {
    for (const seletor of seletores) {
      for (const elemento of document.querySelectorAll(seletor)) {
        if (visivel(elemento)) return elemento;
      }
    }
    return null;
  };

  const ATE = largura => matchMedia(`(max-width: ${largura}px)`).matches;

  const PASSOS = {
    varejo: [
      {
        area: "Boas-vindas",
        titulo: "Um minuto para conhecer a loja",
        texto: "<p>Este guia mostra onde fica cada parte do site. Toque em <b>Próximo</b> para avançar; a parte explicada fica destacada na tela.</p>",
        vista: "inicio"
      },
      {
        area: "Abas",
        titulo: "Cinco abas levam a tudo",
        texto: "<p><b>Início</b>, <b>Catálogo</b>, <b>Como pedir</b>, <b>Cupom</b> e <b>Entrega</b> trocam o assunto sem sair da página.</p>",
        onde: () => NO_CELULAR.matches ? "No celular, elas ficam no pé da tela." : "No topo, ao lado do logo.",
        alvo: () => primeiroVisivel("#abas")
      },
      {
        area: "Início",
        titulo: "Quanto custa a entrega no seu endereço",
        texto: "<p>Digite o <b>CEP</b> e toque em <b>Calcular</b> para ver a taxa. Fora do raio de entrega, você retira no balcão sem pagar taxa.</p>",
        vista: "inicio",
        alvo: () => primeiroVisivel(".cep-bloco")
      },
      {
        area: "Catálogo",
        titulo: "Ache a bebida pela categoria ou pelo nome",
        texto: "<p>Os botões filtram por categoria, e o campo <b>Buscar marca ou produto</b> acha pelo nome, mesmo sem acento.</p>",
        vista: "catalogo",
        alvo: () => primeiroVisivel("#v-catalogo .filtro-linha")
      },
      {
        area: "Catálogo",
        titulo: "Toque no + para pôr no carrinho",
        texto: "<p>Cada cartão mostra preço, volume, teor e quantas unidades há hoje. O <b>+</b> para no limite do estoque e fica apagado no item esgotado.</p><p>O selo <b>Casco</b> indica garrafa retornável, com valor de volta na devolução.</p>",
        vista: "catalogo",
        alvo: () => primeiroVisivel("#grid .card:not(.esgotado)", "#grid > *")
      },
      {
        area: "Carrinho",
        titulo: "Do carrinho ao WhatsApp",
        texto: "<p>No carrinho você muda quantidades, aplica o cupom e vê quanto falta para o pedido mínimo e para o frete grátis. Em <b>Continuar</b>, informe quem recebe, o endereço e como vai pagar.</p><p>O pedido abre no <b>WhatsApp</b> já escrito: é só enviar. Com a loja fechada, ele fica agendado para a abertura.</p>",
        alvo: () => primeiroVisivel("#cartBtn")
      },
      {
        area: "Como pedir",
        titulo: "O caminho do pedido e a regra dos 18 anos",
        texto: "<p>A aba <b>Como pedir</b> resume o caminho do carrinho até a porta. O entregador confere um documento com foto: sem ele, a bebida alcoólica volta para a loja.</p>",
        vista: "pedir",
        alvo: () => primeiroVisivel("#v-pedir .aviso")
      },
      {
        area: "Cupom",
        titulo: "Desconto no primeiro pedido",
        texto: "<p>Toque no código: ele é copiado e já fica no campo do carrinho, onde é só tocar em <b>Aplicar</b>. As condições estão no mesmo quadro, e os contatos da loja, com o WhatsApp, logo abaixo.</p>",
        vista: "cupom",
        alvo: () => primeiroVisivel("#v-cupom .ticket", "#v-cupom .cupom")
      },
      {
        area: "Entrega",
        titulo: "Horário, raio, taxa e pagamento",
        texto: "<p>A aba <b>Entrega</b> mostra o horário, até onde a loja entrega, como a taxa é calculada, o frete grátis e as formas de pagamento.</p>",
        onde: "Se a loja está aberta agora aparece no topo do Início.",
        vista: "entrega",
        alvo: () => primeiroVisivel("#v-entrega .info-list")
      },
      {
        area: "Sua conta",
        titulo: "Seus dados e seus pedidos",
        texto: "<p><b>Minha conta</b> mostra seus dados e os últimos pedidos, com <b>Pedir de novo</b> para repetir um deles. <b>Trocar conta</b> sai desta conta e abre a tela de entrar.</p>",
        onde: () => ATE(1100) ? "Nesta tela, são os ícones de pessoa e de setas no topo." : "",
        alvo: () => primeiroVisivel(".app-acoes a.conta-btn", ".app-acoes [data-trocar]")
      },
      {
        area: "Atacado",
        titulo: "Compra para revender?",
        texto: "<p>Com uma conta de <b>CNPJ</b>, a compra é no balcão de atacado, por caixa fechada e com desconto por volume. O caminho é o link <b>Compro para revender</b>, no fim do Início.</p>",
        onde: () => NO_CELULAR.matches ? "" : "Também no rodapé.",
        vista: "inicio",
        alvo: () => primeiroVisivel(".abertura-pe [data-loja=\"atacado\"]", ".app-pe [data-loja=\"atacado\"]")
      },
      {
        area: "Pronto",
        titulo: "Pronto, tudo a zero grau",
        texto: "<p>Para rever, toque no <b>?</b> no topo. Os traços do guia levam direto a qualquer passo.</p>",
        onde: () => visivel(document.getElementById("instalarApp")) ? "Dá para instalar o site como app pelo botão Instalar o app, no Início." : "",
        vista: "inicio",
        alvo: () => primeiroVisivel(".tour-btn"),
        ultimo: "Ver o catálogo"
      }
    ],
    atacado: [
      {
        area: "Boas-vindas",
        titulo: "Um minuto para conhecer o balcão",
        texto: "<p>O balcão de atacado vende por <b>caixa fechada</b> para quem compra com CNPJ. Toque em <b>Próximo</b> para avançar; a parte explicada fica destacada na tela.</p>"
      },
      {
        area: "Sua empresa",
        titulo: "O CNPJ da compra",
        texto: "<p>O pedido sai no nome desta empresa, e os dados dela ficam em <b>Minha conta</b>. Para comprar com outro CNPJ, use <b>Trocar conta</b>.</p>",
        alvo: () => primeiroVisivel(".bal-doc")
      },
      {
        area: "Tabela",
        titulo: "Filtre e busque na tabela",
        texto: "<p>Os botões filtram por categoria, e o campo <b>Buscar marca ou produto</b> acha pelo nome, mesmo sem acento.</p>",
        alvo: () => primeiroVisivel(".bal-filtros")
      },
      {
        area: "Tabela",
        titulo: "Preço da caixa, linha a linha",
        texto: "<p>Cada linha mostra o preço da caixa, quantas unidades ela traz e as caixas em estoque. Em <b>Caixas</b>, use − e + para montar o pedido.</p>",
        onde: () => ATE(720) ? "" : "A coluna Unidade mostra quanto sai cada uma.",
        alvo: () => primeiroVisivel("#tabela tbody tr:not(.esgotado)", "#tabela")
      },
      {
        area: "Pedido",
        titulo: "O resumo do pedido se monta sozinho",
        texto: "<p>Caixas, mercadoria, <b>desconto por volume</b>, frete e total mudam a cada caixa, e o aviso diz quanto falta para o mínimo. Atingido o mínimo, <b>Enviar pedido pelo WhatsApp</b> manda tudo escrito para a loja, com o CNPJ.</p>",
        onde: () => ATE(1080) ? "Nesta tela, o pedido abre pelo carrinho no topo ou pela barra Ver pedido, que aparece no pé quando há caixas." : "",
        alvo: () => ATE(1080) ? primeiroVisivel("#barra", "#cartBtn") : primeiroVisivel("#pedido", "#cartBtn")
      },
      {
        area: "Pronto",
        titulo: "Pronto, tudo a zero grau",
        texto: "<p>Para rever, toque no <b>?</b> no topo. Os traços do guia levam direto a qualquer passo.</p>",
        alvo: () => primeiroVisivel(".tour-btn"),
        ultimo: "Montar o pedido"
      }
    ]
  };

  const passos = PASSOS[PUBLICO];
  const acoes = document.querySelector(".app-acoes, .bal-acoes");
  if (!acoes || !passos) return;

  const lerVisto = () => {
    try {
      return localStorage.getItem(CHAVE_VISTO) === "1";
    } catch {
      return true;
    }
  };

  const marcarVisto = () => {
    try {
      localStorage.setItem(CHAVE_VISTO, "1");
    } catch {}
  };

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "tour-btn";
  botao.textContent = "?";
  botao.setAttribute("aria-label", "Como usar o site");
  botao.setAttribute("aria-haspopup", "dialog");
  botao.setAttribute("aria-expanded", "false");
  botao.title = "Como usar o site";
  const antesDe = acoes.querySelector(".conta-btn");
  acoes.insertBefore(botao, antesDe || acoes.firstChild);

  const SETA_VOLTAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
  const SETA_AVANCAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  const camada = document.createElement("div");
  camada.className = "tour-camada";
  camada.hidden = true;
  camada.innerHTML = `
    <div class="tour-fundo"></div>
    <div class="tour-anel" aria-hidden="true"></div>
    <div class="tour-cartao" role="dialog" aria-modal="true" aria-labelledby="tourTitulo" aria-describedby="tourTexto">
      <div class="tour-topo">
        <span class="tour-grau" aria-hidden="true"></span>
        <div class="tour-escala">
          <p class="tour-legenda"><span class="tour-contagem"></span><span class="tour-area"></span></p>
          <ol class="tour-tracos"></ol>
        </div>
        <button type="button" class="tour-fechar" aria-label="Fechar o guia">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="tour-corpo">
        <h2 id="tourTitulo" tabindex="-1"></h2>
        <div id="tourTexto"></div>
        <p class="tour-onde"></p>
      </div>
      <div class="tour-pe">
        <button type="button" class="tour-pular">Fechar o guia</button>
        <button type="button" class="tour-seta anterior" aria-label="Passo anterior">${SETA_VOLTAR}</button>
        <button type="button" class="tour-seta proxima"><span class="tour-proxima-txt">Próximo</span>${SETA_AVANCAR}</button>
      </div>
      <p class="tour-dica">Use as setas ← e → do teclado. Esc fecha.</p>
    </div>`;
  document.body.append(camada);

  const cartao = camada.querySelector(".tour-cartao");
  const anel = camada.querySelector(".tour-anel");
  const grau = camada.querySelector(".tour-grau");
  const contagem = camada.querySelector(".tour-contagem");
  const area = camada.querySelector(".tour-area");
  const tracos = camada.querySelector(".tour-tracos");
  const titulo = camada.querySelector("#tourTitulo");
  const texto = camada.querySelector("#tourTexto");
  const onde = camada.querySelector(".tour-onde");
  const botaoAnterior = camada.querySelector(".anterior");
  const botaoProximo = camada.querySelector(".proxima");
  const textoProximo = camada.querySelector(".tour-proxima-txt");
  const botaoPular = camada.querySelector(".tour-pular");

  const total = passos.length;
  const frio = indice => total > 1 ? (total - 1 - indice) / (total - 1) : 0;

  tracos.innerHTML = passos.map((passo, indice) => `
    <li><button type="button" class="tour-traco" tabindex="-1" data-passo="${indice}" style="--q:${frio(indice).toFixed(3)}" aria-label="Ir para o passo ${indice + 1}: ${passo.titulo}"></button></li>`).join("");

  let atual = 0;
  let alvoAtual = null;
  let vistaOriginal = null;
  let quadro = 0;

  const vistaAtiva = () => document.querySelector(".app-aba[aria-selected=\"true\"]")?.dataset.vista || null;

  const irParaVista = vista => {
    if (!vista || vistaAtiva() === vista) return;
    document.querySelector(`.app-aba[data-vista="${vista}"]`)?.click();
  };

  const posicionar = () => {
    cancelAnimationFrame(quadro);
    quadro = requestAnimationFrame(() => {
      const largura = innerWidth;
      const altura = innerHeight;
      const margem = 12;
      const caixaCartao = cartao.getBoundingClientRect();
      const larguraCartao = caixaCartao.width;
      const alturaCartao = caixaCartao.height;

      if (!alvoAtual || !visivel(alvoAtual)) {
        camada.classList.remove("com-alvo");
        cartao.classList.add("no-centro");
        cartao.style.left = "";
        cartao.style.top = "";
        return;
      }

      const folga = 6;
      const r = alvoAtual.getBoundingClientRect();
      const topo = Math.max(r.top - folga, 4);
      const esquerda = Math.max(r.left - folga, 4);
      const direita = Math.min(r.right + folga, largura - 4);
      const baixo = Math.min(r.bottom + folga, altura - 4);
      anel.style.transform = `translate(${esquerda}px, ${topo}px)`;
      anel.style.width = `${Math.max(direita - esquerda, 0)}px`;
      anel.style.height = `${Math.max(baixo - topo, 0)}px`;
      camada.classList.add("com-alvo");
      cartao.classList.remove("no-centro");

      const distancia = 14;
      const centroX = (esquerda + direita) / 2;
      const limitarX = x => Math.min(Math.max(x, margem), largura - larguraCartao - margem);
      let x = limitarX(centroX - larguraCartao / 2);
      let y;

      if (baixo + distancia + alturaCartao <= altura - margem) {
        y = baixo + distancia;
      } else if (topo - distancia - alturaCartao >= margem) {
        y = topo - distancia - alturaCartao;
      } else if (direita + distancia + larguraCartao <= largura - margem) {
        x = direita + distancia;
        y = Math.min(Math.max(topo, margem), altura - alturaCartao - margem);
      } else if (esquerda - distancia - larguraCartao >= margem) {
        x = esquerda - distancia - larguraCartao;
        y = Math.min(Math.max(topo, margem), altura - alturaCartao - margem);
      } else {
        y = (topo + baixo) / 2 > altura / 2 ? margem : altura - alturaCartao - margem;
      }

      cartao.style.left = `${Math.round(x)}px`;
      cartao.style.top = `${Math.round(Math.max(y, margem))}px`;
    });
  };

  const mostrarPasso = (indice, focarTitulo) => {
    atual = Math.min(Math.max(indice, 0), total - 1);
    const passo = passos[atual];
    irParaVista(passo.vista);

    const q = frio(atual);
    grau.textContent = `${total - 1 - atual}°`;
    cartao.style.setProperty("--tour-cor", `color-mix(in srgb, var(--acc) ${Math.round(q * 100)}%, var(--acc-2))`);
    contagem.textContent = `Passo ${atual + 1} de ${total}`;
    area.textContent = passo.area;
    titulo.textContent = passo.titulo;
    texto.innerHTML = passo.texto;
    onde.textContent = typeof passo.onde === "function" ? passo.onde() : (passo.onde || "");

    for (const traco of tracos.querySelectorAll(".tour-traco")) {
      const n = Number(traco.dataset.passo);
      traco.classList.toggle("feito", n <= atual);
      if (n === atual) traco.setAttribute("aria-current", "step");
      else traco.removeAttribute("aria-current");
    }

    botaoAnterior.disabled = atual === 0;
    botaoPular.hidden = atual === total - 1;
    textoProximo.textContent = atual === total - 1 ? (passo.ultimo || "Concluir") : "Próximo";

    alvoAtual = typeof passo.alvo === "function" ? passo.alvo() : null;
    if (alvoAtual && alvoAtual !== botao) {
      alvoAtual.scrollIntoView({block: "nearest", inline: "nearest", behavior: SEM_MOVIMENTO.matches ? "auto" : "instant"});
    }
    posicionar();
    if (focarTitulo) titulo.focus({preventScroll: true});
  };

  const algumaCaixaAberta = () =>
    !!document.querySelector(".gate.aberto, .cart.aberto, .pedido.aberto, .consentimento");

  const aoRolar = () => {
    if (!camada.hidden) posicionar();
  };

  const abrir = (indice = 0) => {
    if (!camada.hidden) return;
    fecharConvite(true);
    marcarVisto();
    vistaOriginal = vistaAtiva();
    camada.hidden = false;
    botao.setAttribute("aria-expanded", "true");
    mostrarPasso(indice, false);
    addEventListener("resize", aoRolar);
    addEventListener("scroll", aoRolar, true);
    requestAnimationFrame(() => titulo.focus({preventScroll: true}));
  };

  const fechar = (irParaOriginal = true) => {
    if (camada.hidden) return;
    cancelAnimationFrame(quadro);
    camada.hidden = true;
    camada.classList.remove("com-alvo");
    botao.setAttribute("aria-expanded", "false");
    removeEventListener("resize", aoRolar);
    removeEventListener("scroll", aoRolar, true);
    if (irParaOriginal && vistaOriginal) irParaVista(vistaOriginal);
    botao.focus({preventScroll: true});
  };

  const avancar = () => {
    if (atual >= total - 1) {
      fechar(false);
      if (PUBLICO === "varejo") irParaVista("catalogo");
      return;
    }
    mostrarPasso(atual + 1, true);
  };

  const voltar = () => {
    if (atual > 0) mostrarPasso(atual - 1, true);
  };

  botao.addEventListener("click", () => abrir(0));
  botaoProximo.addEventListener("click", avancar);
  botaoAnterior.addEventListener("click", voltar);
  camada.querySelector(".tour-fechar").addEventListener("click", () => fechar());
  botaoPular.addEventListener("click", () => fechar());
  camada.querySelector(".tour-fundo").addEventListener("click", () => fechar());
  tracos.addEventListener("click", evento => {
    const traco = evento.target.closest(".tour-traco");
    if (traco) mostrarPasso(Number(traco.dataset.passo), true);
  });

  let inicioToque = null;
  cartao.addEventListener("touchstart", evento => {
    const toque = evento.changedTouches[0];
    inicioToque = {x: toque.clientX, y: toque.clientY};
  }, {passive: true});
  cartao.addEventListener("touchend", evento => {
    if (!inicioToque) return;
    const toque = evento.changedTouches[0];
    const dx = toque.clientX - inicioToque.x;
    const dy = toque.clientY - inicioToque.y;
    inicioToque = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) avancar();
    else voltar();
  }, {passive: true});

  const focaveis = () => [...cartao.querySelectorAll("button:not(:disabled):not([tabindex=\"-1\"]), [href]")].filter(elemento => elemento.getClientRects().length > 0);

  addEventListener("keydown", evento => {
    if (camada.hidden && convite && evento.key === "Escape") {
      fecharConvite(true);
      return;
    }
    if (camada.hidden) {
      const digitando = evento.target.closest?.("input, textarea, select, [contenteditable=\"true\"]");
      if (evento.key === "?" && !digitando && !evento.ctrlKey && !evento.metaKey && !evento.altKey && !algumaCaixaAberta()) {
        evento.preventDefault();
        abrir(0);
      }
      return;
    }
    if (evento.key === "Escape") {
      evento.preventDefault();
      evento.stopImmediatePropagation();
      fechar();
    } else if (evento.key === "ArrowRight") {
      evento.preventDefault();
      avancar();
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      voltar();
    } else if (evento.key === "Tab") {
      const lista = focaveis();
      if (!lista.length) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      const dentro = cartao.contains(document.activeElement);
      if (evento.shiftKey && (document.activeElement === primeiro || !dentro)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && (document.activeElement === ultimo || !dentro)) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
  }, true);

  let convite = null;

  function fecharConvite(marcar) {
    if (!convite) return;
    convite.remove();
    convite = null;
    removeEventListener("resize", posicionarConvite);
    if (marcar) marcarVisto();
  }

  function posicionarConvite() {
    if (!convite) return;
    const r = botao.getBoundingClientRect();
    const largura = convite.offsetWidth;
    const x = Math.min(Math.max(r.right - largura, 12), innerWidth - largura - 12);
    convite.style.left = `${Math.round(x)}px`;
    convite.style.top = `${Math.round(r.bottom + 12)}px`;
    convite.style.setProperty("--seta-x", `${Math.round(x + largura - (r.left + r.width / 2) - 5)}px`);
  }

  const mostrarConvite = () => {
    if (convite || lerVisto() || navigator.webdriver || !camada.hidden || algumaCaixaAberta() || !visivel(botao)) return;
    convite = document.createElement("div");
    convite.className = "tour-convite";
    convite.setAttribute("role", "region");
    convite.setAttribute("aria-label", "Guia do site");
    convite.innerHTML = `
      <p><b>Primeira vez por aqui?</b>Um guia rápido mostra onde fica cada coisa no site.</p>
      <div>
        <button type="button" class="btn btn-primary btn-sm" data-tour="sim">Ver o guia</button>
        <button type="button" class="btn btn-ghost btn-sm" data-tour="nao">Agora não</button>
      </div>`;
    document.body.append(convite);
    posicionarConvite();
    addEventListener("resize", posicionarConvite);
    convite.addEventListener("click", evento => {
      const escolha = evento.target.closest("[data-tour]")?.dataset.tour;
      if (escolha === "sim") abrir(0);
      else if (escolha === "nao") fecharConvite(true);
    });
  };

  const agendarConvite = () => {
    if (lerVisto() || navigator.webdriver) return;
    setTimeout(mostrarConvite, 900);
  };

  document.addEventListener("zg:entrou", agendarConvite);
  try {
    const liberada = sessionStorage.getItem("zg-idade") === "ok" && sessionStorage.getItem("zg-perfil");
    if (liberada && !document.querySelector(".gate.aberto")) agendarConvite();
  } catch {}
  document.addEventListener("click", evento => {
    if (evento.target.closest("[data-trocar]")) fecharConvite(false);
  });
})();
