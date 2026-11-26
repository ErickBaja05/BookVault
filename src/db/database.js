const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { DB_PATH } = require('../config/env');

let connection;

function initializeDatabase() {
  if (connection) {
    return connection;
  }

  if (DB_PATH !== ':memory:' && !DB_PATH.startsWith('file:')) {
    fs.mkdirSync(path.dirname(path.resolve(DB_PATH)), { recursive: true });
  }

  connection = new Database(DB_PATH);
  connection.pragma('foreign_keys = ON');
  connection.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

  return connection;
}

function getDatabase() {
  if (!connection) {
    throw new Error('Database has not been initialized');
  }

  return connection;
}

function closeDatabase() {
  if (connection) {
    connection.close();
    connection = undefined;
  }
}

module.exports = { closeDatabase, getDatabase, initializeDatabase };
