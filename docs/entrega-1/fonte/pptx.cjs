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
const quem=p=>`[${p} — nome: ${P}]`;

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
 txt(s,[{text:'Disciplina: ',options:{bold:true}},{text:P,options:{breakLine:true}},{text:'Professor(a): ',options:{bold:true}},{text:P,options:{breakLine:true}},{text:'Equipe: ',options:{bold:true}},{text:P,options:{breakLine:true}},{text:'Data: ',options:{bold:true}},{text:'29/09/2026'}],
   {x:0.5,y:4.0,w:4.6,h:1.1,fontSize:11,color:'B8B9CC',paraSpaceAfter:3});
 s.addNotes(`${quem('Gerente de Projeto')}\nBoa noite. Somos a equipe ${P} e vamos apresentar o Plano de Trabalho do nosso trabalho final: o Zero Grau, um sistema web de pedidos para uma distribuidora de bebidas de Fortaleza, que vende tanto para quem consome quanto para quem revende.\nNa apresentação passamos por escopo, casos de uso, requisitos, telas, banco de dados, arquitetura, equipe e cronograma. A imagem ao lado é o protótipo que já está no ar.`);}

/* 2 problema e escopo */
{const s=novo();tit(s,'Problema e escopo');
 txt(s,'Dois públicos, um só estoque',{x:0.5,y:1.1,w:4.3,h:0.5,fontSize:20,bold:true,color:PINKD});
 txt(s,[{text:'Consumidor quer a unidade, gelada, entregue rápido.',options:{bullet:true,breakLine:true}},{text:'Revendedor quer caixa fechada e preço de atacado.',options:{bullet:true,breakLine:true}},{text:'Sem sistema: preço, estoque e frete informados à mão e nenhum registro dos pedidos.',options:{bullet:true}}],
   {x:0.5,y:1.7,w:4.2,h:2.2,fontSize:14,color:NAVY,paraSpaceAfter:8});
 card(s,5.1,1.1,4.4,4.0,LIGHT);
 txt(s,'FUNCIONALIDADE PRINCIPAL',{x:5.4,y:1.3,w:3.9,h:0.3,fontSize:11,bold:true,color:PINKD,charSpacing:2});
 txt(s,'Pedido online em duas vitrines: CPF compra no varejo, CNPJ compra no atacado.',{x:5.4,y:1.65,w:3.9,h:0.7,fontSize:15,bold:true,color:NAVY});
 const passos=[['FaUserPlus','Cadastro com CPF ou CNPJ'],['FaListUl','Catálogo e carrinho'],['FaMapMarkerAlt','Entrega calculada pelo CEP'],['FaQrcode','Pix no site ou pagamento na entrega'],['FaWhatsapp','Pedido gravado e enviado ao WhatsApp'],['FaTools','Painel: produtos, regras e pedidos']];
 passos.forEach(([ic,t],i)=>{const y=2.5+i*0.42;circ(s,ic,5.4,y,0.32);txt(s,t,{x:5.85,y:y+0.02,w:3.5,h:0.3,fontSize:12,color:NAVY,valign:'middle'});});
 s.addNotes(`${quem('Gerente de Projeto')}\nO problema real: a distribuidora atende dois públicos com necessidades opostas. O consumidor quer uma unidade gelada entregue rápido; o revendedor quer caixa fechada com preço de atacado. Os dois disputam o mesmo estoque.\nSem sistema, preço, estoque e taxa de entrega são informados à mão e os pedidos não ficam registrados.\nA funcionalidade principal é o pedido online em duas vitrines: quem se cadastra com CPF compra no varejo; com CNPJ, no atacado. O fluxo vai do cadastro ao pedido gravado no banco e enviado ao WhatsApp da loja, e o dono mantém tudo por um painel.`);}

