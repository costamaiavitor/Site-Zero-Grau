const CATALOGO_API = {
  idPorSku: new Map(),
  idPorCategoria: new Map()
};

function enderecoNaApi(caminho) {
  try {
    return new URL(caminho, new URL(API.base, location.href)).href;
  } catch {
    return caminho;
  }
}

function textoSeguro(valor) {
  return String(valor ?? "").replace(/[<>&"]/g, "").trim();
}

function numeroOuNulo(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function fotoDaApi(foto) {
  const texto = String(foto || "").trim();
  if (!texto) return "";
  if (texto.startsWith("/") || /^https?:\/\//.test(texto)) return enderecoNaApi(texto);
  return texto;
}

function produtoDaApi(produto, slugPorId) {
  return produtoDe({
    sku: textoSeguro(produto.sku),
    marca: textoSeguro(produto.marca || produto.nome),
    nome: textoSeguro(produto.nome),
    cat: slugPorId.get(produto.categoria_id),
    foto: fotoDaApi(produto.foto_url),
    forma: FORMAS.includes(produto.embalagem) ? produto.embalagem : "bottle",
    vol: textoSeguro(produto.volume),
    teor: textoSeguro(produto.teor_alcoolico),
    preco: numeroOuNulo(produto.preco),
    promo: numeroOuNulo(produto.preco_promo),
    gelada: !!produto.gelada,
    retornavel: !!produto.retornavel,
    casco: numeroOuNulo(produto.valor_casco),
    alcoolica: !!produto.alcoolica,
    estoque: Number.parseInt(produto.estoque, 10) || 0
  });
}

async function substituirCatalogoPelaApi() {
  const [produtos, categorias] = await Promise.all([
    API.get("/produtos", {token: null}),
    API.get("/categorias", {token: null})
  ]);
  if (!Array.isArray(produtos) || !Array.isArray(categorias)) {
    throw new API.ErroApi("O servidor devolveu o catálogo num formato inesperado.");
  }

  const comSlug = categorias.filter(categoria => textoSeguro(categoria.slug));
  const slugPorId = new Map(comSlug.map(categoria => [categoria.id, textoSeguro(categoria.slug)]));
  const categoriasDaApi = comSlug.map(categoria => ({
    id: textoSeguro(categoria.slug),
    nome: textoSeguro(categoria.nome) || textoSeguro(categoria.slug),
    detalhe: textoSeguro(categoria.detalhe)
  }));
  CATEGORIAS.splice(0, CATEGORIAS.length, ...categoriasDaApi);

  const ativos = produtos.filter(produto => produto.ativo !== false && produto.ativo !== 0);
  const lista = ativos.map(produto => produtoDaApi(produto, slugPorId)).filter(Boolean);
  BEBIDAS.splice(0, BEBIDAS.length, ...lista);

  for (const produto of ativos) {
    const unidades = Number.parseInt(produto.unidades_caixa, 10);
    if (unidades > 0) CAIXA_EXCECAO[produto.sku] = unidades;
  }

  CATALOGO_API.idPorSku = new Map(produtos.map(produto => [String(produto.sku), produto.id]));
  CATALOGO_API.idPorCategoria = new Map(comSlug.map(categoria => [textoSeguro(categoria.slug), categoria.id]));
  return lista;
}

function mostrarEstadoDoCatalogo(destino, estado, aoTentarDeNovo) {
  const textos = {
    carregando: "Carregando o catálogo…",
    vazio: "Nenhum produto disponível no momento. Volte mais tarde ou fale com a loja pelo WhatsApp.",
    erro: "Não deu para carregar o catálogo agora."
  };
  const botao = estado === "erro" ? ' <button type="button" class="link" data-tentar-catalogo>Tentar de novo</button>' : "";
  const aviso = `<p class="estado-catalogo sem-resultado" role="status" aria-live="polite">${textos[estado]}${botao}</p>`;
  destino.innerHTML = destino.tagName === "TBODY" ? `<tr><td colspan="6">${aviso}</td></tr>` : aviso;
  destino.querySelector("[data-tentar-catalogo]")?.addEventListener("click", aoTentarDeNovo);
}
