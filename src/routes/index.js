const express = require('express');
const statsController = require('../controllers/stats.controller');
const authorRoutes = require('./author.routes');
const bookRoutes = require('./book.routes');
const categoryRoutes = require('./category.routes');
const clientRoutes = require('./client.routes');
const loanRoutes = require('./loan.routes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bookvault' });
});
router.get('/stats', statsController.getStats);
router.use('/categories', categoryRoutes);
router.use('/authors', authorRoutes);
router.use('/books', bookRoutes);
router.use('/clients', clientRoutes);
router.use('/loans', loanRoutes);

module.exports = router;
