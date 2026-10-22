const NOME_DO_CACHE = "zg-v1";
const ARQUIVOS_ESSENCIAIS = ["./", "index.html", "atacado.html", "manifest.webmanifest", "icone-192.png"];

self.addEventListener("install", evento => {
  evento.waitUntil(
    caches.open(NOME_DO_CACHE)
      .then(cache => cache.addAll(ARQUIVOS_ESSENCIAIS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(nome => nome !== NOME_DO_CACHE).map(nome => caches.delete(nome))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", evento => {
  const pedido = evento.request;
  const endereco = new URL(pedido.url);
  if (pedido.method !== "GET" || endereco.origin !== location.origin) return;
  if (/\/admin(\.html)?$|\/js\/admin\.js/.test(endereco.pathname)) return;

  if (/\/img\/[^/]+\.webp$/.test(endereco.pathname)) {
    evento.respondWith(caches.match(pedido).then(salvo => salvo || buscarEGuardar(pedido)));
    return;
  }

  evento.respondWith(
    buscarEGuardar(pedido).catch(() =>
      caches.match(pedido, {ignoreSearch: true}).then(salvo => {
        if (salvo) return salvo;
        if (pedido.mode === "navigate") return caches.match("index.html");
        return Response.error();
      })
    )
  );
});

function buscarEGuardar(pedido) {
  return fetch(pedido).then(resposta => {
    if (resposta.ok && resposta.type === "basic") {
      const copia = resposta.clone();
      caches.open(NOME_DO_CACHE).then(cache => cache.put(pedido, copia));
    }
    return resposta;
  });
}
