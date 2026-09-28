# Entrega 1: checklist de conformidade e pendências

## Checklist de conformidade

| Item exigido | Seção do documento | Slide(s) | Status |
|---|---|---|---|
| Identificação | 1 (e capa) | 1, 16 | [PREENCHER] instituição, disciplina, professor(a), integrantes (data da Entrega 1 preenchida: 29/09/2026) |
| Escopo: problema real | 2.1 | 2 | ✅ (falta 1 dado da distribuidora, ver pendência 7) |
| Escopo: funcionalidade principal | 2.2 | 2 | ✅ |
| Escopo: público-alvo | 2.3 | 3 | ✅ |
| Escopo: tecnologias, com justificativa e aderência ao enunciado | 2.4 | 4 | ✅ |
| Diagramas de caso de uso (UML, atores, include/extend) | 3 (Figuras 1 e 2) | 5, 6 | ✅ |
| Descrição textual dos fluxos principais | 3 (6 fluxos) | notas dos slides 5 e 6 | ✅ |
| Requisitos funcionais (ID, descrição, prioridade) | 4 (RF01–RF21) | 7 | ✅ |
| Requisitos não funcionais (ID, categoria, descrição) | 5 (RNF01–RNF11) | 7 | ✅ |
| Wireframes/protótipos: uma imagem por tela, com legenda e objetivo | 6 (9 telas, Figuras 3–11) | 8, 9, 10 | ✅ |
| Diagrama ER (entidades, atributos, PK/FK, cardinalidades) | 7 (Figura 12) | 11 | ✅ |
| Dicionário de dados resumido | 7 (Tabela 7) | — | ✅ |
| Arquitetura: front-end ↔ API ↔ banco | 8 (Figura 13 e rotas) | 12 | ✅ |
| Divisão da equipe (4 papéis) | 9 | 13 | [PREENCHER] nome de cada papel |
| Cronograma: sprints, atividades, responsáveis e marcos das Entregas 1, 2 e 3 | 10 (com as datas da disciplina) | 15 | ✅ Entregas em 29/09, 03/11 e 26/11/2026 |
| Funcionalidades básicas do desenvolvimento inicial | 11 | 14 | ✅ |
| Notas do apresentador (quem fala o quê) | — | 1–16 | ✅ (o nome de quem fala está como [PREENCHER]) |

## Pendências [PREENCHER]

1. **Instituição, curso/disciplina e turma/semestre.** Documento: capa e seção 1. Slide 1.
2. **Professor(a).** Documento: capa e seção 1. Slide 1.
3. **Nome e matrícula dos integrantes.** Documento: capa e seção 1. Slides 1 e 16. O repositório tem commits das contas costamaiavitor e caiobholanda; confirme se as duas são da equipe e quem mais participa.
4. **Quem ocupa cada papel** (Gerente, Front-end, Back-end, UX/UI). Documento: seção 9. Slide 13 e a primeira linha das notas de todos os slides.
5. **Como a distribuidora recebe pedidos hoje** (telefone, WhatsApp, balcão) **e volume aproximado por semana.** Documento: seção 2.1.
6. **Responsável na distribuidora e se ela participa da validação.** Documento: seção 1.
7. **Dia e horário da reunião de acompanhamento.** Documento: seção 10.

## Decisões tomadas no plano (confirmar com a equipe)

- Banco **MySQL 8 com Sequelize**, API **Node.js + Express**, **React (Vite) + Bootstrap 5**, login com **bcrypt + JWT**.
- Front-end na **Vercel**; o provedor da API e do banco fica para a Sprint 5.
- Divisão MVP × final: 10 requisitos na Entrega 2 (CRUD e banco); login com token, busca, filtro, atacado e Pix na Entrega 3, como pede o enunciado da Etapa 3.
- As telas da seção 6 são capturas do protótipo já publicado, com uma conta de teste e, na tela do Pix, uma chave de exemplo.
