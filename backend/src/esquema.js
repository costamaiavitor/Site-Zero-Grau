// Prepara o banco ao subir, sem o sync({alter:true}) de antes, que recriava os
// índices únicos a cada reinício (email_2, email_3…) até o MySQL recusar.
//   1. cria as tabelas que faltam;
//   2. acrescenta as colunas novas dos models (ex.: pedidos.agendado_para);
//   3. acerta as chaves estrangeiras (o que acontece ao apagar);
//   4. apaga os índices repetidos que o alter deixou para trás.
// Pode rodar quantas vezes for: só muda o que estiver diferente.
const { sequelize, ...models } = require("./models/relacionamentos");

const qi = sequelize.getQueryInterface();

function nomeDaTabela(model) {
  const nome = model.getTableName();
  return typeof nome === "string" ? nome : nome.tableName;
}

async function acrescentarColunas(model, avisar) {
  const tabela = nomeDaTabela(model);
  const existentes = await qi.describeTable(tabela);
  for (const atributo of Object.values(model.rawAttributes)) {
    if (existentes[atributo.field]) continue;
    const { references, onDelete, onUpdate, ...definicao } = atributo;
    await qi.addColumn(tabela, atributo.field, definicao);
    avisar(`coluna ${tabela}.${atributo.field} criada`);
  }
}

async function chavesDaColuna(tabela, coluna) {
  const [linhas] = await sequelize.query(
    `SELECT k.CONSTRAINT_NAME AS nome, r.DELETE_RULE AS aoApagar, r.UPDATE_RULE AS aoMudar, k.REFERENCED_TABLE_NAME AS destino
       FROM information_schema.KEY_COLUMN_USAGE k
       JOIN information_schema.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
      WHERE k.TABLE_SCHEMA = DATABASE() AND k.TABLE_NAME = ? AND k.COLUMN_NAME = ?
        AND k.REFERENCED_TABLE_NAME IS NOT NULL`,
    { replacements: [tabela, coluna] }
  );
  return linhas;
}

async function acertarChaves(model, avisar) {
  const tabela = nomeDaTabela(model);
  for (const atributo of Object.values(model.rawAttributes)) {
    if (!atributo.references) continue;
    const destino = typeof atributo.references.model === "string" ? atributo.references.model : nomeDaTabela(atributo.references.model);
    const aoApagar = String(atributo.onDelete || "RESTRICT").toUpperCase();
    const aoMudar = String(atributo.onUpdate || "CASCADE").toUpperCase();
    const chaves = await chavesDaColuna(tabela, atributo.field);
    const certa = chaves.find(chave => chave.destino === destino && chave.aoApagar === aoApagar && chave.aoMudar === aoMudar);
    if (certa) continue;
    const chaveDestino = atributo.references.key || "id";
    try {
      // Linhas que apontam para algo que não existe mais impedem criar a chave.
      // Com CASCADE elas já teriam sumido; com SET NULL, só desligam.
      const orfas = `FROM \`${tabela}\` WHERE \`${atributo.field}\` IS NOT NULL AND \`${atributo.field}\` NOT IN (SELECT \`${chaveDestino}\` FROM \`${destino}\`)`;
      const [[{ total }]] = await sequelize.query(`SELECT COUNT(*) AS total ${orfas}`);
      if (Number(total)) {
        if (aoApagar === "CASCADE") {
          await sequelize.query(`DELETE ${orfas}`);
          avisar(`${total} linhas soltas de ${tabela} apagadas`);
        } else if (aoApagar === "SET NULL") {
          await sequelize.query(`UPDATE \`${tabela}\` SET \`${atributo.field}\` = NULL WHERE \`${atributo.field}\` NOT IN (SELECT \`${chaveDestino}\` FROM \`${destino}\`)`);
          avisar(`${total} linhas de ${tabela} desligadas de ${destino}`);
        } else {
          avisar(`${tabela}.${atributo.field} tem ${total} linhas apontando para ${destino} que não existe; chave mantida como está`);
          continue;
        }
      }
      for (const chave of chaves) {
        await sequelize.query(`ALTER TABLE \`${tabela}\` DROP FOREIGN KEY \`${chave.nome}\``);
      }
      await qi.addConstraint(tabela, {
        type: "foreign key",
        fields: [atributo.field],
        name: `${tabela}_${atributo.field}_fk`,
        references: { table: destino, field: chaveDestino },
        onDelete: aoApagar,
        onUpdate: aoMudar
      });
      avisar(`chave ${tabela}.${atributo.field} → ${destino} agora ${aoApagar}`);
    } catch (erro) {
      avisar(`não deu para acertar a chave ${tabela}.${atributo.field}: ${erro.message}`);
    }
  }
}

async function apagarIndicesRepetidos(model, avisar) {
  const tabela = nomeDaTabela(model);
  const [linhas] = await sequelize.query(`SHOW INDEX FROM \`${tabela}\``);
  const indices = new Map();
  for (const linha of linhas) {
    const indice = indices.get(linha.Key_name) || { nome: linha.Key_name, unico: Number(linha.Non_unique) === 0, colunas: [] };
    indice.colunas[Number(linha.Seq_in_index) - 1] = linha.Column_name;
    indices.set(linha.Key_name, indice);
  }
  const vistos = new Map();
  const ordenados = [...indices.values()].sort((a, b) => a.nome.length - b.nome.length || a.nome.localeCompare(b.nome));
  for (const indice of ordenados) {
    const chave = `${indice.unico}|${indice.colunas.join(",")}`;
    const repetido = vistos.has(chave) && /_\d+$/.test(indice.nome);
    if (!repetido) {
      if (!vistos.has(chave)) vistos.set(chave, indice.nome);
      continue;
    }
    await sequelize.query(`ALTER TABLE \`${tabela}\` DROP INDEX \`${indice.nome}\``);
    avisar(`índice repetido ${tabela}.${indice.nome} apagado`);
  }
}

async function prepararBanco({ avisar = mensagem => console.log(`[banco] ${mensagem}`) } = {}) {
  await sequelize.authenticate();
  await sequelize.sync();
  const lista = Object.values(models);
  for (const model of lista) await acrescentarColunas(model, avisar);
  for (const model of lista) await apagarIndicesRepetidos(model, avisar);
  for (const model of lista) await acertarChaves(model, avisar);
}

module.exports = { prepararBanco };
