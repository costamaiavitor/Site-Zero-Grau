import { chamarApi } from './api.js';

export const STATUS = [
  { id: 'recebido', nome: 'Recebido' },
  { id: 'confirmado', nome: 'Confirmado' },
  { id: 'em_preparo', nome: 'Em preparo' },
  { id: 'saiu', nome: 'Saiu para entrega' },
  { id: 'entregue', nome: 'Entregue' },
  { id: 'cancelado', nome: 'Cancelado' }
];

export const nomeDoStatus = id => STATUS.find(status => status.id === id)?.nome || id || 'Recebido';

function itensDoPedido(pedido) {
  const lista = pedido.itens || pedido.ItemPedidos || pedido.ItensPedido || [];
  return lista.map(item => {
    const produto = item.produto || item.Produto || {};
    const nome = [produto.marca, produto.nome].filter(Boolean).join(' ') || item.nome || item.sku || 'Produto';
    return {
      sku: produto.sku || item.sku || '',
      quantidade: Number(item.quantidade) || 0,
      unidade: item.unidade || 'un',
      nome
    };
  });
}

function clienteDoPedido(pedido) {
  const usuario = pedido.usuario || pedido.Usuario || {};
  return { nome: usuario.nome || '', email: usuario.email || '' };
}

export function pedidoDoServidor(pedido) {
  return {
    id: pedido.id,
    em: Date.parse(pedido.criado_em || pedido.criadoEm || pedido.createdAt) || Date.now(),
    total: Number(pedido.total) || 0,
    status: pedido.status || 'recebido',
    canal: pedido.canal || 'varejo',
    modalidade: pedido.modalidade || 'entrega',
    cliente: clienteDoPedido(pedido),
    itens: itensDoPedido(pedido)
  };
}

export async function pedidosDoServidor() {
  const lista = await chamarApi('/pedidos/meus');
  if (!Array.isArray(lista)) throw new Error('formato inesperado');
  return lista.map(pedidoDoServidor).map(pedido => ({
    ...pedido,
    itens: pedido.itens.map(item => [item.sku, item.quantidade, item.nome])
  }));
}

export async function todosOsPedidos() {
  const lista = await chamarApi('/pedidos');
  if (!Array.isArray(lista)) throw new Error('O servidor devolveu os pedidos num formato inesperado.');
  return lista.map(pedidoDoServidor).sort((a, b) => b.em - a.em);
}

export function mudarStatus(id, status) {
  return chamarApi(`/pedidos/${encodeURIComponent(id)}/status`, { metodo: 'PATCH', corpo: { status } });
}
