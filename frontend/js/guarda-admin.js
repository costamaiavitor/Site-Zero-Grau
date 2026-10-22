const ZG_ADMIN = (() => {
  const perfil = () => { try{ return JSON.parse(sessionStorage.getItem("zg-perfil") || "null") }catch{ return null } };

  function lerToken(token){
    const partes = String(token || "").split(".");
    if(partes.length !== 3) return null;
    try{ return JSON.parse(atob(partes[1].replace(/-/g, "+").replace(/_/g, "/"))) }catch{ return null }
  }

  function liberado(){
    const p = perfil();
    if(!p) return false;
    if(!API.usarMock){
      const dados = lerToken(API.token.ler());
      if(!dados || dados.perfil !== "admin") return false;
      return typeof dados.exp !== "number" || dados.exp * 1000 > Date.now();
    }
    const lista = Array.isArray(ZG_CONFIG?.adminsSimulados) ? ZG_CONFIG.adminsSimulados.map(e => String(e).trim().toLowerCase()) : [];
    return !!p.email && lista.includes(String(p.email).trim().toLowerCase());
  }

  const ok = liberado();
  if(ok) document.documentElement.classList.remove("adm-trancado");
  else location.replace("index.html");
  return {liberado: ok};
})();