/* 3 público-alvo */
{const s=novo();tit(s,'Público-alvo');
 const P3=[['FaUser','Consumidor final','CPF · loja de varejo','Maior de 18 anos, na área de entrega. Compra por unidade, quase sempre pelo celular.'],
   ['FaStore','Revendedor','CNPJ · balcão de atacado','Comércio que revende bebidas. Caixa fechada, desconto de revenda e pedido mínimo próprio.'],
   ['FaUserCog','Administrador','Dono ou equipe da loja','Mantém catálogo, preços, estoque, regras, horário e Pix, e acompanha os pedidos.']];
 P3.forEach(([ic,t,sub,d],i)=>{const x=0.5+i*3.07;card(s,x,1.25,2.85,3.6);circ(s,ic,x+0.3,1.5,0.7,i===2?NAVY:PINKD);
   txt(s,t,{x:x+0.3,y:2.4,w:2.3,h:0.4,fontSize:18,bold:true,color:NAVY});
   txt(s,sub,{x:x+0.3,y:2.82,w:2.3,h:0.3,fontSize:12,bold:true,color:PINKD});
   txt(s,d,{x:x+0.3,y:3.25,w:2.3,h:1.4,fontSize:12.5,color:GREY});});
 s.addNotes(`${quem('Designer UX/UI')}\nSão três públicos. O consumidor final, maior de 18 anos e dentro da área de entrega, que compra por unidade e quase sempre pelo celular; por isso o layout é pensado primeiro para o celular.\nO revendedor, identificado pelo CNPJ, que compra por caixa fechada, com desconto de revenda e um pedido mínimo próprio. Para ele a tela é uma tabela mais sóbria.\nE o administrador, o dono da distribuidora, que precisa mudar preço, estoque e promoção sem depender de programador.`);}

/* 4 tecnologias */
{const s=novo();tit(s,'Tecnologias');
 const T=[['FaReact','Front-end','HTML · JavaScript','React + Bootstrap 5','Componentes reaproveitados nas duas lojas e no painel; grade responsiva pronta.'],
   ['FaNodeJs','Back-end','Node.js + Express','bcrypt + JWT','Mesma linguagem do front; API REST com login por token.'],
   ['FaDatabase','Banco de dados','MySQL 8','Sequelize (ORM)','Pedido → itens → produto é relacional; transação ao baixar estoque.']];
 T.forEach(([ic,t,a,b,d],i)=>{const x=0.5+i*3.07;card(s,x,1.1,2.85,3.05);circ(s,ic,x+0.25,1.3,0.55);
   txt(s,t,{x:x+0.95,y:1.4,w:1.8,h:0.35,fontSize:16,bold:true,color:NAVY,valign:'middle'});
   txt(s,a,{x:x+0.25,y:2.05,w:2.4,h:0.3,fontSize:14,bold:true,color:PINKD});
   txt(s,b,{x:x+0.25,y:2.37,w:2.4,h:0.3,fontSize:13,bold:true,color:NAVY});
   txt(s,d,{x:x+0.25,y:2.8,w:2.4,h:0.9,fontSize:11.5,color:GREY});
   txt(s,'✔ exigido no enunciado',{x:x+0.25,y:3.75,w:2.4,h:0.25,fontSize:10.5,bold:true,color:'00897B'});});
 card(s,0.5,4.35,9.0,0.8,NAVY);
 txt(s,[{text:'Integrações  ',options:{bold:true,color:CYAN}},{text:'ViaCEP · WhatsApp · Pix BR Code    ',options:{color:WHITE}},{text:'Qualidade  ',options:{bold:true,color:CYAN}},{text:'GitHub Actions · Playwright    ',options:{color:WHITE}},{text:'Hospedagem  ',options:{bold:true,color:CYAN}},{text:'Vercel',options:{color:WHITE}}],
   {x:0.7,y:4.35,w:8.7,h:0.8,fontSize:11,valign:'middle'});
 s.addNotes(`${quem('Desenvolvedor Front-end')} (front-end) e ${quem('Desenvolvedor Back-end')} (back-end e banco)\nFront-end: HTML, JavaScript, React e Bootstrap, exatamente o que o enunciado pede. React porque as duas lojas e o painel repetem componentes, como o card do produto e o carrinho; Bootstrap pela grade responsiva.\nBack-end: Node.js com Express, a mesma linguagem do front. A senha é guardada com bcrypt e a sessão usa token JWT.\nBanco: MySQL. Os dados são relacionais, pedido tem itens e itens apontam para produtos, e precisamos de transação para não vender o que não existe no estoque.\nAs integrações com ViaCEP, WhatsApp e Pix já funcionam no protótipo. Front-end hospedado na Vercel, como sugere o enunciado.`);}

