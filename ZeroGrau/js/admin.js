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
  return {...structuredClone(e),
          bebidas: e.bebidas.map(produtoDe).filter(Boolean),
          atacado: {...structuredClone(e.atacado), faixas: [...e.atacado.faixas].sort((x, y) => x.cx - y.cx)}};
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
      "Authorization": `Bearer ${chave}`,
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
  const url = `/contents/${GITHUB.caminho}`;
  /* Duas voltas: se alguém gravou o arquivo entre a leitura do sha e o PUT,
     o GitHub recusa com 409, e a segunda volta relê o sha e tenta de novo. */
  for(let volta = 0; volta < 2; volta++){
    const atual = await gh(`${url}?ref=${GITHUB.ramo}`);
    if(!atual.ok && atual.status !== 404) throw new Error(explicarGH(atual.status));
    const sha = atual.ok ? (await atual.json()).sha : undefined;
    const r = await gh(url, {metodo: "PUT", corpo: {
      message: `Painel: publica ${alteracoes} ${alteracoes === 1 ? "alteração" : "alterações"} no catálogo`,
      content: base64(texto),
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
  if(!confirm(`Publicar ${n} ${n === 1 ? "alteração" : "alterações"} no site, para todos os clientes?`)) return;

  publicando = true;
  $("publicar").disabled = true;
  $("publicar").textContent = "Publicando…";
  try{
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
$("baixarMesmo").addEventListener("click", () => {
  $("dlgSemChave").close();
  baixar(arquivoAjustes());
  $("dlgPublicar").showModal();
});
$("baixar").addEventListener("click", () => baixar(arquivoAjustes()));

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
  desenharGH();
  mudou();
}
desenharTudo();
mostrarAba(abas[0]);
