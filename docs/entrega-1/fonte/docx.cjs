const fs=require('fs'),path=require('path');
const d=require('docx');
const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,ShadingType,AlignmentType,HeadingLevel,ImageRun,PageBreak,LevelFormat,BorderStyle,Footer,PageNumber,TableOfContents,VerticalAlign}=d;
const C=require('./conteudo.cjs');
const IMG=path.join(__dirname,'..','imagens');
const W=9638; // A4 com margem de 2 cm
const NAVY='1B1B3A',PINK='C2185B',TEAL='00897B',GREY='55556A';

/* texto com **negrito** e [PREENCHER] destacado */
function runs(t,o={}){
  return String(t).split(/(\*\*[^*]+\*\*|\[PREENCHER\])/).filter(Boolean).map(s=>{
    if(s==='[PREENCHER]') return new TextRun({text:s,bold:true,highlight:'yellow',size:o.size});
    if(s.startsWith('**')) return new TextRun({text:s.slice(2,-2),bold:true,size:o.size,color:o.color});
    return new TextRun({text:s,size:o.size,color:o.color,bold:o.bold,italics:o.italics});
  });
}
const p=(t,o={})=>new Paragraph({children:runs(t,o),spacing:{after:o.after??120,line:300},alignment:o.align,keepNext:o.keepNext});
const h1=t=>new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun(t)],pageBreakBefore:true});
const h2=t=>new Paragraph({heading:HeadingLevel.HEADING_2,children:[new TextRun(t)]});
const h3=t=>new Paragraph({heading:HeadingLevel.HEADING_3,children:[new TextRun(t)],keepNext:true});
const li=(t,ref='bol')=>new Paragraph({numbering:{reference:ref,level:0},children:runs(t),spacing:{after:60,line:280}});
let nFig=0,nTab=0;
const legenda=(t)=>p(t,{size:18,color:GREY,italics:true,align:AlignmentType.CENTER,after:200});

function pngSize(f){const b=fs.readFileSync(f);return [b.readUInt32BE(16),b.readUInt32BE(20)];}
function figura(nome,titulo,larg=642,objetivo){
  const f=path.join(IMG,nome+'.png');const [w,h]=pngSize(f);let lw=larg,lh=Math.round(larg*h/w);
  if(lh>820){lh=820;lw=Math.round(820*w/h);}
  nFig++;
  const out=[new Paragraph({alignment:AlignmentType.CENTER,keepNext:true,spacing:{before:120,after:60},children:[new ImageRun({type:'png',data:fs.readFileSync(f),transformation:{width:lw,height:lh},altText:{title:titulo,description:titulo,name:nome}})]}),
    legenda(`Figura ${nFig} — ${titulo}`)];
  return out;
}
const borda={style:BorderStyle.SINGLE,size:4,color:'C9C9D6'};
const bordas={top:borda,bottom:borda,left:borda,right:borda};
function tabela(cab,linhas,larg,o={}){
  const tot=larg.reduce((a,b)=>a+b,0);
  const cel=(t,i,head)=>new TableCell({width:{size:larg[i],type:WidthType.DXA},borders:bordas,verticalAlign:VerticalAlign.CENTER,
    shading:head?{type:ShadingType.CLEAR,color:'auto',fill:NAVY}:(o.zebra&&o._z?{type:ShadingType.CLEAR,color:'auto',fill:'F4F4F8'}:undefined),
    margins:{top:70,bottom:70,left:100,right:100},
    children:[new Paragraph({spacing:{after:0,line:260},children:head?[new TextRun({text:t,bold:true,color:'FFFFFF',size:19})]:runs(t,{size:19,bold:o.boldCol===i})})]});
  const rows=[];
  if(cab) rows.push(new TableRow({tableHeader:true,cantSplit:true,children:cab.map((t,i)=>cel(t,i,true))}));
  linhas.forEach((l,k)=>{o._z=k%2===1;rows.push(new TableRow({cantSplit:true,children:l.map((t,i)=>cel(t,i,false))}));});
  return new Table({width:{size:tot,type:WidthType.DXA},columnWidths:larg,rows});
}
const tituloTab=t=>{nTab++;return p(`Tabela ${nTab} — ${t}`,{size:18,color:GREY,italics:true,after:80,keepNext:true});};
const esp=()=>new Paragraph({children:[],spacing:{after:120}});

