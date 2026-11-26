const repository = require('../repositories/category.repository');

module.exports = {
  // TODO: Add category-specific business rules before delegating to the repository.
  findAll() {
    return repository.findAll();
  },
  // TODO: Define category lookup and not-found behavior.
  findById(id) {
    return repository.findById(id);
  },
  // TODO: Validate and create a category.
  create(data) {
    return repository.create(data);
  },
  // TODO: Validate and update a category.
  update(id, data) {
    return repository.update(id, data);
  },
  // TODO: Apply category deletion rules.
  remove(id) {
    return repository.remove(id);
  },
};
