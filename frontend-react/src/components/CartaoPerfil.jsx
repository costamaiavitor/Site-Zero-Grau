export default function CartaoPerfil({ perfil }) {
  const atacado = perfil.tipo === 'cnpj';
  return (
    <section className="card zg-cartao h-100" aria-labelledby="tituloPerfil">
      <div className="card-body">
        <p className="zg-rotulo mb-2">Conta</p>
        <h2 id="tituloPerfil" className="zg-titulo h4 mb-3">{perfil.nome || 'Cliente'}</h2>
        <dl className="zg-dados mb-0">
          <div>
            <dt>E-mail</dt>
            <dd>{perfil.email}</dd>
          </div>
          <div>
            <dt>{atacado ? 'CNPJ' : 'CPF'}</dt>
            <dd className="zg-num">{perfil.doc}</dd>
          </div>
          <div>
            <dt>Loja</dt>
            <dd>
              <span className={`badge ${atacado ? 'zg-badge-atacado' : 'zg-badge-varejo'}`}>
                {atacado ? 'Atacado · caixa fechada' : 'Varejo · por unidade'}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