/* ---------------- capa ---------------- */
const capa=[
  new Paragraph({spacing:{before:2200,after:200},children:[new TextRun({text:'TRABALHO FINAL',bold:true,color:PINK,size:26,characterSpacing:60})]}),
  new Paragraph({spacing:{after:120},children:[new TextRun({text:'Entrega 1: Plano de Trabalho',bold:true,size:56,color:NAVY,font:'Arial Black'})]}),
  new Paragraph({spacing:{after:600},children:[new TextRun({text:'Etapa 1 — Projeto Inicial',size:30,color:GREY})]}),
  new Paragraph({spacing:{after:100},children:[new TextRun({text:'Zero Grau',bold:true,size:40,color:NAVY})]}),
  new Paragraph({spacing:{after:900},children:[new TextRun({text:'Sistema web de pedidos para distribuidora de bebidas — varejo e atacado',size:26,color:NAVY})]}),
  ...[['Instituição','Universidade de Fortaleza (Unifor)'],['Curso / Disciplina','Ciência da Computação — Desenvolvimento de Plataformas Web'],['Professor','Francisco Estevão'],['Equipe',C.equipe],['Local e data','Fortaleza (CE), 29/09/2026']].map(([k,v])=>new Paragraph({spacing:{after:80},children:[new TextRun({text:k+': ',bold:true,size:22}),...runs(v,{size:22})]})),
  new Paragraph({children:[new PageBreak()]}),
  new Paragraph({children:[new TextRun({text:'Sumário',bold:true,size:32,color:NAVY})],spacing:{after:200}}),
  ...['1. Identificação','2. Escopo do Sistema','3. Diagramas de Caso de Uso (Principais Fluxos)','4. Requisitos Funcionais','5. Requisitos Não Funcionais','6. Wireframes/Protótipos das Telas Principais','7. Estrutura do Banco de Dados','8. Arquitetura Adotada','9. Divisão da Equipe','10. Cronograma de Execução','11. Funcionalidades Básicas previstas para o desenvolvimento inicial'].map(t=>new Paragraph({spacing:{after:140},children:[new TextRun({text:t,size:24})]})),
];

/* ---------------- 1 ---------------- */
const s1=[h1('1. Identificação'),tituloTab('Identificação do projeto e da equipe'),tabela(null,C.identificacao,[2600,W-2600],{boldCol:0,zebra:1})];

/* ---------------- 2 ---------------- */
const s2=[h1('2. Escopo do Sistema'),
  h2('2.1 Problema real atendido'),...C.problema.map(t=>p(t)),
  h2('2.2 Funcionalidade principal'),p(C.funcionalidadePrincipal),
  p('**Fora do escopo desta versão:** entrega própria com rastreamento em tempo real, pagamento com cartão pelo site (o cartão é pago na entrega) e emissão de nota fiscal.'),
  h2('2.3 Público-alvo'),tituloTab('Públicos do sistema'),tabela(['Público','Perfil'],C.publico,[2600,W-2600],{boldCol:0}),esp(),
  h2('2.4 Tecnologias utilizadas'),
  p('O enunciado pede: front-end com HTML, JavaScript, Bootstrap e React; back-end com Node.js, Express ou tecnologia compatível; e um banco de dados à escolha do grupo. A tabela mostra a escolha em cada camada, a justificativa e o item do enunciado que ela atende.'),
  tituloTab('Tecnologias, justificativa e aderência ao enunciado'),
  tabela(['Camada','Tecnologia','Justificativa','Enunciado'],C.tecnologias,[1300,1900,4838,1600]),esp(),
  h3('O que já existe'),...C.jaExiste.map(t=>li(t)),
];

/* ---------------- 3 ---------------- */
const s3=[h1('3. Diagramas de Caso de Uso (Principais Fluxos)'),
  p('São dois diagramas: a loja, com o Cliente especializado em Consumidor (CPF) e Revendedor (CNPJ), e o painel, com o Administrador. ViaCEP e WhatsApp aparecem como sistemas externos. As setas «include» saem do caso base para o caso sempre executado; as setas «extend» saem do caso opcional para o caso que ele estende.'),
  ...figura('uc-loja','Casos de uso da loja (varejo e atacado)'),
  ...figura('uc-painel','Casos de uso do painel de administração'),
  tituloTab('Casos de uso'),tabela(['ID','Caso de uso','Ator','Descrição'],C.ucs,[800,2300,1500,W-4600],{boldCol:0}),esp(),
  h2('Descrição dos principais fluxos'),
  ...C.fluxos.flatMap(f=>[h3(f.t),
    p(`**Ator:** ${f.ator}   **Pré-condição:** ${f.pre}`,{after:60}),
    p('**Fluxo principal**',{after:40,keepNext:true}),...f.passos.map(t=>li(t,'num'+f.t[6])),
    p('**Fluxos alternativos**',{after:40,keepNext:true}),...f.alt.map(t=>li(t)),
    p(`**Pós-condição:** ${f.pos}`,{after:200})]),
];

