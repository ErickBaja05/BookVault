const { AppError } = require('../middlewares/errorHandler');

module.exports = {
  // TODO: Implement client listing with parameterized SQL.
  findAll() {
    throw new AppError(501, 'Client listing is not implemented');
  },
  // TODO: Implement client lookup by its primary key.
  findById(_id) {
    throw new AppError(501, 'Client lookup is not implemented');
  },
  // TODO: Implement client insertion.
  create(_data) {
    throw new AppError(501, 'Client creation is not implemented');
  },
  // TODO: Implement client update.
  update(_id, _data) {
    throw new AppError(501, 'Client update is not implemented');
  },
  // TODO: Implement client deletion.
  remove(_id) {
    throw new AppError(501, 'Client deletion is not implemented');
  },
};
