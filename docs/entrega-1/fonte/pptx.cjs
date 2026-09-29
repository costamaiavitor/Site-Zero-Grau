const fs=require('fs'),path=require('path');
const pptxgen=require('pptxgenjs');const React=require('react');const RDS=require('react-dom/server');const sharp=require('sharp');
const fa=require('react-icons/fa');
const C=require('./conteudo.cjs');
const IMG=f=>path.join(__dirname,'..','imagens',f+'.png');
const DARK='0D0D21',PINK='FF307A',PINKD='C2185B',CYAN='00E5D0',NAVY='1B1B3A',LIGHT='F4F4F8',GREY='5A5A70',WHITE='FFFFFF';
const F='Arial';
async function icone(nome,cor){const svg=RDS.renderToStaticMarkup(React.createElement(fa[nome],{color:'#'+cor,size:256}));
  return 'image/png;base64,'+(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64');}
function pngSize(f){const b=fs.readFileSync(f);return [b.readUInt32BE(16),b.readUInt32BE(20)];}
const P='[PREENCHER]';
(async()=>{
const pres=new pptxgen();pres.layout='LAYOUT_16x9';pres.title='Zero Grau — Entrega 1: Plano de Trabalho';
const I={};for(const [n,c] of [['FaUser',WHITE],['FaStore',WHITE],['FaUserCog',WHITE],['FaReact',WHITE],['FaNodeJs',WHITE],['FaDatabase',WHITE],
  ['FaMapMarkerAlt',WHITE],['FaWhatsapp',WHITE],['FaQrcode',WHITE],['FaShoppingCart',WHITE],['FaListUl',WHITE],['FaTools',WHITE],['FaClipboardList',WHITE],
  ['FaPalette',WHITE],['FaCode',WHITE],['FaServer',WHITE],['FaUserPlus',WHITE],['FaGithub',WHITE],['FaBoxes',WHITE],['FaCheck',WHITE],['FaFlagCheckered',WHITE]]) I[n]=await icone(n,c);
const circ=(s,ic,x,y,d=0.5,cor=PINKD)=>{s.addShape(pres.shapes.OVAL,{x,y,w:d,h:d,fill:{color:cor},line:{color:cor}});s.addImage({data:I[ic],x:x+d*0.24,y:y+d*0.24,w:d*0.52,h:d*0.52});};
const tit=(s,t,dark)=>s.addText(t,{x:0.5,y:0.3,w:9,h:0.6,fontFace:F,fontSize:28,bold:true,color:dark?WHITE:NAVY,margin:0,isTextBox:true});
const marca=(s,dark)=>{s.addShape(pres.shapes.ROUNDED_RECTANGLE,{x:9.05,y:0.32,w:0.45,h:0.45,rectRadius:0.06,fill:{color:dark?DARK:WHITE},line:{color:dark?PINK:NAVY,width:1.25}});
  s.addText('0°',{x:9.05,y:0.32,w:0.45,h:0.45,align:'center',valign:'middle',fontFace:F,fontSize:13,bold:true,color:dark?WHITE:NAVY,margin:0,isTextBox:true});};
const num=(s,n,dark)=>s.addText(String(n),{x:9.2,y:5.25,w:0.4,h:0.25,align:'right',fontFace:F,fontSize:9,color:dark?'8A8AA0':GREY,margin:0,isTextBox:true});
let n=0;
const novo=(dark)=>{n++;const s=pres.addSlide();s.background={color:dark?DARK:WHITE};marca(s,dark);num(s,n,dark);return s;};
const card=(s,x,y,w,h,fill=LIGHT)=>s.addShape(pres.shapes.ROUNDED_RECTANGLE,{x,y,w,h,rectRadius:0.08,fill:{color:fill},line:{color:fill}});
const txt=(s,t,o)=>s.addText(t,{fontFace:F,margin:0,isTextBox:true,valign:'top',...o});
const img=(s,f,x,y,w,h)=>{s.addImage({path:IMG(f),x,y,w,h});};
const fit=(f,maxW,maxH)=>{const [w,h]=pngSize(IMG(f));let W=maxW,H=maxW*h/w;if(H>maxH){H=maxH;W=maxH*w/h;}return [W,H];};
const quem=n=>`[${n}]`;
const PARTE={1:'1 · PLANEJAMENTO DO PROJETO',2:'2 · APRESENTAÇÃO'};
const rod=(s,p,t)=>txt(s,[{text:PARTE[p],options:{bold:true,color:PINKD}},{text:'  ›  '+t,options:{color:GREY}}],{x:0.5,y:5.27,w:8.4,h:0.22,fontSize:8.5,charSpacing:0.5});
const INICIO={};const marcaInicio=k=>{INICIO[k]=n+1;};

/* 1 capa */
{const s=novo(true);
 /* fileira de garrafas do catálogo, com a base alinhada, como na estante do site */
 s.addShape(pres.shapes.RECTANGLE,{x:5.35,y:0,w:4.65,h:5.625,fill:{color:'14142C'},line:{color:'14142C'}});
 s.addShape(pres.shapes.OVAL,{x:5.5,y:4.55,w:4.35,h:0.4,fill:{color:'22224A'},line:{color:'22224A'}});
 const fila=[['coca-cola-2l',2.4],['jack-daniels-1l',2.3],['estrella-galicia-330',1.3],['tanqueray-750',2.35],['red-bull-250',1.1],['absolut-mango-1l',2.35]];
 const fotos=[];for(const [f,h0] of fila){const b=await sharp(path.join(__dirname,'..','..','..','ZeroGrau','img',f+'-400.webp')).png().toBuffer();const m=await sharp(b).metadata();const h=h0*0.88;fotos.push([b,h,h*m.width/m.height]);}
 const larg=fotos.reduce((a,[, ,w])=>a+w,0);let fx=5.35+(4.65-larg)/2;
 for(const [b,h,w] of fotos){s.addImage({data:'image/png;base64,'+b.toString('base64'),x:fx,y:4.75-h,w,h});fx+=w;}
 marca(s,true);
 txt(s,'TRABALHO FINAL · ENTREGA 1',{x:0.5,y:1.1,w:4.6,h:0.3,fontSize:12,bold:true,color:PINK,charSpacing:3});
 txt(s,'Plano de Trabalho',{x:0.5,y:1.45,w:4.6,h:0.8,fontSize:36,bold:true,color:WHITE});
 txt(s,'ZERO GRAU',{x:0.5,y:2.35,w:4.6,h:0.45,fontSize:22,bold:true,color:CYAN,charSpacing:2});
 txt(s,'Sistema web de pedidos para distribuidora de bebidas — varejo e atacado',{x:0.5,y:2.85,w:4.4,h:0.7,fontSize:15,color:'DFE0EE'});
 txt(s,[{text:'Disciplina: ',options:{bold:true}},{text:'Desenvolvimento de Plataformas Web',options:{breakLine:true}},{text:'Curso: ',options:{bold:true}},{text:'Ciência da Computação · Unifor',options:{breakLine:true}},{text:'Professor: ',options:{bold:true}},{text:'Francisco Estevão',options:{breakLine:true}},{text:'Equipe: ',options:{bold:true}},{text:C.equipe,options:{breakLine:true}},{text:'Data: ',options:{bold:true}},{text:'29/09/2026'}],
   {x:0.5,y:3.8,w:4.6,h:1.35,fontSize:11,color:'B8B9CC',paraSpaceAfter:3});
 s.addNotes(`${quem('Christian')}\nBoa noite. Somos ${C.equipe}, e vamos apresentar o Plano de Trabalho do nosso trabalho final: o Zero Grau, um sistema web de pedidos para uma distribuidora de bebidas de Fortaleza, que vende tanto para quem consome quanto para quem revende.\nSeguimos a ordem do enunciado da Etapa 1: primeiro o planejamento do projeto (escopo, casos de uso, requisitos, telas, banco de dados e cronograma) e depois a divisão da equipe, as funcionalidades básicas e a arquitetura adotada.`);}

/* 2 roteiro — os itens do enunciado, na ordem dele */
const roteiro=novo();tit(roteiro,'Roteiro');

/* 3 problema real */
marcaInicio('escopo');
{const s=novo();tit(s,'Escopo — o problema real');rod(s,1,'Escopo do sistema');
 txt(s,'O enunciado pede um problema real: o nosso é o de uma distribuidora de bebidas de Fortaleza.',{x:0.5,y:0.97,w:9,h:0.3,fontSize:12,color:GREY});
 const cols=[['Dois públicos',LIGHT,[['FaUser','Consumidor quer a unidade, gelada, entregue rápido em casa.'],['FaStore','Revendedor quer caixa fechada, preço de atacado e pedido mínimo próprio.']]],
   ['Como é hoje',LIGHT,[['FaWhatsapp','O pedido chega pelo WhatsApp, na mensagem que o protótipo monta.'],['FaClipboardList','Nada fica registrado: sem histórico de pedidos.'],['FaBoxes','O estoque não baixa com a venda, e as contas só existem no navegador.']]],
   ['Com o sistema','FFE9F1',[['FaDatabase','Clientes, catálogo e pedidos guardados num banco de dados.'],['FaWhatsapp','O WhatsApp da loja continua recebendo o pedido.'],['FaTools','Um painel para mudar preço, estoque e regras e acompanhar pedidos.']]]];
 cols.forEach(([t,cor,itens],i)=>{const x=0.5+i*3.07;card(s,x,1.4,2.85,3.7,cor);
   txt(s,t,{x:x+0.25,y:1.58,w:2.4,h:0.35,fontSize:15,bold:true,color:i===2?PINKD:NAVY});
   itens.forEach(([ic,tx],k)=>{const y=2.1+k*0.95;circ(s,ic,x+0.25,y,0.42,i===2?PINKD:NAVY);txt(s,tx,{x:x+0.8,y:y-0.03,w:1.85,h:0.9,fontSize:11,color:NAVY});});});
 s.addNotes(`${quem('Christian')}\nO enunciado pede um sistema que resolva um problema real. O nosso é o da Zero Grau, uma distribuidora de bebidas de Fortaleza que vende para dois públicos com necessidades opostas: o consumidor, que quer uma unidade gelada entregue rápido, e o revendedor, que quer caixa fechada com preço de atacado. Os dois disputam o mesmo estoque.\nHoje o pedido chega pelo WhatsApp, na mensagem que o nosso protótipo monta, mas nada fica registrado: não há histórico, o estoque não baixa com a venda e as contas dos clientes só existem no navegador.\nO sistema resolve isso guardando clientes, catálogo e pedidos num banco de dados, mantendo o WhatsApp que a loja já usa e dando ao dono um painel de gestão.`);}

/* 4 funcionalidade principal */
{const s=novo();tit(s,'Escopo — funcionalidade principal');rod(s,1,'Escopo do sistema');
 txt(s,'Pedido de bebidas pela web em duas vitrines sobre o mesmo estoque: quem se cadastra com CPF compra no varejo, por unidade; com CNPJ, no atacado, por caixa fechada.',{x:0.5,y:1.0,w:9,h:0.75,fontSize:16,bold:true,color:NAVY});
 const passos=[['FaUserPlus','Cadastro','CPF ou CNPJ decide a loja'],['FaListUl','Catálogo','busca e filtro por categoria'],['FaShoppingCart','Carrinho','por unidade ou por caixa'],['FaMapMarkerAlt','Entrega','taxa calculada pelo CEP'],['FaQrcode','Pagamento','Pix no site ou na entrega'],['FaWhatsapp','Pedido','gravado e enviado ao WhatsApp']];
 const d=0.7,x0=0.9,gap=(8.4-x0)/5;
 s.addShape(pres.shapes.LINE,{x:x0+d/2,y:2.35+d/2,w:8.4-x0,h:0,line:{color:'D5D5E0',width:2}});
 passos.forEach(([ic,t,sub],i)=>{const cx=x0+i*gap;circ(s,ic,cx,2.35,d,i===5?PINKD:NAVY);
   txt(s,t,{x:cx+d/2-0.7,y:3.15,w:1.4,h:0.3,fontSize:13,bold:true,color:NAVY,align:'center'});
   txt(s,sub,{x:cx+d/2-0.7,y:3.45,w:1.4,h:0.5,fontSize:10.5,color:GREY,align:'center'});});
 card(s,0.5,4.2,4.4,0.85);circ(s,'FaTools',0.68,4.37,0.5,PINKD);
 txt(s,[{text:'Painel do dono',options:{bold:true,color:NAVY,breakLine:true}},{text:'CRUD de produtos, regras de venda, dados da loja e pedidos',options:{color:GREY}}],{x:1.32,y:4.3,w:3.5,h:0.7,fontSize:11,valign:'middle'});
 card(s,5.1,4.2,4.4,0.85);
 txt(s,[{text:'Fora do escopo desta versão',options:{bold:true,color:NAVY,breakLine:true}},{text:'Rastreamento da entrega, cartão pelo site e nota fiscal',options:{color:GREY}}],{x:5.3,y:4.3,w:4.1,h:0.7,fontSize:11,valign:'middle'});
 s.addNotes(`${quem('Caio')}\nA funcionalidade principal é o pedido de bebidas pela web, em duas vitrines sobre o mesmo estoque. O documento de cadastro decide a vitrine: com CPF o cliente compra no varejo, por unidade; com CNPJ, no atacado, por caixa fechada.\nO caminho tem seis passos: cadastro, catálogo com busca e filtro, carrinho, entrega calculada pelo CEP, pagamento por Pix no site ou na entrega e, no fim, o pedido gravado no banco e enviado ao WhatsApp da loja.\nPor trás disso fica o painel do dono. Deixamos fora desta versão o rastreamento da entrega, o pagamento com cartão pelo site e a nota fiscal.`);}

/* 5 público-alvo */
{const s=novo();tit(s,'Escopo — público-alvo');rod(s,1,'Escopo do sistema');
 const P3=[['FaUser','Consumidor final','CPF · loja de varejo','Maior de 18 anos, na área de entrega. Compra por unidade, quase sempre pelo celular.'],
   ['FaStore','Revendedor','CNPJ · balcão de atacado','Comércio que revende bebidas. Caixa fechada, desconto de revenda e pedido mínimo próprio.'],
   ['FaUserCog','Administrador','Dono ou equipe da loja','Mantém catálogo, preços, estoque, regras, horário e Pix, e acompanha os pedidos.']];
 P3.forEach(([ic,t,sub,d],i)=>{const x=0.5+i*3.07;card(s,x,1.15,2.85,3.75);circ(s,ic,x+0.3,1.4,0.7,i===2?NAVY:PINKD);
   txt(s,t,{x:x+0.3,y:2.3,w:2.3,h:0.4,fontSize:18,bold:true,color:NAVY});
   txt(s,sub,{x:x+0.3,y:2.72,w:2.3,h:0.3,fontSize:12,bold:true,color:PINKD});
   txt(s,d,{x:x+0.3,y:3.15,w:2.3,h:1.5,fontSize:12.5,color:GREY});});
 s.addNotes(`${quem('Vitor (diagramas)')}\nSão três públicos. O consumidor final, maior de 18 anos e dentro da área de entrega, que compra por unidade e quase sempre pelo celular; por isso o layout é pensado primeiro para o celular.\nO revendedor, identificado pelo CNPJ, que compra por caixa fechada, com desconto de revenda e um pedido mínimo próprio. Para ele a tela é uma tabela mais sóbria.\nE o administrador, o dono da distribuidora, que precisa mudar preço, estoque e promoção sem depender de programador.`);}

/* 6 tecnologias */
{const s=novo();tit(s,'Escopo — tecnologias utilizadas');rod(s,1,'Escopo do sistema');
 const H=t=>({text:t,options:{bold:true,color:WHITE,fill:{color:NAVY},fontSize:11}});
 const L=[['Front-end','HTML, JavaScript, Bootstrap e React','✔ React (Vite) + Bootstrap 5, sobre HTML e JavaScript','Componentes reaproveitados nas duas lojas e no painel; grade responsiva pronta'],
   ['Back-end','Node.js, Express ou tecnologia compatível','✔ Node.js + Express, com bcrypt e JWT','Mesma linguagem do front; API REST com login por token'],
   ['Banco de dados','MySQL, MongoDB ou outro, à escolha do grupo','✔ MySQL 8 + Sequelize','Pedido → itens → produto é relacional; transação ao baixar estoque']];
 const rows=[[H('Camada'),H('O enunciado pede'),H('Nossa escolha'),H('Por quê')],
   ...L.map((r,i)=>r.map((c,k)=>({text:c,options:{fontSize:11,color:k===2?'00796B':(k===0?NAVY:GREY),bold:k===0||k===2,fill:{color:i%2?'FFFFFF':LIGHT}}})))];
 s.addTable(rows,{x:0.5,y:1.05,w:9,colW:[1.35,2.35,2.45,2.85],rowH:[0.4,0.78,0.78,0.78],fontFace:F,valign:'middle',margin:[4,8,4,8],border:{type:'solid',pt:0.75,color:'D5D5E0'}});
 card(s,0.5,3.95,9.0,0.7,NAVY);
 txt(s,[{text:'Integrações  ',options:{bold:true,color:CYAN}},{text:'ViaCEP · WhatsApp · Pix BR Code    ',options:{color:WHITE}},{text:'Qualidade  ',options:{bold:true,color:CYAN}},{text:'GitHub Actions · Playwright    ',options:{color:WHITE}},{text:'Hospedagem  ',options:{bold:true,color:CYAN}},{text:'Vercel',options:{color:WHITE}}],
   {x:0.7,y:3.95,w:8.7,h:0.7,fontSize:11,valign:'middle'});
 s.addNotes(`${quem('Caio')} (front-end) e ${quem('Vitor Custodio')} (back-end e banco)\nA tabela compara o que o enunciado pede com o que escolhemos. No front-end, o enunciado pede HTML, JavaScript, Bootstrap e React, e usamos os quatro: React porque as duas lojas e o painel repetem componentes, como o card do produto e o carrinho, e Bootstrap pela grade responsiva.\nNo back-end, Node.js com Express, a mesma linguagem do front. A senha é guardada com bcrypt e a sessão usa token JWT.\nNo banco, MySQL, porque os dados são relacionais: pedido tem itens e itens apontam para produtos, e precisamos de transação para não vender o que não existe no estoque.\nViaCEP, WhatsApp e Pix já funcionam no protótipo. O front vai para a Vercel, que o enunciado cita na Etapa 3.`);}

/* 7-9 casos de uso e fluxos */
marcaInicio('uc');
{const s=novo();tit(s,'Casos de uso — loja');rod(s,1,'Diagramas de Caso de Uso (Principais Fluxos)');const [w,h]=fit('uc-loja',6.3,4.25);img(s,'uc-loja',0.4,0.95,w,h);
 const x=0.4+w+0.3;txt(s,[{text:'Atores',options:{bold:true,color:PINKD,breakLine:true}},{text:'Cliente, especializado em Consumidor (CPF) e Revendedor (CNPJ)',options:{breakLine:true}},{text:' ',options:{breakLine:true}},
   {text:'Sistemas externos',options:{bold:true,color:PINKD,breakLine:true}},{text:'ViaCEP e WhatsApp',options:{breakLine:true}},{text:' ',options:{breakLine:true}},
   {text:'6 casos principais',options:{bold:true,color:PINKD,breakLine:true}},{text:'UC01 a UC06',options:{breakLine:true}},{text:' ',options:{breakLine:true}},
   {text:'«include»',options:{bold:true,color:PINKD}},{text:' sempre executa',options:{breakLine:true}},{text:'«extend»',options:{bold:true,color:'00897B'}},{text:' opcional'}],
   {x,y:1.2,w:9.6-x,h:3.8,fontSize:12,color:NAVY});
 s.addNotes(`${quem('Vitor (diagramas)')}\nNa loja o ator é o Cliente, que se especializa em Consumidor, com CPF, e Revendedor, com CNPJ.\nSão seis casos principais: criar conta, entrar, consultar catálogo, montar carrinho, finalizar pedido e consultar meus pedidos.\nFinalizar pedido sempre inclui calcular a entrega pelo CEP, que consulta o ViaCEP, registrar o pedido e enviar ao WhatsApp. Pagar com Pix é uma extensão opcional. Comprar por caixa fechada estende o carrinho, e é o que muda para o revendedor.`);}
{const s=novo();tit(s,'Casos de uso — painel');rod(s,1,'Diagramas de Caso de Uso (Principais Fluxos)');const [w,h]=fit('uc-painel',6.3,4.2);img(s,'uc-painel',0.4,1.05,w,h);
 const x=0.4+w+0.3;txt(s,[{text:'Ator',options:{bold:true,color:PINKD,breakLine:true}},{text:'Administrador (dono da loja)',options:{breakLine:true}},{text:' ',options:{breakLine:true}},
   {text:'5 casos principais',options:{bold:true,color:PINKD,breakLine:true}},{text:'UC07 a UC11',options:{breakLine:true}},{text:' ',options:{breakLine:true}},
   {text:'Status do pedido',options:{bold:true,color:PINKD,breakLine:true}},{text:'recebido → confirmado → em preparo → saiu → entregue',options:{breakLine:true}},{text:' ',options:{breakLine:true}},{text:'Estoque atualizado a cada pedido'}],
   {x,y:1.2,w:9.6-x,h:3.8,fontSize:12,color:NAVY});
 s.addNotes(`${quem('Vitor (diagramas)')}\nNo painel o ator é o administrador. Ele entra com perfil de administrador e tem cinco casos principais: gerenciar produtos, com envio de foto; configurar as regras de venda do varejo e do atacado, incluindo cupom e faixas por volume; configurar os dados da loja, como chave Pix e horário; e gerenciar pedidos.\nAo gerenciar pedidos ele muda o status, de recebido até entregue, e o estoque é atualizado.`);}
{const s=novo();tit(s,'Principais fluxos');rod(s,1,'Diagramas de Caso de Uso (Principais Fluxos)');
 const FL=[['Criar conta e entrar','UC01, UC02 · Cliente',['Confirma ter 18 anos ou mais','Informa CPF/CNPJ, e-mail e senha','Entra na loja do seu documento'],'E-mail já usado: oferece entrar'],
   ['Comprar no varejo','UC03 a UC05 · Consumidor',['Monta o carrinho no catálogo','O CEP calcula a entrega','Paga e o pedido vai ao WhatsApp'],'Fora do raio: vira retirada no balcão'],
   ['Comprar no atacado','UC03 a UC05 · Revendedor',['Escolhe caixas na tabela','Ganha desconto por volume','Fecha acima do mínimo do atacado'],'Acima do estoque: limita ao disponível'],
   ['Pedir de novo','UC06 · Cliente',['Abre "Meus pedidos"','Toca em "Pedir de novo"','Os itens voltam ao carrinho'],'Item esgotado fica de fora, com aviso'],
   ['Manter o catálogo','UC07 a UC10 · Administrador',['Entra no painel','Edita produtos, regras, Pix e horário','As lojas mostram os novos valores'],'Campo inválido: aponta o erro'],
   ['Gerenciar pedidos','UC11 · Administrador',['Vê os pedidos por status','Confere itens e pagamento','Avança até "entregue"'],'Cancelado: o estoque volta']];
 FL.forEach(([t,meta,passos,alt],i)=>{const col=i%3,row=Math.floor(i/3),x=0.5+col*3.07,y=1.0+row*2.12;card(s,x,y,2.85,1.98);
   txt(s,`FLUXO ${i+1}`,{x:x+0.2,y:y+0.13,w:1.2,h:0.2,fontSize:8.5,bold:true,color:PINKD,charSpacing:1});
   txt(s,t,{x:x+0.2,y:y+0.33,w:2.5,h:0.3,fontSize:13,bold:true,color:NAVY});
   txt(s,meta,{x:x+0.2,y:y+0.62,w:2.5,h:0.2,fontSize:9,color:GREY});
   txt(s,passos.map((p,k)=>({text:`${k+1}. ${p}`,options:{breakLine:k<2}})),{x:x+0.2,y:y+0.88,w:2.5,h:0.72,fontSize:10.5,color:NAVY,paraSpaceAfter:1});
   txt(s,'↳ '+alt,{x:x+0.2,y:y+1.62,w:2.5,h:0.3,fontSize:9.5,italic:true,color:'00796B'});});
 s.addNotes(`${quem('João Vitor')}\nO enunciado pede os casos de uso com os principais fluxos. São seis, e cada cartão mostra o caminho principal e um fluxo alternativo.\nCriar conta e entrar: o cliente confirma a maioridade, informa o documento e entra na loja certa. Comprar no varejo: carrinho, entrega pelo CEP e pedido no WhatsApp; se o CEP fica fora do raio, vira retirada no balcão. Comprar no atacado: caixas, desconto por volume e mínimo do atacado. Pedir de novo: um pedido antigo volta ao carrinho.\nNo painel, manter o catálogo e gerenciar pedidos, do recebido até o entregue. O passo a passo completo está na seção 3 do documento.`);}

/* 10-11 requisitos */
marcaInicio('req');
{const s=novo();tit(s,'Requisitos funcionais');rod(s,1,'Requisitos Funcionais e Não Funcionais');
 const curto={RF01:'Aviso de maioridade (18+)',RF02:'Cadastro com CPF/CNPJ, e-mail e senha',RF03:'Login com e-mail e senha (JWT)',RF04:'Loja pelo documento: CPF → varejo, CNPJ → atacado',RF05:'Catálogo lido do banco',RF06:'Busca e filtro por categoria',RF07:'Carrinho respeitando o estoque',RF08:'Entrega pelo CEP, raio e retirada',RF09:'Pedido mínimo, frete grátis e cupom',RF10:'Finalizar pedido e gravar no banco',RF11:'Pix copia e cola e QR code',
   RF12:'Resumo do pedido no WhatsApp',RF13:'Atacado por caixa, com desconto por volume',RF14:'Histórico e pedir de novo',RF15:'Horário da loja e pedido agendado',RF16:'Painel: CRUD de produtos e foto',RF17:'Painel: regras do varejo e do atacado',RF18:'Painel: contato, Pix e horário',RF19:'Painel: pedidos e status',RF20:'Baixa e devolução de estoque',RF21:'Painel só para administrador'};
 const H=t=>({text:t,options:{bold:true,color:WHITE,fill:{color:NAVY},fontSize:9.5}});
 const tab=(lista,x)=>{const rows=[[H('ID'),H('Descrição'),H('Prior.'),H('Entrega')],...lista.map((r,i)=>{const f={fill:{color:i%2?'FFFFFF':LIGHT}};
   return [{text:r[0],options:{...f,bold:true,color:PINKD}},{text:curto[r[0]],options:{...f,color:NAVY}},{text:r[2],options:{...f,bold:r[2]==='Alta',color:r[2]==='Alta'?NAVY:GREY}},{text:r[4]==='E2'?'MVP':'Final',options:{...f,bold:r[4]==='E2',color:r[4]==='E2'?PINKD:GREY}}];})];
   s.addTable(rows,{x,y:1.0,w:4.4,colW:[0.55,2.55,0.6,0.7],rowH:0.315,fontSize:9.5,fontFace:F,valign:'middle',margin:[2,5,2,5],border:{type:'solid',pt:0.5,color:'D5D5E0'}});};
 tab(C.rf.slice(0,11),0.5);tab(C.rf.slice(11),5.1);
 const e2=C.rf.filter(r=>r[4]==='E2').length;
 txt(s,[{text:`${C.rf.length} requisitos · `,options:{bold:true,color:NAVY}},{text:`${e2} no MVP (Entrega 2, 03/11)`,options:{bold:true,color:PINKD}},{text:` · os demais na versão final (Entrega 3, 26/11)`,options:{color:GREY}}],{x:5.1,y:4.72,w:4.4,h:0.4,fontSize:10});
 s.addNotes(`${quem('João Vitor')}\nSão ${C.rf.length} requisitos funcionais, cada um com identificador, prioridade e a entrega em que fica pronto. ${e2} entram no MVP da Entrega 2, em 3 de novembro: aviso de maioridade, cadastro, direcionamento pela loja do documento, catálogo lido do banco, carrinho, entrega pelo CEP, finalizar pedido, envio ao WhatsApp, CRUD de produtos e lista de pedidos.\nOs outros, como login com token, busca, atacado e Pix, ficam para a versão final, na Entrega 3, como pede o enunciado da Etapa 3. A descrição completa está na seção 4 do documento.`);}
{const s=novo();tit(s,'Requisitos não funcionais');rod(s,1,'Requisitos Funcionais e Não Funcionais');
 const curto={RNF01:'Responsivo de 320 px ao desktop; toque de no mínimo 44 px',RNF02:'Contraste 4,5:1 (WCAG AA), rótulos e uso por teclado',RNF03:'Senha em bcrypt, token JWT com validade, só HTTPS',RNF04:'Preço, frete e total recalculados no servidor',RNF05:'Pedido e baixa de estoque na mesma transação',RNF06:'Venda só a maiores de 18 (ECA, art. 243)',RNF07:'Só os dados necessários; estatística com consentimento',RNF08:'Fotos em WebP; início em menos de 3 s no 4G',RNF09:'Navegadores atuais; instalável como app (PWA)',RNF10:'Código no GitHub, API documentada, testes a cada push',RNF11:'Publicado na nuvem (Vercel)'};
 C.rnf.forEach(([id,cat],i)=>{const col=i%4,row=Math.floor(i/4),x=0.5+col*2.3,y=1.0+row*1.4;card(s,x,y,2.1,1.25);
   txt(s,`${id} · ${cat}`,{x:x+0.15,y:y+0.12,w:1.85,h:0.25,fontSize:9.5,bold:true,color:PINKD});
   txt(s,curto[id],{x:x+0.15,y:y+0.42,w:1.85,h:0.75,fontSize:10.5,color:NAVY});});
 card(s,0.5+3*2.3,1.0+2*1.4,2.1,1.25,NAVY);
 txt(s,String(C.rnf.length),{x:0.5+3*2.3+0.15,y:1.0+2*1.4+0.1,w:1.8,h:0.6,fontSize:32,bold:true,color:WHITE});
 txt(s,'requisitos não funcionais, em 9 categorias',{x:0.5+3*2.3+0.15,y:1.0+2*1.4+0.72,w:1.85,h:0.45,fontSize:9.5,color:'DFE0EE'});
 s.addNotes(`${quem('João Vitor')}\nSão ${C.rnf.length} requisitos não funcionais, cada um com categoria. Destaco três. Integridade: o preço, o frete e o total são sempre recalculados no servidor, porque não se confia no valor que vem do navegador, e o pedido e a baixa de estoque acontecem na mesma transação. Segurança: senha guardada só como hash e tráfego só por HTTPS. E o legal: bebida alcoólica só para maiores de 18, como exige o ECA.\nOs demais cobrem usabilidade no celular, acessibilidade, LGPD, desempenho, compatibilidade, manutenção e hospedagem na nuvem. O detalhamento está na seção 5.`);}

/* 12-17 protótipos */
marcaInicio('telas');
const TELA=Object.fromEntries([...C.telas,...C.telasExtras].map(t=>[t[0],t]));
const curtoT=f=>TELA[f][1].split(' — ')[1];
const ROD_T='Wireframes e protótipos das telas principais';
function galeria(titulo,fotos,fala,quemFala){const s=novo();tit(s,titulo);rod(s,1,ROD_T);
  const w=2.8,h=w*800/1280,gx=0.25;const linhas=[fotos.slice(0,3),fotos.slice(3,6)];
  linhas.forEach((ln,r)=>{const tot=ln.length*w+(ln.length-1)*gx,x0=(10-tot)/2,Y=1.0+r*2.12;
    ln.forEach((f,i)=>{const x=x0+i*(w+gx);
      s.addShape(pres.shapes.RECTANGLE,{x:x-0.015,y:Y-0.015,w:w+0.03,h:h+0.03,fill:{color:NAVY},line:{color:NAVY}});
      s.addImage({path:IMG(f),x,y:Y,w,h});
      txt(s,curtoT(f),{x,y:Y+h+0.05,w,h:0.25,fontSize:11,bold:true,color:NAVY});});});
  s.addNotes(`${quem(quemFala)}\n${fala}`);}
function grandes(titulo,fotos,fala,quemFala){const s=novo();tit(s,titulo);rod(s,1,ROD_T);
  fotos.forEach((f,i)=>{const [,t,obj]=TELA[f];const x=0.5+i*3.07,w=2.85,h=w*800/1280,Y=1.2;
    s.addShape(pres.shapes.RECTANGLE,{x:x-0.02,y:Y-0.02,w:w+0.04,h:h+0.04,fill:{color:NAVY},line:{color:NAVY}});
    s.addImage({path:IMG(f),x,y:Y,w,h});
    txt(s,curtoT(f),{x,y:Y+h+0.18,w,h:0.35,fontSize:14,bold:true,color:NAVY});
    txt(s,obj,{x,y:Y+h+0.58,w,h:1.2,fontSize:12,color:GREY});});
  s.addNotes(`${quem(quemFala)}\n${fala}`);}
galeria('Protótipo — varejo (1/3)',['v01-idade','t1-login','t2-criar-conta','t3-inicio','t4-catalogo','v02-categoria'],
 'Estas telas são do protótipo que já está no ar e servem de wireframe de alta fidelidade. Primeiro vem o aviso de maioridade; depois o login só com e-mail e senha. O CPF ou CNPJ é pedido uma vez, em Criar conta, e é ele que decide a loja. O varejo abre na tela de início, que mostra se a loja está aberta, a taxa de entrega e o pedido mínimo. No catálogo, cada aba filtra uma categoria.','Vitor (diagramas)');
galeria('Protótipo — varejo (2/3)',['v03-busca','v04-como-pedir','v05-cupom','v06-entrega','t5-carrinho','t6-fechamento'],
 'A busca filtra por marca ou nome enquanto o cliente digita. As abas Como pedir, Cupom e Entrega explicam o pedido, divulgam o cupom e mostram raio, taxas e horário. O carrinho mostra subtotal, cupom e total, e no fechamento o CEP preenche a rua pelo ViaCEP e o sistema calcula a entrega.','Vitor (diagramas)');
galeria('Protótipo — varejo (3/3)',['v07-pagamento-entrega','t7-pix','v10-retirada','v08-pedido-enviado','v09-pedir-de-novo'],
 'O cliente escolhe como paga: na entrega, com Pix, cartão ou dinheiro com troco, ou pelo site, com QR code e copia e cola no valor exato. Se o CEP fica fora do raio, a entrega vira retirada no balcão. Depois de enviado, o pedido vai para o WhatsApp da loja, e com o carrinho vazio o cliente pode pedir de novo um pedido anterior.','Caio');
grandes('Protótipo — atacado',['t8-atacado','a01-atacado-pedido','a02-atacado-categoria'],
 'O atacado é uma tabela mais sóbria, pensada para quem compra por caixa fechada. O revendedor escolhe a quantidade de caixas, e o resumo ao lado aplica o desconto de revenda e o desconto extra por volume e confere o pedido mínimo. A tabela também filtra por categoria.','Caio');
galeria('Protótipo — painel de administração',['p01-painel-edicao','p06-previa-loja','p02-painel-varejo','p03-painel-atacado','p04-painel-loja','p05-painel-publicacao'],
 'O painel é onde o dono mexe na loja sem programar. Na aba Produtos ele muda preço e promoção direto na tabela, e o campo alterado fica destacado. Antes de publicar, a loja aberta no mesmo navegador mostra o rascunho com um aviso de prévia. As outras abas cuidam das regras do varejo e do atacado, dos dados da loja, como Pix e horário, e da publicação.','Caio');
{const s=novo();tit(s,'Protótipo — no celular');rod(s,1,ROD_T);const fs=['m01-inicio','m02-catalogo','m03-carrinho','m04-atacado'];
 const h=3.7,w=h*390/844,gx=0.5,tot=fs.length*w+(fs.length-1)*gx,x0=(10-tot)/2,Y=1.0;
 fs.forEach((f,i)=>{const x=x0+i*(w+gx);
   s.addShape(pres.shapes.ROUNDED_RECTANGLE,{x:x-0.06,y:Y-0.06,w:w+0.12,h:h+0.12,rectRadius:0.12,fill:{color:NAVY},line:{color:NAVY}});
   s.addImage({path:IMG(f),x,y:Y,w,h});
   txt(s,curtoT(f),{x:x-0.2,y:Y+h+0.14,w:w+0.4,h:0.28,fontSize:12,bold:true,color:NAVY,align:'center'});});
 s.addNotes(`${quem('Vitor (diagramas)')}\nO protótipo foi pensado primeiro para o celular, que é onde o consumidor compra. A navegação desce para uma barra fixa ao alcance do polegar, o catálogo vira duas colunas e todo botão tem no mínimo 44 pixels de altura. O carrinho ocupa a tela inteira e avisa quanto falta para o pedido mínimo, e o atacado mostra um produto por linha.`);}

/* 18 banco de dados */
marcaInicio('er');
{const s=novo();tit(s,'Banco de dados — diagrama ER');rod(s,1,'Estrutura do banco de dados (diagrama ER)');const [w,h]=fit('er',5.4,4.2);img(s,'er',0.45,0.98,w,h);
 const x=0.45+w+0.35;
 txt(s,'12',{x,y:1.0,w:1.2,h:0.8,fontSize:48,bold:true,color:PINKD});txt(s,'entidades · MySQL 8',{x:x+1.1,y:1.25,w:9.5-x-1.1,h:0.4,fontSize:13,color:GREY});
 txt(s,[{text:'Pedido → itens → produto',options:{bullet:true,breakLine:true}},{text:'Pagamento 1:1 com o pedido',options:{bullet:true,breakLine:true}},{text:'Endereço nulo = retirada no balcão',options:{bullet:true,breakLine:true}},{text:'Item guarda o preço do momento da compra',options:{bullet:true,breakLine:true}},{text:'Regras, horário e faixas de atacado no banco, editáveis pelo painel',options:{bullet:true,breakLine:true}},{text:'Chaves primárias, estrangeiras e cardinalidades no diagrama; dicionário de dados na seção 7',options:{bullet:true}}],
   {x,y:1.95,w:9.55-x,h:3.2,fontSize:12,color:NAVY,paraSpaceAfter:6});
 s.addNotes(`${quem('João Vitor')}\nO banco é MySQL, com doze entidades. O núcleo é usuário, pedido, item do pedido e produto. Cada pedido tem pelo menos um item, e o item guarda o preço do momento da compra, para que mudar o preço depois não altere pedidos antigos.\nPagamento é um para um com o pedido. O endereço é opcional no pedido, porque retirada no balcão não tem endereço.\nEmbaixo fica a configuração da loja: horário, regras de venda do varejo e do atacado e as faixas de desconto por volume. Tudo isso é editado pelo painel. O dicionário de dados está na seção 7 do documento.`);}

/* 19 cronograma */
marcaInicio('crono');
{const s=novo();tit(s,'Cronograma de execução');rod(s,1,'Cronograma de execução das atividades');
 const ativ=['Protótipo navegável, fotos, Pix, CEP, WhatsApp e testes','Escopo, casos de uso, requisitos, telas, ER e cronograma','Express, MySQL, CRUD de produtos e cadastro de usuário','React + Bootstrap, pedido no banco e painel de pedidos','Login JWT, busca, atacado, Pix e baixa de estoque','Hospedagem, testes, usabilidade e relatório final'];
 const quemS=['Equipe','Todos · Christian','Vitor Custodio, João Vitor','Caio, Vitor','Back e Front','Todos · Christian'];
 const sp=C.sprints;const w=1.43,g=0.08,y=1.0;
 s.addShape(pres.shapes.LINE,{x:0.5,y:y+2.5,w:9.0,h:0,line:{color:NAVY,width:2}});
 sp.forEach(([nome,per,,,marco],i)=>{const x=0.5+i*(w+g);const feito=i===0,entrega=/ENTREGA/.test(marco);
   card(s,x,y,w,2.3,feito?'E6F5F2':LIGHT);
   txt(s,nome.split(' — ')[0],{x:x+0.1,y:y+0.1,w:w-0.2,h:0.25,fontSize:11.5,bold:true,color:PINKD});
   txt(s,nome.split(' — ')[1],{x:x+0.1,y:y+0.36,w:w-0.2,h:0.45,fontSize:10.5,bold:true,color:NAVY});
   txt(s,per,{x:x+0.1,y:y+0.82,w:w-0.2,h:0.2,fontSize:8.5,color:GREY});
   txt(s,ativ[i],{x:x+0.1,y:y+1.08,w:w-0.2,h:0.8,fontSize:9,color:NAVY});
   txt(s,quemS[i],{x:x+0.1,y:y+1.92,w:w-0.2,h:0.3,fontSize:8.5,italic:true,color:'00796B'});
   s.addShape(pres.shapes.OVAL,{x:x+w/2-0.09,y:y+2.41,w:0.18,h:0.18,fill:{color:entrega?PINKD:NAVY},line:{color:WHITE,width:1.5}});
   if(entrega){const m=marco.match(/ENTREGA \d/)[0];card(s,x+0.05,y+2.72,w-0.1,0.42,PINKD);txt(s,m,{x:x+0.05,y:y+2.72,w:w-0.1,h:0.42,fontSize:11.5,bold:true,color:WHITE,align:'center',valign:'middle'});
     txt(s,{'ENTREGA 1':'Plano · 29/09','ENTREGA 2':'MVP · 03/11','ENTREGA 3':'Final · 26/11'}[m],{x,y:y+3.17,w,h:0.25,fontSize:10,color:NAVY,align:'center'});}
   if(feito){txt(s,'concluída',{x,y:y+2.78,w,h:0.3,fontSize:10,bold:true,color:'00897B',align:'center'});}});
 card(s,0.5,4.55,9.0,0.55,LIGHT);
 txt(s,[{text:'Calendário da disciplina  ',options:{bold:true,color:NAVY}},{text:'01/09 temas e equipes · 03/09 Prova 1 · 24/09 Prova 2 · 03/12 2ª chamada · 08/12 último dia de aula · uma issue no GitHub por requisito',options:{color:GREY}}],{x:0.7,y:4.55,w:8.7,h:0.55,fontSize:9.5,valign:'middle'});
 s.addNotes(`${quem('Christian')}\nO cronograma segue o calendário da disciplina e tem seis sprints, cada uma com atividades, responsáveis e marco. A Sprint 0, de 2 a 25 de setembro, começou logo depois da definição das equipes e já está concluída: é o protótipo que mostramos. A Sprint 1 é este planejamento, que fecha hoje, 29 de setembro, na Entrega 1.\nAs Sprints 2 e 3, de 30 de setembro a 3 de novembro, constroem o MVP: primeiro a base do back-end com MySQL e CRUD, com Vitor Custodio e João Vitor; depois a interface em React integrada à API, com Caio e Vitor. Elas fecham na Entrega 2, em 3 de novembro. A Sprint 4 traz as funcionalidades avançadas e a Sprint 5 a hospedagem, os testes e o relatório final, que fecham na Entrega 3, em 26 de novembro.\nCada requisito vira uma issue no GitHub, para acompanhar o andamento de cada sprint.`);}

/* 20 equipe */
marcaInicio('equipe');
{const s=novo();tit(s,'Divisão da equipe');rod(s,2,'Divisão da equipe escolhida para o desenvolvimento inicial');
 const icp={'Back-end':'FaServer','Front-end':'FaCode','Documentação':'FaClipboardList'};
 const resumo={'Back-end':'Node.js + Express, MySQL, API, login e regras de preço, frete e estoque','Front-end':'React + Bootstrap, telas e consumo da API · Vitor também nos diagramas e wireframes','Documentação':'Plano de Trabalho, relatórios, checklist e andamento das sprints'};
 C.papeis.forEach(([area,nomes],i)=>{const x=0.5+i*3.07;card(s,x,1.0,2.85,2.55);circ(s,icp[area],x+0.25,1.18,0.55,i===1?NAVY:PINKD);
   txt(s,area,{x:x+0.95,y:1.25,w:1.8,h:0.4,fontSize:16,bold:true,color:NAVY,valign:'middle'});
   txt(s,nomes,{x:x+0.25,y:1.9,w:2.4,h:0.5,fontSize:12.5,bold:true,color:PINKD});
   txt(s,resumo[area],{x:x+0.25,y:2.45,w:2.4,h:1.0,fontSize:11,color:GREY});});
 txt(s,'Funções sugeridas no enunciado → quem cobre',{x:0.5,y:3.7,w:9,h:0.25,fontSize:11,bold:true,color:NAVY});
 [['Desenvolvedor Front-end','Caio e Vitor'],['Desenvolvedor Back-end','Vitor Custodio e João Vitor'],['Designer UX/UI','Vitor: wireframes e diagramas'],['Gerente de Projeto','Christian: cronograma e relatórios; integração pelas duas frentes']].forEach(([f,q],i)=>{const x=0.5+i*2.3;card(s,x,4.02,2.1,1.1,'FFE9F1');
   txt(s,f,{x:x+0.15,y:4.12,w:1.85,h:0.25,fontSize:10,bold:true,color:PINKD});txt(s,q,{x:x+0.15,y:4.4,w:1.85,h:0.65,fontSize:10,color:NAVY});});
 s.addNotes(`${quem('Christian')}\nSomos cinco, em três frentes. No back-end, Vitor Custodio e João Vitor: servidor Node com Express, banco MySQL, autenticação e as regras de preço, frete e estoque. No front-end, Caio e Vitor: a interface em React com Bootstrap e a ligação com a API; o Vitor também faz os diagramas e os wireframes. Eu, Christian, cuido da documentação: o plano, os relatórios das próximas entregas e o registro do andamento de cada sprint.\nEmbaixo está como cobrimos as quatro funções que o enunciado sugere: front-end com Caio e Vitor, back-end com Vitor Custodio e João Vitor, design com o Vitor, e a gerência do cronograma comigo, com a integração entre front e back feita pelas duas frentes juntas.`);}

/* 21 funcionalidades básicas */
marcaInicio('basicas');
{const s=novo();tit(s,'Funcionalidades básicas');rod(s,2,'Funcionalidades básicas do desenvolvimento inicial');
 txt(s,'MVP da Entrega 2 (03/11): interface responsiva e CRUD integrado ao banco, como pede a Etapa 2.',{x:0.5,y:0.97,w:9,h:0.3,fontSize:12,color:GREY});
 const icb=['FaUserPlus','FaListUl','FaShoppingCart','FaMapMarkerAlt','FaWhatsapp','FaBoxes','FaClipboardList'];
 const nomes=['Aviso 18+ e cadastro CPF/CNPJ','Catálogo lido do banco','Carrinho','Entrega pelo CEP','Finalizar pedido e enviar ao WhatsApp','Painel: CRUD de produtos','Painel: lista de pedidos e status'];
 C.basicas.forEach((b,i)=>{const col=i<4?0:1,row=i<4?i:i-4,x=0.5+col*4.6,y=1.4+row*0.93;card(s,x,y,4.4,0.8);circ(s,icb[i],x+0.18,y+0.15,0.5,NAVY);
   txt(s,nomes[i],{x:x+0.85,y:y+0.1,w:3.4,h:0.3,fontSize:12.5,bold:true,color:NAVY});
   const novoItem=b[2]==='Não';txt(s,(novoItem?'Novo · ':'No protótipo ✓ · ')+b[1],{x:x+0.85,y:y+0.44,w:3.4,h:0.26,fontSize:10.5,bold:true,color:novoItem?PINKD:'00897B'});});
 txt(s,'Depois do MVP (Entrega 3): login com token, busca e filtro, atacado, Pix, cupom e histórico.',{x:5.1,y:4.3,w:4.4,h:0.6,fontSize:11.5,color:GREY,italic:true});
 s.addNotes(`${quem('Caio')}\nPara o desenvolvimento inicial, o MVP da Entrega 2, escolhemos o que o enunciado pede nessa etapa: interface responsiva e CRUD integrado ao banco.\nSão sete funcionalidades: aviso de maioridade e cadastro, catálogo lido do banco, carrinho, entrega pelo CEP, finalizar pedido gravando no banco e enviando ao WhatsApp, CRUD de produtos no painel e a lista de pedidos com status.\nSeis já existem no protótipo; o que muda é que passam a gravar no MySQL pela API. A lista de pedidos é nova. Login com token, busca, atacado e Pix ficam para a Entrega 3, como pede o enunciado da Etapa 3.`);}

/* 22 arquitetura */
marcaInicio('arq');
{const s=novo();tit(s,'Arquitetura adotada');rod(s,2,'Breve explicação da arquitetura adotada');const [w,h]=fit('arq',9.0,3.08);img(s,'arq',(10-w)/2,0.95,w,h);
 const y0=0.95+h+0.12;txt(s,'Um pedido, de ponta a ponta',{x:0.5,y:y0,w:9,h:0.25,fontSize:11,bold:true,color:NAVY});
 const passos=['React envia POST /api/pedidos com o token','Express confere o login e recalcula preço e frete','MySQL grava pedido e itens e baixa o estoque, numa transação','A resposta volta e o resumo segue para o WhatsApp'];
 const bw=2.05,bg=0.265;passos.forEach((t,i)=>{const x=0.5+i*(bw+bg),y=y0+0.3;card(s,x,y,bw,0.72,i===2?'FFE9F1':LIGHT);
   txt(s,String(i+1),{x:x+0.12,y:y+0.1,w:0.3,h:0.5,fontSize:20,bold:true,color:PINKD});
   txt(s,t,{x:x+0.45,y:y+0.06,w:bw-0.55,h:0.6,fontSize:9.5,color:NAVY,valign:'middle'});
   if(i<3) txt(s,'→',{x:x+bw,y:y+0.18,w:bg,h:0.35,fontSize:14,bold:true,color:GREY,align:'center'});});
 s.addNotes(`${quem('Vitor Custodio')}\nA arquitetura tem três camadas. O front-end em React roda no navegador e só conversa com a API. A API em Node e Express concentra as regras de negócio e é a única que acessa o MySQL. A comunicação é REST com JSON, e depois do login cada chamada leva o token JWT.\nEmbaixo, um pedido de ponta a ponta: o React envia o pedido para a API com o token; o Express confere o login e recalcula preço e frete, sem confiar no valor do navegador; o MySQL grava o pedido e os itens e baixa o estoque numa transação só; e a resposta volta, com o resumo seguindo para o WhatsApp da loja.\nViaCEP e WhatsApp são chamados pelo navegador. O front vai para a Vercel; o provedor da API e do banco escolhemos na Sprint 5.`);}

/* 23 encerramento */
{const s=novo(true);
 txt(s,'Obrigado!',{x:0.5,y:0.9,w:9,h:0.9,fontSize:44,bold:true,color:WHITE});
 txt(s,'Perguntas?',{x:0.5,y:1.8,w:9,h:0.5,fontSize:20,color:CYAN});
 [['ENTREGA 2 · 03/11','MVP: React + API + MySQL, com CRUD e o pedido gravado no banco'],['ENTREGA 3 · 26/11','Sistema completo, hospedado na nuvem, com relatório final']].forEach(([t,d],i)=>{const x=0.5+i*4.6;
   s.addShape(pres.shapes.ROUNDED_RECTANGLE,{x,y:2.65,w:4.4,h:1.0,rectRadius:0.08,fill:{color:'1C1C3A'},line:{color:'2E2E55'}});
   txt(s,t,{x:x+0.25,y:2.78,w:3.9,h:0.28,fontSize:11,bold:true,color:PINK,charSpacing:1});txt(s,d,{x:x+0.25,y:3.1,w:3.9,h:0.5,fontSize:12,color:WHITE});});
 txt(s,[{text:'Protótipo  ',options:{bold:true,color:PINK}},{text:C.prototipo,options:{color:WHITE,breakLine:true}},{text:'Repositório  ',options:{bold:true,color:PINK}},{text:C.repo,options:{color:WHITE}}],{x:0.5,y:3.95,w:9,h:0.7,fontSize:12,paraSpaceAfter:5});
 txt(s,'Equipe: '+C.equipe,{x:0.5,y:4.85,w:9,h:0.3,fontSize:11,color:'B8B9CC'});
 s.addNotes(`${quem('Christian')}\nEsse é o nosso plano. Os próximos passos são o MVP, em 3 de novembro, com React, API e banco MySQL funcionando juntos, e o sistema completo, hospedado e com relatório, em 26 de novembro. O protótipo está no ar no endereço do slide e todo o código está no repositório. Obrigado, ficamos à disposição para perguntas.`);}

/* preenche o roteiro com os números reais dos slides */
{const s=roteiro;
 const faixa=(a,b)=>a===b-1||b===undefined?`${a}`:`${a}–${b-1}`;
 const I1=[['Escopo do sistema: funcionalidade principal, público-alvo e tecnologias utilizadas',faixa(INICIO.escopo,INICIO.uc)],['Diagramas de Caso de Uso (Principais Fluxos)',faixa(INICIO.uc,INICIO.req)],['Requisitos Funcionais e Não Funcionais',faixa(INICIO.req,INICIO.telas)],['Wireframes e protótipos das telas principais',faixa(INICIO.telas,INICIO.er)],['Banco de dados: diagrama ER',faixa(INICIO.er,INICIO.crono)],['Cronograma de execução das atividades',faixa(INICIO.crono,INICIO.equipe)]];
 const I2=[['Divisão da equipe escolhida para o desenvolvimento inicial',faixa(INICIO.equipe,INICIO.basicas)],['Funcionalidades básicas',faixa(INICIO.basicas,INICIO.arq)],['Breve explicação da arquitetura adotada',String(INICIO.arq)]];
 const bloco=(tit2,itens,x,w,cor)=>{card(s,x,1.0,w,4.1,cor);txt(s,tit2,{x:x+0.25,y:1.15,w:w-0.5,h:0.35,fontSize:15,bold:true,color:PINKD});
   itens.forEach(([t,sl],i)=>{const y=1.62+i*0.56;txt(s,t,{x:x+0.25,y,w:w-1.25,h:0.5,fontSize:11.5,color:NAVY,valign:'middle'});
     txt(s,'slide '+sl,{x:x+w-0.95,y,w:0.75,h:0.5,fontSize:9.5,bold:true,color:GREY,align:'right',valign:'middle'});});};
 bloco('1 · Planejamento do Projeto',I1,0.5,5.3,LIGHT);bloco('2 · Apresentação',I2,6.0,3.5,'FFE9F1');
 txt(s,'Na ordem da Etapa 1 do enunciado (Plano de Trabalho: Projeto Inicial)',{x:0.5,y:5.22,w:9,h:0.25,fontSize:9,italic:true,color:GREY});
 s.addNotes(`${quem('Christian')}\nA apresentação segue a ordem do enunciado da Etapa 1. Na primeira parte, o planejamento do projeto: escopo, com funcionalidade principal, público-alvo e tecnologias; casos de uso com os principais fluxos; requisitos funcionais e não funcionais; o protótipo das telas; o diagrama ER do banco; e o cronograma. Na segunda, o que o enunciado pede para a apresentação: a divisão da equipe, as funcionalidades básicas do desenvolvimento inicial e a arquitetura adotada.`);}

await pres.writeFile({fileName:path.join(__dirname,'..','Entrega1_Apresentacao_ZeroGrau.pptx')});console.log('slides',n,JSON.stringify(INICIO));
})();