/* 5 e 6 casos de uso */
{const s=novo();tit(s,'Casos de uso — loja');const [w,h]=fit('uc-loja',6.3,4.5);img(s,'uc-loja',0.4,0.95,w,h);
 const x=0.4+w+0.3;txt(s,[{text:'Atores',options:{bold:true,color:PINKD,breakLine:true}},{text:'Cliente, especializado em Consumidor (CPF) e Revendedor (CNPJ)',options:{breakLine:true}},{text:' ',options:{breakLine:true}},
   {text:'Sistemas externos',options:{bold:true,color:PINKD,breakLine:true}},{text:'ViaCEP e WhatsApp',options:{breakLine:true}},{text:' ',options:{breakLine:true}},
   {text:'«include»',options:{bold:true,color:PINKD}},{text:' sempre executa',options:{breakLine:true}},{text:'«extend»',options:{bold:true,color:'00897B'}},{text:' opcional'}],
   {x,y:1.3,w:9.6-x,h:3.5,fontSize:12,color:NAVY});
 s.addNotes(`${quem('Designer UX/UI')}\nNa loja o ator é o Cliente, que se especializa em Consumidor, com CPF, e Revendedor, com CNPJ.\nSão seis casos principais: criar conta, entrar, consultar catálogo, montar carrinho, finalizar pedido e consultar meus pedidos.\nFinalizar pedido sempre inclui calcular a entrega pelo CEP, que consulta o ViaCEP, registrar o pedido e enviar ao WhatsApp. Pagar com Pix é uma extensão opcional. Comprar por caixa fechada estende o carrinho, e é o que muda para o revendedor.\nO documento descreve os seis fluxos passo a passo, com fluxos alternativos, como CEP fora do raio e loja fechada.`);}
{const s=novo();tit(s,'Casos de uso — painel');const [w,h]=fit('uc-painel',6.3,4.4);img(s,'uc-painel',0.4,1.05,w,h);
 const x=0.4+w+0.3;txt(s,[{text:'Administrador',options:{bold:true,color:PINKD,breakLine:true}},{text:'5 casos principais',options:{breakLine:true}},{text:' ',options:{breakLine:true}},
   {text:'Gerenciar pedidos',options:{bold:true,color:PINKD,breakLine:true}},{text:'recebido → confirmado → em preparo → saiu → entregue',options:{breakLine:true}},{text:' ',options:{breakLine:true}},{text:'Estoque atualizado a cada pedido'}],
   {x,y:1.3,w:9.6-x,h:3.5,fontSize:12,color:NAVY});
 s.addNotes(`${quem('Designer UX/UI')}\nNo painel o ator é o administrador. Ele entra com perfil de administrador e tem cinco casos principais: gerenciar produtos, com envio de foto; configurar as regras de venda do varejo e do atacado, incluindo cupom e faixas por volume; configurar os dados da loja, como chave Pix e horário; e gerenciar pedidos.\nAo gerenciar pedidos ele muda o status, de recebido até entregue, e o estoque é atualizado.`);}

