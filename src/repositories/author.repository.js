const { AppError } = require('../middlewares/errorHandler');

module.exports = {
  // TODO: Implement author listing with parameterized SQL.
  findAll() {
    throw new AppError(501, 'Author listing is not implemented');
  },
  // TODO: Implement author lookup by its primary key.
  findById(_id) {
    throw new AppError(501, 'Author lookup is not implemented');
  },
  // TODO: Implement author insertion.
  create(_data) {
    throw new AppError(501, 'Author creation is not implemented');
  },
  // TODO: Implement author update.
  update(_id, _data) {
    throw new AppError(501, 'Author update is not implemented');
  },
  // TODO: Implement author deletion.
  remove(_id) {
    throw new AppError(501, 'Author deletion is not implemented');
  },
};
