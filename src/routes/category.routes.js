const express = require('express');
const controller = require('../controllers/category.controller');

const router = express.Router();

router.route('/').get(controller.list).post(controller.create);
router
  .route('/:id')
  .get(controller.getById)
  .put(controller.update)
  .delete(controller.remove);

module.exports = router;
