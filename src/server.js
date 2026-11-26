require('dotenv').config();

const app = require('./app');
const { PORT } = require('./config/env');
const { initializeDatabase } = require('./db/database');

function startServer() {
  initializeDatabase();

  return app.listen(PORT, () => {
    console.log(`BookVault API listening on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
