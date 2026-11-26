module.exports = {
  PORT: Number(process.env.PORT) || 3001,
  EVENT_MANAGER_URL: process.env.EVENT_MANAGER_URL || 'http://localhost:3000',
  DB_PATH: process.env.DB_PATH || './db/bookvault.sqlite',
  EVENT_SOURCE: process.env.EVENT_SOURCE || 'bookvault',
};
