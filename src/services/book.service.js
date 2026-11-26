const repository = require('../repositories/book.repository');

module.exports = {
  // TODO: Add book-specific business rules before delegating to the repository.
  findAll() {
    return repository.findAll();
  },
  // TODO: Define book lookup and not-found behavior.
  findById(id) {
    return repository.findById(id);
  },
  // TODO: Validate and create a book.
  create(data) {
    return repository.create(data);
  },
  // TODO: Validate and update a book.
  update(id, data) {
    return repository.update(id, data);
  },
  // TODO: Apply book deletion rules.
  remove(id) {
    return repository.remove(id);
  },
};
