/* ==========================================================================
   ZERO GRAU · painel de administração

   Edita o que as duas lojas leem de js/dados.js: produtos, regras do varejo e
   regras do atacado. Nada aqui fala com servidor, porque não há um:

   - cada mudança válida vai para o rascunho (localStorage, via RASCUNHO de
     dados.js), e as lojas abertas NESTE navegador já o aplicam, com aviso;
   - "Publicar" gera um js/ajustes.js com o retrato inteiro. Com a chave do
     GitHub conectada (aba Publicação), grava esse arquivo direto no
     repositório pela API, e o GitHub Pages publica sozinho. Sem a chave,
     baixa o arquivo para subir à mão.

   Quando houver servidor, o ponto de troca é `publicar()`: em vez do GitHub,
   manda `estado` para ele. O resto do painel não muda.

   ⚠ O painel em si não tem senha; quem guarda a porta é a chave. Sem ela,
   quem abrir admin.html mexe só no próprio navegador. Com ela, publica — por
   isso a chave fica só no navegador de quem a colou, e há um botão para
   esquecê-la.
   ========================================================================== */

/* O que está no ar agora (base + ajustes publicados). O rascunho é medido
   contra isto: é o que diz quantas alterações existem e o que destacar. */
const PUBLICADO = estadoAtual();

/* O rascunho passa pelo mesmo filtro que as lojas usam, então o painel nunca
   mostra um estado que a loja recusaria. */
const rascunhoSalvo = RASCUNHO.ler();
aplicarAjustes(rascunhoSalvo);
let estado = estadoAtual();
/* estadoAtual() não conhece as fotos subidas e ainda não publicadas: elas
   voltam do rascunho, senão a próxima publicação citaria uma foto que nunca
   foi enviada */
estado.fotosNovas = {};
for(const [nome, f] of Object.entries(rascunhoSalvo?.fotosNovas || {}))
  if(/^[a-z0-9-]+$/.test(nome) && /^data:image\/webp;base64,/.test(f?.[400] || "") && /^data:image\/webp;base64,/.test(f?.[200] || ""))
    estado.fotosNovas[nome] = f;

/* Fotos que existem: as do catálogo como estava no ar. Produto novo começa
   sem foto e cai na silhueta da embalagem — subir foto nova é trabalho de
   repositório (ver README, "Imagens"). */
const FOTOS = [...new Set(PUBLICADO.bebidas.map(b => b.foto).filter(Boolean))].sort();
const fotosDisponiveis = () => [...new Set([...FOTOS, ...Object.keys(estado.fotosNovas || {})])].sort();
const srcFoto = f => estado.fotosNovas?.[f]?.[200] || `img/${f}-200.webp`;

const ROTULO_FORMA = {can: "Lata", bottle: "Long neck", tall: "Garrafa alta", pet: "PET", saco: "Saco"};

/* ---------- números em português ----------
   Campo de texto com inputmode, e não type=number: o number do navegador
   briga com a vírgula decimal e some com o que a pessoa digitou quando não
   entende. Aqui "1.200,50", "1200,5" e "8.90" dão o que se espera. */
