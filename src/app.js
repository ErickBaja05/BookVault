const path = require('node:path');
const cors = require('cors');
const express = require('express');
const { AppError, errorHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', routes);
app.use((_req, _res, next) => {
  next(new AppError(404, 'Not Found'));
});
app.use(errorHandler);

module.exports = app;
