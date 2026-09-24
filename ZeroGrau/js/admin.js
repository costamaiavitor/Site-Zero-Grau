/* ==========================================================================
   ZERO GRAU · painel de administração

   Edita o que as duas lojas leem de js/dados.js: produtos, regras do varejo e
   regras do atacado. Nada aqui fala com servidor, porque não há um:

   - cada mudança válida vai para o rascunho (localStorage, via RASCUNHO de
     dados.js), e as lojas abertas NESTE navegador já o aplicam, com aviso;
   - "Publicar" baixa um js/ajustes.js com o retrato inteiro, e é subindo esse
     arquivo no repositório que a mudança chega aos clientes.

   Quando houver servidor, o ponto de troca é `publicar()`: em vez de baixar o
   arquivo, manda `estado` para ele. O resto do painel não muda.

   ⚠ Sem servidor também não há senha. Qualquer um que abra admin.html mexe
   só no próprio navegador, então hoje isso não expõe nada — mas o painel tem
   de ganhar login no mesmo dia em que ganhar um servidor.
   ========================================================================== */

/* O que está no ar agora (base + ajustes publicados). O rascunho é medido
   contra isto: é o que diz quantas alterações existem e o que destacar. */
const PUBLICADO = estadoAtual();

/* O rascunho passa pelo mesmo filtro que as lojas usam, então o painel nunca
   mostra um estado que a loja recusaria. */
aplicarAjustes(RASCUNHO.ler());
let estado = estadoAtual();

/* Fotos que existem: as do catálogo como estava no ar. Produto novo começa
   sem foto e cai na silhueta da embalagem — subir foto nova é trabalho de
   repositório (ver README, "Imagens"). */
const FOTOS = [...new Set(PUBLICADO.bebidas.map(b => b.foto).filter(Boolean))].sort();

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
  codigo: { mostrar: v => v ?? "", ler: t => t.trim().toUpperCase() }
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
  const caixa = campo.closest(".adm-campo, td");
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
    <td><select data-campo="foto" aria-label="${esc(rot)} — foto">${opcoes([["", "sem foto"], ...FOTOS.map(f => [f, f])], b.foto || "")}</select></td>
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
  return n;
}

let salvarTimer;
function mudou(){
  const n = diferencas();
  const e = $("estado");
  if(erros.size){
    e.className = "adm-estado bad";
    e.textContent = `${erros.size} ${erros.size === 1 ? "campo com erro" : "campos com erro"} · rascunho não salvo até corrigir`;
  }else if(n){
    e.className = "adm-estado mudou";
    e.textContent = `Rascunho · ${n} ${n === 1 ? "alteração" : "alterações"} · só neste navegador`;
  }else{
    e.className = "adm-estado";
    e.textContent = "Sem alterações · igual ao que está no ar";
  }
  $("publicar").disabled = !!erros.size || !n;
  $("descartar").disabled = !n && !erros.size;

  clearTimeout(salvarTimer);
  if(erros.size) return;
  salvarTimer = setTimeout(() => {
    /* sem alteração não há rascunho: a loja sai do modo prévia sozinha */
    if(n){
      estado.atacado.faixas.sort((x, y) => x.cx - y.cx);
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

function arquivoAjustes(){
  const quando = new Date().toLocaleString("pt-BR", {dateStyle: "short", timeStyle: "short"});
  const dados = {...structuredClone(estado), atacado: {...estado.atacado,
                 faixas: [...estado.atacado.faixas].sort((x, y) => x.cx - y.cx)}};
  return `/* ==========================================================================
   ZERO GRAU · ajustes publicados

   Gerado pelo painel (admin.html) em ${quando}. Não edite à mão: troque este
   arquivo pelo que o painel baixar e suba no repositório.

   É o retrato inteiro do que o painel edita — produtos, regras do varejo e
   do atacado — e substitui esses trechos de js/dados.js.
   ========================================================================== */
const AJUSTES_PUBLICADOS = ${JSON.stringify(dados, null, 2)};
`;
}

/* O ponto de troca para quando houver servidor: hoje baixa o arquivo. */
function publicar(){
  const blob = new Blob([arquivoAjustes()], {type: "text/javascript"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ajustes.js";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $("dlgPublicar").showModal();
}
$("publicar").addEventListener("click", publicar);

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
  mudou();
}
desenharTudo();
mostrarAba(abas[0]);