/* 7 requisitos */
{const s=novo();tit(s,'Requisitos');
 const e2=C.rf.filter(r=>r[4]==='E2').length;
 [[String(C.rf.length),'requisitos funcionais'],[String(C.rnf.length),'não funcionais'],[String(e2),'entram no MVP']].forEach(([v,l],i)=>{const y=1.1+i*1.35;
   txt(s,v,{x:0.5,y,w:1.5,h:0.85,fontSize:54,bold:true,color:i===2?PINKD:NAVY,valign:'middle'});txt(s,l,{x:2.05,y:y+0.2,w:1.9,h:0.5,fontSize:13,color:GREY,valign:'middle'});});
 card(s,4.2,1.1,5.3,2.55);
 txt(s,'MVP (Entrega 2)',{x:4.45,y:1.25,w:4.8,h:0.3,fontSize:13,bold:true,color:PINKD});
 const curto={RF01:'Aviso 18+',RF02:'Cadastro CPF/CNPJ',RF04:'Loja pelo documento',RF05:'Catálogo do banco',RF07:'Carrinho',RF08:'Entrega pelo CEP',RF10:'Finalizar pedido',RF12:'Pedido no WhatsApp',RF16:'CRUD de produtos',RF19:'Lista de pedidos'};
 const ids=C.rf.filter(r=>r[4]==='E2').map(r=>r[0]);
 ids.forEach((id,i)=>{const col=i%2,row=Math.floor(i/2);txt(s,[{text:id+'  ',options:{bold:true,color:PINKD}},{text:curto[id]||id,options:{color:NAVY}}],{x:4.45+col*2.5,y:1.65+row*0.37,w:2.45,h:0.3,fontSize:11.5});});
 card(s,4.2,3.85,5.3,1.3);
 txt(s,'Não funcionais',{x:4.45,y:3.98,w:4.8,h:0.3,fontSize:13,bold:true,color:PINKD});
 txt(s,'Responsivo · Acessível (WCAG AA) · Senha em hash e HTTPS · Total recalculado no servidor · Venda só a maiores de 18 · LGPD · Imagens leves',{x:4.45,y:4.3,w:4.85,h:0.8,fontSize:11.5,color:NAVY});
 s.addNotes(`${quem('Desenvolvedor Back-end')}\nLevantamos ${C.rf.length} requisitos funcionais e ${C.rnf.length} não funcionais; a tabela completa está nas seções 4 e 5 do documento, com prioridade, caso de uso e em qual entrega cada um fica pronto.\nDez entram no MVP da Entrega 2: aviso de maioridade, cadastro, direcionamento pela loja do documento, catálogo lido do banco, carrinho, entrega pelo CEP, finalizar pedido, envio ao WhatsApp, CRUD de produtos e lista de pedidos.\nNos não funcionais destaco dois: o total é sempre recalculado no servidor, porque não se confia no preço que vem do navegador, e a venda de bebida alcoólica só para maiores de 18, exigência do ECA.`);}

/* 8-10 wireframes */
const wf=[[0,1,2],[3,4,5],[6,7,8]];
const falas=[
 `Estas são telas do protótipo navegável que já está no ar, que serve de wireframe de alta fidelidade. A porta pede primeiro a confirmação de maioridade e depois só e-mail e senha; o CPF ou CNPJ é pedido uma vez, em Criar conta, e decide a loja. A tela de início mostra se a loja está aberta, a taxa de entrega e o pedido mínimo antes do catálogo.`,
 `No catálogo o cliente busca, filtra por categoria e adiciona ao carrinho. O carrinho mostra subtotal, cupom e total. No fechamento o CEP preenche a rua pelo ViaCEP, o sistema calcula a entrega e o cliente escolhe entre pagar pelo site ou enviar o pedido pelo WhatsApp e pagar na entrega.`,
 `O Pix gera QR code e copia e cola com o valor exato do pedido. O atacado é uma tabela por caixa fechada, com preço por unidade e por caixa. E o painel edita produtos, fotos e as regras das duas lojas. Na Etapa 2 essas telas são refeitas em React com Bootstrap, com a mesma estrutura.`];
for(let k=0;k<3;k++){const s=novo();tit(s,`Protótipo das telas (${k+1}/3)`);
 wf[k].forEach((ti,i)=>{const [f,t,obj]=C.telas[ti];const x=0.5+i*3.07,w=2.85,h=w*800/1280,Y=1.35;
   s.addShape(pres.shapes.RECTANGLE,{x:x-0.02,y:Y-0.02,w:w+0.04,h:h+0.04,fill:{color:NAVY},line:{color:NAVY}});
   s.addImage({path:IMG(f),x,y:Y,w,h});
   txt(s,t,{x,y:Y+h+0.18,w,h:0.55,fontSize:14,bold:true,color:NAVY});
   txt(s,obj,{x,y:Y+h+0.78,w,h:1.3,fontSize:12,color:GREY});});
 s.addNotes(`${quem('Designer UX/UI')}\n${falas[k]}`);}

