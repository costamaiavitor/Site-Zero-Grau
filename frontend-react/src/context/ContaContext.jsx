import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { lerPerfil, lerPedidos, devolverAoCarrinho, sair } from '../services/armazenamento.js';

const ContaContext = createContext(null);

export function ContaProvider({ children }) {
  const [perfil, setPerfil] = useState(() => lerPerfil());
  const [pedidos, setPedidos] = useState(() => lerPedidos(lerPerfil()));

  const pedirDeNovo = useCallback(pedido => devolverAoCarrinho(perfil, pedido), [perfil]);

  const encerrar = useCallback(() => {
    sair();
    setPerfil(null);
    setPedidos([]);
  }, []);

  const valor = useMemo(() => ({ perfil, pedidos, pedirDeNovo, encerrar }), [perfil, pedidos, pedirDeNovo, encerrar]);
  return <ContaContext.Provider value={valor}>{children}</ContaContext.Provider>;
}

export function useConta() {
  const contexto = useContext(ContaContext);
  if (!contexto) throw new Error('useConta fora do ContaProvider');
  return contexto;
}
