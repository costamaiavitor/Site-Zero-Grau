# Entrega 1: checklist de conformidade e pendências

## Checklist de conformidade

| Item exigido | Seção do documento | Slide(s) | Status |
|---|---|---|---|
| Apresentação na ordem da Etapa 1 do enunciado (Planejamento do Projeto → Apresentação) | — | 2 (roteiro) e rodapé de cada slide | ✅ |
| Identificação | 1 (e capa) | 1, 23 | ✅ Unifor, Ciência da Computação, Desenvolvimento de Plataformas Web, prof. Francisco Estevão |
| Escopo: problema real | 2.1 | 3 | ✅ |
| Escopo: funcionalidade principal | 2.2 | 4 | ✅ |
| Escopo: público-alvo | 2.3 | 5 | ✅ |
| Escopo: tecnologias, com justificativa e aderência ao enunciado | 2.4 | 6 | ✅ |
| Diagramas de caso de uso (UML, atores, include/extend) | 3 (Figuras 1 e 2) | 7, 8 | ✅ |
| Descrição textual dos fluxos principais | 3 (6 fluxos) | 9 | ✅ |
| Requisitos funcionais (ID, descrição, prioridade) | 4 (RF01–RF21) | 10 | ✅ |
| Requisitos não funcionais (ID, categoria, descrição) | 5 (RNF01–RNF11) | 11 | ✅ |
| Wireframes/protótipos: uma imagem por tela, com legenda e objetivo | 6 (31 telas, Figuras 3–33) | 12 a 17 (varejo, atacado, painel e celular) | ✅ |
| Diagrama ER (entidades, atributos, PK/FK, cardinalidades) | 7 (Figura 34) | 18 | ✅ |
| Dicionário de dados resumido | 7 (Tabela 7) | — | ✅ |
| Arquitetura: front-end ↔ API ↔ banco | 8 (Figura 35 e rotas) | 22 | ✅ |
| Divisão da equipe | 9 | 20 | ✅ três frentes: Back-end (Vitor Custodio, João Vitor), Front-end (Caio, Vitor), Documentação (Christian) |
| Cronograma: sprints, atividades, responsáveis e marcos das Entregas 1, 2 e 3 | 10 (com as datas da disciplina) | 19 | ✅ Entregas em 29/09, 03/11 e 26/11/2026 |
| Funcionalidades básicas do desenvolvimento inicial | 11 | 21 | ✅ |
| Notas do apresentador (quem fala o quê) | — | 1–23 | ✅ com o nome de quem fala em cada slide |

## Pendências [PREENCHER]

Nenhuma. O documento e a apresentação não têm mais nenhum [PREENCHER].

## Decisões tomadas no plano (confirmar com a equipe)

- A equipe foi dividida em três frentes em vez dos quatro papéis que o enunciado sugere. O trabalho de Designer UX/UI (wireframes e diagramas) ficou com Vitor, no Front-end, e o acompanhamento do cronograma com a Documentação (Christian).

- Banco **MySQL 8 com Sequelize**, API **Node.js + Express**, **React (Vite) + Bootstrap 5**, login com **bcrypt + JWT**.
- Front-end na **Vercel**; o provedor da API e do banco fica para a Sprint 5.
- Divisão MVP × final: 10 requisitos na Entrega 2 (CRUD e banco); login com token, busca, filtro, atacado e Pix na Entrega 3, como pede o enunciado da Etapa 3.
- As telas da seção 6 são capturas do protótipo já publicado. Conta, preços, estoques, tempos e endereço da loja são dados de exemplo, e a tela do Pix usa uma chave de exemplo.
