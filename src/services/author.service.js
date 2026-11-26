const repository = require('../repositories/author.repository');

module.exports = {
  // TODO: Add author-specific business rules before delegating to the repository.
  findAll() {
    return repository.findAll();
  },
  // TODO: Define author lookup and not-found behavior.
  findById(id) {
    return repository.findById(id);
  },
  // TODO: Validate and create an author.
  create(data) {
    return repository.create(data);
  },
  // TODO: Validate and update an author.
  update(id, data) {
    return repository.update(id, data);
  },
  // TODO: Apply author deletion rules.
  remove(id) {
    return repository.remove(id);
  },
};
