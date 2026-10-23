export function lerPerfil() {
  try {
    return JSON.parse(sessionStorage.getItem('zg-perfil') || 'null');
  } catch {
    return null;
  }
}

export function idConta(perfil) {
  if (!perfil) return null;
  if (perfil.id !== undefined && perfil.id !== null) return `id-${perfil.id}`;
  return perfil.email ? String(perfil.email).toLowerCase() : null;
}

function chave(base, perfil) {
  const id = idConta(perfil);
  return id ? `${base}:${id}` : null;
}

export function lerDaConta(base, perfil, padrao) {
  const k = chave(base, perfil);
  if (!k) return padrao;
  try {
    const valor = JSON.parse(localStorage.getItem(k) || 'null');
    return valor ?? padrao;
  } catch {
    return padrao;
  }
}

export function gravarNaConta(base, perfil, valor) {
  const k = chave(base, perfil);
  if (!k) return false;
  try {
    localStorage.setItem(k, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function lerPedidos(perfil) {
  const lista = lerDaConta('zg-pedidos', perfil, []);
  return Array.isArray(lista) ? lista.filter(p => p && Array.isArray(p.itens)) : [];
}

export function devolverAoCarrinho(perfil, pedido) {
  const atual = lerDaConta('zg-carrinho', perfil, []);
  const mapa = new Map(Array.isArray(atual) ? atual : []);
  for (const [sku, qtd] of pedido.itens) mapa.set(sku, (mapa.get(sku) || 0) + qtd);
  return gravarNaConta('zg-carrinho', perfil, [...mapa]);
}

export function sair() {
  try {
    for (const k of ['zg-perfil', 'zg-loja', 'zg-token']) sessionStorage.removeItem(k);
  } catch {}
}
