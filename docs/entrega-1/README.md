# Entrega 1: Plano de Trabalho

Materiais da Entrega 1 do Trabalho Final.

| Arquivo | O que é |
|---|---|
| `Entrega1_Plano_de_Trabalho_ZeroGrau.docx` | Documento com as 11 seções do enunciado (PDF ao lado, para conferir) |
| `Entrega1_Apresentacao_ZeroGrau.pptx` | Apresentação de 16 slides, com notas do apresentador (PDF ao lado) |
| `Checklist_e_Pendencias.md` | Checklist de conformidade e a lista do que falta preencher (`[PREENCHER]`) |
| `imagens/` | Diagramas (casos de uso, ER, arquitetura) e capturas das telas do protótipo |
| `fonte/` | Geradores de tudo acima |

## Regerar

O texto do documento e dos slides mora num lugar só, `fonte/conteudo.cjs`.
Ao preencher os `[PREENCHER]` ali, os dois arquivos saem iguais:

```bash
cd docs/entrega-1/fonte
npm install --no-save docx pptxgenjs react-icons react react-dom sharp
node docx.cjs    # gera ../Entrega1_Plano_de_Trabalho_ZeroGrau.docx
node pptx.cjs    # gera ../Entrega1_Apresentacao_ZeroGrau.pptx
```

Os PDFs não são regerados por esses comandos. Para atualizá-los, abra os
arquivos no Word ou no PowerPoint e exporte como PDF.

Diagramas e capturas, que só precisam ser refeitos se o desenho mudar:

- `diagramas/*.html` são desenhados no navegador. O `render.mjs` os fotografa
  e grava em `../imagens/`. O `er.html` e o `arq.html` precisam de um servidor
  local servindo `fonte/diagramas/` na porta 8098.
- `telas.mjs` fotografa o site com o site servido na porta 8099. Ele usa as
  fontes em `/tmp/fontes`, o mesmo espelho do `FONTES_DIR` dos testes.
