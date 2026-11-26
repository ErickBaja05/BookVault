const { AppError } = require('../middlewares/errorHandler');

module.exports = {
  // TODO: Implement loan listing with parameterized SQL.
  findAll() {
    throw new AppError(501, 'Loan listing is not implemented');
  },
  // TODO: Implement loan lookup by its primary key.
  findById(_id) {
    throw new AppError(501, 'Loan lookup is not implemented');
  },
  // TODO: Implement loan insertion.
  create(_data) {
    throw new AppError(501, 'Loan creation is not implemented');
  },
  // TODO: Implement loan update.
  update(_id, _data) {
    throw new AppError(501, 'Loan update is not implemented');
  },
  // TODO: Implement loan deletion.
  remove(_id) {
    throw new AppError(501, 'Loan deletion is not implemented');
  },
};
