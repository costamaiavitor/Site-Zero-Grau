/* ==========================================================================
   ZERO GRAU · o site como app, e a contagem de visitas

   1. Service worker (sw.js): o site abre mesmo sem sinal e pode ser
      instalado na tela do celular.
   2. Botão "Instalar o app": só aparece onde o navegador oferece instalar
      (Chrome e Android disparam beforeinstallprompt; o iPhone instala pelo
      menu Compartilhar e não avisa a página).
   3. Estatística, conforme ESTATISTICA em dados.js (o painel edita):
      desligada não carrega nada; Plausible não usa cookie e liga direto;
      Google Analytics usa cookie, então pela LGPD só liga depois que o
      visitante aceita — a escolha fica guardada no aparelho.
      O que se conta: visitas e pedidos enviados (e por qual caminho). Nada
      de nome, endereço ou valor.
   ========================================================================== */

/* ---------- 1. service worker ---------- */
if("serviceWorker" in navigator && window.isSecureContext){
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

/* ---------- 2. instalar ---------- */
let pedidoInstalar = null;
addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  pedidoInstalar = e;
  const b = document.getElementById("instalarApp");
  if(b) b.hidden = false;
});
document.getElementById("instalarApp")?.addEventListener("click", async e => {
  if(!pedidoInstalar) return;
  pedidoInstalar.prompt();
  await pedidoInstalar.userChoice.catch(() => {});
  pedidoInstalar = null;
  e.currentTarget.hidden = true;
});
addEventListener("appinstalled", () => { const b = document.getElementById("instalarApp"); if(b) b.hidden = true; });

/* ---------- 3. estatística ---------- */
const CONSENTIMENTO = {
  ler(){ try{ return localStorage.getItem("zg-consentimento") }catch{ return null } },
  gravar(v){ try{ localStorage.setItem("zg-consentimento", v) }catch{} }
};

function carregarScript(src, attrs = {}){
  const s = document.createElement("script");
  s.async = true; s.src = src;
  for(const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.append(s);
}

function ligarPlausible(dominio){
  window.plausible = window.plausible || function(){ (window.plausible.q = window.plausible.q || []).push(arguments) };
  carregarScript("https://plausible.io/js/script.js", {"data-domain": dominio, defer: ""});
}

function ligarGA(id){
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments) };
  gtag("js", new Date());
  gtag("config", id, {anonymize_ip: true});
  carregarScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

function pedirConsentimento(id){
  document.body.insertAdjacentHTML("beforeend", `
    <div class="consentimento" role="dialog" aria-live="polite" aria-label="Cookies de estatística">
      <p>Usamos um cookie do Google Analytics só para contar visitas. Pode?</p>
      <div>
        <button type="button" class="btn btn-primary btn-sm" data-consentir="sim">Pode</button>
        <button type="button" class="btn btn-ghost btn-sm" data-consentir="nao">Não</button>
      </div>
    </div>`);
  document.querySelector(".consentimento").addEventListener("click", e => {
    const v = e.target.closest("[data-consentir]")?.dataset.consentir;
    if(!v) return;
    CONSENTIMENTO.gravar(v);
    e.currentTarget.remove();
    if(v === "sim") ligarGA(id);
  });
}

if(ESTATISTICA.tipo === "plausible" && ESTATISTICA.id) ligarPlausible(ESTATISTICA.id);
if(ESTATISTICA.tipo === "ga4" && ESTATISTICA.id){
  const c = CONSENTIMENTO.ler();
  if(c === "sim") ligarGA(ESTATISTICA.id);
  else if(c === null) pedirConsentimento(ESTATISTICA.id);
}

/* chamado pelo fechamento do pedido; não faz nada com a estatística desligada */
function registrarEvento(nome, props = {}){
  try{
    if(ESTATISTICA.tipo === "plausible" && window.plausible) plausible(nome, {props});
    if(ESTATISTICA.tipo === "ga4" && window.gtag && CONSENTIMENTO.ler() === "sim") gtag("event", nome, props);
  }catch{ /* estatística nunca atrapalha o pedido */ }
}