/* 11 ER */
{const s=novo();tit(s,'Banco de dados');const [w,h]=fit('er',5.4,4.5);img(s,'er',0.45,0.95,w,h);
 const x=0.45+w+0.35;
 txt(s,'12',{x,y:1.05,w:1.2,h:0.8,fontSize:48,bold:true,color:PINKD});txt(s,'entidades · MySQL 8',{x:x+1.1,y:1.3,w:9.5-x-1.1,h:0.4,fontSize:13,color:GREY});
 txt(s,[{text:'Pedido → itens → produto',options:{bullet:true,breakLine:true}},{text:'Pagamento 1:1 com o pedido',options:{bullet:true,breakLine:true}},{text:'Endereço nulo = retirada no balcão',options:{bullet:true,breakLine:true}},{text:'Item guarda o preço do momento da compra',options:{bullet:true,breakLine:true}},{text:'Regras, horário e faixas de atacado no banco, editáveis pelo painel',options:{bullet:true}}],
   {x,y:2.05,w:9.55-x,h:3.0,fontSize:12,color:NAVY,paraSpaceAfter:6});
 s.addNotes(`${quem('Desenvolvedor Back-end')}\nO banco é MySQL, com doze entidades. O núcleo é usuário, pedido, item do pedido e produto. Cada pedido tem pelo menos um item, e o item guarda o preço do momento da compra, para que mudar o preço depois não altere pedidos antigos.\nPagamento é um para um com o pedido. O endereço é opcional no pedido, porque retirada no balcão não tem endereço.\nEmbaixo fica a configuração da loja: horário, regras de venda do varejo e do atacado e as faixas de desconto por volume. Tudo isso é editado pelo painel. O dicionário de dados está na seção 7.`);}

/* 12 arquitetura */
{const s=novo();tit(s,'Arquitetura');const [w,h]=fit('arq',9.0,3.35);img(s,'arq',(10-w)/2,1.0,w,h);
 const y=1.0+h+0.2;
 [['Preço calculado no servidor'],['Pedido e estoque na mesma transação'],['REST + JSON + token JWT']].forEach(([t],i)=>{const x=0.5+i*3.07;card(s,x,y,2.85,0.55,LIGHT);circ(s,'FaCheck',x+0.12,y+0.1,0.35,NAVY);txt(s,t,{x:x+0.55,y,w:2.25,h:0.55,fontSize:11.5,bold:true,color:NAVY,valign:'middle'});});
 s.addNotes(`${quem('Desenvolvedor Back-end')} e ${quem('Gerente de Projeto')}\nA arquitetura tem três camadas. O front-end em React roda no navegador e só conversa com a API. A API em Node e Express concentra as regras de negócio e é a única que acessa o MySQL. A comunicação é REST com JSON, e depois do login cada chamada leva o token JWT.\nDuas decisões importantes: o preço e o frete são recalculados no servidor, e o pedido e a baixa de estoque acontecem na mesma transação.\nViaCEP e WhatsApp são chamados pelo navegador. O front vai para a Vercel; o provedor da API e do banco escolhemos na Sprint 5.`);}

