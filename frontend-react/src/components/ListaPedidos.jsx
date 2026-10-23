import { brl, dataHora, plural, totalDeItens } from '../utils/formato.js';

function CartaoPedido({ pedido, aoPedirDeNovo }) {
  const qtd = totalDeItens(pedido.itens);
  return (
    <li className="list-group-item zg-pedido">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div className="zg-pedido-texto">
          <p className="mb-1 zg-pedido-cab">
            <span className="zg-num">{dataHora(pedido.em)}</span>
            <span className="zg-sep" aria-hidden="true">·</span>
            {plural(qtd, 'item', 'itens')}
          </p>
          <ul className="list-unstyled mb-0 zg-itens">
            {pedido.itens.map(([sku, quantidade, nome]) => (
              <li key={sku}>
                <span className="zg-num">{quantidade}x</span> {nome}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-end d-flex flex-column align-items-end gap-2">
          <p className="mb-0 zg-total">
            <small>Total</small> R$ {brl(pedido.total)}
          </p>
          <button type="button" className="btn btn-primary zg-btn" onClick={() => aoPedirDeNovo(pedido)}>
            Pedir de novo
          </button>
        </div>
      </div>
    </li>
  );
}

export default function ListaPedidos({ pedidos, aoPedirDeNovo }) {
  return (
    <section className="card zg-cartao" aria-labelledby="tituloPedidos">
      <div className="card-body pb-0">
        <p className="zg-rotulo mb-2">Histórico</p>
        <h2 id="tituloPedidos" className="zg-titulo h4 mb-1">Seus últimos pedidos</h2>
        <p className="zg-suave mb-3">
          Os 5 pedidos mais recentes enviados deste aparelho. "Pedir de novo" põe os itens de volta no carrinho;
          a loja confere o estoque de hoje.
        </p>
      </div>
      {pedidos.length ? (
        <ul className="list-group list-group-flush">
          {pedidos.map(p => (
            <CartaoPedido key={p.em} pedido={p} aoPedirDeNovo={aoPedirDeNovo} />
          ))}
        </ul>
      ) : (
        <div className="card-body pt-0">
          <div className="zg-vazio">
            <p className="mb-1">Nenhum pedido ainda.</p>
            <p className="zg-suave mb-0">Quando você enviar um pedido pelo WhatsApp, ele aparece aqui.</p>
          </div>
        </div>
      )}
    </section>
  );
}
