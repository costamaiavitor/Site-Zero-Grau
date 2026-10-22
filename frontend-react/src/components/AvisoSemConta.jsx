export default function AvisoSemConta() {
  return (
    <section className="card zg-cartao zg-sem-conta mx-auto" aria-labelledby="tituloSemConta">
      <div className="card-body text-center p-4 p-md-5">
        <p className="zg-rotulo mb-2">Minha conta</p>
        <h1 id="tituloSemConta" className="zg-titulo h3 mb-3">Entre na loja para ver sua conta</h1>
        <p className="zg-suave mb-4">
          A sessão fica só nesta aba. Entre com seu e-mail e senha na loja e volte por lá.
        </p>
        <a className="btn btn-primary zg-btn" href="../index.html">Ir para a loja</a>
      </div>
    </section>
  );
}