/* 13 equipe */
{const s=novo();tit(s,'Divisão da equipe');
 const icp={'Gerente de Projeto':'FaClipboardList','Desenvolvedor Front-end':'FaCode','Desenvolvedor Back-end':'FaServer','Designer UX/UI':'FaPalette'};
 const resumo={'Gerente de Projeto':'Cronograma, integração front ↔ back, apresentações e relatórios','Desenvolvedor Front-end':'Interface em React + Bootstrap e consumo da API','Desenvolvedor Back-end':'Servidor Express, MySQL, autenticação e regras de preço e estoque','Designer UX/UI':'Wireframes, identidade visual, acessibilidade e testes de usabilidade'};
 C.papeis.forEach(([papel],i)=>{const col=i%2,row=Math.floor(i/2),x=0.5+col*4.6,y=1.15+row*2.0;card(s,x,y,4.4,1.8);circ(s,icp[papel],x+0.25,y+0.3,0.6,i%2?NAVY:PINKD);
   txt(s,papel,{x:x+1.05,y:y+0.25,w:3.2,h:0.35,fontSize:15,bold:true,color:NAVY});
   txt(s,P,{x:x+1.05,y:y+0.62,w:3.2,h:0.3,fontSize:12,bold:true,color:PINKD});
   txt(s,resumo[papel],{x:x+1.05,y:y+0.97,w:3.2,h:0.7,fontSize:11.5,color:GREY});});
 s.addNotes(`${quem('Gerente de Projeto')}\nSeguimos os quatro papéis do enunciado. ${P} é o gerente de projeto: cuida do cronograma, integra front e back e conduz as apresentações. ${P} é o desenvolvedor front-end, com a interface em React e Bootstrap. ${P} é o desenvolvedor back-end, com o servidor Express, o MySQL, a autenticação e as regras de preço e estoque. ${P} é o designer UX/UI, responsável pelos wireframes, pela identidade visual e pelos testes de usabilidade.`);}

/* 14 funcionalidades básicas */
{const s=novo();tit(s,'Funcionalidades básicas do MVP');
 const icb=['FaUserPlus','FaListUl','FaShoppingCart','FaMapMarkerAlt','FaWhatsapp','FaBoxes','FaClipboardList'];
 const nomes=['Aviso 18+ e cadastro CPF/CNPJ','Catálogo lido do banco','Carrinho','Entrega pelo CEP','Finalizar pedido e enviar ao WhatsApp','Painel: CRUD de produtos','Painel: lista de pedidos e status'];
 C.basicas.forEach((b,i)=>{const col=i<4?0:1,row=i<4?i:i-4,x=0.5+col*4.6,y=1.15+row*0.98;card(s,x,y,4.4,0.82);circ(s,icb[i],x+0.18,y+0.16,0.5,NAVY);
   txt(s,nomes[i],{x:x+0.85,y:y+0.1,w:3.4,h:0.32,fontSize:12.5,bold:true,color:NAVY});
   const novoItem=b[2]==='Não';txt(s,(novoItem?'Novo · ':'No protótipo ✓ · ')+b[1],{x:x+0.85,y:y+0.45,w:3.4,h:0.28,fontSize:10.5,bold:true,color:novoItem?PINKD:'00897B'});});
 txt(s,'Depois do MVP (Entrega 3): login com token, busca e filtro, atacado, Pix, cupom, histórico.',{x:5.1,y:4.1,w:4.4,h:0.8,fontSize:11.5,color:GREY,italic:true});
 s.addNotes(`${quem('Desenvolvedor Front-end')}\nPara o desenvolvimento inicial, o MVP da Entrega 2, escolhemos o que o enunciado pede nessa etapa: interface responsiva e CRUD integrado ao banco.\nSão sete funcionalidades: aviso de maioridade e cadastro, catálogo lido do banco, carrinho, entrega pelo CEP, finalizar pedido gravando no banco e enviando ao WhatsApp, CRUD de produtos no painel e a lista de pedidos com status.\nSeis já existem no protótipo; o que muda é que passam a gravar no MySQL pela API. A lista de pedidos é nova. Login com token, busca, atacado e Pix ficam para a Entrega 3, como pede o enunciado da Etapa 3.`);}

