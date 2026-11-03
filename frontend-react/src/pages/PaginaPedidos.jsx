import { useCallback, useEffect, useMemo, useState } from 'react';
import Cabecalho from '../components/Cabecalho.jsx';
import Rodape from '../components/Rodape.jsx';
import TabelaPedidos from '../components/TabelaPedidos.jsx';
import { lerPerfil } from '../services/armazenamento.js';
import { adminsSimulados, dadosDoToken, usarMock } from '../services/api.js';
import { STATUS, mudarStatus, nomeDoStatus, todosOsPedidos } from '../services/pedidos.js';

const VOLTAR = { href: '../admin.html', texto: 'Voltar ao painel', rotulo: 'Zero Grau, voltar ao painel' };

function souAdmin(perfil) {
  if (!perfil) return false;
  if (usarMock) return adminsSimulados.includes(String(perfil.email || '').trim().toLowerCase());
  const token = dadosDoToken();
  if (!token || token.perfil !== 'admin') return false;
  return typeof token.exp !== 'number' || token.exp * 1000 > Date.now();
}

const semAcento = texto => String(texto || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function Aviso({ titulo, children, acao }) {
  return (
    <section className="card zg-cartao zg-sem-conta mx-auto">
      <div className="card-body text-center p-4 p-md-5">
        <p className="zg-rotulo mb-2">Pedidos</p>
        <h1 className="zg-titulo h3 mb-3">{titulo}</h1>
        <div className="zg-suave mb-4">{children}</div>
        {acao}
      </div>
    </section>
  );
}

export default function PaginaPedidos() {
  const perfil = useMemo(() => lerPerfil(), []);
  const admin = souAdmin(perfil);
  const [estado, setEstado] = useState(usarMock || !admin ? 'parado' : 'carregando');
  const [erro, setErro] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(null);
  const [aviso, setAviso] = useState('');

  const carregar = useCallback(async () => {
    setEstado('carregando');
    try {
      setPedidos(await todosOsPedidos());
      setEstado('pronto');
    } catch (falha) {
      setErro(falha.message);
      setEstado('erro');
    }
  }, []);

  useEffect(() => {
    if (!usarMock && admin) carregar();
  }, [admin, carregar]);

  const contagem = useMemo(() => {
    const total = Object.fromEntries(STATUS.map(status => [status.id, 0]));
    for (const pedido of pedidos) total[pedido.status] = (total[pedido.status] || 0) + 1;
    return total;
  }, [pedidos]);

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    return pedidos.filter(pedido => {
      if (filtro !== 'todos' && pedido.status !== filtro) return false;
      if (!termo) return true;
      return [pedido.id, pedido.cliente.nome, pedido.cliente.email].some(campo => semAcento(campo).includes(termo));
    });
  }, [pedidos, filtro, busca]);

  async function aoMudarStatus(pedido, novo) {
    const anterior = pedido.status;
    setSalvando(pedido.id);
    setPedidos(lista => lista.map(item => (item.id === pedido.id ? { ...item, status: novo } : item)));
    try {
      await mudarStatus(pedido.id, novo);
      setAviso(`Pedido nº ${pedido.id}: ${nomeDoStatus(novo)}.`);
    } catch (falha) {
      setPedidos(lista => lista.map(item => (item.id === pedido.id ? { ...item, status: anterior } : item)));
      setAviso(`Não mudou o status do pedido nº ${pedido.id}: ${falha.message}`);
    } finally {
      setSalvando(null);
    }
  }

  let conteudo;
  if (!admin) {
    conteudo = (
      <Aviso titulo="Só administradores veem os pedidos" acao={<a className="btn btn-primary zg-btn" href="../index.html">Ir para a loja</a>}>
        Entre na loja com uma conta de administrador e abra o painel.
      </Aviso>
    );
  } else if (usarMock) {
    conteudo = (
      <Aviso titulo="Os pedidos aparecem aqui com a API ligada" acao={<a className="btn btn-primary zg-btn" href="../admin.html">Voltar ao painel</a>}>
        No modo simulado o site não tem servidor, e cada pedido vai direto para o WhatsApp da loja. Com a API ligada em
        js/config.js, os pedidos ficam registrados no banco e o status muda por aqui.
      </Aviso>
    );
  } else {
    conteudo = (
      <>
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
          <h1 className="zg-manchete mb-0">Pedidos</h1>
          <button type="button" className="btn btn-outline-light zg-btn" onClick={carregar} disabled={estado === 'carregando'}>
            Atualizar
          </button>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Pedidos por status">
          {STATUS.map(status => (
            <button
              key={status.id}
              type="button"
              className={`btn btn-sm zg-filtro ${filtro === status.id ? 'active' : ''}`}
              aria-pressed={filtro === status.id}
              onClick={() => setFiltro(filtro === status.id ? 'todos' : status.id)}
            >
              {status.nome} <span className="badge zg-badge-status ms-1">{contagem[status.id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label zg-rotulo" htmlFor="buscaPedido">Buscar</label>
            <input
              id="buscaPedido"
              type="search"
              className="form-control"
              placeholder="Nº do pedido, nome ou e-mail"
              value={busca}
              onChange={evento => setBusca(evento.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label zg-rotulo" htmlFor="filtroStatus">Status</label>
            <select id="filtroStatus" className="form-select" value={filtro} onChange={evento => setFiltro(evento.target.value)}>
              <option value="todos">Todos</option>
              {STATUS.map(status => (
                <option key={status.id} value={status.id}>{status.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="zg-aviso" role="status" aria-live="polite">{aviso}</p>

        <section className="card zg-cartao" aria-label="Lista de pedidos">
          {estado === 'carregando' && <p className="card-body zg-suave mb-0" role="status">Carregando os pedidos…</p>}
          {estado === 'erro' && (
            <div className="card-body" role="alert">
              <p className="mb-2">Não deu para carregar os pedidos: {erro}</p>
              <button type="button" className="btn btn-primary zg-btn" onClick={carregar}>Tentar de novo</button>
            </div>
          )}
          {estado === 'pronto' && !visiveis.length && (
            <p className="card-body zg-suave mb-0">
              {pedidos.length ? 'Nenhum pedido com esse filtro.' : 'Nenhum pedido registrado ainda.'}
            </p>
          )}
          {estado === 'pronto' && visiveis.length > 0 && (
            <TabelaPedidos pedidos={visiveis} salvando={salvando} aoMudarStatus={aoMudarStatus} />
          )}
        </section>
      </>
    );
  }

  return (
    <div className="zg-pagina d-flex flex-column min-vh-100">
      <Cabecalho perfil={perfil} subtitulo="Painel · Pedidos" voltar={VOLTAR} />
      <main className="container py-4 py-md-5 flex-grow-1">{conteudo}</main>
      <Rodape />
    </div>
  );
}
