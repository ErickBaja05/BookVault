require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { DB_PATH } = require('../config/env');
const { closeDatabase, initializeDatabase } = require('./database');

function removeExistingSqliteFiles(dbPath) {
  if (dbPath === ':memory:' || dbPath.startsWith('file:')) {
    return;
  }

  const resolvedPath = path.resolve(dbPath);
  for (const suffix of ['', '-wal', '-shm']) {
    const filePath = `${resolvedPath}${suffix}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

function main() {
  const shouldReset = process.argv.includes('--reset');

  if (shouldReset) {
    removeExistingSqliteFiles(DB_PATH);
    console.log(`Base de datos reiniciada en ${DB_PATH}`);
  }

  const db = initializeDatabase();

  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()
    .map((row) => row.name);

  const indexes = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name",
    )
    .all()
    .map((row) => row.name);

  console.log(`SQLite listo en: ${path.resolve(DB_PATH)}`);
  console.log(`Foreign keys: ${db.pragma('foreign_keys', { simple: true })}`);
  console.log(`Journal mode: ${db.pragma('journal_mode', { simple: true })}`);
  console.log(`Tablas (${tables.length}): ${tables.join(', ')}`);
  console.log(`Índices (${indexes.length}): ${indexes.join(', ')}`);

  closeDatabase();
}

main();
