/* ==========================================================================
   ZERO GRAU · service worker (o site como app)

   Rede primeiro, sempre: com internet, o cliente recebe a versão que acabou
   de ser publicada — preço, cupom e horário mudam pelo painel e não podem
   ficar presos num cache. A cópia guardada só entra quando a rede falha,
   para o app abrir mesmo sem sinal. Fotos de produto são a exceção: nome de
   arquivo novo a cada foto nova, então podem vir do cache direto.

   O painel (admin.html, admin.js) nunca passa por aqui: vai sempre à rede.
   Suba VERSAO ao mudar a lógica deste arquivo.
   ========================================================================== */
const VERSAO = "zg-v1";
const ESSENCIAL = ["./", "index.html", "atacado.html", "manifest.webmanifest", "icone-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ESSENCIAL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if(req.method !== "GET" || url.origin !== location.origin) return;
  if(/\/admin(\.html)?$|\/js\/admin\.js/.test(url.pathname)) return;

  if(/\/img\/[^/]+\.webp$/.test(url.pathname)){
    e.respondWith(caches.match(req).then(salvo => salvo || buscarEGuardar(req)));
    return;
  }
  e.respondWith(
    buscarEGuardar(req).catch(() =>
      caches.match(req, {ignoreSearch: true})
        .then(salvo => salvo || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});

function buscarEGuardar(req){
  return fetch(req).then(resp => {
    if(resp.ok && resp.type === "basic"){
      const copia = resp.clone();
      caches.open(VERSAO).then(c => c.put(req, copia));
    }
    return resp;
  });
}
