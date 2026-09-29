# Entrega 1: checklist de conformidade e pendências

## Checklist de conformidade

| Item exigido | Seção do documento | Slide(s) | Status |
|---|---|---|---|
| Identificação | 1 (e capa) | 1, 16 | [PREENCHER] instituição, disciplina, professor(a). Equipe e data preenchidas |
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
| Divisão da equipe | 9 | 13 | ✅ três frentes: Back-end (Vitor Custodio, João Vitor), Front-end (Caio, Vitor), Documentação (Christian) |
| Cronograma: sprints, atividades, responsáveis e marcos das Entregas 1, 2 e 3 | 10 (com as datas da disciplina) | 15 | ✅ Entregas em 29/09, 03/11 e 26/11/2026 |
| Funcionalidades básicas do desenvolvimento inicial | 11 | 14 | ✅ |
| Notas do apresentador (quem fala o quê) | — | 1–16 | ✅ com o nome de quem fala em cada slide |

## Pendências [PREENCHER]

1. **Instituição, curso/disciplina e turma/semestre.** Documento: capa e seção 1. Slide 1.
2. **Professor(a).** Documento: capa e seção 1. Slide 1.
3. **Como a distribuidora recebe pedidos hoje** (telefone, WhatsApp, balcão) **e volume aproximado por semana.** Documento: seção 2.1.
4. **Responsável na distribuidora e se ela participa da validação.** Documento: seção 1.
5. **Dia e horário da reunião de acompanhamento.** Documento: seção 10.

## Decisões tomadas no plano (confirmar com a equipe)

- A equipe foi dividida em três frentes em vez dos quatro papéis que o enunciado sugere. O trabalho de Designer UX/UI (wireframes e diagramas) ficou com Vitor, no Front-end, e o acompanhamento do cronograma com a Documentação (Christian).

- Banco **MySQL 8 com Sequelize**, API **Node.js + Express**, **React (Vite) + Bootstrap 5**, login com **bcrypt + JWT**.
- Front-end na **Vercel**; o provedor da API e do banco fica para a Sprint 5.
- Divisão MVP × final: 10 requisitos na Entrega 2 (CRUD e banco); login com token, busca, filtro, atacado e Pix na Entrega 3, como pede o enunciado da Etapa 3.
- As telas da seção 6 são capturas do protótipo já publicado, com uma conta de teste e, na tela do Pix, uma chave de exemplo.