/* ---------------- 4 e 5 ---------------- */
const s4=[h1('4. Requisitos Funcionais'),
  p('Prioridade: **Alta** entra no MVP ou é condição para ele; **Média** melhora a operação e vem depois. A coluna Entrega diz em qual entrega o requisito fica pronto (E2 = MVP, E3 = final), o que liga cada requisito às sprints da seção 10.'),
  tituloTab('Requisitos funcionais'),tabela(['ID','Descrição','Prioridade','Caso de uso','Entrega'],C.rf,[800,5238,1100,1500,1000],{boldCol:0})];
const s5=[h1('5. Requisitos Não Funcionais'),tituloTab('Requisitos não funcionais'),tabela(['ID','Categoria','Descrição'],C.rnf,[900,1900,W-2800],{boldCol:0})];

/* ---------------- 6 ---------------- */
const s6=[h1('6. Wireframes/Protótipos das Telas Principais'),
  p(`As telas abaixo são capturas do protótipo navegável já publicado (${C.prototipo}), em 1280 px de largura. Ele serve de protótipo de alta fidelidade: a versão em React + Bootstrap mantém a mesma estrutura, os mesmos campos e a mesma identidade visual. Todas as telas também funcionam no celular.`),
  p('Os dados das capturas são de teste: a conta "cliente@exemplo.com" e, na tela do Pix, uma chave de exemplo, porque a chave real da loja ainda não foi cadastrada.'),
  ...C.telas.flatMap(([img,t,obj,rf])=>[h2(t),...figura(img,t,600),p(`**Objetivo:** ${obj}`,{after:40}),p(`**Requisitos atendidos:** ${rf}`,{after:200})]),
];

/* ---------------- 7 ---------------- */
const s7=[h1('7. Estrutura do Banco de Dados'),
  p('Banco relacional MySQL 8, com 12 entidades em dois grupos: clientes, pedidos e catálogo; e configuração da loja. Chaves primárias são inteiros autoincrementais; chaves estrangeiras usam ON DELETE RESTRICT, para que um pedido nunca perca o produto ou o cliente. Produto excluído no painel é desativado (ativo = 0), não apagado.'),
  ...figura('er','Diagrama Entidade-Relacionamento'),
  h2('Cardinalidades'),...C.cardinalidades.map(t=>li(t)),
  h2('Dicionário de dados (resumido)'),
  p(`Tipos completos no diagrama acima. Valores de status do pedido: ${C.statusPedido}.`),
  tituloTab('Dicionário de dados'),tabela(['Entidade','Finalidade','Chaves','Atributos principais'],C.dicionario,[1500,2300,2400,3438],{boldCol:0}),
];

/* ---------------- 8 ---------------- */
const s8=[h1('8. Arquitetura Adotada'),
  p('Arquitetura em três camadas, cliente-servidor. O front-end é uma aplicação de página única em React que roda no navegador e só conversa com a API. A API em Node.js + Express concentra as regras de negócio e é a única que acessa o banco MySQL. A comunicação é REST com JSON sobre HTTPS; depois do login, cada requisição leva o token JWT no cabeçalho Authorization.'),
  ...figura('arq','Arquitetura: front-end, API e banco de dados'),
  h2('Decisões'),
  li('**Preço calculado no servidor.** O navegador mostra o total, mas a API recalcula preço, promoção, desconto de atacado, cupom e frete a partir do banco antes de gravar o pedido.'),
  li('**Pedido e estoque na mesma transação.** Dois clientes não compram a última caixa ao mesmo tempo.'),
  li('**Integrações sem intermediário.** O ViaCEP é consultado pelo navegador; o Pix é gerado no padrão BR Code do Banco Central e a confirmação é feita pelo administrador no extrato; o WhatsApp recebe o pedido por link wa.me.'),
  li('**Repositório único** com as pastas frontend/ e backend/, testes automáticos no GitHub Actions a cada push.'),
  h2('Principais rotas da API'),tituloTab('Rotas REST'),tabela(['Método','Rota','Função','Acesso'],C.rotas,[1600,2900,3538,1600]),
];

