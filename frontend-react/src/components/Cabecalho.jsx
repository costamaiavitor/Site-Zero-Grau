export default function Cabecalho({ perfil, aoSair }) {
  const loja = perfil?.tipo === 'cnpj' ? '../atacado.html' : '../index.html';
  return (
    <header className="zg-cabecalho border-bottom">
      <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
        <a className="zg-logo text-decoration-none" href={loja} aria-label="Zero Grau, voltar à loja">
          <span className="zg-logo-marca" aria-hidden="true">0°</span>
          <span className="zg-logo-nome">Zero Grau<small>Minha conta</small></span>
        </a>
        <nav className="d-flex gap-2" aria-label="Ações da conta">
          <a className="btn btn-outline-light zg-btn" href={loja}>Voltar à loja</a>
          {perfil && (
            <button type="button" className="btn btn-outline-secondary zg-btn" onClick={aoSair}>
              Sair
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
