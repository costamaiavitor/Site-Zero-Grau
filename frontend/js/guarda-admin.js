function perfilDaSessao() {
  try {
    return JSON.parse(sessionStorage.getItem("zg-perfil") || "null");
  } catch {
    return null;
  }
}

function lerToken(token) {
  const partes = String(token || "").split(".");
  if (partes.length !== 3) return null;
  try {
    return JSON.parse(atob(partes[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function painelLiberado() {
  const perfil = perfilDaSessao();
  if (!perfil) return false;

  if (!API.usarMock) {
    const conteudoDoToken = lerToken(API.token.ler());
    if (!conteudoDoToken || conteudoDoToken.perfil !== "admin") return false;
    return typeof conteudoDoToken.exp !== "number" || conteudoDoToken.exp * 1000 > Date.now();
  }

  let admins = [];
  if (Array.isArray(ZG_CONFIG?.adminsSimulados)) {
    admins = ZG_CONFIG.adminsSimulados.map(email => String(email).trim().toLowerCase());
  }
  return !!perfil.email && admins.includes(String(perfil.email).trim().toLowerCase());
}

const ZG_ADMIN = {liberado: painelLiberado()};

if (ZG_ADMIN.liberado) {
  document.documentElement.classList.remove("adm-trancado");
} else {
  location.replace("index.html");
}
