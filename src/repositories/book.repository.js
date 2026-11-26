const { AppError } = require('../middlewares/errorHandler');

module.exports = {
  // TODO: Implement book listing with parameterized SQL.
  findAll() {
    throw new AppError(501, 'Book listing is not implemented');
  },
  // TODO: Implement book lookup by its primary key.
  findById(_id) {
    throw new AppError(501, 'Book lookup is not implemented');
  },
  // TODO: Implement book insertion.
  create(_data) {
    throw new AppError(501, 'Book creation is not implemented');
  },
  // TODO: Implement book update.
  update(_id, _data) {
    throw new AppError(501, 'Book update is not implemented');
  },
  // TODO: Implement book deletion.
  remove(_id) {
    throw new AppError(501, 'Book deletion is not implemented');
  },
};
