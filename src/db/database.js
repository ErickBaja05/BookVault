const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { DB_PATH } = require('../config/env');

let connection;

function isFileBackedDatabase(dbPath) {
  return dbPath !== ':memory:' && !dbPath.startsWith('file:');
}

function initializeDatabase() {
  if (connection) {
    return connection;
  }

  if (isFileBackedDatabase(DB_PATH)) {
    fs.mkdirSync(path.dirname(path.resolve(DB_PATH)), { recursive: true });
  }

  connection = new Database(DB_PATH);
  connection.pragma('foreign_keys = ON');
  connection.pragma('busy_timeout = 5000');

  if (isFileBackedDatabase(DB_PATH)) {
    connection.pragma('journal_mode = WAL');
  }

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  connection.exec(schemaSql);

  return connection;
}

function getDatabase() {
  if (!connection) {
    throw new Error('Database has not been initialized');
  }

  return connection;
}

function runInTransaction(work) {
  const db = getDatabase();
  const transaction = db.transaction(work);
  return transaction();
}

function closeDatabase() {
  if (connection) {
    connection.close();
    connection = undefined;
  }
}

module.exports = {
  closeDatabase,
  getDatabase,
  initializeDatabase,
  runInTransaction,
};
