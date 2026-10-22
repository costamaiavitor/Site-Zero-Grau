if ("serviceWorker" in navigator && window.isSecureContext) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

let convitePraInstalar = null;

addEventListener("beforeinstallprompt", evento => {
  evento.preventDefault();
  convitePraInstalar = evento;
  const botaoInstalar = document.getElementById("instalarApp");
  if (botaoInstalar) botaoInstalar.hidden = false;
});

document.getElementById("instalarApp")?.addEventListener("click", async evento => {
  if (!convitePraInstalar) return;
  convitePraInstalar.prompt();
  await convitePraInstalar.userChoice.catch(() => {});
  convitePraInstalar = null;
  evento.currentTarget.hidden = true;
});

addEventListener("appinstalled", () => {
  const botaoInstalar = document.getElementById("instalarApp");
  if (botaoInstalar) botaoInstalar.hidden = true;
});

const CONSENTIMENTO = {
  ler() {
    try {
      return localStorage.getItem("zg-consentimento");
    } catch {
      return null;
    }
  },
  gravar(resposta) {
    try {
      localStorage.setItem("zg-consentimento", resposta);
    } catch {}
  }
};

function carregarScriptExterno(endereco, atributos = {}) {
  const script = document.createElement("script");
  script.async = true;
  script.src = endereco;
  for (const [nome, valor] of Object.entries(atributos)) {
    script.setAttribute(nome, valor);
  }
  document.head.append(script);
}

function ligarPlausible(dominio) {
  window.plausible = window.plausible || function() {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
  carregarScriptExterno("https://plausible.io/js/script.js", {"data-domain": dominio, defer: ""});
}

function ligarGoogleAnalytics(idDeMedicao) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    dataLayer.push(arguments);
  };
  gtag("js", new Date());
  gtag("config", idDeMedicao, {anonymize_ip: true});
  carregarScriptExterno(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(idDeMedicao)}`);
}

function pedirConsentimento(idDeMedicao) {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="consentimento" role="dialog" aria-live="polite" aria-label="Cookies de estatística">
      <p>Usamos um cookie do Google Analytics só para contar visitas. Pode?</p>
      <div>
        <button type="button" class="btn btn-primary btn-sm" data-consentir="sim">Pode</button>
        <button type="button" class="btn btn-ghost btn-sm" data-consentir="nao">Não</button>
      </div>
    </div>`);

  document.querySelector(".consentimento").addEventListener("click", evento => {
    const resposta = evento.target.closest("[data-consentir]")?.dataset.consentir;
    if (!resposta) return;
    CONSENTIMENTO.gravar(resposta);
    evento.currentTarget.remove();
    if (resposta === "sim") ligarGoogleAnalytics(idDeMedicao);
  });
}

if (ESTATISTICA.tipo === "plausible" && ESTATISTICA.id) {
  ligarPlausible(ESTATISTICA.id);
}

if (ESTATISTICA.tipo === "ga4" && ESTATISTICA.id) {
  const respostaGuardada = CONSENTIMENTO.ler();
  if (respostaGuardada === "sim") {
    ligarGoogleAnalytics(ESTATISTICA.id);
  } else if (respostaGuardada === null) {
    pedirConsentimento(ESTATISTICA.id);
  }
}

function registrarEvento(nomeDoEvento, detalhes = {}) {
  try {
    if (ESTATISTICA.tipo === "plausible" && window.plausible) {
      plausible(nomeDoEvento, {props: detalhes});
    }
    if (ESTATISTICA.tipo === "ga4" && window.gtag && CONSENTIMENTO.ler() === "sim") {
      gtag("event", nomeDoEvento, detalhes);
    }
  } catch {}
}
