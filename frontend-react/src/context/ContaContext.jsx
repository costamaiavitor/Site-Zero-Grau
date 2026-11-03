import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { lerPerfil, lerPedidos, devolverAoCarrinho, sair } from '../services/armazenamento.js';
import { pedidosDoServidor } from '../services/pedidos.js';
import { usarMock } from '../services/api.js';

const ContaContext = createContext(null);

export function ContaProvider({ children }) {
  const [perfil, setPerfil] = useState(() => lerPerfil());
  const [pedidos, setPedidos] = useState(() => lerPedidos(lerPerfil()));
  const [origem, setOrigem] = useState(usarMock ? 'aparelho' : 'carregando');

  useEffect(() => {
    if (usarMock || !perfil) return undefined;
    let ativo = true;
    pedidosDoServidor()
      .then(lista => {
        if (!ativo) return;
        setPedidos(lista);
        setOrigem('servidor');
      })
      .catch(() => {
        if (ativo) setOrigem('aparelho');
      });
    return () => {
      ativo = false;
    };
  }, [perfil]);

  const pedirDeNovo = useCallback(pedido => devolverAoCarrinho(perfil, pedido), [perfil]);

  const encerrar = useCallback(() => {
    sair();
    setPerfil(null);
    setPedidos([]);
  }, []);

  const valor = useMemo(
    () => ({ perfil, pedidos, origem, pedirDeNovo, encerrar }),
    [perfil, pedidos, origem, pedirDeNovo, encerrar]
  );
  return <ContaContext.Provider value={valor}>{children}</ContaContext.Provider>;
}

export function useConta() {
  const contexto = useContext(ContaContext);
  if (!contexto) throw new Error('useConta fora do ContaProvider');
  return contexto;
}
