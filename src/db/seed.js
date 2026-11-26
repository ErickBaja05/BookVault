require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { closeDatabase, initializeDatabase, runInTransaction } = require('./database');

function main() {
  const db = initializeDatabase();
  const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

  runInTransaction(() => {
    db.exec(seedSql);
  });

  const tables = ['categories', 'authors', 'books', 'author_books', 'clients', 'loans'];
  console.log('Datos iniciales aplicados en SQLite:');
  for (const table of tables) {
    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get();
    console.log(`  - ${table}: ${total} registros`);
  }

  closeDatabase();
}

main();
