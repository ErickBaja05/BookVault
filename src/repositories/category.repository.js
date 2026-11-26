const { AppError } = require('../middlewares/errorHandler');

module.exports = {
  // TODO: Implement category listing with parameterized SQL.
  findAll() {
    throw new AppError(501, 'Category listing is not implemented');
  },
  // TODO: Implement category lookup by its primary key.
  findById(_id) {
    throw new AppError(501, 'Category lookup is not implemented');
  },
  // TODO: Implement category insertion.
  create(_data) {
    throw new AppError(501, 'Category creation is not implemented');
  },
  // TODO: Implement category update.
  update(_id, _data) {
    throw new AppError(501, 'Category update is not implemented');
  },
  // TODO: Implement category deletion.
  remove(_id) {
    throw new AppError(501, 'Category deletion is not implemented');
  },
};
