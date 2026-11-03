import { brl, dataHora, totalDeItens } from '../utils/formato.js';
import { STATUS } from '../services/pedidos.js';

function resumoDosItens(itens) {
  const textos = itens.map(item => `${item.quantidade}${item.unidade === 'cx' ? ' cx' : 'x'} ${item.nome}`);
  return textos.length > 3 ? `${textos.slice(0, 3).join(', ')}…` : textos.join(', ');
}

export default function TabelaPedidos({ pedidos, salvando, aoMudarStatus }) {
  return (
    <div className="table-responsive zg-tabela-rolo" tabIndex={0} aria-label="Pedidos, role para os lados">
      <table className="table table-hover align-middle mb-0 zg-tabela">
        <thead>
          <tr>
            <th scope="col">Nº</th>
            <th scope="col">Data</th>
            <th scope="col">Cliente</th>
            <th scope="col">Canal</th>
            <th scope="col">Itens</th>
            <th scope="col" className="text-end">Total</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map(pedido => (
            <tr key={pedido.id} data-pedido={pedido.id}>
              <th scope="row" className="zg-num">{pedido.id}</th>
              <td className="zg-num text-nowrap">{dataHora(pedido.em)}</td>
              <td>
                <span className="d-block">{pedido.cliente.nome || '—'}</span>
                <small className="zg-suave">{pedido.cliente.email}</small>
              </td>
              <td className="text-nowrap">
                {pedido.canal === 'atacado' ? 'Atacado' : 'Varejo'}
                <small className="d-block zg-suave">{pedido.modalidade === 'retirada' ? 'Retirada' : 'Entrega'}</small>
              </td>
              <td>
                <span className="d-block">{totalDeItens(pedido.itens.map(item => [item.sku, item.quantidade]))} itens</span>
                <small className="zg-suave">{resumoDosItens(pedido.itens)}</small>
              </td>
              <td className="text-end zg-num text-nowrap">R$ {brl(pedido.total)}</td>
              <td>
                <select
                  className="form-select form-select-sm zg-status"
                  value={pedido.status}
                  disabled={salvando === pedido.id}
                  aria-label={`Status do pedido ${pedido.id}`}
                  onChange={evento => aoMudarStatus(pedido, evento.target.value)}
                >
                  {STATUS.map(status => (
                    <option key={status.id} value={status.id}>{status.nome}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