/* 15 cronograma */
{const s=novo();tit(s,'Cronograma');
 const sp=C.sprints;const w=1.43,g=0.08,y=1.55;
 s.addShape(pres.shapes.LINE,{x:0.5,y:y+1.75,w:9.0,h:0,line:{color:NAVY,width:2}});
 sp.forEach(([nome,per,,,marco],i)=>{const x=0.5+i*(w+g);const feito=i===0,entrega=/ENTREGA/.test(marco);
   card(s,x,y,w,1.55,feito?'E6F5F2':LIGHT);
   txt(s,nome.split(' — ')[0],{x:x+0.1,y:y+0.1,w:w-0.2,h:0.28,fontSize:12,bold:true,color:PINKD});
   txt(s,nome.split(' — ')[1],{x:x+0.1,y:y+0.4,w:w-0.2,h:0.55,fontSize:11,bold:true,color:NAVY});
   txt(s,per,{x:x+0.1,y:y+0.98,w:w-0.2,h:0.5,fontSize:9.5,color:GREY});
   s.addShape(pres.shapes.OVAL,{x:x+w/2-0.09,y:y+1.66,w:0.18,h:0.18,fill:{color:entrega?PINKD:NAVY},line:{color:WHITE,width:1.5}});
   if(entrega){const m=marco.match(/ENTREGA \d/)[0];card(s,x+0.05,y+2.05,w-0.1,0.5,PINKD);txt(s,m,{x:x+0.05,y:y+2.05,w:w-0.1,h:0.5,fontSize:12,bold:true,color:WHITE,align:'center',valign:'middle'});
     txt(s,{'ENTREGA 1':'Plano · 29/09','ENTREGA 2':'MVP · 03/11','ENTREGA 3':'Final · 26/11'}[m],{x,y:y+2.6,w,h:0.3,fontSize:10.5,color:NAVY,align:'center'});}
   if(feito){txt(s,'concluída',{x,y:y+2.1,w,h:0.3,fontSize:10.5,bold:true,color:'00897B',align:'center'});}});
 txt(s,'Entregas: 29/09 · 03/11 · 26/11 · uma issue no GitHub por requisito · depois: 2ª chamada 03/12, fim das aulas 08/12',{x:0.5,y:4.85,w:9,h:0.3,fontSize:11,color:GREY});
 s.addNotes(`${quem('Gerente de Projeto')}\nO cronograma segue o calendário da disciplina e tem seis sprints. A Sprint 0, de 2 a 25 de setembro, começou logo depois da definição das equipes e já está concluída: é o protótipo que mostramos. A Sprint 1 é este planejamento, que fecha hoje, 29 de setembro, na Entrega 1.\nAs Sprints 2 e 3, de 30 de setembro a 3 de novembro, constroem o MVP: primeiro a base do back-end com MySQL e CRUD, depois a interface em React integrada à API. Elas fecham na Entrega 2, em 3 de novembro. A Sprint 4 traz as funcionalidades avançadas e a Sprint 5 a hospedagem, os testes e o relatório final, que fecham na Entrega 3, em 26 de novembro.\nCada requisito vira uma issue no GitHub, para acompanhar o andamento de cada sprint.`);}

/* 16 encerramento */
{const s=novo(true);
 txt(s,'Obrigado!',{x:0.5,y:1.3,w:9,h:0.9,fontSize:44,bold:true,color:WHITE});
 txt(s,'Perguntas?',{x:0.5,y:2.2,w:9,h:0.5,fontSize:20,color:CYAN});
 txt(s,[{text:'Protótipo  ',options:{bold:true,color:PINK}},{text:C.prototipo,options:{color:WHITE,breakLine:true}},{text:'Repositório  ',options:{bold:true,color:PINK}},{text:C.repo,options:{color:WHITE}}],{x:0.5,y:3.3,w:9,h:0.8,fontSize:13,paraSpaceAfter:6});
 txt(s,'Equipe: '+P,{x:0.5,y:4.6,w:9,h:0.3,fontSize:11,color:'B8B9CC'});
 s.addNotes(`${quem('Gerente de Projeto')}\nEsse é o nosso plano. O protótipo está no ar no endereço do slide e todo o código está no repositório. Obrigado, ficamos à disposição para perguntas.`);}

await pres.writeFile({fileName:path.join(__dirname,'..','Entrega1_Apresentacao_ZeroGrau.pptx')});console.log('slides',n);
})();