/* ---------------- 9 ---------------- */
const s9=[h1('9. Divisão da Equipe'),
  p('A equipe tem cinco integrantes, divididos em três frentes. O enunciado sugere quatro funções (Front-end, Back-end, Designer UX/UI e Gerente de Projeto) e deixa a divisão a critério do grupo. Aqui, o trabalho de Designer UX/UI (wireframes e diagramas) fica com Vitor, na frente de Front-end, e o acompanhamento do cronograma fica com a Documentação, que registra o andamento de cada sprint.'),
  tituloTab('Frentes, integrantes e responsabilidades'),tabela(['Frente','Integrantes','Responsabilidades'],C.papeis,[1700,2300,W-4000],{boldCol:0})];

/* ---------------- 10 ---------------- */
const s10=[h1('10. Cronograma de Execução'),
  p('O cronograma parte do calendário da disciplina. Cada entrega fecha uma sprint, e entre as entregas o trabalho é dividido em sprints de duas a três semanas. A Sprint 0 começou no dia seguinte à definição dos temas e equipes (01/09) e está registrada no histórico do repositório.'),
  tituloTab('Datas da disciplina'),tabela(['Data','Evento'],C.calendario,[2400,W-2400],{boldCol:0}),esp(),
  tituloTab('Sprints, atividades, responsáveis e marcos'),
  tabela(['Sprint','Período','Atividades','Responsáveis','Marco'],C.sprints,[1450,1500,3388,1500,1800],{boldCol:0}),esp(),
  p('Depois da Entrega 3 ficam a avaliação de 2ª chamada (03/12) e o último dia de aula (08/12), que servem de folga para ajustes pedidos na apresentação final.'),
  h2('Acompanhamento'),p(C.acompanhamento)];

/* ---------------- 11 ---------------- */
const s11=[h1('11. Funcionalidades Básicas previstas para o desenvolvimento inicial'),
  p('O desenvolvimento inicial é o MVP da Entrega 2, que o enunciado define como interface básica com responsividade e back-end com operações CRUD integradas ao banco. Entram os requisitos marcados como E2 na seção 4:'),
  tituloTab('Funcionalidades do MVP'),
  tabela(['Funcionalidade','RF','Já existe no protótipo?','O que muda no MVP'],C.basicas,[3000,1300,2400,2938],{boldCol:0}),esp(),
  p('Ficam para a Entrega 3, como pede o enunciado da Etapa 3: login com token, busca e filtragem, e as demais funcionalidades avançadas (atacado por caixa, Pix, cupom, histórico, horário, controle de estoque).')];

const doc=new Document({
  creator:'Equipe Zero Grau',title:'Entrega 1 — Plano de Trabalho — Zero Grau',
  styles:{default:{document:{run:{font:'Arial',size:21}}},
    paragraphStyles:[
      {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:34,bold:true,color:NAVY,font:'Arial'},paragraph:{spacing:{before:0,after:240},outlineLevel:0}},
      {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:26,bold:true,color:PINK,font:'Arial'},paragraph:{spacing:{before:280,after:120},outlineLevel:1,keepNext:true}},
      {id:'Heading3',name:'Heading 3',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:22,bold:true,color:NAVY,font:'Arial'},paragraph:{spacing:{before:200,after:80},outlineLevel:2,keepNext:true}}]},
  numbering:{config:[{reference:'bol',levels:[{level:0,format:LevelFormat.BULLET,text:'•',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:560,hanging:280}}}}]},
    ...[1,2,3,4,5,6].map(n=>({reference:'num'+n,levels:[{level:0,format:LevelFormat.DECIMAL,text:'%1.',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:560,hanging:320}}}}]}))]},
  features:{updateFields:true},
  sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},
    footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:'Zero Grau · Entrega 1 — Plano de Trabalho · ',size:16,color:GREY}),new TextRun({children:[PageNumber.CURRENT],size:16,color:GREY})]})]})},
    children:[...capa,...s1,...s2,...s3,...s4,...s5,...s6,...s7,...s8,...s9,...s10,...s11]}]});
Packer.toBuffer(doc).then(b=>{fs.writeFileSync(path.join(__dirname,'..','Entrega1_Plano_de_Trabalho_ZeroGrau.docx'),b);console.log('ok',nFig,'figuras',nTab,'tabelas');});
