const express = require('express');
const controller = require('../controllers/loan.controller');

const router = express.Router();

router.route('/').get(controller.list).post(controller.create);
router.put('/:id/return', controller.returnLoan);
router
  .route('/:id')
  .get(controller.getById)
  .put(controller.update)
  .delete(controller.remove);

module.exports = router;