function lerNumero(txt){
  let s = String(txt).trim().replace(/\s|R\$/g, "");
  if(s === "") return null;
  if(s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
const redondo = (v, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas;

const TIPO = {
  brl:    { mostrar: v => v == null ? "" : brl(v),
            ler: t => { const n = lerNumero(t); return n === null ? null : redondo(n) } },
  pct:    { mostrar: v => v == null ? "" : String(redondo(v * 100, 1)).replace(".", ","),
            ler: t => { const n = lerNumero(t); return n === null ? null : redondo(n / 100, 4) } },
  km:     { mostrar: v => v == null ? "" : String(v).replace(".", ","),
            ler: t => { const n = lerNumero(t); return n === null ? null : redondo(n, 1) } },
  int:    { mostrar: v => v == null ? "" : String(v),
            ler: t => { const n = lerNumero(t); return n === null ? null : n } },
  texto:  { mostrar: v => v ?? "", ler: t => t.trim() },
  codigo: { mostrar: v => v ?? "", ler: t => t.trim().toUpperCase() },
  /* WhatsApp: a pessoa digita o número; guarda-se o link wa.me */
  zap:    { mostrar: v => { const d = String(v || "").replace(/\D/g, "").replace(/^55/, "");
                           return d.length === 11 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
                                : d.length === 10 ? `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}` : d; },
            ler: t => { let d = t.replace(/\D/g, ""); if(d.length === 12 || d.length === 13) d = d.replace(/^55/, "");
                        return d.length === 10 || d.length === 11 ? `https://wa.me/55${d}` : (t.trim() ? NaN : null); } },
  link:   { mostrar: v => v === "#" ? "" : v ?? "", ler: t => t.trim() || "#" },
  pixchave: { mostrar: v => v ?? "", ler: t => { const c = t.trim(); return c ? (chavePix(c) || NaN) : ""; } }
};

/* ---------- regras de cada campo ----------
   Devolvem a mensagem do erro, ou "" quando está certo. Mensagem curta: ela
   aparece embaixo do campo, na largura de uma célula. */
const inteiro = v => Number.isInteger(v);
const CONFERE = {
  "varejo.minimo":         v => v === null || !(v >= 0) ? "Valor em reais, 0 ou mais." : "",
  "varejo.freteGratis":    v => v === null || !(v >= 0) ? "Valor em reais, 0 ou mais." : "",
  "varejo.taxaBase":       v => v === null || !(v >= 0) ? "Valor em reais, 0 ou mais." : "",
  "varejo.taxaKm":         v => v === null || !(v >= 0) ? "Valor em reais, 0 ou mais." : "",
  "varejo.raioMax":        v => v === null || !(v >= 0.5) || v > 200 ? "Entre 0,5 e 200 km." : "",
  "varejo.cupom.codigo":   v => !/^[A-Z0-9]{3,24}$/.test(v) ? "3 a 24 letras ou números, sem espaço." : "",
  "varejo.cupom.desconto": v => v === null || !(v >= 0.01) || v > 0.9 ? "Entre 1% e 90%." : "",
  "varejo.cupom.minimo":   v => v === null || !(v >= 0) ? "Valor em reais, 0 ou mais." : "",
  "atacado.desconto":      v => v === null || !(v >= 0) || v > 0.9 ? "Entre 0% e 90%." : "",
  "atacado.minimo":        v => v === null || !(v >= 0) ? "Valor em reais, 0 ou mais." : "",
  "atacado.freteGratis":   v => v === null || !(v >= 0) ? "Valor em reais, 0 ou mais." : "",
  "atacado.prazo":         v => !v ? "Escreva a condição de pagamento." : ""
};
Object.assign(CONFERE, {
  "contato.whatsapp": v => typeof v !== "string" ? "Número com DDD: (85) 98149-4445." : "",
  "contato.telefone": v => !v ? "Obrigatório." : "",
  "contato.email":    v => !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "E-mail incompleto." : "",
  "contato.cnpj":     v => !v ? "Obrigatório." : "",
  "contato.endereco": v => !v ? "Obrigatório." : "",
  "contato.bairro":   v => !v ? "Obrigatório." : "",
  "contato.instagram": v => v !== "#" && !/^https:\/\/\S+$/.test(v) ? "Link começando com https://, ou vazio." : "",
  "contato.facebook":  v => v !== "#" && !/^https:\/\/\S+$/.test(v) ? "Link começando com https://, ou vazio." : "",
  "pix.chave":  v => Number.isNaN(v) ? "Não é uma chave Pix: use CNPJ, CPF, e-mail, telefone com DDD ou chave aleatória." : "",
  "pix.nome":   v => !textoPix(v, 25) ? "Nome de quem recebe, até 25 letras." : v.length > 25 ? "Até 25 letras." : "",
  "pix.cidade": v => !textoPix(v, 15) ? "Cidade, até 15 letras." : v.length > 15 ? "Até 15 letras." : ""
});
for(const f of FORMAS) CONFERE[`caixaPadrao.${f}`] = v => v === null || !inteiro(v) || v < 1 ? "Número inteiro, 1 ou mais." : "";

/* Produto: campo a campo, com acesso à linha inteira (promoção depende do preço). */
const CONFERE_PRODUTO = {
  marca:   v => !v ? "Obrigatório." : "",
  nome:    v => !v ? "Obrigatório." : "",
  vol:     v => !v ? "Obrigatório." : "",
  teor:    v => !v ? "Use — se não tiver." : "",
  preco:   v => v === null || !(v >= 0.01) ? "Preço acima de zero." : "",
  promo:   (v, b) => v === null ? "" : !(v >= 0.01) ? "Acima de zero, ou vazio." : v >= b.preco ? "Menor que o preço." : "",
  estoque: v => v === null || !inteiro(v) || v < 0 ? "Inteiro, 0 ou mais." : "",
  caixa:   v => v === null ? "" : !inteiro(v) || v < 1 ? "Inteiro, ou vazio." : "",
  casco:   v => v === null ? "" : !(v >= 0.01) ? "Acima de zero, ou vazio." : ""
};

/* ---------- caminho dentro do estado ---------- */
const pegar = (obj, caminho) => caminho.split(".").reduce((o, k) => o?.[k], obj);
function por(obj, caminho, valor){
  const partes = caminho.split("."), ultima = partes.pop();
  partes.reduce((o, k) => o[k], obj)[ultima] = valor;
}

/* ---------- erros ----------
   Um mapa de chave → mensagem. Enquanto houver erro o rascunho não é salvo:
   o que está salvo é sempre algo que a loja consegue mostrar. */
const erros = new Map();

function marcar(campo, chave, msg){
  const caixa = campo.closest(".adm-campo, td, .adm-dia");
  let aviso = caixa?.querySelector(".adm-erro");
  if(msg){
    erros.set(chave, msg);
    campo.setAttribute("aria-invalid", "true");
    if(caixa && !aviso){
      aviso = document.createElement("span");
      aviso.className = "adm-erro";
      aviso.id = "erro-" + chave.replace(/[^\w-]/g, "_");
      caixa.append(aviso);
      campo.setAttribute("aria-describedby", aviso.id);
    }
    if(aviso) aviso.textContent = msg;
  }else{
    erros.delete(chave);
    campo.removeAttribute("aria-invalid");
    campo.removeAttribute("aria-describedby");
    aviso?.remove();
  }
}

/* ---------- produtos ---------- */
const linhas = $("linhasProdutos");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const caixaPropria = b => estado.caixaExcecao[b.sku] ?? null;

function opcoes(lista, atual){
  return lista.map(([v, t]) => `<option value="${esc(v)}"${v === atual ? " selected" : ""}>${esc(t)}</option>`).join("");
}

function linhaHTML(b){
  const rot = `${b.marca} ${b.nome}`.trim() || "produto novo";
  const txt = (campo, valor, cls = "") =>
    `<input class="${cls}" data-campo="${campo}" value="${esc(valor)}" aria-label="${esc(rot)} — ${campo}">`;
  const num = (campo, valor, tipo) =>
    `<input class="n" data-campo="${campo}" data-tipo="${tipo}" inputmode="${tipo === "int" ? "numeric" : "decimal"}"
       value="${esc(TIPO[tipo].mostrar(valor))}" aria-label="${esc(rot)} — ${campo}">`;
  const marca = (campo, valor) =>
    `<input type="checkbox" data-campo="${campo}"${valor ? " checked" : ""} aria-label="${esc(rot)} — ${campo}">`;
  return `
  <tr data-sku="${esc(b.sku)}">
    <td class="fixa">
      ${txt("marca", b.marca, "marca")}
      ${txt("nome", b.nome)}
    </td>
    <td><select data-campo="cat" aria-label="${esc(rot)} — categoria">${opcoes(CATEGORIAS.map(c => [c.id, c.nome]), b.cat)}</select></td>
    <td>${txt("vol", b.vol, "curto")}</td>
    <td>${txt("teor", b.teor, "curto")}</td>
    <td><select data-campo="forma" aria-label="${esc(rot)} — embalagem">${opcoes(FORMAS.map(f => [f, ROTULO_FORMA[f]]), b.forma)}</select></td>
    <td class="adm-foto">
      ${b.foto ? `<img class="adm-thumb" src="${esc(srcFoto(b.foto))}" alt="">` : ""}
      <select data-campo="foto" aria-label="${esc(rot)} — foto">${opcoes([["", "sem foto"], ...fotosDisponiveis().map(f => [f, estado.fotosNovas?.[f] ? f + " (nova)" : f])], b.foto || "")}</select>
      <button type="button" class="adm-foto-btn" data-acao="foto" aria-label="Subir foto de ${esc(rot)}">Subir foto</button>
    </td>
    <td>${num("preco", b.preco, "brl")}</td>
    <td>${num("promo", b.promo, "brl")}</td>
    <td>${num("estoque", b.estoque, "int")}</td>
    <td>${num("caixa", caixaPropria(b), "int")}</td>
    <td>${num("casco", b.retornavel ? b.casco : null, "brl")}</td>
    <td class="c">${marca("gelada", b.gelada)}</td>
    <td class="c">${marca("alcoolica", b.alcoolica)}</td>
    <td class="n calc" data-calc></td>
    <td class="c"><button type="button" class="adm-tirar" data-acao="tirar" aria-label="Remover ${esc(rot)}">Remover</button></td>
  </tr>`;
}

/* O que a coluna Atacado mostra: preço por unidade e por caixa, já com o
   desconto de revenda do rascunho. É a resposta para "se eu mudar isto, quanto
   o revendedor paga?" sem precisar abrir a outra loja. */
function calcular(tr){
  const b = estado.bebidas.find(x => x.sku === tr.dataset.sku);
  const cel = tr.querySelector("[data-calc]");
  if(!b || !(b.preco > 0)){ cel.textContent = "—"; return; }
  const un = b.preco * (1 - estado.atacado.desconto);
  const cx = caixaPropria(b) ?? estado.caixaPadrao[b.forma] ?? 12;
  cel.innerHTML = `R$ ${brl(un)}<small>cx ${cx} · R$ ${brl(un * cx)}</small>`;
}

function desenharProdutos(){
  linhas.innerHTML = estado.bebidas.map(linhaHTML).join("");
  for(const tr of linhas.rows) calcular(tr);
  filtrar();
  $("contaProdutos").textContent = `· ${estado.bebidas.length}`;
}

function filtrar(){
  const q = semAcento($("busca").value.trim());
  for(const tr of linhas.rows){
    const b = estado.bebidas.find(x => x.sku === tr.dataset.sku);
    tr.hidden = !!q && !semAcento(`${b.marca} ${b.nome} ${b.vol}`).includes(q);
  }
}
$("busca").addEventListener("input", filtrar);

linhas.addEventListener("input", e => editarProduto(e.target));
linhas.addEventListener("change", e => { if(e.target.matches("select, [type=checkbox]")) editarProduto(e.target) });

function editarProduto(campo){
  const tr = campo.closest("tr"), nomeCampo = campo.dataset.campo;
  if(!tr || !nomeCampo) return;
  const b = estado.bebidas.find(x => x.sku === tr.dataset.sku);
  const chave = `${b.sku}.${nomeCampo}`;

  if(campo.type === "checkbox") b[nomeCampo] = campo.checked;
  else if(campo.tagName === "SELECT") b[nomeCampo] = campo.value;
  else{
    const tipo = campo.dataset.tipo;
    const v = tipo ? TIPO[tipo].ler(campo.value) : campo.value.trim();
    const msg = CONFERE_PRODUTO[nomeCampo]?.(v, b) || "";
    marcar(campo, chave, msg);
    if(!msg){
      if(nomeCampo === "caixa"){
        if(v === null) delete estado.caixaExcecao[b.sku]; else estado.caixaExcecao[b.sku] = v;
      }else if(nomeCampo === "casco"){
        b.retornavel = v !== null;
        if(v === null) delete b.casco; else b.casco = v;
      }else b[nomeCampo] = v;
    }
    /* mudar o preço pode consertar ou quebrar a promoção da mesma linha */
    if(nomeCampo === "preco"){
      const promo = tr.querySelector('[data-campo="promo"]');
      const pv = TIPO.brl.ler(promo.value);
      const pm = CONFERE_PRODUTO.promo(pv, b);
      marcar(promo, `${b.sku}.promo`, pm);
      if(!pm) b.promo = pv;
    }
  }
  calcular(tr);
  mudou();
}

linhas.addEventListener("click", e => {
  const btn = e.target.closest('[data-acao="tirar"]');
  if(!btn) return;
  const tr = btn.closest("tr");
  const b = estado.bebidas.find(x => x.sku === tr.dataset.sku);
  if(estado.bebidas.length === 1){ toast("A loja precisa de ao menos um produto."); return; }
  if(!confirm(`Remover ${b.marca} ${b.nome} das duas lojas?`)) return;
  estado.bebidas = estado.bebidas.filter(x => x !== b);
  delete estado.caixaExcecao[b.sku];
  for(const k of [...erros.keys()]) if(k.startsWith(b.sku + ".")) erros.delete(k);
  tr.remove();
  $("contaProdutos").textContent = `· ${estado.bebidas.length}`;
  mudou();
  toast(`${b.marca} ${b.nome} removido do rascunho`);
});

$("novoProduto").addEventListener("click", () => {
  /* O sku é a chave do carrinho, então nasce uma vez e não muda mais — nem
     quando o nome for corrigido. */
  const sku = "novo-" + Date.now().toString(36);
  const novo = {sku, marca: "", nome: "", cat: CATEGORIAS[0].id, foto: "", forma: "can",
                vol: "", teor: "—", preco: null, promo: null, gelada: true,
                retornavel: false, alcoolica: true, estoque: 0};
  estado.bebidas.push(novo);
  linhas.insertAdjacentHTML("beforeend", linhaHTML(novo));
  const tr = linhas.rows[linhas.rows.length - 1];
  calcular(tr);
  $("busca").value = ""; filtrar();
  $("contaProdutos").textContent = `· ${estado.bebidas.length}`;
  /* os obrigatórios já nascem marcados: produto pela metade não vai para a loja */
  for(const c of ["marca", "nome", "vol", "preco"]){
    const campo = tr.querySelector(`[data-campo="${c}"]`);
    marcar(campo, `${sku}.${c}`, CONFERE_PRODUTO[c](c === "preco" ? null : ""));
  }
  mudou();
  tr.querySelector('[data-campo="marca"]').focus();
  tr.scrollIntoView({block: "nearest"});
});

/* ---------- regras (varejo e atacado) ---------- */
function desenharRegras(){
  for(const campo of document.querySelectorAll("input[data-regra]")){
    campo.value = TIPO[campo.dataset.tipo].mostrar(pegar(estado, campo.dataset.regra));
    marcar(campo, campo.dataset.regra, "");
  }
  desenharFaixas();
}

document.addEventListener("input", e => {
  const campo = e.target;
  if(!campo.matches("input[data-regra]")) return;
  const chave = campo.dataset.regra;
  const v = TIPO[campo.dataset.tipo].ler(campo.value);
  const msg = CONFERE[chave]?.(v) || "";
  marcar(campo, chave, msg);
  if(!msg) por(estado, chave, v);
  /* o desconto de revenda muda a coluna Atacado de todos os produtos */
  if(chave === "atacado.desconto" || chave.startsWith("caixaPadrao.")) for(const tr of linhas.rows) calcular(tr);
  mudou();
});

/* faixas de volume: lista curta de pares caixas → desconto extra */
function desenharFaixas(){
  $("faixas").innerHTML = estado.atacado.faixas.map((f, i) => `
    <div class="adm-faixa" data-i="${i}">
      <label class="adm-campo"><span>A partir de (caixas)</span>
        <input data-faixa="cx" inputmode="numeric" value="${f.cx}"></label>
      <label class="adm-campo"><span>Desconto extra (%)</span>
        <input data-faixa="extra" inputmode="decimal" value="${TIPO.pct.mostrar(f.extra)}"></label>
      <button type="button" class="adm-tirar" data-acao="tirar-faixa" aria-label="Remover a faixa de ${f.cx} caixas">Remover</button>
    </div>`).join("") || `<p class="adm-dica">Sem faixas: o atacado cobra só o desconto de revenda.</p>`;
}

$("faixas").addEventListener("input", e => {
  const campo = e.target, i = +campo.closest(".adm-faixa").dataset.i, qual = campo.dataset.faixa;
  const f = estado.atacado.faixas[i];
  const chave = `faixa.${i}.${qual}`;
  if(qual === "cx"){
    const v = TIPO.int.ler(campo.value);
    const repetida = estado.atacado.faixas.some((o, j) => j !== i && o.cx === v);
    const msg = v === null || !inteiro(v) || v < 1 ? "Inteiro, 1 ou mais." : repetida ? "Já existe uma faixa com esse número." : "";
    marcar(campo, chave, msg);
    if(!msg) f.cx = v;
  }else{
    const v = TIPO.pct.ler(campo.value);
    const msg = v === null || !(v > 0) || v > 0.5 ? "Entre 0,1% e 50%." : "";
    marcar(campo, chave, msg);
    if(!msg) f.extra = v;
  }
  mudou();
});
$("faixas").addEventListener("click", e => {
  if(!e.target.closest('[data-acao="tirar-faixa"]')) return;
  const i = +e.target.closest(".adm-faixa").dataset.i;
  estado.atacado.faixas.splice(i, 1);
  for(const k of [...erros.keys()]) if(k.startsWith("faixa.")) erros.delete(k);
  desenharFaixas(); mudou();
});
$("novaFaixa").addEventListener("click", () => {
  const maior = Math.max(0, ...estado.atacado.faixas.map(f => f.cx));
  estado.atacado.faixas.push({cx: maior + 10, extra: 0.01});
  desenharFaixas(); mudou();
  $("faixas").lastElementChild.querySelector("input").focus();
});

/* ---------- foto de produto ----------
   A mesma régua de ferramentas/padroniza-fotos.py e confere-fotos.py, aqui no
   navegador: fundo transparente obrigatório, véu do recorte limpo (alfa até
   16), apara pelo contorno visível (alfa acima de 64), mestre de 600 px com 2%
   de folga, e WebP de 400 e 200 px. Depois mede o que o confere mede —
   inclinação, contorno serrilhado, lata em trapézio — e recusa o que não
   passa, dizendo por quê. Foto sem fundo transparente não entra: recortar é
   trabalho do Photoshop, e a estante só é uniforme se todas chegarem assim. */
const fotoArquivo = $("fotoArquivo");
let fotoAlvo = null, fotoPronta = null;

linhas.addEventListener("click", e => {
  const b = e.target.closest('[data-acao="foto"]');
  if(!b) return;
  fotoAlvo = b.closest("tr").dataset.sku;
  fotoArquivo.value = "";
  fotoArquivo.click();
});

function canvasDe(w, h){ const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

function medirFoto(cv, forma){
  const {width: W, height: H} = cv;
  const px = cv.getContext("2d").getImageData(0, 0, W, H).data;
  const a = (x, y) => px[(y * W + x) * 4 + 3] > 128;
  const L = [], R = [];
  for(let y = 0; y < H; y++){
    let l = -1, r = -1;
    for(let x = 0; x < W; x++) if(a(x, y)){ if(l < 0) l = x; r = x; }
    L.push(l < 0 ? NaN : l); R.push(r < 0 ? NaN : r);
  }
  const problemas = [];
  const i0 = Math.floor(H * .4), i1 = Math.floor(H * .9);
  let degraus = 0;
  for(let y = i0 + 2; y < i1; y++){
    for(const E of [L, R]){
      const d2 = E[y] - 2 * E[y - 1] + E[y - 2];
      if(Math.abs(d2) > 2) degraus++;
    }
  }
  if(degraus > 0) problemas.push(`Contorno serrilhado (${degraus} degraus): o recorte mordeu o produto.`);
  const ys = [], cs = [];
  L.forEach((l, y) => { if(!Number.isNaN(l)){ ys.push(y); cs.push((l + R[y]) / 2); } });
  const n = ys.length, my = ys.reduce((s, v) => s + v, 0) / n, mc = cs.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for(let i = 0; i < n; i++){ num += (ys[i] - my) * (cs[i] - mc); den += (ys[i] - my) ** 2; }
  const eixo = den ? num / den * n : 0;
  if(Math.abs(eixo) > 4) problemas.push(`Produto inclinado (${eixo.toFixed(1)} px): a foto precisa estar em pé e de frente.`);
  if(forma === "can"){
    const larg = (a0, a1) => { const v = []; for(let y = Math.floor(H * a0); y < Math.floor(H * a1); y++) if(!Number.isNaN(L[y])) v.push(R[y] - L[y]); v.sort((x, y) => x - y); return v[v.length >> 1]; };
    const razao = larg(.45, .5) / larg(.85, .9);
    if(!(razao >= .98 && razao <= 1.02)) problemas.push(`Lata em trapézio (razão ${razao.toFixed(3)}): foto de lente grande-angular ou de cima.`);
  }
  return problemas;
}

async function processarFoto(arquivo, forma){
  const problemas = [];
  let bmp;
  try{ bmp = await createImageBitmap(arquivo); }
  catch{ return {problemas: ["Não deu para abrir esse arquivo como imagem. Use PNG com fundo transparente."]}; }
  const src = canvasDe(bmp.width, bmp.height), g = src.getContext("2d");
  g.drawImage(bmp, 0, 0);
  const dados = g.getImageData(0, 0, src.width, src.height), px = dados.data;
  let transparentes = 0, x0 = src.width, y0 = src.height, x1 = -1, y1 = -1;
  for(let i = 0, n = px.length / 4; i < n; i++){
    if(px[i * 4 + 3] <= 16){ px[i * 4 + 3] = 0; transparentes++; }
    if(px[i * 4 + 3] > 64){
      const x = i % src.width, y = (i / src.width) | 0;
      if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y;
    }
  }
  if(transparentes / (px.length / 4) < 0.02)
    return {problemas: ["A foto não tem fundo transparente. Recorte o produto (Photoshop, remove.bg) e salve em PNG."]};
  if(x1 < 0) return {problemas: ["Não há produto visível nessa imagem."]};
  g.putImageData(dados, 0, 0);
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  if(bh < 400) problemas.push(`Foto pequena demais: o produto tem ${bh} px de altura e precisa de pelo menos 400.`);

  /* mestre: 600 px de produto + 2% de folga, como no padroniza-fotos.py */
  const ALT = 600, FOLGA = Math.round(ALT * 0.02), largura = Math.max(1, Math.round(bw * ALT / bh));
  const mestre = canvasDe(largura + 2 * FOLGA, ALT + 2 * FOLGA), gm = mestre.getContext("2d");
  gm.imageSmoothingQuality = "high";
  gm.drawImage(src, x0, y0, bw, bh, FOLGA, FOLGA, largura, ALT);
  const saida = h => { const w = Math.round(mestre.width * h / mestre.height), c = canvasDe(w, h), gc = c.getContext("2d");
                       gc.imageSmoothingQuality = "high"; gc.drawImage(mestre, 0, 0, w, h); return c; };
  const c400 = saida(400), c200 = saida(200);
  problemas.push(...medirFoto(c400, forma));
  const d400 = c400.toDataURL("image/webp", 0.82), d200 = c200.toDataURL("image/webp", 0.82);
  if(!d400.startsWith("data:image/webp"))
    problemas.push("Este navegador não gera WebP. Suba a foto pelo Chrome ou pelo Edge.");
  return {problemas, d400, d200};
}

fotoArquivo.addEventListener("change", async () => {
  const arquivo = fotoArquivo.files[0];
  const b = estado.bebidas.find(x => x.sku === fotoAlvo);
  if(!arquivo || !b) return;
  $("fotoTitulo").textContent = `Foto de ${b.marca || "produto novo"} ${b.nome}`.trim();
  $("fotoResultado").innerHTML = "Processando…";
  $("fotoPrevia").innerHTML = "";
  $("fotoUsar").disabled = true;
  $("dlgFoto").showModal();
  const r = await processarFoto(arquivo, b.forma);
  fotoPronta = r.problemas.length ? null : r;
  if(r.d400) $("fotoPrevia").innerHTML = `<img src="${r.d400}" alt="Prévia sobre fundo escuro"><img src="${r.d400}" alt="Prévia sobre fundo claro">`;
  $("fotoResultado").className = "adm-foto-res " + (r.problemas.length ? "bad" : "ok");
  $("fotoResultado").innerHTML = r.problemas.length
    ? `<b>Não entra no padrão:</b><ul>${r.problemas.map(p => `<li>${esc(p)}</li>`).join("")}</ul>`
    : "<b>No padrão.</b> Altura, folga e contorno iguais aos das outras fotos.";
  $("fotoUsar").disabled = !fotoPronta;
});

$("fotoUsar").addEventListener("click", () => {
  const b = estado.bebidas.find(x => x.sku === fotoAlvo);
  if(!b || !fotoPronta) return;
  const base = semAcento(`${b.marca} ${b.nome}`).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "produto";
  const nome = `${base}-${Date.now().toString(36)}`;
  estado.fotosNovas = {...(estado.fotosNovas || {}), [nome]: {200: fotoPronta.d200, 400: fotoPronta.d400}};
  b.foto = nome;
  $("dlgFoto").close();
  desenharProdutos();
  mudou();
  toast("Foto no rascunho. Ela vai para o site junto com a próxima publicação.");
});

/* ---------- histórico de publicações ----------
   Cada publicação do painel é um commit do ajustes.js no GitHub, então o
   histórico é a lista desses commits. "Abrir no rascunho" traz a versão de
   volta para o painel — não publica nada: o dono confere e publica. */
function decodificar64(b64){
  const bin = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}
function ajustesDoTexto(texto){
  const m = texto.match(/const AJUSTES_PUBLICADOS = ([\s\S]*?);\s*$/);
  if(!m) throw new Error("formato");
  return JSON.parse(m[1]);
}

$("histCarregar").addEventListener("click", async () => {
  const msg = $("histMsg"), lista = $("histLista");
  msg.className = "adm-gh-msg"; msg.textContent = "Carregando…";
  $("histCarregar").disabled = true;
  try{
    const r = await gh(`/commits?path=${encodeURIComponent(GITHUB.caminho)}&sha=${GITHUB.ramo}&per_page=15`);
    if(!r.ok) throw new Error(explicarGH(r.status));
    const commits = await r.json();
    lista.innerHTML = commits.map(c => {
      const quando = new Date(c.commit.author.date).toLocaleString("pt-BR", {dateStyle: "short", timeStyle: "short"});
      return `<li><div><b>${esc(quando)}</b> · ${esc(c.commit.message.split("\n")[0])}<small>${esc(c.author?.login || c.commit.author.name)} · ${c.sha.slice(0, 7)}</small></div>
        <button type="button" class="btn btn-ghost adm-mini" data-versao="${c.sha}" data-quando="${esc(quando)}">Abrir no rascunho</button></li>`;
    }).join("") + `<li><div><b>Versão original</b> · o catálogo como está no dados.js, sem nada publicado pelo painel</div>
        <button type="button" class="btn btn-ghost adm-mini" data-versao="base" data-quando="original">Abrir no rascunho</button></li>`;
    msg.textContent = commits.length ? "" : "Nenhuma publicação pelo painel ainda.";
  }catch(e){
    msg.className = "adm-gh-msg bad";
    msg.textContent = e instanceof TypeError ? "Sem conexão com o GitHub." : e.message;
  }finally{
    $("histCarregar").disabled = false;
  }
});

$("histLista").addEventListener("click", async e => {
  const b = e.target.closest("[data-versao]");
  if(!b) return;
  if(diferencas() && !confirm("Isto troca o rascunho atual pela versão escolhida. Continuar?")) return;
  let versao;
  try{
    if(b.dataset.versao === "base") versao = ESTADO_BASE;
    else{
      const r = await gh(`/contents/${GITHUB.caminho}?ref=${b.dataset.versao}`);
      if(!r.ok) throw new Error(explicarGH(r.status));
      versao = ajustesDoTexto(decodificar64((await r.json()).content)) || ESTADO_BASE;
    }
  }catch(err){
    $("histMsg").className = "adm-gh-msg bad";
    $("histMsg").textContent = err.message === "formato" ? "Essa versão do arquivo não foi gerada pelo painel e não dá para abrir." : err.message;
    return;
  }
  /* parte do publicado e aplica a versão por cima: campo que a versão antiga
     não tinha (o painel cresceu depois) fica como está no ar */
  aplicarAjustes(PUBLICADO);
  aplicarAjustes(versao);
  estado = estadoAtual();
  estado.fotosNovas = {};
  erros.clear();
  desenharTudo();
  toast(`Versão ${b.dataset.quando} aberta no rascunho. Confira e publique.`);
});

/* ---------- horário ----------
   Uma linha por dia: fechado, ou abre/fecha em campos de hora do próprio
   navegador (o relógio do celular aparece sozinho). */
const DIAS_ORDEM = [1, 2, 3, 4, 5, 6, 0];
function desenharHorario(){
  $("horario").innerHTML = DIAS_ORDEM.map(i => {
    const d = estado.horario.dias[i];
    const nome = DIAS_NOME[i][0].toUpperCase() + DIAS_NOME[i].slice(1);
    return `<div class="adm-dia" data-dia="${i}">
      <span class="adm-dia-nome">${nome}</span>
      <label class="adm-dia-fechado"><input type="checkbox" data-h="fechado"${d ? "" : " checked"}> Fechado</label>
      <label><span class="so-leitor">${nome}, abre</span><input type="time" data-h="abre" value="${d ? d[0] : "10:00"}"${d ? "" : " disabled"}></label>
      <span aria-hidden="true">→</span>
      <label><span class="so-leitor">${nome}, fecha</span><input type="time" data-h="fecha" value="${d ? d[1] : "03:00"}"${d ? "" : " disabled"}></label>
    </div>`;
  }).join("");
}
$("horario").addEventListener("input", e => {
  const linha = e.target.closest(".adm-dia"); if(!linha) return;
  const i = +linha.dataset.dia;
  const fechado = linha.querySelector('[data-h="fechado"]').checked;
  const abre = linha.querySelector('[data-h="abre"]'), fecha = linha.querySelector('[data-h="fecha"]');
  abre.disabled = fecha.disabled = fechado;
  const ok = fechado || (HORA_OK.test(abre.value) && HORA_OK.test(fecha.value));
  marcar(fecha, `horario.${i}`, ok ? "" : "Hora inválida.");
  if(ok) estado.horario.dias[i] = fechado ? null : [abre.value, fecha.value];
  mudou();
});

/* ---------- estatística ---------- */
function desenharEstatistica(){
  $("estTipo").value = estado.estatistica.tipo;
  $("estId").value = estado.estatistica.id;
  pintarEstatistica();
}
function pintarEstatistica(){
  const tipo = $("estTipo").value;
  $("estIdCampo").hidden = !tipo;
  $("estIdRotulo").textContent = tipo === "ga4" ? "ID de medição (G-XXXXXXX)" : "Domínio cadastrado no Plausible";
  $("estId").placeholder = tipo === "ga4" ? "G-ABC123XYZ" : "costamaiavitor.github.io";
}
function lerEstatistica(){
  const tipo = $("estTipo").value, id = $("estId").value.trim();
  const msg = !tipo ? "" : tipo === "ga4" ? (/^G-[A-Z0-9]{4,14}$/.test(id) ? "" : "O ID do GA4 começa com G-.")
            : (/^[a-z0-9.-]{3,120}$/.test(id) ? "" : "Só o domínio, sem https://.");
  marcar($("estId"), "estatistica", msg);
  if(!msg) estado.estatistica = tipo ? {tipo, id} : {tipo: "", id: ""};
  pintarEstatistica();
  mudou();
}
$("estTipo").addEventListener("change", lerEstatistica);
$("estId").addEventListener("input", lerEstatistica);

/* ---------- o que mudou ----------
   Conta campo a campo contra o publicado e pinta o que está diferente, para o
   dono ver de relance o que vai para o ar. */
const CAMPOS_PRODUTO = ["marca", "nome", "cat", "vol", "teor", "forma", "foto", "preco", "promo",
                        "estoque", "gelada", "alcoolica", "casco"];

function diferencas(){
  let n = 0;
  const antes = new Map(PUBLICADO.bebidas.map(b => [b.sku, b]));
  const agora = new Set(estado.bebidas.map(b => b.sku));
  for(const b of estado.bebidas){
    const a = antes.get(b.sku);
    const tr = linhas.querySelector(`tr[data-sku="${CSS.escape(b.sku)}"]`);
    tr?.classList.toggle("nova", !a);
    if(!a){ n++; continue; }
    for(const c of [...CAMPOS_PRODUTO, "caixa"]){
      const va = c === "caixa" ? PUBLICADO.caixaExcecao[b.sku] ?? null : c === "casco" ? (a.retornavel ? a.casco : null) : a[c] ?? null;
      const vb = c === "caixa" ? estado.caixaExcecao[b.sku] ?? null : c === "casco" ? (b.retornavel ? b.casco : null) : b[c] ?? null;
      const diferente = va !== vb;
      if(diferente) n++;
      tr?.querySelector(`[data-campo="${c}"]`)?.classList.toggle("mudou", diferente);
    }
  }
  for(const sku of antes.keys()) if(!agora.has(sku)) n++;

  for(const campo of document.querySelectorAll("input[data-regra]")){
    const diferente = pegar(estado, campo.dataset.regra) !== pegar(PUBLICADO, campo.dataset.regra);
    campo.classList.toggle("mudou", diferente);
    if(diferente) n++;
  }
  if(JSON.stringify(estado.atacado.faixas) !== JSON.stringify(PUBLICADO.atacado.faixas)) n++;
  for(const i of DIAS_ORDEM){
    const dif = JSON.stringify(estado.horario.dias[i]) !== JSON.stringify(PUBLICADO.horario.dias[i]);
    document.querySelector(`.adm-dia[data-dia="${i}"]`)?.classList.toggle("mudou", dif);
    if(dif) n++;
  }
  const difEst = JSON.stringify(estado.estatistica) !== JSON.stringify(PUBLICADO.estatistica);
  $("estTipo").classList.toggle("mudou", difEst);
  if(difEst) n++;
  return n;
}

function avisoEstado(tipo, texto){
  $("estado").className = "adm-estado" + (tipo ? " " + tipo : "");
  $("estado").textContent = texto;
}

let salvarTimer;
function mudou(){
  const n = diferencas();
  const enviado = ENVIADO.ler();
  const jaFoi = !!n && !erros.size && enviado?.retrato === canonico(retrato(estado));
  if(erros.size){
    avisoEstado("bad", `${erros.size} ${erros.size === 1 ? "campo com erro" : "campos com erro"} · rascunho não salvo até corrigir`);
  }else if(jaFoi){
    const hora = new Date(enviado.em).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"});
    avisoEstado("ok", `Publicado às ${hora} · o site se atualiza em um ou dois minutos`);
  }else if(n){
    avisoEstado("mudou", `Rascunho · ${n} ${n === 1 ? "alteração" : "alterações"} · só neste navegador`);
  }else{
    avisoEstado("", "Sem alterações · igual ao que está no ar");
  }
  $("publicar").disabled = publicando || !!erros.size || !n || jaFoi;
  $("descartar").disabled = !n && !erros.size;

  clearTimeout(salvarTimer);
  if(erros.size) return;
  salvarTimer = setTimeout(() => {
    /* sem alteração não há rascunho: a loja sai do modo prévia sozinha */
    if(n){
      estado.atacado.faixas.sort((x, y) => x.cx - y.cx);
      for(const f of Object.keys(estado.fotosNovas || {}))
        if(!estado.bebidas.some(b => b.foto === f)) delete estado.fotosNovas[f];
      if(!RASCUNHO.gravar(estado)) toast("O navegador não deixou salvar o rascunho.");
    }else RASCUNHO.limpar();
  }, 250);
}

/* ---------- descartar e publicar ---------- */
$("descartar").addEventListener("click", () => {
  if(!confirm("Descartar o rascunho e voltar ao que está no ar?")) return;
  RASCUNHO.limpar();
  estado = structuredClone(PUBLICADO);
  erros.clear();
  desenharTudo();
  toast("Rascunho descartado");
});

/* O retrato que vai para o ar: produtos passados pelo mesmo filtro que as
   lojas usam e faixas em ordem, para que "o que foi enviado" e "o que está no
   ar" possam ser comparados sem depender de ordem de chave. */
function retrato(e){
  const {fotosNovas, ...resto} = e;
  return {...structuredClone(resto),
          bebidas: e.bebidas.map(produtoDe).filter(Boolean),
          atacado: {...structuredClone(resto.atacado), faixas: [...resto.atacado.faixas].sort((x, y) => x.cx - y.cx)}};
}
/* JSON com chaves em ordem: dois retratos iguais dão o mesmo texto */
function canonico(v){
  if(Array.isArray(v)) return `[${v.map(canonico).join(",")}]`;
  if(v && typeof v === "object")
    return `{${Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonico(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}

function arquivoAjustes(){
  const quando = new Date().toLocaleString("pt-BR", {dateStyle: "short", timeStyle: "short"});
  return `/* ==========================================================================
   ZERO GRAU · ajustes publicados

   Gerado pelo painel (admin.html) em ${quando}. Não edite à mão: publique
   pelo painel, ou troque este arquivo pelo que ele baixar.

   É o retrato inteiro do que o painel edita — produtos, regras do varejo e
   do atacado — e substitui esses trechos de js/dados.js.
   ========================================================================== */
const AJUSTES_PUBLICADOS = ${JSON.stringify(retrato(estado), null, 2)};
`;
}

function baixar(texto){
  const blob = new Blob([texto], {type: "text/javascript"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ajustes.js";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- publicação direta no GitHub ----------
   A API de conteúdo do GitHub aceita chamada do navegador (CORS liberado) e
   grava um arquivo com um PUT: conteúdo em base64 e o `sha` da versão que
   está lá, que é a trava contra sobrescrever o trabalho de outra pessoa. O
   commit na main dispara o workflow do Pages, e o site se atualiza sozinho. */
const GITHUB = {dono: "costamaiavitor", repo: "Site-Zero-Grau", ramo: "main", caminho: "ZeroGrau/js/ajustes.js"};
const API_GH = `https://api.github.com/repos/${GITHUB.dono}/${GITHUB.repo}`;

const CHAVE_GH = {
  ler(){ try{ return localStorage.getItem("zg-admin-github") || "" }catch{ return "" } },
  gravar(v){ try{ localStorage.setItem("zg-admin-github", v); return true }catch{ return false } },
  limpar(){ try{ localStorage.removeItem("zg-admin-github") }catch{} }
};

/* O que foi enviado e ainda não apareceu no ar. Serve para o painel dizer
   "enviado, aguardando o site" em vez de continuar contando alterações que
   já saíram. Some sozinho quando o publicado alcança o envio. */
const ENVIADO = {
  ler(){ try{ return JSON.parse(localStorage.getItem("zg-admin-enviado") || "null") }catch{ return null } },
  gravar(v){ try{ localStorage.setItem("zg-admin-enviado", JSON.stringify(v)) }catch{} },
  limpar(){ try{ localStorage.removeItem("zg-admin-enviado") }catch{} }
};
if(ENVIADO.ler()?.retrato === canonico(retrato(PUBLICADO))) ENVIADO.limpar();

function gh(caminho, {metodo = "GET", corpo, chave = CHAVE_GH.ler()} = {}){
  return fetch(API_GH + caminho, {
    method: metodo,
    headers: {
      "Accept": "application/vnd.github+json",
      ...(chave ? {"Authorization": `Bearer ${chave}`} : {}),
      "X-GitHub-Api-Version": "2022-11-28",
      ...(corpo ? {"Content-Type": "application/json"} : {})
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: "no-store"
  });
}

/* O que cada recusa quer dizer, em português de quem vai resolver. O GitHub
   responde 404 (e não 403) a quem não tem acesso a repositório privado, então
   os dois viram a mesma explicação. */
function explicarGH(status){
  if(status === 401) return "O GitHub recusou a chave: confira se foi colada inteira, ou se venceu.";
  if(status === 403 || status === 404)
    return `A chave não tem permissão para gravar em ${GITHUB.repo}. Confira o repositório escolhido e "Contents: Read and write".`;
  if(status === 409 || status === 422) return "O arquivo mudou no GitHub enquanto você publicava. Tente de novo.";
  return `O GitHub respondeu com erro ${status}. Tente de novo em instantes.`;
}

function base64(texto){
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  for(let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function gravarNoGitHub(texto, alteracoes){
  const n = alteracoes;
  return gravarArquivo(GITHUB.caminho, base64(texto),
    `Painel: publica ${n} ${n === 1 ? "alteração" : "alterações"} no catálogo`);
}

/* Grava um arquivo qualquer do repositório; `conteudo` já em base64. */
async function gravarArquivo(caminho, conteudo, mensagem){
  const url = `/contents/${caminho}`;
  /* Duas voltas: se alguém gravou o arquivo entre a leitura do sha e o PUT,
     o GitHub recusa com 409, e a segunda volta relê o sha e tenta de novo. */
  for(let volta = 0; volta < 2; volta++){
    const atual = await gh(`${url}?ref=${GITHUB.ramo}`);
    if(!atual.ok && atual.status !== 404) throw new Error(explicarGH(atual.status));
    const sha = atual.ok ? (await atual.json()).sha : undefined;
    const r = await gh(url, {metodo: "PUT", corpo: {
      message: mensagem,
      content: conteudo,
      branch: GITHUB.ramo,
      ...(sha ? {sha} : {})
    }});
    if(r.ok) return (await r.json()).commit;
    if((r.status === 409 || r.status === 422) && volta === 0) continue;
    throw new Error(explicarGH(r.status));
  }
}

let publicando = false;
async function publicar(){
  const texto = arquivoAjustes();
  if(!CHAVE_GH.ler()){ $("dlgSemChave").showModal(); return; }
  const n = diferencas();
  /* trava: nenhum ajustes.js vai ao ar citando foto que não está no site nem
     no pacote a enviar — seria imagem quebrada para todo cliente */
  const semArquivo = estado.bebidas.filter(b => b.foto && !FOTOS.includes(b.foto) && !estado.fotosNovas?.[b.foto]);
  if(semArquivo.length){
    avisoEstado("bad", `Não publicou: a foto de ${semArquivo.map(b => b.marca).join(", ")} não está disponível. Suba de novo ou escolha outra.`);
    return;
  }
  if(!confirm(`Publicar ${n} ${n === 1 ? "alteração" : "alterações"} no site, para todos os clientes?`)) return;

  publicando = true;
  $("publicar").disabled = true;
  $("publicar").textContent = "Publicando…";
  try{
    /* fotos primeiro: o ajustes.js nunca pode ir ao ar citando uma foto que
       ainda não está lá */
    for(const [nome, f] of fotosParaPublicar()){
      const b = estado.bebidas.find(x => x.foto === nome);
      for(const h of [400, 200])
        await gravarArquivo(`ZeroGrau/img/${nome}-${h}.webp`, f[h].split(",")[1],
          `Painel: foto de ${b.marca} ${b.nome} (${h} px)`);
    }
    await gravarNoGitHub(texto, n);
    ENVIADO.gravar({em: Date.now(), retrato: canonico(retrato(estado))});
    toast("Publicado. O site se atualiza em um ou dois minutos.");
  }catch(e){
    const msg = e instanceof TypeError ? "Sem conexão com o GitHub. Confira a internet e tente de novo." : e.message;
    avisoEstado("bad", `Não publicou: ${msg}`);
    toast("Não publicou — veja o aviso no topo");
    publicando = false;
    $("publicar").textContent = "Publicar";
    /* o botão volta a valer, para tentar de novo sem precisar editar nada; o
       aviso do erro fica no topo até a próxima mudança */
    $("publicar").disabled = !!erros.size;
    return;
  }
  publicando = false;
  $("publicar").textContent = "Publicar";
  mudou();
}
$("publicar").addEventListener("click", publicar);

$("irConectar").addEventListener("click", () => {
  $("dlgSemChave").close();
  mostrarAba($("t-publicacao"));
  $("ghChave").focus();
});
/* fotos novas que algum produto usa, prontas para ir ao ar */
const fotosParaPublicar = () => Object.entries(estado.fotosNovas || {})
  .filter(([nome]) => estado.bebidas.some(b => b.foto === nome));

/* Sem chave, as fotos novas também descem, com o nome que o repositório
   espera — vão para ZeroGrau/img/, e o ajustes.js para ZeroGrau/js/. */
function baixarTudo(){
  for(const [nome, f] of fotosParaPublicar())
    for(const h of [400, 200]){
      const a = document.createElement("a");
      a.href = f[h]; a.download = `${nome}-${h}.webp`;
      document.body.append(a); a.click(); a.remove();
    }
  baixar(arquivoAjustes());
  $("dlgFotosAviso").hidden = !fotosParaPublicar().length;
}
$("baixarMesmo").addEventListener("click", () => {
  $("dlgSemChave").close();
  baixarTudo();
  $("dlgPublicar").showModal();
});
$("baixar").addEventListener("click", baixarTudo);

/* ---------- conectar a chave ----------
   Conectar lê o repositório com a chave: prova que ela existe e enxerga o
   repositório certo. A permissão de gravar só se prova gravando, então ela é
   conferida na primeira publicação — e o erro, se vier, diz o que marcar. */
function desenharGH(){
  const chave = CHAVE_GH.ler();
  $("ghEstado").className = "adm-gh" + (chave ? " ok" : "");
  $("ghEstado").textContent = chave
    ? `Conectado ao GitHub (chave terminada em …${chave.slice(-4)}). Publicar grava direto no site.`
    : "Não conectado. Publicar baixa o arquivo para você subir à mão.";
  $("ghForm").hidden = !!chave;
  $("ghEsquecer").hidden = !chave;
  $("publicar").title = chave ? "Grava no site, para todos os clientes" : "Baixa o ajustes.js para subir no GitHub";
}

$("ghForm").addEventListener("submit", async e => {
  e.preventDefault();
  const campo = $("ghChave"), msg = $("ghMsg");
  const chave = campo.value.trim();
  const falha = texto => { msg.className = "adm-gh-msg bad"; msg.textContent = texto; campo.setAttribute("aria-invalid", "true"); campo.focus(); };
  if(!chave) return falha("Cole a chave gerada no GitHub.");
  if(!/^(github_pat_|ghp_)\w{10,}$/.test(chave)) return falha("Isso não parece uma chave do GitHub: ela começa com github_pat_.");
  campo.removeAttribute("aria-invalid");
  msg.className = "adm-gh-msg"; msg.textContent = "Conferindo com o GitHub…";
  $("ghConectar").disabled = true;
  try{
    const r = await gh("", {chave});
    if(!r.ok) return falha(explicarGH(r.status));
    if(!CHAVE_GH.gravar(chave)) return falha("O navegador não deixou guardar a chave.");
    campo.value = "";
    msg.textContent = "";
    desenharGH();
    toast("Chave conectada");
  }catch{
    falha("Sem conexão com o GitHub. Confira a internet e tente de novo.");
  }finally{
    $("ghConectar").disabled = false;
  }
});

$("ghEsquecer").addEventListener("click", () => {
  if(!confirm("Esquecer a chave neste navegador? Para publicar direto de novo, será preciso colá-la outra vez.")) return;
  CHAVE_GH.limpar();
  desenharGH();
  toast("Chave esquecida neste navegador");
});

/* ---------- abas ---------- */
const abas = [...document.querySelectorAll(".adm-aba")];
function mostrarAba(aba){
  for(const a of abas){
    const ativa = a === aba;
    a.setAttribute("aria-selected", String(ativa));
    a.tabIndex = ativa ? 0 : -1;
    $(a.getAttribute("aria-controls")).hidden = !ativa;
  }
}
for(const a of abas) a.addEventListener("click", () => mostrarAba(a));
/* setas trocam de aba, como o padrão de tablist pede */
document.querySelector(".adm-abas").addEventListener("keydown", e => {
  const i = abas.indexOf(document.activeElement);
  if(i < 0 || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
  const prox = abas[(i + (e.key === "ArrowRight" ? 1 : -1) + abas.length) % abas.length];
  prox.focus(); mostrarAba(prox);
});

/* ---------- toast ---------- */
let toastTimer;
function toast(msg){
  $("toastMsg").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}

function desenharTudo(){
  desenharProdutos();
  desenharRegras();
  desenharHorario();
  desenharEstatistica();
  desenharGH();
  mudou();
}
desenharTudo();
mostrarAba(abas[0]);
