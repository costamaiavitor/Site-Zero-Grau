import { useState } from 'react';
import { useConta } from '../context/ContaContext.jsx';
import Cabecalho from '../components/Cabecalho.jsx';
import CartaoPerfil from '../components/CartaoPerfil.jsx';
import ListaPedidos from '../components/ListaPedidos.jsx';
import AvisoSemConta from '../components/AvisoSemConta.jsx';
import Rodape from '../components/Rodape.jsx';

export default function PaginaMinhaConta() {
  const { perfil, pedidos, pedirDeNovo, encerrar } = useConta();
  const [aviso, setAviso] = useState('');

  function aoPedirDeNovo(pedido) {
    if (!pedirDeNovo(pedido)) {
      setAviso('O navegador não deixou guardar o carrinho. Tente de novo.');
      return;
    }
    setAviso('Itens de volta no carrinho. Abrindo a loja…');
    location.href = '../index.html';
  }

  return (
    <div className="zg-pagina d-flex flex-column min-vh-100">
      <Cabecalho perfil={perfil} aoSair={encerrar} />
      <main className="container py-4 py-md-5 flex-grow-1">
        {!perfil ? (
          <AvisoSemConta />
        ) : (
          <>
            <h1 className="zg-manchete mb-4">Minha conta</h1>
            <p className="zg-aviso" role="status" aria-live="polite">{aviso}</p>
            <div className="row g-4">
              <div className="col-12 col-lg-4">
                <CartaoPerfil perfil={perfil} />
              </div>
              <div className="col-12 col-lg-8">
                {perfil.tipo === 'cnpj' ? (
                  <section className="card zg-cartao h-100">
                    <div className="card-body">
                      <p className="zg-rotulo mb-2">Histórico</p>
                      <h2 className="zg-titulo h4 mb-2">Pedidos de atacado</h2>
                      <p className="zg-suave mb-0">
                        No balcão de atacado o pedido vai direto para o WhatsApp da loja, com faturamento para o CNPJ.
                        O histórico com "pedir de novo" é da loja de varejo.
                      </p>
                    </div>
                  </section>
                ) : (
                  <ListaPedidos pedidos={pedidos} aoPedirDeNovo={aoPedirDeNovo} />
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <Rodape />
    </div>
  );
}
